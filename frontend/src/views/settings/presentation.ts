/**
 * The ONLY per-key knowledge the settings view has: display names for the
 * catalogue categories, label overrides that keep the existing translations,
 * help text, enum option labels, confirm-before-enable texts, suggestion
 * sources and the "not yet ported" notes (frontend/specs/settings.md §3.4, §7).
 * Everything else (which keys exist, their kinds, bounds, defaults, current
 * values) comes from `jarvis/config_schema`.
 */
import type { Hass, PanelData, ConfigField } from "../../types";

export interface Suggestion {
  value: string;
  label: string;
}

/** schema category -> old sub-nav heading (t() keys that already exist). */
export const CATEGORY_NAMES: Record<string, string> = {
  core: "General",
  voice: "Voice & Audio",
  learning: "Learning",
  safety: "Safety & Energy",
  cameras: "Cameras",
  home: "Home & Extras",
  governance: "Governance",
  Other: "Other",
};

/** Rail shown while the catalogue loads. */
export const DEFAULT_CATEGORIES = ["core", "voice", "learning", "safety", "cameras", "home", "governance"];

/** Keys that are not listed unless the search query matches them. */
export const HIDDEN_KEYS = new Set(["onboarding_dismissed"]);

/** Saving one of these also restarts the appliance monitor (jarvis/reload_appliances). */
export const APPLIANCE_RELOAD_KEYS = new Set(["appliance_profile", "appliance_announce_unknown"]);

/** Old card labels that exist in the i18n files (catalogue labels mostly do not). */
export const LABEL_OVERRIDE: Record<string, string> = {
  announcements_enabled: "Announcements",
  sentinel_enabled: "Sentinel",
  observer_enabled: "Observer",
  cognition_enabled: "Cognition",
  camera_auto_analyze: "Camera Watch",
  package_detection: "Package Watch",
  visitor_learning: "Visitor Learning",
  rich_reasoning: "Rich Reasoning",
  light_control_enabled: "Light Control",
  appliance_power_guessing: "Appliance Power Guessing",
  notify_service: "Notify Device",
  banter_level: "Banter level",
  search_backend: "Web research backend",
  searxng_url: "SearXNG URL",
  web_research_llm_fallback: "Escalate to LLM web search",
  calendar_tight_gap_min: "Calendar tight-gap (min)",
  departure_alerts_enabled: "Departure alerts",
  departure_lead_minutes: "Departure lead (min)",
  departure_origin_entity: "Origin tracker",
  departure_travel_sensor: "Travel sensor",
  routine_alerts_enabled: "Routine alerts",
  memory_threading_enabled: "Memory threading",
  memory_threading_hours: "Memory window (hrs)",
  memory_threading_max: "Memory max turns",
  continued_conversation_enabled: "Continued conversation",
  voice_confirm_enabled: "Voice confirmation",
  voice_confirm_mode: "Mode",
  recognition_source: "Face recognition source",
  residence_style: "Home type",
  home_stories: "Stories",
  garage_bays: "Garage bays",
  dormers_front: "Front dormers",
  dormers_rear: "Rear dormers",
  chimney_side: "Chimney",
  has_basement: "Basement",
  home_bedrooms: "Bedrooms",
  home_bathrooms: "Bathrooms",
  floor_plan_sqft: "Square feet",
  pattern_learn_doors: "Learn doors & windows",
  pattern_learn_presence: "Learn presence & arrivals",
  pattern_include_entities: "Also learn specific entities",
  excluded_entities: "Exclude specific entities",
  excluded_domains: "Exclude whole domains",
  excluded_labels: "Exclude by label",
  lab_areas: "Lab rooms",
  movie_area: "Movie room",
  movie_media_player: "Movie player",
  movie_dim_pct: "Movie dim %",
  hazard_monitor_enabled: "Monitor",
  hazard_quake_radius_km: "Quake radius (km)",
  hazard_quake_min_mag: "Min magnitude",
  briefing_require_home: "Only when someone's home",
  briefing_morning_time: "Morning",
  briefing_evening_time: "Evening",
  appliance_announce_unknown: "Announce unidentified loads",
  energy_agency: "Agency",
  ui_language: "Language",
};

