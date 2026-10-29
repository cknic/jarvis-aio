"""Panel snapshot builder — the live-state half of ``jarvis/get_panel_data``.

:func:`build_snapshot` returns everything the panel's ``get_panel_data`` command
sends EXCEPT the ``config`` sub-dict (which carries the settings mirror plus the
``onboarding`` block and stays in ``websocket.ws_get_panel_data``). The same
snapshot feeds :class:`coordinator.JarvisCoordinator`, so native Home Assistant
entities (sensor/binary_sensor/alarm_control_panel/…) and the panel render from
one source of truth.

Snapshot schema (top-level keys, in wire order)::

    status            dict  status tiles — see :func:`status_tiles`
    version           str   integration version from manifest.json
    meta              dict  bedrooms, areas_monitored, announcements_today, est_cost, uptime
    dominant          dict  area_id, name, subtitle, coord, temp, humidity, lights, satellite, last_motion
    areas             list  per-area rows — see :func:`area_rows`
    sleep_reason      str|None
    doorbell_training dict  {stats, recent}
    doors             dict  {door slot -> open bool}
    lockdown          dict  cognitive_core.lockdown_status()
    intrusion         dict  cognitive_core.intrusion_status()
    knowledge         dict  knowledge.stats()
    suggestions       list  pending automation suggestions
    goals             list  active/recent goals

The helpers below used to live in ``websocket.py`` and the unit suite patches
them there (``monkeypatch.setattr(websocket, "_area_name", …)``). websocket.py
re-exports every one under its old name and registers itself as the *hook
namespace* via :func:`register_hook_namespace`; every call between helpers in
this module resolves through :func:`_h`, so a patch applied on either module
takes effect. Dependency direction stays websocket → panel_data (never back).
"""
from __future__ import annotations

import asyncio
import json as _json
import logging
import pathlib
import time
from typing import Any, Optional

from homeassistant.core import HomeAssistant

from . import audio_routing, sleep_detection
from .const import (
    CONF_BEDROOM_AREAS,
    CONF_BROADCAST_GROUP,
    CONF_CUSTOM_BASE_URL,
    CONF_NOTIFY_SERVICE,
    CONF_OBSERVER_ENABLED,
    CONF_OBSERVER_QUIET_END,
    CONF_OBSERVER_QUIET_START,
    CONF_OLLAMA_BASE_URL,
    DEFAULT_OBSERVER_QUIET_END,
    DEFAULT_OBSERVER_QUIET_START,
    DOMAIN,
    PROVIDER_API_KEY_FIELDS,
)

_LOGGER = logging.getLogger(__name__)

# Startup wall-clock — for uptime computation
_STARTUP_TS: float = time.time()


# ─── Hook namespace (legacy monkeypatch seam) ────────────────────────────────

_HOOKS: Any = None
_ORIGINALS: dict[str, Any] = {}


def register_hook_namespace(ns: Any) -> None:
    """Register a module whose same-named attributes override this module's
    helpers (websocket.py registers itself). See the module docstring."""
    global _HOOKS
    _HOOKS = ns


def _h(name: str):
    """Resolve helper ``name`` honouring patches on either module: a hook
    attribute that differs from our original wins; otherwise a patched local
    wins; otherwise the hook's (== our original) function."""
    local = globals()[name]
    if _HOOKS is None:
        return local
    hooked = getattr(_HOOKS, name, None)
    if hooked is None:
        return local
    if hooked is _ORIGINALS.get(name) and local is not hooked:
        return local
    return hooked


# ─── Config accessors ────────────────────────────────────────────────────────

def _get_entry(hass: HomeAssistant):
    """Return the first JARVIS config entry's ConfigEntry object, or None."""
    # hass.data[DOMAIN] is keyed by entry_id, values are dicts of runtime state.
    # We need the actual ConfigEntry object for options/data lookups.
    for entry in hass.config_entries.async_entries(DOMAIN):
        return entry
    return None


def _entry_opt(entry, key: str, default=None):
    """Config read via the canonical resolver (no hass here, so runtime_config is
    skipped): config.json → options → data → default."""
    from . import jarvis_config
    return jarvis_config.runtime_get(None, entry, key, default)


def _runtime_opt(hass: HomeAssistant, entry, key: str, default=None):
    """Runtime-aware config read via the canonical resolver (runtime_config →
    config.json → options → data → default)."""
    from . import jarvis_config
    return jarvis_config.runtime_get(hass, entry, key, default)


