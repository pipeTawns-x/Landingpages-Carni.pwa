"""Tests of the privacy notice (`ventas:privacidad`, /privacidad/), linked from every footer.

It names the business that is responsible, says which data the store keeps and why, and how a
customer exercises the ARCO rights, with the contact the business really answers (phone,
WhatsApp and the shop). It promises nothing the store does not do.
"""

from django.test import TestCase
from django.urls import reverse

from ventas.negocio import NEGOCIO


class PrivacyNoticeTests(TestCase):
    def setUp(self):
        self.response = self.client.get(reverse("ventas:privacidad"))
        self.html = self.response.content.decode()

    def test_anyone_may_read_it(self):
        self.assertEqual(self.response.status_code, 200)
        self.assertTemplateUsed(self.response, "ventas/tienda/privacidad.html")
        self.assertContains(self.response, "<h1", count=1)
        self.assertContains(self.response, "Aviso de privacidad")

    def test_it_names_the_responsible_business_and_its_address(self):
        self.assertContains(self.response, NEGOCIO["nombre"])
        for line in NEGOCIO["direccion"]:
            self.assertContains(self.response, line)

    def test_it_lists_the_data_the_store_keeps_and_what_for(self):
        for text in ("Nombre", "Teléfono", "Dirección de entrega", "preparar y entregar"):
            with self.subTest(text=text):
                self.assertContains(self.response, text)

    def test_it_says_the_data_is_not_sold(self):
        self.assertContains(self.response, "No vendemos ni compartimos tus datos")

    def test_it_explains_the_arco_rights_and_where_to_ask(self):
        for text in ("Acceso", "Rectificación", "Cancelación", "Oposición", "20 días hábiles"):
            with self.subTest(text=text):
                self.assertContains(self.response, text)
        self.assertIn(f'href="{NEGOCIO["telefono_href"]}"', self.html)
        self.assertIn(f'href="{NEGOCIO["whatsapp_href"]}"', self.html)

    def test_it_promises_no_e_mail_and_no_placeholder(self):
        self.assertNotIn("@", self.html.split("<main", 1)[1].split("</main>", 1)[0])
        self.assertNotIn("[", self.html.split("<main", 1)[1].split("</main>", 1)[0])

    def test_every_footer_links_it(self):
        for name in ("ventas:landing", "ventas:catalogo", "ventas:privacidad"):
            with self.subTest(name=name):
                html = self.client.get(reverse(name)).content.decode()
                footer = html[html.index("<footer") :]
                self.assertIn('href="/privacidad/"', footer)
