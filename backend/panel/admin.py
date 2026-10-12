"""Admin site for the review invites: look at them and revoke them.

The command `issue_review_invite` is the only way to make one, because a link has to be
shown once, when it is issued, and an admin form cannot do that. The hash of the token and
the token itself are never shown here.
"""

from django.contrib import admin, messages
from django.utils import timezone
from django.utils.translation import ngettext

from panel.models import ReviewInvite


@admin.register(ReviewInvite)
class ReviewInviteAdmin(admin.ModelAdmin):
    list_display = ("label", "supabase_user_id", "expires_at", "is_revoked", "uses", "last_used_at")
    # Listed one by one, so that a field added to the model later (the hash is one of them) is
    # not shown until someone decides it should be.
    fields = (
        "label",
        "supabase_user_id",
        "landing_path",
        "created_at",
        "expires_at",
        "revoked_at",
        "max_uses",
        "use_count",
        "last_used_at",
    )
    # Only the label can be edited. An invite is not extended or reopened: a new one is issued.
    readonly_fields = tuple(field for field in fields if field != "label")
    search_fields = ("label",)
    actions = ["revoke"]

    def has_add_permission(self, request):
        return False

    @admin.display(boolean=True, description="revocada", ordering="revoked_at")
    def is_revoked(self, invite):
        return invite.revoked_at is not None

    @admin.display(description="usos", ordering="use_count")
    def uses(self, invite):
        limit = "∞" if invite.max_uses is None else invite.max_uses
        return f"{invite.use_count} / {limit}"

    @admin.action(description="Revocar las invitaciones seleccionadas", permissions=["change"])
    def revoke(self, request, queryset):
        # One that was revoked already keeps the date it was revoked on.
        revoked = queryset.filter(revoked_at__isnull=True).update(revoked_at=timezone.now())
        self.message_user(
            request,
            ngettext(
                "Se revocó %(count)d invitación.",
                "Se revocaron %(count)d invitaciones.",
                revoked,
            )
            % {"count": revoked},
            messages.SUCCESS,
        )