def _get_runtime_json(hass: HomeAssistant, entry, key: str, default):
    """Read a JSON-encoded value from runtime_config → jarvis_config → entry options."""
    # 1. In-memory runtime_config (fastest)
    if entry is not None:
        data = hass.data.get(DOMAIN, {}).get(entry.entry_id, {})
        rc = data.get("runtime_config", {}) if isinstance(data, dict) else {}
        raw = rc.get(key)
        if raw is not None:
            if isinstance(raw, (dict, list)):
                return raw
            try:
                return _json.loads(raw)
            except Exception:
                pass

    # 2. Persistent config file (survives restarts)
    try:
        from . import jarvis_config
        val = jarvis_config.get(key)
        if val is not None:
            if isinstance(val, (dict, list)):
                return val
            try:
                return _json.loads(val)
            except Exception:
                return val
    except Exception:
        pass

    # 3. Entry options (bootstrap defaults)
    if entry is not None:
        raw = _h("_entry_opt")(entry, key, None)
        if raw is not None:
            if isinstance(raw, (dict, list)):
                return raw
            try:
                return _json.loads(raw)
            except Exception:
                pass

    return default


# ─── Area helpers ────────────────────────────────────────────────────────────

def _area_name(hass: HomeAssistant, area_id: str) -> str:
    """Friendly name for an area_id."""
    try:
        from homeassistant.helpers import area_registry as ar
        reg = ar.async_get(hass)
        area = reg.async_get_area(area_id)
        if area:
            return area.name or area_id
    except Exception:
        pass
    return area_id


def _entities_in_area(hass: HomeAssistant, area_id: str) -> list[str]:
    """All entity_ids whose (entity area) or (device area) matches.

    Skips user-excluded entities so the room card (light count, capabilities,
    last motion) doesn't show or count entities the user has excluded.
    """
    from homeassistant.helpers import entity_registry as er, device_registry as dr
    try:
        from .entity_filter import is_excluded
    except Exception:
        is_excluded = lambda _h, _e: False  # noqa: E731
    ent_reg = er.async_get(hass)
    dev_reg = dr.async_get(hass)
    out = []
    for ent in ent_reg.entities.values():
        ent_area = ent.area_id
        if not ent_area and ent.device_id:
            dev = dev_reg.async_get(ent.device_id)
            if dev:
                ent_area = dev.area_id
        if ent_area == area_id:
            if is_excluded(hass, ent.entity_id):
                continue
            out.append(ent.entity_id)
    return out


def _area_capabilities(hass: HomeAssistant, area_id: str) -> list[str]:
    """
    Return a sorted list of capability codes present in this area.
    Each code is what the panel will render as icon + label.
    """
    caps: set[str] = set()
    for eid in _h("_entities_in_area")(hass, area_id):
        domain = eid.split(".", 1)[0]
        state = hass.states.get(eid)
        dclass = state.attributes.get("device_class") if state else None

        if domain == "assist_satellite":
            caps.add("sat")
        elif domain == "media_player":
            caps.add("spkr")
        elif domain == "camera":
            caps.add("cam")
        elif domain == "binary_sensor":
            if dclass in ("occupancy", "motion", "presence"):
                caps.add("mmwave")
            elif dclass in ("door", "window", "garage_door", "opening"):
                caps.add("door")
            elif dclass in ("moisture",):
                caps.add("leak")
            elif dclass in ("smoke", "gas", "carbon_monoxide"):
                caps.add("alarm")
            elif dclass in ("safety", "tamper", "problem"):
                caps.add("alarm")
        elif domain == "light":
            caps.add("light")
        elif domain == "switch":
            caps.add("switch")
        elif domain == "lock":
            caps.add("lock")
        elif domain == "climate":
            caps.add("climate")

    # Ordering: sat, spkr, mmwave, cam, light, switch, lock, climate, door, leak, alarm
    order = ["sat", "spkr", "mmwave", "cam", "light", "switch", "lock", "climate", "door", "leak", "alarm"]
    return [c for c in order if c in caps]


def _is_outdoor_area(hass: HomeAssistant, area_id: str) -> bool:
    """Heuristic: does the area name look outdoor?"""
    name = (_h("_area_name")(hass, area_id) or "").lower()
    outdoor_keywords = (
        "yard", "garden", "driveway", "patio", "deck", "porch",
        "pool", "outdoor", "outside", "exterior", "lawn",
    )
    return any(kw in name for kw in outdoor_keywords)


