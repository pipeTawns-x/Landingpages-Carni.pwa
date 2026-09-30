from django.apps import AppConfig


class EcommerceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ecommerce"
    verbose_name = "Ecommerce (práctica M14)"

    def ready(self) -> None:
        # Importing the module is what registers the pre_save receiver.
        from ecommerce import signals  # noqa: F401