const RESIDENCE_HELP =
  "Drives the Residence 3D model + property stats. Detailed room layout is edited in the floor-plan editor.";
const PROVIDER_HELP =
  "Groq, OpenAI, Google Gemini, Anthropic, a local Ollama server, and any OpenAI-compatible endpoint (Custom) are all supported. A provider marked needs setup has no key yet — add one in Settings → Devices & Services → JARVIS → Configure.";
const BRIEFING_HELP =
  "JARVIS speaks a summary at the times you set — weather and the day's forecast, your calendar, what happened overnight, power draw, and any active hazards nearby.";
const QUIET_HELP =
  "Between these times JARVIS stays quiet — proactive announcements, briefings and the Observer back off. HH:MM";

const HELP: Record<string, string> = {
  ui_language: "“Panel language” translates this dashboard. Auto follows Home Assistant.",
  output_language:
    "The language of JARVIS's own briefings, camera analysis and announcements — set it when your Home Assistant runs in English but you want JARVIS in another language. Auto follows Home Assistant. A spoken request in another language is still answered in that language.",
  announcements_enabled: "Master switch — all proactive speech",
  announce_notify_only:
    "Mute speakers — proactive announcements go to your phone/text instead (incl. critical). No unsolicited speaker interruptions.",
  sentinel_enabled: "Door/garage/lock-left-open alerts",
  observer_enabled: "AI event awareness (uses API)",
  cognition_enabled: "Local triage — sees all telemetry, gates cloud",
  adaptive_interruption_budget: "Interrupt less after recent alerts were dismissed as unneeded",
  adaptive_suggestion_threshold: "Tune the suggestion bar from how often past suggestions were useful",
  adaptive_cognition_threshold: "Tune the anticipation/anomaly bar from how welcome recent alerts were",
  camera_auto_analyze: "Inspect doorbell presses (vision + event-media)",
  camera_auto_analyze_motion:
    "Also inspect Frigate person/object detections, not just doorbell presses (needs Camera Watch on)",
  camera_motion_vision:
    "No Frigate/Nest? A Home Assistant motion/occupancy sensor firing silently analyzes the camera covering that room — so best-effort face recognition & scene learning work on plain cameras. Throttled per camera; no spoken alerts.",
  camera_alert_level:
    "When auto reviews speak aloud. Everything is still analyzed & logged — this only gates what's announced. Intrusion alerts are always spoken.",
  package_detection: "Detect packages & mail at the door",
  visitor_learning: "Silently learn from person events — never spoken",
  rich_reasoning: "Cloud-first judgment for medium+ events",
  light_control_enabled:
    "Off = still show which rooms have lights on, but disable toggling from the dashboard",
  appliance_power_guessing:
    "Off = only announce appliances with native sensors or ones you've mapped (no guessing from the power meter)",
  friday_automator:
    "⚠️ Advanced. A background sub-agent that can CONTROL devices, run scenes and scripts on its own — every other sub-agent is read-only. Off by default; enabling asks you to confirm.",
  autonomy_enforce:
    "⚠️ Lets JARVIS carry out automations you've already approved enough times WITHOUT asking each time — governed by the kernel's graduated-autonomy ladder. Security & safety capabilities (unlock, disarm, garage/lockdown off) NEVER auto-act; they always ask. Off by default; turn it off here anytime.",
  proximity_volume:
    "Soften announcements when mmWave distance sensors show you're close to the speaker. No effect in rooms without distance sensors; never dampens critical alerts.",
  host_telemetry:
    "Read the server's CPU temperature, memory pressure and NVMe I/O (from /proc and /sys) and fold critical stress into the infrastructure audit & System Diagnostics.",
  departure_require_location: "skip \"time to head out\" for online meetings & events with no place set",
  door_window_alerts_enabled:
    "announce when one is open at an unusual time — they stay monitored for security either way",
  continued_conversation_multi_satellite: "reopen the mic in the room you moved to (needs 2+ satellites)",
  departure_origin_entity:
    "where you set out from for drive-time — your phone or car GPS (a zone or a location sensor works too); blank uses whoever's tracked, then home",
  departure_osrm_url: "optional self-hosted routing server (OSRM); blank uses the free public router",
  departure_travel_sensor:
    "optional override — a sensor that already reports drive-time in minutes (Waze, Google/HERE Maps…); blank computes it from your origin via OSRM",
  driving_mode_enabled:
    "send alerts to the car screen (Android Auto) instead of the house when your phone is connected",
  driving_car_sensor: "leave blank to auto-detect the Home Assistant companion app's Android Auto sensor",
  home_context_max_entities:
    "Lower this (0 = counts only) if your LLM provider rejects requests for being too large — e.g. Groq's free tier caps tokens-per-minute. The assistant still discovers entities on demand, so nothing breaks.",
  custom_base_url: "OpenAI-compatible endpoint for the custom provider.",
  ollama_base_url: "Leave empty to use Ollama's default Home Assistant endpoint.",
  ollama_num_ctx:
    "Context window for local Ollama models. Larger = more context, but more VRAM and slower. Default 8192.",
  classifier_rate_limit: "Max observer LLM calls per hour. 0 = unlimited (local LLM / high-quota tiers).",
  vision_model:
    "Needs an image-capable model — e.g. moondream on Ollama, or a Groq vision model. Text-only models (like gpt-oss) will fail on camera analysis.",
  vision_thinking_max_tokens: "Higher budget so a thinking model has room to think AND answer.",
  vision_min_interval:
    "Minimum seconds between automatic (motion / auto-event) camera analyses, to cap vision token use. 0 = off. Explicit requests and doorbell presses are never throttled.",
  notify_service: "Phone push for high/critical alerts",
  appliance_profile:
    "Tell JARVIS which appliances exist so it names cycles correctly instead of guessing from the whole-home meter. Map a dedicated power or status entity when one exists (most accurate); otherwise set typical running watts so the meter can match it. Items: {\"name\",\"type\":\"washer|dryer|dishwasher|oven|microwave|appliance\",\"entity\",\"watts\"}",
  appliance_announce_unknown: "Announce unidentified loads (loads matching no declared appliance)",
  operational_mode_auto:
    "AUTO · follow occupancy (away ↔ normal). Off = you set modes by hand or voice; discretionary modes (party/movie/lab/…) are always manual.",
  hazard_monitor_enabled:
    "Real-time nearby earthquakes (USGS), severe-weather warnings (NWS), and natural disasters like wildfires (NASA EONET). Scoped to your home location; alerts speak and push like any JARVIS alert.",
  hazard_lat: "Override (optional) — blank uses home coordinates.",
  hazard_lon: "Override (optional) — blank uses home coordinates.",
  briefing_morning_enabled: BRIEFING_HELP,
  briefing_evening_enabled: BRIEFING_HELP,
  banter_level: "Banter is silenced automatically during anything urgent — a safety alert always speaks plainly.",
  search_backend: "DuckDuckGo needs no setup; SearXNG needs a URL.",
  web_research_llm_fallback:
    "When the backend above finds nothing, let JARVIS fall back to the configured LLM's own live web search (currently Gemini only). Off by default.",
  identity_min_confidence:
    "Below this face-match confidence a person is recorded as 'unknown'. Higher = stricter, fewer false names.",
  voice_confirm_enabled:
    "Ask out loud before sensitive actions (unlock, garage, disarm) and listen for a spoken yes/no. Native mode uses the satellite's own audio; gated mode speaks through the room speaker (Nest).",
  directive: "overrides preset — (optional) a custom standing directive",
  bedroom_areas: "Bedroom areas drive sleep detection during quiet hours.",
  broadcast_group: "The broadcast group is the media_player JARVIS announces through.",
  observer_quiet_start: QUIET_HELP,
  observer_quiet_end: QUIET_HELP,
  identity_voice_fingerprint: "needs a GPU",
  imap_enabled:
    "Read-only inbox access. The password is not entered here — set it in Settings → Devices & Services → JARVIS → Configure → Email (it lives in Home Assistant secrets.yaml).",
  pattern_learn_doors: "Door, window and garage contact sensors",
  pattern_learn_presence: "People and device trackers (home / away)",
  pattern_learn_buttons: "Suggest \"press → scene / action\" automations",
  suggest_garage_confirmation:
    "Safety-sensitive: suggest \"arrive → open, confirm, then close a cover\" routines. Off by default; you still approve each one.",
  pattern_include_entities: "for a skipped-domain entity you want as a routine trigger — e.g. a bay occupancy sensor",
  excluded_entities:
    "Entities you exclude are removed from JARVIS's awareness — presence detection, room routing, the observer and routine learning all skip them. Home Assistant still has the entity, and JARVIS can still control it if you ask for it by name.",
  excluded_domains: "e.g. light, switch — every entity in the domain",
  excluded_labels: "every entity carrying a Home Assistant label",
  lab_areas: "Lab rooms — quiet only here",
  movie_media_player: "optional",
  document_watch_folders: "one folder per line or comma-separated — e.g. /media/downloads",
  residence_style: RESIDENCE_HELP,
  home_stories: RESIDENCE_HELP,
  garage_bays: RESIDENCE_HELP,
  dormers_front: RESIDENCE_HELP,
  dormers_rear: RESIDENCE_HELP,
  chimney_side: RESIDENCE_HELP,
  chimney_count: RESIDENCE_HELP,
  has_basement: RESIDENCE_HELP,
  basement_entrance: RESIDENCE_HELP,
  home_bedrooms: RESIDENCE_HELP,
  home_bathrooms: RESIDENCE_HELP,
  floor_plan_sqft: RESIDENCE_HELP,
  door_mapping: "Edited visually in the floor-plan editor (Phase 3); raw JSON here.",
};

