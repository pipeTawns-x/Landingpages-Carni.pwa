"""Tests for the cap on the size of a request body (config.middleware)."""

from django.conf import settings
from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase, override_settings

from config.middleware import RequestBodyLimitMiddleware


class RequestBodyLimitTests(SimpleTestCase):
    @override_settings(MAX_REQUEST_BODY_BYTES=1000)
    def test_a_body_over_the_cap_is_refused_with_413_before_it_is_read(self):
        # The declared length is far above the payload: reading the body would raise, so a 413
        # proves the middleware answered from the header alone.
        response = self.client.post(
            "/carrito/pedido/", data="x", content_type="text/plain", CONTENT_LENGTH="5000"
        )

        self.assertEqual(response.status_code, 413)

    @override_settings(MAX_REQUEST_BODY_BYTES=1000)
    def test_a_body_under_the_cap_reaches_the_view(self):
        response = self.client.post("/carrito/pedido/", data={"name": "Ana"})

        self.assertNotEqual(response.status_code, 413)

    @override_settings(MAX_REQUEST_BODY_BYTES=1000)
    def test_a_get_without_a_body_is_never_refused(self):
        response = self.client.get("/esta-ruta-no-existe/")

        self.assertNotEqual(response.status_code, 413)

    def test_the_default_cap_leaves_room_for_a_5_mb_photo_and_its_form(self):
        self.assertGreater(settings.MAX_REQUEST_BODY_BYTES, 5 * 1024 * 1024)
        self.assertLessEqual(settings.MAX_REQUEST_BODY_BYTES, 8 * 1024 * 1024)

    def test_it_runs_before_any_middleware_that_reads_the_body(self):
        name = "config.middleware.RequestBodyLimitMiddleware"
        middleware = settings.MIDDLEWARE

        self.assertIn(name, middleware)
        self.assertLess(
            middleware.index(name),
            middleware.index("django.middleware.csrf.CsrfViewMiddleware"),
        )


class ExplodingInput:
    """A request body that fails the test the moment anything reads it."""

    def read(self, *args):
        raise AssertionError("the body was read")

    readline = read


@override_settings(MAX_REQUEST_BODY_BYTES=1000)
class RequestBodyLimitHeaderTests(SimpleTestCase):
    def run_middleware(self, **meta):
        request = RequestFactory().post("/", data="", content_type="text/plain")
        request.META.update(meta)
        return RequestBodyLimitMiddleware(lambda req: HttpResponse("view"))(request)

    def test_an_oversized_body_is_refused_without_reading_it(self):
        response = self.run_middleware(CONTENT_LENGTH="5000", **{"wsgi.input": ExplodingInput()})

        self.assertEqual(response.status_code, 413)

    def test_a_header_django_reads_as_zero_passes_like_django_reads_it(self):
        # Django reads no byte for these, so letting them through lets nothing in.
        for value in ("", "abc", "-5"):
            with self.subTest(content_length=value):
                self.assertEqual(self.run_middleware(CONTENT_LENGTH=value).status_code, 200)

    def test_a_post_without_the_header_passes(self):
        request = RequestFactory().post("/", data="", content_type="text/plain")
        request.META.pop("CONTENT_LENGTH", None)

        response = RequestBodyLimitMiddleware(lambda req: HttpResponse("view"))(request)

        self.assertEqual(response.status_code, 200)
