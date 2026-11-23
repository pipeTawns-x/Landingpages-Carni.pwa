"""Tests of the store's products page (`ventas/productos.html`), the real products.html in Django.

One template, two modes, as the original page had two routes: the catalogue (no `product` in the
context) and the sheet of one product (`product` in the context), where the order is configured.
The views that fill it belong to `ventas.views.productos`; until they render this template the
tests render it directly with the context those views build, so the page can be checked on its
own. The catalogue shown is the real one (active rows only, never the cost), the scripts and the
styles come from the Vite build, and the CSP that only admits 'self' holds: no inline style, no
inline script, no CDN.
"""

import json
import re
from datetime import date
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.contrib.messages import constants as message_levels
from django.contrib.messages.storage.fallback import FallbackStorage
from django.template.loader import render_to_string
from django.test import RequestFactory, TestCase
from django.urls import reverse

from inventory.models import Product
from ventas import cart, catalog, domain
from ventas.negocio import NEGOCIO
from ventas.tests.test_landing import COST, HIDDEN_NAME, make_catalogue, make_product
from ventas.views.comun import listing, modes_of
from ventas.views.productos import MODE_ORDER, _thickness

TEMPLATE = "ventas/productos.html"
BUILT = Path(settings.BASE_DIR) / "static" / "vite"


def squeeze(html):
    return re.sub(r"\s+", " ", html)


class ProductsPageCase(TestCase):
    """The catalogue of the real store and a way to paint the page with a given request."""

    @classmethod
    def setUpTestData(cls):
        cls.categories = make_catalogue()
        red, special = cls.categories["carnes-rojas"], cls.categories["cortes-especiales"]
        cls.bistec = make_product(red, "Bistec", "200.00", description="Para la parrilla")
        cls.molida = make_product(red, "Molida", "140.00")
        cls.ribeye = make_product(
            special, "Ribeye", "549.00", metadata={"cost_per_kg": COST, "costo": COST}
        )
        cls.camiseta = make_product(
            cls.categories["merch"], "Camiseta", "250.00", price_unit="piece"
        )
        make_product(red, "Descontinuado", "999.00", is_active=False)
        make_product(cls.categories["oculta"], HIDDEN_NAME, "888.00")

    def request(self, path="/productos/", messages=()):
        request = RequestFactory().get(path)
        request.session = self.client.session
        request.user = AnonymousUser()
        request._messages = FallbackStorage(request)
        for level, text in messages:
            request._messages.add(level, text)
        return request

    def fill_cart(self, *lines):
        session = self.client.session
        for line in lines:
            cart.put(cart.PublicSlot(session), line)
        session.save()

    def catalogue_page(self, path="/productos/", messages=()):
        request = self.request(path, messages)
        return squeeze(render_to_string(TEMPLATE, listing(request, 24), request=request))

    def sheet_page(self, product, messages=()):
        request = self.request(f"/productos/{product.pk}/", messages)
        modes = dict(modes_of(product))
        context = {
            "product": product,
            "modes": [(mode, modes[mode]) for mode in MODE_ORDER if mode in modes],
            "units": domain.UNITS,
            "asks_thickness": catalog.asks_thickness(product),
            "thickness": _thickness(product),
            "relacionados": catalog.active_products()
            .filter(category=product.category)
            .exclude(pk=product.pk)[:4],
        }
        return squeeze(render_to_string(TEMPLATE, context, request=request))


class PageShellTests(ProductsPageCase):
    def test_it_is_a_whole_page_in_spanish_with_the_title_of_the_store(self):
        html = self.catalogue_page()

        self.assertTrue(html.lstrip().startswith("<!DOCTYPE html>"))
        self.assertIn('<html lang="es">', html)
        self.assertIn("<title>Productos · Carnicería El Señor de La Misericordia</title>", html)
        self.assertIn('<meta name="viewport" content="width=device-width, initial-scale=1"', html)

    def test_the_island_comes_from_the_vite_build_of_the_products_entry(self):
        html = self.catalogue_page()

        manifest = json.loads((BUILT / ".vite" / "manifest.json").read_text())
        entry = manifest["src/entry/products.tsx"]["file"]
        self.assertIn(f'<script type="module" src="/static/vite/{entry}"></script>', html)

    def test_nothing_is_inline_and_nothing_comes_from_a_cdn(self):
        html = self.catalogue_page()

        self.assertNotRegex(html, r"\sstyle=", "the CSP of the site refuses inline style")
        scripts = re.findall(r"<script\b[^>]*>", html)
        self.assertTrue(scripts)
        for tag in scripts:
            self.assertRegex(tag, r'type="module" src="/static/vite/', tag)
        self.assertNotRegex(html, r'(?:src|href)="https?://(?!wa\.me|www\.(?:facebook|instagram))')
        self.assertNotRegex(html, r"\son[a-z]+=", "no inline event handlers either")

    def test_bootstrap_lands_before_the_site_css_in_the_stylesheet_of_the_entry(self):
        manifest = json.loads((BUILT / ".vite" / "manifest.json").read_text())
        css = "".join(
            (BUILT / name).read_text() for name in manifest["src/entry/products.tsx"]["css"]
        )

        self.assertIn(".bi-", css)
        self.assertLess(css.rindex(".bi-"), css.index(".main-header"))


