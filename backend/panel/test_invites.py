"""Tests for the review invite links: the model, the page at /panel/invitado/<token>/, the admin
and the command that issues them.

They run on SQLite through config.settings_test, which leaves REVIEW_INVITES_ENABLED at its
default (off): the tests that need the feature switch it on with `override_settings`.
"""

import hashlib
import re
import uuid
from datetime import timedelta
from io import StringIO
from unittest import mock

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import connection
from django.test import Client, SimpleTestCase, TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from django.utils.formats import date_format
from django.utils.timezone import localtime

from panel.access import PANEL_INVITE_SESSION_KEY, PANEL_SESSION_KEY
from panel.admin import ReviewInviteAdmin
from panel.models import ReviewInvite, hash_token, is_valid_landing_path
from panel.tests import hand_off, insert_profile

GENERIC_PAGE = "Enlace no válido o vencido"

BAD_LANDING_PATHS = (
    "//evil.example",
    "//evil.example/panel/",
    "https://evil.example",
    "http://evil.example/panel/",
    "javascript:alert(1)",
    "evil.example",
    "panel/",
    "",
    "/\\evil.example",
    "/panel\\evil",
    "\\\\evil.example",
    "/\t/evil.example",
    "/pane\nl/",
    "/panel/ ",
    "/pa nel/",
    "/panel/\x00",
    "/panel/\x7f",
)
GOOD_LANDING_PATHS = (
    "/",
    "/panel/",
    "/panel/productos/",
    "/panel/productos/?page=2",
    "/my-products/",
    "/panel/productos/#lista",
    "/ñandú/",
)


def issue(**overrides):
    """Create an invite and return it together with its token."""
    options = {"label": "Revisión EBAC", "supabase_user_id": uuid.uuid4(), "days": 7, **overrides}
    return ReviewInvite.issue(**options)


def invite_url(token):
    return reverse("panel:invitado", kwargs={"token": token})


def csrf_token_of(response):
    """The value of the hidden CSRF field of the confirmation page."""
    return re.search(
        r'name="csrfmiddlewaretoken" value="([^"]+)"', response.content.decode()
    ).group(1)


def has_session(client):
    """Say whether the client holds a session that belongs to a Django user."""
    return "_auth_user_id" in client.session


class ReviewInviteModelTests(TestCase):
    def test_issuing_returns_the_invite_and_a_token_that_is_not_stored(self):
        invite, token = issue()

        self.assertGreaterEqual(len(token), 43)
        self.assertRegex(token, r"^[A-Za-z0-9_-]+$")
        stored = [
            str(getattr(invite, field.attname)) for field in ReviewInvite._meta.concrete_fields
        ]
        self.assertFalse([value for value in stored if token in value])

    def test_only_the_sha256_of_the_token_is_stored(self):
        invite, token = issue()

        invite.refresh_from_db()
        self.assertEqual(invite.token_hash, hashlib.sha256(token.encode()).hexdigest())
        self.assertEqual(len(invite.token_hash), 64)
        self.assertEqual(hash_token("abc"), hashlib.sha256(b"abc").hexdigest())

    def test_the_raw_token_is_in_no_column_of_the_table(self):
        _invite, token = issue()

        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM panel_reviewinvite")
            row = cursor.fetchone()

        self.assertFalse([value for value in row if token in str(value)])

    def test_every_invite_gets_its_own_token(self):
        tokens = {issue()[1] for _ in range(5)}

        self.assertEqual(len(tokens), 5)

    def test_the_defaults_are_the_panel_landing_page_and_unlimited_uses(self):
        invite, _token = issue()

        self.assertEqual(invite.landing_path, "/panel/")
        self.assertIsNone(invite.max_uses)
        self.assertEqual(invite.use_count, 0)
        self.assertIsNone(invite.last_used_at)
        self.assertIsNone(invite.revoked_at)

    def test_it_expires_after_the_days_it_was_issued_for(self):
        before = timezone.now()

        invite, _token = issue(days=7)

        self.assertGreaterEqual(invite.expires_at, before + timedelta(days=7))
        self.assertLessEqual(invite.expires_at, timezone.now() + timedelta(days=7))

    def test_find_returns_the_invite_for_its_token_and_nothing_for_anything_else(self):
        invite, token = issue()

        self.assertEqual(ReviewInvite.find(token), invite)
        for wrong in ("", "nope", token.upper(), token[:-1], f"{token}x"):
            with self.subTest(token=wrong[:8]):
                self.assertIsNone(ReviewInvite.find(wrong))

    def test_a_usable_invite_has_no_refusal_reason(self):
        invite, _token = issue(max_uses=2)

        self.assertIsNone(invite.refusal_reason())

    def test_each_way_of_being_unusable_has_its_own_reason_for_the_log(self):
        now = timezone.now()
        revoked, _ = issue()
        revoked.revoked_at = now
        expired, _ = issue()
        expired.expires_at = now - timedelta(seconds=1)
        exhausted, _ = issue(max_uses=2)
        exhausted.use_count = 2

        self.assertEqual(revoked.refusal_reason(now), "revoked")
        self.assertEqual(expired.refusal_reason(now), "expired")
        self.assertEqual(exhausted.refusal_reason(now), "exhausted")

    def test_it_stops_working_at_the_moment_it_expires(self):
        invite, _token = issue()

        self.assertIsNone(invite.refusal_reason(invite.expires_at - timedelta(seconds=1)))
        self.assertEqual(invite.refusal_reason(invite.expires_at), "expired")

    def test_an_invite_without_a_limit_never_runs_out_of_uses(self):
        invite, _token = issue()
        invite.use_count = 10_000

        self.assertIsNone(invite.refusal_reason())

    def test_recording_a_use_counts_it_and_stamps_the_time(self):
        invite, _token = issue()
        now = timezone.now()

        invite.record_use(now)

        invite.refresh_from_db()
        self.assertEqual(invite.use_count, 1)
        self.assertEqual(invite.last_used_at, now)

    def test_a_label_that_is_empty_or_too_long_is_refused(self):
        for label in ("", "x" * 121):
            with self.subTest(label=label[:5]), self.assertRaises(ValidationError):
                issue(label=label)
        self.assertEqual(ReviewInvite.objects.count(), 0)

    def test_a_limit_of_zero_uses_is_refused(self):
        with self.assertRaises(ValidationError):
            issue(max_uses=0)

    def test_a_landing_path_that_leaves_the_site_is_refused(self):
        for path in BAD_LANDING_PATHS:
            with self.subTest(path=path), self.assertRaises(ValidationError) as raised:
                issue(landing_path=path)
            self.assertIn("landing_path", raised.exception.message_dict)
        self.assertEqual(ReviewInvite.objects.count(), 0)

    def test_a_path_of_this_site_is_accepted(self):
        for path in GOOD_LANDING_PATHS:
            with self.subTest(path=path):
                invite, _token = issue(landing_path=path)
                self.assertEqual(invite.landing_path, path)