def _dominant_area(hass: HomeAssistant) -> str | None:
    """
    Pick the 'most alive' area — currently occupied, with most-recent motion.
    Prefers indoor areas over outdoor ones (you don't live in the yard).
    Returns area_id or None.
    """
    occupied = audio_routing.currently_occupied_areas(hass)
    if not occupied:
        return None

    is_outdoor = _h("_is_outdoor_area")
    # Split into indoor vs outdoor
    indoor = [a for a in occupied if not is_outdoor(hass, a)]
    outdoor = [a for a in occupied if is_outdoor(hass, a)]
    # Strongly prefer indoor; only use outdoor if that's all we have
    candidates = indoor or outdoor

    # Rank by most recent occupancy sensor change
    best_area = None
    best_ts = 0.0
    for area_id in candidates:
        for eid in audio_routing.presence_entities_in_area(hass, area_id):
            state = hass.states.get(eid)
            if state is None:
                continue
            # last_changed is a datetime
            try:
                ts = state.last_changed.timestamp()
            except Exception:
                continue
            if ts > best_ts:
                best_ts = ts
                best_area = area_id

    return best_area or candidates[0]


def _area_light_state(hass: HomeAssistant, area_id: str) -> tuple[int, int]:
    """Count (lights_on, lights_total) for an area — cheap, light-domain only.
    Used to drive the per-room light indicator + toggle in the 3D house."""
    on = total = 0
    for eid in _h("_entities_in_area")(hass, area_id):
        if not eid.startswith("light."):
            continue
        st = hass.states.get(eid)
        if st is None:
            continue
        total += 1
        if st.state == "on":
            on += 1
    return on, total


def _area_temp_humidity_entities(hass: HomeAssistant, area_id: str) -> tuple[Optional[str], Optional[str]]:
    """The first temperature/humidity sensor entity_id found in an area, or
    None. Same resolution order _area_live_readings uses, factored out so
    the areas grid and the sparkline history fetch use one source of truth."""
    temp_eid = None
    humidity_eid = None
    for eid in _h("_entities_in_area")(hass, area_id):
        if temp_eid and humidity_eid:
            break
        state = hass.states.get(eid)
        if state is None or eid.split(".", 1)[0] != "sensor":
            continue
        dclass = state.attributes.get("device_class")
        if dclass == "temperature" and temp_eid is None:
            temp_eid = eid
        elif dclass == "humidity" and humidity_eid is None:
            humidity_eid = eid
    return temp_eid, humidity_eid


def _area_live_readings(hass: HomeAssistant, area_id: str) -> dict:
    """Pull temperature, humidity, any lights-on count in the area."""
    temp = None
    humidity = None
    lights_on = 0
    lights_total = 0
    last_motion_seconds = None

    for eid in _h("_entities_in_area")(hass, area_id):
        state = hass.states.get(eid)
        if state is None:
            continue
        domain = eid.split(".", 1)[0]
        dclass = state.attributes.get("device_class")

        if domain == "sensor":
            if dclass == "temperature" and temp is None:
                try:
                    val = float(state.state)
                    unit = state.attributes.get("unit_of_measurement", "")
                    temp = f"{int(round(val))}°{unit.replace('°', '')[:1] or 'F'}"
                except (ValueError, TypeError):
                    pass
            elif dclass == "humidity" and humidity is None:
                try:
                    humidity = f"{int(round(float(state.state)))}%"
                except (ValueError, TypeError):
                    pass
        elif domain == "light":
            lights_total += 1
            if state.state == "on":
                lights_on += 1
        elif domain == "binary_sensor" and dclass in ("occupancy", "motion", "presence"):
            try:
                age = (time.time() - state.last_changed.timestamp())
                if last_motion_seconds is None or age < last_motion_seconds:
                    last_motion_seconds = age
            except Exception:
                pass

    lights_display = None
    if lights_total > 0:
        lights_display = f"{lights_on}/{lights_total}" if lights_total > 1 else ("ON" if lights_on else "OFF")

    return {
        "temp": temp,
        "humidity": humidity,
        "lights": lights_display,
        "last_motion_seconds": last_motion_seconds,
    }


def _format_duration(seconds: float | None) -> str:
    if seconds is None:
        return "—"
    if seconds < 60:
        return f"{int(seconds)}s"
    if seconds < 3600:
        return f"{int(seconds // 60)}m"
    return f"{int(seconds // 3600)}h"


def _format_uptime(seconds: float) -> str:
    """'2d 14h' / '14h 22m' / '42m 10s' format."""
    seconds = int(seconds)
    d, r = divmod(seconds, 86400)
    h, r = divmod(r, 3600)
    m, s = divmod(r, 60)
    if d > 0:
        return f"{d}d {h}h"
    if h > 0:
        return f"{h}h {m}m"
    if m > 0:
        return f"{m}m {s}s"
    return f"{s}s"