class CatalogueTests(ProductsPageCase):
    def test_each_active_product_is_a_card_of_the_real_design_with_its_real_data(self):
        html = self.catalogue_page()

        for name in ("Bistec", "Molida", "Ribeye", "Camiseta"):
            self.assertIn(
                f'<h3 class="tw-card-shell__title producto-card__title">{name}</h3>', html
            )
        self.assertEqual(html.count('class="tw-card-shell tw-card-shell--medium producto-card"'), 4)
        self.assertIn('<strong class="tw-card-shell__price">$200</strong>', html)
        self.assertIn("Carnes Rojas", html)

    def test_the_price_of_a_card_drops_the_cents_only_when_they_are_zero(self):
        make_product(self.categories["cerdo"], "Chuleta", "189.50")
        html = self.catalogue_page()

        self.assertIn('<strong class="tw-card-shell__price">$189.50</strong>', html)
        self.assertNotIn("$190<", html)

    def test_pieces_are_priced_per_piece_and_kilos_also_per_pound(self):
        html = self.catalogue_page()

        self.assertIn('<span class="tw-card-shell__unit">/ pieza</span>', html)
        self.assertIn('<span class="tw-card-shell__unit">/ kg</span>', html)
        self.assertEqual(html.count("/ lb</span>"), 3, "only the three priced per kilo")

    def test_the_whole_card_goes_to_the_sheet_of_its_product(self):
        html = self.catalogue_page()

        url = reverse("ventas:producto", args=[self.bistec.pk])
        self.assertIn(
            f'<a class="tw-button tw-button--primary tw-card-shell__enlace" href="{url}"', html
        )
        self.assertIn('aria-label="Configurar y agregar Bistec"', html)

    def test_inactive_hidden_and_private_data_never_reach_the_page(self):
        html = self.catalogue_page()

        for secret in ("Descontinuado", HIDDEN_NAME, COST, "cost_per_kg"):
            self.assertNotIn(secret, html)

    def test_the_card_says_if_there_is_stock_without_printing_the_amount(self):
        Product.objects.filter(pk=self.molida.pk).update(stock=Decimal("12.500"))
        html = self.catalogue_page()

        self.assertIn("Disponible", html)
        self.assertIn("Sin existencias", html)
        self.assertNotIn("12.500", html)

    def test_pictures_declare_their_box_and_only_the_first_row_is_loaded_eagerly(self):
        html = self.catalogue_page()

        images = re.findall(r'<img [^>]*class="tw-card-shell__image"[^>]*>', html)
        self.assertEqual(len(images), 4)
        for image in images:
            self.assertIn('width="800" height="600"', image)
            self.assertIn('decoding="async"', image)
        self.assertIn('fetchpriority="high"', images[0])
        self.assertNotIn("loading=", images[0])
        self.assertNotIn('fetchpriority="high"', "".join(images[1:]))
        self.assertTrue(all('loading="lazy"' in image for image in images[1:]))

    def test_a_category_without_cuts_says_so_instead_of_leaving_a_hole(self):
        html = self.catalogue_page(f"/productos/?category={self.categories['pollo'].pk}")

        self.assertIn("Por ahora no tenemos cortes publicados en esta categoría.", html)
        self.assertNotIn("producto-card", html)

    def test_a_search_without_results_names_the_text_and_says_how_to_go_on(self):
        html = self.catalogue_page("/productos/?q=zzz")

        self.assertIn("No encontramos cortes con «zzz».", html)
        self.assertNotIn("producto-card", html)


