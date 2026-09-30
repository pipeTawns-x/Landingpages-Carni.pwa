#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""

import os
import sys


def main():
    """Run administrative tasks."""
    # `manage.py test` uses the SQLite test settings even when
    # DJANGO_SETTINGS_MODULE is already exported in the shell: the `django`
    # role cannot create a test database on the shared Postgres. Only an
    # explicit `--settings X` or `--settings=X` leaves the variable alone (and
    # Django then applies the flag). Every other command keeps the value from
    # the environment and falls back to the regular settings.
    explicit_settings = any(
        arg == "--settings" or arg.startswith("--settings=") for arg in sys.argv[2:]
    )
    if sys.argv[1:2] == ["test"] and not explicit_settings:
        os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings_test"
    else:
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
