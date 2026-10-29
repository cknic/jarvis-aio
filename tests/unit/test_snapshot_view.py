"""A2 — snapshots moved off the unauthenticated /local path.

snapshot_view serves <config>/jarvis/snapshots/{faces,intrusion}/<file>.jpg at
/api/jarvis/snapshot/{kind}/{filename} behind HA auth. These tests cover the
request validation (path traversal must be impossible), the executor-side read,
the aiohttp response shape (image/jpeg, Cache-Control: no-store, 404 otherwise),
the per-kind authorisation rule (faces admin-only, intrusion any authenticated
user, no user → 401), reload-idempotent registration, and that
recognition/intrusion now hand out /api/... URLs and write under the private
dir rather than www/.

The unit harness stubs neither homeassistant.components.http nor aiohttp, so
both are stubbed here per test (the module imports them lazily).
"""
from __future__ import annotations

import sys
import types

import pytest


# ── stubs ────────────────────────────────────────────────────────────────────

class _FakeResponse:
    """Captures what the view hands to aiohttp.web.Response."""
    def __init__(self, *, body=None, status=200, text=None, content_type=None, headers=None):
        self.body = body
        self.status = status
        self.text = text
        self.content_type = content_type
        self.headers = dict(headers or {})


def _install_http_stubs(monkeypatch):
    comps = sys.modules.setdefault(
        "homeassistant.components", types.ModuleType("homeassistant.components"))
    http = types.ModuleType("homeassistant.components.http")

    class HomeAssistantView:
        url = None
        name = None
        requires_auth = True

    http.HomeAssistantView = HomeAssistantView
    http.KEY_HASS = "hass"
    http.KEY_HASS_USER = "hass_user"
    monkeypatch.setitem(sys.modules, "homeassistant.components.http", http)
    monkeypatch.setattr(comps, "http", http, raising=False)

    aiohttp = types.ModuleType("aiohttp")
    web = types.ModuleType("aiohttp.web")
    web.Response = _FakeResponse
    aiohttp.web = web
    monkeypatch.setitem(sys.modules, "aiohttp", aiohttp)
    monkeypatch.setitem(sys.modules, "aiohttp.web", web)
    return http


@pytest.fixture
def sv(load, tmp_path, monkeypatch):
    """snapshot_view with the snapshot root pointed at tmp_path/<kind>."""
    mod = load("snapshot_view")
    paths = load("paths")
    calls: list = []

    def _cps(*parts, hass=None):
        calls.append(parts)
        return str(tmp_path.joinpath(*parts))
    monkeypatch.setattr(paths, "config_path_str", _cps)
    mod._test_calls = calls
    return mod


def _write(tmp_path, kind, name, data=b"\xff\xd8\xff\xe0jpeg"):
    d = tmp_path / "jarvis" / "snapshots" / kind
    d.mkdir(parents=True, exist_ok=True)
    (d / name).write_bytes(data)
    return d / name


# ── validation ───────────────────────────────────────────────────────────────

@pytest.mark.parametrize("name", [
    "sam.jpg", "sam.jpeg", "unknown_front_door.jpg",
    "intrusion_dining_room_1730000000.jpg", "a-b_c.d.jpg", "X9.jpg",
])
def test_valid_filenames_accepted(sv, name):
    assert sv.valid_filename(name) is True


@pytest.mark.parametrize("name", [
    "", None, 42, "..", "../sam.jpg", "..%2Fsam.jpg", "a/b.jpg", "a\\b.jpg",
    "/etc/passwd", "sam.png", "sam.jpg.txt", "sam", ".jpg", "sam .jpg",
    "sam.JPG", "sam.jpg\n", "s\x00am.jpg", "..jpg",
])
def test_bad_filenames_rejected(sv, name):
    assert sv.valid_filename(name) is False


@pytest.mark.parametrize("kind", ["faces", "intrusion"])
def test_valid_kinds(sv, kind):
    assert sv.valid_kind(kind) is True


@pytest.mark.parametrize("kind", ["", None, "www", "faces/", "../faces", "FACES", 3])
def test_bad_kinds(sv, kind):
    assert sv.valid_kind(kind) is False


def test_resolve_path_stays_inside_kind_dir(sv, tmp_path):
    import os
    p = sv.resolve_snapshot_path(None, "faces", "sam.jpg")
    assert p is not None
    assert os.path.dirname(p) == os.path.realpath(str(tmp_path / "jarvis" / "snapshots" / "faces"))
    assert os.path.basename(p) == "sam.jpg"
    # the dir is derived via paths.config_path_str with the private layout
    assert ("jarvis", "snapshots", "faces") in sv._test_calls


