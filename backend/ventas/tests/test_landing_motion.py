"""Tests of the motion of the landing page (`ventas:landing`, /).

The motion ships in the single Vite entry of the page (GSAP and ScrollTrigger are bundled by
`npm run build:django`), never in an inline script and never in a script of the parallel store.
"""

import re

from django.test import TestCase


class MotionDeliveryTests(TestCase):
    def setUp(self):
        self.html = self.client.get("/").content.decode()

    def test_the_motion_ships_in_the_external_vite_entry(self):
        scripts = re.findall(r"<script\b[^>]*>", self.html)

        self.assertTrue(
            any(
                'type="module"' in tag and 'src="/static/vite/assets/home-' in tag
                for tag in scripts
            )
        )
        for tag in scripts:
            self.assertTrue("src=" in tag or "application/ld+json" in tag, tag)

    def test_no_script_of_the_parallel_store_is_loaded(self):
        self.assertNotIn("/static/tienda/", self.html)
        self.assertNotRegex(self.html, r"vendor/gsap/")
