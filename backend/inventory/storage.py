"""Product photos: what is accepted, and the gateway that stores it in Supabase Storage.

The production host has an ephemeral disk, so a photo an admin uploads cannot live in
`public/`: it goes to the public bucket `product-images` (supabase/migrations/
20261117000001_product_images_bucket.sql). Only the server writes there, with the service key
(`SUPABASE_SERVICE_ROLE_KEY`), which never reaches a template, a response or a log line.

Nothing here knows about HTTP requests of the panel: the form hands over bytes, the gateway returns
the public URL that `Product.image_url` keeps.
"""

import struct
import uuid
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings

BUCKET = "product-images"
MAX_BYTES = 5 * 1024 * 1024
# A sanity bound, not a design rule: nobody photographs a cut at more than 8000 px a side, and a
# header that claims more is either a mistake or a decompression bomb.
MAX_DIMENSION = 8000
TIMEOUT_SECONDS = 10

REJECTED_TYPE = "La foto debe ser una imagen JPG, PNG o WebP."
REJECTED_SIZE = "La foto pesa más de 5 MB. Reduce su tamaño e inténtalo de nuevo."
REJECTED_DIMENSIONS = (
    f"La foto tiene unas dimensiones no válidas (máximo {MAX_DIMENSION} px por lado)."
)


class ImageRejected(ValueError):
    """The file is not an acceptable product photo. The message is for the admin, in Spanish."""


class StorageError(Exception):
    """Storage could not keep the photo. The message is for the admin and carries no secret."""


@dataclass(frozen=True)
class ProductImage:
    data: bytes
    content_type: str
    extension: str


def _sniff(data: bytes) -> tuple[str, str] | None:
    """Return (content type, extension) from the first bytes, never from a name or a header."""
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", "jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", "png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp", "webp"
    return None


def _png_size(data: bytes) -> tuple[int, int] | None:
    if len(data) < 24 or data[12:16] != b"IHDR":
        return None
    return struct.unpack(">II", data[16:24])


def _jpeg_size(data: bytes) -> tuple[int, int] | None:
    position = 2
    while position + 4 <= len(data):
        if data[position] != 0xFF:
            return None
        marker = data[position + 1]
        if marker == 0xFF:  # fill byte
            position += 1
            continue
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:  # markers without a length
            position += 2
            continue
        (length,) = struct.unpack(">H", data[position + 2 : position + 4])
        # SOF0-SOF15, except DHT (C4), JPG (C8) and DAC (CC), carry the frame size.
        if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
            if position + 9 > len(data):
                return None
            height, width = struct.unpack(">HH", data[position + 5 : position + 9])
            return width, height
        position += 2 + length
    return None


def _webp_size(data: bytes) -> tuple[int, int] | None:
    kind = data[12:16]
    if kind == b"VP8 " and len(data) >= 30:
        width, height = struct.unpack("<HH", data[26:30])
        return width & 0x3FFF, height & 0x3FFF
    if kind == b"VP8L" and len(data) >= 25 and data[20] == 0x2F:
        (bits,) = struct.unpack("<I", data[21:25])
        return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    if kind == b"VP8X" and len(data) >= 30:
        width = int.from_bytes(data[24:27], "little") + 1
        height = int.from_bytes(data[27:30], "little") + 1
        return width, height
    return None


def image_size(data: bytes) -> tuple[int, int] | None:
    """Read (width, height) from the header of a JPEG, PNG or WebP; None when it cannot be read."""
    sniffed = _sniff(data)
    if sniffed is None:
        return None
    reader = {"image/png": _png_size, "image/jpeg": _jpeg_size, "image/webp": _webp_size}
    return reader[sniffed[0]](data)


def inspect_image(data: bytes) -> ProductImage:
    """Accept bytes only if they are a JPEG, PNG or WebP of a sane size; raise ImageRejected."""
    if len(data) > MAX_BYTES:
        raise ImageRejected(REJECTED_SIZE)
    sniffed = _sniff(data)
    if sniffed is None:
        raise ImageRejected(REJECTED_TYPE)
    size = image_size(data)
    if size is None:
        raise ImageRejected(REJECTED_TYPE)
    width, height = size
    if not (0 < width <= MAX_DIMENSION and 0 < height <= MAX_DIMENSION):
        raise ImageRejected(REJECTED_DIMENSIONS)
    return ProductImage(data=data, content_type=sniffed[0], extension=sniffed[1])


def storage_configured() -> bool:
    return bool(getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", ""))


class SupabaseStorage:
    """Writes to the bucket with the service key, through the Storage REST API."""

    def upload(self, image: ProductImage, product_id: int) -> str:
        key = getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "")
        if not key:
            raise StorageError(
                "La carga de fotos no está configurada: falta SUPABASE_SERVICE_ROLE_KEY."
            )
        path = f"{product_id}/{uuid.uuid4().hex}.{image.extension}"
        base = f"{settings.SUPABASE_URL}/storage/v1/object"
        request = Request(  # noqa: S310 - the URL is the configured Supabase project (http/https)
            f"{base}/{BUCKET}/{path}",
            data=image.data,
            method="PUT",
            headers={
                "Authorization": f"Bearer {key}",
                "apikey": key,
                "Content-Type": image.content_type,
                "x-upsert": "false",
            },
        )
        try:
            with urlopen(request, timeout=TIMEOUT_SECONDS) as reply:  # noqa: S310
                if not 200 <= reply.status < 300:
                    raise StorageError(f"Storage respondió con el código {reply.status}.")
        except HTTPError as error:
            raise StorageError(f"Storage rechazó la foto (código {error.code}).") from error
        except (URLError, OSError) as error:
            raise StorageError("No se pudo conectar con Storage.") from error
        return f"{base}/public/{BUCKET}/{path}"


class FakeStorage:
    """The gateway of the tests: keeps what it is given and touches no network."""

    def __init__(self, fail: bool = False):
        self.fail = fail
        self.uploads: list[tuple[ProductImage, int, str]] = []

    def upload(self, image: ProductImage, product_id: int) -> str:
        if self.fail:
            raise StorageError("Storage no respondió.")
        url = f"http://fake-storage.test/{BUCKET}/{product_id}/{uuid.uuid4().hex}.{image.extension}"
        self.uploads.append((image, product_id, url))
        return url


def get_gateway():
    return SupabaseStorage()


def upload_product_image(image: ProductImage, product_id: int) -> str:
    """Store the photo and return its public URL. Raises StorageError."""
    return get_gateway().upload(image, product_id)