def test_resolve_path_rejects_traversal_and_bad_kind(sv):
    assert sv.resolve_snapshot_path(None, "faces", "../sam.jpg") is None
    assert sv.resolve_snapshot_path(None, "faces", "../../secrets.yaml") is None
    assert sv.resolve_snapshot_path(None, "www", "sam.jpg") is None
    assert sv.resolve_snapshot_path(None, "faces", "sub/sam.jpg") is None


def test_snapshot_url_shape(sv):
    assert sv.snapshot_url("faces", "sam.jpg") == "/api/jarvis/snapshot/faces/sam.jpg"
    assert sv.SNAPSHOT_URL == "/api/jarvis/snapshot/{kind}/{filename}"
    assert sv.SNAPSHOT_VIEW_NAME == "api:jarvis:snapshot"


# ── reading ──────────────────────────────────────────────────────────────────

async def test_load_snapshot_reads_existing_file_on_executor(sv, fake_hass, tmp_path):
    _write(tmp_path, "faces", "sam.jpg", b"JPEGBYTES")
    seen = []
    orig = fake_hass.async_add_executor_job

    async def _spy(fn, *a):
        seen.append(fn.__name__)
        return await orig(fn, *a)
    fake_hass.async_add_executor_job = _spy

    assert await sv.load_snapshot(fake_hass, "faces", "sam.jpg") == b"JPEGBYTES"
    assert seen == ["_read_file"]       # file I/O went through the executor


async def test_load_snapshot_missing_or_invalid_is_none(sv, fake_hass, tmp_path):
    assert await sv.load_snapshot(fake_hass, "faces", "nobody.jpg") is None
    _write(tmp_path, "faces", "sam.jpg")
    assert await sv.load_snapshot(fake_hass, "faces", "../sam.jpg") is None
    assert await sv.load_snapshot(fake_hass, "intrusion", "sam.jpg") is None   # wrong kind dir
    assert await sv.load_snapshot(fake_hass, "nope", "sam.jpg") is None


# ── the view itself ──────────────────────────────────────────────────────────

ADMIN = types.SimpleNamespace(is_admin=True, name="owner")
MEMBER = types.SimpleNamespace(is_admin=False, name="household member")


class _Request(dict):
    """aiohttp.web.Request look-alike: a mapping (``request[KEY_HASS_USER]``)
    with an ``app`` attribute."""
    def __init__(self, hass, user, key="hass"):
        super().__init__()
        if user is not None:
            self["hass_user"] = user
        self.app = {key: hass}


def _request(hass, user=ADMIN, key="hass"):
    return _Request(hass, user, key)


async def test_view_serves_jpeg_no_store(sv, fake_hass, tmp_path, monkeypatch):
    _install_http_stubs(monkeypatch)
    _write(tmp_path, "intrusion", "intrusion_dining_room_1.jpg", b"IMG")
    cls = sv.make_view_class()
    assert cls.url == "/api/jarvis/snapshot/{kind}/{filename}"
    assert cls.name == "api:jarvis:snapshot"
    assert cls.requires_auth is True
    view = cls()

    resp = await view.get(_request(fake_hass), "intrusion", "intrusion_dining_room_1.jpg")
    assert resp.status == 200
    assert resp.body == b"IMG"
    assert resp.content_type == "image/jpeg"
    assert resp.headers.get("Cache-Control") == "no-store"


@pytest.mark.parametrize("kind,name", [
    ("intrusion", "missing.jpg"),
    ("intrusion", "../intrusion_dining_room_1.jpg"),
    ("www", "intrusion_dining_room_1.jpg"),
    ("intrusion", "intrusion_dining_room_1.txt"),
])
async def test_view_404_for_missing_or_bad(sv, fake_hass, tmp_path, monkeypatch, kind, name):
    _install_http_stubs(monkeypatch)
    _write(tmp_path, "intrusion", "intrusion_dining_room_1.jpg", b"IMG")
    view = sv.make_view_class()()
    resp = await view.get(_request(fake_hass), kind, name)
    assert resp.status == 404
    assert resp.body is None


async def test_view_404_without_hass(sv, monkeypatch):
    _install_http_stubs(monkeypatch)
    view = sv.make_view_class()()
    resp = await view.get(_Request(None, ADMIN, key="nothing"), "faces", "sam.jpg")
    assert resp.status == 404


# ── authorisation: faces admin-only, intrusion any authenticated user ─────────

def test_may_fetch_rule(sv):
    assert sv.ADMIN_ONLY_KINDS == frozenset({"faces"})
    assert sv.may_fetch("faces", ADMIN) is True
    assert sv.may_fetch("faces", MEMBER) is False
    assert sv.may_fetch("intrusion", ADMIN) is True
    assert sv.may_fetch("intrusion", MEMBER) is True
    # fail-safe: no user, or a user object without the flag, never gets faces
    assert sv.may_fetch("faces", None) is False
    assert sv.may_fetch("intrusion", None) is False
    assert sv.may_fetch("faces", types.SimpleNamespace()) is False
    assert sv.may_fetch("www", ADMIN) is False