class LandingPathTests(SimpleTestCase):
    def test_a_path_that_leaves_the_site_is_not_a_landing_path(self):
        for path in BAD_LANDING_PATHS:
            with self.subTest(path=path):
                self.assertFalse(is_valid_landing_path(path))

    def test_a_path_of_this_site_is_a_landing_path(self):
        for path in GOOD_LANDING_PATHS:
            with self.subTest(path=path):
                self.assertTrue(is_valid_landing_path(path))


class FlagTests(TestCase):
    def test_the_feature_is_off_unless_the_environment_turns_it_on(self):
        self.assertIs(settings.REVIEW_INVITES_ENABLED, False)

    def test_with_the_flag_off_the_url_is_a_404_even_for_a_valid_token(self):
        invite, token = issue()
        url = invite_url(token)

        for method in (self.client.get, self.client.post):
            with self.subTest(method=method.__name__):
                self.assertEqual(method(url).status_code, 404)

        invite.refresh_from_db()
        self.assertEqual(invite.use_count, 0)
        self.assertFalse(has_session(self.client))
        self.assertEqual(get_user_model().objects.count(), 0)

    def test_with_the_flag_off_every_method_answers_404_and_none_answers_405(self):
        # The method check must not run before the flag: a 405 would say the route exists.
        _invite, token = issue()
        url = invite_url(token)

        for method in ("get", "head", "post", "put", "patch", "delete", "options", "trace"):
            with self.subTest(method=method):
                self.assertEqual(getattr(self.client, method)(url).status_code, 404)

    def test_with_the_flag_off_the_link_without_its_closing_slash_is_a_404_and_not_a_redirect(self):
        # A redirect to the slash form would say the route exists.
        _invite, token = issue()
        url = invite_url(token).rstrip("/")

        for method in ("get", "head", "post", "put"):
            with self.subTest(method=method):
                response = getattr(self.client, method)(url)
                self.assertEqual(response.status_code, 404)
                self.assertNotIn("Location", response)

    @override_settings(REVIEW_INVITES_ENABLED=True)
    def test_with_the_flag_on_the_same_url_works(self):
        _invite, token = issue()

        self.assertEqual(self.client.get(invite_url(token)).status_code, 200)

    @override_settings(REVIEW_INVITES_ENABLED=True)
    def test_with_the_flag_on_the_link_without_its_closing_slash_goes_to_the_one_with_it(self):
        _invite, token = issue()

        response = self.client.get(invite_url(token).rstrip("/"))

        self.assertRedirects(
            response, invite_url(token), status_code=301, fetch_redirect_response=False
        )
        # The Location header holds the token, so the redirect is as private as the page.
        self.assertEqual(response["Referrer-Policy"], "strict-origin")
        self.assertIn("no-store", response["Cache-Control"])

    def test_the_route_is_always_mounted_and_it_is_the_flag_that_answers(self):
        self.assertEqual(invite_url("abc"), "/panel/invitado/abc/")