class FiltersTests(ProductsPageCase):
    def test_the_chips_are_plain_links_so_the_filter_works_without_script(self):
        html = self.catalogue_page(f"/productos/?category={self.categories['pollo'].pk}")

        self.assertIn('class="tw-filter-chip"', html)
        self.assertIn(f'href="/productos/?category={self.categories["cerdo"].pk}"', html)
        self.assertNotIn("Oculta</a>", html, "an inactive category has no chip")

    def test_the_chip_of_the_category_in_use_is_marked_for_everyone(self):
        pk = self.categories["cerdo"].pk
        html = self.catalogue_page(f"/productos/?category={pk}")

        self.assertRegex(
            html,
            rf'<a class="tw-filter-chip tw-filter-chip--active" aria-current="page" '
            rf'href="/productos/\?category={pk}">Cerdo</a>',
        )
        self.assertEqual(html.count("tw-filter-chip--active"), 1)

    def test_without_a_category_the_chip_of_the_whole_catalogue_is_the_current_one(self):
        html = self.catalogue_page()

        self.assertRegex(
            html,
            r'<a class="tw-filter-chip tw-filter-chip--active" aria-current="page" '
            r'href="/productos/">Todo el catálogo</a>',
        )

    def test_a_search_keeps_its_text_offers_to_clear_it_and_keeps_it_in_the_chips(self):
        html = self.catalogue_page("/productos/?q=bis")

        self.assertIn('role="search"', html)
        self.assertRegex(html, r'<input[^>]*type="search"[^>]*name="q"[^>]*value="bis"')
        self.assertIn("Buscando: <strong>bis</strong>", html)
        self.assertIn('href="/productos/" class="tw-filter-row__limpiar"', html)
        self.assertIn("q=bis", html.split('class="tw-filter-carril"')[1].split("</nav>")[0])

    def test_the_text_of_a_search_is_escaped(self):
        html = self.catalogue_page("/productos/?q=%3Cscript%3Ealert(1)%3C/script%3E")

        self.assertNotIn("<script>alert", html)
        self.assertIn("&lt;script&gt;", html)

    def test_a_long_catalogue_is_paginated_and_the_pages_keep_the_filter(self):
        red = self.categories["carnes-rojas"]
        for number in range(30):
            make_product(red, f"Corte {number:02d}", "100.00")
        html = self.catalogue_page(f"/productos/?category={red.pk}&q=Corte")

        self.assertIn("Página 1 de 2", html)
        self.assertIn(f"?page=2&amp;q=Corte&amp;category={red.pk}", html)
        self.assertEqual(html.count("producto-card__title"), 24)


class HeaderAndMenuTests(ProductsPageCase):
    def test_the_header_is_solid_on_this_page_and_links_to_the_pages_of_django(self):
        html = self.catalogue_page()

        self.assertRegex(html, r'<header class="main-header" id="mainHeader">')
        self.assertNotIn("main-header--over-media", html, "there is no film behind this header")
        for href in ('href="/"', 'href="/acceso/"', 'href="/carrito/"'):
            self.assertIn(href, html)
        self.assertNotRegex(html, r'href="[^"]*\.html')

    def test_the_cart_badge_counts_the_lines_of_the_session(self):
        self.fill_cart(cart.make_line(self.bistec.pk, "weight", "1", "kg"))
        html = self.catalogue_page()

        self.assertRegex(html, r'id="cartBtn"[^>]*>.*?main-header__cart-count">1</span>')

    def test_an_empty_cart_has_no_badge(self):
        self.assertNotIn("main-header__cart-count", self.catalogue_page())

    def test_the_menu_is_a_hidden_drawer_with_the_active_categories_and_this_page_marked(self):
        html = self.catalogue_page()

        self.assertRegex(
            html, r'<aside class="mobile-drawer" id="mobileDrawer" aria-hidden="true" inert>'
        )
        self.assertIn(
            'class="mobile-drawer__link mobile-drawer__link--active" aria-current="page">Productos',
            html,
        )
        chips = html.split('class="mobile-drawer__chips"')[1].split("</div>")[0]
        self.assertIn(">Pollo</a>", chips)
        self.assertNotIn(">Oculta</a>", chips)

    def test_the_menu_button_names_what_it_opens(self):
        html = self.catalogue_page()

        self.assertRegex(
            html,
            r'id="menuToggle" aria-expanded="false" aria-controls="mobileDrawer" '
            r'aria-label="Abrir menú de navegación"',
        )

    def test_the_magnifier_opens_a_search_dialog_that_sends_the_visitor_to_the_catalogue(self):
        html = self.catalogue_page()

        self.assertRegex(
            html,
            r'<dialog class="landing-search" data-store-search '
            r'aria-labelledby="store-search-title">',
        )
        self.assertIn('<form action="/productos/" method="get" role="search">', html)
        self.assertIn('id="searchBtn"', html)

    def test_it_skips_to_the_content_and_has_one_main_landmark(self):
        html = self.catalogue_page()

        self.assertIn('<a class="landing-skip-link" href="#contenido">Ir al contenido</a>', html)
        self.assertEqual(html.count("<main"), 1)
        self.assertIn('<main id="contenido"', html)


