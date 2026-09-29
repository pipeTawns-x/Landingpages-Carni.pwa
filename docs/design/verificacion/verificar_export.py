"""Check a Claude Design export (.zip) against the pass-1 acceptance list.

Usage: /opt/anaconda3/bin/python3 docs/design/verificacion/verificar_export.py ~/Downloads/<export>.zip [report.md]

The zip is read in memory: `unzip` breaks on accented names (Í, ñ).
Negative checks ignore <script> blocks, because the Bitácora lives there as
data and quotes old values ("href=#: 87 → 0"), which caused false positives.
"""
import html
import posixpath
import re
import sys
import zipfile


def load(zip_path):
    z = zipfile.ZipFile(zip_path)
    names = z.namelist()
    pages = {n: z.read(n).decode("utf-8", "ignore") for n in names if n.endswith((".html", ".htm"))}
    return names, pages


def visible(text):
    return re.sub(r"<script\b.*?</script>", " ", text, flags=re.S | re.I)


def count(pages, pattern, only_visible=False):
    total, where = 0, []
    for name, text in pages.items():
        n = len(re.findall(pattern, visible(text) if only_visible else text, re.I))
        if n:
            total += n
            where.append(f"{posixpath.basename(name)}({n})")
    return total, where


# (label, expected, pattern, only_visible, predicate)
CHECKS = [
    ('href="#"', "0", r"href=[\"']#[\"']", True, lambda n: n == 0),
    ("Mis datos", ">=1", r"Mis datos", False, lambda n: n > 0),
    ("Datos de la tienda y redes", ">=1", r"Datos de la tienda", False, lambda n: n > 0),
    ("Zonas de entrega", ">=1", r"Zonas de entrega", False, lambda n: n > 0),
    ("Logo tipográfico", ">=1", r"SEÑOR DE LA MISERICORDIA", False, lambda n: n > 0),
    ("Logo en imagen", "0", r"<img[^>]+(letrero|sello|logo)[^>]*>", True, lambda n: n == 0),
    ("Monograma", ">=1", r"monograma", False, lambda n: n > 0),
    ("Facebook real", ">=2", r"profile\.php\?id=100054786668816", False, lambda n: n >= 2),
    ("Instagram real", ">=2", r"instagram\.com/carniceria\.misericordia", False, lambda n: n >= 2),
    ("WhatsApp real", ">=2", r"wa\.me/524442715470", False, lambda n: n >= 2),
    ("Anticipo 50 %", ">=3", r"50\s?%\s?de anticipo", False, lambda n: n >= 3),
    ("Catálogo de la semana", ">=1", r"Cat[aá]logo de la semana", False, lambda n: n > 0),
    ("Eje $15k", ">=1", r"\$15k", False, lambda n: n > 0),
    ('"picaña" visible', "0", r"pica[ñn]a", True, lambda n: n == 0),
    ('"Paquete Carnitas por Kilo"', "0", r"Paquete Carnitas por Kilo", True, lambda n: n == 0),
    ('"kcal por día"', "0", r"kcal por d[ií]a", True, lambda n: n == 0),
    ("Bitácora PARCIAL", "0", r"PARCIAL", False, lambda n: n == 0),
    ("Miniaturas dinámicas {{ p.mini }}", "0", r"\{\{\s*p\.mini\s*\}\}", False, lambda n: n == 0),
    ('"salmón" como ejemplo sin resultados', ">=1", r"salm[oó]n", False, lambda n: n > 0),
    # Pass 2
    ("P2 · curva del Encabezado y la Tarjeta", ">=1", r"cubic-bezier\(0\.23,\s?1,\s?0\.32,\s?1\)", False, lambda n: n > 0),
    ("P2 · curva de las hojas", ">=1", r"cubic-bezier\(0\.32,\s?0\.72,\s?0,\s?1\)", False, lambda n: n > 0),
    ("P2 · video de portada", ">=1", r"portada-carne\.mp4", False, lambda n: n > 0),
    ("P2 · contraste medido sobre el cuadro claro", ">=1", r"portada-carne-cuadro-claro", False, lambda n: n > 0),
    ("P2 · Pagar al recoger o al recibir", ">=1", r"Pagar al recoger o al recibir", False, lambda n: n > 0),
    ("P2 · Pocas piezas", ">=1", r"Pocas piezas", False, lambda n: n > 0),
    ("P2 · Es todo lo disponible", ">=1", r"Es todo lo disponible", False, lambda n: n > 0),
    ("P2 · foto pendiente", ">=10", r"foto pendiente", False, lambda n: n >= 10),
    # Pass 3
    ("P3 · curva del Acceso", ">=1", r"cubic-bezier\(0\.77,\s?0,\s?0\.175,\s?1\)", False, lambda n: n > 0),
    ("P3 · mascota nueva", ">=1", r"(panel-escritorio|panel-movil|carnicero)-(ingresar|registro)", False, lambda n: n > 0),
    ("P3 · Chatbot entre Clientes y BuildAds", ">=1", r"Clientes['\"],\s*['\"]Chatbot['\"],\s*['\"]BuildAds", False, lambda n: n > 0),
    ("P3 · Corregir", ">=1", r"Corregir", False, lambda n: n > 0),
    ('P3 · "me sirvió"', ">=1", r"me sirvi[oó]", False, lambda n: n > 0),
    ("P3 · Enseñar la respuesta", ">=1", r"Enseñar la respuesta", False, lambda n: n > 0),
    ("P3 · Pasar a preguntas frecuentes", ">=1", r"Pasar a preguntas frecuentes", False, lambda n: n > 0),
    ("P3 · teléfono enmascarado", ">=1", r"•••", False, lambda n: n > 0),
    # Close (3.3)
    ("Cierre · miniaturas con iframe", ">=40", r"<iframe[^>]+\.dc\.html", False, lambda n: n >= 40),
    ("Cierre · REDISEÑO COMPLETO", ">=1", r"REDISEÑO COMPLETO", False, lambda n: n > 0),
]


def main():
    zip_path = sys.argv[1]
    report = sys.argv[2] if len(sys.argv) > 2 else None
    names, pages = load(zip_path)
    rows = []
    for label, expected, pattern, only_visible, ok in CHECKS:
        n, where = count(pages, pattern, only_visible)
        rows.append((label, expected, n, "✓" if ok(n) else "✗", ", ".join(where[:4])))
    present = set(names)
    broken = []
    for name, text in pages.items():
        base = posixpath.dirname(name)
        for src in re.findall(r"<img[^>]+src=[\"']([^\"']+)", text, re.I):
            if src.startswith(("http", "data:", "//")) or "{" in src:
                continue
            if posixpath.normpath(posixpath.join(base, html.unescape(src))) not in present:
                broken.append(f"{posixpath.basename(name)} → {src}")
    passed = sum(r[3] == "✓" for r in rows)
    lines = [f"**{passed} de {len(rows)} criterios cumplen.** Imágenes locales rotas: {len(broken)}.", "",
             "| Criterio | Esperado | Encontrado | Estado | Dónde |", "|---|---|---|---|---|"]
    lines += [f"| {a} | {b} | {c} | {d} | {e} |" for a, b, c, d, e in rows]
    out = "\n".join(lines) + "\n"
    print(out)
    if report:
        with open(report, "w", encoding="utf-8") as f:
            f.write(f"# Verificación de {posixpath.basename(zip_path)}\n\n{out}")


if __name__ == "__main__":
    main()
