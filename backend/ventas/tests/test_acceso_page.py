"""Tests of the sign-in / sign-up page as the real accessweb.html painted by Django.

The template is `ventas/acceso.html`.

The page keeps the design of accessweb.html (Don Carlos, one card, one slide between the two
forms) and is built mobile first. The sign-in logic is not part of this slice: Supabase Auth keeps
running from the browser through `static/tienda/acceso.js`, so the markup below has to keep the ids,
the `data-*` attributes and the field names that script reads. What these tests pin is that contract
plus the visual side: Don Carlos paints before the script loads, the fields autofill, motion is
opt-in, and the CSP that only admits 'self' holds (no inline style or script, no CDN).
"""

import json
import re
from html.parser import HTMLParser
from pathlib import Path

from django.conf import settings
from django.test import TestCase, override_settings
from django.urls import reverse

from ventas.negocio import NEGOCIO
from ventas.tests.support import make_store

ROOT = Path(settings.BASE_DIR).parent
BUILT = Path(settings.BASE_DIR) / "static" / "vite"
STYLES = ROOT / "css" / "pages" / "acceso-page.css"
TEMPLATE = "ventas/acceso.html"
FORMS = {"form-ingresar", "form-registro"}


class Tags(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

    def named(self, name):
        return [attrs for tag, attrs in self.tags if tag == name]


def parse(html):
    parser = Tags()
    parser.feed(html)
    return parser


def squeeze(html):
    return re.sub(r"\s+", " ", html)


class AccesoPageTests(TestCase):
    def page(self, **query):
        return self.client.get(reverse("ventas:acceso"), query)

    def html(self, **query):
        return self.page(**query).content.decode()

    # --- The template and the frame -----------------------------------------------------------

    def test_the_page_is_its_own_template_with_the_shared_header_and_footer(self):
        response = self.page()

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, TEMPLATE)
        self.assertTemplateNotUsed(response, "ventas/tienda/acceso.html")
        for partial in ("_cabecera", "_pie", "_buscar"):
            self.assertTemplateUsed(response, f"ventas/parciales/{partial}.html")
        html = response.content.decode()
        self.assertRegex(html, r'<header class="main-header" id="mainHeader">')
        self.assertIn("<title>Acceso", html)
        self.assertEqual(len(re.findall(r"<h1[ >]", html)), 1)
        self.assertRegex(html, r'<body class="[^"]*\bacceso-page\b[^"]*"[^>]*data-server-store')

    # --- The contract with static/tienda/acceso.js --------------------------------------------

    def test_the_markup_keeps_what_the_sign_in_script_reads(self):
        html = self.html()
        tags = parse(html)
        raiz = next(a for a in tags.named("div") if a.get("id") == "acceso")

        self.assertEqual(raiz.get("data-modo"), "ingresar")
        self.assertIn("hidden", raiz, "the forms stay hidden until the script has its handlers")
        for name in (
            "data-supabase-url",
            "data-supabase-key",
            "data-supabase-js",
            "data-sesion-url",
            "data-panel-url",
            "data-tienda-url",
        ):
            self.assertTrue(raiz.get(name), name)
        ids = {a.get("id") for _, a in tags.tags if a.get("id")}
        self.assertTrue({"acceso-aviso", "form-ingresar", "form-registro"} <= ids)

        # Both ways of switching live INSIDE #acceso: the script only looks for them there.
        inside = html[html.index('id="acceso"') :]
        self.assertEqual(len(re.findall(r'data-accion="ver-registro"', inside)), 2)
        self.assertEqual(len(re.findall(r'data-accion="ver-ingresar"', inside)), 2)
        self.assertEqual(len(re.findall(r"data-error", inside)), 2)

        fields = {
            "form-ingresar": {"email", "password"},
            "form-registro": {
                "full_name",
                "email",
                "phone",
                "password",
                "password_confirm",
                "terms",
                "newsletter",
            },
        }
        for form_id, expected in fields.items():
            block = re.search(rf'<form id="{form_id}".*?</form>', html, flags=re.DOTALL).group(0)
            self.assertEqual(
                set(re.findall(r'<input[^>]*\bname="([^"]+)"', block)), expected, form_id
            )
            self.assertIn('type="submit"', block)

    def test_the_forms_never_send_a_password_by_themselves(self):
        # The search dialog of the shared header has its own form (a GET): not these two.
        forms = [f for f in parse(self.html()).named("form") if f.get("id") in FORMS]
        self.assertEqual(len(forms), 2)
        for form in forms:
            self.assertEqual(form.get("method"), "post")
            self.assertIn("novalidate", form)
            self.assertEqual(form.get("action"), reverse("ventas:acceso"))

    # --- Don Carlos and the first paint -------------------------------------------------------

    def test_don_carlos_paints_before_the_script_loads(self):
        html = self.html()
        tags = parse(html)
        images = {
            a["src"]: a for a in tags.named("img") if a.get("src", "").startswith("/img/mascota/")
        }

        login = images["/img/mascota/don-carlos-login.webp"]
        register = images["/img/mascota/don-carlos-register.webp"]
        self.assertEqual((login["width"], login["height"]), ("640", "768"))
        self.assertEqual((register["width"], register["height"]), ("640", "640"))
        self.assertTrue(login.get("alt") and register.get("alt"))
        # The pose on screen is the largest element of the first view: eager, with priority.
        self.assertNotEqual(login.get("loading"), "lazy")
        self.assertEqual(login.get("fetchpriority"), "high")
        self.assertEqual(register.get("loading"), "lazy")
        # Outside the hidden root, so it does not wait for Supabase to load.
        self.assertLess(html.index("don-carlos-login.webp"), html.index('id="acceso"'))

    def test_a_card_is_reserved_before_the_forms_show_so_nothing_jumps(self):
        html = self.html()

        self.assertRegex(html, r'class="acceso__ranura"')
        self.assertLess(html.index("acceso__ranura"), html.index('id="acceso"'))

    # --- Forms: autofill, labels, the show-password control -----------------------------------

    def test_every_field_has_its_label_and_the_right_autocomplete(self):
        html = self.html()
        tags = parse(html)
        labels = set(re.findall(r'<label[^>]*\bfor="([^"]+)"', html))
        by_name = {}
        for attrs in tags.named("input"):
            if attrs.get("type") in {"checkbox"}:
                continue
            self.assertIn(attrs.get("id"), labels, f"no label for {attrs.get('name')}")
            by_name.setdefault(attrs["name"], []).append(attrs)

        for attrs in by_name["email"]:
            self.assertEqual(attrs.get("autocomplete"), "username")
            self.assertEqual(attrs.get("type"), "email")
            self.assertEqual(attrs.get("spellcheck"), "false")
        sign_in_password, sign_up_password = by_name["password"]
        self.assertEqual(sign_in_password.get("autocomplete"), "current-password")
        self.assertEqual(sign_up_password.get("autocomplete"), "new-password")
        self.assertEqual(by_name["password_confirm"][0].get("autocomplete"), "new-password")
        self.assertEqual(by_name["full_name"][0].get("autocomplete"), "name")
        phone = by_name["phone"][0]
        self.assertEqual((phone.get("type"), phone.get("inputmode")), ("tel", "numeric"))
        self.assertEqual(phone.get("autocomplete"), "tel-national")

    def test_each_password_field_has_a_show_password_button(self):
        html = self.html()
        buttons = [a for a in parse(html).named("button") if "data-ver-clave" in a]

        self.assertEqual(len(buttons), 3)
        for button in buttons:
            self.assertEqual(button.get("type"), "button")
            self.assertTrue(button.get("aria-label"))
            self.assertTrue(button.get("aria-controls"))
            self.assertNotIn(
                "aria-pressed", button, "the label changes, so it is not a toggle button"
            )

    def test_there_is_no_login_that_goes_nowhere(self):
        html = self.html()

        self.assertNotIn('href="#"', html)
        for network in ("google", "facebook", "twitter"):
            self.assertNotIn(f"{network}Login", html)

    # --- Notices and the missing key ----------------------------------------------------------

    def test_the_notices_follow_the_address(self):
        self.assertIn("Cerraste tu sesión.", self.html(salir="1"))
        html = self.html(admin="true")
        self.assertIn("Acceso solo para personal autorizado.", html)
        self.assertIn('data-admin="true"', html)

    def test_without_the_publishable_key_the_page_says_it_is_not_configured(self):
        with override_settings(SUPABASE_PUBLISHABLE_KEY=""):
            response = self.page()

        self.assertEqual(response.status_code, 503)
        self.assertContains(response, "El acceso no está disponible", status_code=503)
        self.assertNotContains(response, 'id="acceso"', status_code=503)

    def test_without_javascript_it_says_so(self):
        match = re.search(r"<noscript>(.*?)</noscript>", self.html(), flags=re.DOTALL)

        self.assertIsNotNone(match)
        self.assertIn("JavaScript", match.group(1))

    def test_every_error_line_has_an_id_and_the_fields_of_its_form_point_to_it(self):
        html = self.html()

        for form_id, error_id in (
            ("form-ingresar", "ingresar-error"),
            ("form-registro", "registro-error"),
        ):
            block = re.search(rf'<form id="{form_id}".*?</form>', html, flags=re.DOTALL).group(0)
            lines = [a for a in parse(block).named("p") if "data-error" in a]
            self.assertEqual([a.get("id") for a in lines], [error_id], form_id)
            self.assertEqual(lines[0].get("role"), "alert")
            fields = parse(block).named("input")
            self.assertTrue(fields)
            for attrs in fields:
                self.assertEqual(
                    attrs.get("aria-describedby"), error_id, f"{form_id}: {attrs.get('name')}"
                )

    def test_a_revealed_password_is_not_spellchecked_nor_capitalized(self):
        fields = [
            a
            for a in parse(self.html()).named("input")
            if a.get("name") in {"password", "password_confirm"}
        ]

        self.assertEqual(len(fields), 3)
        for attrs in fields:
            self.assertEqual(attrs.get("spellcheck"), "false", attrs["id"])
            self.assertEqual(attrs.get("autocapitalize"), "none", attrs["id"])
            self.assertEqual(attrs.get("autocorrect"), "off", attrs["id"])

    def test_the_preload_of_the_pose_only_ships_when_the_pose_paints(self):
        preload = r'<link rel="preload"[^>]*don-carlos-login'

        self.assertEqual(len(re.findall(preload, self.html())), 1)
        with override_settings(SUPABASE_PUBLISHABLE_KEY=""):
            self.assertEqual(re.findall(preload, self.page().content.decode()), [])

    # --- CSP 'self': scripts, styles, no CDN --------------------------------------------------

    def test_nothing_runs_or_styles_inline_and_nothing_comes_from_a_cdn(self):
        html = self.html()
        tags = parse(html)

        self.assertNotIn("<style", html)
        for _, attrs in tags.tags:
            self.assertNotIn("style", attrs)
            self.assertEqual([n for n in attrs if n.startswith("on")], [])
        for script in tags.named("script"):
            self.assertTrue(script.get("src"), "no inline script")
            self.assertRegex(script["src"], r"^/static/(vite|tienda)/")
        for host in ("googleapis", "gstatic", "jsdelivr", "fontawesome", "unpkg", "cdnjs"):
            self.assertNotIn(host, html)
        modules = [s["src"] for s in tags.named("script") if s.get("type") == "module"]
        self.assertTrue(any("/static/vite/assets/auth" in src for src in modules), modules)
        self.assertTrue(
            any(re.search(r"/static/tienda/acceso(\.[0-9a-f]+)?\.js$", s) for s in modules)
        )

    def test_the_built_css_writes_bootstrap_before_the_page(self):
        manifest = json.loads((BUILT / ".vite" / "manifest.json").read_text())
        entry = manifest["src/entry/auth.tsx"]
        built = "\n".join((BUILT / name).read_text() for name in entry.get("css", []))

        self.assertIn(".acceso__ranura", built, "run npm run build:django")
        self.assertLess(built.rindex(".bi-"), built.index(".acceso__ranura"))


