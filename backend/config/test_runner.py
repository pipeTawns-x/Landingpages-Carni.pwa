"""Test runner that creates the tables of unmanaged models.

Django's docs say: "For tests involving models with managed=False, it's up to
you to ensure the correct tables are created as part of the test setup."
(https://docs.djangoproject.com/en/5.2/ref/models/options/#managed)

`inventory.Category` and `inventory.Product` are unmanaged mirrors of tables
that Supabase owns, so the test database would never get them. This runner
flips `managed` to True before the test database is built and puts the flag
back afterwards. It only changes model options in memory, for the length of the
run.
"""

from django.apps import apps
from django.test.runner import DiscoverRunner


class UnmanagedModelsTestRunner(DiscoverRunner):
    """Make Django create tables for unmanaged models in the test database."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.unmanaged_models = []

    def setup_test_environment(self, **kwargs):
        super().setup_test_environment(**kwargs)
        # Runs before setup_databases(), so migrate/syncdb sees managed=True.
        self.unmanaged_models = [model for model in apps.get_models() if not model._meta.managed]
        for model in self.unmanaged_models:
            model._meta.managed = True

    def teardown_test_environment(self, **kwargs):
        for model in self.unmanaged_models:
            model._meta.managed = False
        super().teardown_test_environment(**kwargs)
