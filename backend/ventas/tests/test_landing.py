"""Tests of the store's landing page (`ventas:landing`, /): the real index.html, painted by Django.

The page keeps the design, the texts and the sections of index.html (header, hero video, the
nine category tiles, the showcase, the reviews, about, contact and footer). The categories and the
showcase come from the real catalogue (active rows only, never the cost); the scripts and the
styles come from the Vite build (`{% vite_asset %}`), so the CSP that only admits 'self' holds.
What the parallel store invented (its frame, its family section, its FAQ) is not on the page.
"""

import json
import re
from decimal import Decimal
from html.parser import HTMLParser
from pathlib import Path

from django.conf import settings
from django.test import TestCase
from django.urls import reverse

from inventory.models import Category, Product
from ventas import cart
from ventas.negocio import NEGOCIO

COST = "123.45"
HIDDEN_NAME = "De categoria oculta"


def make_catalogue():
    """The categories of the real store (slug and order as in supabase/seed.sql) and some cuts."""
    slugs = (
        ("carnes-rojas", "Carnes Rojas", "/img/products/res.webp"),
        ("cortes-especiales", "Cortes Especiales", "/img/products/premium.webp"),
        ("cerdo", "Cerdo", "/img/products/cerdo.webp"),
        ("pollo", "Pollo", "/img/products/pollo.webp"),
        ("merch", "Merch", "/img/products/merch.webp"),
    )
    categories = {
        slug: Category.objects.create(name=name, slug=slug, order=order, image_url=image)
        for order, (slug, name, image) in enumerate(slugs, start=1)
    }
    categories["oculta"] = Category.objects.create(
        name="Oculta", slug="oculta", order=99, is_active=False
    )
    return categories


def make_product(category, name, price, **extra):
    extra.setdefault("image_url", f"/img/products/{name.lower()}.webp")
    return Product.objects.create(
        category=category, name=name, price_per_kg=Decimal(price), **extra
    )


class LandingTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.categories = make_catalogue()
        red, special = cls.categories["carnes-rojas"], cls.categories["cortes-especiales"]
        make_product(red, "Bistec", "200.00", description="Para la parrilla")
        make_product(red, "Molida", "140.00")
        make_product(special, "Ribeye", "549.00", metadata={"cost_per_kg": COST, "costo": COST})
        make_product(cls.categories["merch"], "Camiseta", "250.00", price_unit="piece")
        make_product(red, "Descontinuado", "999.00", is_active=False)
        make_product(cls.categories["oculta"], HIDDEN_NAME, "888.00")

    def setUp(self):
        self.url = reverse("ventas:landing")

    def html(self):
        return re.sub(r"\s+", " ", self.client.get(self.url).content.decode())

    def test_it_lives_at_the_root(self):
        self.assertEqual(self.url, "/")

    def test_an_anonymous_visitor_gets_the_real_index_and_not_the_parallel_store_frame(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "ventas/index.html")
        self.assertTemplateNotUsed(response, "ventas/tienda/base.html")
        self.assertContains(
            response,
            "<title>Cortes Premium a Tu Puerta | Carnicería El Señor de La Misericordia - SLP"
            "</title>",
        )

    def test_it_keeps_the_sections_and_the_texts_of_the_real_index(self):
        html = self.html()

        for text in (
            "Nuestras Categorías",
            "De la vitrina",
            "Lo que se lleva la gente",
            "Sobre Nosotros",
            "Quiénes Somos",
            "Horario de Atención",
            "Lunes a Sábado",
            "8:00 - 17:00",
            "Domingos y Festivos",
            "Contacto Directo",
            "+52 444 271 5470",
            "Agua Marina 110",
            "Cómo llegar",
            "Club Misericordia",
        ):
            with self.subTest(text=text):
                self.assertIn(text, html)
        for identifier in (
            "mainHeader",
            "menuToggle",
            "searchBtn",
            "cartBtn",
            "mobileDrawer",
            "categoriesReactRoot",
            "showcaseReactRoot",
            "resenasReactRoot",
            "sobre-nosotros",
            "contacto",
            "chatPanel",
        ):
            with self.subTest(identifier=identifier):
                self.assertIn(f'id="{identifier}"', html)

    def test_it_leaves_out_what_the_parallel_store_invented(self):
        html = self.html()

        self.assertNotIn("Carnicería de familia, pieza por pieza", html)
        self.assertNotIn("/static/tienda/", html)

    def test_the_faq_the_other_pages_link_to_is_here_with_native_details(self):
        html = self.html()

        self.assertIn('id="preguntas"', html)
        self.assertIn("Preguntas frecuentes", html)
        self.assertEqual(html.count("<details>"), 3)
        self.assertIn("¿Cuál es el pedido mínimo?", html)
        self.assertIn("Para entrega a domicilio, $150.", html)
        self.assertIn('href="#preguntas"', html)

    def test_the_footer_links_the_privacy_notice(self):
        self.assertIn('href="/privacidad/"', self.html())

    def test_the_header_floats_over_the_film_until_the_script_turns_it_solid(self):
        self.assertRegex(self.html(), r'<header class="main-header main-header--over-media"')

    def test_the_header_and_the_footer_link_to_the_pages_of_the_store(self):
        html = self.html()

        self.assertRegex(html, r'<a class="navbar-brand[^"]*" href="/">')
        self.assertIn('href="/acceso/"', html)
        self.assertIn('href="/productos/"', html)
        self.assertNotRegex(html, r'(?:href|src)="(?:index|products|accessweb)\.html')
        for href in (NEGOCIO["facebook"], NEGOCIO["instagram"], NEGOCIO["whatsapp_href"]):
            self.assertIn(f'href="{href}"', html)
        self.assertIn(NEGOCIO["mapa_href"].replace("&", "&amp;"), html)

    def test_each_active_category_is_a_tile_with_its_icon_text_and_link(self):
        html = self.html()
        red = self.categories["carnes-rojas"]

        self.assertEqual(html.count('class="category-card category-card-'), 5)
        self.assertIn(f'href="/productos/?category={red.pk}"', html)
        self.assertIn("Selección premium para parrilla y asados", html)
        self.assertIn('<i class="bi bi-fire me-2', html)
        self.assertIn("Ver Productos", html)
        self.assertIn('src="/img/products/res.webp"', html)
        self.assertNotIn(f"category={self.categories['oculta'].pk}", html)
        self.assertNotIn(">Oculta<", html)

    def test_the_tiles_take_their_slot_from_the_order_of_the_category(self):
        html = self.html()

        for order in range(1, 6):
            with self.subTest(order=order):
                self.assertIn(f'class="category-card category-card-{order} is-visible"', html)

    def test_the_tiles_are_visible_without_any_script(self):
        # The stylesheet hides a tile until `is-visible` is set (the old island set it on scroll).
        # The page is complete before a script runs, so Django writes it.
        html = self.html()

        self.assertEqual(
            html.count('class="category-card category-card-'), html.count(' is-visible"')
        )

    def test_a_category_without_a_known_description_still_shows(self):
        nueva = Category.objects.create(name="Mariscos", slug="mariscos", order=10)

        html = self.html()

        self.assertIn(f'href="/productos/?category={nueva.pk}"', html)
        self.assertIn("Productos de la carnicería", html)

    def test_a_category_picture_that_is_not_an_address_falls_back_to_the_default(self):
        Category.objects.filter(slug="pollo").update(image_url="javascript:alert(1)")

        html = self.html()

        self.assertNotIn("javascript:", html)
        self.assertIn('src="/img/products/otrosproductos.webp"', html)

    def test_the_showcase_is_a_carousel_and_cards_of_cuts_sold_by_weight(self):
        for number in range(7):
            make_product(self.categories["pollo"], f"Pieza {number}", f"{50 + number}.00")

        html = self.html()

        self.assertIn('id="showcaseCarousel"', html)
        self.assertIn('data-bs-ride="carousel"', html)
        self.assertRegex(html, r"carousel-item active")
        for name in ("Ribeye", "Bistec", "Molida"):
            with self.subTest(name=name):
                self.assertIn(f'class="showcase__slide-title">{name}</h3>', html)
        self.assertIn("Para la parrilla", html)
        card = Product.objects.get(name="Pieza 3")
        self.assertIn(f'<a class="showcase-card__link" href="/productos/{card.pk}/">', html)
        # The seventh dearest cut is the first card, with its price per kilo.
        self.assertIn('class="showcase-card__name">Pieza 3</h3>', html)
        self.assertIn(
            '<p class="showcase-card__price">$53.00<span class="showcase-card__unit"> / kg</span>',
            html,
        )

    def test_the_showcase_leads_with_the_most_expensive_cut_and_skips_what_is_not_by_weight(self):
        html = self.html()

        self.assertLess(html.index("Ribeye"), html.index("Bistec"))
        self.assertLess(html.index("Bistec"), html.index("Molida"))
        self.assertNotIn("Camiseta", html)

    def test_the_showcase_holds_six_slides_and_four_cards_at_most(self):
        red = self.categories["carnes-rojas"]
        for number in range(12):
            make_product(red, f"Extra {number:02d}", f"{10 + number}.00")

        html = self.html()

        self.assertEqual(html.count('class="carousel-item'), 6)
        self.assertEqual(html.count('class="showcase-card"'), 4)

    def test_without_products_the_showcase_does_not_open_an_empty_carousel(self):
        Product.objects.all().delete()

        html = self.html()

        self.assertNotIn('id="showcaseCarousel"', html)
        self.assertIn('id="showcaseReactRoot"', html)

    def test_it_never_lists_inactive_products_nor_the_cost(self):
        response = self.client.get(self.url)

        self.assertNotContains(response, "Descontinuado")
        self.assertNotContains(response, HIDDEN_NAME)
        self.assertNotContains(response, COST)

    def test_product_names_are_escaped(self):
        make_product(self.categories["pollo"], "<script>alert(1)</script>", "10.00")

        response = self.client.get(self.url)

        self.assertNotContains(response, "<script>alert(1)</script>")
        self.assertContains(response, "&lt;script&gt;alert(1)&lt;/script&gt;")

    def test_the_hero_keeps_the_looping_muted_video_with_both_sources_a_poster_and_a_still(self):
        html = self.html()

        self.assertRegex(html, r"<video[^>]*\bmuted\b[^>]*\bloop\b[^>]*\bplaysinline\b")
        self.assertRegex(html, r'<video[^>]*poster="/img/Videos/VideoCarniwebP01-poster\.jpg"')
        self.assertIn('src="/img/Videos/VideoCarniwebP01.webm" type="video/webm"', html)
        self.assertIn('src="/img/Videos/VideoCarniwebP01.mp4" type="video/mp4"', html)
        self.assertRegex(
            html, r'<img data-hero-fallback src="/img/Videos/[^"]+" alt="" width="\d+"'
        )
        self.assertIn("data-hero-playback", html)

    def test_the_video_does_not_start_before_the_motion_preference_is_read(self):
        self.assertNotRegex(self.html(), r"<video[^>]*\bautoplay\b")

    def test_it_declares_the_business_for_search_engines_as_a_data_block(self):
        match = re.search(
            r'<script type="application/ld\+json">(.*?)</script>', self.html(), re.DOTALL
        )

        self.assertIsNotNone(match)
        data = json.loads(match.group(1))
        self.assertEqual(data["@type"], "LocalBusiness")
        self.assertEqual(data["telephone"], "+524442715470")
        self.assertEqual(data["address"]["postalCode"], "78150")

    def test_the_cart_of_the_header_goes_to_the_cart_page_and_counts_what_the_visitor_added(self):
        self.assertRegex(self.html(), r'<a class="[^"]*" href="/carrito/" id="cartBtn"')
        self.assertNotIn("main-header__cart-count", self.html())

        session = self.client.session
        bistec = Product.objects.get(name="Bistec")
        cart.put(cart.PublicSlot(session), cart.make_line(bistec.pk, "weight", "1", "kg"))
        session.save()

        self.assertRegex(self.html(), r'main-header__cart-count">1</span>')

    def test_a_post_is_refused(self):
        self.assertEqual(self.client.post(self.url).status_code, 405)


