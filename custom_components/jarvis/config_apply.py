"""Apply a panel-writable setting — the one write path shared by the panel's
``jarvis/update_config`` command and the native switch/select/number entities
(fork Phase 0).

:func:`async_apply` is the body of the old ``ws_update_config`` handler after
key validation: it writes ``runtime_config`` (no entry reload), persists through
``jarvis_config.set_many``, applies the side effects (``review_enabled`` opt-in,
observer start/stop with the ``observer_running`` flag, provider/model hot-swap),
nudges the snapshot coordinator and fires ``SIGNAL_CONFIG_CHANGED``.

:data:`CONFIG_FIELDS` is the typed catalogue of every key in
``websocket.PANEL_WRITABLE_KEYS`` (a test pins the two sets equal). Platforms
build entities from the ``expose=True`` entries.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Optional

from homeassistant.core import HomeAssistant

from .const import (
    DEFAULT_DIRECTIVE_PRESET,
    DEFAULT_HONORIFIC,
    DEFAULT_OBSERVER_QUIET_END,
    DEFAULT_OBSERVER_QUIET_START,
    DIRECTIVE_PRESETS,
    DOMAIN,
    SIGNAL_CONFIG_CHANGED,
)

_LOGGER = logging.getLogger(__name__)

KINDS = ("bool", "int", "float", "enum", "str", "list", "json")
CATEGORIES = ("core", "voice", "learning", "safety", "cameras", "home", "governance")

# Keys whose change hot-swaps a provider/model client (mirrors ws_update_config).
_PROVIDER_KEYS = frozenset({
    "llm_provider", "model", "llm_base_url", "custom_base_url", "ollama_base_url",
    "classifier_provider", "classifier_model", "reasoning_provider",
    "reasoning_model", "review_provider", "review_model",
})
_MAIN_CLIENT_KEYS = frozenset({
    "llm_provider", "model", "llm_base_url", "custom_base_url", "ollama_base_url",
})


@dataclass(frozen=True)
class FieldSpec:
    """One panel-writable setting.

    kind:     bool | int | float | enum | str | list | json
    default:  the value the backend assumes when unset (None = blank/unset)
    options:  enum values (strings, as the panel saves them)
    min/max/step: numeric bounds for int/float
    label:    human name for an HA entity
    category: core | voice | learning | safety | cameras | home | governance
    expose:   worth a native HA entity (switch/select/number/text)
    """
    key: str
    kind: str
    default: Any = None
    options: Optional[tuple[str, ...]] = None
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None
    label: str = ""
    category: str = "core"
    expose: bool = False

    def __post_init__(self) -> None:
        if self.kind not in KINDS:
            raise ValueError(f"{self.key}: bad kind {self.kind!r}")
        if self.category not in CATEGORIES:
            raise ValueError(f"{self.key}: bad category {self.category!r}")
        if self.kind == "enum" and not self.options:
            raise ValueError(f"{self.key}: enum needs options")


def _b(key, default, label, category, expose=False):
    return FieldSpec(key, "bool", default, label=label, category=category, expose=expose)


def _i(key, default, label, category, lo=None, hi=None, step=1, expose=False):
    return FieldSpec(key, "int", default, min=lo, max=hi, step=step,
                     label=label, category=category, expose=expose)


def _f(key, default, label, category, lo=None, hi=None, step=None, expose=False):
    return FieldSpec(key, "float", default, min=lo, max=hi, step=step,
                     label=label, category=category, expose=expose)


def _e(key, default, options, label, category, expose=False):
    return FieldSpec(key, "enum", default, options=tuple(options),
                     label=label, category=category, expose=expose)


def _s(key, default, label, category, expose=False):
    return FieldSpec(key, "str", default, label=label, category=category, expose=expose)


def _l(key, label, category):
    return FieldSpec(key, "list", [], label=label, category=category)


def _j(key, default, label, category):
    return FieldSpec(key, "json", default, label=label, category=category)


UI_LANGUAGES = (
    "auto", "en", "zh", "zh-hant", "cs", "da", "de", "es", "fr", "it", "nl",
    "nb", "pl", "pt", "pt-br", "ro", "ru", "sk", "fi", "sv", "tr", "uk",
)
OUTPUT_LANGUAGES = (
    "", "en", "zh", "cs", "da", "nl", "fi", "fr", "de", "el", "he", "hu", "id",
    "it", "ja", "ko", "nb", "pl", "pt", "ro", "ru", "sk", "es", "sv", "th",
    "tr", "uk", "vi",
)

_FIELDS: tuple[FieldSpec, ...] = (
    # ── core: announcements, persona, language ──────────────────────────────
    _e("ui_language", "auto", UI_LANGUAGES, "Panel language", "core", expose=True),
    _e("output_language", "", OUTPUT_LANGUAGES, "Output language", "core", expose=True),
    _b("announcements_enabled", False, "Proactive announcements", "core", expose=True),
    _b("announce_notify_only", False, "Announce to notifications only", "core", expose=True),
    _s("notify_service", "", "Notify service", "core"),
    _s("honorific", DEFAULT_HONORIFIC, "Honorific", "core"),
    _e("directive_preset", DEFAULT_DIRECTIVE_PRESET, tuple(DIRECTIVE_PRESETS.keys()),
       "Directive preset", "core", expose=True),
    _s("directive", "", "Custom directive", "core"),
    _b("use_hass_api", True, "Use Home Assistant LLM API", "core"),
    _e("banter_level", "1", ("0", "1", "2"), "Banter level", "core", expose=True),
    _s("observer_quiet_start", DEFAULT_OBSERVER_QUIET_START, "Quiet hours start", "core", expose=True),
    _s("observer_quiet_end", DEFAULT_OBSERVER_QUIET_END, "Quiet hours end", "core", expose=True),
    _s("broadcast_group", "", "Broadcast group", "core"),
    _b("onboarding_dismissed", False, "Onboarding dismissed", "core"),
    _b("host_telemetry", True, "Host telemetry", "core"),
    _b("rich_reasoning", False, "Rich reasoning", "core"),
    _i("home_context_max_entities", 15, "Home context entities per domain", "core", 0, 100),
    _b("biometrics_enabled", False, "Biometrics", "core"),
    _j("biometric_entities", {}, "Biometric entity overrides", "core"),
    _b("quiet_hours_push_critical_only", False, "Quiet hours: push critical only", "core"),
    _b("proactive_questions_interactive", True, "Interactive proactive questions", "core"),
    # arrivals / departures / driving
    _b("arrival_greeting_enabled", True, "Arrival greeting", "core", expose=True),
    _i("arrival_min_away_minutes", 10, "Arrival minimum away minutes", "core", 0, 1440),
    _b("arrival_push_enabled", False, "Push arrival alerts", "core"),
    _b("departure_alerts_enabled", True, "Departure alerts", "core", expose=True),
    _b("departure_require_location", True, "Departure alerts need a location", "core"),
    _b("routine_alerts_enabled", True, "Routine alerts", "core", expose=True),
    _i("departure_lead_minutes", 30, "Departure lead minutes", "core", 0, 240),
    _s("departure_origin_entity", "", "Departure origin entity", "core"),
    _s("departure_osrm_url", "", "OSRM URL", "core"),
    _s("departure_travel_sensor", "", "Travel time sensor", "core"),
    _b("driving_mode_enabled", False, "Driving mode", "core", expose=True),
    _s("driving_car_sensor", "", "Car head-unit sensor", "core"),
    _b("driving_notify_briefings", True, "Driving: briefings", "core"),
    _b("driving_notify_travel", True, "Driving: travel alerts", "core"),
    _b("driving_notify_security", True, "Driving: security alerts", "core"),
    _b("driving_suppress_home_audio", True, "Driving: mute home audio", "core"),
    # briefings
    _b("briefing_morning_enabled", False, "Morning briefing", "core", expose=True),
    _b("briefing_evening_enabled", False, "Evening briefing", "core", expose=True),
    _s("briefing_morning_time", "07:30", "Morning briefing time", "core", expose=True),
    _s("briefing_evening_time", "19:30", "Evening briefing time", "core", expose=True),
    _b("briefing_require_home", True, "Briefings only when home", "core"),
    _b("briefing_include_weather", True, "Briefing: weather", "core"),
    _b("briefing_include_calendar", True, "Briefing: calendar", "core"),
    _b("briefing_include_presence", True, "Briefing: presence", "core"),
    _b("briefing_include_events", True, "Briefing: overnight events", "core"),
    _b("briefing_include_energy", True, "Briefing: energy", "core"),
    _b("briefing_include_hazards", True, "Briefing: hazards", "core"),
    # research / comms
    _e("search_backend", "duckduckgo", ("duckduckgo", "searxng"), "Search backend", "core"),
    _s("searxng_url", "", "SearXNG URL", "core"),
    _b("web_research_llm_fallback", False, "Web research LLM fallback", "core"),
    _i("calendar_tight_gap_min", 15, "Tight calendar gap (min)", "core", 0, 120),
    # mail
    _b("imap_enabled", False, "IMAP inbox", "core"),
    _s("imap_host", "", "IMAP host", "core"),
    _i("imap_port", 993, "IMAP port", "core", 1, 65535),
    _s("imap_user", "", "IMAP user", "core"),
    _s("imap_folder", "INBOX", "IMAP folder", "core"),
    _b("imap_ssl", True, "IMAP SSL", "core"),
    # AI models (provider/model names: never entities)
    _s("llm_provider", "groq", "LLM provider", "core"),
    _s("model", "", "LLM model", "core"),
    _s("llm_base_url", "", "LLM base URL", "core"),
    _s("custom_base_url", "", "Custom base URL", "core"),
    _s("ollama_base_url", "", "Ollama base URL", "core"),
    _s("classifier_provider", "", "Classifier provider", "core"),
    _s("classifier_model", "", "Classifier model", "core"),
    _s("reasoning_provider", "", "Reasoning provider", "core"),
    _s("reasoning_model", "", "Reasoning model", "core"),
    _b("review_enabled", False, "Second-opinion review", "core"),
    _s("review_provider", "", "Review provider", "core"),
    _s("review_model", "", "Review model", "core"),
    _s("vision_provider", "", "Vision provider", "core"),
    _s("vision_model", "", "Vision model", "core"),
    _s("camera_reasoning_provider", "", "Camera reasoning provider", "core"),
    _s("camera_reasoning_model", "", "Camera reasoning model", "core"),
    _i("ollama_num_ctx", 8192, "Ollama context window", "core", 512, 131072, 512),
    _i("classifier_rate_limit", 30, "Classifier calls per hour", "core", 0, 600),
    # ── voice ───────────────────────────────────────────────────────────────
    _b("voice_confirm_enabled", False, "Voice confirmation", "voice", expose=True),
    _e("voice_confirm_mode", "auto", ("auto", "native", "gated"), "Voice confirmation mode", "voice", expose=True),
    _l("voice_confirm_entities", "Voice confirmation entities", "voice"),
    _b("tts_use_ha_voice", False, "Use Home Assistant TTS voice", "voice", expose=True),
    _b("proximity_volume", True, "Proximity volume", "voice", expose=True),
    _b("continued_conversation_enabled", False, "Continued conversation", "voice", expose=True),
    _b("continued_conversation_speaker_reopen", True, "Reopen mic after reply speaker", "voice"),
    _b("continued_conversation_multi_satellite", False, "Follow-up across satellites", "voice"),
    _j("satellite_pairings", {}, "Satellite → speaker pairings", "voice"),
    _l("announcement_speakers", "Announcement speakers", "voice"),
    _j("satellite_audio_out", None, "Satellite audio out", "voice"),
    _j("satellite_start_action", {}, "Satellite start actions", "voice"),
    _b("identity_enabled", True, "Per-person identity", "voice"),
    _b("identity_voice_fingerprint", False, "Voice fingerprint identity", "voice"),
    _s("voice_recognition_source", "", "Voice recognition source", "voice"),
    _b("voice_recognition_auto_enroll", True, "Auto-enroll voices", "voice"),
    _b("voice_recognition_local", False, "Local speaker ID", "voice"),
    _s("voice_recognition_delegate_stt", "", "Delegate STT", "voice"),
    _s("voice_embedding_model_path", "", "Speaker embedding model path", "voice"),
    _f("voice_local_trust_threshold", 0.75, "Local voice trust threshold", "voice", 0, 1, 0.01),
    _f("voice_local_guess_threshold", 0.55, "Local voice guess threshold", "voice", 0, 1, 0.01),
    _i("voice_local_min_samples", 2, "Local voice minimum samples", "voice", 1, 50),
    # ── learning: observer, cognition, patterns, memory, documents ─────────
    _b("observer_enabled", False, "Observer", "learning", expose=True),
    _b("cognition_enabled", True, "Cognition", "learning", expose=True),
    _f("cognition_threshold", 0.6, "Cognition threshold", "learning", 0, 1, 0.05),
    _i("observer_group_debounce", 90, "Observer group debounce (s)", "learning", 0, 600, 5),
    _b("adaptive_interruption_budget", False, "Adaptive interruption budget", "learning"),
    _b("adaptive_suggestion_threshold", False, "Adaptive suggestion threshold", "learning"),
    _b("adaptive_cognition_threshold", False, "Adaptive cognition threshold", "learning"),
    _b("pattern_learn_doors", False, "Learn door patterns", "learning"),
    _b("pattern_learn_presence", False, "Learn presence patterns", "learning"),
    _b("pattern_learn_buttons", False, "Learn button patterns", "learning"),
    _b("pattern_learn_motion", False, "Learn motion patterns", "learning"),
    _l("pattern_include_entities", "Always-learn entities", "learning"),
    _i("pattern_min_occurrences", 4, "Pattern minimum occurrences", "learning", 1, 50),
    _f("pattern_confidence", 0.55, "Pattern confidence", "learning", 0, 1, 0.05),
    _b("suggest_garage_confirmation", False, "Suggest garage confirmation", "learning"),
    _b("memory_threading_enabled", True, "Memory threading", "learning"),
    _i("memory_threading_hours", 48, "Memory threading hours", "learning", 1, 720),
    _i("memory_threading_max", 12, "Memory threading max", "learning", 1, 100),
    _b("semantic_search", False, "Semantic document search", "learning"),
    _s("embed_model", "nomic-embed-text", "Embedding model", "learning"),
    _s("embed_base_url", "", "Embedding base URL", "learning"),
    _s("document_watch_folders", "", "Document watch folders", "learning"),
    _l("excluded_entities", "Excluded entities", "learning"),
    _l("excluded_domains", "Excluded domains", "learning"),
    _l("excluded_labels", "Excluded labels", "learning"),
    _l("presence_only_entities", "Presence-only entities", "learning"),
    # ── safety: sentinel, intrusion, hazards, doors ────────────────────────
    _b("sentinel_enabled", True, "Sentinel", "safety", expose=True),
    _l("disabled_sentinel_rules", "Disabled sentinel rules", "safety"),
    _b("door_window_alerts_enabled", True, "Door/window alerts", "safety", expose=True),
    _i("intrusion_response_timeout", 120, "Intrusion response timeout (s)", "safety", 30, 900, 30, expose=True),
    _b("intrusion_vision_confirm", True, "Intrusion vision confirm", "safety", expose=True),
    _b("intrusion_vision_veto", True, "Intrusion vision veto", "safety", expose=True),
    _i("intrusion_inward_depth", 1, "Intrusion inward depth", "safety", 0, 5),
    _b("intrusion_requires_confinement", False, "Intrusion requires confinement", "safety"),
    _b("hazard_monitor_enabled", False, "Hazard monitor", "safety", expose=True),
    _f("hazard_lat", None, "Hazard latitude", "safety", -90, 90),
    _f("hazard_lon", None, "Hazard longitude", "safety", -180, 180),
    _b("hazard_quakes_on", True, "Hazards: earthquakes", "safety"),
    _b("hazard_weather_on", True, "Hazards: severe weather", "safety"),
    _b("hazard_disasters_on", True, "Hazards: disasters", "safety"),
    _f("hazard_quake_radius_km", 300, "Earthquake radius (km)", "safety", 10, 2000, 10),
    _f("hazard_quake_min_mag", 2.5, "Earthquake minimum magnitude", "safety", 0, 10, 0.1),
    _f("hazard_disaster_radius_km", 300.0, "Disaster radius (km)", "safety", 10, 2000, 10),
    _j("appliance_profile", [], "Appliance profile", "safety"),
    _b("appliance_announce_unknown", False, "Announce unknown appliances", "safety"),
    _b("appliance_power_guessing", False, "Appliance power guessing", "safety"),
    # ── cameras ─────────────────────────────────────────────────────────────
    _b("camera_auto_analyze", True, "Camera auto-analyze", "cameras", expose=True),
    _b("camera_auto_analyze_motion", False, "Camera auto-analyze motion", "cameras", expose=True),
    _b("camera_motion_vision", False, "Motion sensor → camera vision", "cameras"),
    _b("camera_important_only", True, "Camera important only (legacy)", "cameras"),
    _e("camera_alert_level", "urgent", ("off", "urgent", "important", "all"),
       "Camera alert level", "cameras", expose=True),
    _b("package_detection", True, "Package detection", "cameras", expose=True),
    _b("visitor_learning", True, "Visitor learning", "cameras"),
    _l("disabled_cameras", "Disabled cameras", "cameras"),
    _b("vision_thinking_enabled", False, "Vision thinking", "cameras"),
    _i("vision_thinking_max_tokens", 1024, "Vision thinking max tokens", "cameras", 64, 8192, 64),
    _i("vision_min_interval", 0, "Vision minimum interval (s)", "cameras", 0, 3600, 5),
    _e("recognition_source", "both", ("both", "frigate", "doubletake"), "Recognition source", "cameras"),
    _b("llm_face_recognition", False, "LLM face recognition", "cameras"),
    _f("identity_min_confidence", 0.45, "Identity minimum confidence", "cameras", 0, 1, 0.05),
    _l("outdoor_areas", "Outdoor areas", "cameras"),
    _l("outdoor_entities", "Outdoor entities", "cameras"),
    _l("indoor_entities", "Indoor entities", "cameras"),
    # ── home: residence model, floor plan, rooms ───────────────────────────
    _b("light_control_enabled", True, "Dashboard light control", "home", expose=True),
    _l("bedroom_areas", "Bedroom areas", "home"),
    _j("floor_plan_rooms", {}, "Floor plan rooms", "home"),
    _j("floor_plan_entities", {}, "Floor plan entities", "home"),
    _f("floor_plan_bg_opacity", None, "Floor plan background opacity", "home", 0, 1, 0.05),
    _j("floor_plan_bg", {}, "Floor plan background", "home"),
    _s("residence_style", "cape_cod", "Residence style", "home"),
    _i("floor_plan_sqft", None, "Square footage", "home", 0, 100000),
    _e("floor_plan_units", "imperial", ("imperial", "metric"), "Floor plan units", "home"),
    _j("floor_plan_elements", {}, "Floor plan elements", "home"),
    _j("floor_plan_cameras", {}, "Floor plan cameras", "home"),
    _j("floor_plan_property", {}, "Property boundary", "home"),
    _e("home_stories", "1.5", ("1", "1.5", "2", "3"), "Stories", "home"),
    _b("has_basement", True, "Has basement", "home"),
    _i("dormers_front", 2, "Front dormers", "home", 0, 3),
    _i("dormers_rear", 1, "Rear dormers", "home", 0, 2),
    _i("garage_bays", 3, "Garage bays", "home", 0, 4),
    _e("chimney_side", "right", ("right", "left", "center", "none"), "Chimney side", "home"),
    _i("chimney_count", 1, "Chimney count", "home", 1, 4),
    _e("basement_entrance", "bulkhead", ("bulkhead", "interior"), "Basement entrance", "home"),
    _i("home_bedrooms", None, "Bedrooms", "home", 0, 20),
    _i("home_bathrooms", None, "Bathrooms", "home", 0, 20),
    _j("door_mapping", {}, "Door mapping", "home"),
    _l("lab_areas", "Lab mode areas", "home"),
    _s("movie_area", "", "Movie mode area", "home"),
    _s("movie_media_player", "", "Movie media player", "home"),
    _i("movie_dim_pct", 15, "Movie dim level (%)", "home", 0, 100),
    # ── governance: autonomy, modes, energy, sub-agents ────────────────────
    _b("autonomy_enforce", False, "Graduated autonomy (enforce)", "governance"),
    _b("goals_kernel_authoritative", True, "Kernel plan authoritative for goals", "governance"),  # upstream 9.40.0 (H4b)
    _b("friday_automator", False, "FRIDAY automator", "governance"),
    _b("operational_mode_auto", True, "Automatic operational mode", "governance", expose=True),
    _j("custom_modes", {}, "Custom modes", "governance"),
    _e("energy_agency", "advisory", ("advisory", "opt_in", "autonomous"), "Energy agency", "governance", expose=True),
    _f("energy_peak_watts", 8000.0, "Energy peak watts", "governance", 0, 100000, 100),
    _l("energy_mode_bump", "Energy mode bump", "governance"),
)

CONFIG_FIELDS: dict[str, FieldSpec] = {f.key: f for f in _FIELDS}
assert len(CONFIG_FIELDS) == len(_FIELDS), "duplicate key in CONFIG_FIELDS"


def exposed_fields() -> list[FieldSpec]:
    """The fields worth a native HA entity, in catalogue order."""
    return [f for f in _FIELDS if f.expose]


def writable_keys() -> set[str]:
    """``websocket.PANEL_WRITABLE_KEYS`` (the panel's allow-list), falling back
    to the catalogue when websocket.py is not importable (unit-test stubs)."""
    try:
        from .websocket import PANEL_WRITABLE_KEYS
        return set(PANEL_WRITABLE_KEYS)
    except Exception:
        return set(CONFIG_FIELDS)


async def async_apply(hass: HomeAssistant, entry, key: str, value) -> dict:
    """Apply one panel-writable setting.

    Writes ``runtime_config`` (no entry reload), persists via
    ``jarvis_config.set_many``, runs the side effects, refreshes the coordinator
    and fires ``SIGNAL_CONFIG_CHANGED``. Returns ``{"key", "value", "updates"}``
    where ``updates`` is every key actually written (``review_enabled`` rides
    along with ``review_provider``/``review_model``).

    Raises ``ValueError`` for a key outside ``PANEL_WRITABLE_KEYS`` and
    ``LookupError`` when the entry's runtime data is missing.
    """
    if key not in writable_keys():
        raise ValueError(f"Key '{key}' is not writable from the panel")
    if entry is None:
        raise LookupError("No JARVIS config entry found")
    data = hass.data.get(DOMAIN, {}).get(entry.entry_id, {})
    if data is None:
        raise LookupError("JARVIS runtime data not found")

    # Store in runtime_config — does NOT trigger entry reload
    rc = data.setdefault("runtime_config", {})
    updates = {key: value}
    if key in {"review_provider", "review_model"} and value not in (None, ""):
        updates["review_enabled"] = True
    rc.update(updates)
    _LOGGER.info("JARVIS panel: set %s = %s", key, str(value)[:80])

    # Persist via centralized config module (survives restarts)
    try:
        from . import jarvis_config
        await hass.async_add_executor_job(jarvis_config.set_many, updates)
    except Exception as exc:
        _LOGGER.debug("Config persist note: %s", exc)

    # If toggling observer, start/stop immediately
    if key == "observer_enabled":
        from . import observer as observer_mod
        if value:
            from . import jarvis_config
            observer_config = await hass.async_add_executor_job(
                jarvis_config.effective_config_with_runtime, entry, rc)
            await observer_mod.start(hass, observer_config)
            data["observer_running"] = True
        else:
            await observer_mod.stop()
            data["observer_running"] = False
    elif set(updates) & _PROVIDER_KEYS:
        from . import observer as observer_mod
        from .llm_provider import async_refresh_main_client

        if set(updates) & _MAIN_CLIENT_KEYS:
            await async_refresh_main_client(hass, entry)
        if observer_mod.is_running():
            await observer_mod.refresh_tier_providers(hass, updates)

    _notify_changed(hass, updates)
    return {"key": key, "value": value, "updates": updates}


def _notify_changed(hass: HomeAssistant, updates: dict) -> None:
    """Refresh the snapshot coordinator and tell setting-mirror entities.
    Best effort — the HA helpers involved are absent under the unit stubs."""
    try:
        from . import coordinator as _coordinator
        _coordinator.request_refresh(hass)
    except Exception:
        pass
    try:
        from homeassistant.helpers.dispatcher import async_dispatcher_send
        for k, v in updates.items():
            async_dispatcher_send(hass, SIGNAL_CONFIG_CHANGED, k, v)
    except Exception:
        pass


# ── Panel schema (fork Phase 2: the ``jarvis/config_schema`` command) ────────
#
# The new panel renders its Settings view from a typed description of every
# panel-writable key instead of hand-written controls. Everything below is pure
# (no hass): the websocket handler supplies the value resolver.

SCHEMA_OTHER_CATEGORY = "Other"
SECRET_MARKERS = ("key", "token", "password", "secret")
_NUMERIC_KINDS = ("int", "float")
_SCALAR_KINDS = ("bool", "int", "float")


def looks_secret(key: str, spec: Optional[FieldSpec] = None) -> bool:
    """True when ``key`` must be left out of the panel schema altogether.

    A key whose name contains ``key``, ``token``, ``password`` or ``secret``
    is treated as a credential and is omitted (field *and* value) — unless it
    is a catalogue :class:`FieldSpec` that is either ``expose=True`` (already
    a native HA entity) or of a bool/int/float kind: a number or a flag cannot
    carry a credential, and this keeps ``vision_thinking_max_tokens`` (a token
    *budget*) in the schema. Provider API keys live in ``secrets.yaml`` and are
    never panel-writable, so today the rule only guards against a future key
    being added to ``PANEL_WRITABLE_KEYS`` without a catalogue entry."""
    name = key.lower()
    if not any(marker in name for marker in SECRET_MARKERS):
        return False
    if spec is not None and (spec.expose or spec.kind in _SCALAR_KINDS):
        return False
    return True


def humanise_key(key: str) -> str:
    """``floor_plan_sqft`` → ``Floor plan sqft`` (best-effort label)."""
    return key.replace("_", " ").strip().capitalize() or key


def json_safe(value: Any) -> Any:
    """Coerce a config value into plain JSON types: sets/tuples become lists,
    dict keys become strings, anything exotic becomes ``str(value)``."""
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, dict):
        return {str(k): json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set, frozenset)):
        return [json_safe(v) for v in value]
    return str(value)


_TRUE_WORDS = ("1", "true", "yes", "on")
_FALSE_WORDS = ("0", "false", "no", "off", "")


def coerce_for_kind(kind: str, value: Any) -> Any:
    """Best-effort: bring a stored value into the Python type its ``kind``
    promises (the old panel saved most things as strings; ``runtime_config``
    may hold JSON text for list/json keys). Unparseable input is returned
    JSON-safe but otherwise untouched, never raised on."""
    if value is None:
        return None
    try:
        if kind == "bool":
            if isinstance(value, bool):
                return value
            if isinstance(value, (int, float)):
                return bool(value)
            if isinstance(value, str):
                low = value.strip().lower()
                if low in _TRUE_WORDS:
                    return True
                if low in _FALSE_WORDS:
                    return False
        elif kind == "int":
            if isinstance(value, bool):
                return int(value)
            if isinstance(value, int):
                return value
            if isinstance(value, float):
                return int(value) if value.is_integer() else value
            if isinstance(value, str) and value.strip():
                return int(float(value.strip()))
        elif kind == "float":
            if isinstance(value, bool):
                return float(value)
            if isinstance(value, (int, float)):
                return float(value)
            if isinstance(value, str) and value.strip():
                return float(value.strip())
        elif kind == "enum":
            if isinstance(value, bool):
                return str(value).lower()
            if isinstance(value, (int, float, str)):
                return str(value)
        elif kind == "str":
            if isinstance(value, (int, float, bool)):
                return str(value)
        elif kind in ("list", "json"):
            if isinstance(value, str):
                import json as _json
                parsed = _json.loads(value)
                if kind == "json" or isinstance(parsed, list):
                    return json_safe(parsed)
                return value
            if kind == "list" and isinstance(value, (tuple, set, frozenset)):
                return json_safe(value)
    except Exception:
        pass
    return json_safe(value)


def field_schema(spec: FieldSpec) -> dict:
    """The wire shape of one catalogue field (see :func:`build_schema`)."""
    numeric = spec.kind in _NUMERIC_KINDS
    return {
        "key": spec.key,
        "kind": spec.kind,
        "label": spec.label or humanise_key(spec.key),
        "category": spec.category,
        "default": json_safe(spec.default),
        "options": list(spec.options) if spec.kind == "enum" and spec.options else None,
        "min": spec.min if numeric else None,
        "max": spec.max if numeric else None,
        "step": spec.step if numeric else None,
        "expose": bool(spec.expose),
    }


def infer_field(key: str, value: Any) -> dict:
    """A best-effort field for a writable key the catalogue does not know:
    kind from the current value's Python type (``json`` for list/dict, ``bool``,
    ``int``, ``float``, else ``str``), category ``Other``, humanised label."""
    if isinstance(value, (list, dict, tuple, set, frozenset)):
        kind = "json"
    elif isinstance(value, bool):
        kind = "bool"
    elif isinstance(value, int):
        kind = "int"
    elif isinstance(value, float):
        kind = "float"
    else:
        kind = "str"
    return {
        "key": key,
        "kind": kind,
        "label": humanise_key(key),
        "category": SCHEMA_OTHER_CATEGORY,
        "default": None,
        "options": None,
        "min": None,
        "max": None,
        "step": None,
        "expose": False,
    }


def schema_categories(extra: tuple[str, ...] = ()) -> list[str]:
    """Ordered unique categories as they appear in :func:`exposed_fields`,
    then any ``extra`` ones not already listed, then ``Other`` last."""
    out: list[str] = []
    for spec in exposed_fields():
        if spec.category not in out:
            out.append(spec.category)
    for cat in extra:
        if cat not in out and cat != SCHEMA_OTHER_CATEGORY:
            out.append(cat)
    out.append(SCHEMA_OTHER_CATEGORY)
    return out


def build_schema(writable, resolve) -> dict:
    """Build the ``jarvis/config_schema`` response.

    ``writable`` is the panel allow-list (``websocket.PANEL_WRITABLE_KEYS``);
    ``resolve(key, kind, default)`` returns the current runtime value for one
    key (the handler wires it to ``_runtime_opt`` / ``_get_runtime_json``;
    ``kind`` is ``None`` for a key the catalogue does not describe).

    Returns ``{"fields": [...], "values": {...}, "categories": [...]}``:

    * ``fields`` — one entry per writable key, in catalogue order, each
      ``{key, kind, label, category, default, options, min, max, step, expose}``
      (``options`` a list of strings for ``enum`` only, ``min``/``max``/``step``
      for ``int``/``float`` only, ``null`` otherwise). Keys covered by a
      :class:`FieldSpec` use its typing; any other writable key gets a
      best-effort :func:`infer_field` entry (category ``Other``).
    * ``values`` — ``{key: current value}`` for every emitted field, coerced to
      the field's kind and JSON-safe (sets/tuples → lists).
    * ``categories`` — :func:`schema_categories`: the exposed categories in
      order, ``Other`` last.

    Secret-looking keys (see :func:`looks_secret`) are omitted from ``fields``
    and ``values`` — the panel never receives credentials through this command.
    """
    writable = set(writable)
    fields: list[dict] = []
    values: dict[str, Any] = {}
    seen: set[str] = set()
    extra_categories: list[str] = []

    for spec in _FIELDS:
        if spec.key not in writable or looks_secret(spec.key, spec):
            continue
        seen.add(spec.key)
        fields.append(field_schema(spec))
        values[spec.key] = coerce_for_kind(
            spec.kind, resolve(spec.key, spec.kind, spec.default))
        if spec.category not in extra_categories:
            extra_categories.append(spec.category)

    for key in sorted(writable - seen):
        if looks_secret(key):
            continue
        current = resolve(key, None, None)
        field = infer_field(key, current)
        fields.append(field)
        values[key] = coerce_for_kind(field["kind"], current)

    return {
        "fields": fields,
        "values": values,
        "categories": schema_categories(tuple(extra_categories)),
    }
