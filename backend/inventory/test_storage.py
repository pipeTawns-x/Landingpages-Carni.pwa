"""Tests for the product-photo gateway: image inspection and the upload to Supabase Storage.

No test opens a socket: the HTTP call is `urllib.request.urlopen`, replaced by a mock.
"""

import struct
import zlib
from io import BytesIO
from unittest import mock
from urllib.error import HTTPError, URLError

from django.test import SimpleTestCase, override_settings

from inventory import storage
from inventory.storage import FakeStorage, ImageRejected, ProductImage, StorageError


def png_bytes(width=1, height=1):
    """A PNG whose IHDR says width x height (the rest is a valid, tiny stream)."""

    def chunk(kind, body):
        return (
            struct.pack(">I", len(body))
            + kind
            + body
            + struct.pack(">I", zlib.crc32(kind + body) & 0xFFFFFFFF)
        )

    header = struct.pack(">IIBBBBB", width, height, 8, 0, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(b"\x00\x00"))
        + chunk(b"IEND", b"")
    )


def jpeg_bytes(width=1, height=1):
    """A JPEG with the markers a decoder needs to read its size (SOI, SOF0, EOI)."""
    sof = struct.pack(">BHHB", 8, height, width, 1) + b"\x01\x11\x00"
    return b"\xff\xd8" + b"\xff\xc0" + struct.pack(">H", len(sof) + 2) + sof + b"\xff\xd9"


def webp_bytes(width=1, height=1):
    """A lossless WebP (VP8L) whose header says width x height."""
    bits = (width - 1) | ((height - 1) << 14)
    body = b"\x2f" + struct.pack("<I", bits) + b"\x00"
    chunk = b"VP8L" + struct.pack("<I", len(body)) + body
    return b"RIFF" + struct.pack("<I", 4 + len(chunk)) + b"WEBP" + chunk


class InspectImageTests(SimpleTestCase):
    def test_png_jpeg_and_webp_are_recognised_by_their_bytes(self):
        for data, content_type, ext in [
            (png_bytes(), "image/png", "png"),
            (jpeg_bytes(), "image/jpeg", "jpg"),
            (webp_bytes(), "image/webp", "webp"),
        ]:
            with self.subTest(content_type=content_type):
                image = storage.inspect_image(data)
                self.assertEqual((image.content_type, image.extension), (content_type, ext))
                self.assertEqual(image.data, data)

    def test_dimensions_are_read_from_the_header(self):
        self.assertEqual(storage.image_size(png_bytes(640, 480)), (640, 480))
        self.assertEqual(storage.image_size(jpeg_bytes(800, 600)), (800, 600))
        self.assertEqual(storage.image_size(webp_bytes(1024, 768)), (1024, 768))

    def test_text_disguised_as_an_image_is_refused(self):
        with self.assertRaisesMessage(ImageRejected, "JPG, PNG o WebP"):
            storage.inspect_image(b"<script>alert(1)</script>")

    def test_a_gif_is_refused(self):
        with self.assertRaises(ImageRejected):
            storage.inspect_image(b"GIF89a" + b"\x00" * 20)

    def test_a_file_over_five_megabytes_is_refused(self):
        data = png_bytes() + b"\x00" * storage.MAX_BYTES
        with self.assertRaisesMessage(ImageRejected, "5 MB"):
            storage.inspect_image(data)

    def test_absurd_dimensions_are_refused(self):
        with self.assertRaisesMessage(ImageRejected, "dimensiones"):
            storage.inspect_image(png_bytes(storage.MAX_DIMENSION + 1, 10))

    def test_a_truncated_image_is_refused(self):
        with self.assertRaises(ImageRejected):
            storage.inspect_image(b"\x89PNG\r\n\x1a\n")


@override_settings(SUPABASE_URL="http://supabase.test", SUPABASE_SERVICE_ROLE_KEY="server-key")
class SupabaseStorageTests(SimpleTestCase):
    image = ProductImage(data=b"bytes", content_type="image/png", extension="png")

    def response(self, status=200):
        reply = mock.MagicMock()
        reply.status = status
        reply.__enter__.return_value = reply
        return reply

    def test_it_puts_the_object_with_the_server_key_and_returns_its_public_url(self):
        with mock.patch("inventory.storage.urlopen", return_value=self.response()) as urlopen:
            url = storage.upload_product_image(self.image, 42)

        request = urlopen.call_args.args[0]
        self.assertEqual(request.get_method(), "PUT")
        self.assertRegex(
            request.full_url,
            r"^http://supabase\.test/storage/v1/object/product-images/42/[0-9a-f]{32}\.png$",
        )
        self.assertEqual(request.get_header("Authorization"), "Bearer server-key")
        self.assertEqual(request.get_header("Content-type"), "image/png")
        self.assertEqual(request.data, b"bytes")
        self.assertIsNotNone(urlopen.call_args.kwargs["timeout"])
        self.assertEqual(
            url,
            request.full_url.replace("/object/", "/object/public/"),
        )

    def test_a_missing_server_key_is_a_storage_error_and_no_request_is_made(self):
        with (
            override_settings(SUPABASE_SERVICE_ROLE_KEY=""),
            mock.patch("inventory.storage.urlopen") as urlopen,
            self.assertRaisesMessage(StorageError, "SUPABASE_SERVICE_ROLE_KEY"),
        ):
            storage.upload_product_image(self.image, 1)
        urlopen.assert_not_called()

    def test_http_errors_become_storage_errors_without_leaking_the_key(self):
        error = HTTPError("http://x", 403, "Forbidden", {}, BytesIO(b"nope"))
        with (
            mock.patch("inventory.storage.urlopen", side_effect=error),
            self.assertRaises(StorageError) as caught,
        ):
            storage.upload_product_image(self.image, 1)
        self.assertNotIn("server-key", str(caught.exception))

    def test_network_failures_and_timeouts_become_storage_errors(self):
        for failure in (URLError("down"), TimeoutError("slow")):
            with (
                self.subTest(failure=type(failure).__name__),
                mock.patch("inventory.storage.urlopen", side_effect=failure),
                self.assertRaises(StorageError),
            ):
                storage.upload_product_image(self.image, 1)


class FakeStorageTests(SimpleTestCase):
    def test_it_records_uploads_and_returns_a_url(self):
        fake = FakeStorage()
        url = fake.upload(ProductImage(b"x", "image/webp", "webp"), 7)
        self.assertTrue(url.startswith("http://fake-storage.test/product-images/7/"))
        self.assertEqual(len(fake.uploads), 1)

    def test_it_can_be_told_to_fail(self):
        with self.assertRaises(StorageError):
            FakeStorage(fail=True).upload(ProductImage(b"x", "image/webp", "webp"), 7)
