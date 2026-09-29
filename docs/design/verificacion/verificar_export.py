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
    # --- loop-completo.md (A, B, C) ---
    ('"miniatura pendiente" / "foto pendiente" / "por tomar"', "0", r"miniatura pendiente|foto pendiente|por tomar", True, lambda n: n == 0),
    ("Índice con miniaturas (thumbs-*.jpg o iframe)", ">=16", r"<iframe|thumbs[-/][\w-]+\.(jpg|png)", False, lambda n: n >= 16),
    ("Landing: sección Comentarios", ">=1", r">\s*Comentarios\s*<", True, lambda n: n > 0),
    ("Landing: carrusel (scroll-snap)", ">=1", r"scroll-snap", False, lambda n: n > 0),
    ("Landing: puntaje (estrellas / opiniones)", ">=1", r"opiniones|★", True, lambda n: n > 0),
    ("Movimiento: curva de hojas", ">=1", r"cubic-bezier\(0\.32,\s?0\.72,\s?0,\s?1\)", False, lambda n: n > 0),
    ("Acceso: 480 ms", ">=1", r"480\s?ms", False, lambda n: n > 0),
    ("Portada: video portada-carne.mp4", ">=1", r"portada-carne\.mp4", False, lambda n: n > 0),
    ('"Foto ilustrativa"', ">=1", r"Foto ilustrativa", False, lambda n: n > 0),
    ('"Pocas piezas"', ">=1", r"Pocas piezas", False, lambda n: n > 0),
    ('"Es todo lo disponible"', ">=1", r"Es todo lo disponible", False, lambda n: n > 0),
    ('"Frutas y verduras" visible', "0", r"Frutas y verduras", True, lambda n: n == 0),
    ('"Especias" visible', "0", r"\bEspecias\b", True, lambda n: n == 0),
    ('"Pagar al recoger o al recibir"', ">=1", r"Pagar al recoger o al recibir", False, lambda n: n > 0),
    ("Mínimo a domicilio $150", ">=1", r"\$150\b", False, lambda n: n > 0),
    ('"¿Tienes un código?"', ">=1", r"¿Tienes un c[oó]digo\?", False, lambda n: n > 0),
    ("Acceso: arco y paneles de la mascota", ">=2", r"arch-(escritorio|movil)|panel-(escritorio|movil)-", False, lambda n: n >= 2),
    ('Chatbot: "me sirvió"', ">=1", r"me sirvi[oó]", False, lambda n: n > 0),
    ('Chatbot: "Enseñar la respuesta"', ">=1", r"Enseñar la respuesta", False, lambda n: n > 0),
    ('Chatbot: "Pasar a preguntas frecuentes"', ">=1", r"Pasar a preguntas frecuentes", False, lambda n: n > 0),
    ('Chatbot: "Corregir"', ">=1", r"\bCorregir\b", False, lambda n: n > 0),
    ("Chatbot: teléfono enmascarado", ">=1", r"•\s?•\s?34|••34", False, lambda n: n > 0),
    ('Ayudante: "¿cuánto vendí esta semana?"', ">=1", r"cu[aá]nto vend[ií] esta semana", False, lambda n: n > 0),
    ("AdminNav: Clientes · Chatbot · BuildAds", ">=1", r"Clientes['\"]?\s*,\s*['\"]?Chatbot['\"]?\s*,\s*['\"]?BuildAds", False, lambda n: n > 0),
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
    # Landing section order requested by Eduardo (2026-09-29), checked after "Landing completa".
    order = ["Todo lo del mostrador", "Filete Mignon", "Lo que se lleva la gente", "Ofertas",
             "Preguntas frecuentes", "Carnicería de familia", "Horario", "Contacto", "Comentarios"]
    landing = next((visible(t) for n, t in pages.items() if "Landing" in n), "")
    tail = landing[landing.find("Landing completa"):] if "Landing completa" in landing else landing
    tail = re.sub(r"<[^>]+>", " ", tail)
    pos = [tail.find(s) for s in order]
    in_order = all(p >= 0 for p in pos) and pos == sorted(pos)
    rows.append(("Landing: orden de secciones", " → ".join(order), str(pos), "✓" if in_order else "✗", "Landing.dc.html"))
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
