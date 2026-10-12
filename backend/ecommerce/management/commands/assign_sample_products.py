"""Give sample products to a user, so ProtectedListView of the EBAC M15 practice has data."""

import argparse
import uuid

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from ecommerce.models import Product
from panel.access import get_or_create_panel_user_by_id


def supabase_user_id(value: str) -> uuid.UUID:
    """Read the option as a UUID, in any of its usual spellings."""
    try:
        return uuid.UUID(value)
    except ValueError:
        raise argparse.ArgumentTypeError(f"{value!r} no es un UUID válido.") from None


class Command(BaseCommand):
    help = (
        "Asigna productos de prueba sin dueño al usuario de Django que representa a un "
        "usuario de Supabase (lo crea si no existe, igual que el panel)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--supabase-user",
            type=supabase_user_id,
            required=True,
            help="UUID del usuario en Supabase; es el username del usuario de Django.",
        )
        parser.add_argument(
            "--count",
            type=int,
            required=True,
            help="Cantidad de productos a asignar.",
        )

    def handle(self, *args, **options):
        supabase_id = options["supabase_user"]
        count = options["count"]
        if count < 1:
            raise CommandError("--count debe ser un entero mayor o igual a 1.")

        with transaction.atomic():
            user = get_or_create_panel_user_by_id(supabase_id)

            # One UPDATE that picks the first `count` unowned products by pk. `owner` is
            # checked again on the outer query, so a product somebody claimed in the
            # meantime is skipped and never taken over. update() does not call save(), so
            # `updated_at` (auto_now) is set by hand.
            first_unowned = Product.objects.filter(owner__isnull=True).order_by("pk")
            assigned = Product.objects.filter(
                pk__in=first_unowned.values("pk")[:count], owner__isnull=True
            ).update(owner=user, updated_at=timezone.now())

        self.stdout.write(
            self.style.SUCCESS(f"Productos asignados a {user.get_username()}: {assigned}")
        )
        if assigned < count:
            self.stdout.write(
                self.style.WARNING(
                    f"Pediste {count}, pero solo había {assigned} productos sin dueño. "
                    "Los productos de prueba se crean con create_test_products."
                )
            )
