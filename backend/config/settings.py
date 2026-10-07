"""
Django settings for config project.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.2/ref/settings/
"""

import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

from .env import parse_http_url, parse_origin, parse_origins, parse_positive_int

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from backend/.env (private, not committed to git).
load_dotenv(BASE_DIR / ".env")


def require_env(name: str) -> str:
    """Return a required environment variable or fail with a clear message."""
    value = os.environ.get(name)
    if not value:
        raise ImproperlyConfigured(
            f"{name} is not set. Add it to backend/.env (see the comments in that file)."
        )
    return value


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = require_env("DJANGO_SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get("DJANGO_DEBUG", "False").strip().lower() in {"1", "true", "yes"}

ALLOWED_HOSTS = [
    host.strip() for host in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",") if host.strip()
]


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "inventory.apps.InventoryConfig",
    "panel.apps.PanelConfig",
    # EBAC M14 practice: course-only, not part of the store (see ecommerce/README.md).
    "ecommerce.apps.EcommerceConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases
#
# Django and Supabase share the same Postgres instance but not the same schema:
# Django-owned tables live in the `django` schema (created by a later Supabase
# migration), while existing tables in `public` belong to supabase/migrations.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": require_env("POSTGRES_DB"),
        "USER": require_env("POSTGRES_USER"),
        "PASSWORD": require_env("POSTGRES_PASSWORD"),
        "HOST": require_env("POSTGRES_HOST"),
        "PORT": require_env("POSTGRES_PORT"),
        "OPTIONS": {"options": "-c search_path=django,public"},
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = "es-mx"

TIME_ZONE = "America/Mexico_City"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Auth
# https://docs.djangoproject.com/en/5.2/topics/auth/default/#the-login-required-decorator
#
# The course uses the built-in admin login page as the app's login page, so
# @login_required redirects there instead of a dedicated login view.
LOGIN_URL = "/admin/login/"


# Panel session handoff (Supabase -> Django)
# See docs/CONTRATO_PANEL_DJANGO.md, sections 5b and 6.
#
# The store signs an admin in with Supabase Auth and posts the access token to
# /panel/sesion/. Django opens its own session only after it has checked the
# token's signature, expiry, audience and issuer, and the role in profiles.

# The Supabase project that issues the tokens. `<SUPABASE_URL>/auth/v1` is the
# issuer a token must carry.
SUPABASE_URL = parse_http_url(require_env("SUPABASE_URL"), "SUPABASE_URL").rstrip("/")

# How the signature is checked. Production signs with asymmetric keys that the
# project publishes (JWKS); the local Supabase signs with a shared secret
# (HS256). Exactly one mode is used: the JWKS URL when it is set, otherwise the
# secret. The token never chooses the mode, so a token signed with the other
# kind of key is refused instead of being checked against the wrong one.
SUPABASE_JWKS_URL = os.environ.get("SUPABASE_JWKS_URL", "").strip()
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "").strip()
if SUPABASE_JWKS_URL:
    parse_http_url(SUPABASE_JWKS_URL, "SUPABASE_JWKS_URL")
elif not SUPABASE_JWT_SECRET:
    raise ImproperlyConfigured(
        "Neither SUPABASE_JWKS_URL nor SUPABASE_JWT_SECRET is set. Add one to backend/.env "
        "(see the comments in that file): the first for a project that signs with "
        "asymmetric keys, the second for the local Supabase."
    )

# Where the store lives, and which origins may post a token to the panel. They
# are separate on purpose: the second list is a security allow-list.
STORE_ORIGIN = parse_origin(require_env("STORE_ORIGIN"), "STORE_ORIGIN")
STORE_LOGIN_URL = f"{STORE_ORIGIN}/accessweb.html"
PANEL_ALLOWED_ORIGINS = parse_origins(require_env("PANEL_ALLOWED_ORIGINS"), "PANEL_ALLOWED_ORIGINS")

# The oldest a token may be (counted from its `iat`) when it is handed over.
PANEL_TOKEN_MAX_AGE_SECONDS = parse_positive_int(
    require_env("PANEL_TOKEN_MAX_AGE_SECONDS"), "PANEL_TOKEN_MAX_AGE_SECONDS"
)

# The panel logs why it refused a handoff (never the token) so the reason can
# be found on the server while the browser only gets a generic refusal.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "plain": {"format": "%(levelname)s %(name)s: %(message)s"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "plain"},
    },
    "loggers": {
        "panel": {"handlers": ["console"], "level": "INFO"},
    },
}

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