def _satellite_count(hass: HomeAssistant) -> tuple[int, int]:
    """Return (available, total) satellite count."""
    total = 0
    avail = 0
    for state in hass.states.async_all("assist_satellite"):
        total += 1
        if state.state not in ("unavailable", "unknown"):
            avail += 1
    return avail, total


def _all_areas_with_anything(hass: HomeAssistant) -> list[str]:
    """Areas that have at least one satellite, speaker, or presence sensor."""
    try:
        from homeassistant.helpers import area_registry as ar
        reg = ar.async_get(hass)
        all_ids = [a.id for a in reg.async_list_areas()]
    except Exception:
        return []

    caps_of = _h("_area_capabilities")
    interesting = []
    for aid in all_ids:
        if caps_of(hass, aid):
            interesting.append(aid)
    return interesting


# ─── Executor-side readers (blocking; always run via async_add_executor_job) ──

def _get_camera_overrides() -> dict:
    """The camera_overrides runtime map (original → frame source), for the
    panel to mirror server-side source resolution (v6.47.0). Never raises."""
    try:
        from . import jarvis_config
        ov = jarvis_config.get("camera_overrides", {}) or {}
        return {str(k): str(v) for k, v in ov.items()} if isinstance(ov, dict) else {}
    except Exception:
        return {}


def _get_camera_names() -> dict:
    """The camera_names runtime map (entity_id → JARVIS-only display name),
    v6.48.0. Never raises."""
    try:
        from . import jarvis_config
        nm = jarvis_config.get("camera_names", {}) or {}
        return {str(k): str(v) for k, v in nm.items()} if isinstance(nm, dict) else {}
    except Exception:
        return {}


def _telemetry_est_cost() -> str:
    """Session LLM spend estimate for the status panel, or the "—" placeholder.

    Thin delegate to ``llm_provider.telemetry_est_cost`` (TC4 enforce), which
    owns the kernel ``summarize`` read, the enforce kill-switch and the fail-safe
    formatting. Wrapped once more here so the panel never raises.
    """
    try:
        from . import llm_provider

        return llm_provider.telemetry_est_cost()
    except Exception:  # noqa: BLE001 - observe-only panel figure, never fatal
        return "—"


def _get_announcements_today() -> int:
    """Get today's spoken announcement count from DB. Returns 0 on error."""
    try:
        from .database import get_activity_count_today
        return get_activity_count_today()
    except Exception:
        return 0


def _door_entity_open(state_obj) -> bool:
    """Back-compat shim — door open logic now lives in door_state.py."""
    from . import door_state
    return door_state.entity_is_open(state_obj)


def _get_door_states(hass: HomeAssistant) -> dict:
    """
    Open/closed state of the home's doors for the Residence 3D model. Reads the
    explicit ``door_mapping`` (slot -> entity_id) the user set on the Residence
    tab, then delegates to door_state.get_door_states which honours it and
    auto-detects the rest. Never raises.
    """
    try:
        from . import door_state
        entry = _h("_get_entry")(hass)
        mapping = _h("_get_runtime_json")(hass, entry, "door_mapping", {}) or {}
        return door_state.get_door_states(hass, mapping)
    except Exception:
        return {}


def _get_doorbell_training() -> dict:
    """Doorbell training-dataset stats + the most recent analysed events, for
    the panel's Doorbell Training view. Never raises."""
    try:
        from . import doorbell_training
        return {
            "stats": doorbell_training.stats(),
            "recent": doorbell_training.load_events(limit=12),
        }
    except Exception:
        return {"stats": {"total": 0}, "recent": []}


def _get_suggestions() -> list[dict]:
    """Pending automation suggestions from the pattern engine, panel-shaped.
    Includes the EVIDENCE behind each one (v6.80.0) so review shows why.
    Never raises."""
    try:
        from .pattern_analyzer import get_analyzer, explain_suggestion
        out = []
        for s in get_analyzer().get_pending_suggestions():
            ptype = s.get("pattern_type", "") or ""
            try:
                details = _json.loads(s.get("details") or "{}")
            except Exception:
                details = {}
            try:
                entities = _json.loads(s.get("entity_ids") or "[]")
            except Exception:
                entities = []
            count = s.get("pattern_count", 0) or 0
            why = explain_suggestion(ptype, details, count)
            out.append({
                "id": s.get("id"),
                "created": s.get("created", ""),
                "description": s.get("description", ""),
                "yaml": s.get("automation_yaml", ""),
                "confidence": round(float(s.get("confidence", 0) or 0), 2),
                "count": count,
                "pattern_type": ptype,
                "entities": entities,
                "why_headline": why.get("headline", ""),
                "evidence": why.get("evidence", []),
            })
        return out
    except Exception:
        return []


