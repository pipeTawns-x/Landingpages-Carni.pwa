"""Panel models.

Django owns no table here. `Profile` is a read-only mirror of `public.profiles`,
which belongs to Supabase: the panel only asks it who is an admin.
"""

import uuid

from django.db import models

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