class CartDrawerTests(ProductsPageCase):
    def test_the_cart_is_a_modal_dialog_named_after_its_title(self):
        html = self.catalogue_page()

        self.assertRegex(html, r'<dialog class="bolsa" id="bolsa" aria-labelledby="bolsa-titulo"')
        self.assertIn('id="bolsa-titulo"', html)
        self.assertNotIn('role="dialog"', html, "a native modal dialog already is one")

    def test_without_script_the_cart_button_is_a_link_to_the_cart_page(self):
        html = self.catalogue_page()

        self.assertRegex(
            html,
            r'<a class="header-icon-btn header-icon-btn--round position-relative" '
            r'href="/carrito/" id="cartBtn" aria-label="Carrito"',
        )
        self.assertIn('aria-controls="bolsa"', html)

    def test_it_lists_the_lines_with_what_was_asked_and_the_notes_and_no_price(self):
        self.fill_cart(
            cart.make_line(self.bistec.pk, "weight", "1.5", "kg", note="sin grasa"),
            cart.make_line(self.molida.pk, "money", "100"),
        )
        drawer = self.catalogue_page().split('id="bolsa"')[1]

        self.assertIn("Bistec", drawer)
        self.assertIn("1.5 kg", drawer)
        self.assertIn("“sin grasa”", drawer)
        self.assertIn("$100", drawer)
        self.assertNotIn("$200.00", drawer, "the store quotes prices; the drawer only lists")

    def test_each_line_is_removed_with_a_post_that_carries_the_token_and_comes_back_here(self):
        self.fill_cart(cart.make_line(self.bistec.pk, "weight", "1", "kg"))
        drawer = self.catalogue_page("/productos/?category=1").split('id="bolsa"')[1]

        self.assertIn(f'action="{reverse("ventas:tienda_quitar", args=[self.bistec.pk])}"', drawer)
        self.assertIn('method="post"', drawer)
        self.assertIn('name="next" value="/productos/?category=1#bolsa"', drawer)

    def test_every_page_carries_a_csrf_token_so_a_write_of_the_drawer_can_always_send_it(self):
        # The cookie of the token is only issued on a page that renders one, and an empty drawer
        # has no form to remove from: the page would then have nothing for a script to send.
        pages = {
            "catalogue": self.catalogue_page(),
            "sheet": self.sheet_page(self.bistec),
        }

        for name, html in pages.items():
            with self.subTest(page=name):
                self.assertRegex(
                    html,
                    r'<input type="hidden" name="csrfmiddlewaretoken" value="[^"]+" data-csrf>',
                )

    def test_it_offers_the_cart_page_and_a_way_back_to_the_catalogue(self):
        drawer = self.catalogue_page().split('id="bolsa"')[1]

        self.assertIn('href="/carrito/"', drawer)
        self.assertIn("Tu carrito está vacío.", drawer)
        self.assertIn("Seguir comprando", drawer)

    def test_a_success_message_is_announced_politely_and_never_opens_the_drawer_by_itself(self):
        html = self.catalogue_page(
            messages=[(message_levels.SUCCESS, "Bistec se agregó a tu carrito.")]
        )

        self.assertRegex(
            html, r'<p class="productos-aviso" role="status">Bistec se agregó a tu carrito\.</p>'
        )
        self.assertNotRegex(html, r"<dialog[^>]*\sopen")

    def test_an_error_message_is_announced_as_an_alert(self):
        html = self.catalogue_page(messages=[(message_levels.ERROR, "La tienda no responde.")])

        self.assertRegex(
            html,
            r'<p class="productos-aviso productos-aviso--error" role="alert">'
            r"La tienda no responde\.</p>",
        )


