"""The real catalogue of the store, read from `supabase/seed.sql` for the local preview (S17).

The preview has one source of products: the same seed Supabase loads. This module reads its two
INSERTs, the categories and the products, and nothing else. The reader is deliberately small: it
understands SQL comments, quoted strings, ASCII numbers, booleans and the punctuation of a VALUES
list, checks that the column lists and the SELECT that maps the products are exactly the ones it
knows, refuses any other statement that writes products or categories (a later UPDATE would make
Supabase differ from what it read), and raises `SeedFormatError` on anything else. When seed.sql
changes shape, the preview refuses to start instead of guessing.

Each product row of seed.sql says what its price is for (`unidad`: kg, piece or package); its SELECT
derives `stock_unit` and `sale_modes` from it. Here only that unit is read: `Product.save()` derives
the other two the same way, and `price_per_lb`.

`backend/inventory/fixtures/categories.json` carries the same categories; `load_catalog` refuses
to load when the two disagree.
"""

import json
import re
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SEED_SQL = REPO / "supabase" / "seed.sql"
CATEGORY_FIXTURE = REPO / "backend" / "inventory" / "fixtures" / "categories.json"

CATEGORY_COLUMNS = ("name", "slug", "image_url", "is_active", '"order"')
PRODUCT_COLUMNS = (
    "category_id", "name", "description", "price_per_kg", "price_per_lb",
    "image_url", "stock", "min_quantity_kg", "is_active",
    "price_unit", "stock_unit", "sale_modes",
)  # fmt: skip
VALUES_COLUMNS = (
    "slug", "nombre", "descripcion", "precio_kg", "imagen", "stock", "minimo", "unidad",
)  # fmt: skip
# The values of products.price_unit the table allows (products_price_unit_check).
PRICE_UNITS = ("kg", "piece", "package")
# The SELECT that maps the VALUES list onto PRODUCT_COLUMNS, without spaces.
PRODUCT_SELECT = (
    "(SELECTidFROMcategoriesWHEREslug=v.slug),v.nombre,v.descripcion,v.precio_kg,"
    "ROUND(v.precio_kg*0.4536,2),v.imagen,v.stock,v.minimo,true,v.unidad,"
    "CASEWHENv.unidad='kg'THEN'kg'ELSE'piece'END,"
    "CASEWHENv.unidad='kg'THENARRAY['money','weight']ELSEARRAY['pieces']END"
)

TOKEN = re.compile(
    r"(?P<space>\s+)|(?P<comment>--[^\n]*)|(?P<string>'(?:[^']|'')*')"
    r"|(?P<number>[0-9]+(?:\.[0-9]+)?)|(?P<word>[A-Za-z_][A-Za-z_0-9]*|\"[A-Za-z_]+\")"
    r"|(?P<punct>[(),;])|(?P<other>.)",
    re.DOTALL,
)
# Any statement that writes rows or structure of the two tables this module reads.
WRITE_STATEMENT = re.compile(
    r"\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM|ALTER\s+TABLE|COPY)\s+(?:ONLY\s+)?(?:public\.)?"
    r"(products|categories)\b",
    re.IGNORECASE,
)


class SeedFormatError(ValueError):
    """seed.sql (or the category fixture) is not the shape the preview reader knows."""


@dataclass(frozen=True)
class SeedCategory:
    name: str
    slug: str
    image_url: str
    is_active: bool
    order: int


@dataclass(frozen=True)
class SeedProduct:
    category_slug: str
    name: str
    description: str
    price_per_kg: Decimal
    image_url: str
    stock: Decimal
    min_quantity_kg: Decimal
    price_unit: str
    is_active: bool = True


@dataclass(frozen=True)
class SeedCatalog:
    categories: list
    products: list


def _strip_comments(text):
    """The text without `--` comments, leaving the strings (and any `--` inside them) alone."""
    return "".join(
        match.group() for match in TOKEN.finditer(text) if match.lastgroup not in ("comment",)
    )


def _literal(match):
    kind, raw = match.lastgroup, match.group()
    if kind == "string":
        return raw[1:-1].replace("''", "'")
    if kind == "number":
        return Decimal(raw)
    if kind == "word" and raw.lower() in ("true", "false"):
        return raw.lower() == "true"
    raise SeedFormatError(f"Unexpected value in a VALUES row: {raw!r}")


def _rows(text, width):
    """Read `(lit, ...), (lit, ...)` from the start of `text`. Return the rows and the rest."""
    try:
        return _read_rows(text, width)
    except IndexError:
        raise SeedFormatError("A VALUES list ends in the middle of a row.") from None