/** Help text for a key (exact entry, then the `*_provider` / `*_model` / `floor_plan_*` families). */
export function helpFor(key: string): string {
  if (HELP[key]) return HELP[key];
  if (/_provider$/.test(key) || /(^|_)model$/.test(key)) return PROVIDER_HELP;
  if (key.startsWith("floor_plan_") && key !== "floor_plan_sqft") {
    return "Edited visually in the floor-plan editor (Phase 3); raw JSON here.";
  }
  return "";
}

export const PLACEHOLDER: Record<string, string> = {
  custom_base_url: "http://gpu-server:11434/v1",
  ollama_base_url: "http://gpu-server:11434/v1",
};

export const ENUM_LABELS: Record<string, Record<string, string>> = {
  ui_language: {
    auto: "Auto (Home Assistant)", en: "English", zh: "中文（简体）", "zh-hant": "中文（繁體）", cs: "Čeština",
    da: "Dansk", de: "Deutsch", es: "Español", fr: "Français", it: "Italiano", nl: "Nederlands",
    nb: "Norsk bokmål", pl: "Polski", pt: "Português", "pt-br": "Português (Brasil)", ro: "Română",
    ru: "Русский", sk: "Slovenčina", fi: "Suomi", sv: "Svenska", tr: "Türkçe", uk: "Українська",
  },
  output_language: {
    "": "Auto (Home Assistant)", en: "English", zh: "中文 (Chinese)", cs: "Čeština (Czech)", da: "Dansk (Danish)",
    nl: "Nederlands (Dutch)", fi: "Suomi (Finnish)", fr: "Français (French)", de: "Deutsch (German)",
    el: "Ελληνικά (Greek)", he: "עברית (Hebrew)", hu: "Magyar (Hungarian)", id: "Indonesia (Indonesian)",
    it: "Italiano (Italian)", ja: "日本語 (Japanese)", ko: "한국어 (Korean)", nb: "Norsk (Norwegian)",
    pl: "Polski (Polish)", pt: "Português (Portuguese)", ro: "Română (Romanian)", ru: "Русский (Russian)",
    sk: "Slovenčina (Slovak)", es: "Español (Spanish)", sv: "Svenska (Swedish)", th: "ไทย (Thai)",
    tr: "Türkçe (Turkish)", uk: "Українська (Ukrainian)", vi: "Tiếng Việt (Vietnamese)",
  },
  banter_level: { "0": "Plain — no wit", "1": "Dry — occasional wit", "2": "Full — MCU JARVIS" },
  camera_alert_level: {
    off: "Off — observe only", urgent: "Urgent only (default)", important: "Important — + deliveries", all: "Everything notable",
  },
  chimney_side: { right: "East / right", left: "West / left", center: "Center / ridge", none: "None" },
  basement_entrance: { bulkhead: "Exterior bulkhead", interior: "Interior stairs (inside)" },
  voice_confirm_mode: {
    auto: "Auto (try native, fall back)", native: "Native (satellite audio)", gated: "Gated (room speaker)",
  },
  search_backend: { duckduckgo: "DuckDuckGo (no key, default)", searxng: "SearXNG (self-hosted)" },
  recognition_source: {
    both: "Both (Double Take + Frigate)", frigate: "Frigate only (sub_label)", doubletake: "Double Take only",
  },
  energy_agency: { advisory: "advisory", opt_in: "opt-in", autonomous: "autonomous" },
};

