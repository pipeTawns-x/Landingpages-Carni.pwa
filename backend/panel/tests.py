"""Tests for the panel shell: the token check, the Supabase handoff and the access guard.

They run on SQLite through config.settings_test, which also sets the panel's
configuration: `http://store.test` is the only origin allowed to post a token,
and the signing secret is random on every run. `Profile` is an unmanaged,
read-only mirror of the profiles table that Supabase owns, so the tests add its
rows with raw SQL, the way Supabase does in production.
"""

import base64
import hashlib
import hmac
import json
import secrets
import time
import uuid
import warnings
from unittest import mock

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import connection
from django.test import Client, SimpleTestCase, TestCase, override_settings
from django.urls import URLResolver, reverse
from jwt.algorithms import ECAlgorithm

from inventory.models import ReadOnlyModelError
from panel import supabase_auth
from panel import urls as panel_urls
from panel.access import (
    PANEL_SESSION_KEY,
    get_or_create_panel_user,
    is_panel_admin,
)
from panel.models import Profile
from panel.supabase_auth import TokenRejected, VerifiedToken

ALLOWED_ORIGIN = "http://store.test"
JWKS_URL = "http://supabase.test/auth/v1/.well-known/jwks.json"
KEY_ID = "test-key"
# A signing secret that is not the configured one, and one too short to be a secret at all.
OTHER_SECRET = secrets.token_urlsafe(48)
SHORT_SECRET = "x" * 8


def insert_profile(user_id, role):
    """Add a Supabase profile the way Supabase does: the mirror refuses writes from Django."""
    with connection.cursor() as cursor:
        cursor.execute("INSERT INTO profiles (id, role) VALUES (%s, %s)", [user_id.hex, role])


def leaf_patterns(patterns):
    """Yield every route under `patterns`, going into the `include()` of other apps."""
    for pattern in patterns:
        if isinstance(pattern, URLResolver):
            yield from leaf_patterns(pattern.url_patterns)
        else:
            yield pattern


def hand_off(client, user_id):
    """Post an admin token to the handoff the way the store does, from the allowed origin."""
    return client.post(
        reverse("panel:sesion"),
        {"access_token": make_token(user_id)},
        HTTP_ORIGIN=ALLOWED_ORIGIN,
    )


def token_claims(user_id, **overrides):
    """Return the claims of a Supabase access token. An override of None removes the claim."""
    now = int(time.time())
    claims = {
        "sub": str(user_id),
        "aud": supabase_auth.AUDIENCE,
        "iss": supabase_auth.expected_issuer(),
        "iat": now,
        "exp": now + 3600,
        "role": "authenticated",
        "email": "admin@example.test",
        **overrides,
    }
    return {name: value for name, value in claims.items() if value is not None}


def make_token(user_id, key=None, algorithm="HS256", headers=None, **overrides):
    """Sign a token with the configured secret unless told otherwise."""
    key = settings.SUPABASE_JWT_SECRET if key is None else key
    return jwt.encode(token_claims(user_id, **overrides), key, algorithm=algorithm, headers=headers)


def base64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def forge_hs256(user_id, key, headers=None):
    """Sign a token with HMAC-SHA256 by hand, with any bytes as the key.

    PyJWT refuses to use a public key as an HMAC secret, which is exactly what
    the attack this simulates relies on, so the signature is made without it.
    """
    header = {"alg": "HS256", "typ": "JWT", **(headers or {})}
    signing_input = (
        f"{base64url(json.dumps(header).encode())}."
        f"{base64url(json.dumps(token_claims(user_id)).encode())}"
    )
    signature = hmac.new(key, signing_input.encode(), hashlib.sha256).digest()
    return f"{signing_input}.{base64url(signature)}"


def tamper_with_subject(token, new_subject):
    """Swap the subject of a signed token and keep its signature, which no longer fits."""
    header, payload, signature = token.split(".")
    claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
    claims["sub"] = str(new_subject)
    forged_payload = base64url(json.dumps(claims).encode())
    return f"{header}.{forged_payload}.{signature}"


