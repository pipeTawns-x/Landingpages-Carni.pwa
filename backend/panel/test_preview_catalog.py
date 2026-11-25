"""Contract of the preview catalogue (S17): one source of products.

After `preview_seed`, the products of the preview database, of the store (/productos/) and of
every panel page that lists products are the catalogue of `supabase/seed.sql`, field by field.
The expected values are read here with their own small regular expressions, not with the parser
the seed uses, so a mistake in that parser cannot hide itself.
"""

import json
import re
from decimal import Decimal
from pathlib import Path
from unittest import mock

from django.core.management import call_command
from django.template.defaultfilters import floatformat
from django.test import TestCase, override_settings
from django.utils.html import escape

from config.urls_preview import PreviewGateway
from inventory.models import Category, Product
from panel.test_preview_seed import sign_in_preview_admin
from ventas.models import PanelOrder

REPO = Path(__file__).resolve().parents[2]
SEED_SQL = REPO / "supabase" / "seed.sql"
CATEGORY_FIXTURE = REPO / "backend" / "inventory" / "fixtures" / "categories.json"
SCHEMA_MIGRATION = REPO / "supabase" / "migrations" / "20261113000001_comercio_v1_esquema.sql"

# The products the first preview seed invented (preview_seed.py at 6681da25). None may come back.
INVENTED_NAMES = [
    "Bistec de res",
    "Molida de res",
    "Arrachera marinada",
    "Pierna de puerco",
    "Molida mixta",
    "Pollo entero",
    "Milanesa de res 100 g",
    "Hamburguesa preparada",
    "Delantal de la carnicería",
    "Paquete parrillero",
]

CATEGORY_ROW = re.compile(
    r"\(\s*'([^']+)',\s*'([a-z-]+)',\s*'([^']+)',\s*(true|false),\s*([0-9]+)\s*\)"
)
PRODUCT_ROW = re.compile(
    r"\(\s*'([a-z-]+)',\s*'([^']+)',\s*'([^']+)',\s*([0-9.]+),\s*'([^']+)',"
    r"\s*([0-9.]+),\s*([0-9.]+)(?:,\s*'([a-z]+)')?\s*\)"
)
# The rule that 20261113000001_comercio_v1_esquema.sql:91-99 applies to the rows of products.
SCHEMA_UNIT_RULE = (
    "WHEN starts_with(p.name, 'Paquete ') AND position('por kilo' IN lower(p.name)) = 0 "
    "THEN 'package'",
    "WHEN c.slug IN ('merch', 'otros') THEN 'piece'",
    "ELSE 'kg'",
)


def seed_sql_categories():
    """(name, slug, image_url, is_active, order) of every category of seed.sql."""
    text = SEED_SQL.read_text(encoding="utf-8")
    block = text[text.index("INSERT INTO categories") : text.index("INSERT INTO products")]
    return {
        (name, slug, image, active == "true", int(order))
        for name, slug, image, active, order in CATEGORY_ROW.findall(block)
    }


def seed_sql_products():
    """{name: (slug, price, image, active, description, stock, minimum)} of every seed.sql row.

    It reads the whole file: rows written anywhere in it count, and
    `test_seed_sql_writes_products_with_one_insert_only` pins that there is one place to write.
    """
    text = SEED_SQL.read_text(encoding="utf-8")
    block = text[text.index("INSERT INTO products") :]
    return {
        name: (slug, Decimal(price), image, True, desc.replace("''", "'"), Decimal(stock),
               Decimal(minimum))
        for slug, name, desc, price, image, stock, minimum, _unit in PRODUCT_ROW.findall(block)
    }  # fmt: skip


# A statement that writes rows or structure of products or categories.
WRITE_STATEMENT = re.compile(
    r"\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM|ALTER\s+TABLE|COPY)\s+(?:ONLY\s+)?(?:public\.)?"
    r"(products|categories)\b",
    re.IGNORECASE,
)


def seed_sql_units():
    """{name: (category slug, the unit the row of seed.sql writes, or "" when it writes none)}."""
    text = SEED_SQL.read_text(encoding="utf-8")
    block = text[text.index("INSERT INTO products") : text.index("DO $$")]
    return {row[1]: (row[0], row[7]) for row in PRODUCT_ROW.findall(block)}


def schema_rule_unit(name, slug):
    """The price_unit the schema migration gives a row (its lines are pinned by a test)."""
    if name.startswith("Paquete ") and "por kilo" not in name.lower():
        return "package"
    if slug in ("merch", "otros"):
        return "piece"
    return "kg"