/** English label for an enum option (translated by the caller with t()). */
export function enumLabel(key: string, option: string): string {
  const m = ENUM_LABELS[key];
  if (m && option in m) return m[option];
  if (key === "directive_preset") return option.replace(/_/g, " ");
  return option;
}

/** Keys that ask before being switched ON (never when switched off). */
export const CONFIRM_ON_ENABLE: Record<string, string> = {
  friday_automator:
    "Enable the FRIDAY automator?\n\nUnlike every other sub-agent, FRIDAY can CONTROL your devices, run scenes and run scripts on its own. Only enable it if you want JARVIS to actuate your home autonomously.",
  autonomy_enforce:
    "Let JARVIS act without asking?\n\nWhen ON, JARVIS will perform convenience automations it has learned you approve (e.g. lights on at dusk) on its own, without a prompt each time — governed by the kernel's per-capability trust ladder.\n\nIt will NEVER auto-act security- or safety-critical capabilities: unlocking doors, disarming the alarm, opening the garage, or turning lockdown off ALWAYS ask first, no matter how often approved.\n\nYou can turn this back off here at any time. Enable kernel-governed autonomy?",
  suggest_garage_confirmation:
    "This lets JARVIS SUGGEST automations that close a garage door or cover automatically once a confirmation sensor fires. Nothing installs without your explicit approval, and each suggestion is flagged safety-sensitive. Enable these suggestions?",
};

