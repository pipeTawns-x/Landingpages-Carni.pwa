# Register project-level Django system checks (config is not an installed app,
# so Django would not auto-discover config/checks.py on its own).
from . import checks  # noqa: F401