class VerifyAccessTokenTests(SimpleTestCase):
    """The token check in shared-secret mode, which is how the local Supabase signs."""

    def setUp(self):
        self.user_id = uuid.uuid4()

    def assertRejected(self, token, reason):
        with self.assertRaises(TokenRejected) as raised:
            supabase_auth.verify_access_token(token)
        self.assertEqual(raised.exception.reason, reason)

    def test_a_valid_token_returns_the_user_and_the_email(self):
        verified = supabase_auth.verify_access_token(make_token(self.user_id))

        self.assertEqual(verified, VerifiedToken(user_id=self.user_id, email="admin@example.test"))

    def test_the_subject_is_normalised_to_a_uuid(self):
        token = make_token(self.user_id, sub=self.user_id.hex.upper())

        self.assertEqual(supabase_auth.verify_access_token(token).user_id, self.user_id)

    def test_an_email_that_is_not_text_is_dropped(self):
        verified = supabase_auth.verify_access_token(make_token(self.user_id, email=42))

        self.assertEqual(verified.email, "")

    def test_a_token_without_email_is_valid(self):
        verified = supabase_auth.verify_access_token(make_token(self.user_id, email=None))

        self.assertEqual(verified.email, "")

    def test_a_signature_made_with_another_secret_is_rejected(self):
        token = make_token(self.user_id, key=OTHER_SECRET)

        self.assertRejected(token, "signature")

    def test_a_token_whose_payload_was_changed_is_rejected(self):
        token = tamper_with_subject(make_token(self.user_id), uuid.uuid4())

        self.assertRejected(token, "signature")

    def test_an_unsigned_token_is_rejected(self):
        token = jwt.encode(token_claims(self.user_id), key=None, algorithm="none")

        self.assertRejected(token, "algorithm")

    def test_a_token_signed_with_an_algorithm_the_mode_does_not_accept_is_rejected(self):
        secret = settings.SUPABASE_JWT_SECRET
        token = jwt.encode(token_claims(self.user_id), secret, algorithm="HS512")

        self.assertRejected(token, "algorithm")

    def test_an_expired_token_is_rejected(self):
        past = int(time.time()) - 3600

        self.assertRejected(make_token(self.user_id, exp=past, iat=past - 60), "expired")

    def test_a_token_for_another_audience_is_rejected(self):
        self.assertRejected(make_token(self.user_id, aud="anon"), "audience")

    def test_a_token_with_a_list_of_audiences_is_rejected(self):
        self.assertRejected(make_token(self.user_id, aud=["authenticated", "other"]), "audience")

    def test_a_token_from_another_issuer_is_rejected(self):
        token = make_token(self.user_id, iss="http://elsewhere.test/auth/v1")

        self.assertRejected(token, "issuer")

    def test_a_token_missing_a_required_claim_is_rejected(self):
        for claim in ("exp", "iat", "sub", "aud", "iss"):
            with self.subTest(claim=claim):
                self.assertRejected(make_token(self.user_id, **{claim: None}), "claims")

    def test_a_token_older_than_the_maximum_age_is_rejected(self):
        old = int(time.time()) - settings.PANEL_TOKEN_MAX_AGE_SECONDS - 60

        self.assertRejected(make_token(self.user_id, iat=old), "too_old")

    def test_a_token_just_inside_the_maximum_age_is_accepted(self):
        recent = int(time.time()) - settings.PANEL_TOKEN_MAX_AGE_SECONDS + 30

        self.assertEqual(
            supabase_auth.verify_access_token(make_token(self.user_id, iat=recent)).user_id,
            self.user_id,
        )

    def test_a_token_issued_in_the_future_is_rejected(self):
        self.assertRejected(make_token(self.user_id, iat=int(time.time()) + 3600), "invalid")

    def test_a_subject_that_is_not_a_uuid_is_rejected(self):
        self.assertRejected(make_token(self.user_id, sub="not-a-uuid"), "subject")

    def test_something_that_is_not_a_token_is_rejected(self):
        for garbage in ("", "abc", "a.b.c", "x" * (supabase_auth.MAX_TOKEN_LENGTH + 1)):
            with self.subTest(token=garbage[:10]), self.assertRaises(TokenRejected):
                supabase_auth.verify_access_token(garbage)

    def test_a_secret_that_is_too_short_to_sign_anything_is_refused(self):
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", jwt.InsecureKeyLengthWarning)
            token = make_token(self.user_id, key=SHORT_SECRET)

        with override_settings(SUPABASE_JWT_SECRET=SHORT_SECRET):
            self.assertRejected(token, "key")


