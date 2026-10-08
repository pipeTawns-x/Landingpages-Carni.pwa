"""Tests for the frame of the panel: panel/base.html, the Más page and the messages partial.

The frame is the redesigned dashboar.html (sidebar from 1024 px, tab bar below it, top bar and
<main>) turned into a Django template. These tests render it for real: the Más page through the
panel admin session, and the frame on its own for every route the contract names, with a request
whose `resolver_match` says which view is current.
"""

import re
from html.parser import HTMLParser
from types import SimpleNamespace

from django.contrib.auth.models import AnonymousUser
from django.contrib.messages import constants
from django.contrib.messages.storage.base import Message
from django.template.loader import render_to_string
from django.test import RequestFactory, SimpleTestCase, TestCase, override_settings
from django.urls import Resolver404, resolve, reverse

from panel.context_processors import store_origin
from panel.tests import sign_in_as_panel_admin

# Sections of the contract (docs/CONTRATO_PANEL_DJANGO.md, section 1) that have no route yet. The
# frame links them by their literal path. The day one of them resolves, a test below fails and the
# link has to become a url tag in panel/base.html and panel/mas.html.
PENDING_PATHS = {
    "/panel/pedidos/",
    "/panel/clientes/",
    "/panel/publicidad/",
    "/panel/ajustes/",
}


class AnchorParser(HTMLParser):
    """Collect the attributes of every <a> of a piece of HTML."""

    def __init__(self):
        super().__init__()
        self.anchors = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.anchors.append(dict(attrs))


def anchors(html):
    """Return the attributes of each <a> in `html`, in document order."""
    parser = AnchorParser()
    parser.feed(html)
    return parser.anchors


def sidebar_of(html):
    """Return the HTML of the <aside>, the sidebar of the wide layout."""
    return re.search(r"<aside.*?</aside>", html, flags=re.DOTALL).group(0)


def tab_bar_of(html):
    """Return the HTML of the tab bar, the <nav> that only shows below 1024 px."""
    return re.search(r"<nav [^>]*lg:hidden.*?</nav>", html, flags=re.DOTALL).group(0)


def current_links(fragment):
    """Map the href of every link that carries `aria-current` to the value it carries."""
    return {a["href"]: a["aria-current"] for a in anchors(fragment) if "aria-current" in a}


def render_frame(view_name, namespace, **context):
    """Render panel/base.html as the request of the view `view_name` would see it."""
    request = RequestFactory().get("/panel/")
    request.resolver_match = SimpleNamespace(view_name=view_name, namespace=namespace)
    request.user = AnonymousUser()
    return render_to_string("panel/base.html", context, request=request)


