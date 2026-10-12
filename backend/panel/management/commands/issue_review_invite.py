"""Issue a review invite: a link that opens the panel for a reviewer who has no password.

The link is printed once, here. Only its hash is stored, so it cannot be shown again: to
give someone a new one, issue another invite and revoke the old one in the admin site.
"""

import argparse
import uuid
from urllib.parse import urlsplit

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.urls import reverse
from django.utils.formats import date_format
from django.utils.timezone import localtime

from config.env import parse_origin
from panel.models import Profile, ReviewInvite

# A link that never expires is not an invite any more. Three months is more than a review needs.
MAX_DAYS = 90

# The only hosts where a link may be on plain http: the link is a key to the panel and must
# not travel unencrypted.
LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}


def supabase_user_id(value: str) -> uuid.UUID:
    """Read the option as a UUID, in any of its usual spellings."""
    try:
        return uuid.UUID(value)
    except ValueError:
        raise argparse.ArgumentTypeError(f"{value!r} no es un UUID válido.") from None


def parse_base_url(value: str) -> str:
    """Return the origin the link starts with, or fail with a message that names the option."""
    try:
        origin = parse_origin(value, "--base-url")
    except ImproperlyConfigured as error:
        raise CommandError(str(error)) from error

    parts = urlsplit(origin)
    if parts.scheme != "https" and parts.hostname not in LOCAL_HOSTS:
        raise CommandError(
            "--base-url debe ser https: el enlace da acceso al panel y no debe viajar sin "
            "cifrar (http solo vale para localhost)."
        )
    return origin


class Command(BaseCommand):
    help = (
        "Emite un enlace de invitado para revisar el panel sin contraseña. El enlace se "
        "muestra una sola vez: solo se guarda su huella."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--supabase-user",
            type=supabase_user_id,
            required=True,
            help="UUID del usuario de Supabase con el que entra la persona (administrador).",
        )
        parser.add_argument(
            "--label",
            required=True,
            help="Para quién es el enlace, por ejemplo «Profesora de la práctica M15».",
        )
        parser.add_argument(
            "--days",
            type=int,
            required=True,
            help=f"Días que dura el enlace, de 1 a {MAX_DAYS}.",
        )
        parser.add_argument(
            "--max-uses",
            type=int,
            default=None,
            help="Cuántas veces se puede usar (por defecto, sin límite).",
        )
        parser.add_argument(
            "--landing",
            default="/panel/",
            help="Ruta a la que va la persona al entrar (por defecto /panel/).",
        )
        parser.add_argument(
            "--base-url",
            required=True,
            help="Origen público del panel, por ejemplo https://carni-demo.onrender.com.",
        )

    def handle(self, *args, **options):
        supabase_id = options["supabase_user"]
        days = options["days"]
        max_uses = options["max_uses"]
        if not 1 <= days <= MAX_DAYS:
            raise CommandError(f"--days debe estar entre 1 y {MAX_DAYS}.")
        if max_uses is not None and max_uses < 1:
            raise CommandError("--max-uses debe ser un entero mayor o igual a 1.")
        base_url = parse_base_url(options["base_url"])

        # The panel checks the role on every request, so a link for someone who is not an admin
        # here would open a session that is closed at once. Better to say so now.
        if not Profile.is_admin(supabase_id):
            raise CommandError(
                f"El usuario {supabase_id} no es administrador en esta base de datos "
                "(profiles.role = 'admin'): el enlace no abriría el panel."
            )

        try:
            invite, token = ReviewInvite.issue(
                label=options["label"],
                supabase_user_id=supabase_id,
                days=days,
                landing_path=options["landing"],
                max_uses=max_uses,
            )
        except ValidationError as error:
            raise CommandError(
                "; ".join(
                    f"{field}: {' '.join(messages)}"
                    for field, messages in error.message_dict.items()
                )
            ) from error

        link = f"{base_url}{reverse('panel:invitado', kwargs={'token': token})}"
        # Django writes the month of the Spanish locale with a capital ("Octubre").
        expires = date_format(localtime(invite.expires_at), "DATETIME_FORMAT").lower()
        limit = "sin límite de usos" if max_uses is None else f"hasta {max_uses} usos"

        self.stdout.write(
            self.style.SUCCESS(f"Invitación {invite.pk} emitida para {invite.label}.")
        )
        self.stdout.write(f"Vence el {expires}; {limit}.")
        self.stdout.write("")
        self.stdout.write(
            "Enlace (solo se muestra esta vez: no se guarda y no se puede recuperar):"
        )
        self.stdout.write(link)

        if not settings.REVIEW_INVITES_ENABLED:
            self.stderr.write(
                "Aviso: REVIEW_INVITES_ENABLED está apagado en este entorno, así que el "
                "enlace responderá 404 hasta que se encienda."
            )
