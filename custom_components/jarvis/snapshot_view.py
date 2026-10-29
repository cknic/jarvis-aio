"""
JARVIS — authenticated snapshot view (A2).

Face-sighting frames (``recognition.py``) and intrusion stills (``intrusion.py``)
used to be written under ``<config>/www/jarvis/...`` and handed to the panel and
to notifications as ``/local/jarvis/...`` URLs. Home Assistant serves ``/local``
WITHOUT authentication, so anyone who could reach the HA port could pull camera
frames of the household. They now live outside the web root, under

    <config>/jarvis/snapshots/faces/<norm>.jpg
    <config>/jarvis/snapshots/intrusion/<tag>_<camera>_<ts>.jpg

and are served by the view below at

    /api/jarvis/snapshot/{kind}/{filename}        (requires_auth=True)

Authentication alone is not the boundary. ``kind`` decides who may fetch:

  * ``faces``     — **admin only**. Pinned face frames are biometric images of
                    other residents stored under a guessable name
                    (``<norm(name)>.jpg``, ``unknown_<camera>.jpg``); the
                    ``jarvis/faces`` and ``jarvis/face_reference`` websocket
                    commands are admin-only for the same reason, and an open
                    view would let any non-admin login bypass that by URL.
  * ``intrusion`` — any authenticated user. Intrusion stills are pushed to
                    EVERY household phone (``_notify_all_devices``) and the
                    companion app fetches them with that user's own token, so
                    non-admin members must be able to load them.

The caller is ``request[KEY_HASS_USER]``, which HA's auth middleware sets for
bearer-token and signed-path requests alike (the panel's ``auth/sign_path``
flow therefore keeps working for admins). No user → 401, fail-safe.

``kind`` is one of :data:`SNAPSHOT_KINDS`; ``filename`` must match
:data:`FILENAME_RE` (a single path component ending in ``.jpg``/``.jpeg``), so
``..``, slashes and anything else that could escape the snapshot directory are
rejected before a path is ever built. The file is read on the executor (never
on the event loop) and returned as ``image/jpeg`` with ``Cache-Control:
no-store``; anything else is a 404.

Consumers:
  * The panel cannot put a bearer token on an ``<img src>``, so it asks the
    frontend for a signed URL (``auth/sign_path``) before setting ``src`` —
    see ``_signedUrl`` in ``frontend/jarvis-panel.js``.
  * The HA companion app fetches ``/api/...`` notification images with the
    user's own auth, so ``notify.mobile_app_*`` attachments keep working.

MIGRATION NOTE (CHANGELOG): nothing is migrated. Frames already written under
``<config>/www/jarvis/{faces,intrusion}`` are left in place (they are still
reachable at ``/local/jarvis/...`` only as long as the owner keeps them; delete
the directory to close that off). Pinned-face index entries persisted with a
``/local/`` URL are dropped on restore and simply re-pin on the next confident
sighting. Filenames are unchanged.

``homeassistant.components.http`` and ``aiohttp`` are imported lazily inside
the functions that need them so this module stays importable under the unit
harness (which stubs neither) and the audit's import gate.
"""
from __future__ import annotations

import logging
import os
import re
from typing import Any, Optional

_LOGGER = logging.getLogger(__name__)

SNAPSHOT_URL_BASE = "/api/jarvis/snapshot"
SNAPSHOT_URL = SNAPSHOT_URL_BASE + "/{kind}/{filename}"
SNAPSHOT_VIEW_NAME = "api:jarvis:snapshot"
SNAPSHOT_KINDS: frozenset[str] = frozenset({"faces", "intrusion"})
# Kinds only an admin may fetch (see module docstring). Everything else in
# SNAPSHOT_KINDS is open to any authenticated user.
ADMIN_ONLY_KINDS: frozenset[str] = frozenset({"faces"})
FILENAME_RE = re.compile(r"^[A-Za-z0-9_.-]+\.jpe?g$")
# hass.data flag so a config-entry reload does not stack a second identical route.
DATA_KEY = "jarvis_snapshot_view"


# ── Pure helpers (no HA / aiohttp needed) ────────────────────────────────────

def snapshot_dir(kind: str, hass: Any | None = None) -> str:
    """``<config>/jarvis/snapshots/<kind>`` — the private store for ``kind``."""
    from .paths import config_path_str
    return config_path_str("jarvis", "snapshots", kind, hass=hass)


def snapshot_url(kind: str, filename: str) -> str:
    """The authenticated URL the panel / notifications should use for a file."""
    return f"{SNAPSHOT_URL_BASE}/{kind}/{filename}"


def valid_kind(kind: Any) -> bool:
    return isinstance(kind, str) and kind in SNAPSHOT_KINDS


def may_fetch(kind: Any, user: Any) -> bool:
    """Authorisation rule for one request: an authenticated user is required
    for every kind; :data:`ADMIN_ONLY_KINDS` additionally need ``user.is_admin``.
    Unknown kinds are refused here too (the 404 path would catch them anyway)."""
    if not valid_kind(kind) or user is None:
        return False
    if kind in ADMIN_ONLY_KINDS:
        return bool(getattr(user, "is_admin", False))
    return True


