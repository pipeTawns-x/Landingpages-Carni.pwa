"""Tests of `ventas`.

B1 is being built test first: these tests are written and the app they test is not yet installed.
Until `ventas.apps.VentasConfig` is in INSTALLED_APPS (the step that follows the first green run
of the models, services and views), the whole package is skipped, so the suite of the rest of the
project stays as it was. Once the app is installed the guard stops applying by itself; delete it
then.
"""

import unittest

from django.apps import apps

if not apps.is_installed("ventas"):
    raise unittest.SkipTest(
        "ventas is not installed yet: B1 is in progress (see odd/equipo/estado/backend.md)"
    )