class Markup(HTMLParser):
    """Collect the tags of a page, to check what the CSP of the site would refuse."""

    def __init__(self):
        super().__init__()
        self.tags = []

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


class LandingSecurityTests(TestCase):
    """The CSP only admits 'self': nothing on the page may need more."""

    @classmethod
    def setUpTestData(cls):
        make_catalogue()

    def setUp(self):
        self.response = self.client.get("/")
        parser = Markup()
        parser.feed(self.response.content.decode())
        self.tags = parser.tags

    def test_there_is_no_inline_style_nor_event_handler(self):
        for tag, attributes in self.tags:
            with self.subTest(tag=tag):
                self.assertNotIn("style", attributes)
                self.assertFalse([name for name in attributes if name.startswith("on")])

    def test_every_script_is_a_file_of_the_site_or_a_data_block(self):
        scripts = [attributes for tag, attributes in self.tags if tag == "script"]

        self.assertTrue(scripts)
        for attributes in scripts:
            with self.subTest(script=attributes):
                self.assertTrue(
                    attributes.get("src", "").startswith("/static/vite/")
                    or attributes.get("type") == "application/ld+json"
                )

    def test_no_style_font_or_script_comes_from_another_site(self):
        for tag, attributes in self.tags:
            loads = tag == "script" or attributes.get("rel") in {
                "stylesheet",
                "modulepreload",
                "icon",
            }
            if tag in {"link", "script"} and loads:
                address = attributes.get("href") or attributes.get("src") or ""
                with self.subTest(tag=tag, address=address):
                    self.assertFalse(address.startswith(("http:", "https:", "//")))

    def test_the_policy_of_the_response_admits_only_the_site_for_scripts_and_styles(self):
        policy = self.response.headers["Content-Security-Policy"]

        self.assertIn("script-src 'self';", policy)
        self.assertIn("style-src 'self';", policy)

    def test_every_picture_and_the_video_reserve_their_box(self):
        for tag, attributes in self.tags:
            if tag in {"img", "video"}:
                with self.subTest(
                    tag=tag, source=attributes.get("src") or attributes.get("poster")
                ):
                    self.assertGreater(int(attributes["width"]), 0)
                    self.assertGreater(int(attributes["height"]), 0)

    def test_the_scripts_and_the_styles_come_from_the_vite_build(self):
        html = self.response.content.decode()
        styles = re.findall(r'<link rel="stylesheet" href="([^"]+)"', html)

        self.assertTrue(styles)
        for address in styles:
            self.assertTrue(address.startswith("/static/vite/"), address)
        self.assertRegex(html, r'<script type="module" src="/static/vite/assets/home-[^"]+\.js">')

    def test_bootstrap_is_written_before_the_site_so_the_site_wins(self):
        html = self.response.content.decode()
        files = re.findall(r'<link rel="stylesheet" href="/static/vite/([^"]+)"', html)
        built = Path(settings.BASE_DIR) / "static" / "vite"
        css = "".join((built / name).read_text(encoding="utf-8") for name in files)

        site_starts = css.index(".main-header")
        self.assertIn("--bs-btn-padding-x", css[:site_starts])  # Bootstrap's own rules come first
        self.assertNotIn(".bi-", css[site_starts:])  # and none of Bootstrap Icons after the site's