// ── suggestions ─────────────────────────────────────────────────────────────

const PROVIDERS = ["groq", "openai", "gemini", "ollama", "anthropic", "custom"];
const RESIDENCE_STYLES: Suggestion[] = [
  { value: "cape_cod", label: "Cape Cod" }, { value: "colonial", label: "Colonial" },
  { value: "dutch_colonial", label: "Dutch Colonial" }, { value: "ranch", label: "Ranch" },
  { value: "two_story", label: "Two-Story" }, { value: "craftsman", label: "Craftsman" },
  { value: "modern", label: "Modern" }, { value: "townhouse", label: "Townhouse" },
  { value: "apartment", label: "Apartment" }, { value: "cabin", label: "Cabin" },
];
const ENTITY_LIST_KEYS = new Set([
  "excluded_entities", "pattern_include_entities", "presence_only_entities", "voice_confirm_entities",
  "outdoor_entities", "indoor_entities", "biometric_entities",
]);
const AREA_KEYS = new Set(["movie_area", "bedroom_areas", "lab_areas", "outdoor_areas"]);
const TRAVEL_RE = /travel|commute|duration|eta|arrival|route|waze|maps|mapbox|tomtom|here[_ ]?travel|traffic|drive[_ ]?time|driving|depart|time_to|to_work|to_home/i;
const TRAVEL_UNIT_RE = /^(min|mins|minute|minutes|h|hr|hrs|hour|hours)$/i;
const CAR_RE = /android[_ ]?auto|head[_ ]?unit|\bcar\b/i;
const MAX_SUGGESTIONS = 500;

