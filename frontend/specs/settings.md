# Settings view — specification (Phase 2 Lit panel)

Derived from the old panel's `settings` tab (`custom_components/jarvis/frontend/jarvis-panel.js`:
`_html()` lines ~4780–5705, `_wire()` ~6073–6990, `_renderConfigParity`, `_renderRoutineLearning`,
`_renderExcludedEntities`, `_renderModelRoles`, `_renderCameraSettings`, `_wireConfigToggles`, `_saveConfig`,
…) and from the backend in `custom_components/jarvis/websocket.py`, `config_apply.py`, `panel_data.py`,
`services.yaml`, `enforcement.py`, `modes.py`, `energy.py`, `hazard_monitor.py`, `output_gate.py`,
`documents.py`, `embeddings.py`, `voice_confirm.py`, `diagnostics/service_health.py`. The view agent does
**not** need to open the old panel; everything it needs is here.

Design rule: **settings as data**. The view knows no setting key by hand. It fetches the typed catalogue
(`jarvis/config_schema`, which also carries every current value), renders one generic field component per
entry chosen by `kind`, and writes through `jarvis/update_config`. A few per-key *presentation* maps (enum
option labels, help text, confirm text, suggestions, label overrides) are allowed and listed verbatim in §3.4
so the UI is not worse than the old tab.

Scaffold the view is built on (already in `frontend/src/`): the element is `<jarvis-view-settings>`
(`src/views/settings.ts`; its helpers are `src/views/settings/field.ts` (the row), `presentation.ts`,
`coerce.ts`, `registry.ts` (the Phase 3 plug-in registry, settings-tools.md §3) and `tools/**`),
extends `JarvisView` (`src/views/view-base.ts`) which gives `hass`, `narrow`, `data` (the
`jarvis/get_panel_data` snapshot the panel shell refreshes every 20 s), `route`, `subPath`, `refresh()`,
`navigate(view, path)`, `ws<T>(type, payload)`. Translations: `t(key, vars)`, `loadLanguage()`,
`resolveLanguage()` from `src/i18n.ts`. Errors: `WsError` (`src/ws.ts`) with `.code` and `.message`.
Components: `jv-section`, `jv-empty`, `jv-kv`, `jv-state-badge`, `jv-confirm` / `confirmDialog()`
(`src/components/`). HA elements (`ha-switch`, `ha-select`, `ha-textfield`, `ha-textarea`, `ha-alert`,
`ha-icon`, `ha-icon-button`, `ha-chip`) are used when `haDefined(tag)` is true and a token-styled native
element is the fallback (`watchDefinitions()` re-renders when HA lazy-loads them). Colours only through
`--jv-*` tokens (`src/theme/tokens.ts`; `npm run lint:theme` fails on any literal colour). Types for the
schema already exist in `src/types.ts` (`ConfigSchema`, `ConfigField`, `FieldKind`).

---

## 1. Purpose

Let an admin read and change every panel-writable JARVIS setting (196 keys on this branch) from one place:
grouped by the catalogue's category, searchable, in HA's own light/dark theme with native HA form controls,
with immediate per-field save feedback (saving / saved / failed). It replaces the old eight-section settings
tab whose cards were hand-written per key.

The bespoke, non-key/value tools of the old tab (live model lists, governance switches, operational-mode
chips, mutes, document library, camera rename/location, doorbell training, diagnostics buttons, floor-plan
editor, …) were **not** in this view in Phase 2. Where an old card mixed plain settings with a tool, the plain
settings are ported through the catalogue and the tool is listed in §7 "Dropped to Phase 3". **Phase 3:**
those tools now exist — as field editors and tool cards inside this view (settings-tools.md) or in their own
views — and the per-category "Not yet ported" note became "Elsewhere in the panel" (§4.1).

---

## 2. Data

Every command is admin-only (`@websocket_api.require_admin`; the panel is `require_admin=True`, so a
non-admin never reaches this view). `ws()` rejects with a `WsError {code, message}`; HA-level codes the view
may see on any call: `unauthorized`, `unknown_command` (backend older than the panel), `timeout`,
`no_connection` (raised locally when `hass` is missing).

### 2.1 `jarvis/config_schema` — catalogue **and** current values (primary source)

Implemented in `websocket.ws_config_schema` → `config_apply.build_schema(PANEL_WRITABLE_KEYS, resolve)`
(working tree of this branch; pinned by `tests/unit/test_config_schema_ws.py`; documented in
`docs/native-entities.md` → "Panel data API").

Request (voluptuous, exact — no other keys):

```python
{ vol.Required("type"): "jarvis/config_schema" }
```

Response:

```ts
{
  fields: ConfigField[];            // catalogue order (config_apply._FIELDS), then any uncatalogued writable
                                    // keys sorted by name with category "Other" (none exist today)
  values: { [key: string]: unknown };   // exactly one entry per field; current effective value
  categories: string[];             // ["core","voice","learning","safety","cameras","home","governance","Other"]
}

ConfigField = {
  key: string;                      // the jarvis/update_config key
  kind: "bool" | "int" | "float" | "enum" | "str" | "list" | "json";
  label: string;                    // English; never empty (falls back to the humanised key)
  category: string;                 // one of `categories`
  default: unknown;                 // JSON-safe catalogue default; null = unset/blank
  options: string[] | null;         // enum only (strings, exactly as they must be saved); null otherwise
  min: number | null;               // int/float only; null otherwise
  max: number | null;               // int/float only
  step: number | null;              // int: 1 unless the catalogue says otherwise; float: may be null
  expose: boolean;                  // true = also a native HA switch/select/number/text entity
}
```

Semantics the view relies on:

* `values[key]` is resolved `runtime_config → config.json → config entry → catalogue default`
  (`_runtime_opt` for scalars, `_get_runtime_json` for `list`/`json`) and then **coerced to the kind**
  (`config_apply.coerce_for_kind`): `"true"`→`true`, `"45"`→`45`, int `2` for an enum→`"2"`, JSON text for
  list/json→parsed, sets/tuples→arrays. An unparseable stored value is passed through untouched (e.g. the
  string `"soon"` for an `int`) — the view must tolerate a value of the wrong JS type (§3.3). An unset
  numeric with a `null` default is `null` (e.g. `hazard_lat`).
* Secret-looking keys (name contains `key`, `token`, `password`, `secret`) are omitted from `fields` and
  `values` unless they are exposed or numeric/bool (`vision_thinking_max_tokens` stays). Nothing is omitted
  today; the view must simply not assume a key exists.
* `fields` is the complete writable set: `set(fields.key) == PANEL_WRITABLE_KEYS`. Any key not in `fields`
  cannot be saved (`update_config` would answer `invalid_key`).
* `expose` does **not** mean "show in the UI". The view renders **every** field (the catalogue is the
  exposure); `expose` only adds an "HA entity" badge.
* Fetch on view connect; **re-fetch after every successful save** (it is pure in-memory on the backend and
  returns the post-side-effect values, e.g. `review_enabled` flipped by saving `review_provider`). Also
  re-fetch on "Retry". Not on a timer.
* Error: `send_error(id, "config_schema_failed", str(exc))`. On a backend without the command HA answers
  `unknown_command`.

The full catalogue (key, kind, default, options/bounds, label, expose) as of this branch is in **Appendix A**
for fixtures/tests (`frontend/dev/fixtures/config_schema.json` should be generated from it:
`{fields, values: {key: default}, categories}`).

### 2.2 `jarvis/get_panel_data` — snapshot, used only for suggestion lists

Arrives as the `data` property from the panel shell (`PanelData`, refreshed every 20 s and on `refresh()`);
the view never calls it itself. Request `{type: "jarvis/get_panel_data"}`; this view reads only:

```ts
data.areas: { id: string; name: string; … }[]                      // area suggestions
data.config.notify_services_available: string[]                    // e.g. "notify.mobile_app_pixel"
data.config.directive_presets: string[]                            // ["guardian_steward","protector","steward"]
data.config.configured_providers: string[]                         // providers with a stored key/endpoint
data.config.available_labels: { id: string; name: string }[]
data.config.cameras: { entity_id: string; name: string; raw_name: string; enabled: boolean;
                       outdoor: boolean; location_mode: "auto"|"indoor"|"outdoor" }[]
data.config.satellites: { entity_id: string; name: string; area: string }[]
data.config.cast_devices: { entity_id: string; name: string }[]
data.config.sentinel_rules: { id: string; desc: string }[]
```

All optional: when `data` is null or a list is missing, the field simply has no suggestions. The snapshot's
`config` block also repeats 167 of the 195 values, but **the view must not read values from it** — the
schema's `values` is typed and complete (28 keys are missing from the snapshot block, e.g.
`classifier_rate_limit`, `cognition_threshold`, `energy_agency`, `semantic_search`, `document_watch_folders`,
`outdoor_entities`; the old panel read `classifier_rate_limit` from `observer_stats.rate_limit`).

### 2.3 `jarvis/update_config` — write one setting

Request (voluptuous, exact):

```python
{
    vol.Required("type"): "jarvis/update_config",
    vol.Required("key"): str,
    vol.Required("value"): vol.Any(bool, str, int, float, list, dict, None),
}
```

Success: `{ "key": string, "value": <echo of the value sent> }`.

Errors:

| code | when | message |
|---|---|---|
| `invalid_key` | key not in `PANEL_WRITABLE_KEYS` | `Key '<key>' is not writable from the panel` |
| `no_entry` | no JARVIS config entry | `No JARVIS config entry found` |
| `no_data` | runtime data missing | `JARVIS runtime data not found` |
| `update_failed` | `config_apply.async_apply` raised | `str(exc)` |

Backend behaviour (`config_apply.async_apply`): writes `runtime_config` in memory (no entry reload — the
browser is not navigated away), persists via `jarvis_config.set_many`, refreshes the snapshot coordinator,
fires `SIGNAL_CONFIG_CHANGED` (native HA entities update). **No server-side validation or coercion on
write** beyond the voluptuous type union — the view must send the right JS type for the kind (§3.3).
Side effects: `observer_enabled` starts/stops the observer immediately; any of `llm_provider, model,
llm_base_url, custom_base_url, ollama_base_url, classifier_provider, classifier_model, reasoning_provider,
reasoning_model, review_provider, review_model` hot-swaps the LLM clients; a non-blank `review_provider` or
`review_model` also writes `review_enabled = true` (only the requested key is echoed → re-fetch the schema).
`list`/`json` kinds are sent as real arrays/objects (schema accepts `list`/`dict`; readers accept both arrays
and legacy JSON strings). Sending `null` for an int/float clears the key so the backend default applies.