@override_settings(REVIEW_INVITES_ENABLED=True)
class ConfirmationPageTests(TestCase):
    """GET shows a page with a button. It never opens a session, so a bot that opens the link
    (a chat preview, a mail scanner) cannot use it."""

    @classmethod
    def setUpTestData(cls):
        cls.admin_id = uuid.uuid4()
        insert_profile(cls.admin_id, "admin")

    def setUp(self):
        self.invite, self.token = issue(supabase_user_id=self.admin_id, label="Revisión EBAC M15")
        self.url = invite_url(self.token)
        self.response = self.client.get(self.url)

    def test_a_valid_link_shows_the_confirmation_page(self):
        self.assertEqual(self.response.status_code, 200)
        self.assertTemplateUsed(self.response, "panel/invitado.html")
        self.assertContains(self.response, "Revisión EBAC M15")
        self.assertContains(self.response, "Entrar al panel")

    def test_the_page_says_when_the_link_expires_in_the_time_of_the_panel(self):
        # Django writes the month of the Spanish locale with a capital; the page lowers it.
        when = date_format(localtime(self.invite.expires_at), "DATETIME_FORMAT").lower()

        self.assertContains(self.response, when)
        self.assertRegex(when, r"^\d{1,2} de [a-záéíóú]+ de \d{4}")

    def test_the_button_is_a_post_form_with_the_csrf_token(self):
        html = self.response.content.decode()

        forms = re.findall(r"<form [^>]*>.*?</form>", html, flags=re.DOTALL)
        self.assertEqual(len(forms), 1)
        self.assertIn('method="post"', forms[0])
        self.assertIn('name="csrfmiddlewaretoken"', forms[0])
        self.assertIn('type="submit"', forms[0])

    def test_the_page_holds_the_three_headers_that_keep_the_link_private(self):
        # `strict-origin` and not `no-referrer`: see the docstring of `views.invitado`.
        self.assertEqual(self.response["Referrer-Policy"], "strict-origin")
        self.assertEqual(self.response["X-Robots-Tag"], "noindex, nofollow")
        self.assertIn("no-store", self.response["Cache-Control"])
        self.assertContains(self.response, '<meta name="robots" content="noindex, nofollow" />')

    def test_getting_the_page_opens_no_session_and_uses_nothing_up(self):
        self.assertFalse(has_session(self.client))
        self.assertNotIn(PANEL_SESSION_KEY, self.client.session)
        self.assertEqual(get_user_model().objects.count(), 0)
        self.invite.refresh_from_db()
        self.assertEqual(self.invite.use_count, 0)
        self.assertIsNone(self.invite.last_used_at)

    def test_a_head_request_opens_no_session_either(self):
        client = Client()

        response = client.head(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertFalse(has_session(client))

    def test_the_page_does_not_repeat_the_token(self):
        # The form posts to the address of the page itself.
        self.assertNotContains(self.response, self.token)

    def test_the_page_has_no_script_no_inline_style_and_no_inline_handler(self):
        html = self.response.content.decode()

        for forbidden in ("<script", "<style", " style=", " onclick=", " onchange=", "javascript:"):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, html)

    def test_other_methods_are_refused(self):
        for method in ("put", "patch", "delete"):
            with self.subTest(method=method):
                self.assertEqual(getattr(self.client, method)(self.url).status_code, 405)


@override_settings(REVIEW_INVITES_ENABLED=True)
class GenericRefusalTests(TestCase):
    """A link that does not work says so in one way, whatever the reason."""

    def make_cases(self):
        """One link for each reason, as (name, token)."""
        past = timezone.now() - timedelta(minutes=1)
        _, expired = issue()
        ReviewInvite.objects.filter(token_hash=hash_token(expired)).update(expires_at=past)
        _, revoked = issue()
        ReviewInvite.objects.filter(token_hash=hash_token(revoked)).update(
            revoked_at=timezone.now()
        )
        _, exhausted = issue(max_uses=1)
        ReviewInvite.objects.filter(token_hash=hash_token(exhausted)).update(use_count=1)
        return [
            ("unknown", "x" * 43),
            ("expired", expired),
            ("revoked", revoked),
            ("exhausted", exhausted),
        ]

    def test_every_reason_gets_the_same_page_with_the_same_status_and_headers(self):
        responses = []
        for name, token in self.make_cases():
            for method in ("get", "post"):
                with self.subTest(case=name, method=method):
                    response = getattr(Client(), method)(invite_url(token))
                    self.assertEqual(response.status_code, 404)
                    self.assertContains(response, GENERIC_PAGE, status_code=404)
                    self.assertTemplateUsed(response, "panel/invitado_invalido.html")
                    responses.append(response)

        self.assertEqual({response.content for response in responses}, {responses[0].content})
        for header in ("Referrer-Policy", "X-Robots-Tag", "Cache-Control", "Content-Type"):
            with self.subTest(header=header):
                self.assertEqual({r[header] for r in responses}, {responses[0][header]})

    def test_a_refused_link_opens_no_session_creates_no_user_and_uses_nothing_up(self):
        for name, token in self.make_cases():
            with self.subTest(case=name):
                client = Client()
                client.post(invite_url(token))
                self.assertFalse(has_session(client))
        self.assertEqual(get_user_model().objects.count(), 0)
        self.assertEqual(ReviewInvite.objects.filter(last_used_at__isnull=False).count(), 0)

    def test_the_page_has_no_form_and_leaves_no_csrf_cookie(self):
        response = self.client.get(invite_url("x" * 43))

        self.assertNotContains(response, "<form", status_code=404)
        self.assertNotIn(settings.CSRF_COOKIE_NAME, response.cookies)

    def test_each_refusal_is_logged_with_its_reason_and_never_with_the_token(self):
        for name, token in self.make_cases():
            with self.subTest(case=name):
                with self.assertLogs("panel", level="WARNING") as logs:
                    self.client.get(invite_url(token))
                output = "\n".join(logs.output)
                self.assertIn(name, output)
                self.assertNotIn(token, output)
                self.assertNotIn(hash_token(token), output)

    def test_the_page_has_no_script_and_no_inline_style(self):
        html = self.client.get(invite_url("x" * 43)).content.decode()

        for forbidden in ("<script", "<style", " style=", " onclick=", "javascript:"):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, html)