def valid_filename(filename: Any) -> bool:
    """A single safe path component ending in .jpg/.jpeg. Rejects traversal
    (``..`` cannot match because ``.`` runs are fine but ``/`` and ``\\`` never
    are, and a bare ``..`` has no ``.jpg`` suffix)."""
    if not isinstance(filename, str) or not filename:
        return False
    # fullmatch: ``$`` alone would still accept a trailing newline.
    if not FILENAME_RE.fullmatch(filename):
        return False
    # Belt and braces: no hidden/dot-led names (covers ".." and "..jpg"), and
    # never a separator even if the pattern were loosened later.
    if filename.startswith(".") or "/" in filename or "\\" in filename:
        return False
    return True


def resolve_snapshot_path(hass: Any, kind: str, filename: str) -> Optional[str]:
    """Validate ``kind``/``filename`` and return the absolute on-disk path, or
    None when either is unacceptable or the result escapes the snapshot dir."""
    if not valid_kind(kind) or not valid_filename(filename):
        return None
    base = os.path.realpath(snapshot_dir(kind, hass=hass))
    path = os.path.realpath(os.path.join(base, filename))
    # Defense in depth: the regex already forbids separators, but make sure the
    # resolved path is still inside the kind's directory.
    if os.path.dirname(path) != base:
        return None
    return path


def _read_file(path: str) -> Optional[bytes]:
    """Executor-side read. None for a missing/unreadable/non-file path."""
    try:
        if not os.path.isfile(path):
            return None
        with open(path, "rb") as f:
            return f.read()
    except Exception:
        return None


async def load_snapshot(hass: Any, kind: str, filename: str) -> Optional[bytes]:
    """The bytes of a stored snapshot, or None (invalid request / no such file).
    File I/O runs on the executor."""
    path = resolve_snapshot_path(hass, kind, filename)
    if path is None:
        return None
    try:
        return await hass.async_add_executor_job(_read_file, path)
    except Exception as exc:
        _LOGGER.debug("snapshot read failed for %s/%s: %s", kind, filename, exc)
        return None


# ── The HA view ──────────────────────────────────────────────────────────────

def _request_hass(request: Any) -> Any:
    """hass from an aiohttp request, tolerant of the KEY_HASS/"hass" app key."""
    app = getattr(request, "app", None) or {}
    try:
        from homeassistant.components.http import KEY_HASS
        hass = app[KEY_HASS]
        if hass is not None:
            return hass
    except Exception:
        pass
    try:
        return app["hass"]
    except Exception:
        return None


def _request_user(request: Any) -> Any:
    """The authenticated HA user on an aiohttp request (``request[KEY_HASS_USER]``,
    set by HA's auth middleware for bearer and signed-path requests), or None."""
    try:
        from homeassistant.components.http import KEY_HASS_USER
        key = KEY_HASS_USER
    except Exception:
        key = "hass_user"
    try:
        return request[key]
    except Exception:
        pass
    getter = getattr(request, "get", None)
    if callable(getter):
        try:
            return getter(key)
        except Exception:
            pass
    return None


def make_view_class() -> type:
    """Build the view class. Deferred so ``homeassistant.components.http`` is
    only imported when HA (or a test stub) actually provides it."""
    from homeassistant.components.http import HomeAssistantView

    class JarvisSnapshotView(HomeAssistantView):
        """GET /api/jarvis/snapshot/{kind}/{filename} → image/jpeg.

        ``requires_auth`` makes HA reject anonymous callers before ``get`` runs;
        :func:`may_fetch` then applies the per-kind rule (faces: admin only)."""

        url = SNAPSHOT_URL
        name = SNAPSHOT_VIEW_NAME
        requires_auth = True

        async def get(self, request: Any, kind: str, filename: str):
            from aiohttp import web
            if not valid_kind(kind) or not valid_filename(filename):
                return web.Response(status=404, text="snapshot not found")
            if not may_fetch(kind, _request_user(request)):
                # 401 (not 404): the caller is authenticated but not allowed
                # to see this kind; nothing about the file's existence leaks
                # because the check runs before any path is resolved.
                return web.Response(status=401, text="unauthorized")
            hass = _request_hass(request)
            data = None
            if hass is not None:
                data = await load_snapshot(hass, kind, filename)
            if not data:
                return web.Response(status=404, text="snapshot not found")
            return web.Response(
                body=data,
                content_type="image/jpeg",
                headers={"Cache-Control": "no-store"},
            )

    return JarvisSnapshotView


def async_register_snapshot_view(hass: Any) -> bool:
    """Register the view with ``hass.http``. Idempotent across config-entry
    reloads (guarded by ``hass.data[DATA_KEY]``). Returns True when the view is
    (or already was) registered; False when HA's http component is unavailable."""
    data = getattr(hass, "data", None)
    if isinstance(data, dict) and data.get(DATA_KEY):
        return True
    http = getattr(hass, "http", None)
    if http is None or not hasattr(http, "register_view"):
        _LOGGER.debug("JARVIS snapshot view: hass.http unavailable, not registered")
        return False
    try:
        http.register_view(make_view_class()())
    except Exception as exc:
        _LOGGER.warning("JARVIS snapshot view registration failed: %s", exc)
        return False
    if isinstance(data, dict):
        data[DATA_KEY] = True
    _LOGGER.info("JARVIS snapshot view registered: %s", SNAPSHOT_URL)
    return True
