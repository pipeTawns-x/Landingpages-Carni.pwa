"""Panel models.

`Profile` is a read-only mirror of `public.profiles`, which belongs to Supabase: the
panel only asks it who is an admin. `ReviewInvite` is the one table Django owns here (it
lands in the `django` schema).
"""

import hashlib
import re
import secrets
import uuid
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from inventory.models import ReadOnlyModel


class Profile(ReadOnlyModel):
    """The role of a Supabase user. Owned by Supabase; the panel only reads it.

    Only `id` and `role` are mapped, because those are the only columns the
    `django` Postgres role may read (see
    `supabase/migrations/20261007042348_grant_django_profiles_select.sql`):
    the rest of the table is personal data the panel has no use for. The same
    migration lets the role see admin rows only, so a customer's profile does
    not exist as far as Django can tell.
    """

    ADMIN = "admin"

    id = models.UUIDField(primary_key=True)
    role = models.TextField()

    class Meta:
        managed = False
        db_table = "profiles"
        verbose_name = "perfil"
        verbose_name_plural = "perfiles"

    def __str__(self) -> str:
        return f"profile {self.pk} ({self.role})"

    @classmethod
    def is_admin(cls, user_id: uuid.UUID) -> bool:
        """Say whether the Supabase user is an admin right now.

        A user without a profile, or whose profile Django cannot see, is not.
        """
        return cls.objects.filter(pk=user_id, role=cls.ADMIN).exists()


# A token is 32 random bytes: 256 bits that nobody can guess. `token_urlsafe` writes them as 43
# characters that are safe in a URL.
TOKEN_BYTES = 32

# A landing path is a path of this site: one slash, then anything but a backslash, a space or a
# control character. That rules out `//host` and `https://host`, which a browser follows to
# another site, and the tab or the newline that a browser strips from a URL before reading it.
LANDING_PATH = re.compile(r"/(?!/)[^\\\x00-\x20\x7f]*")


def is_valid_landing_path(value: str) -> bool:
    """Say whether `value` is a path of this site that a redirect may safely point to."""
    return LANDING_PATH.fullmatch(value) is not None


def validate_landing_path(value: str) -> None:
    if not is_valid_landing_path(value):
        raise ValidationError(
            "Debe ser una ruta de este sitio: empezar con una sola «/» y no llevar «\\», "
            "espacios ni caracteres de control.",
            code="invalid_landing_path",
        )


def hash_token(token: str) -> str:
    """Return the SHA-256 of a token as 64 hex digits, the only form of it the database holds.

    A token is 256 random bits, so a plain hash is enough: there is nothing to guess and
    nothing to slow down, which is what a password hash is for. Whoever reads the table
    cannot go from a hash back to a link that works.
    """
    return hashlib.sha256(token.encode()).hexdigest()


class ReviewInvite(models.Model):
    """A link that lets a reviewer into the panel as one Supabase user, without a password.

    The link carries a random token that is shown once, when the invite is issued, and never
    stored: only its hash is. The link stops working when it expires, when it is revoked and
    when it has been used `max_uses` times. It opens the same session the Supabase handoff
    opens, so the panel keeps reading the role of that user on every request.
    """

    label = models.CharField(
        max_length=120,
        verbose_name="etiqueta",
        help_text="Para quién es o para qué sirve, por ejemplo «Profesora de la práctica M15».",
    )
    supabase_user_id = models.UUIDField(
        verbose_name="usuario de Supabase",
        help_text="Como quién entra la persona: debe ser administrador en Supabase.",
    )
    token_hash = models.CharField(
        max_length=64, unique=True, editable=False, verbose_name="huella del token"
    )
    landing_path = models.CharField(
        max_length=200,
        default="/panel/",
        validators=[validate_landing_path],
        verbose_name="página de destino",
        help_text="A dónde va la persona después de entrar. Una ruta de este sitio.",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creada el")
    expires_at = models.DateTimeField(verbose_name="vence el")
    revoked_at = models.DateTimeField(null=True, blank=True, verbose_name="revocada el")
    max_uses = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        verbose_name="usos máximos",
        help_text="Vacío: sin límite.",
    )
    use_count = models.PositiveIntegerField(default=0, verbose_name="usos")
    last_used_at = models.DateTimeField(null=True, blank=True, verbose_name="último uso")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "invitación de revisión"
        verbose_name_plural = "invitaciones de revisión"

    def __str__(self) -> str:
        return f"{self.label} ({self.supabase_user_id})"

    @classmethod
    def issue(
        cls,
        *,
        label: str,
        supabase_user_id: uuid.UUID,
        days: int,
        landing_path: str = "/panel/",
        max_uses: int | None = None,
    ) -> tuple["ReviewInvite", str]:
        """Create an invite and return it with its token, which exists nowhere else.

        Raises `ValidationError` when a value is not valid (nothing is saved then).
        """
        token = secrets.token_urlsafe(TOKEN_BYTES)
        invite = cls(
            label=label,
            supabase_user_id=supabase_user_id,
            token_hash=hash_token(token),
            landing_path=landing_path,
            expires_at=timezone.now() + timedelta(days=days),
            max_uses=max_uses,
        )
        invite.full_clean()
        invite.save()
        return invite, token

    @classmethod
    def find(cls, token: str, *, for_update: bool = False) -> "ReviewInvite | None":
        """Return the invite a token belongs to, or None.

        The database looks the hash up in a unique index; the token itself is never compared.
        `for_update` locks the row until the transaction ends, so two people redeeming the last
        use of a link at the same moment cannot both get it.
        """
        invites = cls.objects.select_for_update() if for_update else cls.objects.all()
        return invites.filter(token_hash=hash_token(token)).first()

    def refusal_reason(self, now=None) -> str | None:
        """Say why the invite cannot open a session now, as a short code for the log.

        Returns None when it can. The browser never sees the reason: every one of them gets
        the same page.
        """
        now = now or timezone.now()
        if self.revoked_at is not None:
            return "revoked"
        if self.expires_at <= now:
            return "expired"
        if self.max_uses is not None and self.use_count >= self.max_uses:
            return "exhausted"
        return None

    def record_use(self, now=None) -> None:
        """Count one use. The caller holds the row locked (see `find`)."""
        self.use_count += 1
        self.last_used_at = now or timezone.now()
        self.save(update_fields=["use_count", "last_used_at"])