def _get_goals() -> list[dict]:
    """Active + recently closed goals, panel-shaped. Never raises."""
    try:
        from . import goals
        out = []
        for g in goals.recent(limit=20):
            steps = g.get("steps") or []
            done = sum(1 for s in steps if s.get("status") == "done")
            out.append({
                "id": g.get("id"),
                "title": g.get("title", ""),
                "outcome": g.get("outcome", ""),
                "status": g.get("status", "active"),
                "steps_done": done,
                "steps_total": len(steps),
                "steps": steps,
                "next_check_ts": g.get("next_check_ts", ""),
                "deadline_ts": g.get("deadline_ts"),
                "last_result": g.get("last_result", ""),
                "updated_ts": g.get("updated_ts", ""),
            })
        return out
    except Exception:
        return []


def _get_lockdown_status() -> dict:
    """Formal lockdown state for the panel."""
    try:
        from . import cognitive_core
        return cognitive_core.lockdown_status()
    except Exception:
        return {"active": False, "since": 0.0, "reason": "", "auto": False, "exempt_windows": 0}


def _get_intrusion_status() -> dict:
    """Active intrusion investigation (breach point + route) for the panel."""
    try:
        from . import cognitive_core
        return cognitive_core.intrusion_status()
    except Exception:
        return {"active": False, "confirmed": False}


def _get_knowledge_stats() -> dict:
    """Curated-knowledge summary (counts) for the panel."""
    try:
        from . import knowledge
        return knowledge.stats()
    except Exception:
        return {"total": 0, "by_kind": {}, "by_subject": {}}


def _get_memory_stats() -> dict:
    """Return memory system stats for the panel."""
    try:
        from .memory import get_memory_stats
        return get_memory_stats()
    except Exception:
        return {"backend": "unavailable", "total_memories": 0}


def _get_reasoning_stats() -> dict:
    """Learned-reasoning cache + connectivity breaker stats for the panel."""
    out = {
        "learned_patterns": 0, "cloud_calls": 0, "local_decisions": 0,
        "local_rate": 0, "llm_breaker": "closed",
    }
    try:
        from . import reasoning_cache
        out.update(reasoning_cache.stats())
    except Exception:
        pass
    try:
        from . import connectivity
        st = connectivity.status()
        out["llm_breaker"] = st.get("state", "closed") if isinstance(st, dict) else "closed"
    except Exception:
        pass
    return out


def _get_observer_stats(recent=None, reasoning_stats=None) -> dict:
    """Return observer pipeline stats for the tuning dashboard."""
    try:
        from . import observer as obs
        from .database import get_recent_activity
        state = obs._STATE

        # Classifier calls in last hour
        now = time.time()
        calls_last_hour = sum(1 for ts in state.classifier_timestamps if ts > now - 3600) if hasattr(state, 'classifier_timestamps') else 0

        # Activity stats from DB
        if recent is None:
            recent = get_recent_activity(hours=24, limit=500)
        total_events = len(recent)
        spoken = sum(1 for e in recent if e.get("was_spoken"))
        flagged = sum(1 for e in recent if "flagged" in (e.get("message") or ""))
        dropped = sum(1 for e in recent if "not worth" in (e.get("message") or ""))

        try:
            from . import cognition as _cog
            cog_stats = _cog.stats()
        except Exception:
            cog_stats = {"entities_tracked": 0, "events_seen": 0, "anomalies_escalated": 0}

        try:
            from . import cognition as _cog2
            presence = _cog2.presence_status(state.hass) if getattr(state, "hass", None) else []
        except Exception:
            presence = []

        return {
            "running": state.running,
            "calls_last_hour": calls_last_hour,
            "rate_limit": obs._effective_rate_limit(),
            "events_24h": total_events,
            "flagged_24h": flagged,
            "dropped_24h": dropped,
            "spoken_24h": spoken,
            "cognition_enabled": obs._cognition_enabled(),
            "cognition_threshold": obs._cognition_threshold(),
            "cog_entities": cog_stats.get("entities_tracked", 0),
            "cog_events_seen": cog_stats.get("events_seen", 0),
            "cog_escalated": cog_stats.get("anomalies_escalated", 0),
            "cog_predictable": cog_stats.get("predictable", 0),
            "cog_routines": cog_stats.get("routines", 0),
            "cog_presence": cog_stats.get("presence_routines", 0),
            "presence": presence,
            **(reasoning_stats or _h("_get_reasoning_stats")()),
        }
    except Exception:
        return {"running": False, "calls_last_hour": 0, "rate_limit": 30,
                "events_24h": 0, "flagged_24h": 0, "dropped_24h": 0, "spoken_24h": 0,
                "cognition_enabled": True, "cognition_threshold": 0.6,
                "cog_entities": 0, "cog_events_seen": 0, "cog_escalated": 0,
                "cog_predictable": 0, "cog_routines": 0, "cog_presence": 0,
                "presence": [], "learned_patterns": 0, "cloud_calls": 0,
                "local_decisions": 0, "local_rate": 0, "llm_breaker": "closed"}


