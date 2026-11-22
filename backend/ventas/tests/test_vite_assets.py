"""The bridge between Vite and Django: `{% vite_asset %}` reads the Vite manifest.

Vite compiles each page's JavaScript and CSS into static/vite/ and writes a manifest that maps
the source entry to its hashed files. The tag turns one entry into the tags a page needs: the
stylesheets first, a modulepreload per shared chunk, and the module script.
"""

import json
import tempfile
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.template import Context, Template
from django.test import SimpleTestCase, override_settings

from ventas.templatetags import vite as vite_tags

MANIFEST = {
    "src/entry/home.tsx": {
        "file": "assets/home-a1b2.js",
        "src": "src/entry/home.tsx",
        "isEntry": True,
        "imports": ["_motion-c3d4.js"],
        "css": ["assets/home-e5f6.css"],
    },
    "_motion-c3d4.js": {
        "file": "assets/motion-c3d4.js",
        "css": ["assets/motion-0a0b.css"],
    },
    "src/entry/auth.tsx": {
        "file": "assets/access-1111.js",
        "src": "src/entry/auth.tsx",
        "isEntry": True,
    },
}


def render(source):
    return Template("{% load vite %}" + source).render(Context())


class ViteAssetTagTests(SimpleTestCase):
    def setUp(self):
        folder = tempfile.TemporaryDirectory()
        self.addCleanup(folder.cleanup)
        self.manifest = Path(folder.name) / "manifest.json"
        self.manifest.write_text(json.dumps(MANIFEST), encoding="utf-8")
        override = override_settings(VITE_MANIFEST_PATH=self.manifest, STATIC_URL="/static/")
        override.enable()
        self.addCleanup(override.disable)
        vite_tags.clear_cache()
        self.addCleanup(vite_tags.clear_cache)

    def test_entry_renders_its_styles_preloads_and_module_script_in_order(self):
        html = render('{% vite_asset "src/entry/home.tsx" %}')

        expected = [
            '<link rel="stylesheet" href="/static/vite/assets/home-e5f6.css">',
            '<link rel="stylesheet" href="/static/vite/assets/motion-0a0b.css">',
            '<link rel="modulepreload" href="/static/vite/assets/motion-c3d4.js">',
            '<script type="module" src="/static/vite/assets/home-a1b2.js"></script>',
        ]
        positions = [html.index(tag) for tag in expected]
        self.assertEqual(positions, sorted(positions))

    def test_entry_without_css_or_imports_renders_only_its_script(self):
        html = render('{% vite_asset "src/entry/auth.tsx" %}').strip()

        expected = '<script type="module" src="/static/vite/assets/access-1111.js"></script>'
        self.assertEqual(html, expected)

    def test_unknown_entry_fails_loudly_and_names_the_entry(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "src/entry/nope.tsx"):
            render('{% vite_asset "src/entry/nope.tsx" %}')

    def test_missing_manifest_fails_loudly_with_the_build_command(self):
        self.manifest.unlink()

        with self.assertRaisesMessage(ImproperlyConfigured, "npm run build:django"):
            render('{% vite_asset "src/entry/home.tsx" %}')

    def test_output_is_safe_html_not_escaped(self):
        html = render('{% vite_asset "src/entry/auth.tsx" %}')

        self.assertNotIn("&lt;", html)
