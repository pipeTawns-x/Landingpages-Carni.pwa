"""Tests of the motion of the landing page (`ventas:landing`, /).

The motion ships in the single Vite entry of the page (GSAP and ScrollTrigger are bundled by
`npm run build:django`), never in an inline script and never in a script of the parallel store.
"""

import re

from django.test import TestCase

from inventory.models import Category
from ventas.negocio import NEGOCIO


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


class MotionHooksTests(TestCase):
    """The markup the scroll choreography (src/landing/landing-motion.ts) hangs on.

    The page is complete and still without the script: nothing in the markup hides anything. The
    hooks are data attributes, so a class rename in the CSS cannot silently stop the motion.
    """

    @classmethod
    def setUpTestData(cls):
        for order, slug in enumerate(("carnes-rojas", "cerdo", "pollo"), start=1):
            Category.objects.create(name=slug.title(), slug=slug, order=order)
        Category.objects.create(name="Oculta", slug="oculta", is_active=False)

    def setUp(self):
        self.html = self.client.get("/").content.decode()

    def test_the_hero_video_sits_in_a_frame_that_opens(self):
        self.assertRegex(
            self.html, r"<div class=\"home-hero-video__frame\" data-hero-frame>\s*<video"
        )

    def test_the_kinetic_strip_has_two_lines_that_slide_in_opposite_directions(self):
        strip = re.search(r'<div class="landing-kinetic"[^>]*>(.*?)</div>', self.html, re.DOTALL)

        self.assertIsNotNone(strip)
        self.assertIn('aria-hidden="true"', strip.group(0))
        self.assertIn('<p data-kinetic-line="1">', strip.group(1))
        self.assertIn('<p data-kinetic-line="-1">', strip.group(1))
        self.assertIn(NEGOCIO["lema"], strip.group(1))

    def test_each_active_category_tile_is_a_hook_for_the_wipe(self):
        self.assertEqual(self.html.count("data-bento-tile"), 3)

    def test_the_cards_and_the_questions_are_hooks_for_the_rise(self):
        # Three about cards, three contact cards and the three questions.
        self.assertEqual(self.html.count("data-rise"), 9)

    def test_the_markup_hides_nothing_before_the_script_runs(self):
        self.assertNotRegex(self.html, r"<[^>]+\bhidden\b[^>]*data-(rise|bento-tile|kinetic)")
        self.assertNotRegex(self.html, r"<[^>]+data-(rise|bento-tile|kinetic)[^>]*\bhidden\b")