@override_settings(REVIEW_INVITES_ENABLED=True)
class RedemptionTests(TestCase):
    """POST opens the same panel session the Supabase handoff opens."""

    @classmethod
    def setUpTestData(cls):
        cls.admin_id = uuid.uuid4()
        insert_profile(cls.admin_id, "admin")

    def setUp(self):
        self.invite, self.token = issue(supabase_user_id=self.admin_id)
        self.url = invite_url(self.token)

    def redeem(self, client=None, url=None):
        return (client or self.client).post(url or self.url)

    # the way in

    def test_it_opens_the_session_of_the_handoff_and_goes_to_the_panel(self):
        response = self.redeem()

        self.assertRedirects(response, reverse("panel:inicio"), fetch_redirect_response=False)
        user = get_user_model().objects.get(username=str(self.admin_id))
        self.assertEqual(self.client.session["_auth_user_id"], str(user.pk))
        self.assertEqual(self.client.session[PANEL_SESSION_KEY], str(self.admin_id))

    def test_the_django_user_is_the_one_the_handoff_makes(self):
        self.redeem()

        user = get_user_model().objects.get()
        self.assertEqual(user.username, str(self.admin_id))
        self.assertFalse(user.has_usable_password())
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_a_user_that_a_handoff_already_made_is_reused(self):
        existing = get_user_model().objects.create(
            username=str(self.admin_id), email="admin@example.test"
        )

        self.redeem()

        self.assertEqual(get_user_model().objects.count(), 1)
        existing.refresh_from_db()
        self.assertEqual(existing.email, "admin@example.test")
        self.assertEqual(int(self.client.session["_auth_user_id"]), existing.pk)

    def test_it_counts_the_use_and_stamps_the_time(self):
        before = timezone.now()

        self.redeem()

        self.invite.refresh_from_db()
        self.assertEqual(self.invite.use_count, 1)
        self.assertGreaterEqual(self.invite.last_used_at, before)

    def test_the_response_carries_the_private_headers_too(self):
        response = self.redeem()

        self.assertEqual(response["Referrer-Policy"], "strict-origin")
        self.assertEqual(response["X-Robots-Tag"], "noindex, nofollow")
        self.assertIn("no-store", response["Cache-Control"])

    def test_it_goes_to_the_landing_path_of_the_invite(self):
        _invite, token = issue(supabase_user_id=self.admin_id, landing_path="/my-products/")

        response = self.redeem(url=invite_url(token))

        self.assertRedirects(response, "/my-products/", fetch_redirect_response=False)

    def test_a_landing_path_that_leaves_the_site_is_never_followed(self):
        # The model refuses these, so a row like this can only come from outside it.
        for bad in ("//evil.example", "https://evil.example", "/\\evil.example"):
            with self.subTest(path=bad):
                _invite, token = issue(supabase_user_id=self.admin_id)
                ReviewInvite.objects.filter(token_hash=hash_token(token)).update(landing_path=bad)

                response = self.redeem(client=Client(), url=invite_url(token))

                self.assertRedirects(
                    response, reverse("panel:inicio"), fetch_redirect_response=False
                )

    def test_it_is_logged_with_the_invite_and_the_user_and_never_with_the_token(self):
        with self.assertLogs("panel", level="INFO") as logs:
            self.redeem()

        output = "\n".join(logs.output)
        self.assertIn(str(self.admin_id), output)
        self.assertIn(f"invite {self.invite.pk}", output)
        self.assertNotIn(self.token, output)

    # the session

    def test_the_session_key_changes_when_the_session_opens(self):
        before = self.client.session.session_key

        self.redeem()

        self.assertNotEqual(self.client.session.session_key, before)
        self.assertFalse(Session.objects.filter(session_key=before).exists())

    def test_a_session_the_browser_already_held_for_the_same_user_is_replaced_too(self):
        # login() keeps the key of a session that is already this user's. A second invite
        # must not: whoever planted that key must not keep it.
        self.redeem()
        planted = self.client.session.session_key

        self.redeem()

        self.assertNotEqual(self.client.session.session_key, planted)
        self.assertFalse(Session.objects.filter(session_key=planted).exists())

    def test_the_session_of_another_signed_in_user_is_replaced(self):
        other = get_user_model().objects.create_user("local")
        self.client.force_login(other)

        self.redeem()

        self.assertEqual(self.client.session[PANEL_SESSION_KEY], str(self.admin_id))
        self.assertEqual(
            self.client.session["_auth_user_id"],
            str(get_user_model().objects.get(username=str(self.admin_id)).pk),
        )

    # the panel keeps checking

    def test_the_session_reaches_the_panel_like_a_handoff_one(self):
        self.redeem()

        response = self.client.get(reverse("panel:inicio"))

        self.assertRedirects(response, reverse("inventory:list"), fetch_redirect_response=False)

    def test_the_role_is_still_read_on_every_request_and_demoting_ends_the_access(self):
        self.redeem()
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE profiles SET role = 'customer' WHERE id = %s", [self.admin_id.hex]
            )

        response = self.client.get(reverse("panel:inicio"))

        self.assertRedirects(response, reverse("panel:acceso"), fetch_redirect_response=False)
        self.assertFalse(has_session(self.client))

    def test_the_session_remembers_which_invite_opened_it(self):
        self.redeem()

        self.assertEqual(self.client.session[PANEL_INVITE_SESSION_KEY], self.invite.pk)

    def test_a_session_of_the_supabase_handoff_carries_no_invite(self):
        client = Client()

        hand_off(client, self.admin_id)

        self.assertIn(PANEL_SESSION_KEY, client.session)
        self.assertNotIn(PANEL_INVITE_SESSION_KEY, client.session)

    def test_a_handoff_after_an_invite_session_of_the_same_user_drops_the_invite(self):
        # login() keeps the data of a session that is already this user's.
        self.redeem()

        hand_off(self.client, self.admin_id)

        self.assertIn(PANEL_SESSION_KEY, self.client.session)
        self.assertNotIn(PANEL_INVITE_SESSION_KEY, self.client.session)

    # who is refused

    def test_a_user_that_was_deactivated_in_django_is_refused_and_nothing_is_used_up(self):
        get_user_model().objects.create(username=str(self.admin_id), is_active=False)

        response = self.redeem()

        self.assertEqual(response.status_code, 404)
        self.assertContains(response, GENERIC_PAGE, status_code=404)
        self.assertFalse(has_session(self.client))
        self.invite.refresh_from_db()
        self.assertEqual(self.invite.use_count, 0)

    def not_admins(self):
        """One invite per kind of target that is no panel admin: (name, invite, token, user id)."""
        customer, nobody, demoted = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
        insert_profile(customer, "customer")
        insert_profile(demoted, "admin")
        cases = [
            ("customer", customer),
            ("no profile", nobody),
            ("demoted after the invite was issued", demoted),
        ]
        issued = [(name, *issue(supabase_user_id=user_id), user_id) for name, user_id in cases]
        with connection.cursor() as cursor:
            cursor.execute("UPDATE profiles SET role = 'customer' WHERE id = %s", [demoted.hex])
        return issued

    def test_a_target_who_is_not_a_panel_admin_is_refused_and_nothing_is_used_up(self):
        for name, invite, token, user_id in self.not_admins():
            with self.subTest(target=name):
                client = Client()

                response = self.redeem(client, invite_url(token))

                self.assertEqual(response.status_code, 404)
                self.assertContains(response, GENERIC_PAGE, status_code=404)
                self.assertFalse(has_session(client))
                invite.refresh_from_db()
                self.assertEqual(invite.use_count, 0)
                self.assertIsNone(invite.last_used_at)
                self.assertFalse(get_user_model().objects.filter(username=str(user_id)).exists())

    def test_a_refused_target_does_not_use_up_the_last_use_of_a_limited_invite(self):
        customer = uuid.uuid4()
        insert_profile(customer, "customer")
        _invite, token = issue(supabase_user_id=customer, max_uses=1)

        self.redeem(Client(), invite_url(token))

        invite = ReviewInvite.objects.get(token_hash=hash_token(token))
        self.assertIsNone(invite.refusal_reason())

    def test_the_refusal_of_a_target_who_is_not_an_admin_is_logged_with_its_reason(self):
        customer = uuid.uuid4()
        insert_profile(customer, "customer")
        invite, token = issue(supabase_user_id=customer)

        with self.assertLogs("panel", level="WARNING") as logs:
            self.redeem(Client(), invite_url(token))

        output = "\n".join(logs.output)
        self.assertIn("not_admin", output)
        self.assertIn(f"invite {invite.pk}", output)
        self.assertNotIn(token, output)

    def test_a_limit_of_one_use_lets_the_first_in_and_refuses_the_second(self):
        _invite, token = issue(supabase_user_id=self.admin_id, max_uses=1)
        url = invite_url(token)
        first, second = Client(), Client()

        self.assertEqual(self.redeem(first, url).status_code, 302)
        refused = self.redeem(second, url)

        self.assertEqual(refused.status_code, 404)
        self.assertFalse(has_session(second))
        self.assertEqual(ReviewInvite.objects.get(token_hash=hash_token(token)).use_count, 1)

    def test_a_limit_of_two_uses_lets_exactly_two_in(self):
        _invite, token = issue(supabase_user_id=self.admin_id, max_uses=2)
        url = invite_url(token)

        statuses = [self.redeem(Client(), url).status_code for _ in range(4)]

        self.assertEqual(statuses, [302, 302, 404, 404])
        self.assertEqual(ReviewInvite.objects.get(token_hash=hash_token(token)).use_count, 2)

    def test_without_a_limit_the_link_can_be_used_again(self):
        statuses = [self.redeem(Client()).status_code for _ in range(3)]

        self.assertEqual(statuses, [302, 302, 302])
        self.invite.refresh_from_db()
        self.assertEqual(self.invite.use_count, 3)

    def test_a_revoked_link_stops_working_even_after_it_worked(self):
        self.assertEqual(self.redeem(Client()).status_code, 302)
        ReviewInvite.objects.filter(pk=self.invite.pk).update(revoked_at=timezone.now())

        self.assertEqual(self.redeem(Client()).status_code, 404)

    def test_a_failure_while_opening_the_session_does_not_use_the_invite_up(self):
        client = Client(raise_request_exception=False)

        with mock.patch("panel.views.open_panel_session", side_effect=RuntimeError("boom")):
            response = client.post(self.url)

        self.assertEqual(response.status_code, 500)
        self.invite.refresh_from_db()
        self.assertEqual(self.invite.use_count, 0)
        self.assertIsNone(self.invite.last_used_at)

    # CSRF

    def csrf_client(self):
        """A client that enforces CSRF, and the token of the page it got."""
        client = Client(enforce_csrf_checks=True)
        page = client.get(self.url)
        return client, csrf_token_of(page)

    def test_it_is_protected_by_the_csrf_check(self):
        client, _token = self.csrf_client()

        response = client.post(self.url)

        self.assertEqual(response.status_code, 403)
        self.assertFalse(has_session(client))
        self.invite.refresh_from_db()
        self.assertEqual(self.invite.use_count, 0)

    def test_it_works_with_the_csrf_token_of_the_page(self):
        client, token = self.csrf_client()

        response = client.post(self.url, {"csrfmiddlewaretoken": token})

        self.assertRedirects(response, reverse("panel:inicio"), fetch_redirect_response=False)
        self.assertTrue(has_session(client))

    def test_a_token_that_is_not_the_one_of_the_page_is_refused(self):
        client, _token = self.csrf_client()

        response = client.post(self.url, {"csrfmiddlewaretoken": "x" * 64})

        self.assertEqual(response.status_code, 403)
        self.assertFalse(has_session(client))

    def test_the_origin_a_browser_sends_from_the_page_is_accepted(self):
        # The page is served with `strict-origin`, which leaves the real origin in the POST.
        client, token = self.csrf_client()

        response = client.post(
            self.url, {"csrfmiddlewaretoken": token}, HTTP_ORIGIN="http://testserver"
        )

        self.assertEqual(response.status_code, 302)

    def test_a_null_origin_fails_the_check_which_is_why_the_page_is_not_no_referrer(self):
        # With `Referrer-Policy: no-referrer` a browser sends `Origin: null` on the form POST,
        # and Django refuses a null origin: nobody could ever redeem a link.
        client, token = self.csrf_client()

        response = client.post(self.url, {"csrfmiddlewaretoken": token}, HTTP_ORIGIN="null")

        self.assertEqual(response.status_code, 403)
        self.assertNotEqual(client.get(self.url)["Referrer-Policy"], "no-referrer")


