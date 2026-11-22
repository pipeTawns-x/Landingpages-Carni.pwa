"""`{% vite_asset "js/entries/home.js" %}`: the tags one Vite entry needs, read from its manifest.

Vite compiles the store's JavaScript and CSS (React islands, Tailwind, GSAP, Motion) into
static/vite/ with `npm run build:django`, and writes .vite/manifest.json next to them. That
output is committed, like static/panel/panel.css, so Django never needs Node at runtime and
collectstatic serves it with the rest. This tag maps a source entry to its hashed files.
"""

import json
from functools import lru_cache
from pathlib import Path

from django import template
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.templatetags.static import static
from django.utils.html import format_html, format_html_join
from django.utils.safestring import mark_safe

register = template.Library()

STATIC_PREFIX = "vite/"


def _manifest_path():
    default = Path(settings.BASE_DIR) / "static" / "vite" / ".vite" / "manifest.json"
    return Path(getattr(settings, "VITE_MANIFEST_PATH", default))


@lru_cache(maxsize=1)
def _load(path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise ImproperlyConfigured(
            f"The Vite manifest {path} does not exist. Build it from the repo root with "
            "`npm run build:django`."
        ) from error


def clear_cache():
    """Forget the cached manifest, so the next render reads the file again."""
    _load.cache_clear()


def _manifest():
    path = _manifest_path()
    if settings.DEBUG:
        clear_cache()
    return _load(str(path))


def _url(file):
    return static(STATIC_PREFIX + file)


def _walk(manifest, key, seen):
    """The CSS files and the imported chunks of one entry, depth first, each listed once."""
    styles, chunks = [], []
    for name in manifest[key].get("imports", []):
        if name in seen:
            continue
        seen.add(name)
        chunk_styles, chunk_chunks = _walk(manifest, name, seen)
        chunks.append(manifest[name]["file"])
        styles.extend(chunk_styles)
        chunks.extend(chunk_chunks)
    return list(manifest[key].get("css", [])) + styles, chunks


@register.simple_tag
def vite_asset(entry):
    manifest = _manifest()
    if entry not in manifest:
        raise ImproperlyConfigured(
            f"{entry} is not an entry of the Vite manifest. Add it to build.rollupOptions.input "
            "in vite.config.js and run `npm run build:django`."
        )
    styles, chunks = _walk(manifest, entry, {entry})
    parts = [
        format_html_join("", '<link rel="stylesheet" href="{}">', ((_url(f),) for f in styles)),
        format_html_join("", '<link rel="modulepreload" href="{}">', ((_url(f),) for f in chunks)),
        format_html('<script type="module" src="{}"></script>', _url(manifest[entry]["file"])),
    ]
    return mark_safe("".join(parts))
