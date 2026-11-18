"""Tests of the landing bento, the proportions of the hero video and the motion script.

The bento shows the active categories as photos of nine different sizes in one section (Eduardo,
L7: "todas las imágenes tienen que estar de diferente tamaño"), each a link to its filtered list.
The hero keeps the 16:9 video whole instead of cropping it to the viewport. The motion comes from
one external script (GSAP and ScrollTrigger, served by the site), never inline.
"""

import re

from django.test import TestCase
from django.urls import reverse

from inventory.models import Category
from ventas.views_landing import BENTO_SLOTS

SLUGS = (
    "carnes-rojas",
    "cortes-especiales",
    "pollo",
    "embutidos",
    "cerdo",
    "otros",
    "merch",
    "ofertas",
    "preparadas",
)


class BentoTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        for order, slug in enumerate(SLUGS):
            Category.objects.create(name=slug.title(), slug=slug, order=order)
        Category.objects.create(name="Oculta", slug="oculta", is_active=False)

    def setUp(self):
        self.html = self.client.get(reverse("ventas:landing")).content.decode()
        self.section = self.html[self.html.index('id="bento"') :]
        self.section = self.section[: self.section.index("</section>")]

    def test_the_nine_slots_have_nine_different_sizes(self):
        sizes = [(slot["cols"], slot["rows"]) for slot in BENTO_SLOTS.values()]

        self.assertEqual(len(sizes), 9)
        self.assertEqual(len(set(sizes)), 9)
        self.assertEqual(sum(cols * rows for cols, rows in sizes), 6 * 6)

    def test_each_active_category_is_a_photo_tile_with_its_link(self):
        tiles = re.findall(r'<a [^>]*class="bento-tile bento-([a-i]) ', self.section)

        self.assertEqual(sorted(tiles), list("abcdefghi"))
        for slug in SLUGS:
            pk = Category.objects.get(slug=slug).pk
            self.assertIn(f'href="/productos/?category={pk}"', self.section)
        self.assertEqual(self.section.count("<img "), 9)
        self.assertNotIn("Oculta", self.section)

    def test_every_photo_has_its_text_alternative_and_size(self):
        for img in re.findall(r"<img [^>]+>", self.section):
            with self.subTest(img=img[:60]):
                self.assertRegex(img, r'alt="[^"]+"')
                self.assertRegex(img, r'width="\d+" height="\d+"')

    def test_a_category_the_bento_does_not_know_still_shows_after_the_nine(self):
        nueva = Category.objects.create(name="Mariscos", slug="mariscos", order=99)

        html = self.client.get(reverse("ventas:landing")).content.decode()

        self.assertRegex(
            html, rf'<a href="/productos/\?category={nueva.pk}" class="bento-tile bento-x '
        )

    def test_the_old_tile_mosaic_is_gone(self):
        self.assertNotIn("gap-px", self.section)
        self.assertNotIn('id="categorias-titulo"', self.html)


class HeroAndMotionTests(TestCase):
    def setUp(self):
        self.html = self.client.get(reverse("ventas:landing")).content.decode()

    def test_the_video_frame_keeps_16_by_9(self):
        self.assertRegex(self.html, r'data-hero-media class="[^"]*\baspect-video\b')

    def test_the_motion_script_is_external_and_served_by_the_site(self):
        for name in ("vendor/gsap/gsap.min.js", "vendor/gsap/ScrollTrigger.min.js", "landing.js"):
            with self.subTest(name=name):
                self.assertRegex(self.html, rf'<script [^>]*src="/static/tienda/{re.escape(name)}"')
        self.assertNotRegex(self.html, r"<script(?![^>]*\bsrc=)[^>]*>")

    def test_the_headline_is_split_into_words_for_its_entrance(self):
        words = re.findall(r"<span data-word[^>]*>([^<]+)</span>", self.html)

        self.assertEqual(" ".join(words), "Carne fresca, cortada como la pides")