def schema_rule_row(unit):
    """(price_unit, stock_unit, sale_modes) for a unit: 20261113000001:102-111, no cut specs."""
    if unit == "kg":
        return ("kg", "kg", ["money", "weight"])
    return (unit, "piece", ["pieces"])


def schema_default_sale_modes():
    """The DEFAULT of products.sale_modes in the migration that adds the column."""
    text = SCHEMA_MIGRATION.read_text(encoding="utf-8")
    found = re.search(r"sale_modes\s+text\[\]\s+NOT NULL DEFAULT '\{([^}]*)\}'", text)
    return sorted(found.group(1).split(","))


def database_products():
    return {
        p.name: (
            p.category.slug,
            p.price_per_kg,
            p.image_url,
            p.is_active,
            p.description,
            p.stock,
            p.min_quantity_kg,
        )
        for p in Product.objects.select_related("category")
    }


class SeedSqlReadingTests(TestCase):
    """The independent reading of seed.sql this contract relies on is itself right."""

    def test_seed_sql_has_53_products_in_9_categories(self):
        products = seed_sql_products()

        self.assertEqual(len(products), 53)
        self.assertEqual(len(seed_sql_categories()), 9)
        bistec = ("carnes-rojas", Decimal("289.00"), "/img/products/res.webp", True)
        self.assertEqual(products["Bistec de Res"][:4], bistec)
        self.assertEqual(products["Bistec de Res"][5:], (Decimal("80"), Decimal("0.250")))
        self.assertEqual(len({slug for slug, *_ in products.values()}), 9)

    def test_seed_sql_writes_products_with_one_insert_only(self):
        """The whole file: no UPDATE, DELETE, ALTER, COPY or second INSERT changes the catalogue."""
        text = re.sub(r"--[^\n]*", "", SEED_SQL.read_text(encoding="utf-8"))

        writes = [m.group(0).split()[0].upper() + " " + m.group(2) for m in
                  WRITE_STATEMENT.finditer(text)]  # fmt: skip

        self.assertEqual(sorted(writes), ["INSERT categories", "INSERT products"])

    def test_the_fixture_categories_are_the_seed_sql_categories(self):
        fixture = {
            (row["fields"]["name"], row["fields"]["slug"], row["fields"]["image_url"],
             row["fields"]["is_active"], row["fields"]["order"])
            for row in json.loads(CATEGORY_FIXTURE.read_text(encoding="utf-8"))
        }  # fmt: skip

        self.assertEqual(fixture, seed_sql_categories())

    def test_the_schema_default_of_sale_modes_is_money_and_weight(self):
        self.assertEqual(schema_default_sale_modes(), ["money", "weight"])

    def test_the_schema_unit_rule_this_contract_mirrors_is_still_in_the_migration(self):
        text = re.sub(r"\s+", " ", SCHEMA_MIGRATION.read_text(encoding="utf-8"))

        for line in SCHEMA_UNIT_RULE:
            self.assertIn(line, text)

    def test_every_seed_sql_row_writes_the_unit_the_schema_rule_gives_it(self):
        units = seed_sql_units()

        self.assertEqual(len(units), len(seed_sql_products()))
        for name, (slug, unit) in units.items():
            with self.subTest(product=name):
                self.assertEqual(unit, schema_rule_unit(name, slug))

    def test_the_model_default_of_sale_modes_is_the_schema_default(self):
        from inventory.models import default_sale_modes

        self.assertEqual(sorted(default_sale_modes()), schema_default_sale_modes())


SMALL_SEED = """
-- a comment with a quote ' and a paren (
INSERT INTO categories (name, slug, image_url, is_active, "order") VALUES
    ('Carnes Rojas', 'carnes-rojas', '/img/products/res.webp', true, 1),
    ('Merch', 'merch', '/img/products/merch.webp', false, 2);

INSERT INTO products
    (category_id, name, description, price_per_kg, price_per_lb,
     image_url, stock, min_quantity_kg, is_active,
     price_unit, stock_unit, sale_modes)
SELECT
    (SELECT id FROM categories WHERE slug = v.slug),
    v.nombre,
    v.descripcion,
    v.precio_kg,
    ROUND(v.precio_kg * 0.4536, 2),
    v.imagen,
    v.stock,
    v.minimo,
    true,
    v.unidad,
    CASE WHEN v.unidad = 'kg' THEN 'kg' ELSE 'piece' END,
    CASE WHEN v.unidad = 'kg' THEN ARRAY['money', 'weight'] ELSE ARRAY['pieces'] END
FROM (VALUES
    -- ---------- Carnes Rojas ----------
    ('carnes-rojas', 'Bistec de Res', 'El de diario, con ''comillas'' -- y guiones.',
     289.00, '/img/products/res.webp', 80, 0.250, 'kg'),
    ('merch', 'Gorra', 'Talla única.', 250.00, '/img/products/merch.webp', 40, 0, 'piece')
) AS v(slug, nombre, descripcion, precio_kg, imagen, stock, minimo, unidad);
"""