async def _async_get_observer_stats(hass) -> dict:
    from .database import get_recent_activity
    recent, reasoning_stats = await asyncio.gather(
        hass.async_add_executor_job(get_recent_activity, 24, 500),
        hass.async_add_executor_job(_h("_get_reasoning_stats")),
    )
    return _h("_get_observer_stats")(recent, reasoning_stats)


async def _configured_providers(hass: HomeAssistant, entry) -> list[str]:
    """Providers with a usable credential/endpoint today — drives the AI
    Models role dropdowns so you can't pick a provider with nothing to call.
    Ollama needs no key and uses the same default endpoint as create_provider;
    a Custom endpoint is likewise valid with no key at all.
    Credentials are read straight from secrets.yaml — the only place they live."""
    from . import ha_secrets
    out = []
    from .const import resolve_provider_base_url
    runtime_opt = _h("_runtime_opt")
    ollama_selected = False
    ollama_base_url = runtime_opt(hass, entry, CONF_OLLAMA_BASE_URL, "")
    ollama_config = {
        CONF_OLLAMA_BASE_URL: ollama_base_url,
        "llm_base_url": "",
    }
    selected_providers = {
        str(runtime_opt(hass, entry, key, "") or "")
        for key in (
            "llm_provider", "classifier_provider", "reasoning_provider",
            "review_provider", "vision_provider", "camera_reasoning_provider",
        )
    }
    ollama_selected = "ollama" in selected_providers
    if ollama_selected:
        ollama_config["llm_base_url"] = runtime_opt(hass, entry, "llm_base_url", "")
    if ollama_selected and not resolve_provider_base_url(ollama_config, "ollama"):
        ollama_config[CONF_OLLAMA_BASE_URL] = "http://homeassistant.local:11434/v1"
    if resolve_provider_base_url(ollama_config, "ollama"):
        out.append("ollama")
    custom_selected = "custom" in selected_providers
    custom_config = {
        CONF_CUSTOM_BASE_URL: runtime_opt(hass, entry, CONF_CUSTOM_BASE_URL, ""),
    }
    if custom_selected:
        custom_config["llm_base_url"] = runtime_opt(hass, entry, "llm_base_url", "")
    if resolve_provider_base_url(custom_config, "custom"):
        out.append("custom")
    for provider, field in PROVIDER_API_KEY_FIELDS.items():
        if provider in out:
            continue
        if field and await ha_secrets.async_get_provider_key(hass, provider):
            out.append(provider)
    return out


# ─── Version ─────────────────────────────────────────────────────────────────

def _read_integration_version() -> str:
    """
    Read the integration version from manifest.json — the single source of
    truth. Done once at import (not per-request) so the panel can display the
    actually-running version. This fixes the banner drifting out of sync: the
    version was hardcoded in the panel JS, so a browser-cached panel showed a
    stale number after an addon update. Now the panel fetches this live.
    """
    try:
        mf = pathlib.Path(__file__).parent / "manifest.json"
        return _json.loads(mf.read_text()).get("version", "?")
    except Exception:
        return "?"


_INTEGRATION_VERSION = _read_integration_version()


# ─── Snapshot ────────────────────────────────────────────────────────────────