@override_settings(REVIEW_INVITES_ENABLED=True)
class InviteSessionLifetimeTests(TestCase):
    """A session an invite opened lasts as long as the invite does, not as long as the cookie."""

    @classmethod
    def setUpTestData(cls):
        cls.admin_id = uuid.uuid4()
        insert_profile(cls.admin_id, "admin")

    def setUp(self):
        self.invite, self.token = issue(supabase_user_id=self.admin_id)
        self.client.post(invite_url(self.token))

    def assert_panel_open(self, client=None):
        response = (client or self.client).get(reverse("panel:inicio"))
        self.assertRedirects(response, reverse("inventory:list"), fetch_redirect_response=False)

    def assert_panel_closed(self, client=None):
        client = client or self.client
        response = client.get(reverse("panel:inicio"))
        self.assertRedirects(response, reverse("panel:acceso"), fetch_redirect_response=False)
        self.assertFalse(has_session(client))

    def test_the_session_works_while_the_invite_is_alive(self):
        self.assert_panel_open()
        self.assert_panel_open()

    def test_revoking_the_invite_ends_the_session_it_already_opened(self):
        ReviewInvite.objects.filter(pk=self.invite.pk).update(revoked_at=timezone.now())

        self.assert_panel_closed()

    def test_the_invite_expiring_ends_the_session_it_already_opened(self):
        past = timezone.now() - timedelta(seconds=1)
        ReviewInvite.objects.filter(pk=self.invite.pk).update(expires_at=past)

        self.assert_panel_closed()

    def test_deleting_the_invite_ends_the_session_it_opened(self):
        ReviewInvite.objects.filter(pk=self.invite.pk).delete()

        self.assert_panel_closed()

    def test_a_session_that_ends_this_way_stays_ended(self):
        ReviewInvite.objects.filter(pk=self.invite.pk).update(revoked_at=timezone.now())
        self.assert_panel_closed()

        # Un-revoking it does not bring back a session that was closed.
        ReviewInvite.objects.filter(pk=self.invite.pk).update(revoked_at=None)

        self.assert_panel_closed()

    def test_the_bridge_does_not_wave_a_revoked_session_through(self):
        ReviewInvite.objects.filter(pk=self.invite.pk).update(revoked_at=timezone.now())

        response = self.client.get(reverse("panel:acceso"))

        self.assertRedirects(response, settings.STORE_LOGIN_URL, fetch_redirect_response=False)

    def test_running_out_of_uses_does_not_end_the_session_that_took_the_last_one(self):
        _invite, token = issue(supabase_user_id=self.admin_id, max_uses=1)
        client = Client()
        self.assertEqual(client.post(invite_url(token)).status_code, 302)

        self.assert_panel_open(client)

    def test_revoking_another_invite_leaves_this_session_alone(self):
        other, _token = issue(supabase_user_id=self.admin_id)
        ReviewInvite.objects.filter(pk=other.pk).update(revoked_at=timezone.now())

        self.assert_panel_open()

    def test_revoking_an_invite_leaves_a_handoff_session_of_the_same_user_alone(self):
        client = Client()
        hand_off(client, self.admin_id)
        ReviewInvite.objects.filter(pk=self.invite.pk).update(revoked_at=timezone.now())

        self.assert_panel_open(client)

    def test_a_handoff_after_the_invite_session_is_not_tied_to_the_invite(self):
        hand_off(self.client, self.admin_id)
        ReviewInvite.objects.filter(pk=self.invite.pk).update(revoked_at=timezone.now())

        self.assert_panel_open()

    def test_signing_out_still_works_for_a_session_whose_invite_was_revoked(self):
        ReviewInvite.objects.filter(pk=self.invite.pk).update(revoked_at=timezone.now())

        response = self.client.post(reverse("panel:salir"))

        self.assertRedirects(response, settings.STORE_LOGIN_URL, fetch_redirect_response=False)
        self.assertFalse(has_session(self.client))


class ReviewInviteAdminTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.superuser = get_user_model().objects.create_superuser("admin")
        cls.user_id = uuid.uuid4()

    def setUp(self):
        self.client.force_login(self.superuser)
        self.invite, self.token = issue(
            label="Profesora de M15", supabase_user_id=self.user_id, max_uses=3
        )
        self.changelist = reverse("admin:panel_reviewinvite_changelist")

    def test_adding_is_not_possible_because_issuing_is_the_job_of_the_command(self):
        response = self.client.get(reverse("admin:panel_reviewinvite_add"))

        self.assertEqual(response.status_code, 403)

    def test_the_changelist_shows_label_user_expiry_revocation_uses_and_last_use(self):
        response = self.client.get(self.changelist)

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Profesora de M15")
        self.assertContains(response, str(self.user_id))
        self.assertEqual(
            list(ReviewInviteAdmin.list_display),
            ["label", "supabase_user_id", "expires_at", "is_revoked", "uses", "last_used_at"],
        )
        self.assertContains(response, "0 / 3")

    def test_neither_the_hash_nor_the_token_is_shown_anywhere(self):
        pages = [
            self.client.get(self.changelist),
            self.client.get(reverse("admin:panel_reviewinvite_change", args=[self.invite.pk])),
        ]

        for page in pages:
            self.assertEqual(page.status_code, 200)
            self.assertNotContains(page, self.token)
            self.assertNotContains(page, self.invite.token_hash)
        for name in ("token", "token_hash"):
            self.assertNotIn(name, ReviewInviteAdmin.list_display)
            self.assertNotIn(name, ReviewInviteAdmin.fields)
            self.assertNotIn(name, ReviewInviteAdmin.search_fields)

    def test_only_the_label_can_be_edited(self):
        editable = set(ReviewInviteAdmin.fields) - set(ReviewInviteAdmin.readonly_fields)

        self.assertEqual(editable, {"label"})

    def revoke(self, *invites):
        return self.client.post(
            self.changelist,
            {"action": "revoke", "_selected_action": [invite.pk for invite in invites]},
            follow=True,
        )

    def test_the_revoke_action_revokes_the_selected_invites(self):
        other, _ = issue()
        untouched, _ = issue()

        response = self.revoke(self.invite, other)

        self.assertContains(response, "Se revocaron 2 invitaciones.")
        self.invite.refresh_from_db()
        other.refresh_from_db()
        untouched.refresh_from_db()
        self.assertIsNotNone(self.invite.revoked_at)
        self.assertIsNotNone(other.revoked_at)
        self.assertIsNone(untouched.revoked_at)

    def test_revoking_one_that_was_already_revoked_keeps_its_date(self):
        ReviewInvite.objects.filter(pk=self.invite.pk).update(
            revoked_at=timezone.now() - timedelta(days=1)
        )
        self.invite.refresh_from_db()
        first = self.invite.revoked_at

        response = self.revoke(self.invite)

        self.assertContains(response, "Se revocaron 0 invitaciones.")
        self.invite.refresh_from_db()
        self.assertEqual(self.invite.revoked_at, first)

    def test_a_revoked_link_no_longer_opens(self):
        self.revoke(self.invite)

        with override_settings(REVIEW_INVITES_ENABLED=True):
            response = Client().post(invite_url(self.token))

        self.assertEqual(response.status_code, 404)

    def test_the_revoked_column_is_a_boolean_that_follows_the_date(self):
        admin = ReviewInviteAdmin(ReviewInvite, None)

        self.assertFalse(admin.is_revoked(self.invite))
        self.invite.revoked_at = timezone.now()
        self.assertTrue(admin.is_revoked(self.invite))

    def test_the_uses_column_says_how_many_of_how_many(self):
        admin = ReviewInviteAdmin(ReviewInvite, None)
        unlimited, _ = issue()
        unlimited.use_count = 4

        self.assertEqual(admin.uses(self.invite), "0 / 3")
        self.assertEqual(admin.uses(unlimited), "4 / ∞")