class SeedParserTests(TestCase):
    """`panel.preview_catalog.parse_seed`: the bounded reader the preview seed uses."""

    def test_it_reads_categories_and_products_with_their_values(self):
        from panel.preview_catalog import parse_seed

        catalog = parse_seed(SMALL_SEED)

        self.assertEqual(
            [(c.name, c.slug, c.image_url, c.is_active, c.order) for c in catalog.categories],
            [("Carnes Rojas", "carnes-rojas", "/img/products/res.webp", True, 1),
             ("Merch", "merch", "/img/products/merch.webp", False, 2)],
        )  # fmt: skip
        first, second = catalog.products
        self.assertEqual(first.name, "Bistec de Res")
        self.assertEqual(first.category_slug, "carnes-rojas")
        self.assertEqual(first.description, "El de diario, con 'comillas' -- y guiones.")
        self.assertEqual(first.price_per_kg, Decimal("289.00"))
        self.assertEqual(first.image_url, "/img/products/res.webp")
        self.assertEqual(first.stock, Decimal("80"))
        self.assertEqual(first.min_quantity_kg, Decimal("0.250"))
        self.assertTrue(first.is_active)
        self.assertEqual(first.price_unit, "kg")
        self.assertEqual((second.name, second.min_quantity_kg), ("Gorra", Decimal("0")))
        self.assertEqual(second.price_unit, "piece")

    def test_it_refuses_a_unit_the_table_does_not_allow(self):
        from panel.preview_catalog import SeedFormatError, parse_seed

        with self.assertRaises(SeedFormatError):
            parse_seed(SMALL_SEED.replace("40, 0, 'piece')", "40, 0, 'litro')"))

    def test_prices_are_decimals_never_floats(self):
        from panel.preview_catalog import parse_seed

        for product in parse_seed(SMALL_SEED).products:
            self.assertIsInstance(product.price_per_kg, Decimal)

    def test_it_refuses_a_seed_whose_columns_changed(self):
        from panel.preview_catalog import SeedFormatError, parse_seed

        changed = [
            SMALL_SEED.replace("minimo, unidad)", "minimo, unidad, extra)"),
            SMALL_SEED.replace('is_active, "order")', 'is_active, "order", extra)'),
            SMALL_SEED.replace("    v.imagen,\n    v.stock,", "    v.stock,\n    v.imagen,"),
            SMALL_SEED.replace("stock_unit, sale_modes)", "stock_unit)"),
        ]
        for text in changed:
            with self.subTest(text=text[:0]), self.assertRaises(SeedFormatError):
                parse_seed(text)

    def test_it_refuses_a_row_with_the_wrong_number_of_values(self):
        from panel.preview_catalog import SeedFormatError, parse_seed

        with self.assertRaises(SeedFormatError):
            parse_seed(
                SMALL_SEED.replace("250.00, '/img/products/merch.webp', 40, 0, 'piece')", "250.00)")
            )

    def test_it_refuses_a_product_whose_category_is_not_in_the_seed(self):
        from panel.preview_catalog import SeedFormatError, parse_seed

        with self.assertRaises(SeedFormatError):
            parse_seed(SMALL_SEED.replace("('merch', 'Gorra'", "('ropa', 'Gorra'"))

    def test_it_refuses_text_it_does_not_understand_inside_a_row(self):
        from panel.preview_catalog import SeedFormatError, parse_seed

        with self.assertRaises(SeedFormatError):
            parse_seed(SMALL_SEED.replace("80, 0.250, 'kg')", "now(), 0.250, 'kg')"))

    def test_it_refuses_any_other_statement_that_writes_the_catalogue(self):
        from panel.preview_catalog import SeedFormatError, parse_seed

        extra = [
            "UPDATE products SET price_per_kg = 1;",
            "update public.products set is_active = false;",
            "INSERT INTO products (name) VALUES ('Otra');",
            "DELETE FROM products WHERE name = 'Gorra';",
            "ALTER TABLE products ALTER COLUMN price_unit SET DEFAULT 'piece';",
            "COPY products FROM '/tmp/x.csv';",
            "UPDATE categories SET is_active = false;",
            "DO $$ BEGIN UPDATE products SET stock = 0; END $$;",
        ]
        for statement in extra:
            for text in (SMALL_SEED + "\n" + statement + "\n", statement + "\n" + SMALL_SEED):
                with self.subTest(statement=statement), self.assertRaises(SeedFormatError):
                    parse_seed(text)

    def test_it_accepts_the_checks_that_only_read(self):
        from panel.preview_catalog import parse_seed

        checks = "DO $$ BEGIN PERFORM 1 FROM products; END $$;\n-- UPDATE products in a comment\n"

        self.assertEqual(len(parse_seed(SMALL_SEED + checks).products), 2)

    def test_it_refuses_digits_that_are_not_ascii(self):
        from panel.preview_catalog import SeedFormatError, parse_seed

        with self.assertRaises(SeedFormatError):
            parse_seed(SMALL_SEED.replace("289.00,", "\u0662\u0668\u0669.00,"))

    def test_the_real_seed_and_the_fixture_give_one_catalogue(self):
        from panel.preview_catalog import load_catalog

        catalog = load_catalog()

        self.assertEqual(
            {(c.name, c.slug, c.image_url, c.is_active, c.order) for c in catalog.categories},
            seed_sql_categories(),
        )
        self.assertEqual(
            {p.name: (p.category_slug, p.price_per_kg, p.image_url, p.is_active, p.description,
                      p.stock, p.min_quantity_kg)
             for p in catalog.products},
            seed_sql_products(),
        )  # fmt: skip

    def test_loading_refuses_a_fixture_that_disagrees_with_the_seed(self):
        from panel import preview_catalog

        fixture = json.loads(CATEGORY_FIXTURE.read_text(encoding="utf-8"))
        fixture[0]["fields"]["name"] = "Res"
        with (
            mock.patch.object(preview_catalog, "read_fixture_categories", return_value=fixture),
            self.assertRaises(preview_catalog.SeedFormatError),
        ):
            preview_catalog.load_catalog()


