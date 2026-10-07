"""Parsers for the environment variables that config/settings.py reads.

They live apart from the settings module so that each rule can be tested on
its own. Every parser fails with `ImproperlyConfigured` and names the variable,
so a bad value in backend/.env is found when Django starts and not when the
first request arrives.
"""

from urllib.parse import urlsplit

from django.core.exceptions import ImproperlyConfigured

# Browsers leave the port out of the `Origin` header when it is the default one.
DEFAULT_PORTS = {"http": 80, "https": 443}

TRUE_VALUES = {"1", "true", "yes", "on"}
FALSE_VALUES = {"0", "false", "no", "off"}


def parse_http_url(value: str, name: str) -> str:
    """Return an http(s) URL, or fail: anything else would only break on the first request."""
    url = value.strip()
    parts = urlsplit(url)
    if parts.scheme not in DEFAULT_PORTS or not parts.hostname:
        raise ImproperlyConfigured(f"{name} must be an http(s) URL, got {value!r}.")
    return url


def parse_origin(value: str, name: str) -> str:
    """Return a web origin ("scheme://host[:port]") written the way browsers send it.

    An origin has no path, query or credentials, so anything beyond a trailing
    slash is a mistake worth stopping at startup: it would never match the
    `Origin` header of a real request.
    """
    try:
        parts = urlsplit(value.strip())
        port = parts.port
    except ValueError:
        raise ImproperlyConfigured(f"{name} has an invalid origin: {value!r}.") from None

    host = parts.hostname
    if (
        parts.scheme not in DEFAULT_PORTS
        or not host
        or parts.path not in ("", "/")
        or parts.query
        or parts.fragment
        or parts.username is not None
        or parts.password is not None
    ):
        raise ImproperlyConfigured(
            f"{name} must hold origins such as http://localhost:3002 "
            f"(scheme, host and optional port, nothing else); got {value!r}."
        )

    if ":" in host:  # IPv6 literal: urlsplit strips the brackets.
        host = f"[{host}]"
    if port is None or port == DEFAULT_PORTS[parts.scheme]:
        return f"{parts.scheme}://{host}"
    return f"{parts.scheme}://{host}:{port}"


def parse_origins(raw: str, name: str) -> list[str]:
    """Parse a comma-separated list of origins. At least one is required."""
    origins = [parse_origin(item, name) for item in raw.split(",") if item.strip()]
    if not origins:
        raise ImproperlyConfigured(f"{name} must list at least one origin, separated by commas.")
    return list(dict.fromkeys(origins))


def parse_bool(raw: str | None, name: str, *, default: bool) -> bool:
    """Read a True/False variable. Unset or empty gives `default`; anything unclear fails.

    The usual `value in {"1", "true"}` turns a typo such as "ture" into False
    without a word, which for a security flag means switching it off by accident.
    """
    if raw is None or not raw.strip():
        return default
    value = raw.strip().lower()
    if value in TRUE_VALUES:
        return True
    if value in FALSE_VALUES:
        return False
    raise ImproperlyConfigured(f"{name} must be True or False, got {raw!r}.")


def parse_samesite(raw: str | None, name: str, *, secure: bool, default: str = "Lax") -> str:
    """Read the SameSite attribute of the session and CSRF cookies: "Lax" or "None".

    "Strict" is refused. The handoff POST comes from the store, which is another
    site, and the redirect that follows it is a navigation that site started: a
    browser does not send a Strict cookie on it, so the admin would land on the
    sign-in page again. "None" is only valid together with Secure, because
    browsers drop a SameSite=None cookie that is not.
    """
    if raw is None or not raw.strip():
        return default
    value = raw.strip().lower()
    if value == "lax":
        return "Lax"
    if value == "none":
        if not secure:
            raise ImproperlyConfigured(
                f"{name}=None needs the cookies to be Secure: browsers drop a "
                "SameSite=None cookie that is not."
            )
        return "None"
    if value == "strict":
        raise ImproperlyConfigured(
            f"{name}=Strict would drop the session cookie on the redirect that follows the "
            "panel handoff, because the store that posts the token is another site. Use Lax."
        )
    raise ImproperlyConfigured(f"{name} must be Lax or None, got {raw!r}.")


def parse_positive_int(raw: str, name: str) -> int:
    """Parse a whole number greater than zero, such as a number of seconds."""
    try:
        number = int(raw.strip())
    except ValueError:
        raise ImproperlyConfigured(f"{name} must be a whole number, got {raw!r}.") from None
    if number <= 0:
        raise ImproperlyConfigured(f"{name} must be greater than zero, got {number}.")
    return number