def _read_rows(text, width):
    tokens = [m for m in TOKEN.finditer(text) if m.lastgroup not in ("space", "comment")]
    rows, i = [], 0
    while i < len(tokens) and tokens[i].group() == "(":
        row, i = [], i + 1
        while True:
            row.append(_literal(tokens[i]))
            i += 1
            if tokens[i].group() == ")":
                break
            if tokens[i].group() != ",":
                raise SeedFormatError(f"Expected ',' or ')' in a row, got {tokens[i].group()!r}")
            i += 1
        if len(row) != width:
            raise SeedFormatError(f"A row has {len(row)} values, {width} expected: {row[:2]}")
        rows.append(row)
        i += 1
        if i < len(tokens) and tokens[i].group() == ",":
            i += 1
    if not rows:
        raise SeedFormatError("A VALUES list without rows.")
    rest = text[tokens[i].start() :] if i < len(tokens) else ""
    return rows, rest


def _columns(text):
    return tuple(part.strip() for part in text.split(","))


def _section(pattern, text, what):
    found = re.search(pattern, text, re.DOTALL)
    if found is None:
        raise SeedFormatError(f"seed.sql has no {what}.")
    return found


def _refuse_other_writes(text, read):
    """Fail when the text outside the two INSERTs read here writes products or categories.

    Another INSERT, an UPDATE, a DELETE, an ALTER or a COPY (also inside a DO block) would make the
    database Supabase builds differ from what this module returned.
    """
    (cat_start, cat_end), (prod_start, prod_end) = sorted(read)
    outside = text[:cat_start] + "\n" + text[cat_end:prod_start] + "\n" + text[prod_end:]
    found = WRITE_STATEMENT.search(outside)
    if found is not None:
        raise SeedFormatError(
            f"seed.sql writes the catalogue outside its INSERTs: {found.group()!r}"
        )


def parse_seed(text):
    """Read the categories and the products of a seed.sql text. Raise SeedFormatError."""
    text = _strip_comments(text)

    head = _section(r"INSERT INTO categories\s*\(([^)]*)\)\s*VALUES", text, "categories INSERT")
    if _columns(head.group(1)) != CATEGORY_COLUMNS:
        raise SeedFormatError(f"Unexpected category columns: {head.group(1)!r}")
    rows, rest = _rows(text[head.end() :], len(CATEGORY_COLUMNS))
    read = [(head.start(), len(text) - len(rest))]
    categories = [
        SeedCategory(name, slug, image, active, int(order))
        for name, slug, image, active, order in rows
    ]

    head = _section(
        r"INSERT INTO products\s*\(([^)]*)\)\s*SELECT(.*?)FROM\s*\(\s*VALUES",
        text,
        "products INSERT",
    )
    if _columns(head.group(1)) != PRODUCT_COLUMNS:
        raise SeedFormatError(f"Unexpected product columns: {head.group(1)!r}")
    if re.sub(r"\s+", "", head.group(2)) != PRODUCT_SELECT:
        raise SeedFormatError("The SELECT that maps the products changed.")
    rows, rest = _rows(text[head.end() :], len(VALUES_COLUMNS))
    alias = _section(r"^\s*\)\s*AS\s+v\s*\(([^)]*)\)", rest, "VALUES alias")
    if _columns(alias.group(1)) != VALUES_COLUMNS:
        raise SeedFormatError(f"Unexpected VALUES columns: {alias.group(1)!r}")
    read.append((head.start(), len(text) - len(rest) + alias.end()))
    _refuse_other_writes(text, read)

    slugs = {category.slug for category in categories}
    products = []
    for slug, name, description, price, image, stock, minimum, unit in rows:
        if slug not in slugs:
            raise SeedFormatError(f"{name!r} names the category {slug!r}, which is not seeded.")
        if unit not in PRICE_UNITS:
            raise SeedFormatError(
                f"{name!r} has the unit {unit!r}; the table allows {PRICE_UNITS}."
            )
        products.append(SeedProduct(slug, name, description, price, image, stock, minimum, unit))
    return SeedCatalog(categories=categories, products=products)


def read_fixture_categories():
    return json.loads(CATEGORY_FIXTURE.read_text(encoding="utf-8"))


def load_catalog():
    """The catalogue of seed.sql, after checking the category fixture says the same."""
    catalog = parse_seed(SEED_SQL.read_text(encoding="utf-8"))
    fixture = [
        SeedCategory(
            row["fields"]["name"],
            row["fields"]["slug"],
            row["fields"]["image_url"],
            row["fields"]["is_active"],
            row["fields"]["order"],
        )
        for row in read_fixture_categories()
    ]
    if sorted(fixture, key=lambda c: c.order) != sorted(catalog.categories, key=lambda c: c.order):
        raise SeedFormatError("inventory/fixtures/categories.json disagrees with seed.sql.")
    return catalog
