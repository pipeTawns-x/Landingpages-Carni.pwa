"""Verification of the Supabase access token that opens a panel session.

The store signs the admin in with Supabase Auth and posts the access token to
the panel. Nothing inside the token is trusted until this module has checked
its signature against the project's keys, and then its expiry, audience,
issuer and age. Every way a token can fail raises `TokenRejected` with a short
code for the server log; the browser only ever gets a generic refusal.

Exactly one kind of key is used, chosen by the configuration and never by the
token (see SUPABASE_JWKS_URL and SUPABASE_JWT_SECRET in config/settings.py).
Each mode names the algorithms it accepts, so a token cannot talk the server
into verifying it with the wrong kind of key (the classic confusion between a
public key and an HMAC secret), and `alg: none` is never accepted.
"""

import time
import uuid
from dataclasses import dataclass
from functools import lru_cache

import jwt
from django.conf import settings
from jwt import PyJWKClient

# What GoTrue puts in `aud` for a signed-in user. API keys carry another one.
AUDIENCE = "authenticated"

# Algorithms accepted in each verification mode. Keys published as a JWKS are
# asymmetric; the shared secret is HS256 only.
JWKS_ALGORITHMS = ["ES256", "RS256", "EdDSA"]
SECRET_ALGORITHMS = ["HS256"]

REQUIRED_CLAIMS = ["exp", "iat", "sub", "aud", "iss"]

# A Supabase access token is about a kilobyte: refuse anything absurd unparsed.
MAX_TOKEN_LENGTH = 8192

# Tolerated difference between the clock of Supabase and ours.
CLOCK_LEEWAY_SECONDS = 10

# How long the published keys are kept before they are asked for again. A token
# with an unknown `kid` can force one refresh per cooldown and no more, so
# garbage posted to the panel cannot turn into a request storm against Supabase.
JWKS_LIFESPAN_SECONDS = 600
JWKS_REFRESH_COOLDOWN_SECONDS = 60
JWKS_TIMEOUT_SECONDS = 5


class TokenRejected(Exception):
    """The token must not open a panel session. `reason` is a short code for the log."""

    def __init__(self, reason: str) -> None:
        super().__init__(reason)
        self.reason = reason


@dataclass(frozen=True)
class VerifiedToken:
    """What the panel keeps from a token that passed every check."""

    user_id: uuid.UUID
    # Informational only (it is shown, never used to decide anything).
    email: str


def expected_issuer() -> str:
    """The `iss` of every token this Supabase project signs for a user."""
    return f"{settings.SUPABASE_URL}/auth/v1"


@lru_cache(maxsize=1)
def _jwks_client(url: str) -> PyJWKClient:
    """The client that fetches and caches the keys the project publishes."""
    return PyJWKClient(
        url,
        cache_jwk_set=True,
        lifespan=JWKS_LIFESPAN_SECONDS,
        timeout=JWKS_TIMEOUT_SECONDS,
        cooldown_duration=JWKS_REFRESH_COOLDOWN_SECONDS,
    )


def _verification_key(token: str) -> tuple[object, list[str]]:
    """Return the key to verify `token` with and the algorithms it may use."""
    if not settings.SUPABASE_JWKS_URL:
        return settings.SUPABASE_JWT_SECRET, SECRET_ALGORITHMS

    try:
        signing_key = _jwks_client(settings.SUPABASE_JWKS_URL).get_signing_key_from_jwt(token)
    except jwt.PyJWKClientConnectionError:
        raise TokenRejected("jwks_unreachable") from None
    except jwt.PyJWTError:
        # An undecodable header, a token without `kid` or one that names a key
        # the project does not publish.
        raise TokenRejected("jwks_key") from None
    return signing_key, JWKS_ALGORITHMS


def verify_access_token(token: str) -> VerifiedToken:
    """Check a Supabase access token and return who it belongs to.

    Raises `TokenRejected` when the signature, the expiry, the audience, the
    issuer or the age is wrong, or when a required claim is missing.
    """
    if not token or len(token) > MAX_TOKEN_LENGTH:
        raise TokenRejected("malformed")

    key, algorithms = _verification_key(token)

    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=algorithms,
            audience=AUDIENCE,
            issuer=expected_issuer(),
            leeway=CLOCK_LEEWAY_SECONDS,
            options={
                "require": REQUIRED_CLAIMS,
                "strict_aud": True,
                # A secret shorter than the hash, or a small RSA key, is a
                # misconfiguration that must not quietly keep working.
                "enforce_minimum_key_length": True,
            },
        )
    except jwt.ExpiredSignatureError:
        raise TokenRejected("expired") from None
    except jwt.InvalidAudienceError:
        raise TokenRejected("audience") from None
    except jwt.InvalidIssuerError:
        raise TokenRejected("issuer") from None
    except jwt.InvalidSignatureError:
        raise TokenRejected("signature") from None
    except jwt.InvalidAlgorithmError:
        raise TokenRejected("algorithm") from None
    except jwt.MissingRequiredClaimError:
        raise TokenRejected("claims") from None
    except jwt.InvalidKeyError:
        raise TokenRejected("key") from None
    except jwt.PyJWTError:
        raise TokenRejected("invalid") from None

    # `exp` alone would let a token that was stolen long ago keep working until
    # it expires; the handoff happens right after the sign-in, so an old one is
    # not a handoff.
    if time.time() - claims["iat"] > settings.PANEL_TOKEN_MAX_AGE_SECONDS:
        raise TokenRejected("too_old")

    try:
        user_id = uuid.UUID(claims["sub"])
    except ValueError:
        raise TokenRejected("subject") from None

    email = claims.get("email")
    return VerifiedToken(user_id=user_id, email=email if isinstance(email, str) else "")