def run_issue(*args):
    """Run issue_review_invite and return what it printed on stdout and on stderr."""
    out, err = StringIO(), StringIO()
    call_command("issue_review_invite", *args, stdout=out, stderr=err)
    return out.getvalue(), err.getvalue()


@override_settings(REVIEW_INVITES_ENABLED=True)
class IssueReviewInviteCommandTests(TestCase):
    BASE_URL = "https://demo.example"

    @classmethod
    def setUpTestData(cls):
        cls.admin_id = uuid.uuid4()
        insert_profile(cls.admin_id, "admin")

    def argv(self, **overrides):
        """The command line. A keyword is an option without its dashes (`max_uses="3"`) and a
        value of None leaves that option out."""
        options = {
            "supabase_user": str(self.admin_id),
            "label": "Profesora M15",
            "days": "7",
            "base_url": self.BASE_URL,
            **overrides,
        }
        return [
            part
            for name, value in options.items()
            if value is not None
            for part in (f"--{name.replace('_', '-')}", str(value))
        ]

    def run_with(self, **overrides):
        return run_issue(*self.argv(**overrides))

    def link_in(self, output):
        found = re.findall(r"https?://\S+/panel/invitado/[A-Za-z0-9_-]+/", output)
        self.assertEqual(len(found), 1, output)
        return found[0]

    def test_it_prints_the_full_link_once_and_stores_only_the_hash(self):
        out, _err = self.run_with()

        link = self.link_in(out)
        token = link.rstrip("/").rsplit("/", 1)[1]
        invite = ReviewInvite.objects.get()
        self.assertTrue(link.startswith(f"{self.BASE_URL}/panel/invitado/"))
        self.assertEqual(invite.token_hash, hash_token(token))
        self.assertEqual(out.count(token), 1)
        stored = [str(getattr(invite, field.attname)) for field in invite._meta.concrete_fields]
        self.assertFalse([value for value in stored if token in value])

    def test_the_link_it_prints_opens_the_confirmation_page(self):
        out, _err = self.run_with()

        path = self.link_in(out).removeprefix(self.BASE_URL)
        response = Client().get(path)

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Profesora M15")

    def test_it_stores_what_it_was_given(self):
        before = timezone.now()

        self.run_with(max_uses="3", landing="/my-products/")

        invite = ReviewInvite.objects.get()
        self.assertEqual(invite.label, "Profesora M15")
        self.assertEqual(invite.supabase_user_id, self.admin_id)
        self.assertEqual(invite.max_uses, 3)
        self.assertEqual(invite.landing_path, "/my-products/")
        self.assertGreaterEqual(invite.expires_at, before + timedelta(days=7))
        self.assertLessEqual(invite.expires_at, timezone.now() + timedelta(days=7))

    def test_the_landing_page_and_the_limit_are_optional(self):
        self.run_with()

        invite = ReviewInvite.objects.get()
        self.assertEqual(invite.landing_path, "/panel/")
        self.assertIsNone(invite.max_uses)

    def test_it_says_when_the_link_expires_and_that_it_is_shown_only_once(self):
        out, _err = self.run_with()

        expires = ReviewInvite.objects.get().expires_at
        self.assertIn(date_format(localtime(expires), "DATETIME_FORMAT").lower(), out)
        self.assertIn("solo se muestra esta vez", out)

    def test_the_trailing_slash_of_the_base_url_does_not_double_up(self):
        out, _err = self.run_with(base_url="https://demo.example/")

        self.assertIn("https://demo.example/panel/invitado/", out)
        self.assertNotIn("example//panel", out)

    def test_a_base_url_on_plain_http_is_only_accepted_for_the_local_machine(self):
        for base in ("http://localhost:8000", "http://127.0.0.1:8000"):
            with self.subTest(base=base):
                out, _err = self.run_with(base_url=base)
                self.assertIn(f"{base}/panel/invitado/", out)

        with self.assertRaisesMessage(CommandError, "https"):
            self.run_with(base_url="http://demo.example")

    def test_a_base_url_that_is_not_an_origin_is_refused(self):
        for base in ("demo.example", "ftp://demo.example", "https://demo.example/panel", ""):
            with self.subTest(base=base), self.assertRaisesMessage(CommandError, "--base-url"):
                self.run_with(base_url=base)
        self.assertEqual(ReviewInvite.objects.count(), 0)

    def test_a_landing_path_that_leaves_the_site_is_refused_and_nothing_is_created(self):
        for path in ("//evil.example", "https://evil.example", "/\\evil.example"):
            with self.subTest(path=path), self.assertRaisesMessage(CommandError, "landing_path"):
                self.run_with(landing=path)
        self.assertEqual(ReviewInvite.objects.count(), 0)

    def test_the_days_have_to_be_between_one_and_ninety(self):
        for days in ("0", "-1", "91", "many"):
            with self.subTest(days=days), self.assertRaisesMessage(CommandError, "--days"):
                self.run_with(days=days)
        self.assertEqual(ReviewInvite.objects.count(), 0)

        for days in ("1", "90"):
            with self.subTest(days=days):
                self.run_with(days=days)
        self.assertEqual(ReviewInvite.objects.count(), 2)

    def test_a_limit_below_one_is_refused(self):
        for limit in ("0", "-2", "some"):
            with self.subTest(limit=limit), self.assertRaisesMessage(CommandError, "--max-uses"):
                self.run_with(max_uses=limit)
        self.assertEqual(ReviewInvite.objects.count(), 0)

    def test_an_empty_label_is_refused(self):
        with self.assertRaisesMessage(CommandError, "label"):
            self.run_with(label="")
        self.assertEqual(ReviewInvite.objects.count(), 0)

    def test_something_that_is_not_a_uuid_is_refused(self):
        with self.assertRaisesMessage(CommandError, "no es un UUID válido"):
            self.run_with(supabase_user="not-a-uuid")

    def test_a_user_who_is_not_an_admin_in_this_database_is_refused(self):
        customer = uuid.uuid4()
        insert_profile(customer, "customer")
        for user in (customer, uuid.uuid4()):
            with (
                self.subTest(user=str(user)),
                self.assertRaisesMessage(CommandError, "administrador"),
            ):
                self.run_with(supabase_user=str(user))
        self.assertEqual(ReviewInvite.objects.count(), 0)

    def test_every_option_that_has_no_default_is_required(self):
        for missing in ("supabase_user", "label", "days", "base_url"):
            with self.subTest(missing=missing), self.assertRaisesMessage(CommandError, "required"):
                self.run_with(**{missing: None})

    def test_it_warns_when_the_feature_is_off_because_the_link_would_answer_404(self):
        with override_settings(REVIEW_INVITES_ENABLED=False):
            out, err = self.run_with()

        self.assertIn("REVIEW_INVITES_ENABLED", err)
        self.assertEqual(len(re.findall(r"/panel/invitado/", out)), 1)

    def test_it_does_not_warn_when_the_feature_is_on(self):
        _out, err = self.run_with()

        self.assertEqual(err, "")
