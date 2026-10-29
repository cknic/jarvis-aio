"""The authenticated snapshot view against a real Home Assistant (PHACC).

Proves the per-kind rule end to end through HA's auth middleware:

* ``faces`` is admin-only — a non-admin login (the same user demoted out of the
  admin group) gets 401, so the admin-only ``jarvis/faces`` websocket command
  cannot be bypassed by guessing ``/api/jarvis/snapshot/faces/<name>.jpg``;
* ``intrusion`` is open to any authenticated user (the still is pushed to every
  household phone and fetched with that user's own token);
* anonymous requests are rejected by ``requires_auth`` before the view runs.

Provider construction and the platform forward are stubbed as in
``test_wiring_smoke``; the snapshot store is pointed at ``tmp_path``.
"""
from unittest.mock import AsyncMock, patch

from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.jarvis import snapshot_view

DOMAIN = "jarvis"
ENTRY_DATA = {
    "api_key": "", "model": "llama3.1", "honorific": "Sir",
    "llm_provider": "ollama", "llm_base_url": "http://localhost:11434/v1",
    "schema_version": 7,
}


class _FakeProvider:
    name = "fake"

    def chat(self, *a, **k):
        return {"text": "", "tool_calls": [], "raw": None}

    def supports_vision(self):
        return False


class _mock_setup:
    def __init__(self, store):
        self._store = store

    def __enter__(self):
        self._patchers = [
            patch("custom_components.jarvis.create_provider", return_value=_FakeProvider()),
            patch("homeassistant.config_entries.ConfigEntries.async_forward_entry_setups",
                  AsyncMock(return_value=None)),
            patch("homeassistant.config_entries.ConfigEntries.async_unload_platforms",
                  AsyncMock(return_value=True)),
            patch.object(snapshot_view, "snapshot_dir",
                         lambda kind, hass=None: str(self._store / kind)),
        ]
        for p in self._patchers:
            p.start()
        return self

    def __exit__(self, *exc):
        for p in reversed(self._patchers):
            p.stop()
        return False


async def _setup(hass):
    entry = MockConfigEntry(domain=DOMAIN, data=ENTRY_DATA, options={}, unique_id=DOMAIN)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


def _seed(store):
    (store / "faces").mkdir(parents=True)
    (store / "faces" / "sam.jpg").write_bytes(b"FACE-OF-SAM")
    (store / "intrusion").mkdir(parents=True)
    (store / "intrusion" / "intrusion_front_door_1730000000.jpg").write_bytes(b"STILL")


async def test_faces_admin_only_intrusion_any_user(
        hass, hass_client, hass_client_no_auth, hass_admin_user, tmp_path):
    _seed(tmp_path)
    with _mock_setup(tmp_path):
        entry = await _setup(hass)
        assert hass.data.get(snapshot_view.DATA_KEY) is True

        # admin: both kinds
        client = await hass_client()
        resp = await client.get("/api/jarvis/snapshot/faces/sam.jpg")
        assert resp.status == 200
        assert await resp.read() == b"FACE-OF-SAM"
        assert resp.headers["Content-Type"].startswith("image/jpeg")
        assert resp.headers["Cache-Control"] == "no-store"
        resp = await client.get("/api/jarvis/snapshot/intrusion/intrusion_front_door_1730000000.jpg")
        assert resp.status == 200 and await resp.read() == b"STILL"

        # the same login demoted to a plain household member
        hass_admin_user.groups = []
        hass_admin_user.invalidate_cache()
        assert hass_admin_user.is_admin is False
        member = await hass_client()
        resp = await member.get("/api/jarvis/snapshot/faces/sam.jpg")
        assert resp.status == 401
        resp = await member.get("/api/jarvis/snapshot/intrusion/intrusion_front_door_1730000000.jpg")
        assert resp.status == 200 and await resp.read() == b"STILL"
        # unknown file / traversal are still 404 for a permitted kind
        resp = await member.get("/api/jarvis/snapshot/intrusion/nope.jpg")
        assert resp.status == 404

        # anonymous: HA's requires_auth gate
        anon = await hass_client_no_auth()
        for path in ("/api/jarvis/snapshot/faces/sam.jpg",
                     "/api/jarvis/snapshot/intrusion/intrusion_front_door_1730000000.jpg"):
            resp = await anon.get(path)
            assert resp.status == 401, path

        assert await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()