class SheetTests(ProductsPageCase):
    def test_the_sheet_names_the_cut_and_goes_back_to_its_category(self):
        html = self.sheet_page(self.bistec)

        self.assertIn('<h1 class="ficha__titulo" id="ficha-titulo">Bistec</h1>', html)
        self.assertIn(f'href="/productos/?category={self.bistec.category_id}"', html)
        self.assertIn("<title>Bistec · Carnicería El Señor de La Misericordia</title>", html)
        self.assertNotIn("tw-filter-carril", html, "the filter rail belongs to the catalogue")

    def test_the_order_goes_to_the_store_with_the_token_and_back_to_this_sheet(self):
        html = self.sheet_page(self.bistec)

        self.assertIn(f'action="{reverse("ventas:tienda_agregar", args=[self.bistec.pk])}"', html)
        self.assertIn('name="csrfmiddlewaretoken"', html)
        self.assertIn(
            f'name="next" value="{reverse("ventas:producto", args=[self.bistec.pk])}"', html
        )

    def test_only_the_ways_the_store_accepts_are_offered_and_the_first_is_chosen(self):
        html = self.sheet_page(self.bistec)

        modes = re.findall(r'<input[^>]*name="mode"[^>]*value="(\w+)"', html)
        self.assertEqual(modes, ["weight", "money"])
        self.assertRegex(html, r'name="mode" value="weight" data-modo checked')

    def test_a_product_priced_per_piece_is_only_sold_by_pieces(self):
        html = self.sheet_page(self.camiseta)

        self.assertEqual(re.findall(r'<input[^>]*name="mode"[^>]*value="(\w+)"', html), ["pieces"])

    def test_the_weight_unit_is_asked_with_the_units_of_the_store(self):
        html = self.sheet_page(self.bistec)

        for unit in domain.UNITS:
            self.assertRegex(html, rf'name="unit" value="{unit}"')

    def test_the_thickness_slider_only_appears_for_a_cut_that_asks_for_it(self):
        self.assertNotIn('name="thickness_in"', self.sheet_page(self.bistec))

    def test_the_live_summary_is_a_polite_region_that_asks_the_store_for_the_number(self):
        html = self.sheet_page(self.bistec)

        url = reverse("ventas:producto_cotizar", args=[self.bistec.pk])
        self.assertIn(f'data-cotizar="{url}"', html)
        self.assertRegex(html, r'<div class="ficha__resumen" data-resumen aria-live="polite"')
        self.assertIn("El subtotal exacto lo ves en tu carrito.", html)

    def test_the_notes_are_limited_to_what_the_store_accepts(self):
        self.assertRegex(
            self.sheet_page(self.bistec), r'<textarea[^>]*name="note"[^>]*maxlength="200"'
        )

    def test_the_prices_per_kilo_and_per_pound_are_those_of_the_store(self):
        html = self.sheet_page(self.bistec)

        self.assertIn("$200.00", html)
        self.assertIn(f"${self.bistec.price_per_lb} / lb", html)

    def test_related_cuts_are_cards_of_the_same_category_without_the_cut_itself(self):
        html = self.sheet_page(self.bistec)

        related = html.split('aria-labelledby="relacionados-titulo"')[1]
        self.assertIn(">Molida</h3>", related)
        self.assertNotIn(">Bistec</h3>", related)
        self.assertNotIn(">Ribeye</h3>", related)

    def test_a_private_cost_never_reaches_the_sheet(self):
        self.assertNotIn(COST, self.sheet_page(self.ribeye))


class FooterAndAssistantTests(ProductsPageCase):
    def test_the_footer_shows_the_contact_data_of_the_business(self):
        html = self.catalogue_page()

        for text in (
            "tel:+524442715470",
            "https://wa.me/524442715470",
            "+52 444 271 5470",
            "Aviso de privacidad",
        ):
            self.assertIn(text, html)
        self.assertIn('href="/privacidad/"', html)

    def test_the_footer_shows_the_address_of_the_business(self):
        html = self.catalogue_page()

        footer = html.split('<footer class="main-footer store-footer">')[1]
        for line in NEGOCIO["direccion"]:
            self.assertIn(line, footer)

    def test_the_footer_shows_the_year_it_is_read_in_and_not_a_fixed_one(self):
        footer = self.catalogue_page().split('<footer class="main-footer store-footer">')[1]

        self.assertIn(f"© {date.today().year} ", footer)

    def test_the_virtual_assistant_is_on_the_page(self):
        html = self.catalogue_page()

        self.assertIn("data-carni-chat", html)
        self.assertIn('aria-controls="chatPanel"', html)

    def test_external_links_do_not_hand_over_the_window(self):
        html = self.catalogue_page()

        for tag in re.findall(r'<a [^>]*target="_blank"[^>]*>', html):
            self.assertIn('rel="noopener noreferrer"', tag)