async def test_view_faces_denied_for_non_admin(sv, fake_hass, tmp_path, monkeypatch):
    """A non-admin HA login must not be able to pull a resident's face frame by
    its guessable name — that would bypass the admin-only jarvis/faces command."""
    _install_http_stubs(monkeypatch)
    _write(tmp_path, "faces", "sam.jpg", b"FACE")
    view = sv.make_view_class()()
    reads = []
    orig = fake_hass.async_add_executor_job

    async def _spy(fn, *a):
        reads.append(fn.__name__)
        return await orig(fn, *a)
    fake_hass.async_add_executor_job = _spy

    resp = await view.get(_request(fake_hass, MEMBER), "faces", "sam.jpg")
    assert resp.status == 401
    assert resp.body is None
    assert reads == []          # denied before any disk access

    # ...while an admin still gets the frame.
    resp = await view.get(_request(fake_hass, ADMIN), "faces", "sam.jpg")
    assert resp.status == 200 and resp.body == b"FACE"


async def test_view_intrusion_open_to_any_authenticated_user(sv, fake_hass, tmp_path, monkeypatch):
    """Intrusion stills are pushed to every household phone; the companion app
    fetches them with the member's own token, so a non-admin must succeed."""
    _install_http_stubs(monkeypatch)
    _write(tmp_path, "intrusion", "intrusion_front_door_1.jpg", b"STILL")
    view = sv.make_view_class()()
    resp = await view.get(_request(fake_hass, MEMBER), "intrusion", "intrusion_front_door_1.jpg")
    assert resp.status == 200 and resp.body == b"STILL"


@pytest.mark.parametrize("kind", ["faces", "intrusion"])
async def test_view_401_without_a_user(sv, fake_hass, tmp_path, monkeypatch, kind):
    """requires_auth should guarantee a user; if the middleware ever did not
    attach one, deny rather than serve (fail-safe, like websocket._is_admin)."""
    _install_http_stubs(monkeypatch)
    _write(tmp_path, kind, "x.jpg", b"IMG")
    view = sv.make_view_class()()
    resp = await view.get(_request(fake_hass, None), kind, "x.jpg")
    assert resp.status == 401


async def test_request_user_reads_mapping_or_get(sv, monkeypatch):
    _install_http_stubs(monkeypatch)
    assert sv._request_user(_Request(None, MEMBER)) is MEMBER
    assert sv._request_user(_Request(None, None)) is None
    # an object exposing only .get()
    assert sv._request_user(types.SimpleNamespace(get=lambda k: ADMIN if k == "hass_user" else None)) is ADMIN
    assert sv._request_user(types.SimpleNamespace(app={})) is None


# ── registration ─────────────────────────────────────────────────────────────

def test_register_is_idempotent_across_reloads(sv, fake_hass, monkeypatch):
    _install_http_stubs(monkeypatch)
    registered = []
    fake_hass.http = types.SimpleNamespace(register_view=lambda v: registered.append(v))

    assert sv.async_register_snapshot_view(fake_hass) is True
    assert sv.async_register_snapshot_view(fake_hass) is True     # reload: no 2nd route
    assert len(registered) == 1
    assert registered[0].url == sv.SNAPSHOT_URL
    assert registered[0].requires_auth is True
    assert fake_hass.data[sv.DATA_KEY] is True


def test_register_without_http_is_noop(sv, fake_hass):
    assert not hasattr(fake_hass, "http")
    assert sv.async_register_snapshot_view(fake_hass) is False
    assert sv.DATA_KEY not in fake_hass.data


def test_register_failure_is_contained(sv, fake_hass, monkeypatch):
    _install_http_stubs(monkeypatch)

    def _boom(v):
        raise RuntimeError("router frozen")
    fake_hass.http = types.SimpleNamespace(register_view=_boom)
    assert sv.async_register_snapshot_view(fake_hass) is False
    assert sv.DATA_KEY not in fake_hass.data


# ── producers hand out /api URLs and write off the web root ──────────────────

def test_recognition_and_intrusion_use_authenticated_urls(load):
    recog = load("recognition")
    intr = load("intrusion")
    assert recog.FACE_SNAPSHOT_URL_BASE == "/api/jarvis/snapshot/faces"
    assert intr.SNAPSHOT_URL_BASE == "/api/jarvis/snapshot/intrusion"
    assert "/local/" not in recog.FACE_SNAPSHOT_URL_BASE
    assert "/local/" not in intr.SNAPSHOT_URL_BASE
    assert intr.SNAPSHOT_DIR.replace("\\", "/").endswith("jarvis/snapshots/intrusion")
    assert "/www/" not in intr.SNAPSHOT_DIR.replace("\\", "/")