class JwksVerificationTests(SimpleTestCase):
    """The token check in JWKS mode, which is how a production project signs."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.private_key = ec.generate_private_key(ec.SECP256R1())
        cls.other_private_key = ec.generate_private_key(ec.SECP256R1())
        cls.jwks = {
            "keys": [
                {
                    **ECAlgorithm.to_jwk(cls.private_key.public_key(), as_dict=True),
                    "kid": KEY_ID,
                    "use": "sig",
                    "alg": "ES256",
                }
            ]
        }
        cls.public_pem = cls.private_key.public_key().public_bytes(
            serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
        )

    def setUp(self):
        self.user_id = uuid.uuid4()
        # The keys are cached per client, and every test has its own key set.
        supabase_auth._jwks_client.cache_clear()
        self.addCleanup(supabase_auth._jwks_client.cache_clear)
        self.enterContext(override_settings(SUPABASE_JWKS_URL=JWKS_URL))
        self.fetch = self.enterContext(
            mock.patch.object(jwt.PyJWKClient, "fetch_data", return_value=self.jwks)
        )

    def es256_token(self, key=None, headers=None, **overrides):
        headers = {"kid": KEY_ID} if headers is None else headers
        return make_token(
            self.user_id,
            key=key or self.private_key,
            algorithm="ES256",
            headers=headers,
            **overrides,
        )

    def assertRejected(self, token, reason):
        with self.assertRaises(TokenRejected) as raised:
            supabase_auth.verify_access_token(token)
        self.assertEqual(raised.exception.reason, reason)

    def test_a_token_signed_with_a_published_key_is_accepted(self):
        verified = supabase_auth.verify_access_token(self.es256_token())

        self.assertEqual(verified.user_id, self.user_id)

    def test_the_other_checks_still_apply(self):
        self.assertRejected(self.es256_token(aud="anon"), "audience")
        self.assertRejected(self.es256_token(iss="http://elsewhere.test/auth/v1"), "issuer")
        self.assertRejected(self.es256_token(exp=int(time.time()) - 3600), "expired")

    def test_a_token_signed_by_another_key_under_a_published_kid_is_rejected(self):
        self.assertRejected(self.es256_token(key=self.other_private_key), "signature")

    def test_a_token_naming_a_key_the_project_does_not_publish_is_rejected(self):
        self.assertRejected(self.es256_token(headers={"kid": "unknown"}), "jwks_key")

    def test_a_token_without_kid_is_rejected(self):
        self.assertRejected(self.es256_token(headers={}), "jwks_key")

    def test_a_shared_secret_token_is_rejected_even_when_the_secret_is_configured(self):
        # JWKS mode never falls back to the secret: the token does not get to choose.
        self.assertRejected(make_token(self.user_id, headers={"kid": KEY_ID}), "algorithm")

    def test_a_token_that_uses_the_public_key_as_an_hmac_secret_is_rejected(self):
        # The classic algorithm confusion: HS256 signed with the published public key.
        forged = forge_hs256(self.user_id, self.public_pem, headers={"kid": KEY_ID})

        self.assertRejected(forged, "algorithm")

    def test_an_unsigned_token_is_rejected(self):
        token = jwt.encode(
            token_claims(self.user_id), key=None, algorithm="none", headers={"kid": KEY_ID}
        )

        self.assertRejected(token, "algorithm")

    def test_an_unreachable_key_endpoint_rejects_the_token(self):
        self.fetch.side_effect = jwt.PyJWKClientConnectionError("endpoint is down")

        self.assertRejected(self.es256_token(), "jwks_unreachable")

    def test_the_two_modes_never_share_an_algorithm(self):
        self.assertEqual(supabase_auth.SECRET_ALGORITHMS, ["HS256"])
        self.assertNotIn("HS256", supabase_auth.JWKS_ALGORITHMS)
        self.assertNotIn("none", supabase_auth.JWKS_ALGORITHMS)

    def test_the_key_client_is_set_up_with_a_timeout_and_a_refresh_cooldown(self):
        client = supabase_auth._jwks_client(JWKS_URL)

        self.assertEqual(client.timeout, supabase_auth.JWKS_TIMEOUT_SECONDS)
        self.assertEqual(client.cooldown_duration, supabase_auth.JWKS_REFRESH_COOLDOWN_SECONDS)


class ProfileMirrorTests(SimpleTestCase):
    """`profiles` belongs to Supabase, so Django must refuse to write to it."""

    def test_an_instance_cannot_be_saved_or_deleted(self):
        profile = Profile(id=uuid.uuid4(), role=Profile.ADMIN)

        with self.assertRaises(ReadOnlyModelError):
            profile.save()
        with self.assertRaises(ReadOnlyModelError):
            profile.delete()

    def test_a_queryset_cannot_change_a_profile(self):
        with self.assertRaises(ReadOnlyModelError):
            Profile.objects.update(role=Profile.ADMIN)


class ProfileRoleTests(TestCase):
    def test_an_admin_profile_is_an_admin(self):
        user_id = uuid.uuid4()
        insert_profile(user_id, "admin")

        self.assertTrue(Profile.is_admin(user_id))

    def test_a_customer_is_not_an_admin(self):
        user_id = uuid.uuid4()
        insert_profile(user_id, "customer")

        self.assertFalse(Profile.is_admin(user_id))

    def test_a_user_without_a_profile_is_not_an_admin(self):
        self.assertFalse(Profile.is_admin(uuid.uuid4()))

    def test_the_role_is_read_every_time(self):
        user_id = uuid.uuid4()
        insert_profile(user_id, "admin")
        self.assertTrue(Profile.is_admin(user_id))

        with connection.cursor() as cursor:
            cursor.execute("UPDATE profiles SET role = 'customer' WHERE id = %s", [user_id.hex])

        self.assertFalse(Profile.is_admin(user_id))


class PanelUserTests(TestCase):
    """The Django user that stands for a Supabase user."""

    def setUp(self):
        self.user_id = uuid.uuid4()
        self.verified = VerifiedToken(user_id=self.user_id, email="admin@example.test")

    def test_the_user_is_created_on_first_use_with_the_supabase_id_as_username(self):
        user = get_or_create_panel_user(self.verified)

        self.assertEqual(user.username, str(self.user_id))
        self.assertEqual(user.email, "admin@example.test")

    def test_the_user_has_no_password_and_no_extra_permissions(self):
        user = get_or_create_panel_user(self.verified)

        self.assertFalse(user.has_usable_password())
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_the_same_supabase_user_is_the_same_django_user(self):
        first = get_or_create_panel_user(self.verified)
        second = get_or_create_panel_user(self.verified)

        self.assertEqual(first.pk, second.pk)
        self.assertEqual(get_user_model().objects.count(), 1)

    def test_a_password_set_on_the_user_is_taken_away_again(self):
        user = get_or_create_panel_user(self.verified)
        user.set_password("something-usable")
        user.save()

        self.assertFalse(get_or_create_panel_user(self.verified).has_usable_password())

    def test_a_changed_email_is_kept_up_to_date(self):
        get_or_create_panel_user(self.verified)

        user = get_or_create_panel_user(VerifiedToken(self.user_id, "new@example.test"))

        self.assertEqual(user.email, "new@example.test")

    def test_a_token_without_email_does_not_erase_the_stored_one(self):
        get_or_create_panel_user(self.verified)

        user = get_or_create_panel_user(VerifiedToken(self.user_id, ""))

        self.assertEqual(user.email, "admin@example.test")


class HandoffTests(TestCase):
    """POST /panel/sesion/: a Supabase admin token becomes a Django session."""

    @classmethod
    def setUpTestData(cls):
        cls.admin_id = uuid.uuid4()
        cls.customer_id = uuid.uuid4()
        insert_profile(cls.admin_id, "admin")
        insert_profile(cls.customer_id, "customer")

    def setUp(self):
        self.url = reverse("panel:sesion")

    def post(self, token, origin=ALLOWED_ORIGIN, client=None, url=None, **data):
        client = client or self.client
        extra = {} if origin is None else {"HTTP_ORIGIN": origin}
        return client.post(url or self.url, {"access_token": token, **data}, **extra)

    def assertRefused(self, response):
        self.assertEqual(response.status_code, 403)
        self.assertNotIn("_auth_user_id", self.client.session)
        self.assertNotIn(PANEL_SESSION_KEY, self.client.session)
        self.assertFalse(get_user_model().objects.exists())

    # the way in

    def test_an_admin_token_opens_a_session_and_goes_to_the_panel(self):
        response = self.post(make_token(self.admin_id))

        self.assertRedirects(response, reverse("panel:inicio"), fetch_redirect_response=False)
        user = get_user_model().objects.get(username=str(self.admin_id))
        self.assertEqual(self.client.session["_auth_user_id"], str(user.pk))
        self.assertEqual(self.client.session[PANEL_SESSION_KEY], str(self.admin_id))

    def test_the_django_user_is_the_one_the_session_belongs_to_and_has_no_password(self):
        self.post(make_token(self.admin_id))

        user = get_user_model().objects.get()
        self.assertFalse(user.has_usable_password())
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_the_second_handoff_reuses_the_same_user(self):
        self.post(make_token(self.admin_id))
        self.post(make_token(self.admin_id), client=Client())

        self.assertEqual(get_user_model().objects.count(), 1)

    def test_the_session_key_changes_when_the_session_opens(self):
        before = self.client.session.session_key

        self.post(make_token(self.admin_id))

        self.assertNotEqual(self.client.session.session_key, before)

    def test_the_handoff_works_without_a_csrf_token(self):
        # The form that posts here lives on the store: it cannot read Django's token.
        strict_client = Client(enforce_csrf_checks=True)

        response = self.post(make_token(self.admin_id), client=strict_client)

        self.assertEqual(response.status_code, 302)

    def test_the_response_is_not_cached(self):
        response = self.post(make_token(self.admin_id))

        self.assertIn("no-store", response["Cache-Control"])

    def test_an_admin_token_signed_with_published_keys_opens_a_session_too(self):
        private_key = ec.generate_private_key(ec.SECP256R1())
        jwks = {
            "keys": [
                {
                    **ECAlgorithm.to_jwk(private_key.public_key(), as_dict=True),
                    "kid": KEY_ID,
                    "use": "sig",
                    "alg": "ES256",
                }
            ]
        }
        token = make_token(
            self.admin_id, key=private_key, algorithm="ES256", headers={"kid": KEY_ID}
        )
        supabase_auth._jwks_client.cache_clear()
        self.addCleanup(supabase_auth._jwks_client.cache_clear)

        with (
            override_settings(SUPABASE_JWKS_URL=JWKS_URL),
            mock.patch.object(jwt.PyJWKClient, "fetch_data", return_value=jwks),
        ):
            response = self.post(token)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(self.client.session[PANEL_SESSION_KEY], str(self.admin_id))

    # who is refused

    def test_a_customer_is_refused(self):
        self.assertRefused(self.post(make_token(self.customer_id)))

    def test_a_user_without_a_profile_is_refused(self):
        self.assertRefused(self.post(make_token(uuid.uuid4())))

    def test_a_tampered_token_is_refused(self):
        token = tamper_with_subject(make_token(self.customer_id), self.admin_id)

        self.assertRefused(self.post(token))

    def test_a_token_signed_with_another_secret_is_refused(self):
        token = make_token(self.admin_id, key=OTHER_SECRET)

        self.assertRefused(self.post(token))

    def test_an_expired_token_is_refused(self):
        past = int(time.time()) - 3600

        self.assertRefused(self.post(make_token(self.admin_id, exp=past, iat=past - 60)))

    def test_a_token_for_another_audience_is_refused(self):
        self.assertRefused(self.post(make_token(self.admin_id, aud="anon")))

    def test_a_token_from_another_issuer_is_refused(self):
        self.assertRefused(self.post(make_token(self.admin_id, iss="http://elsewhere.test")))

    def test_a_token_that_is_too_old_for_a_handoff_is_refused(self):
        old = int(time.time()) - settings.PANEL_TOKEN_MAX_AGE_SECONDS - 60

        self.assertRefused(self.post(make_token(self.admin_id, iat=old)))

    def test_an_unsigned_token_is_refused(self):
        token = jwt.encode(token_claims(self.admin_id), key=None, algorithm="none")

        self.assertRefused(self.post(token))

    def test_a_missing_or_empty_token_is_refused(self):
        self.assertRefused(self.client.post(self.url, {}, HTTP_ORIGIN=ALLOWED_ORIGIN))
        self.assertRefused(self.post(""))

    def test_a_user_that_was_deactivated_in_django_is_refused(self):
        get_user_model().objects.create(username=str(self.admin_id), is_active=False)

        response = self.post(make_token(self.admin_id))

        self.assertEqual(response.status_code, 403)
        self.assertNotIn("_auth_user_id", self.client.session)

    # the request

    def test_a_get_is_refused(self):
        response = self.client.get(self.url, {"access_token": make_token(self.admin_id)})

        self.assertEqual(response.status_code, 405)
        self.assertEqual(response["Allow"], "POST")
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_other_methods_are_refused(self):
        for method in ("put", "patch", "delete"):
            with self.subTest(method=method):
                response = getattr(self.client, method)(self.url, HTTP_ORIGIN=ALLOWED_ORIGIN)
                self.assertEqual(response.status_code, 405)

    def test_an_origin_that_is_not_allowed_is_refused(self):
        self.assertRefused(self.post(make_token(self.admin_id), origin="http://evil.test"))

    def test_a_request_without_origin_is_refused(self):
        self.assertRefused(self.post(make_token(self.admin_id), origin=None))

    def test_a_null_origin_is_refused(self):
        # What a browser sends when the page that posts has `Referrer-Policy: no-referrer`.
        self.assertRefused(self.post(make_token(self.admin_id), origin="null"))

    def test_an_origin_that_only_starts_like_an_allowed_one_is_refused(self):
        for origin in (
            f"{ALLOWED_ORIGIN}.evil.test",
            f"{ALLOWED_ORIGIN}:8080",
            "https://store.test",
        ):
            with self.subTest(origin=origin):
                self.assertRefused(self.post(make_token(self.admin_id), origin=origin))

    def test_a_token_in_the_query_string_is_refused_even_with_a_valid_body(self):
        token = make_token(self.admin_id)

        response = self.post(token, url=f"{self.url}?access_token={token}")

        self.assertRefused(response)

    def test_a_token_only_in_the_query_string_is_not_read(self):
        token = make_token(self.admin_id)

        response = self.client.post(
            f"{self.url}?access_token={token}", {}, HTTP_ORIGIN=ALLOWED_ORIGIN
        )

        self.assertRefused(response)

    def test_a_json_body_is_not_read(self):
        response = self.client.post(
            self.url,
            json.dumps({"access_token": make_token(self.admin_id)}),
            content_type="application/json",
            HTTP_ORIGIN=ALLOWED_ORIGIN,
        )

        self.assertRefused(response)

    # what the browser and the log are told

    def test_every_refusal_looks_the_same_to_the_browser(self):
        refused = [
            self.post(make_token(self.customer_id)),
            self.post(make_token(self.admin_id, aud="anon")),
            self.post(make_token(self.admin_id, exp=int(time.time()) - 3600)),
            self.post(make_token(self.admin_id), origin="http://evil.test"),
            self.post("garbage"),
        ]

        self.assertEqual({response.status_code for response in refused}, {403})
        self.assertEqual({response.content for response in refused}, {refused[0].content})
        self.assertEqual(
            {response["Content-Type"] for response in refused}, {refused[0]["Content-Type"]}
        )

    def test_a_refusal_is_logged_with_its_reason_and_never_with_the_token(self):
        token = make_token(self.admin_id, aud="anon")

        with self.assertLogs("panel", level="WARNING") as logs:
            self.post(token)

        output = "\n".join(logs.output)
        self.assertIn("audience", output)
        self.assertNotIn(token, output)
        self.assertNotIn(token.split(".")[1], output)

    def test_a_customer_is_logged_as_not_admin(self):
        with self.assertLogs("panel", level="WARNING") as logs:
            self.post(make_token(self.customer_id))

        self.assertIn("not_admin", "\n".join(logs.output))

    def test_a_refused_origin_is_logged_with_the_origin(self):
        with self.assertLogs("panel", level="WARNING") as logs:
            self.post(make_token(self.admin_id), origin="http://evil.test")

        self.assertIn("http://evil.test", "\n".join(logs.output))

    def test_a_successful_handoff_logs_the_user_and_never_the_token(self):
        token = make_token(self.admin_id)

        with self.assertLogs("panel", level="INFO") as logs:
            self.post(token)

        output = "\n".join(logs.output)
        self.assertIn(str(self.admin_id), output)
        self.assertNotIn(token, output)

    def test_the_token_is_masked_in_error_reports(self):
        # This mark is what keeps the token out of the debug page and out of the
        # e-mails Django sends about a crash.
        response = self.post("garbage")

        self.assertEqual(response.wsgi_request.sensitive_post_parameters, ("access_token",))


class AccessBridgeTests(TestCase):
    """GET /panel/acceso/: where anonymous visitors are sent."""

    @classmethod
    def setUpTestData(cls):
        cls.admin_id = uuid.uuid4()
        insert_profile(cls.admin_id, "admin")

    def test_an_anonymous_visitor_is_sent_to_the_store_login(self):
        response = self.client.get(reverse("panel:acceso"))

        self.assertRedirects(response, settings.STORE_LOGIN_URL, fetch_redirect_response=False)
        self.assertEqual(settings.STORE_LOGIN_URL, "http://store.test/accessweb.html")

    def test_a_handed_off_admin_goes_straight_to_the_panel(self):
        self.client.post(
            reverse("panel:sesion"),
            {"access_token": make_token(self.admin_id)},
            HTTP_ORIGIN=ALLOWED_ORIGIN,
        )

        response = self.client.get(reverse("panel:acceso"))

        self.assertRedirects(response, reverse("panel:inicio"), fetch_redirect_response=False)

    def test_a_django_user_that_did_not_come_from_supabase_still_goes_to_the_store(self):
        self.client.force_login(get_user_model().objects.create_superuser("local"))

        response = self.client.get(reverse("panel:acceso"))

        self.assertRedirects(response, settings.STORE_LOGIN_URL, fetch_redirect_response=False)

    def test_the_bridge_does_not_accept_a_post(self):
        self.assertEqual(self.client.post(reverse("panel:acceso")).status_code, 405)


class PanelAccessTests(TestCase):
    """Only a session that came from a Supabase handoff reaches a panel view."""

    @classmethod
    def setUpTestData(cls):
        cls.admin_id = uuid.uuid4()
        insert_profile(cls.admin_id, "admin")

    def setUp(self):
        self.url = reverse("panel:inicio")
        self.bridge = reverse("panel:acceso")

    def hand_off(self):
        self.client.post(
            reverse("panel:sesion"),
            {"access_token": make_token(self.admin_id)},
            HTTP_ORIGIN=ALLOWED_ORIGIN,
        )

    def test_an_anonymous_visitor_is_sent_to_the_bridge(self):
        response = self.client.get(self.url)

        self.assertRedirects(response, self.bridge, fetch_redirect_response=False)

    def test_a_handed_off_admin_reaches_the_panel(self):
        self.hand_off()

        response = self.client.get(self.url)

        # The landing page forwards to the first section that exists: the products.
        self.assertRedirects(response, reverse("inventory:list"), fetch_redirect_response=False)

    def test_a_django_superuser_made_some_other_way_is_not_a_panel_admin(self):
        self.client.force_login(get_user_model().objects.create_superuser("local"))

        response = self.client.get(self.url)

        self.assertRedirects(response, self.bridge, fetch_redirect_response=False)

    def test_a_session_marked_for_another_user_is_not_a_panel_admin(self):
        self.hand_off()
        session = self.client.session
        session[PANEL_SESSION_KEY] = str(uuid.uuid4())
        session.save()

        response = self.client.get(self.url)

        self.assertRedirects(response, self.bridge, fetch_redirect_response=False)

    def test_a_user_deactivated_after_the_handoff_is_sent_to_the_bridge(self):
        self.hand_off()
        get_user_model().objects.update(is_active=False)

        response = self.client.get(self.url)

        self.assertRedirects(response, self.bridge, fetch_redirect_response=False)

    def test_is_panel_admin_is_false_for_an_anonymous_request(self):
        response = self.client.get(self.url)

        self.assertFalse(is_panel_admin(response.wsgi_request))

    def test_every_panel_route_is_guarded_unless_it_is_meant_to_be_public(self):
        # The way in (`sesion`), the bridge (`acceso`) and the way out (`salir`)
        # have to work without being an admin. A route added later has to be
        # guarded or be added here on purpose.
        public = {"acceso", "sesion", "salir"}
        for pattern in leaf_patterns(panel_urls.urlpatterns):
            guarded = getattr(pattern.callback, "panel_admin_required", False)
            with self.subTest(route=pattern.name):
                self.assertEqual(guarded, pattern.name not in public)


class RoleRevalidationTests(TestCase):
    """The role is read from Supabase on every request, not trusted from the session."""

    @classmethod
    def setUpTestData(cls):
        cls.admin_id = uuid.uuid4()
        insert_profile(cls.admin_id, "admin")

    def setUp(self):
        self.url = reverse("panel:inicio")
        self.bridge = reverse("panel:acceso")
        hand_off(self.client, self.admin_id)

    def change_profile(self, sql):
        with connection.cursor() as cursor:
            cursor.execute(sql, [self.admin_id.hex])

    def test_an_admin_keeps_getting_in_while_the_role_holds(self):
        for _ in range(2):
            response = self.client.get(self.url)

            self.assertRedirects(response, reverse("inventory:list"), fetch_redirect_response=False)

    def test_an_admin_demoted_after_the_handoff_is_sent_to_the_bridge(self):
        self.change_profile("UPDATE profiles SET role = 'customer' WHERE id = %s")

        response = self.client.get(self.url)

        self.assertRedirects(response, self.bridge, fetch_redirect_response=False)

    def test_the_session_of_a_demoted_admin_is_closed_and_not_just_refused(self):
        self.change_profile("UPDATE profiles SET role = 'customer' WHERE id = %s")

        self.client.get(self.url)

        self.assertNotIn("_auth_user_id", self.client.session)
        self.assertNotIn(PANEL_SESSION_KEY, self.client.session)

    def test_an_admin_whose_profile_disappeared_is_sent_away_too(self):
        self.change_profile("DELETE FROM profiles WHERE id = %s")

        response = self.client.get(self.url)

        self.assertRedirects(response, self.bridge, fetch_redirect_response=False)
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_visiting_the_panel_does_not_log_a_django_staff_member_out(self):
        # A session that never came from a handoff is just not a panel session.
        staff_client = Client()
        staff_client.force_login(get_user_model().objects.create_superuser("local"))

        response = staff_client.get(self.url)

        self.assertRedirects(response, self.bridge, fetch_redirect_response=False)
        self.assertIn("_auth_user_id", staff_client.session)

    def test_a_marker_that_is_not_a_uuid_is_refused_without_a_crash(self):
        staff_client = Client()
        staff_client.force_login(get_user_model().objects.create_user("local"))
        session = staff_client.session
        session[PANEL_SESSION_KEY] = "local"
        session.save()

        response = staff_client.get(self.url)

        self.assertRedirects(response, self.bridge, fetch_redirect_response=False)


class LogoutTests(TestCase):
    """POST /panel/salir/: the way out."""

    @classmethod
    def setUpTestData(cls):
        cls.admin_id = uuid.uuid4()
        insert_profile(cls.admin_id, "admin")

    def setUp(self):
        self.url = reverse("panel:salir")
        hand_off(self.client, self.admin_id)

    def csrf_client(self):
        """A client that enforces CSRF, handed off, and the token that goes with its cookie."""
        client = Client(enforce_csrf_checks=True)
        hand_off(client, self.admin_id)
        return client, client.cookies[settings.CSRF_COOKIE_NAME].value

    def test_it_ends_the_session_and_goes_to_the_store_login(self):
        response = self.client.post(self.url)

        self.assertRedirects(response, settings.STORE_LOGIN_URL, fetch_redirect_response=False)
        self.assertNotIn("_auth_user_id", self.client.session)
        self.assertNotIn(PANEL_SESSION_KEY, self.client.session)

    def test_the_panel_is_closed_afterwards(self):
        self.client.post(self.url)

        response = self.client.get(reverse("panel:inicio"))

        self.assertRedirects(response, reverse("panel:acceso"), fetch_redirect_response=False)

    def test_a_get_is_refused_and_does_not_log_out(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 405)
        self.assertEqual(response["Allow"], "POST")
        self.assertEqual(self.client.session[PANEL_SESSION_KEY], str(self.admin_id))

    def test_it_is_protected_by_the_csrf_check(self):
        client, _token = self.csrf_client()

        response = client.post(self.url)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(client.session[PANEL_SESSION_KEY], str(self.admin_id))

    def test_it_works_with_the_csrf_token(self):
        client, token = self.csrf_client()

        response = client.post(self.url, HTTP_X_CSRFTOKEN=token)

        self.assertRedirects(response, settings.STORE_LOGIN_URL, fetch_redirect_response=False)
        self.assertNotIn("_auth_user_id", client.session)

    def test_a_null_origin_fails_the_csrf_check(self):
        # What a browser sends on EVERY post, same site included, when the page has
        # `Referrer-Policy: no-referrer`. It is why Django's policy is `same-origin`.
        client, token = self.csrf_client()

        response = client.post(self.url, HTTP_X_CSRFTOKEN=token, HTTP_ORIGIN="null")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(client.session[PANEL_SESSION_KEY], str(self.admin_id))

    def test_an_admin_whose_role_was_revoked_can_still_log_out(self):
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE profiles SET role = 'customer' WHERE id = %s", [self.admin_id.hex]
            )

        response = self.client.post(self.url)

        self.assertRedirects(response, settings.STORE_LOGIN_URL, fetch_redirect_response=False)
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_a_visitor_without_a_session_is_just_sent_to_the_store(self):
        response = Client().post(self.url)

        self.assertRedirects(response, settings.STORE_LOGIN_URL, fetch_redirect_response=False)

    def test_a_django_user_made_some_other_way_can_log_out_too(self):
        client = Client()
        client.force_login(get_user_model().objects.create_superuser("local"))

        client.post(self.url)

        self.assertNotIn("_auth_user_id", client.session)

    def test_logging_out_is_logged_with_the_user(self):
        with self.assertLogs("panel", level="INFO") as logs:
            self.client.post(self.url)

        self.assertIn(str(self.admin_id), "\n".join(logs.output))


class CookieAndHeaderTests(TestCase):
    """Cookie flags and headers of the panel's answers."""

    @classmethod
    def setUpTestData(cls):
        cls.admin_id = uuid.uuid4()
        insert_profile(cls.admin_id, "admin")

    def session_cookie(self, response):
        return response.cookies[settings.SESSION_COOKIE_NAME]

    def test_the_session_cookie_is_http_only_and_lax(self):
        cookie = self.session_cookie(hand_off(self.client, self.admin_id))

        self.assertTrue(cookie["httponly"])
        self.assertEqual(cookie["samesite"], "Lax")

    def test_the_session_cookie_is_secure_when_the_setting_says_so(self):
        self.assertFalse(self.session_cookie(hand_off(self.client, self.admin_id))["secure"])

        with override_settings(SESSION_COOKIE_SECURE=True):
            response = hand_off(Client(), self.admin_id)

        self.assertTrue(self.session_cookie(response)["secure"])

    def test_the_csrf_cookie_follows_the_same_flags(self):
        with override_settings(CSRF_COOKIE_SECURE=True):
            response = hand_off(self.client, self.admin_id)

        cookie = response.cookies[settings.CSRF_COOKIE_NAME]
        self.assertTrue(cookie["secure"])
        self.assertEqual(cookie["samesite"], "Lax")

    def test_the_session_does_not_last_longer_than_a_working_day(self):
        cookie = self.session_cookie(hand_off(self.client, self.admin_id))

        self.assertLessEqual(int(cookie["max-age"]), 12 * 60 * 60)

    def test_the_answers_of_the_panel_never_hand_the_referrer_to_another_site(self):
        responses = [
            hand_off(self.client, self.admin_id),
            self.client.get(reverse("panel:acceso")),
            self.client.get(reverse("panel:inicio")),
            self.client.post(reverse("panel:salir")),
        ]

        for response in responses:
            self.assertEqual(response["Referrer-Policy"], "same-origin")

    def test_the_policy_is_not_no_referrer(self):
        # `no-referrer` makes browsers send `Origin: null` on every post, which
        # Django's CSRF check refuses: the logout, the forms and the admin would
        # stop working (see LogoutTests.test_a_null_origin_fails_the_csrf_check).
        self.assertEqual(settings.SECURE_REFERRER_POLICY, "same-origin")

    def test_the_panel_cannot_be_framed(self):
        response = self.client.get(reverse("panel:acceso"))

        self.assertEqual(response["X-Frame-Options"], "DENY")