class AccesoStylesTests(TestCase):
    """Motion is opt-in: the page is complete and still without it."""

    def css(self):
        return STYLES.read_text(encoding="utf-8")

    def test_every_keyframes_and_slide_lives_inside_a_motion_preference_block(self):
        css = self.css()

        self.assertIn("@media (prefers-reduced-motion: no-preference)", css)
        self.assertIn("@media (prefers-reduced-motion: reduce)", css)
        outside = re.sub(
            r"@media \(prefers-reduced-motion: (no-preference|reduce)\)\s*"
            r"\{(?:[^{}]|\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*\}",
            "",
            css,
        )
        self.assertNotIn("@keyframes", outside)
        self.assertNotRegex(outside, r"animation\s*:")

    def test_only_compositor_properties_move(self):
        css = self.css()

        for frame in re.findall(r"@keyframes[^{]+\{((?:[^{}]|\{[^{}]*\})*)\}", css):
            self.assertNotRegex(frame, r"\b(width|height|top|left|right|bottom|margin|padding)\s*:")
        self.assertNotIn("transition: all", css)
        self.assertNotIn("will-change", css)

    def test_the_two_column_field_grid_waits_for_75rem(self):
        css = self.css()
        wide = (
            r"@media \(min-width: 75rem\)\s*\{\s*\.acceso__dos\s*"
            r"\{\s*grid-template-columns:\s*1fr 1fr;\s*\}\s*\}"
        )

        self.assertRegex(css, wide)
        self.assertNotRegex(re.sub(wide, "", css), r"\.acceso__dos\s*\{[^}]*grid-template-columns")

    def test_on_the_wide_card_the_pose_never_outgrows_its_half(self):
        self.assertRegex(
            self.css(),
            r"\.acceso__pose,\s*\.acceso__pose--registro\s*\{[^}]*inline-size:\s*100%;"
            r"[^}]*object-fit:\s*contain;[^}]*object-position:\s*50% 100%",
        )

    def test_it_is_written_mobile_first(self):
        css = self.css()

        self.assertNotRegex(css, r"@media \((max-width|max-height)")
        self.assertRegex(css, r"@media \(min-width: 64rem\)")

    def test_the_keyboard_ring_on_the_dark_panel_is_cream(self):
        css = self.css()
        red = re.search(r"([^{}]*)\{[^}]*outline:\s*3px solid var\(--acceso-rojo\)[^}]*\}", css)

        self.assertIsNotNone(red)
        self.assertNotIn("acceso__panel", red.group(1), "a red ring on dark red is 1.7:1")
        self.assertRegex(
            css,
            r"\.acceso__panel button:focus-visible\s*\{[^}]*"
            r"outline:\s*3px solid var\(--acceso-crema\)",
        )

    def test_the_old_pose_leaves_before_the_new_one_enters(self):
        css = self.css()

        self.assertRegex(
            css,
            r"\.acceso__pose\s*\{\s*transition:\s*opacity 130ms [^;]*visibility 0s linear 130ms;",
        )
        self.assertRegex(css, r"acceso__pose--registro\s*\{\s*transition-delay:\s*130ms;")

    def test_the_reduced_motion_fade_wins_over_the_sheet_wide_rule(self):
        css = self.css()
        reduce = css[css.rindex("@media (prefers-reduced-motion: reduce)") :]

        self.assertRegex(reduce, r"#acceso > form\s*\{[^}]*animation-duration:\s*180ms !important")

    def test_nothing_animates_over_the_lcp_image_and_the_entrance_keeps_the_ceiling(self):
        css = self.css()

        self.assertNotIn("acceso-tarjeta", css)
        self.assertRegex(
            css, r"animation:\s*acceso-mascota 480ms var\(--ease-out-strong\) 80ms both"
        )
        for ms in re.findall(r"animation:\s*[\w-]+ (\d+)ms", css):
            self.assertLessEqual(int(ms), 480)
        self.assertIn("--acceso-sans: var(--font-sans);", css)