function states(hass: Hass | undefined) {
  return Object.values(hass?.states ?? {});
}
function friendly(s: { entity_id: string; attributes: Record<string, unknown> }): string {
  const n = s.attributes?.friendly_name;
  return typeof n === "string" && n ? n : s.entity_id;
}
function cfgList<T = Record<string, unknown>>(data: PanelData | null, key: string): T[] {
  const v = data?.config?.[key];
  return Array.isArray(v) ? (v as T[]) : [];
}
function strList(data: PanelData | null, key: string): string[] {
  return cfgList<unknown>(data, key).filter((x): x is string => typeof x === "string");
}

/** Suggestion list for a key (built lazily on focus; capped). */
export function suggestionsFor(key: string, data: PanelData | null, hass: Hass | undefined): Suggestion[] {
  let out: Suggestion[] = [];
  if (key === "notify_service") {
    out = strList(data, "notify_services_available").map((v) => ({ value: v, label: v.replace(/^notify\./, "") }));
  } else if (key === "broadcast_group" || key === "movie_media_player") {
    out = states(hass).filter((s) => s.entity_id.startsWith("media_player.")).map((s) => ({ value: s.entity_id, label: friendly(s) }));
  } else if (key === "departure_origin_entity") {
    out = states(hass)
      .filter((s) => /^(person|device_tracker|zone)\./.test(s.entity_id) ||
        (s.entity_id.startsWith("sensor.") && "latitude" in (s.attributes ?? {}) && "longitude" in (s.attributes ?? {})))
      .map((s) => ({ value: s.entity_id, label: friendly(s) }));
  } else if (key === "departure_travel_sensor") {
    out = states(hass)
      .filter((s) => s.entity_id.startsWith("sensor.") && (s.attributes?.device_class === "duration" ||
        TRAVEL_UNIT_RE.test(String(s.attributes?.unit_of_measurement ?? "")) || TRAVEL_RE.test(s.entity_id)))
      .map((s) => ({ value: s.entity_id, label: friendly(s) }));
  } else if (key === "driving_car_sensor") {
    out = states(hass)
      .filter((s) => s.entity_id.startsWith("binary_sensor.") &&
        (CAR_RE.test(s.entity_id) || CAR_RE.test(friendly(s)) || s.attributes?.device_class === "connectivity"))
      .map((s) => ({ value: s.entity_id, label: friendly(s) }));
  } else if (key === "residence_style") {
    out = RESIDENCE_STYLES;
  } else if (AREA_KEYS.has(key)) {
    out = (data?.areas ?? []).map((a) => ({ value: a.id, label: a.name }));
  } else if (ENTITY_LIST_KEYS.has(key)) {
    out = states(hass).map((s) => ({ value: s.entity_id, label: friendly(s) }));
  } else if (key === "excluded_domains") {
    out = [...new Set(states(hass).map((s) => s.entity_id.split(".")[0]))].sort().map((d) => ({ value: d, label: d }));
  } else if (key === "excluded_labels") {
    out = cfgList(data, "available_labels").map((l) => String(l.name ?? l.label_id ?? l.id ?? "")).filter(Boolean).map((n) => ({ value: n, label: n }));
  } else if (key === "announcement_speakers") {
    out = cfgList(data, "cast_devices").map((d) => ({ value: String(d.entity_id ?? ""), label: String(d.name ?? d.entity_id ?? "") }));
  } else if (key === "disabled_cameras") {
    out = cfgList(data, "cameras").map((c) => ({ value: String(c.entity_id ?? ""), label: String(c.name ?? c.entity_id ?? "") }));
  } else if (key === "disabled_sentinel_rules") {
    out = cfgList(data, "sentinel_rules").map((r) => ({ value: String(r.id ?? ""), label: String(r.desc ?? r.name ?? r.id ?? "") }));
  } else if (/_provider$/.test(key)) {
    const configured = new Set(strList(data, "configured_providers"));
    out = PROVIDERS.map((p) => ({ value: p, label: configured.has(p) ? p : `${p} — needs setup` }));
  }
  return out.filter((s) => s.value).slice(0, MAX_SUGGESTIONS);
}

