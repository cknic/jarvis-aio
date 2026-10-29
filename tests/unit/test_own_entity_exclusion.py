"""JARVIS's own native entities must never feed the scans they mirror.

Two feedback loops closed here:

* presence / area scans (``audio_routing.presence_entities_in_area``,
  ``panel_data._entities_in_area`` and therefore ``_area_capabilities``) skip
  entities whose registry entry has ``platform == DOMAIN``; otherwise assigning
  the JARVIS device to an area would make ``binary_sensor.jarvis_<room>_occupied``
  count as occupancy of the room it mirrors (occupied forever, permanent
  ``mmwave`` capability);
* the snapshot coordinator ignores ``state_changed`` for its own entities;
  otherwise every refresh (which rewrites ``sensor.jarvis_uptime`` at
  one-second granularity) re-armed the debounce and the coordinator refreshed
  itself at the Debouncer's 10 s cooldown instead of the 20 s poll.
"""
from __future__ import annotations

import sys
import types

from fakes import FakeHass


def _ent(entity_id, platform, area_id=None, device_id=None):
    return types.SimpleNamespace(entity_id=entity_id, platform=platform,
                                 area_id=area_id, device_id=device_id)


def _registry(ents: dict):
    return types.SimpleNamespace(entities=ents, async_get=lambda eid: ents.get(eid))


# ── entity_filter.is_own_entity ──────────────────────────────────────────────

def test_is_own_entity(load, monkeypatch):
    ef, const = load("entity_filter"), load("const")
    ents = {
        "binary_sensor.jarvis_kitchen_occupied": _ent("binary_sensor.jarvis_kitchen_occupied", const.DOMAIN),
        "binary_sensor.kitchen_motion": _ent("binary_sensor.kitchen_motion", "mqtt"),
    }
    monkeypatch.setattr(ef, "er", types.SimpleNamespace(async_get=lambda h: _registry(ents)))
    h = FakeHass()
    assert ef.is_own_entity(h, "binary_sensor.jarvis_kitchen_occupied") is True
    assert ef.is_own_entity(h, "binary_sensor.kitchen_motion") is False
    assert ef.is_own_entity(h, "binary_sensor.unregistered") is False
    assert ef.is_own_entity(h, "") is False
    assert ef.is_own_entity(h, None) is False


def test_is_own_entity_survives_registry_failure(load, monkeypatch):
    ef = load("entity_filter")

    def _boom(h):
        raise RuntimeError("registry not loaded")
    monkeypatch.setattr(ef, "er", types.SimpleNamespace(async_get=_boom))
    assert ef.is_own_entity(FakeHass(), "binary_sensor.x") is False


# ── presence scan ────────────────────────────────────────────────────────────

def test_presence_scan_skips_own_occupancy_mirror(load, monkeypatch):
    ar, ef, const = load("audio_routing"), load("entity_filter"), load("const")
    h = FakeHass()
    h.data = {const.DOMAIN: {"e1": {"runtime_config": {}}}}
    h.states.set("binary_sensor.kitchen_motion", "on", device_class="motion",
                 friendly_name="Kitchen Motion")
    h.states.set("binary_sensor.jarvis_kitchen_occupied", "on", device_class="occupancy",
                 friendly_name="JARVIS Kitchen occupied")
    ents = {
        "binary_sensor.jarvis_kitchen_occupied": _ent("binary_sensor.jarvis_kitchen_occupied", const.DOMAIN),
        "binary_sensor.kitchen_motion": _ent("binary_sensor.kitchen_motion", "mqtt"),
    }
    monkeypatch.setattr(ef, "er", types.SimpleNamespace(async_get=lambda hh: _registry(ents)))
    # both entities sit in the kitchen (the user assigned the JARVIS device there)
    monkeypatch.setattr(ar, "entity_area", lambda hh, e: "kitchen")

    assert ar.presence_entities_in_area(h, "kitchen") == ["binary_sensor.kitchen_motion"]


# ── room-card enumeration + capabilities ─────────────────────────────────────

def _patch_registries(monkeypatch, ents, devices=None):
    """Patch the registry modules exactly as panel_data resolves them at call
    time (``from homeassistant.helpers import entity_registry as er``), which
    is the package attribute — another test may have swapped the sys.modules
    entry, so patch both objects."""
    devices = devices or {}
    from homeassistant.helpers import entity_registry as er_attr, device_registry as dr_attr
    dev_reg = types.SimpleNamespace(async_get=lambda did: devices.get(did))
    for mod in {id(m): m for m in (
            er_attr, sys.modules["homeassistant.helpers.entity_registry"])}.values():
        monkeypatch.setattr(mod, "async_get", lambda hh: _registry(ents), raising=False)
    for mod in {id(m): m for m in (
            dr_attr, sys.modules["homeassistant.helpers.device_registry"])}.values():
        monkeypatch.setattr(mod, "async_get", lambda hh: dev_reg, raising=False)