### 2.4 `jarvis/reload_appliances` — post-save hook (kept)

Request `{ "type": "jarvis/reload_appliances" }`. Response
`{ ok: true, appliances: { running: boolean, profile: [...], tracked_sensors: [...], native: [...], whole_home: boolean } }`;
error `reload_failed`. Called after a successful save of `appliance_profile` or `appliance_announce_unknown`
(the old panel did) so the appliance monitor restarts with the new profile. Failure is non-fatal (value is
already persisted): row status "Saved — appliance monitor reload failed: {message}" in warning colour.

### 2.5 Translations

`t()` from `src/i18n.ts`; dictionaries at `/jarvis_panel_static/i18n/<lang>.json` keyed by the exact English
string (337 keys in 23 files when this spec was written; since Phase 3, 22 language files carrying all 1185
panel keys — `frontend/i18n-missing.json`). The panel shell loads the language from `data.config.ui_language` /
`hass.language` after each snapshot (`_ensureLanguage`). When the user changes `ui_language` in this view:
`await loadLanguage(resolveLanguage(newValue, hass.language))` **first**, then save, then `refresh()` — the
strings must switch before the re-render (old panel issue #55 race). Mechanism and files are unchanged.

### 2.6 Commands the old tab used that the generic view does NOT call (reference for Phase 3)

Exact contracts so the Phase 3 agent need not re-read the old panel. Phase 3 status: `list_models`,
`get_enforcement` / `set_enforcement`, `energy`, `hazard`, `mutes`, `voice_confirm_test` and the service
calls are now called by this view's tool cards / editors (settings-tools.md); `mode` lives on Overview,
`biometrics` on People, `diagnostics` / `get_calibration` on Logs, `documents` / `semantic_search` on
Documents, `rename_camera` / `camera_location` on Cameras.

| type | request (voluptuous) | response (`send_result`) | old UI |
|---|---|---|---|
| `jarvis/list_models` | `{provider: str (required), base_url?: str}` | `{provider, models: string[]}`; on failure `{provider, models: [], error: "could not retrieve models — check the provider URL and API key; see the Home Assistant logs for details"}` (never an error frame) | AI Models dropdowns (6 roles: `llm_provider`/`model`, `classifier_*`, `reasoning_*`, `review_*`, `vision_*`, `camera_reasoning_*`) |
| `jarvis/get_enforcement` | `{}` | `{switches: {key, name, explanation, category: "capability"\|"safety", phase, default: bool, enabled: bool, overridden: bool}[]}`; error `enforcement_failed` | Governance card |
| `jarvis/set_enforcement` | `{key: str, enabled: bool}` | `{switch: <same entry shape>}`; errors `invalid_key` ("Unknown enforcement switch '<key>'"), `enforcement_set_failed` | Governance toggles (confirm when turning a safety switch OFF or a capability ON) |
| `jarvis/mode` | `{action: "status"\|"set", mode?: str, reason?: str}` | status `{active, since, reason, description, overrides: {proactive, banter, announce_scope, auto_actions, quiet}, available: {name, description}[]}`; set `{ok, mode?, error?, …status}`; error `mode_failed` | Operational Mode chips (now on the Overview view) |
| `jarvis/biometrics` | `{action: "status"\|"enable"\|"disable"}` | `{enabled: bool, found: int, entities: {kind, …}[]}`; error `biometrics_failed` | Wellbeing Context |
| `jarvis/energy` | `{action: "status"\|"set_agency", agency?: str}` | `{watts, kw, meter, peak_watts, over_peak, agency, configured_agency, running: {name, entity, watts, shed_ok}[], advice: string[]}`; errors `bad_agency`, `energy_failed` | Energy Management |
| `jarvis/diagnostics` | `{}` | `{overall: "ok"\|"warn"\|"idle"\|"down"\|"off", services: {name, key, status, detail}[], summary}`; error `diagnostics_failed` | System Diagnostics (now on the Logs view) |
| `jarvis/get_calibration` | `{}` | `{calibration: {n, brier?, ece?, bins?: {lo, hi, count, good_rate}[]}, interruption_budget: {judged, assessment?, unwelcome_rate?, multiplier?}, stats, suggestion, suggestion_threshold?: {base, effective, learned_delta}}`; on exception `{calibration:{n:0}, interruption_budget:{judged:0}, error}` | Judgment calibration |
| `jarvis/hazard` | `{action: "status"\|"scan"}` | status `{enabled, center: [lat,lon]\|null, using_override, quake_radius_km, quake_min_mag, disaster_radius_km, feeds: {earthquakes, weather, disasters}}`; scan `{ok: true, center, earthquakes: {mag, place, dist_km}[], weather: {severity, event, area?}[], disasters: {category, title, dist_km}[], counts}` or `{ok: false, error}`; error `hazard_failed` | Hazard "SCAN NOW" + location line |
| `jarvis/documents` | `{action: "status"\|"ingest"\|"search"\|"upload"\|"scan_watch"\|"delete", query?, filename?, content?(base64)}` | status `{chroma, fts, directory, chunk_count, sources: {source, chunks}[]}`; ingest `{files_ingested, total_chunks, semantic?, embedded_chunks?}`; search `{results: {source, text, score?}[]}`; upload `{ok, filename, chunks, embedded?, error?}`; scan_watch `{watched, new_files}`; delete `{ok}`; error `documents_failed` | Document Library |
| `jarvis/semantic_search` | `{action: "status"\|"enable"\|"disable"\|"test"}` | status `{enabled, ollama_configured, vector_count, base, model}`; enable `{ok, model, base, dim?, error?, enabled: true}`; disable `{enabled: false, ok: true}`; error `semantic_search_failed` | "ENABLE SEMANTIC SEARCH" |
| `jarvis/mutes` | `{action?: "list"\|"mute"\|"unmute"\|"clear", entity_id?, category?}` | `{entities: string[], categories: string[], all: bool}`; error `mutes_failed` | Muted Announcements |
| `jarvis/voice_confirm_test` | `{}` | `{ok: true, satellite, note}` or `{ok: false, note, error?}`; error `test_failed` | "TEST SATELLITE AUDIO" |
| `jarvis/rename_camera` | `{entity_id: str, name: str\|null}` | `{ok: true, camera_names, cameras}`; errors `unknown_camera`, `rename_failed` | Cameras name inputs |
| `jarvis/camera_location` | `{entity_id: str, mode: "auto"\|"indoor"\|"outdoor"}` | `{ok: true, cameras}`; errors `unknown_camera`, `camera_location_failed` (writes `indoor_entities`/`outdoor_entities`) | Cameras location chips |
| `jarvis/run_analysis` | `{}` | `{ran: bool, patterns_found?, new_suggestions?, reason?, error?, backfill?: {imported, entities}, diagnostic?, near_misses?}` | "Analyze Now" (dashboard) |

`hass.callService` calls the old tab made:

| service | data | old button |
|---|---|---|
| `jarvis.test_tts` | `{}` | TTS — JARVIS voice test |
| `jarvis.observer_status` | `{}` | Observer — fire status event |
| `jarvis.briefing` | `{}` (Diagnostics card) / `{announce: true}` ("BRIEF ME NOW"; refused client-side when neither `announcement_speakers` nor `broadcast_group` was set) | Briefing — manual trigger |
| `jarvis.diagnose_doorbell` | `{}` | Doorbell — run diagnostics |
| `jarvis.test_notify` | `{}` | Notification — test phone push |
| `jarvis.test_routing` | `{}` | Routing — dump routing state to log |
| `jarvis.analyze_camera` | `{entity_id: <camera.*>, announce: true}` | Camera — analyze now |
| `jarvis.train_doorbell_backlog` | `{limit: int 1..500 (default 40)}` | Doorbell Training "Scan backlog" |

Keys the old tab wrote via `jarvis/update_config` outside a generic field (all in the catalogue, so the new
view covers them automatically): `classifier_rate_limit` ("Hourly Cap"), `custom_base_url`,
`ollama_base_url`, `llm_base_url` (cleared to `""` when the main provider switched to
groq/openai/gemini/anthropic), `notify_service`, `appliance_profile` (JSON string of
`{name,type,entity,watts}[]`), `appliance_announce_unknown`, `disabled_sentinel_rules`,
`satellite_pairings`, `announcement_speakers`, `pattern_include_entities`, `excluded_entities/domains/labels`,
`lab_areas`, `bedroom_areas`, `disabled_cameras`, `document_watch_folders`, `onboarding_dismissed`,
`residence_style`, plus every `data-cfg-key` toggle/select/number/text field.

---

## 3. Field rendering rules

### 3.1 Component by kind

| kind | HA element (fallback) | save trigger | value sent |
|---|---|---|---|
| `bool` | `ha-switch` inside `ha-formfield` (`<input type="checkbox" role="switch">`) | `change` | `true`/`false` |
| `enum` | `ha-select` + `mwc-list-item`/`ha-list-item` per option (`<select>`) | `selected`/`closed` with a changed value (`change` on the fallback) | the option string exactly (`""` allowed — `output_language` auto) |
| `int` | `ha-textfield type="number"` with `min`/`max`/`step` (`<input type="number">`) | `change` (blur or Enter), only if changed | `Number(v)`; empty → `null` |
| `float` | as `int`; `step="any"` when `step` is null. Optional `ha-slider` beside it when `min` and `max` are set and `max - min <= 1` (the 0..1 thresholds) | `change` | `Number(v)`; empty → `null` |
| `str` | `ha-textfield` (`<input type="text">`); `type="url"` when the key ends in `_url`; placeholder `HH:MM` when the key ends in `_time` or is `observer_quiet_start/_end` | `change` (blur or Enter), only if changed | trimmed string |
| `list` | `ha-textarea` (`<textarea>`), one item per line (commas also accepted) | per-field **Save** button (`list`/`json` are the only kinds with one) | `string[]` of trimmed, non-empty, de-duplicated lines |
| `json` | `ha-textarea` (`<textarea class="jv-mono">`) pre-filled with `JSON.stringify(value, null, 2)`, live `JSON.parse` validation | **Save** button, disabled while invalid | the parsed object/array |

One Lit component `<jarvis-config-field .field .value …>` (`src/views/settings/field.ts`) switches on
`field.kind` — unless a registered field editor matches the key (settings-tools.md §3.2) — and emits
`field-change` (`detail: {key, value}`, already coerced to the kind) and `field-reset` (`{key}`); the view
owns saving. A row shows: label (`t(LABEL_OVERRIDE[key] ?? field.label)`), the key in `.jv-mono` muted text
(hidden unless the toolbar's "Show keys" toggle is on), the "HA entity" badge (`jv-state-badge level="info"`)
when `expose`, help text (§3.4), the control, a "Default: {value}" hint with a "Reset to default" button
when the value differs from `default`, and a status slot (Saving… / Saved ✓ / error / warning). (The
optional `ha-slider` of the `float` row is not implemented.)

### 3.2 Reading the current value

`value = key in schema.values ? schema.values[key] : field.default`. Nothing else — never the snapshot.

### 3.3 Tolerating a wrong-typed value

`values` are coerced server-side, but an unparseable stored value comes through raw. Per kind:

* `bool`: not a boolean → render the switch off, show warning "Stored value is not a boolean: {raw}".
* `int`/`float`: `typeof !== "number"` and not `null` → empty field with warning "Stored value is not a
  number: {raw}" (saving a number overwrites it).
* `enum`: `String(v)`; not in `options` → keep it selected as an extra disabled option labelled
  "{raw} (not an option)" so the user sees it, and show the warning.
* `str`: `v == null ? "" : String(v)`.
* `list`: not an array → `[]` plus warning. `json`: an unparsable string → show the raw text in the textarea
  with "Invalid JSON stored" so it can be fixed.

On write the view always sends the catalogue kind's JS type (§3.1) — the only guard against type drift.

### 3.4 Presentation maps (the only per-key knowledge in the view; all strings verbatim from the old panel)

**Enum option labels** `ENUM_LABELS[key][option]` (fallback: the raw option; for `directive_preset`, `_`→space):

* `ui_language`: `auto`→"Auto (Home Assistant)", `en`→"English", `zh`→"中文（简体）", `zh-hant`→"中文（繁體）",
  `cs`→"Čeština", `da`→"Dansk", `de`→"Deutsch", `es`→"Español", `fr`→"Français", `it`→"Italiano",
  `nl`→"Nederlands", `nb`→"Norsk bokmål", `pl`→"Polski", `pt`→"Português", `pt-br`→"Português (Brasil)",
  `ro`→"Română", `ru`→"Русский", `sk`→"Slovenčina", `fi`→"Suomi", `sv`→"Svenska", `tr`→"Türkçe", `uk`→"Українська".
* `output_language`: `""`→"Auto (Home Assistant)", `en`→"English", `zh`→"中文 (Chinese)", `cs`→"Čeština (Czech)",
  `da`→"Dansk (Danish)", `nl`→"Nederlands (Dutch)", `fi`→"Suomi (Finnish)", `fr`→"Français (French)",
  `de`→"Deutsch (German)", `el`→"Ελληνικά (Greek)", `he`→"עברית (Hebrew)", `hu`→"Magyar (Hungarian)",
  `id`→"Indonesia (Indonesian)", `it`→"Italiano (Italian)", `ja`→"日本語 (Japanese)", `ko`→"한국어 (Korean)",
  `nb`→"Norsk (Norwegian)", `pl`→"Polski (Polish)", `pt`→"Português (Portuguese)", `ro`→"Română (Romanian)",
  `ru`→"Русский (Russian)", `sk`→"Slovenčina (Slovak)", `es`→"Español (Spanish)", `sv`→"Svenska (Swedish)",
  `th`→"ไทย (Thai)", `tr`→"Türkçe (Turkish)", `uk`→"Українська (Ukrainian)", `vi`→"Tiếng Việt (Vietnamese)".
* `banter_level`: `0`→"Plain — no wit", `1`→"Dry — occasional wit (default)", `2`→"Full — MCU JARVIS".
* `camera_alert_level`: `off`→"Off — observe only", `urgent`→"Urgent only (default)",
  `important`→"Important — + deliveries", `all`→"Everything notable".
* `chimney_side`: `right`→"East / right", `left`→"West / left", `center`→"Center / ridge", `none`→"None".
* `basement_entrance`: `bulkhead`→"Exterior bulkhead", `interior`→"Interior stairs (inside)".
* `voice_confirm_mode`: `auto`→"Auto (try native, fall back)", `native`→"Native (satellite audio)",
  `gated`→"Gated (room speaker)".
* `search_backend`: `duckduckgo`→"DuckDuckGo (no key, default)", `searxng`→"SearXNG (self-hosted)".
* `recognition_source`: `both`→"Both (Double Take + Frigate)", `frigate`→"Frigate only (sub_label)",
  `doubletake`→"Double Take only".
* `energy_agency`: `advisory`→"advisory", `opt_in`→"opt-in", `autonomous`→"autonomous".
* `home_stories`, `floor_plan_units`: raw.

**Confirm before enabling** `CONFIRM_ON_ENABLE[key]` — `confirmDialog({heading: t(label), message, confirmLabel: t("Enable"), destructive: true})`
before sending `true`; turning off never asks:

* `friday_automator`: "Enable the FRIDAY automator?\n\nUnlike every other sub-agent, FRIDAY can CONTROL your
  devices, run scenes and run scripts on its own. Only enable it if you want JARVIS to actuate your home
  autonomously."
* `autonomy_enforce`: "Let JARVIS act without asking?\n\nWhen ON, JARVIS will perform convenience automations
  it has learned you approve (e.g. lights on at dusk) on its own, without a prompt each time — governed by
  the kernel's per-capability trust ladder.\n\nIt will NEVER auto-act security- or safety-critical
  capabilities: unlocking doors, disarming the alarm, opening the garage, or turning lockdown off ALWAYS ask
  first, no matter how often approved.\n\nYou can turn this back off here at any time. Enable
  kernel-governed autonomy?"
* `suggest_garage_confirmation`: "This lets JARVIS SUGGEST automations that close a garage door or cover
  automatically once a confirmation sensor fires. Nothing installs without your explicit approval, and each
  suggestion is flagged safety-sensitive. Enable these suggestions?"

**Suggestions** `SUGGEST[key](data, hass)` → `{value, label}[]`, rendered as a `<datalist>` on `str`
fields and as clickable chips (append a line) under `list` fields. Build lazily on focus (thousands of
entities are possible):

| key | source |
|---|---|
| `notify_service` | `data.config.notify_services_available` (label without the `notify.` prefix; save with it) |
| `broadcast_group`, `movie_media_player` | `hass.states` ids starting `media_player.` (label = `friendly_name`) |
| `departure_origin_entity` | `person.*`, `device_tracker.*`, `zone.*`, plus `sensor.*` with `latitude`+`longitude` attributes |
| `departure_travel_sensor` | `sensor.*` with `device_class: duration`, or unit matching `/^(min|mins|minute|minutes|h|hr|hrs|hour|hours)$/i`, or id matching `/travel|commute|duration|eta|arrival|route|waze|maps|mapbox|tomtom|here[_ ]?travel|traffic|drive[_ ]?time|driving|depart|time_to|to_work|to_home/i` |
| `driving_car_sensor` | `binary_sensor.*` with id or friendly_name matching `/android[_ ]?auto|head[_ ]?unit|\bcar\b/i`, or `device_class: connectivity` |
| `residence_style` | `cape_cod` "Cape Cod", `colonial` "Colonial", `dutch_colonial` "Dutch Colonial", `ranch` "Ranch", `two_story` "Two-Story", `craftsman` "Craftsman", `modern` "Modern", `townhouse` "Townhouse", `apartment` "Apartment", `cabin` "Cabin" (kind is `str`, see Risks) |
| `movie_area`, `bedroom_areas`, `lab_areas`, `outdoor_areas` | `data.areas[]` (`id`, label `name`) |
| `excluded_entities`, `pattern_include_entities`, `presence_only_entities`, `voice_confirm_entities`, `outdoor_entities`, `indoor_entities` | all `hass.states` ids |
| `excluded_domains` | distinct domains of `hass.states` |
| `excluded_labels` | `data.config.available_labels[].name` |
| `announcement_speakers` | `data.config.cast_devices[]` (`entity_id`, label `name`) |
| `disabled_cameras` | `data.config.cameras[]` (`entity_id`, label `name`) |
| `disabled_sentinel_rules` | `data.config.sentinel_rules[]` (`id`, label `desc`) |
| `*_provider` | `groq`, `openai`, `gemini`, `ollama`, `anthropic`, `custom`; label gets " — needs setup" when not in `data.config.configured_providers` |
| `directive_preset` | (enum already) — no suggestions |
| `satellite_pairings` (json) | extra help line: "Keys: {satellites as `entity_id · area or name`}; values: {cast device ids}" |

**Help text** `HELP[key]` (old card descriptions, shown under the label):

| key | help |
|---|---|
| `ui_language` | “Panel language” translates this dashboard. Auto follows Home Assistant. |
| `output_language` | The language of JARVIS's own briefings, camera analysis and announcements — set it when your Home Assistant runs in English but you want JARVIS in another language. Auto follows Home Assistant. A spoken request in another language is still answered in that language. |
| `announcements_enabled` | Master switch — all proactive speech |
| `announce_notify_only` | Mute speakers — proactive announcements go to your phone/text instead (incl. critical). No unsolicited speaker interruptions. |
| `sentinel_enabled` | Door/garage/lock-left-open alerts |
| `observer_enabled` | AI event awareness (uses API) |
| `cognition_enabled` | Local triage — sees all telemetry, gates cloud |
| `adaptive_interruption_budget` | Interrupt less after recent alerts were dismissed as unneeded |
| `adaptive_suggestion_threshold` | Tune the suggestion bar from how often past suggestions were useful |
| `adaptive_cognition_threshold` | Tune the anticipation/anomaly bar from how welcome recent alerts were |
| `camera_auto_analyze` | Inspect doorbell presses (vision + event-media) |
| `camera_auto_analyze_motion` | Also inspect Frigate person/object detections, not just doorbell presses (needs Camera Watch on) |
| `camera_motion_vision` | No Frigate/Nest? A Home Assistant motion/occupancy sensor firing silently analyzes the camera covering that room — so best-effort face recognition & scene learning work on plain cameras. Throttled per camera; no spoken alerts. |
| `camera_alert_level` | When auto reviews speak aloud. Everything is still analyzed & logged — this only gates what's announced. Intrusion alerts are always spoken. |
| `package_detection` | Detect packages & mail at the door |
| `visitor_learning` | Silently learn from person events — never spoken |
| `rich_reasoning` | Cloud-first judgment for medium+ events |
| `light_control_enabled` | Off = still show which rooms have lights on, but disable toggling from the dashboard |
| `appliance_power_guessing` | Off = only announce appliances with native sensors or ones you've mapped (no guessing from the power meter) |
| `friday_automator` | ⚠️ Advanced. A background sub-agent that can CONTROL devices, run scenes and scripts on its own — every other sub-agent is read-only. Off by default; enabling asks you to confirm. |
| `autonomy_enforce` | ⚠️ Lets JARVIS carry out automations you've already approved enough times WITHOUT asking each time — governed by the kernel's graduated-autonomy ladder. Security & safety capabilities (unlock, disarm, garage/lockdown off) NEVER auto-act; they always ask. Off by default; turn it off here anytime. |
| `proximity_volume` | Soften announcements when mmWave distance sensors show you're close to the speaker. No effect in rooms without distance sensors; never dampens critical alerts. |
| `host_telemetry` | Read the server's CPU temperature, memory pressure and NVMe I/O (from /proc and /sys) and fold critical stress into the infrastructure audit & System Diagnostics. |
| `departure_require_location` | skip "time to head out" for online meetings & events with no place set |
| `door_window_alerts_enabled` | announce when one is open at an unusual time — they stay monitored for security either way |
| `continued_conversation_multi_satellite` | reopen the mic in the room you moved to (needs 2+ satellites) |
| `departure_origin_entity` | where you set out from for drive-time — your phone or car GPS (a zone or a location sensor works too); blank uses whoever's tracked, then home |
| `departure_osrm_url` | optional self-hosted routing server (OSRM); blank uses the free public router |
| `departure_travel_sensor` | optional override — a sensor that already reports drive-time in minutes (Waze, Google/HERE Maps…); blank computes it from your origin via OSRM |
| `driving_mode_enabled` | send alerts to the car screen (Android Auto) instead of the house when your phone is connected |
| `driving_car_sensor` | leave blank to auto-detect the Home Assistant companion app's Android Auto sensor |
| `home_context_max_entities` | Lower this (0 = counts only) if your LLM provider rejects requests for being too large — e.g. Groq's free tier caps tokens-per-minute. The assistant still discovers entities on demand, so nothing breaks. |
| `custom_base_url` | OpenAI-compatible endpoint for the custom provider. (placeholder `http://gpu-server:11434/v1`) |
| `ollama_base_url` | Leave empty to use Ollama's default Home Assistant endpoint. (placeholder `http://gpu-server:11434/v1`) |
| `ollama_num_ctx` | Context window for local Ollama models. Larger = more context, but more VRAM and slower. Default 8192. |
| `classifier_rate_limit` | Max observer LLM calls per hour. 0 = unlimited (local LLM / high-quota tiers). |
| `vision_model` | Needs an image-capable model — e.g. moondream on Ollama, or a Groq vision model. Text-only models (like gpt-oss) will fail on camera analysis. |
| `vision_thinking_max_tokens` | Higher budget so a thinking model has room to think AND answer. |
| `vision_min_interval` | Minimum seconds between automatic (motion / auto-event) camera analyses, to cap vision token use. 0 = off. Explicit requests and doorbell presses are never throttled. |
| `notify_service` | Phone push for high/critical alerts |
| `appliance_profile` | Tell JARVIS which appliances exist so it names cycles correctly instead of guessing from the whole-home meter. Map a dedicated power or status entity when one exists (most accurate); otherwise set typical running watts so the meter can match it. Items: `{"name","type":"washer|dryer|dishwasher|oven|microwave|appliance","entity","watts"}` |
| `appliance_announce_unknown` | Announce unidentified loads (loads matching no declared appliance) |
| `operational_mode_auto` | AUTO · follow occupancy (away ↔ normal). Off = you set modes by hand or voice; discretionary modes (party/movie/lab/…) are always manual. |
| `hazard_monitor_enabled` | Real-time nearby earthquakes (USGS), severe-weather warnings (NWS), and natural disasters like wildfires (NASA EONET). Scoped to your home location; alerts speak and push like any JARVIS alert. |
| `hazard_lat`, `hazard_lon` | Override (optional) — blank uses home coordinates. |
| `briefing_morning_enabled`, `briefing_evening_enabled` | JARVIS speaks a summary at the times you set — weather and the day's forecast, your calendar, what happened overnight, power draw, and any active hazards nearby. |
| `banter_level` | Banter is silenced automatically during anything urgent — a safety alert always speaks plainly. |
| `search_backend` | DuckDuckGo needs no setup; SearXNG needs a URL. |
| `web_research_llm_fallback` | When the backend above finds nothing, let JARVIS fall back to the configured LLM's own live web search (currently Gemini only). Off by default. |
| `identity_min_confidence` | Below this face-match confidence a person is recorded as 'unknown'. Higher = stricter, fewer false names. |
| `voice_confirm_enabled` | Ask out loud before sensitive actions (unlock, garage, disarm) and listen for a spoken yes/no. Native mode uses the satellite's own audio; gated mode speaks through the room speaker (Nest). |
| `directive` | overrides preset — (optional) a custom standing directive |
| `bedroom_areas` | Bedroom areas drive sleep detection during quiet hours. |
| `broadcast_group` | The broadcast group is the media_player JARVIS announces through. |
| `observer_quiet_start`, `observer_quiet_end` | Between these times JARVIS stays quiet — proactive announcements, briefings and the Observer back off. HH:MM |
| `identity_voice_fingerprint` | needs a GPU |
| `imap_enabled` | Read-only inbox access. The password is not entered here — set it in Settings → Devices & Services → JARVIS → Configure → Email (it lives in Home Assistant secrets.yaml). |
| `pattern_learn_doors` | Door, window and garage contact sensors |
| `pattern_learn_presence` | People and device trackers (home / away) |
| `pattern_learn_buttons` | Suggest "press → scene / action" automations |
| `suggest_garage_confirmation` | Safety-sensitive: suggest "arrive → open, confirm, then close a cover" routines. Off by default; you still approve each one. |
| `pattern_include_entities` | for a skipped-domain entity you want as a routine trigger — e.g. a bay occupancy sensor |
| `excluded_entities` | Entities you exclude are removed from JARVIS's awareness — presence detection, room routing, the observer and routine learning all skip them. Home Assistant still has the entity, and JARVIS can still control it if you ask for it by name. |
| `excluded_domains` | e.g. light, switch — every entity in the domain |
| `excluded_labels` | every entity carrying a Home Assistant label |
| `lab_areas` | Lab rooms — quiet only here |
| `movie_media_player` | optional |
| `document_watch_folders` | one folder per line or comma-separated — e.g. /media/downloads |
| `residence_style`, `home_stories`, `garage_bays`, `dormers_front`, `dormers_rear`, `chimney_side`, `chimney_count`, `has_basement`, `basement_entrance`, `home_bedrooms`, `home_bathrooms`, `floor_plan_sqft` | Drives the Residence 3D model + property stats. Detailed room layout is edited in the floor-plan editor. |
| `*_provider`, `*_model` | Groq, OpenAI, Google Gemini, Anthropic, a local Ollama server, and any OpenAI-compatible endpoint (Custom) are all supported. A provider marked needs setup has no key yet — add one in Settings → Devices & Services → JARVIS → Configure. |
| `floor_plan_*`, `door_mapping` | Edited visually in the floor-plan editor (Phase 3); raw JSON here. |

Keys without a row have label only. **Hidden**: `onboarding_dismissed` renders only when the search query
matches it (internal flag written by the dashboard's welcome card).

### 3.5 Special-case behaviour

* `ui_language`: `loadLanguage()` first, then save, then `refresh()` (§2.5).
* `appliance_profile`, `appliance_announce_unknown`: `jarvis/reload_appliances` after a successful save (§2.4).
* Confirm keys (§3.4) before sending `true`.
* Emptied number field → send `null`; show the default as the placeholder.
* Out-of-range number on blur: clamp to `[min, max]`, show "Clamped to {min}–{max}", then save the clamped value.

---

## 4. Layout

### 4.1 Structure (desktop, `narrow === false`)

```
┌ view header (inside the panel's app bar area) ─────────────────────────────┐
│ Settings                                     [ha-textfield 🔍 Search settings…] │
├ left rail (categories) ───────┬ content ──────────────────────────────────────┤
│ ● General (76)                │ <jv-section heading="General" subheading="76 settings">       │
│   Voice & Audio (22)          │    field row · field row · …  (catalogue order)             │
│   Learning (26)               │ </jv-section>                                               │
│   Safety & Energy (20)        │ <jv-section heading="Not yet ported"> one line per §7 row  │
│   Cameras (17)                │    that belongs to this category </jv-section>              │
│   Home & Extras (27)          │   (Phase 3: tool cards render ABOVE the fields section;     │
│   Governance (8)              │    "Elsewhere in the panel" replaces "Not yet ported")      │
│   Other (n)  ← only if n > 0  │                                                             │
└───────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

Category order is `schema.categories`; display names (old sub-nav labels so existing `t()` keys match):

| category | heading | old section |
|---|---|---|
| `core` | General | general |
| `voice` | Voice & Audio | voice |
| `learning` | Learning | learning |
| `safety` | Safety & Energy | safety |
| `cameras` | Cameras | cameras |
| `home` | Home & Extras | home (+ floorplan → Phase 3) |
| `governance` | Governance | governance |
| `Other` | Other | — (uncatalogued writable keys; hidden when empty) |

One category is visible at a time (as the old tab). Fields are in catalogue order inside one `jv-section`;
a `.jv-divider` is inserted when the key's first `_`-segment changes (`briefing_*` → `imap_*` → …) for
visual grouping without hand-written sub-sections. The count in the rail/subheading is the field count.

Below the fields, a second `jv-section` "Not yet ported" lists the §7 rows mapped to this category, one line
each: `{Card name} — {why} — Phase 3`, in `.jv-muted`.

> **Phase 3 update.** The tools listed in §7 now exist (settings-tools.md; their own views for the floor
> plan, cameras, people and documents), so `NOT_PORTED` is gone. `presentation.ts` `ELSEWHERE` lists the old
> cards that live in another view, rendered as "Elsewhere in the panel" with one link per line
> (`{Card name}` as a button that navigates there, then `— {why}`).

### 4.2 Search

Toolbar search filters across **all** categories (case-insensitive substring on key, display label, help
text, enum option labels). With a non-empty query the rail is dimmed and the content shows one `jv-section`
per category with matches (match count in the subheading; empty categories hidden). `Esc` clears. Replaces
the old global search's section index.

### 4.3 Routing

`subPath` = `"<category>[/<key>]"`:

* `/jarvis/settings` → `core`.
* `/jarvis/settings/<category>` → that category (unknown → `core`).
* `/jarvis/settings/<category>/<key>` → that category, then scroll the field into view and flash it
  (`--jv-accent-soft` background for 1.6 s). Deep-link targets for the dashboard onboarding `jump`s:
  "Notifications" → `core/notify_service`, "Cameras" → `cameras`, "JARVIS Character" → `core/banter_level`,
  "Briefings" → `core/briefing_morning_enabled`.

Switching category: `this.navigate("settings", category)` (the shell does `pushState` +
`location-changed`). No query strings.

### 4.4 Mobile (`narrow === true`)

* Rail → horizontally scrollable `ha-chip` row (fallback `.jv-btn.text`) under the toolbar; active chip filled.
* Search collapses to an `ha-icon-button` (mdi:magnify) that expands the field full width.
* Field rows single-column: label + badge, help, control full width; the monospace key is hidden unless the
  overflow menu's "Show keys" is on.
* `list`/`json` textareas full width, 6 rows, Save right-aligned beneath.
* "Not yet ported" collapses into an `ha-expansion-panel` (fallback `<details>`), closed by default. (Phase 3:
  replaced by the "Elsewhere in the panel" card, rendered as a plain list.)
* Primary content on mobile: the field list of the selected category.

### 4.5 Theme

Only `--jv-*` tokens (`tokens.ts`): surfaces `--jv-surface`, text `--jv-text`/`--jv-text-2`, state
`--jv-ok`/`--jv-warn`/`--jv-danger` and their `-soft` tints, `--jv-accent`, `--jv-divider`, `--jv-mono`
font via `.jv-mono`. No literal colours, fonts or images.

---

## 5. Actions

| # | user action | trigger | call | confirm? | success | failure |
|---|---|---|---|---|---|---|
| A1 | Open view | `connectedCallback` / first `hass` | `jarvis/config_schema` | – | fields render | §6 error state + Retry |
| A2 | Toggle `bool` | switch `change` | `jarvis/update_config {key, value: boolean}` | `CONFIRM_ON_ENABLE` keys when enabling | row "Saved ✓" 2 s; schema re-fetched; `refresh()` | row "Save failed — {message}" (`--jv-danger`), control reverts to last known value; `hass-notification` toast with the same text |
| A3 | Pick `enum` | select change | same, `value: string` | – | as A2 | as A2 |
| A4 | Edit `int`/`float` | blur/Enter, changed | same, `value: number \| null` | – | as A2 | as A2 |
| A5 | Edit `str` | blur/Enter, changed | same, `value: string` | – | as A2 | as A2 |
| A6 | Save `list` | Save button | same, `value: string[]` | – | "Saved ✓ ({n} items)" | as A2; textarea keeps the text |
| A7 | Save `json` | Save button (disabled while invalid) | same, `value: object \| array` | – | "Saved ✓", re-pretty-print | as A2; textarea keeps the text |
| A8 | Change `ui_language` | select change | `loadLanguage()` → `update_config` → `refresh()` | – | view re-renders translated | strings stay; row error as A2 |
| A9 | After saving `appliance_profile` / `appliance_announce_unknown` | A2/A7 success | `jarvis/reload_appliances` | – | "Saved ✓ — appliance monitor reloaded" | "Saved — appliance monitor reload failed: {message}" (`--jv-warn`) |
| A10 | Search | typing | none | – | – | – |
| A11 | Switch category | rail/chip click | `navigate("settings", category)` | – | – | – |
| A12 | Retry | button in error state | A1 again | – | – | – |
| A13 | Reset to default | the "Reset to default" button in the row's "Default: {value}" hint (shown when value ≠ default; hidden for editors registered with `noReset`) | `update_config {key, value: field.default}` | – | as A2 | as A2 |
| A14 | Open a tool card / "Elsewhere in the panel" link | deep link `/settings/<cat>/tool:<id>` / button | none (the card fetches on first `active`) / `navigate(view, path)` | – | card scrolled into view and flashed | – |

Saves are optimistic per field: only that control is disabled while in flight ("Saving…"); different keys may
save concurrently; a second change to the same key while in flight is queued and sent after the first
resolves. After any success the view re-fetches `jarvis/config_schema` (one call per settled batch, debounced
300 ms) and applies `values` to rows that are not focused and have no in-flight save, then calls
`refresh()` so the shell snapshot and the other views pick up the change.

---

## 6. States

| state | when | shown |
|---|---|---|
| loading | schema not yet received | `<jv-empty kind="loading" heading=t("Loading settings…")>`; rail shows the seven fixed headings without counts |
| ready | schema received | §4 |
| empty category | 0 fields (defensive) | `<jv-empty compact message=t("No settings in this section.")>` |
| empty search | no match | `<jv-empty compact heading=t("No settings match “{query}”.")>` with a "Clear search" `.jv-btn` |
| error (schema) | `config_schema` rejected | `<jv-empty kind="error" heading=t("Couldn't load the settings catalogue") message=err.message>` + Retry. When `err.code === "unknown_command"` the message is t("The backend does not provide jarvis/config_schema yet — update the JARVIS integration."); when `unauthorized`: t("Administrator access is required.") |
| no snapshot | `data` null | fields render normally; suggestion lists are empty (no message) |
| saving / saved / failed | per row | "Saving…" / "Saved ✓" (auto-clears 2 s) / "Save failed — {message}" (stays until next edit) |
| wrong-typed stored value | §3.3 | row warning in `--jv-warn` |
| invalid json | textarea unparsable | Save disabled; "Invalid JSON: {message}" |
| disabled | `hass` undefined or `ws()` throws `no_connection` | all controls disabled; `ha-alert warning` t("Reconnecting to Home Assistant…") |

---

## 7. Dropped to Phase 3

Rendered as "Not yet ported" lines under the category in brackets. The plain key/value parts of each old
card **are ported** through the catalogue; only the tool part is deferred.

> **Phase 3 status.** Every row below is now ported: as a field editor or tool card in this view
> (settings-tools.md — AI Models, governance switches, mode-binding pickers, energy, hazard, briefings,
> mutes, sentinel rules, pairings, announcement speakers, entity / domain / label pickers, appliances,
> voice confirmation test and entries, diagnostics buttons, the biometric map) or in its own view (Overview
> for Operational Mode; Logs for System Diagnostics and Observer stats; Documents; Cameras incl. Doorbell
> Training; People for faces, voices and Wellbeing Context; the floor-plan editor at
> `/jarvis/residence/editor`). `presentation.ts` `ELSEWHERE` renders the view-hosted ones as "Elsewhere in
> the panel" links. The Diagnostics buttons moved to General (settings-tools.md §4.18).

| old card / feature | category | why not in Phase 2 | ported keys |
|---|---|---|---|
| AI Models live provider/model dropdowns, "Custom…" entry, retired-model self-heal, LLM URL rows | General | needs `jarvis/list_models` per role plus coupled provider→model logic and the `llm_base_url` clearing rule; not a key/value field | `llm_provider, model, llm_base_url, custom_base_url, ollama_base_url, classifier_*, reasoning_*, review_enabled, review_provider, review_model, vision_*, camera_reasoning_*, ollama_num_ctx, home_context_max_entities, vision_thinking_*, vision_min_interval` (str/int/bool with provider suggestions) |
| Governance enforcement kill-switches (`get_enforcement`/`set_enforcement`) | Governance | separate store with its own confirm rules, not in the catalogue (the Logs view carries them meanwhile) | `autonomy_enforce, friday_automator, operational_mode_auto, custom_modes, energy_*` |
| Operational Mode chips (`jarvis/mode`); Mode-bindings area-chip picker | General | runtime state (now on Overview); area chips are a picker | `lab_areas` (list), `movie_area`, `movie_media_player`, `movie_dim_pct` |
| Wellbeing Context enable/disable + discovered wearables (`jarvis/biometrics`) | Home & Extras | discovery list is runtime data | `biometrics_enabled`, `biometric_entities` |
| Energy Management live draw/advice/agency chips (`jarvis/energy`) | Safety & Energy | live status | `energy_agency` (enum), `energy_peak_watts`, `energy_mode_bump` |
| System Diagnostics "RUN CHECK" + judgment calibration | General | read-only runtime health (on the Logs view) | – |
| Hazard Monitor "SCAN NOW" + resolved-location line (`jarvis/hazard`) | Safety & Energy | live external scan | all 9 `hazard_*` |
| Briefings "BRIEF ME NOW" (`jarvis.briefing {announce:true}` with the no-speakers guard) | Voice & Audio | service call with a precondition | all 11 `briefing_*` |
| Document Library upload/ingest/search/delete/watch-scan + semantic-search toggle (`jarvis/documents`, `jarvis/semantic_search`) | Learning | file I/O and probes | `document_watch_folders`, `semantic_search`, `embed_model`, `embed_base_url` |
| Muted Announcements chips (`jarvis/mutes`) | Safety & Energy | separate mute store | – |
| Cameras: enable/disable buttons, JARVIS-only rename (`rename_camera`), indoor/outdoor chips (`camera_location`) | Cameras | two non-config commands | `disabled_cameras` (list), `recognition_source`, `identity_min_confidence`, `llm_face_recognition`, `outdoor_areas`, `outdoor_entities`, `indoor_entities` |
| Doorbell Training dataset + "Scan backlog" (`data.doorbell_training`, `jarvis.train_doorbell_backlog`) | Cameras | dataset viewer + service | – |
| Diagnostics card: six zero-arg service buttons + "Camera — analyze now" | Cameras | service calls, not settings (cheap to pull forward) | – |
| Sentinel Rules per-rule ON/OFF rows | Safety & Energy | chip editor over one list | `disabled_sentinel_rules` (list, suggestions = rule ids) |
| Satellite → Speaker pairing dropdowns | Voice & Audio | per-satellite select editing one dict | `satellite_pairings` (json + help line) |
| Announcement Speakers per-device toggles | Voice & Audio | toggle list over one array | `announcement_speakers` (list, suggestions = cast devices) |
| Excluded Entities / Routine Learning chip pickers | Learning | pickers over plain lists | `excluded_entities, excluded_domains, excluded_labels, pattern_include_entities` |
| Appliances row editor + learned-watts hints | Safety & Energy | structured editor over one JSON key (reload hook kept) | `appliance_profile` (json), `appliance_announce_unknown`, `appliance_power_guessing` |
| Observer Tuning / Memory stats (read-only) | Learning | runtime stats | `classifier_rate_limit`, `observer_group_debounce`, `cognition_*`, `adaptive_*`, `memory_threading_*` |
| Voice Confirmation "TEST SATELLITE AUDIO" (`jarvis/voice_confirm_test`) | Voice & Audio | probe | `voice_confirm_enabled`, `voice_confirm_mode`, `voice_confirm_entities` |
| Floor Plan Editor (full-width panel; imports, drag) | Home & Extras | own Phase 3 spec (pointer-events editor) | `floor_plan_*`, `door_mapping` as json/float/enum fields with the help line |
| Onboarding welcome card + "Open Settings →" jumps | – (dashboard) | lives on the dashboard; this view only honours the deep links of §4.3 | `onboarding_dismissed` (hidden) |
| Config-flow parity cards (Persona & Core, Routing, Quiet Hours, Identity, Email), Residence / Home, General toggles, Sub-Agents & Automation, Anticipation & Memory, Notifications, Character & Research | – | **fully ported** — every control was a plain key | all |

---

## 8. Strings

Every user-visible English string; `t()` key = the string itself (placeholders in `{}` are interpolated by
`t(key, vars)`). "de.json" = the exact key exists today in
`custom_components/jarvis/frontend/i18n/de.json` (fr.json and es.json have the same 337 keys — checked).

### 8.1 View chrome and states

| string | de.json |
|---|---|
| Settings | yes |
| General | yes |
| Voice & Audio | no |
| Learning | no |
| Safety & Energy | no |
| Cameras | yes |
| Home & Extras | no |
| Governance | no |
| Other | no |
| Search settings… | no |
| Clear search | no |
| No settings match “{query}”. | no |
| No settings in this section. | no |
| {count} settings | no |
| {count} matches | no |
| Loading settings… | no (`Loading...` three dots exists) |
| Couldn't load the settings catalogue | no |
| The backend does not provide jarvis/config_schema yet — update the JARVIS integration. | no |
| Administrator access is required. | no |
| Retry | no |
| Saving… | no |
| Saved ✓ | no |
| Saved ✓ ({count} items) | no |
| Save failed — {message} | no |
| Saved — appliance monitor reloaded | no |
| Saved — appliance monitor reload failed: {message} | no |
| Stored value is not a boolean: {raw} | no |
| Stored value is not a number: {raw} | no |
| Stored value is not an option: {raw} | no |
| {raw} (not an option) | no |
| Invalid JSON stored | no |
| Invalid JSON: {message} | no |
| Expected a JSON object | no |
| Expected a JSON list | no |
| Clamped to {min}–{max} | no |
| Reset to default | no |
| Default: {value} | no |
| HA entity | no |
| Show keys | no |
| Not yet ported | no |
| Phase 3 | no |
| Save | no |
| Cancel | no (used by `jv-confirm` default) |
| Confirm | no (used by `jv-confirm` default) |
| Enable | no |
| Reconnecting to Home Assistant… | no |
| One item per line | no |
| Keys: {satellites}; values: {speakers} | no |
| ON / OFF | yes — accessible state text of the switch |
| — none — | yes |
| — auto-detect — | yes |
| — no cameras — | yes |
| ✎ Custom… | yes |
| loading… | yes |

### 8.2 Catalogue labels and `LABEL_OVERRIDE`

Field labels render as `t(LABEL_OVERRIDE[key] ?? field.label)`. The catalogue labels (Appendix A) were
written for HA entity names and are almost all absent from the i18n files; the overrides below are the old
card labels that **do** exist in de.json, so translations keep working:

| key | display label | key | display label |
|---|---|---|---|
| `announcements_enabled` | Announcements | `sentinel_enabled` | Sentinel |
| `observer_enabled` | Observer | `cognition_enabled` | Cognition |
| `camera_auto_analyze` | Camera Watch | `package_detection` | Package Watch |
| `visitor_learning` | Visitor Learning | `rich_reasoning` | Rich Reasoning |
| `light_control_enabled` | Light Control | `appliance_power_guessing` | Appliance Power Guessing |
| `notify_service` | Notify Device | `banter_level` | Banter level |
| `search_backend` | Web research backend | `searxng_url` | SearXNG URL |
| `web_research_llm_fallback` | Escalate to LLM web search | `calendar_tight_gap_min` | Calendar tight-gap (min) |
| `departure_alerts_enabled` | Departure alerts | `departure_lead_minutes` | Departure lead (min) |
| `departure_origin_entity` | Origin tracker | `departure_travel_sensor` | Travel sensor |
| `routine_alerts_enabled` | Routine alerts | `memory_threading_enabled` | Memory threading |
| `memory_threading_hours` | Memory window (hrs) | `memory_threading_max` | Memory max turns |
| `continued_conversation_enabled` | Continued conversation | `voice_confirm_enabled` | Voice confirmation |
| `voice_confirm_mode` | Mode | `recognition_source` | Face recognition source |
| `residence_style` | Home type | `home_stories` | Stories |
| `garage_bays` | Garage bays | `dormers_front` | Front dormers |
| `dormers_rear` | Rear dormers | `chimney_side` | Chimney |
| `has_basement` | Basement | `home_bedrooms` | Bedrooms |
| `home_bathrooms` | Bathrooms | `floor_plan_sqft` | Square feet |
| `pattern_learn_doors` | Learn doors & windows | `pattern_learn_presence` | Learn presence & arrivals |
| `pattern_include_entities` | Also learn specific entities | `excluded_entities` | Exclude specific entities |
| `excluded_domains` | Exclude whole domains | `excluded_labels` | Exclude by label |
| `lab_areas` | Lab rooms | `movie_area` | Movie room |
| `movie_media_player` | Movie player | `movie_dim_pct` | Movie dim % |
| `hazard_monitor_enabled` | Monitor | `hazard_quake_radius_km` | Quake radius (km) |
| `hazard_quake_min_mag` | Min magnitude | `briefing_require_home` | Only when someone's home |
| `briefing_morning_time` | Morning | `briefing_evening_time` | Evening |
| `appliance_announce_unknown` | Announce unidentified loads | `energy_agency` | Agency |
| `ui_language` | Language | | |

Help strings in §3.4 that already exist in de.json (keep them byte-identical): "Master switch — all proactive
speech", "AI event awareness (uses API)", "Door/garage/lock-left-open alerts", "Local triage — sees all
telemetry, gates cloud", "Cloud-first judgment for medium+ events", "Inspect doorbell presses (vision +
event-media)", "Detect packages & mail at the door", "Silently learn from person events — never spoken",
"Phone push for high/critical alerts", "Door, window and garage contact sensors", "People and device trackers
(home / away)", "e.g. light, switch — every entity in the domain", "every entity carrying a Home Assistant
label", "for a skipped-domain entity you want as a routine trigger — e.g. a bay occupancy sensor",
"Override (optional)", "Location: using home coordinates.". Card names for the "Not yet ported" lines that
exist: "AI Models", "Announcement Speakers", "Appliances", "Diagnostics", "Document Library", "Doorbell
Training", "Energy Management", "Excluded Entities", "Floor Plan Editor", "Hazard Monitor", "Memory",
"Notifications", "Observer Tuning", "Operational Mode", "Routine Learning", "Satellite → Speaker",
"Sentinel Rules", "System Diagnostics", "Voice Confirmation", "Wellbeing Context".

### 8.3 Enum option labels and confirm texts

Verbatim in §3.4. Present in de.json today: "Auto (try native, fall back)", "Both (Double Take + Frigate)",
"DuckDuckGo (no key, default)", "Dry — occasional wit" (note: the old select said "Dry — occasional wit
(default)"; use the shorter existing key), "advisory", "autonomous", "opt-in". The rest are English-only
until added to all 23 files.

### 8.4 Not-yet-ported lines

`"{name} — {why} — Phase 3"` from §7; English only in Phase 2. Phase 3: replaced by "Elsewhere in the
panel" (`Elsewhere in the panel` heading; each line `{name}` as a link button + `— {why}`). Since Phase 3
every panel key is translated in all 22 language files (`frontend/i18n-missing.json`); the "de.json"
columns above record what existed before the port.

---

## 9. Risks

1. **`jarvis/config_schema` was uncommitted work in progress** when this spec was written. It is now
   registered (`websocket.ws_config_schema`, admin-only, `config_apply.build_schema`,
   `tests/unit/test_config_schema_ws.py`); the view still handles `unknown_command` (§6) for an older
   backend. `frontend/dev/fixtures/config_schema.json` is generated from the live catalogue by
   `frontend/scripts/config-schema-fixture.py` (defaults plus a few `DEMO_VALUES`).
2. **`src/types.ts` disagrees slightly with the wire.** `ConfigField.options` is typed
   `Array<FieldOption | string> | null`; the backend sends `string[]`. Accept both (`typeof o === "string" ? o : o.value`).
3. **Type drift between catalogue and stored data.** `values` are coerced on read, but writes are not
   validated: `home_bathrooms` is `int` though the old UI allowed 0.5 steps; `residence_style` is `str`
   though only ten fixed styles exist (should be `enum`); `banter_level` is an `enum` of `"0"|"1"|"2"` and the
   backend stores whatever is sent (the old panel saved `"1"` strings; readers coerce) — the view sends the
   option string. Flag `home_bathrooms`→`float` and `residence_style`→`enum` to the backend agent.
4. **Unparseable stored values** come through `values` raw (`"soon"` for an int). §3.3 covers display; saving
   a valid value overwrites them.
5. **No server-side validation on write** (§2.3): a wrong JS type is persisted silently. The kind→type
   mapping in §3.1 is the only guard; unit-test it.
6. **Side-effect keys** (§2.3): `review_*` flips `review_enabled`; provider/model keys hot-swap clients (a bad
   URL breaks the assistant until corrected); `observer_enabled` starts/stops a task. The schema re-fetch after
   save is required so the view shows the real post-state.
7. **Confirm texts are view-side** for three keys; the catalogue has no `confirm` attribute. Recommend adding
   `confirm?: string` to `FieldSpec`/`field_schema` later so new dangerous keys prompt automatically.
8. **Translations.** Catalogue labels are mostly untranslated; `LABEL_OVERRIDE` (§8.2) preserves 57
   translated labels and `HELP` reuses existing keys. ~45 new chrome strings are English-only until added to
   the 23 files.
9. **`expose` semantics.** Read as "has a native HA entity", not "render"; all 195 fields render. Rendering
   only `expose=True` (≈40) would drop honorific, IMAP, model keys, excluded entities, etc.
10. **"Other" category.** Appears only for writable keys missing from the catalogue (none today; a test pins
    the sets equal). The view must still render it generically (inferred kinds, `default: null`).
11. **Suggestion heuristics** replicate the old panel's regexes over `hass.states`; on large instances build
    datalists lazily on focus and cap at ~500 entries with the typed prefix as a filter.
12. **`document_watch_folders`** is kind `str` but is a newline/comma list to the backend
    (`documents.scan_watch_folders` splits it); rendered as `str` with the help line — correct but unusual.
13. **Snapshot vs schema staleness.** The shell refreshes `data` every 20 s; suggestion lists may lag a
    just-created notify service or camera by up to 20 s. Acceptable.
14. **Phase 3 response fields inferred from the old panel's reads**, not from backend source:
    `energy.running[].shed_ok`, `biometrics.entities[].value/unit`, `calibration.bins[]`,
    `documents.ingest.semantic`. Re-verify in Phase 3.
15. **Legacy JSON strings** for list/json keys become real arrays/objects after this view saves them. All
    backend readers found go through `_get_runtime_json`/`coerce_for_kind`-style helpers that accept both.

---

## Appendix A — the catalogue on branch `fork/phase0-1` (`config_apply._FIELDS`, generated)

Columns: `options / min..max step` is `options` for `enum`, `min..max step` for `int`/`float`, blank
otherwise. `default` is JSON. The wire adds `category` per section and `options`/`min`/`max`/`step` as
`null` where not applicable.

Total: 195 fields when generated. Per category: core 76, voice 22, learning 26, safety 20, cameras 17, home 27,
governance 7. Since then upstream 9.40.0 added `goals_kernel_authoritative` (bool, default `true`, label
"Kernel plan authoritative for goals", governance) — 196 fields, governance 8. The regenerated
`dev/fixtures/config_schema.json` is the current list; this appendix is not kept in sync by hand.

### category `core` (76)

| key | kind | default | options / min..max step | label | expose |
|---|---|---|---|---|---|
| `ui_language` | enum | `"auto"` | `auto`, `en`, `zh`, `zh-hant`, `cs`, `da`, `de`, `es`, `fr`, `it`, `nl`, `nb`, `pl`, `pt`, `pt-br`, `ro`, `ru`, `sk`, `fi`, `sv`, `tr`, `uk` | Panel language | yes |
| `output_language` | enum | `""` | `""`, `en`, `zh`, `cs`, `da`, `nl`, `fi`, `fr`, `de`, `el`, `he`, `hu`, `id`, `it`, `ja`, `ko`, `nb`, `pl`, `pt`, `ro`, `ru`, `sk`, `es`, `sv`, `th`, `tr`, `uk`, `vi` | Output language | yes |
| `announcements_enabled` | bool | `false` |  | Proactive announcements | yes |
| `announce_notify_only` | bool | `false` |  | Announce to notifications only | yes |
| `notify_service` | str | `""` |  | Notify service |  |
| `honorific` | str | `"sir"` |  | Honorific |  |
| `directive_preset` | enum | `"guardian_steward"` | `guardian_steward`, `protector`, `steward` | Directive preset | yes |
| `directive` | str | `""` |  | Custom directive |  |
| `use_hass_api` | bool | `true` |  | Use Home Assistant LLM API |  |
| `banter_level` | enum | `"1"` | `0`, `1`, `2` | Banter level | yes |
| `observer_quiet_start` | str | `"22:00"` |  | Quiet hours start | yes |
| `observer_quiet_end` | str | `"07:00"` |  | Quiet hours end | yes |
| `broadcast_group` | str | `""` |  | Broadcast group |  |
| `onboarding_dismissed` | bool | `false` |  | Onboarding dismissed |  |
| `host_telemetry` | bool | `true` |  | Host telemetry |  |
| `rich_reasoning` | bool | `false` |  | Rich reasoning |  |
| `home_context_max_entities` | int | `15` | 0..100 step 1 | Home context entities per domain |  |
| `biometrics_enabled` | bool | `false` |  | Biometrics |  |
| `biometric_entities` | json | `{}` |  | Biometric entity overrides |  |
| `quiet_hours_push_critical_only` | bool | `false` |  | Quiet hours: push critical only |  |
| `proactive_questions_interactive` | bool | `true` |  | Interactive proactive questions |  |
| `arrival_greeting_enabled` | bool | `true` |  | Arrival greeting | yes |
| `arrival_min_away_minutes` | int | `10` | 0..1440 step 1 | Arrival minimum away minutes |  |
| `arrival_push_enabled` | bool | `false` |  | Push arrival alerts |  |
| `departure_alerts_enabled` | bool | `true` |  | Departure alerts | yes |
| `departure_require_location` | bool | `true` |  | Departure alerts need a location |  |
| `routine_alerts_enabled` | bool | `true` |  | Routine alerts | yes |
| `departure_lead_minutes` | int | `30` | 0..240 step 1 | Departure lead minutes |  |
| `departure_origin_entity` | str | `""` |  | Departure origin entity |  |
| `departure_osrm_url` | str | `""` |  | OSRM URL |  |
| `departure_travel_sensor` | str | `""` |  | Travel time sensor |  |
| `driving_mode_enabled` | bool | `false` |  | Driving mode | yes |
| `driving_car_sensor` | str | `""` |  | Car head-unit sensor |  |
| `driving_notify_briefings` | bool | `true` |  | Driving: briefings |  |
| `driving_notify_travel` | bool | `true` |  | Driving: travel alerts |  |
| `driving_notify_security` | bool | `true` |  | Driving: security alerts |  |
| `driving_suppress_home_audio` | bool | `true` |  | Driving: mute home audio |  |
| `briefing_morning_enabled` | bool | `false` |  | Morning briefing | yes |
| `briefing_evening_enabled` | bool | `false` |  | Evening briefing | yes |
| `briefing_morning_time` | str | `"07:30"` |  | Morning briefing time | yes |
| `briefing_evening_time` | str | `"19:30"` |  | Evening briefing time | yes |
| `briefing_require_home` | bool | `true` |  | Briefings only when home |  |
| `briefing_include_weather` | bool | `true` |  | Briefing: weather |  |
| `briefing_include_calendar` | bool | `true` |  | Briefing: calendar |  |
| `briefing_include_presence` | bool | `true` |  | Briefing: presence |  |
| `briefing_include_events` | bool | `true` |  | Briefing: overnight events |  |
| `briefing_include_energy` | bool | `true` |  | Briefing: energy |  |
| `briefing_include_hazards` | bool | `true` |  | Briefing: hazards |  |
| `search_backend` | enum | `"duckduckgo"` | `duckduckgo`, `searxng` | Search backend |  |
| `searxng_url` | str | `""` |  | SearXNG URL |  |
| `web_research_llm_fallback` | bool | `false` |  | Web research LLM fallback |  |
| `calendar_tight_gap_min` | int | `15` | 0..120 step 1 | Tight calendar gap (min) |  |
| `imap_enabled` | bool | `false` |  | IMAP inbox |  |
| `imap_host` | str | `""` |  | IMAP host |  |
| `imap_port` | int | `993` | 1..65535 step 1 | IMAP port |  |
| `imap_user` | str | `""` |  | IMAP user |  |
| `imap_folder` | str | `"INBOX"` |  | IMAP folder |  |
| `imap_ssl` | bool | `true` |  | IMAP SSL |  |
| `llm_provider` | str | `"groq"` |  | LLM provider |  |
| `model` | str | `""` |  | LLM model |  |
| `llm_base_url` | str | `""` |  | LLM base URL |  |
| `custom_base_url` | str | `""` |  | Custom base URL |  |
| `ollama_base_url` | str | `""` |  | Ollama base URL |  |
| `classifier_provider` | str | `""` |  | Classifier provider |  |
| `classifier_model` | str | `""` |  | Classifier model |  |
| `reasoning_provider` | str | `""` |  | Reasoning provider |  |
| `reasoning_model` | str | `""` |  | Reasoning model |  |
| `review_enabled` | bool | `false` |  | Second-opinion review |  |
| `review_provider` | str | `""` |  | Review provider |  |
| `review_model` | str | `""` |  | Review model |  |
| `vision_provider` | str | `""` |  | Vision provider |  |
| `vision_model` | str | `""` |  | Vision model |  |
| `camera_reasoning_provider` | str | `""` |  | Camera reasoning provider |  |
| `camera_reasoning_model` | str | `""` |  | Camera reasoning model |  |
| `ollama_num_ctx` | int | `8192` | 512..131072 step 512 | Ollama context window |  |
| `classifier_rate_limit` | int | `30` | 0..600 step 1 | Classifier calls per hour |  |

### category `voice` (22)

| key | kind | default | options / min..max step | label | expose |
|---|---|---|---|---|---|
| `voice_confirm_enabled` | bool | `false` |  | Voice confirmation | yes |
| `voice_confirm_mode` | enum | `"auto"` | `auto`, `native`, `gated` | Voice confirmation mode | yes |
| `voice_confirm_entities` | list | `[]` |  | Voice confirmation entities |  |
| `tts_use_ha_voice` | bool | `false` |  | Use Home Assistant TTS voice | yes |
| `proximity_volume` | bool | `true` |  | Proximity volume | yes |
| `continued_conversation_enabled` | bool | `false` |  | Continued conversation | yes |
| `continued_conversation_speaker_reopen` | bool | `true` |  | Reopen mic after reply speaker |  |
| `continued_conversation_multi_satellite` | bool | `false` |  | Follow-up across satellites |  |
| `satellite_pairings` | json | `{}` |  | Satellite → speaker pairings |  |
| `announcement_speakers` | list | `[]` |  | Announcement speakers |  |
| `satellite_audio_out` | json | `null` |  | Satellite audio out |  |
| `satellite_start_action` | json | `{}` |  | Satellite start actions |  |
| `identity_enabled` | bool | `true` |  | Per-person identity |  |
| `identity_voice_fingerprint` | bool | `false` |  | Voice fingerprint identity |  |
| `voice_recognition_source` | str | `""` |  | Voice recognition source |  |
| `voice_recognition_auto_enroll` | bool | `true` |  | Auto-enroll voices |  |
| `voice_recognition_local` | bool | `false` |  | Local speaker ID |  |
| `voice_recognition_delegate_stt` | str | `""` |  | Delegate STT |  |
| `voice_embedding_model_path` | str | `""` |  | Speaker embedding model path |  |
| `voice_local_trust_threshold` | float | `0.75` | 0..1 step 0.01 | Local voice trust threshold |  |
| `voice_local_guess_threshold` | float | `0.55` | 0..1 step 0.01 | Local voice guess threshold |  |
| `voice_local_min_samples` | int | `2` | 1..50 step 1 | Local voice minimum samples |  |

### category `learning` (26)

| key | kind | default | options / min..max step | label | expose |
|---|---|---|---|---|---|
| `observer_enabled` | bool | `false` |  | Observer | yes |
| `cognition_enabled` | bool | `true` |  | Cognition | yes |
| `cognition_threshold` | float | `0.6` | 0..1 step 0.05 | Cognition threshold |  |
| `observer_group_debounce` | int | `90` | 0..600 step 5 | Observer group debounce (s) |  |
| `adaptive_interruption_budget` | bool | `false` |  | Adaptive interruption budget |  |
| `adaptive_suggestion_threshold` | bool | `false` |  | Adaptive suggestion threshold |  |
| `adaptive_cognition_threshold` | bool | `false` |  | Adaptive cognition threshold |  |
| `pattern_learn_doors` | bool | `false` |  | Learn door patterns |  |
| `pattern_learn_presence` | bool | `false` |  | Learn presence patterns |  |
| `pattern_learn_buttons` | bool | `false` |  | Learn button patterns |  |
| `pattern_learn_motion` | bool | `false` |  | Learn motion patterns |  |
| `pattern_include_entities` | list | `[]` |  | Always-learn entities |  |
| `pattern_min_occurrences` | int | `4` | 1..50 step 1 | Pattern minimum occurrences |  |
| `pattern_confidence` | float | `0.55` | 0..1 step 0.05 | Pattern confidence |  |
| `suggest_garage_confirmation` | bool | `false` |  | Suggest garage confirmation |  |
| `memory_threading_enabled` | bool | `true` |  | Memory threading |  |
| `memory_threading_hours` | int | `48` | 1..720 step 1 | Memory threading hours |  |
| `memory_threading_max` | int | `12` | 1..100 step 1 | Memory threading max |  |
| `semantic_search` | bool | `false` |  | Semantic document search |  |
| `embed_model` | str | `"nomic-embed-text"` |  | Embedding model |  |
| `embed_base_url` | str | `""` |  | Embedding base URL |  |
| `document_watch_folders` | str | `""` |  | Document watch folders |  |
| `excluded_entities` | list | `[]` |  | Excluded entities |  |
| `excluded_domains` | list | `[]` |  | Excluded domains |  |
| `excluded_labels` | list | `[]` |  | Excluded labels |  |
| `presence_only_entities` | list | `[]` |  | Presence-only entities |  |

### category `safety` (20)

| key | kind | default | options / min..max step | label | expose |
|---|---|---|---|---|---|
| `sentinel_enabled` | bool | `true` |  | Sentinel | yes |
| `disabled_sentinel_rules` | list | `[]` |  | Disabled sentinel rules |  |
| `door_window_alerts_enabled` | bool | `true` |  | Door/window alerts | yes |
| `intrusion_response_timeout` | int | `120` | 30..900 step 30 | Intrusion response timeout (s) | yes |
| `intrusion_vision_confirm` | bool | `true` |  | Intrusion vision confirm | yes |
| `intrusion_vision_veto` | bool | `true` |  | Intrusion vision veto | yes |
| `intrusion_inward_depth` | int | `1` | 0..5 step 1 | Intrusion inward depth |  |
| `intrusion_requires_confinement` | bool | `false` |  | Intrusion requires confinement |  |
| `hazard_monitor_enabled` | bool | `false` |  | Hazard monitor | yes |
| `hazard_lat` | float | `null` | -90..90 | Hazard latitude |  |
| `hazard_lon` | float | `null` | -180..180 | Hazard longitude |  |
| `hazard_quakes_on` | bool | `true` |  | Hazards: earthquakes |  |
| `hazard_weather_on` | bool | `true` |  | Hazards: severe weather |  |
| `hazard_disasters_on` | bool | `true` |  | Hazards: disasters |  |
| `hazard_quake_radius_km` | float | `300` | 10..2000 step 10 | Earthquake radius (km) |  |
| `hazard_quake_min_mag` | float | `2.5` | 0..10 step 0.1 | Earthquake minimum magnitude |  |
| `hazard_disaster_radius_km` | float | `300.0` | 10..2000 step 10 | Disaster radius (km) |  |
| `appliance_profile` | json | `[]` |  | Appliance profile |  |
| `appliance_announce_unknown` | bool | `false` |  | Announce unknown appliances |  |
| `appliance_power_guessing` | bool | `false` |  | Appliance power guessing |  |

### category `cameras` (17)

| key | kind | default | options / min..max step | label | expose |
|---|---|---|---|---|---|
| `camera_auto_analyze` | bool | `true` |  | Camera auto-analyze | yes |
| `camera_auto_analyze_motion` | bool | `false` |  | Camera auto-analyze motion | yes |
| `camera_motion_vision` | bool | `false` |  | Motion sensor → camera vision |  |
| `camera_important_only` | bool | `true` |  | Camera important only (legacy) |  |
| `camera_alert_level` | enum | `"urgent"` | `off`, `urgent`, `important`, `all` | Camera alert level | yes |
| `package_detection` | bool | `true` |  | Package detection | yes |
| `visitor_learning` | bool | `true` |  | Visitor learning |  |
| `disabled_cameras` | list | `[]` |  | Disabled cameras |  |
| `vision_thinking_enabled` | bool | `false` |  | Vision thinking |  |
| `vision_thinking_max_tokens` | int | `1024` | 64..8192 step 64 | Vision thinking max tokens |  |
| `vision_min_interval` | int | `0` | 0..3600 step 5 | Vision minimum interval (s) |  |
| `recognition_source` | enum | `"both"` | `both`, `frigate`, `doubletake` | Recognition source |  |
| `llm_face_recognition` | bool | `false` |  | LLM face recognition |  |
| `identity_min_confidence` | float | `0.45` | 0..1 step 0.05 | Identity minimum confidence |  |
| `outdoor_areas` | list | `[]` |  | Outdoor areas |  |
| `outdoor_entities` | list | `[]` |  | Outdoor entities |  |
| `indoor_entities` | list | `[]` |  | Indoor entities |  |

### category `home` (27)

| key | kind | default | options / min..max step | label | expose |
|---|---|---|---|---|---|
| `light_control_enabled` | bool | `true` |  | Dashboard light control | yes |
| `bedroom_areas` | list | `[]` |  | Bedroom areas |  |
| `floor_plan_rooms` | json | `{}` |  | Floor plan rooms |  |
| `floor_plan_entities` | json | `{}` |  | Floor plan entities |  |
| `floor_plan_bg_opacity` | float | `null` | 0..1 step 0.05 | Floor plan background opacity |  |
| `floor_plan_bg` | json | `{}` |  | Floor plan background |  |
| `residence_style` | str | `"cape_cod"` |  | Residence style |  |
| `floor_plan_sqft` | int | `null` | 0..100000 step 1 | Square footage |  |
| `floor_plan_units` | enum | `"imperial"` | `imperial`, `metric` | Floor plan units |  |
| `floor_plan_elements` | json | `{}` |  | Floor plan elements |  |
| `floor_plan_cameras` | json | `{}` |  | Floor plan cameras |  |
| `floor_plan_property` | json | `{}` |  | Property boundary |  |
| `home_stories` | enum | `"1.5"` | `1`, `1.5`, `2`, `3` | Stories |  |
| `has_basement` | bool | `true` |  | Has basement |  |
| `dormers_front` | int | `2` | 0..3 step 1 | Front dormers |  |
| `dormers_rear` | int | `1` | 0..2 step 1 | Rear dormers |  |
| `garage_bays` | int | `3` | 0..4 step 1 | Garage bays |  |
| `chimney_side` | enum | `"right"` | `right`, `left`, `center`, `none` | Chimney side |  |
| `chimney_count` | int | `1` | 1..4 step 1 | Chimney count |  |
| `basement_entrance` | enum | `"bulkhead"` | `bulkhead`, `interior` | Basement entrance |  |
| `home_bedrooms` | int | `null` | 0..20 step 1 | Bedrooms |  |
| `home_bathrooms` | int | `null` | 0..20 step 1 | Bathrooms |  |
| `door_mapping` | json | `{}` |  | Door mapping |  |
| `lab_areas` | list | `[]` |  | Lab mode areas |  |
| `movie_area` | str | `""` |  | Movie mode area |  |
| `movie_media_player` | str | `""` |  | Movie media player |  |
| `movie_dim_pct` | int | `15` | 0..100 step 1 | Movie dim level (%) |  |

### category `governance` (7 + `goals_kernel_authoritative`)

| key | kind | default | options / min..max step | label | expose |
|---|---|---|---|---|---|
| `autonomy_enforce` | bool | `false` |  | Graduated autonomy (enforce) |  |
| `friday_automator` | bool | `false` |  | FRIDAY automator |  |
| `operational_mode_auto` | bool | `true` |  | Automatic operational mode | yes |
| `custom_modes` | json | `{}` |  | Custom modes |  |
| `energy_agency` | enum | `"advisory"` | `advisory`, `opt_in`, `autonomous` | Energy agency | yes |
| `energy_peak_watts` | float | `8000.0` | 0..100000 step 100 | Energy peak watts |  |
| `energy_mode_bump` | list | `[]` |  | Energy mode bump |  |