/** Extra help line for satellite_pairings: the valid keys and values. */
export function pairingHint(data: PanelData | null): { satellites: string; speakers: string } | null {
  const sats = cfgList(data, "satellites");
  const casts = cfgList(data, "cast_devices");
  if (!sats.length && !casts.length) return null;
  return {
    satellites: sats.map((s) => `${s.entity_id} · ${s.area ?? s.area_id ?? s.name ?? ""}`).join(", "),
    speakers: casts.map((c) => String(c.entity_id ?? "")).join(", "),
  };
}

/** True when the field is a plain key/value setting the generic row can edit. */
export function isHidden(field: ConfigField): boolean {
  return HIDDEN_KEYS.has(field.key);
}

// ── "Not yet ported" notes per category (spec §7) ───────────────────────────
export interface NotPorted {
  name: string;
  why: string;
}
export const NOT_PORTED: Record<string, NotPorted[]> = {
  core: [
    { name: "AI Models", why: "live provider/model dropdowns need jarvis/list_models per role" },
    { name: "Operational Mode", why: "runtime state, now on the Overview view; area-chip picker" },
    { name: "System Diagnostics", why: "read-only runtime health, on the Logs view" },
  ],
  voice: [
    { name: "Briefings", why: "\"Brief me now\" is a service call with a speaker precondition" },
    { name: "Satellite → Speaker", why: "per-satellite select editing one dict" },
    { name: "Announcement Speakers", why: "per-device toggle list over one array" },
    { name: "Voice Confirmation", why: "\"Test satellite audio\" probe" },
  ],
  learning: [
    { name: "Document Library", why: "upload/ingest/search and the semantic-search probe" },
    { name: "Excluded Entities", why: "chip pickers over plain lists" },
    { name: "Routine Learning", why: "chip pickers over plain lists" },
    { name: "Observer Tuning", why: "read-only runtime stats" },
  ],
  safety: [
    { name: "Energy Management", why: "live draw, advice and agency chips" },
    { name: "Hazard Monitor", why: "\"Scan now\" live external scan" },
    { name: "Muted Announcements", why: "separate mute store" },
    { name: "Sentinel Rules", why: "per-rule on/off rows over one list" },
    { name: "Appliances", why: "structured row editor over one JSON key" },
  ],
  cameras: [
    { name: "Cameras", why: "enable/disable, rename and indoor/outdoor use two non-config commands" },
    { name: "Doorbell Training", why: "dataset viewer plus a service call" },
    { name: "Diagnostics", why: "service-call buttons, not settings" },
  ],
  home: [
    { name: "Wellbeing Context", why: "discovered wearables are runtime data" },
    { name: "Floor Plan Editor", why: "own Phase 3 spec (pointer-events editor)" },
  ],
  governance: [
    { name: "Governance", why: "enforcement kill-switches live in their own store with their own confirm rules" },
  ],
};

const SUGGESTED_KEYS = new Set([
  "notify_service", "broadcast_group", "movie_media_player", "departure_origin_entity", "departure_travel_sensor",
  "driving_car_sensor", "residence_style", "excluded_domains", "excluded_labels", "announcement_speakers",
  "disabled_cameras", "disabled_sentinel_rules", ...AREA_KEYS, ...ENTITY_LIST_KEYS,
]);

/** True when `suggestionsFor(key)` has a source (so the row offers a datalist / chips). */
export function hasSuggestionSource(key: string): boolean {
  return SUGGESTED_KEYS.has(key) || /_provider$/.test(key);
}