class MasPageTests(TestCase):
    """The Más page is the first page served on the frame, so it shows the whole frame."""

    def setUp(self):
        self.url = reverse("panel:mas")
        self.admin_id = sign_in_as_panel_admin(self.client)

    def test_it_is_served_at_the_path_of_the_contract(self):
        self.assertEqual(self.url, "/panel/mas/")

    def test_a_panel_admin_gets_the_page_on_the_frame(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "panel/mas.html")
        self.assertTemplateUsed(response, "panel/base.html")
        self.assertContains(response, '<html lang="es-MX">')
        self.assertContains(
            response, "<title>Más · Panel · Carnicería El Señor de La Misericordia</title>"
        )

    def test_the_page_has_one_h1_with_its_title(self):
        html = self.client.get(self.url).content.decode()

        headings = re.findall(r"<h1[^>]*>(.*?)</h1>", html, flags=re.DOTALL)
        self.assertEqual([heading.strip() for heading in headings], ["Más"])

    def test_it_links_the_panel_stylesheet_and_the_logo_of_the_store(self):
        response = self.client.get(self.url)

        self.assertContains(response, '<link rel="stylesheet" href="/static/panel/panel.css" />')
        # store.test is the STORE_ORIGIN of the test settings.
        self.assertContains(response, 'href="http://store.test/img/recursos_web/logo-user.png"')

    def test_the_page_has_no_script_no_inline_style_and_no_inline_handler(self):
        # The rules of the kit: a link or a form is all the interaction there is.
        html = self.client.get(self.url).content.decode()

        for forbidden in ("<script", "<style", " style=", " onclick=", " onchange=", "javascript:"):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, html)

    def test_the_sidebar_and_the_page_both_sign_out_with_a_post_and_the_csrf_token(self):
        html = self.client.get(self.url).content.decode()

        forms = re.findall(r"<form [^>]*>.*?</form>", html, flags=re.DOTALL)
        self.assertEqual(len(forms), 2)
        for form in forms:
            with self.subTest(form=form[:80]):
                self.assertIn('method="post"', form)
                self.assertIn('action="/panel/salir/"', form)
                self.assertIn('name="csrfmiddlewaretoken"', form)
                self.assertIn("Cerrar sesión", form)

    def test_the_admin_sees_the_email_the_handoff_stored(self):
        response = self.client.get(self.url)

        # The test token carries admin@example.test; it shows in the sidebar and on the page.
        self.assertContains(response, "admin@example.test", count=2)

    def test_the_page_lists_the_sections_that_do_not_fit_in_the_tab_bar(self):
        html = self.client.get(self.url).content.decode()

        page = html[html.index("<main") : html.index("</main>")]
        links = [a["href"] for a in anchors(page)]
        self.assertEqual(links, ["/panel/clientes/", "/panel/publicidad/", "/panel/ajustes/"])

    def test_the_mas_tab_is_the_current_page_and_no_sidebar_entry_is_current(self):
        html = self.client.get(self.url).content.decode()

        self.assertEqual(current_links(tab_bar_of(html)), {"/panel/mas/": "page"})
        self.assertEqual(current_links(sidebar_of(html)), {})

    def test_an_anonymous_visitor_is_sent_to_the_access_bridge(self):
        self.client.logout()

        response = self.client.get(self.url)

        self.assertRedirects(response, reverse("panel:acceso"), fetch_redirect_response=False)

    def test_a_post_is_refused(self):
        self.assertEqual(self.client.post(self.url).status_code, 405)


class NavigationStateTests(SimpleTestCase):
    """`aria-current` marks the entry of the section the page belongs to, in both navigations."""

    # (view_name, namespace) -> (current link of the sidebar, current link of the tab bar)
    CASES = {
        ("panel:inicio", "panel"): ({"/panel/": "page"}, {"/panel/": "page"}),
        ("orders:board", "orders"): ({"/panel/pedidos/": "page"}, {"/panel/pedidos/": "page"}),
        ("inventory:list", "inventory"): (
            {"/panel/productos/": "page"},
            {"/panel/productos/": "page"},
        ),
        ("inventory:detail", "inventory"): (
            {"/panel/productos/": "page"},
            {"/panel/productos/": "page"},
        ),
        ("inventory:create", "inventory"): (
            {"/panel/productos/": "page"},
            {"/panel/productos/": "page"},
        ),
        ("inventory:update", "inventory"): (
            {"/panel/productos/": "page"},
            {"/panel/productos/": "page"},
        ),
        ("inventory:delete", "inventory"): (
            {"/panel/productos/": "page"},
            {"/panel/productos/": "page"},
        ),
        ("customers:list", "customers"): (
            {"/panel/clientes/": "page"},
            {"/panel/clientes/": "page"},
        ),
        # Publicidad and Ajustes live inside Más on the phone: that tab is current "in a way".
        ("panel:ads", "panel"): ({"/panel/publicidad/": "page"}, {"/panel/mas/": "true"}),
        ("settings:index", "settings"): ({"/panel/ajustes/": "page"}, {"/panel/mas/": "true"}),
        ("panel:mas", "panel"): ({}, {"/panel/mas/": "page"}),
        # The bridge and the other routes of the panel app belong to no entry.
        ("panel:acceso", "panel"): ({}, {}),
    }

    def test_each_view_marks_its_own_entry_and_only_that_one(self):
        for (view_name, namespace), (sidebar, tabs) in self.CASES.items():
            with self.subTest(view=view_name):
                html = render_frame(view_name, namespace)

                self.assertEqual(current_links(sidebar_of(html)), sidebar)
                self.assertEqual(current_links(tab_bar_of(html)), tabs)

    def test_a_page_without_a_resolved_view_marks_nothing(self):
        html = render_to_string("panel/base.html", {"user": AnonymousUser()})

        self.assertEqual(current_links(sidebar_of(html)), {})
        self.assertEqual(current_links(tab_bar_of(html)), {})

    def test_the_sidebar_has_six_entries_and_the_tab_bar_five(self):
        html = render_frame("panel:inicio", "panel")

        self.assertEqual(
            [a["href"] for a in anchors(sidebar_of(html))],
            [
                "/panel/",
                "/panel/pedidos/",
                "/panel/productos/",
                "/panel/clientes/",
                "/panel/publicidad/",
                "/panel/ajustes/",
            ],
        )
        self.assertEqual(
            [a["href"] for a in anchors(tab_bar_of(html))],
            ["/panel/", "/panel/pedidos/", "/panel/productos/", "/panel/clientes/", "/panel/mas/"],
        )