def test_entities_in_area_skips_own_entities_by_entity_or_device_area(load, monkeypatch):
    pd, const = load("panel_data"), load("const")
    h = FakeHass()
    h.data = {const.DOMAIN: {"e1": {"runtime_config": {}}}}
    jarvis_dev = types.SimpleNamespace(area_id="kitchen")
    ents = {
        "binary_sensor.kitchen_motion": _ent("binary_sensor.kitchen_motion", "mqtt", area_id="kitchen"),
        "light.kitchen": _ent("light.kitchen", "hue", device_id="hue1"),
        # own entity placed directly in the area …
        "binary_sensor.jarvis_kitchen_occupied": _ent(
            "binary_sensor.jarvis_kitchen_occupied", const.DOMAIN, area_id="kitchen"),
        # … and own entity inheriting the area from the JARVIS device
        "sensor.jarvis_uptime": _ent("sensor.jarvis_uptime", const.DOMAIN, device_id="jarvis"),
    }
    _patch_registries(monkeypatch, ents, {"hue1": types.SimpleNamespace(area_id="kitchen"),
                                          "jarvis": jarvis_dev})
    out = pd._entities_in_area(h, "kitchen")
    assert sorted(out) == ["binary_sensor.kitchen_motion", "light.kitchen"]


def test_area_capabilities_do_not_gain_mmwave_from_own_mirror(load, monkeypatch):
    pd, const = load("panel_data"), load("const")
    h = FakeHass()
    h.data = {const.DOMAIN: {"e1": {"runtime_config": {}}}}
    h.states.set("binary_sensor.jarvis_kitchen_occupied", "on", device_class="occupancy")
    h.states.set("light.kitchen", "on")
    ents = {
        "binary_sensor.jarvis_kitchen_occupied": _ent(
            "binary_sensor.jarvis_kitchen_occupied", const.DOMAIN, area_id="kitchen"),
        "light.kitchen": _ent("light.kitchen", "hue", area_id="kitchen"),
    }
    _patch_registries(monkeypatch, ents)
    caps = pd._area_capabilities(h, "kitchen")
    assert "light" in caps
    assert "mmwave" not in caps


# ── coordinator debounce ─────────────────────────────────────────────────────

def test_coordinator_ignores_state_changes_of_own_entities(load, monkeypatch):
    coord_mod, ef, const = load("coordinator"), load("entity_filter"), load("const")
    ents = {"sensor.jarvis_uptime": _ent("sensor.jarvis_uptime", const.DOMAIN),
            "binary_sensor.jarvis_kitchen_occupied": _ent(
                "binary_sensor.jarvis_kitchen_occupied", const.DOMAIN)}
    monkeypatch.setattr(ef, "er", types.SimpleNamespace(async_get=lambda hh: _registry(ents)))

    armed: list = []
    ev_mod = types.ModuleType("homeassistant.helpers.event")
    ev_mod.async_call_later = lambda hass, delay, cb: armed.append((delay, cb)) or (lambda: None)
    monkeypatch.setitem(sys.modules, "homeassistant.helpers.event", ev_mod)
    monkeypatch.setattr(sys.modules["homeassistant.helpers"], "event", ev_mod, raising=False)

    coord = coord_mod.JarvisCoordinator.__new__(coord_mod.JarvisCoordinator)
    coord.hass = FakeHass()
    coord._debounce_unsub = None
    Event = sys.modules["homeassistant.core"].Event

    # our own entities (the echo of a refresh) never arm the debounce …
    coord._handle_state_changed(Event("state_changed", {"entity_id": "sensor.jarvis_uptime"}))
    coord._handle_state_changed(Event("state_changed",
                                      {"entity_id": "binary_sensor.jarvis_kitchen_occupied"}))
    assert armed == [] and coord._debounce_unsub is None
    # … nor does an unrelated domain …
    coord._handle_state_changed(Event("state_changed", {"entity_id": "media_player.tv"}))
    assert armed == []
    # … but a foreign sensor in a refresh domain still does, once.
    coord._handle_state_changed(Event("state_changed", {"entity_id": "sensor.kitchen_power"}))
    coord._handle_state_changed(Event("state_changed", {"entity_id": "sensor.kitchen_power"}))
    assert len(armed) == 1 and armed[0][0] == const.COORDINATOR_DEBOUNCE_S
    assert coord._debounce_unsub is not None
