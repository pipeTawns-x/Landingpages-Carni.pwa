"""Logging filters.

A review invite link carries its token in the path (`/panel/invitado/<token>/`), and Django logs
the path of a failed request: a 500 writes `Internal Server Error: <path>` to the console, which
on Render is the one log there is. The token is a bearer secret, so it must not reach that log.
"""

import logging
import re

# The path of an invite and whatever follows it up to a space or a quote, so a query string goes
# with it. A token is URL-safe base64, but the filter does not rely on that: any path under
# `/panel/invitado/` is rewritten, whether it is a real token or not.
INVITE_PATH = re.compile(r"/panel/invitado/[^\s\"'<>]+")

REDACTED = "/panel/invitado/<redacted>"


class RedactInviteToken(logging.Filter):
    """Replace the token in `/panel/invitado/<token>/` with `<redacted>` in a log record.

    It rewrites the message, not the traceback text: a traceback holds source lines and the
    message of the exception, never the path of the request. It never drops a record.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            message = record.getMessage()
        except (TypeError, ValueError):
            # A log call whose arguments do not fit its message. Logging reports that itself
            # when it formats the record; a filter that raised here would turn a logging
            # mistake into an error inside the request that was being logged.
            return True

        redacted = INVITE_PATH.sub(REDACTED, message)
        if redacted != message:
            record.msg = redacted
            record.args = ()
        return True