class PendingSectionsTests(SimpleTestCase):
    """The frame only links to routes that exist, or to the ones the contract still owes."""

    def test_the_sections_still_without_a_route_do_not_resolve(self):
        for path in sorted(PENDING_PATHS):
            with self.subTest(path=path), self.assertRaises(Resolver404, msg=self.news(path)):
                resolve(path)

    def test_every_panel_link_of_the_frame_resolves_or_is_known_to_be_pending(self):
        html = render_frame("panel:inicio", "panel")
        hrefs = {a["href"] for a in anchors(html)}

        self.assertTrue(hrefs >= PENDING_PATHS)
        for href in sorted(hrefs - PENDING_PATHS):
            with self.subTest(href=href):
                self.assertTrue(href.startswith("/panel/"))
                resolve(href)

    @staticmethod
    def news(path):
        return (
            f"{path} resolves now: link it with its url tag in panel/base.html and "
            "panel/mas.html, and take it out of PENDING_PATHS."
        )


class MessagesPartialTests(SimpleTestCase):
    """The messages the previous request queued, drawn in the design of the panel."""

    def render(self, *messages):
        return render_to_string("panel/messages.html", {"messages": list(messages)})

    def test_nothing_is_drawn_without_messages(self):
        self.assertEqual(self.render().strip(), "")

    def test_each_level_gets_its_icon_colour(self):
        cases = {
            constants.SUCCESS: "text-success",
            constants.INFO: "text-success",
            constants.WARNING: "text-sand",
            constants.ERROR: "text-danger",
        }
        for level, colour in cases.items():
            with self.subTest(level=level):
                html = self.render(Message(level, "Hecho"))

                self.assertIn(f"mt-0.5 size-5 shrink-0 {colour}", html)
                self.assertIn("<span>Hecho</span>", html)

    def test_a_warning_and_an_error_share_the_triangle_and_a_success_has_the_check(self):
        check = "M5 12.5 9.5 17 19 7.5"
        triangle = "M12 9v4M12 16.5h.01"

        self.assertIn(check, self.render(Message(constants.SUCCESS, "a")))
        self.assertNotIn(triangle, self.render(Message(constants.SUCCESS, "a")))
        for level in (constants.WARNING, constants.ERROR):
            with self.subTest(level=level):
                html = self.render(Message(level, "a"))
                self.assertIn(triangle, html)
                self.assertNotIn(check, html)

    def test_several_messages_are_listed_in_order(self):
        first, second = Message(constants.SUCCESS, "Primero"), Message(constants.WARNING, "Luego")
        html = self.render(first, second)

        self.assertEqual(html.count("<li "), 2)
        self.assertLess(html.index("Primero"), html.index("Luego"))

    def test_the_text_of_a_message_is_escaped(self):
        html = self.render(Message(constants.ERROR, '<script>alert("x")</script>'))

        self.assertNotIn("<script>", html)
        self.assertIn("&lt;script&gt;", html)

    def test_the_frame_draws_them_inside_main(self):
        html = render_frame("panel:inicio", "panel", messages=[Message(constants.SUCCESS, "Listo")])

        main = html[html.index("<main") : html.index("</main>")]
        self.assertIn("Listo", main)


class StoreOriginProcessorTests(SimpleTestCase):
    def test_it_exposes_the_origin_of_the_store(self):
        request = RequestFactory().get("/panel/")

        self.assertEqual(store_origin(request), {"store_origin": "http://store.test"})

    @override_settings(STORE_ORIGIN="https://tienda.example")
    def test_it_follows_the_setting(self):
        request = RequestFactory().get("/panel/")

        self.assertEqual(store_origin(request), {"store_origin": "https://tienda.example"})