async def build_snapshot_with_context(hass: HomeAssistant, entry) -> tuple[dict, dict]:
    """Build the live-state snapshot plus the intermediate values the panel's
    ``config`` block reuses (so ``ws_get_panel_data`` does not recompute the
    executor reads). Returns ``(snapshot, context)``; context keys:
    bedroom_areas, quiet_start, quiet_end, broadcast_group, notify_service,
    observer_running, observer_enabled_cfg, sleeping, sleep_reason,
    configured_providers, observer_stats, memory_stats, camera_overrides,
    camera_names.
    """
    entry_opt = _h("_entry_opt")
    runtime_opt = _h("_runtime_opt")

    # ── Status flags ────────────────────────────────────────────────────
    observer_running = False
    if entry is not None:
        data = hass.data.get(DOMAIN, {}).get(entry.entry_id, {})
        observer_running = bool(data.get("observer_running", False))

    bedroom_areas = entry_opt(entry, CONF_BEDROOM_AREAS, []) or []
    quiet_start = entry_opt(entry, CONF_OBSERVER_QUIET_START, DEFAULT_OBSERVER_QUIET_START)
    quiet_end = entry_opt(entry, CONF_OBSERVER_QUIET_END, DEFAULT_OBSERVER_QUIET_END)

    sleeping, sleep_reason = sleep_detection.is_sleeping(
        hass,
        bedroom_area_ids=bedroom_areas,
        quiet_start=quiet_start,
        quiet_end=quiet_end,
    )

    configured_providers = await _h("_configured_providers")(hass, entry)
    (
        announcements_today,
        doorbell_training,
        knowledge_stats,
        suggestions,
        goals,
        observer_stats,
        memory_stats,
        camera_overrides,
        camera_names,
    ) = await asyncio.gather(
        hass.async_add_executor_job(_h("_get_announcements_today")),
        hass.async_add_executor_job(_h("_get_doorbell_training")),
        hass.async_add_executor_job(_h("_get_knowledge_stats")),
        hass.async_add_executor_job(_h("_get_suggestions")),
        hass.async_add_executor_job(_h("_get_goals")),
        _h("_async_get_observer_stats")(hass),
        hass.async_add_executor_job(_h("_get_memory_stats")),
        hass.async_add_executor_job(_h("_get_camera_overrides")),
        hass.async_add_executor_job(_h("_get_camera_names")),
    )
    broadcast_group = entry_opt(entry, CONF_BROADCAST_GROUP, "") or ""
    notify_service = entry_opt(entry, CONF_NOTIFY_SERVICE, "") or ""
    observer_enabled_cfg = bool(runtime_opt(hass, entry, CONF_OBSERVER_ENABLED, False))

    sat_avail, sat_total = _h("_satellite_count")(hass)

    # ── Areas grid ──────────────────────────────────────────────────────
    area_name = _h("_area_name")
    live_readings = _h("_area_live_readings")
    fmt_duration = _h("_format_duration")
    areas_list = []
    for aid in _h("_all_areas_with_anything")(hass):
        caps = _h("_area_capabilities")(hass, aid)
        active = audio_routing.is_area_occupied(hass, aid)
        l_on, l_total = _h("_area_light_state")(hass, aid)
        readings = live_readings(hass, aid)
        temp_eid, humidity_eid = _h("_area_temp_humidity_entities")(hass, aid)
        areas_list.append({
            "id":       aid,
            "name":     area_name(hass, aid),
            "caps":     caps,
            "active":   active,
            "bedroom":  aid in bedroom_areas,
            "lights_on":    l_on,
            "lights_total": l_total,
            "temp":         readings.get("temp"),
            "humidity":     readings.get("humidity"),
            "temp_entity":     temp_eid,
            "humidity_entity": humidity_eid,
            "last_motion":  fmt_duration(readings.get("last_motion_seconds")),
        })
    # Sort: active first, then bedrooms, then alphabetical
    areas_list.sort(key=lambda a: (not a["active"], not a["bedroom"], a["name"].lower()))

    # ── Dominant room ───────────────────────────────────────────────────
    dominant_id = _h("_dominant_area")(hass)
    if dominant_id:
        readings = live_readings(hass, dominant_id)
        dominant_satellites = audio_routing.satellites_in_area(hass, dominant_id)
        sat_id = dominant_satellites[0] if dominant_satellites else None
        dominant = {
            "area_id":    dominant_id,
            "name":       area_name(hass, dominant_id),
            "subtitle":   f"Occupied · {fmt_duration(readings.get('last_motion_seconds'))}" if readings.get('last_motion_seconds') is not None else "Occupied",
            "coord":      f"#{dominant_id[:8]}",
            "temp":       readings.get("temp") or "—",
            "humidity":   readings.get("humidity") or "—",
            "lights":     readings.get("lights") or "—",
            "satellite":  sat_id.split(".", 1)[-1][:20] if sat_id else "—",
            "last_motion": fmt_duration(readings.get("last_motion_seconds")),
        }
    else:
        # No presence detected anywhere
        anyone = audio_routing.anyone_home(hass)
        dominant = {
            "area_id":    None,
            "name":       "AWAY" if not anyone else "AT HOME",
            "subtitle":   "no presence detected",
            "coord":      "—",
            "temp":       "—",
            "humidity":   "—",
            "lights":     "—",
            "satellite":  "—",
            "last_motion": "—",
        }

    # ── Status tiles ────────────────────────────────────────────────────
    status = {
        "observer": {
            "state": "RUNNING" if observer_running else ("READY" if observer_enabled_cfg else "DISABLED"),
            "level": "live" if observer_running else ("warn" if observer_enabled_cfg else "off"),
        },
        "sleep": {
            "state": "ASLEEP" if sleeping else "AWAKE",
            "level": "warn" if sleeping else "live",
        },
        "llm_providers": {
            "state": f"{len(configured_providers)} READY" if configured_providers else "UNSET",
            "level": "live" if configured_providers else "warn",
        },
        "broadcast": {
            "state": "ONLINE" if broadcast_group else "UNSET",
            "level": "live" if broadcast_group else "warn",
        },
        "notify": {
            "state": "READY" if notify_service else "UNSET",
            "level": "live" if notify_service else "warn",
        },
        "satellites": {
            "state": f"{sat_avail} / {sat_total}" if sat_total > 0 else "NONE",
            "level": "live" if sat_avail == sat_total and sat_total > 0 else ("warn" if sat_total > 0 else "off"),
        },
    }

    uptime_seconds = time.time() - _STARTUP_TS
    uptime_str = _h("_format_uptime")(uptime_seconds)

    snapshot = {
        "status":         status,
        "version":        _INTEGRATION_VERSION,
        "meta": {
            "bedrooms":          len(bedroom_areas),
            "areas_monitored":   len(areas_list),
            "announcements_today": announcements_today,
            "est_cost":          _h("_telemetry_est_cost")(),
            "uptime":            uptime_str,
        },
        "dominant":       dominant,
        "areas":          areas_list,
        "sleep_reason":   sleep_reason if sleeping else None,
        "doorbell_training": doorbell_training,
        "doors":          _h("_get_door_states")(hass),
        "lockdown":       _h("_get_lockdown_status")(),
        "intrusion":      _h("_get_intrusion_status")(),
        "knowledge":      knowledge_stats,
        "suggestions":    suggestions,
        "goals":          goals,
    }
    context = {
        "bedroom_areas": bedroom_areas,
        "quiet_start": quiet_start,
        "quiet_end": quiet_end,
        "broadcast_group": broadcast_group,
        "notify_service": notify_service,
        "observer_running": observer_running,
        "observer_enabled_cfg": observer_enabled_cfg,
        "sleeping": sleeping,
        "sleep_reason": sleep_reason,
        "configured_providers": configured_providers,
        "observer_stats": observer_stats,
        "memory_stats": memory_stats,
        "camera_overrides": camera_overrides,
        "camera_names": camera_names,
    }
    return snapshot, context