@override_settings(
    ROOT_URLCONF="config.urls_preview", CARNI_PREVIEW=True, REVIEW_INVITES_ENABLED=True
)
class PreviewCatalogContractTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("preview_seed", verbosity=0)

    def setUp(self):
        patcher = mock.patch("ventas.services.get_gateway", return_value=PreviewGateway())
        patcher.start()
        self.addCleanup(patcher.stop)

    def pages(self, path):
        """Every page of a paginated list: [(response, objects of the page)]."""
        first = self.client.get(path)
        self.assertEqual(first.status_code, 200, path)
        result = [(first, list(first.context["page_obj"]))]
        for number in range(2, first.context["page_obj"].paginator.num_pages + 1):
            response = self.client.get(f"{path}?page={number}")
            self.assertEqual(response.status_code, 200, f"{path}?page={number}")
            result.append((response, list(response.context["page_obj"])))
        return result

    def assert_no_invented_name(self, response, where):
        # As the whole text of an element or an attribute: a real description may say "Bistec
        # de res" ("Bistec Adobado" does), a product name is never part of a longer text.
        html = response.content.decode()
        for name in INVENTED_NAMES:
            for shape in (f">{escape(name)}<", f'"{escape(name)}"', f" {escape(name)}<"):
                self.assertNotIn(shape, html, f"{name!r} on {where}")

    # (a) the database
    def test_database_products_are_exactly_the_seed_sql_catalogue(self):
        self.assertEqual(database_products(), seed_sql_products())

    def test_database_categories_are_the_seed_sql_categories(self):
        rows = {(c.name, c.slug, c.image_url, c.is_active, c.order) for c in Category.objects.all()}

        self.assertEqual(rows, seed_sql_categories())

    def test_kilo_products_keep_the_schema_default_of_sale_modes(self):
        default = schema_default_sale_modes()

        for product in Product.objects.filter(price_unit="kg"):
            with self.subTest(product=product.name):
                self.assertEqual(sorted(product.sale_modes), default)

    def test_every_product_has_the_unit_stock_unit_and_modes_of_the_schema_rule(self):
        for product in Product.objects.select_related("category"):
            with self.subTest(product=product.name):
                unit = schema_rule_unit(product.name, product.category.slug)
                self.assertEqual(
                    (product.price_unit, product.stock_unit, list(product.sale_modes)),
                    schema_rule_row(unit),
                )

    def test_merchandise_packages_and_the_carnitas_kilo_have_their_unit(self):
        def row(name):
            product = Product.objects.get(name=name)
            return product.price_unit, list(product.sale_modes)

        self.assertEqual(row("Gorra Bordada"), ("piece", ["pieces"]))
        self.assertEqual(row("Paquete Asador 4 a 6 Personas"), ("package", ["pieces"]))
        self.assertEqual(row("Paquete Carnitas por Kilo"), ("kg", ["money", "weight"]))

    # (b) the store
    def test_store_catalogue_lists_exactly_the_active_products_with_their_values(self):
        expected = {
            p.name: (p.price_per_kg, p.image_src) for p in Product.objects.filter(is_active=True)
        }
        shown = {}
        for response, products in self.pages("/productos/"):
            html = response.content.decode()
            for product in products:
                shown[product.name] = (product.price_per_kg, product.image_src)
                self.assertIn(escape(product.name), html)
                self.assertIn(f"${floatformat(product.price_per_kg, '-2')}", html)
                self.assertIn(f'src="{product.image_src}"', html)
            self.assert_no_invented_name(response, "/productos/")

        self.assertEqual(shown, expected)

    def test_store_product_page_offers_the_sale_modes_of_the_database(self):
        for product in Product.objects.filter(is_active=True):
            with self.subTest(product=product.name):
                response = self.client.get(f"/productos/{product.pk}/")

                self.assertEqual(response.status_code, 200)
                modes = {mode for mode, _label in response.context["modes"]}
                self.assertEqual(modes, set(product.sale_modes))
                self.assertIn(f'src="{product.image_src}"', response.content.decode())

    # (c) the panel
    def test_panel_product_list_shows_every_product_with_its_price(self):
        sign_in_preview_admin(self.client)
        expected = {p.name: p.price_per_kg for p in Product.objects.all()}
        shown = {}
        for response, products in self.pages("/panel/productos/"):
            html = response.content.decode()
            for product in products:
                shown[product.name] = product.price_per_kg
                self.assertIn(escape(product.name), html)
                self.assertIn(f"${floatformat(product.price_per_kg, '2g')}", html)
            self.assert_no_invented_name(response, "/panel/productos/")

        self.assertEqual(shown, expected)

    def test_panel_product_page_shows_the_price_and_the_picture(self):
        sign_in_preview_admin(self.client)
        for product in Product.objects.all():
            with self.subTest(product=product.name):
                html = self.client.get(f"/panel/productos/{product.pk}/").content.decode()

                self.assertIn(escape(product.name), html)
                self.assertIn(f"${floatformat(product.price_per_kg, '2g')}", html)
                self.assertIn(f'src="{product.image_src}"', html)

    def test_panel_counter_sale_lists_the_active_products_with_price_and_modes(self):
        sign_in_preview_admin(self.client)
        expected = {
            p.name: (p.price_per_kg, set(p.sale_modes))
            for p in Product.objects.filter(is_active=True)
        }
        shown = {}
        for response, products in self.pages("/panel/ventas/nueva/"):
            for product in products:
                shown[product.name] = (product.price_per_kg, {m for m, _ in product.modes})
            self.assert_no_invented_name(response, "/panel/ventas/nueva/")

        self.assertEqual(shown, expected)

    def test_panel_discount_form_offers_every_product(self):
        sign_in_preview_admin(self.client)

        response = self.client.get("/panel/descuentos/")

        offered = {p.name for p in response.context["form"].fields["product"].queryset}
        self.assertEqual(offered, set(seed_sql_products()))
        self.assert_no_invented_name(response, "/panel/descuentos/")

    def test_panel_pages_that_name_products_only_name_real_ones(self):
        sign_in_preview_admin(self.client)
        real = set(seed_sql_products())
        home = self.client.get("/panel/")
        purchases = self.client.get("/panel/compras/")

        self.assertTrue({row["producto"] for row in home.context["metrics"]["top5"]} <= real)
        self.assertTrue({row["product_name"] for row in purchases.context["lots"]} <= real)
        for path in ("/panel/", "/panel/compras/", "/panel/pedidos/", "/panel/mas/"):
            with self.subTest(path=path):
                self.assert_no_invented_name(self.client.get(path), path)

    # (d) orders, the only synthetic rows that name products
    def test_every_order_line_names_a_real_product_at_its_real_price(self):
        products = {p.pk: p for p in Product.objects.all()}

        lines = [line for order in PanelOrder.objects.all() for line in order.lines]

        self.assertTrue(lines)
        for line in lines:
            with self.subTest(line=line["product_name"]):
                product = products[line["product_id"]]
                self.assertEqual(line["product_name"], product.name)
                self.assertEqual(Decimal(line["unit_price"]), product.price_per_kg)

    def test_no_invented_name_is_in_the_database(self):
        names = set(Product.objects.values_list("name", flat=True))
        names |= {line["product_name"] for o in PanelOrder.objects.all() for line in o.lines}

        self.assertEqual(names & set(INVENTED_NAMES), set())
