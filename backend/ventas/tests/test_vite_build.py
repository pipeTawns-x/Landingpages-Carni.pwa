"""The committed Vite build: its manifest has every page entry and the tag resolves each one.

`npm run build:django` compiles src/entry/*.tsx into backend/static/vite/ and commits the output,
like static/panel/panel.css. These tests read that real output, so a missing build or a forgotten
entry fails here instead of in a template at request time.
"""

import json
from pathlib import Path

from django.conf import settings
from django.template import Context, Template
from django.test import SimpleTestCase

from ventas.templatetags import vite as vite_tags

VITE_DIR = Path(settings.BASE_DIR) / "static" / "vite"
MANIFEST = VITE_DIR / ".vite" / "manifest.json"
PAGE_ENTRIES = [
    "src/entry/home.tsx",
    "src/entry/products.tsx",
    "src/entry/auth.tsx",
    "src/entry/dashboard.tsx",
]


def render(entry):
    return Template("{% load vite %}{% vite_asset entry %}").render(Context({"entry": entry}))


class ViteBuildOutputTests(SimpleTestCase):
    def setUp(self):
        vite_tags.clear_cache()
        self.addCleanup(vite_tags.clear_cache)

    def test_manifest_exists_and_has_one_entry_per_page(self):
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

        for entry in PAGE_ENTRIES:
            with self.subTest(entry=entry):
                self.assertIn(entry, manifest)
                self.assertTrue(manifest[entry].get("isEntry"))

    def test_every_file_the_manifest_names_exists_on_disk(self):
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

        for key, chunk in manifest.items():
            for name in [chunk["file"], *chunk.get("css", []), *chunk.get("assets", [])]:
                with self.subTest(chunk=key, file=name):
                    self.assertTrue((VITE_DIR / name).is_file())

    def test_tag_resolves_each_page_entry_to_its_hashed_script(self):
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

        for entry in PAGE_ENTRIES:
            with self.subTest(entry=entry):
                html = render(entry)
                self.assertIn(
                    f'<script type="module" src="/static/vite/{manifest[entry]["file"]}">', html
                )