async def build_snapshot(hass: HomeAssistant, entry) -> dict:
    """The live-state snapshot: everything ``jarvis/get_panel_data`` sends
    except its ``config`` sub-dict. See the module docstring for the schema."""
    snapshot, _ctx = await build_snapshot_with_context(hass, entry)
    return snapshot


def area_rows(snapshot: dict) -> list[dict]:
    """The per-area rows of a snapshot. Row keys: id, name, caps (list[str]),
    active (bool), bedroom (bool), lights_on (int), lights_total (int),
    temp (str|None, e.g. "21°C"), humidity (str|None, e.g. "48%"),
    temp_entity (str|None), humidity_entity (str|None), last_motion (str, e.g. "4m")."""
    rows = (snapshot or {}).get("areas") or []
    return [r for r in rows if isinstance(r, dict)]


def status_tiles(snapshot: dict) -> dict:
    """The status tiles of a snapshot: {observer, sleep, llm_providers,
    broadcast, notify, satellites} → {"state": str, "level": "live"|"warn"|"off"}."""
    tiles = (snapshot or {}).get("status") or {}
    return dict(tiles) if isinstance(tiles, dict) else {}


# Names websocket.py re-exports and the hook mechanism may override. Captured
# AFTER every def so _h() can tell "unpatched re-export" from a real patch.
HOOKABLE = (
    "_get_entry", "_entry_opt", "_runtime_opt", "_get_runtime_json",
    "_area_name", "_entities_in_area", "_area_capabilities", "_is_outdoor_area",
    "_dominant_area", "_area_light_state", "_area_temp_humidity_entities",
    "_area_live_readings", "_format_duration", "_format_uptime",
    "_satellite_count", "_all_areas_with_anything",
    "_get_camera_overrides", "_get_camera_names", "_telemetry_est_cost",
    "_get_announcements_today", "_door_entity_open", "_get_door_states",
    "_get_doorbell_training", "_get_suggestions", "_get_goals",
    "_get_lockdown_status", "_get_intrusion_status", "_get_knowledge_stats",
    "_get_memory_stats", "_get_reasoning_stats", "_get_observer_stats",
    "_async_get_observer_stats", "_configured_providers",
)
_ORIGINALS = {name: globals()[name] for name in HOOKABLE}