def header_of(html):
    start = html.index("<header")
    return html[start : html.index("</header>", start)]


def drawer_of(html):
    start = html.index('id="mobileDrawer"')
    return html[start : html.index("</aside>", start)]


class AccesoHeaderTests(TestCase):
    """The header, menu, search and footer of /acceso/ are the shared ones.

    test_header.py (the tienda's popover header) no longer covers this page, so each of its checks
    has its equivalent here, on the Bootstrap header of `parciales/_cabecera.html` that the landing
    and the products page already use. The tienda's `contactar` and `favoritos` panels and its
    `bolsa` drawer are not part of that shared header: the contact data lives in the footer and the
    cart is a link to /carrito/ on this page (the drawer is only on the products page).
    """

    @classmethod
    def setUpTestData(cls):
        cls.store = make_store()

    def page(self, url="/acceso/"):
        return self.client.get(url).content.decode()

    def test_the_header_has_the_same_controls_in_the_same_order_as_the_products_page(self):
        html = self.page()
        header = header_of(html)

        order = [
            header.index(marker)
            for marker in ('id="menuToggle"', 'id="searchBtn"', 'id="cartBtn"', 'href="/acceso/"')
        ]
        self.assertEqual(order, sorted(order))
        self.assertIn('href="/carrito/"', header)

        def normal(text):
            return squeeze(text).replace(' aria-controls="bolsa"', "")

        self.assertEqual(normal(header), normal(header_of(self.page("/productos/"))))

    def test_the_menu_and_the_search_exist_once_with_a_label_and_a_close_button(self):
        html = self.page()

        self.assertEqual(html.count('id="mobileDrawer"'), 1)
        self.assertRegex(
            html, r'<aside class="mobile-drawer" id="mobileDrawer" aria-hidden="true" inert>'
        )
        self.assertRegex(
            html, r'id="menuToggle"[^>]*aria-controls="mobileDrawer"[^>]*aria-label="[^"]+"'
        )
        self.assertRegex(html, r'id="drawerClose" aria-label="[^"]+"')
        self.assertEqual(html.count("data-store-search"), 1)
        self.assertRegex(
            html, r'<dialog [^>]*data-store-search aria-labelledby="store-search-title"'
        )
        self.assertIn("data-search-close", html)

    def test_the_cart_is_a_link_that_does_not_point_at_a_drawer_that_is_not_there(self):
        html = self.page()

        self.assertRegex(html, r'id="cartBtn" aria-label="Carrito">')
        self.assertNotIn('aria-controls="bolsa"', html)
        self.assertNotIn('id="bolsa"', html)
        # The products page keeps its drawer and its aria-controls.
        self.assertIn('aria-controls="bolsa"', self.page("/productos/"))

    def test_the_logo_sits_in_the_centre_and_goes_home(self):
        header = header_of(self.page())

        self.assertRegex(
            header,
            r'header-zone--center">\s*<a class="navbar-brand '
            r'main-header__logo-container" href="/">',
        )

    def test_the_header_is_solid_because_there_is_no_video(self):
        html = self.page()

        self.assertRegex(html, r'<header class="main-header" id="mainHeader">')
        self.assertNotIn("main-header--over-media", html)
        self.assertNotIn("home-hero-video", html)

    def test_the_menu_links_the_pages_and_the_active_categories(self):
        menu = drawer_of(self.page())

        for href in ("/", "/productos/", "/acceso/", "/#sobre-nosotros", "/#contacto"):
            with self.subTest(href=href):
                self.assertIn(f'href="{href}"', menu)
        self.assertIn(f'href="/productos/?category={self.store["meat"].pk}"', menu)
        self.assertIn(">Res<", menu)

    def test_the_search_is_a_get_form_to_the_catalogue(self):
        html = self.page()
        search = html[html.index("data-store-search") :]

        self.assertRegex(search, r'<form action="/productos/" method="get" role="search"')
        self.assertRegex(search, r'<input [^>]*type="search" name="q"')

    def test_the_footer_keeps_its_contact_section_and_the_links_the_old_menu_had(self):
        html = self.page()
        footer = html[html.index("<footer") :]

        self.assertIn(NEGOCIO["telefono_href"], footer)
        self.assertIn(NEGOCIO["whatsapp_href"], footer)
        for href in ("/#preguntas", "/privacidad/"):
            with self.subTest(href=href):
                self.assertIn(f'href="{href}"', footer)

    def test_the_header_script_comes_from_the_build_and_the_entry_reaches_it(self):
        html = self.page()
        manifest = json.loads((BUILT / ".vite" / "manifest.json").read_text())
        entry = manifest["src/entry/auth.tsx"]

        self.assertRegex(html, r'<script [^>]*src="/static/vite/assets/auth-[\w-]+\.js"')
        self.assertIn("src/acceso/server-acceso.ts", entry["dynamicImports"])
        self.assertIn("header.js", (ROOT / "src/acceso/server-acceso.ts").read_text())
        self.assertIn("js/modules/ui/header.js", manifest)
