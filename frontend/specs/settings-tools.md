# Settings tools — specification (Phase 3, bespoke editors and tool cards for the Settings view)

Derived from the old panel (`git show 47bede5:custom_components/jarvis/frontend/jarvis-panel.js`:
`_modelRoles` ~2323, `_renderModelRoles` 2388, `_loadModelsFor` 2640, `_renderEnforcement` 2504,
`_renderAppliances` 2620, `_renderSentinelRules` 2968, `_renderSatellitePairings` 2987,
`_renderAnnouncementSpeakers` 3009, `_renderExcludedEntities` 4051, `_renderModeBindings` 4162,
`_renderRoutineLearning` 4180, the settings HTML 5170–5670, wiring 6285–6990, `_renderEnergy` 8023,
`_renderMutes` 8326, `_wireBriefings` 9150, `_wireHazard` 9177, `_renderHazardScan` 9214) and from the
backend on this branch (`custom_components/jarvis/websocket.py`, `enforcement.py`, `energy.py`,
`hazard_monitor.py`, `output_gate.py`, `voice_confirm.py`, `appliance_monitor.py`, `biometrics.py`,
`audio_routing.py`, `entity_filter.py`, `briefing.py`, `services.yaml`, `const.py`). The builder does
**not** need to open the old panel; everything it needs is here. `settings.md` (the generic view) remains
authoritative for everything not restated here: the catalogue (`jarvis/config_schema`), the write path
(`jarvis/update_config`), the row anatomy, the save pipeline, routing and the category names.

Scope: the tools that `settings.md` §7 deferred and that are not covered by another Phase 3 spec. **In**:
AI model pickers per role, entity / area / domain / label pickers for the list and single-value keys,
Sentinel per-rule toggles, Announcement Speakers toggles, Satellite → Speaker pairings, the Appliances
row editor, Muted Announcements, Energy status + agency, Hazard status + scan, "Brief me now", the voice
confirmation test, the Diagnostics service buttons, Governance enforcement switches, and the
`biometric_entities` map editor. **Out** (§7): floor-plan editor, cameras (rename / location / enable,
doorbell training, camera diagnostics), document library + semantic search, faces / voices,
Wellbeing-Context enable/disable, Observer / Memory read-only stats, onboarding.

Files: `frontend/src/views/settings.ts`, `frontend/src/views/settings/**` — `field.ts`,
`presentation.ts`, `coerce.ts`, `registry.ts` (the plug-in registry + `SettingsHost`, §3), `README.md`
(the plug-in contract), and **every editor and tool card under `frontend/src/views/settings/tools/`**
(one barrel `tools/index.ts`, imported once from `settings.ts`): `models.ts`, `lists.ts` (+
`lists-controls.ts`), `pairings.ts`, `appliances.ts`, `voice-confirm-list.ts`, `biometrics-map.ts`,
`runtime.ts` (registers the runtime cards) with `runtime-base.ts`, `runtime-briefing.ts`,
`runtime-diagnostics.ts`, `runtime-voice-confirm.ts`, `runtime-energy.ts`, `runtime-hazard.ts`,
`runtime-mutes.ts`, `runtime-wellbeing.ts`, and `governance.ts`. The shared picker is
`src/components/jv-picker.ts`; the focus helper for row removals is `src/focus.ts`. Fixtures:
`frontend/dev/fixtures/jarvis_list_models.json`, `jarvis_energy.json`, `jarvis_hazard.json`,
`jarvis_mutes.json`, `jarvis_voice_confirm_test.json`, `config_area_registry_list.json`,
`config_label_registry_list.json`, `config_device_registry_list.json` (§9 R12).

---

## 1. Purpose

Give the generic "settings as data" view the hand-built controls an admin actually needs for the dozen
keys whose value is a *selection from live data* (entities, areas, labels, domains, providers' model
lists, Cast speakers, satellites, Sentinel rules) or a *structured record* (appliance profile, satellite
pairings, biometric map), and the handful of *runtime tools* that lived on the old Settings tab beside
those keys (live model lists, energy picture, hazard scan, mute list, brief-me-now, voice-confirm test,
service test buttons, governance kill-switches). With these in place `presentation.ts` `NOT_PORTED` is gone;
what moved to another view is listed per category in `ELSEWHERE` ("Elsewhere in the panel", §3.3).

Two extension points are added to the existing view, both keyed by data so the view itself still knows
no setting by hand:

* a **field editor** — a custom element that replaces the kind-based control inside the existing
  `<jarvis-config-field>` row for one key (and may *consume* sibling keys it edits together with it);
* a **tool card** — a self-contained custom element rendered as its own `<jv-section>` at the top of one
  category, above its field list.

Both receive `hass`, `data` (snapshot), `narrow`, and a `host` object through which all config writes go,
so the per-row saving / saved / failed feedback, the confirm-before-enable rule, the appliance reload hook
and the schema re-fetch in `settings.ts` stay the single write pipeline.

---

## 2. Data

Every command below is reachable only by an admin (the panel is `require_admin=True`; the mixed
read/write commands additionally gate their mutating branch with `_deny_non_admin`, which answers
`send_error(id, "unauthorized", "administrator privileges are required for this action")`). `ws()`
rejects with `WsError {code, message}`; generic codes any call may produce: `unauthorized`,
`unknown_command` (older backend), `timeout`, `no_connection` (local, `hass` missing).

`tests/unit/test_ws_contract.py` pins that every `"jarvis/…"` string literal in `frontend/src/**/*.ts`
is a registered command, so command types must be **literal strings** in the source (no
`` `jarvis/${x}` `` templates).

### 2.1 Setting keys this spec edits (kind and JSON shape; all in the catalogue, all written through `jarvis/update_config`)

| key | kind | default | JSON shape on the wire (what the view sends) | read by |
|---|---|---|---|---|
| `llm_provider` | str | `"groq"` | one of `"groq" \| "openai" \| "gemini" \| "ollama" \| "anthropic" \| "custom"` | `llm_provider.create_provider` (hot-swapped on save) |
| `model` | str | `""` | model id string exactly as the provider lists it (e.g. `"llama-3.3-70b-versatile"`, `"gemini-2.0-flash"`, `"qwen2.5:7b"`) | same |
| `classifier_provider` / `classifier_model`, `reasoning_provider` / `reasoning_model`, `review_provider` / `review_model`, `vision_provider` / `vision_model`, `camera_reasoning_provider` / `camera_reasoning_model` | str | `""` | as above; `""` = unset (role falls back to the main agent's provider/model) | same; a non-blank `review_provider` or `review_model` save also sets `review_enabled = true` server-side |
| `llm_base_url` | str | `""` | URL string; the legacy *shared* endpoint. Cleared to `""` when `llm_provider` is set to `groq/openai/gemini/anthropic` (old rule, kept) | `const.resolve_provider_base_url` fallback |
| `custom_base_url`, `ollama_base_url` | str | `""` | URL string | `PROVIDER_BASE_URL_FIELDS` (`custom` → `custom_base_url`, `ollama` → `ollama_base_url`) |
| `excluded_entities` | list | `[]` | `string[]` of entity ids | `entity_filter` |
| `excluded_domains` | list | `[]` | `string[]` of domains (`"light"`) | `entity_filter` |
| `excluded_labels` | list | `[]` | `string[]`; the backend matches **either** `label_id` or label *name* (`entity_filter.is_excluded`). Store the `label_id` (stable across renames); show the name; accept legacy names already stored | `entity_filter` |
| `pattern_include_entities` | list | `[]` | `string[]` entity ids (old picker offered only `binary_sensor.*`, `device_tracker.*`, `person.*`, `sensor.*`) | `pattern_analyzer` |
| `presence_only_entities`, `outdoor_entities`, `indoor_entities` | list | `[]` | `string[]` entity ids (same editor, no special filter) | presence / `outdoor` |
| `voice_confirm_entities` | list | `[]` | `string[]`; an id **prefixed `!`** (`"!lock.shed"`) is an explicit *exemption*, a bare id an explicit inclusion (`voice_confirm.requires_confirmation`) | `voice_confirm` |
| `lab_areas` | list | `[]` | `string[]` of **area ids** (`data.areas[].id`) | `modes` |
| `bedroom_areas`, `outdoor_areas` | list | `[]` | `string[]` of area ids (same editor) | presence / `outdoor` |
| `movie_area` | str | `""` | one area id or `""` | `modes` |
| `movie_media_player` | str | `""` | one `media_player.*` id or `""` | `modes` |
| `disabled_sentinel_rules` | list | `[]` | `string[]` of rule ids from `data.config.sentinel_rules[].id` (`door_left_open`, `window_left_open`, `garage_left_open`, `lock_unlocked`, …). A rule is ON when its id is **absent** | `sentinel` |
| `announcement_speakers` | list | `[]` | `string[]` of `media_player.*` ids from `data.config.cast_devices[].entity_id` | `audio_routing.resolve_announce_targets` (priority: `announcement_speakers` > `broadcast_group` > all speakers) |
| `satellite_pairings` | json | `{}` | `{ [assist_satellite_entity_id: string]: media_player_entity_id: string }`; an unpaired satellite is simply absent (delete the key, never store `""`) | `audio_routing` (step 0 of speaker resolution) |
| `appliance_profile` | json | `[]` | `Array<{ name: string; type: "washer"\|"dryer"\|"dishwasher"\|"oven"\|"microwave"\|"appliance"; entity: string; watts: number }>`; `name` required (rows without one are dropped by `_normalize_profile`), `type` lower-cased with fallback `"appliance"`, `entity` `""` when none, `watts` a number (`0` when none) | `appliance_monitor._normalize_profile`; `energy._running_appliances` |
| `appliance_announce_unknown` | bool | `false` | boolean (generic row; stays in the appliance reload set) | `appliance_monitor` |
| `biometric_entities` | json | `{}` | `{ [kind: string]: entity_id: string }` with `kind` ∈ `heart_rate, resting_hr, sleep_stage, sleep_state, spo2, steps, respiratory, stress, temperature` (`biometrics._KINDS`); an explicit mapping wins over keyword discovery | `biometrics.classify` |
| `energy_agency` | enum | `"advisory"` | `"advisory" \| "opt_in" \| "autonomous"` — the Energy tool writes it through **`jarvis/update_config`**, *not* `jarvis/energy set_agency` (see §9 R3) | `energy._configured_agency` |

Value read for every key: `host.value(key)` = `schema.values[key] ?? field.default` (settings.md §3.2),
normalised with `coerce.normalise()`; never the snapshot's `config` block (stale and incomplete).

### 2.2 `jarvis/update_config` (unchanged, settings.md §2.3)

Request `{type: "jarvis/update_config", key: str, value: bool|str|int|float|list|dict|None}`; success
`{key, value}` (echo); errors `invalid_key`, `no_entry`, `no_data`, `update_failed`. No server-side
coercion: send real arrays / objects / strings per the table above. All writes from editors and tool
cards go through `host.save()` (§3.1), never `ws("jarvis/update_config")` directly.

### 2.3 `jarvis/list_models` — live model list for one provider (AI Models editor)

`websocket.ws_list_models` (admin-only; GHSA-fx76-fcmp-phmq).

Request (voluptuous, exact):

```python
{
    vol.Required("type"): "jarvis/list_models",
    vol.Required("provider"): str,        # lower-cased server-side
    vol.Optional("base_url"): str,        # override; when omitted the server resolves
                                          # PROVIDER_BASE_URL_FIELDS[provider] (custom_base_url /
                                          # ollama_base_url) falling back to llm_base_url
}
```

Response — **always `send_result`, never an error frame**, even on failure:

```ts
{ provider: string; models: string[] }                       // sorted, de-duplicated
{ provider: string; models: []; error: "could not retrieve models — check the provider URL and API key; see the Home Assistant logs for details" }
```

Providers and how they are listed: `groq` `https://api.groq.com/openai/v1/models`, `openai`
`https://api.openai.com/v1/models`, `anthropic` `https://api.anthropic.com/v1/models` (all need a key
from secrets), `gemini` via the google-genai SDK (only models supporting `generateContent`), `ollama`
`<base>/api/tags` (no key; blank base falls back to `http://homeassistant.local:11434/v1`), `custom`
`<base>/models` (blank base → the generic error). Any other provider → the generic error. Timeout 12 s
server-side; treat a call taking > 15 s as failed locally. The view **does not send `base_url`**; the
server-resolved endpoint is the one the provider client uses, so the list matches what will be called.

### 2.4 `jarvis/get_panel_data` — snapshot lists used by the editors (arrives as `data`)

Only these fields are read (all optional; missing → empty picker with the matching empty message):

```ts
data.areas: { id: string; name: string; … }[]                           // area pickers
data.config.configured_providers: string[]                              // providers with a usable key / endpoint (ollama and
                                                                        // custom count as configured when their URL is set or defaulted)
data.config.available_labels: { id: string; name: string }[]            // label picker (id = HA label_id)
data.config.cast_devices: { entity_id: string; name: string }[]         // announcement speakers, pairing targets
data.config.satellites: { entity_id: string; name: string; area: string }[]   // pairing rows (`area` = area NAME or "", may be missing on old fixtures)
data.config.sentinel_rules: { id: string; desc: string }[]              // `desc` = first 60 chars of the rule message
data.config.cameras: { entity_id: string; name: string; raw_name: string; enabled: boolean; outdoor: boolean; location_mode: string }[]   // Diagnostics "analyze now" select (enabled only)
data.config.appliances: { running: boolean; profile: { name: string; type: string; entity: string; watts: number; learned_w: number; observed_n: number; mode: "entity"|"disaggregation"|"declared" }[]; tracked_sensors: string[]; native: string[]; whole_home: boolean }   // learned-watts hint in the appliance editor
data.config.broadcast_group: string                                     // brief-me-now guard
data.config.announcement_speakers: string[]                             // brief-me-now guard (also schema.values)
```

Entity names for any entity id: `hass.states[id]?.attributes.friendly_name ?? id` (never throw for a
stale id).

### 2.5 `jarvis/get_enforcement` / `jarvis/set_enforcement` — governance switches

Identical to `logs.md` §6–7. The Settings › Governance tool card (§4.12) is the **only** writer; the Logs
view's `jv-logs-governance` reads `get_enforcement` for a read-only summary and links here.

```python
{ vol.Required("type"): "jarvis/get_enforcement" }                                   # no other keys
{ vol.Required("type"): "jarvis/set_enforcement", vol.Required("key"): str, vol.Required("enabled"): bool }
```

```ts
// get -> { switches: Switch[] }       set -> { switch: Switch }   (the refreshed entry)
Switch = {
  key: string;                       // "continuity_resume" | "agency_orchestration" | "knowledge_graph" | "authority" | "agency_budget" | "loop_detect" | …
  name: string;                      // "Capability authority"
  explanation: string;               // one paragraph
  category: "capability" | "safety";
  phase: string;                     // "G4", "I-B.4", "O", "T" … (may be "")
  default: boolean;                  // shipped value
  enabled: boolean;                  // live value
  overridden: boolean;               // an owner override is stored (jarvis_config enforce_override__<key>)
}
```

Errors: get → `enforcement_failed`; set → `invalid_key` (`"Unknown enforcement switch '<key>'"`),
`enforcement_set_failed`. `set_switch` persists the override and flips the live module attribute at
once; there is no "reset to default" command (an override, once stored, stays; the UI shows
"overridden").

### 2.6 `jarvis/energy` — energy picture (status only from the panel)

```python
{
    vol.Required("type"): "jarvis/energy",
    vol.Required("action"): vol.In(["status", "set_agency"]),
    vol.Optional("agency"): str,
}
```

Response (`energy.power_status`, "never raises"):

```ts
{
  watts: number | null;              // rounded whole-home draw; null = no meter found
  kw: number | null;                 // watts / 1000, 2 decimals
  meter: string;                     // source entity id, "" when none
  peak_watts: number;                // energy_peak_watts (default 8000)
  over_peak: boolean;
  agency: "advisory" | "opt_in" | "autonomous";            // EFFECTIVE (configured + mode bump)
  configured_agency: "advisory" | "opt_in" | "autonomous"; // what the user set
  running: { name: string; entity: string; watts: number; shed_ok: boolean }[];  // declared appliances drawing > 50 W, highest first
  advice: string[];                  // English sentences from the backend (not translated)
}
```

Errors: `bad_agency` (`"unknown agency '<x>'"`), `energy_failed`; `set_agency` is admin-gated
(`unauthorized`). The panel calls **`status` only**: the agency chips save through
`host.save("energy_agency", …)` (the catalogue row's single pipeline) and then re-read `status`. (`set_agency`
now also writes through `config_apply.async_apply_many`, so it no longer desynchronises the catalogue —
§9 R3 — but the panel keeps one write path.)

### 2.7 `jarvis/hazard` — hazard monitor status and on-demand scan

```python
{ vol.Required("type"): "jarvis/hazard", vol.Required("action"): vol.In(["status", "scan"]) }
```

```ts
// status (open to household; no side effects)
{
  enabled: boolean;
  center: [number, number] | null;   // [lat, lon] rounded to 3 decimals; null = HA has no home coordinates and no override
  using_override: boolean;           // hazard_lat AND hazard_lon are set
  quake_radius_km: number; quake_min_mag: number; disaster_radius_km: number;
  feeds: { earthquakes: boolean; weather: boolean; disasters: boolean };
}
// scan (admin-only; read-only against USGS / NWS / NASA EONET, never alerts, never consumes dedup)
{ ok: true; center: [number, number];
  earthquakes: { mag: number; place: string; dist_km: number; … }[];
  weather:     { severity: string; event: string; area?: string; … }[];
  disasters:   { category: string; title: string; dist_km: number; … }[];
  counts: { earthquakes: number; weather: number; disasters: number } }
| { ok: false; error: "no home location configured" }
```

Error frame: `hazard_failed`. A scan can take several seconds (three external feeds).

### 2.8 `jarvis/mutes` — the announcement mute list

```python
{
    vol.Required("type"): "jarvis/mutes",
    vol.Optional("action"): vol.In(["list", "mute", "unmute", "clear"]),   # default "list"
    vol.Optional("entity_id"): str,
    vol.Optional("category"): str,
}
```

Every action answers the **same shape** (`output_gate.current_mutes()` after the change):

```ts
{ entities: string[]; categories: string[]; all: boolean }   // both lists sorted; all = blanket shush active
```

Semantics: `mute` / `unmute` need `entity_id` **or** `category` (with neither the action is a no-op and
the current list is returned); `clear` removes every mute including the blanket one. Known categories
(from `services.yaml` `shush`): `appliances, doors_windows, presence, energy, security, climate, lights,
schedule`. Error frame: `mutes_failed`; the mutating branches are admin-gated (`unauthorized`).

### 2.9 `jarvis/voice_confirm_test` — fire a test announce at a satellite

```python
{ vol.Required("type"): "jarvis/voice_confirm_test" }
```

```ts
{ ok: true;  satellite: string; note: "Announce fired. If you heard it on the Nest, native mode works — otherwise use gated mode." }
| { ok: false; note: "no assist_satellite found" }
| { ok: false; error: string; note: "assist_satellite.announce failed — use gated mode." }
```

Error frame: `test_failed`. The call blocks until `assist_satellite.announce` returns (a few seconds).

### 2.10 `jarvis/reload_appliances` — after saving the profile (already wired in `settings.ts`)

`{type: "jarvis/reload_appliances"}` → `{ok: true, appliances: <data.config.appliances shape above>}`;
error `reload_failed`. `settings.ts` already calls it after a successful save of `appliance_profile` or
`appliance_announce_unknown` (`APPLIANCE_RELOAD_KEYS`); the editor relies on that and must not call it
itself. The `appliances.profile[].learned_w` in the response is the freshest learned-watts source; the
editor may read it from `host`'s last reload result if exposed, otherwise from `data.config.appliances`.

### 2.11 Service calls (`hass.callService(domain, service, data)`)

| service | data | tool | server behaviour |
|---|---|---|---|
| `jarvis.briefing` | `{ announce: true }` | Brief me now | compiles and speaks; with no speakers it **logs a warning and returns** `{success: true, announced: false}` silently — hence the client-side guard |
| `jarvis.briefing` | `{}` | Diagnostics "Briefing — manual trigger" | same (announce defaults true) |
| `jarvis.test_tts` | `{}` | Diagnostics | plays a voice test on the broadcast group |
| `jarvis.observer_status` | `{}` | Diagnostics | fires `jarvis_observer_status` |
| `jarvis.diagnose_doorbell` | `{}` | Diagnostics | doorbell pipeline diagnostics → event |
| `jarvis.test_notify` | `{}` | Diagnostics | test push to `notify_service` |
| `jarvis.test_routing` | `{}` | Diagnostics | dumps routing state to the HA log |
| `jarvis.analyze_camera` | `{ entity_id: "camera.x", announce: true }` | Diagnostics "Camera — analyze now" | vision + reasoning, spoken |

`callService` resolves when HA has executed the call (a thrown HA error has `{code, message}`; show
`message`). In the harness `callService` is logged and resolves immediately.

---

## 3. The plug-in API

### 3.1 `SettingsHost` — what the view hands to every editor and tool card

Declared in `src/views/settings/registry.ts` (the view implements it with its own `_change` / `_save` /
`_scheduleRefetch` / `refresh()` / `_toast`):

```ts
export interface SaveResult { ok: boolean; error?: WsError }   // no error = the user cancelled a confirm dialog

export interface SettingsHost {
  /** Effective value (schema.values[key] ?? field.default); undefined when the key is not in the catalogue. */
  value(key: string): unknown;
  field(key: string): ConfigField | undefined;
  /**
   * Write one key through the view's pipeline (coerced to the key's kind): confirm-before-enable,
   * ui_language ordering, appliance reload, per-row status, queueing of a second write to the same key
   * (only the latest value is sent; both callers get the final result), debounced schema re-fetch and
   * shell refresh. Resolves {ok:false, error} instead of throwing; {ok:false} without error when the user
   * cancelled a confirm dialog.
   */
  save(key: string, value: unknown): Promise<SaveResult>;
  /** Save several keys in order (stops at the first failure). */
  saveMany(entries: Array<[string, unknown]>): Promise<SaveResult>;
  /** Re-fetch jarvis/config_schema soon (debounced, silent). */
  refetch(): void;
  /** Ask the shell to refresh the snapshot now (JarvisView.refresh()). */
  refreshSnapshot(): void;
  /** Toast through HA (hass-notification). */
  toast(message: string): void;
}
```

The `field-change` / `field-reset` events the generic row emits keep working unchanged (they call the
same methods). Editors and tool cards never call `ws("jarvis/update_config")` themselves.

### 3.2 Field editors

A **registry**, not a static map: a plug-in module calls `registerFieldEditor()` at module scope
(`src/views/settings/registry.ts`) and is imported once through `tools/index.ts`:

```ts
registerFieldEditor(
  match: string | ((field: ConfigField) => boolean),   // exact key, or a predicate
  factory: (field, value, onChange, ctx) => TemplateResult | typeof nothing,
  opts?: { consumes?: string[]; noReset?: boolean },
): () => void                                          // unregister
```

* `field` — the owner key's catalogue entry; `value` — already the kind's JS type (`list → string[]`,
  `json → parsed value`, `bool → boolean`, `int/float → number | null`, `str/enum → string`; the row applies
  `coerce.normalise()`). While a save is in flight the row passes the value last emitted (optimistic); it
  reverts to the stored value when the save fails.
* `onChange(next)` — save the **owner** key (same JS type); the row coerces it, emits `field-change` and the
  view's pipeline does the rest, the status appearing in the row's status slot. An editor must not dispatch
  `field-change` itself nor also call `ctx.host.save(field.key, …)` (double save).
* `ctx` — `{hass, data, narrow, disabled, label, id, placeholder, host}`: `disabled` while `hass` is
  missing; `id` goes on the primary control (the row's `<label for>` points at it); `label` for
  `aria-label`; `host` (the `SettingsHost`) for any other key. Editors read `hass` / `data` from `ctx` on
  every render and never cache `hass`; anything with state renders its own custom element from the
  factory.
* `consumes` — sibling keys the editor edits too: their generic rows are not rendered (`consumedKeys()`),
  a search hit on a consumed key shows the owner's row once, the deep link `/settings/<cat>/<consumedKey>`
  scrolls to and flashes the owner, and the owner row shows the help text of every consumed key (joined
  by a line break) and the save status of the owner **and** each consumed key (most severe level wins,
  messages joined with " · "). Consumed keys are saved with `ctx.host.save(consumedKey, value)`.
* `noReset: true` hides the row's "Default: … / Reset to default" (the AI Models editor).
* Resolution (`findFieldEditor`): an exact-key registration beats a predicate; among several of the same
  kind the **last registered wins**.

Row integration (`field.ts`): `<jarvis-config-field>` consults the registry in `render()` before its kind
switch; when an editor matches, the control is `<div class="control wide">${factory(…)}</div>` and the
`bool` switch-in-the-header layout is off. Label, `key` code, "HA entity" badge, help / hint, default +
reset and the status slot stay with the row.

One editor is **built in** (`registry.ts`): every `kind: "list"` key named `*_entities`, `*_domains`,
`*_labels` or `*_areas` renders a multi-select `<jv-picker>` of the matching kind (entity / domain / label /
area; domains and labels accept custom values; `pattern_include_entities` is limited to `binary_sensor`,
`device_tracker`, `person`, `sensor`). Spec editors that need more register the exact key and win
(`voice_confirm_entities`, `lab_areas`, …).

### 3.3 Tool cards

Also a registry (`registry.ts`):

```ts
registerToolCard(category: string, card: {
  id: string;          // deep-link id: /jarvis/settings/<category>/tool:<id> (also data-tool-id)
  title: string;       // English heading (t() key), matched by the search box
  element: string;     // custom element tag
  icon?: string;       // informational
  keywords?: string[]; // extra English words matched by search (not translated)
}): () => void          // registering the same id again replaces the card
```

Registered today (in registration order per category): `core` — `briefing`, `diagnostics`; `voice` —
`voice-confirm-test`; `safety` — `energy`, `hazard`, `mutes`; `home` — `wellbeing` (§4.19); `governance` —
`governance`. `learning` and `cameras` have none. The smoke test asserts exactly this set per category.

Element contract (`ToolCardElement`): properties `hass`, `data`, `narrow`, `host`, `active` (true while its
category is the visible one — tools fetch on first `active`, not on view connect, so opening General does
not scan hazards). Most cards extend `JarvisToolCard` (`tools/runtime-base.ts`: `ws()`, `value()`,
`navigate()`, `toast()`, `offline`, `renderError()` with Retry, `renderLink()`, `renderIconButton()`). Each
tool renders **its own `<jv-section heading icon subheading>`** (so it can put a badge or a button in
`slot="actions"`) and owns its loading / empty / error states (DESIGN.md §6). It writes config only through
`host.save`; it calls its own runtime commands with `ws(this.hass, …)`.

View integration (`settings.ts`): for the active category the page is **tool cards first** (in registration
order, `<tag data-tool-id .hass .data .narrow .host .active ?flash>`), then the category's field
`<jv-section>`, then — where `presentation.ts` `ELSEWHERE` lists any — an **"Elsewhere in the panel"**
card linking the old Settings cards that moved to a view (General: Operational Mode → Overview, System
Diagnostics → Logs, Wellbeing Context → People; Learning: Document Library → Documents, Observer Tuning →
Logs; Cameras: Cameras / Doorbell Training → Cameras, Face recognition → People; Home: Floor Plan Editor →
`/jarvis/residence/editor`). In search mode a card shows under its category when its (translated) title,
id or a keyword matches (its contents are not searched); the category's count is fields + matching cards.
Deep link `/settings/<cat>/tool:<id>` scrolls to `[data-tool-id="<id>"]` and toggles its `flash` attribute
for ~1.6 s (each tool styles `:host([flash])` with `--jv-accent-soft`).

### 3.4 HA picker elements and `<jv-picker>`

HA's frontend registers its pickers in the main window (the panel is not an iframe) but **lazily**; none is
guaranteed to be defined when the panel renders, and none can be imported by the panel. Every picker in
this spec is the shared `<jv-picker>` (`src/components/jv-picker.ts`), which does the detection itself:

```html
<jv-picker kind="entity|area|domain|label|device" multiple allow-custom
           .hass .data .value=${ids} .label .domains=${["media_player"]} .items=${[{value, label}]}
           .placeholder ?disabled @value-changed=${(e) => { e.stopPropagation(); use(e.detail.value); }}>
```

* `value-changed` → `detail.value` is `string[]` (multiple) or `string | undefined` (single; `undefined` =
  cleared) — the shape HA's pickers emit, in both branches.
* HA branch when defined: `ha-selector` (entity / area / label / device / select-with-custom-values),
  else `ha-entity-picker` / `ha-entities-picker` / `ha-area-picker` / `ha-areas-picker`. The branch is
  re-evaluated only while the picker is not focused, so a lazily arriving HA element never steals the caret.
* Fallback (what the harness and the smoke test exercise): chips for the selected values (label, id in code
  font, "exempt" / "not found" tags, a 44 px × button labelled `Remove {name}`) plus a `role="combobox"`
  input with a `role="listbox"` list (type to filter, ↑/↓, Enter picks or adds a custom value, Escape
  closes, Backspace on an empty input removes the last chip; 50 rows shown, "{count} more — type to
  filter"); an "Add" button for typed custom values.
* Sources: entities and domains from `hass.states`; areas from `hass.areas`, then `data.areas`, then
  `config/area_registry/list`; labels from `data.config.available_labels`, then `config/label_registry/list`;
  devices from `hass.devices`, then `config/device_registry/list` (fetched on first focus, shared for 60 s).
  `.items` replaces the source for any kind (models, Cast devices, satellites, rules).

Selects (`ha-select` → native `<select>`) and text fields come from `tools/lists-controls.ts`
(`renderSelect`, `renderText`), with `watchDefinitions(this, CONTROL_TAGS)`.

---

## 4. Layout and behaviour per tool

Layout rules are DESIGN.md's. Each sub-section states the element, where it renders, what it shows, and
the exact writes. "Row status" means the generic row's status slot driven by `host.save`.

### 4.1 AI Models — field editor `<jarvis-editor-model-role>` (category General)

Registered on each `*_provider` key, consuming the matching `*_model` key:

| owner key | consumes | role label (old, translated keys exist) |
|---|---|---|
| `llm_provider` | `model` | Main Agent |
| `classifier_provider` | `classifier_model` | Classifier |
| `reasoning_provider` | `reasoning_model` | Reasoning |
| `review_provider` | `review_model` | Review |
| `vision_provider` | `vision_model` | Vision |
| `camera_reasoning_provider` | `camera_reasoning_model` | Camera Rsn |

Registered with `{consumes: [modelKey], noReset: true}` (`tools/models.ts`, `MODEL_ROLES`). `llm_base_url`, `custom_base_url`, `ollama_base_url`,
`review_enabled`, `ollama_num_ctx`, `home_context_max_entities` stay generic rows in General (they
already sit beside the model keys in catalogue order); `vision_thinking_enabled`,
`vision_thinking_max_tokens` and `vision_min_interval` stay generic rows in Cameras, where the catalogue
puts them (the old panel showed them under the Vision role; a `t("Vision throttle and thinking: see
Cameras")` link under the Vision row → `navigate("settings", "cameras/vision_thinking_enabled")`).

Rendering (one row, two controls side by side on desktop, stacked on narrow):

1. **Provider** select (`ha-select` → `<select>`): options `groq, openai, gemini, ollama, anthropic,
   custom` in that order; label `p` or `t("{provider} — needs setup", {provider})` when `p ∉
   data.config.configured_providers` (when the list is missing or empty treat every provider as
   configured, as the old panel did). Current = `value` or, when `""`, the first configured provider
   (`llm_provider` only — the other roles show a leading `— inherit main agent —` option whose value is
   `""`). A stored provider outside the six is kept as a disabled extra option (settings.md §3.3).
2. **Model** picker: `ha-combo-box` with `allowCustomValue` → fallback `<jv-picker allowCustom>`;
   items = the live list for the *current* provider; the stored model is always present as the first
   item (flagged when not in the live list, see 5). While loading, the control is enabled with the
   stored value and a note `t("Loading models…")`; after a failed list (`models: []` with `error`) the
   note is `t("No models found — {error}", {error})` (truncate `error` to 80 chars) and the control
   becomes a plain text field for the model id (the old "Custom…" path). The HA/combobox branch offers
   free text natively; the fallback shows a `t("Custom…")` chip that turns the input into free entry with
   placeholder `t("enter model id")`.
3. Role `vision`: help line (already in `HELP[vision_model]`) shows under the row; the row is the
   owner `vision_provider`, so `helpFor()` must be consulted for the consumed key too — the row renders
   `help` for the owner **and** each consumed key (joined by a line break) when both exist.

Fetching: on first render of a role and whenever its provider changes, `ws("jarvis/list_models",
{provider})`; results cached in a module-level `Map` keyed by provider **and** the configured base URLs (so
six roles on one provider make one call and a base-URL save invalidates every role's list at once); the
cache is cleared on `jarvis-refresh`. A call taking more than 15 s counts as failed locally. Never fetch for
provider `""`. In the harness the fixture `jarvis_list_models.json` answers every provider with the same list —
acceptable.

Writes:

* Provider change → `host.saveMany([[providerKey, p], …extras])` where `extras` =
  `[["llm_base_url", ""]]` **only** when `providerKey === "llm_provider"` and `p ∈ {groq, openai, gemini,
  anthropic}` and the current `llm_base_url` is non-empty. Then fetch the model list for `p`; if the stored
  model is **not** in it, the editor **does not auto-save a replacement** (deviation from the old panel's
  self-heal, §9 R2): it marks the model control with `t("{model} is not offered by {provider}", …)` and,
  when a suitable one exists, offers a `t("Use {model}")` button (vision roles: first id matching
  `/vision|vl|scout|maverick|llama-4|gpt-4o|multimodal|qwen3\.\d|gemini/i`; other roles: the first id) that
  saves it; otherwise the user picks or types one. When the role's stored model is `""`, nothing is
  suggested or saved (a blank model means "provider default / inherit").
* Model pick / custom entry (on `value-changed` / blur with a changed non-empty trimmed value) →
  `host.save(modelKey, id)`. Clearing the model → `host.save(modelKey, "")`.
* Saving `review_provider` / `review_model` flips `review_enabled` server-side; the schema re-fetch that
  `host.save` schedules shows it on the generic `review_enabled` row (no extra work).

### 4.2 Entity list pickers — the built-in `<jv-picker multiple>` (list keys)

Keys: `excluded_entities`, `pattern_include_entities` (limited to `binary_sensor`, `device_tracker`,
`person`, `sensor`), `presence_only_entities`, `outdoor_entities`, `indoor_entities` — all through the
built-in `*_entities` editor of §3.2 (`<jv-picker kind="entity" multiple>`). Every add / remove saves the
whole array at once through the row's `onChange` (optimistic; the row reverts on failure and shows the
error). Stored ids that no longer exist in `hass.states` are kept and tagged `not found` (never silently
dropped).

`voice_confirm_entities` has its own editor, `<jarvis-editor-voice-confirm>` (`tools/voice-confirm-list.ts`):

* one `<li>` per stored entry, in stored order: friendly name, the bare id in `.jv-mono` when it differs,
  an `exempt` badge for `"!"`-prefixed entries and a `not found` badge when HA no longer knows the id;
* a **Require / Exempt** segmented toggle (`aria-pressed`): Require stores the bare id, Exempt stores
  `"!" + id`; the entry keeps its position and any other entry for the same id is dropped (an id is never
  both);
* a 44 px `×` Remove (`aria-label` `Remove {name}`);
* below the list a single-value `<jv-picker kind="entity">` to add: a pick appends the **bare** id
  (ignored when the id is already listed, required or exempt); the picker never offers `!`-prefixed ids.

Every change saves the whole array; untouched entries (including `!` exemptions) round-trip unchanged.
Smoke: the fixture `["light.living_room", "!camera.front_door"]` renders two rows with Require / Exempt
pressed correctly, and Exempt on the first row writes exactly `["!light.living_room", "!camera.front_door"]`.

### 4.3 Domain list — built-in `<jv-picker kind="domain" multiple allow-custom>` (`excluded_domains`)

Items = distinct domains of `hass.states`; custom values allowed. Save on each change. Help text stays.

### 4.4 Label list — built-in `<jv-picker kind="label" multiple allow-custom>` (`excluded_labels`)

Items = `data.config.available_labels` (then `config/label_registry/list`) as `{value: id, label: name}`.
Stored values may be ids **or** names (legacy): a chip resolves its label by id first, then by name, else
shows the raw string. New selections store the **id**; custom typed values are allowed (a label may exist
that the snapshot has not reported yet).

### 4.5 Area pickers — `<jv-picker kind="area">`

List keys `lab_areas` (registered explicitly in `tools/lists.ts`), `bedroom_areas`, `outdoor_areas` (the
built-in `*_areas` editor): `<jv-picker kind="area" multiple>`, saving the whole array of **area ids** on
each change. Single key `movie_area`: `<jv-picker kind="area">` (placeholder `— none —`; clearing saves
`""`). Areas come from `hass.areas`, then `data.areas`, then `config/area_registry/list`. (The old panel's
chip toggles were not kept: the picker is the same in HA and the harness.)

### 4.6 Single entity — `<jv-picker kind="entity" .domains=${["media_player"]}>` (`movie_media_player`)

Registered in `tools/lists.ts`; placeholder `— none —`; clearing saves `""`. (`broadcast_group`,
`departure_origin_entity`, `departure_travel_sensor`, `driving_car_sensor` keep the generic row with its
`presentation.ts` suggestions.)

### 4.7 Sentinel rules — `<jarvis-editor-toggle-list>` on `disabled_sentinel_rules` (`options.invert: true`)

A `<fieldset>` list (flush rows, 44 px): one row per `data.config.sentinel_rules[]` with the rule id
humanised (`_` → space) as the label, `desc` as secondary text, and an `ha-switch` (→ native switch) on
the right. **ON = id absent from the list** (`invert`). Toggle → `host.save("disabled_sentinel_rules",
next)`; optimistic, revert on failure. Ids present in the value but not in `sentinel_rules` are listed at
the end with `t("unknown rule")` secondary text and an ON/OFF switch so they can be re-enabled. Empty
source: `t("No sentinel rules reported.")`. Subheading of the row: `t("{count} rules", {count})`.

### 4.8 Announcement speakers — `<jarvis-editor-toggle-list>` on `announcement_speakers` (`options.invert: false`)

Same element; rows from `data.config.cast_devices[]` (`name` label, `entity_id` in `.jv-mono` as
secondary text); **ON = id present**. Ids in the value that are not in `cast_devices` are listed with the
`friendly_name` from `hass.states` (or the id) and `t("not a Cast device")` secondary text, still
toggleable. Empty source: `t("No Cast devices found")` plus the help: `t("Choose the media players JARVIS
announces through. Empty = the broadcast group, then every speaker.")`.

### 4.9 Satellite → speaker pairings — `<jarvis-editor-pairings>` on `satellite_pairings`

One row per `data.config.satellites[]`: label = `area` (fall back to `area_id`, then `name`), secondary
`entity_id`; control `ha-select` (→ `<select>`) with `— none —` (value `""`) + one option per
`cast_devices[]` (`name`). Change → copy the dict, set `pairings[sat] = cast` or `delete pairings[sat]`
when `""`, `host.save("satellite_pairings", pairings)`. Keys in the stored dict that are not current
satellites are listed after the known ones with `t("satellite not found")` and a `t("Remove")` button.
Empty satellites: `t("No satellites found")`. The existing `pairingHint` line (`Keys: …; values: …`) is
dropped for this key once the editor exists (the raw JSON textarea is no longer shown).

### 4.10 Appliances — `<jarvis-editor-appliances>` on `appliance_profile`

A row editor with an explicit **Save** (the only editor that is not save-on-change; the profile is a
record the user edits as a whole, and each save restarts the appliance monitor):

* Rows (from `value`, an array; a non-array → treated as `[]` with the row's existing "not a list"
  warning): **Name** (`ha-textfield` → `<input>`, required), **Type** select (`washer, dryer,
  dishwasher, oven, microwave, appliance`; labels = the raw words, not translated), **Entity**
  (`ha-selector {entity:{domain:["sensor","binary_sensor"]}}` → `<jv-picker>` with items = `hass.states`
  ids where `device_class ∈ {power, energy}` or `unit_of_measurement ∈ {W, kW}` (case-insensitive) or id
  matching `/(washer|dryer|dishwash|laundry|appliance|run_complete|cycle_complete|job_state|machine_state)/i`
  on `sensor.`/`binary_sensor.`; `allowCustom` so any id can be typed), **Watts** (`type="number" min=0
  step=10`, placeholder `watts`), a `t("Remove appliance")` icon button. Secondary line under a row when
  `data.config.appliances.profile` has an entry with the same `name` whose `learned_w` differs from
  `watts` by more than 5: `t("learned ~{watts} W", {watts: Math.round(learned_w)})` and a `t("Use")`
  button that copies it into the Watts field (draft only).
* Footer: `t("+ Add appliance")` (adds an empty row and focuses its name), `t("Save appliances")`
  (`.jv-btn.primary`, disabled when the draft equals `value` or any row has an entity/watts but no name
  — those rows are highlighted with `t("Name required")`). Save → rows mapped to
  `{name: trim, type, entity, watts: Number(watts) || 0}` (rows with an empty name dropped, as the
  backend would) → `host.save("appliance_profile", rows)`; the host's appliance reload hook runs and the
  row status reads `Saved — appliance monitor reloaded` / `… reload failed: {message}` as today. On
  success the draft is reset from the saved value; on failure the draft is kept.
* Empty draft: `t("No appliances declared yet — JARVIS falls back to generic power guesses until you add
  some.")` above the Add button.
* Narrow: each row is a stacked card (name + remove on line 1; type, entity, watts full width).

### 4.11 Biometric map — `<jarvis-editor-biometrics-map>` on `biometric_entities`

Registered on the json key `biometric_entities` (`tools/biometrics-map.ts`). A `<ul class="rows">` of nine
fixed `<li data-kind>` rows (`heart_rate, resting_hr, sleep_stage, sleep_state, spo2, steps, respiratory,
stress, temperature` — the backend's `biometrics._KINDS`; label = a translated kind name, with the kind
itself in `.jv-mono`), each a single `<jv-picker kind="entity" .domains=${["sensor", "binary_sensor"]}>`,
value = `value[kind] ?? ""`. A pick sets the kind, clearing it deletes the kind; either way the **whole dict**
is saved through the row's `onChange` (`biometric_entities`). Stored kinds outside the nine are listed after
them (`class="unknown"`), tagged `unknown kind` with the stored value in `.jv-mono`, and a `Remove` button
(`aria-label` `Remove {kind}`) that deletes the kind. Smoke: the fixture `{heart_rate:
"sensor.watch_heart_rate"}` renders nine rows with the heart-rate picker on that entity; picking `steps`
writes exactly `{heart_rate: "sensor.watch_heart_rate", steps: "sensor.watch_steps"}`. Help under the row: `t("Optional: point a wellbeing kind at a
specific entity when auto-discovery picks the wrong one. Context only — never medical.")`. (Enabling
the feature is the generic `biometrics_enabled` switch; the discovered-wearables list stays out, §7.)

### 4.12 Governance — tool card `<jarvis-tool-governance>` (category Governance; id `governance`)

**Decision: Settings › Governance hosts the enforcement switches.** They are configuration (persisted
owner overrides) that the old panel kept under Settings › Governance, the catalogue's Governance category
already holds the related keys (`autonomy_enforce`, `friday_automator`, …), and an admin looking for
"turn the kernel's X off" looks in Settings, not Logs. Done on both sides: the Logs view's
`jv-logs-governance` is a read-only summary (counts ON / overridden, the switches away from their default)
with a **Change in Settings** button → `/jarvis/settings/governance/tool:governance` (logs.md Card E), so
this card is the one place that writes.

Card: `<jv-section heading=t("Governance") subheading=t("Enforcement") icon="mdi:shield-check-outline">`
with a **Refresh** icon button in `slot="actions"`. Intro paragraph (verbatim, same key the Logs view
uses): `JARVIS's kernel brings each capability online along a shadow → parity → enforce ladder, each
behind a kill-switch. Here you control those switches: the opt-in capabilities ship OFF (enable when
you're ready), and the live safety guards ship ON (leave them on). Changes take effect immediately and
survive a restart.` Then up to three groups (each only when non-empty), in this order:

1. `category === "capability"`: heading `Owner opt-in capabilities`, sub-text `These ship OFF. Turning
   one ON makes the kernel authoritative for that capability — your choice, behaviour-changing.`
2. `category === "safety"`: heading `Safety & governance — kill-switches (keep ON)`, sub-text `These
   ship ON and guard autonomous behaviour. Turning one OFF reverts that guard to observe-only (log-only)
   — only for debugging.`
3. any other `category` value: heading `Enforcement`, no sub-text (so a switch with a new category is
   still shown).

The switch list comes from `get_enforcement` only — never hard-code keys or counts (the registry grows
with the kernel).

Row: `name` (medium weight) + `phase` as a small `.jv-mono` muted tag when non-empty + `jv-state-badge
level="warn" nodot label=t("overridden")` when `overridden` + `jv-state-badge level="neutral" nodot
label=t("default: ON"|"default: OFF")` when `enabled !== default`; `explanation` as secondary text inside a
`<details>` on narrow (summary = first sentence) and inline on desktop; `ha-switch` (→ native switch)
right-aligned, `aria-label=name`.

Fetch: `ws("jarvis/get_enforcement")` when the card first becomes `active`, on Refresh, and after each
successful write. Toggle → confirm rules exactly as the old panel / Logs:

| move | confirm | dialog |
|---|---|---|
| safety ON → OFF | yes, destructive | heading `t('Turn OFF the safety enforcement "{name}"?')`, message `t("This reverts that guard to observe-only (log-only) until you turn it back on. Only do this for debugging.")`, confirmLabel `t("Turn off")` |
| capability OFF → ON | yes | heading `t('Enable "{name}"?')`, message `t("This makes the kernel authoritative for that capability.")`, confirmLabel `t("Enable")` |
| safety OFF → ON, capability ON → OFF | no | — |

Then `ws("jarvis/set_enforcement", {key, enabled})`; the switch is disabled while in flight; on success
the row takes `res.switch` immediately and the list is re-fetched; toast `t("{name} → {state}", {state:
ON|OFF})`. On failure: toast `t("{name} — {message}")`, switch snaps back. Error on fetch: `ha-alert
error` `t("Couldn't load governance switches — {message}")` + Retry. Empty: `t("No governance switches
reported.")`.

### 4.13 Energy — tool card `<jarvis-tool-energy>` (category Safety & Energy; id `energy`)

`<jv-section heading=t("Energy Management") icon="mdi:flash-outline">`; `slot="actions"` holds a
`jv-state-badge`: `level="neutral" label=t("No meter")` when `kw == null`; `level="warn"
label=t("{kw} kW · over peak")` when `over_peak`; else `level="ok" label="{kw} kW"`. Intro:
`t("Whole-home power, peak awareness, and load advice. Pick how much JARVIS may act — it never sheds
critical loads (fridge, medical, network).")`.

Body:

* **Agency** chip group (`<fieldset>` legend `t("Agency")`, three `aria-pressed` chips `advisory` /
  `opt-in` / `autonomous` — labels via `enumLabel("energy_agency", …)`). Pressed = `host.value("energy_agency")`
  (the catalogue value); when the status's `agency` (effective) differs from `configured_agency`, a line
  `t("Effective now: {agency} (raised by the current mode)", {agency})`. Tap → `host.save("energy_agency",
  value)` (row status on the generic Governance row + a toast from the host on failure), then re-fetch
  status.
* `advice[]` as paragraphs (backend English, not translated; may be empty).
* `running[]` (when non-empty) under `t("Running now")`: `<jv-kv label=name value="{watts} W">`, plus a
  `jv-state-badge level="neutral" nodot label=t("protected")` when `shed_ok === false`.
* Footer line: `t("Meter: {entity}")` in `.jv-mono` when `meter`, `t("Peak threshold: {watts} W")`.

Fetch `ws("jarvis/energy", {action: "status"})` on first `active`, on Refresh (icon button in actions
next to the badge), and after an agency save. No polling. Error: `ha-alert error` `t("Couldn't load
energy data — {message}")` + Retry.

### 4.14 Hazard — tool card `<jarvis-tool-hazard>` (category Safety & Energy; id `hazard`)

`<jv-section heading=t("Hazard Monitor") icon="mdi:earth">`; actions badge `level="ok" label=t("ON")`
/ `level="neutral" label=t("OFF")` from `status.enabled` (the enable switch itself is the generic
`hazard_monitor_enabled` row above). Body:

* Location line from `status`: `center && using_override` → `t("Location: override {lat}, {lon}.")`;
  `center` → `t("Location: home {lat}, {lon}.")`; `null` → `t("Location: no home coordinates set in Home
  Assistant.")` (`lat`/`lon` formatted with 3 decimals as the backend sends them).
* Feeds summary: three `jv-state-badge nodot` (`t("Earthquakes")`, `t("Severe weather")`,
  `t("Disasters")`) `level="ok"` when the feed is on, `neutral` off, with the radii: `t("{km} km, M ≥
  {mag}")` for quakes, `t("{km} km")` for disasters.
* `t("Scan now")` button (`.jv-btn.primary`; disabled with label `t("Scanning…")` while in flight; also
  disabled when `center === null` with the note above). Click → **confirm first** (`confirmDialog`, not
  destructive: heading `Scan for hazards now?`, message `JARVIS checks USGS, NWS and NASA EONET around your
  location once. Read-only — it never announces or alerts.`, confirm `Scan now`) → `ws("jarvis/hazard",
  {action: "scan"})`. After 30 s without an answer the button is re-enabled and the status says `still
  scanning in the background` (§9 R11); a re-run supersedes the earlier one (only the latest answer is
  shown);
  a `role="status"` region shows `t("Checking USGS, NWS and NASA EONET…")` during the call, then:
  * `ok === false` → `ha-alert warning` with `res.error`;
  * all three arrays empty → `t("All clear near {lat}, {lon} — no active earthquakes, severe weather, or
    disasters.")` with an ok badge;
  * else a `<ul>`: quakes `jv-state-badge level="danger" nodot label="M{mag.toFixed(1)}"` + `{place} —
    {dist_km} km away` (`t("{place} — {km} km away")`); weather `level="warn" label=severity` +
    `event` (+ ` — area` when present); disasters `level="warn" label=category` + `title — {dist_km} km
    away`. Counts in the section subheading: `t("{quakes} quakes · {weather} warnings · {disasters}
    events")`.
* Scan results are **not** persisted; switching category and back shows the status line only.

Fetch status on first `active` and after any `hazard_*` key save (listen: the host calls
`tool.onConfigSaved?.(key)` — optional hook on tool elements; simplest: the tool re-reads status when its
`data` property changes, since `host.save` triggers `refreshSnapshot()`). Errors: `ha-alert error`
`t("Couldn't load hazard status — {message}")` + Retry; scan failure (error frame): `ha-alert error`
`t("Scan failed: {message}")`.

### 4.15 Muted announcements — tool card `<jarvis-tool-mutes>` (category Safety & Energy; id `mutes`)

`<jv-section heading=t("Muted Announcements") subheading=t("Shush") icon="mdi:volume-mute">`, Refresh
icon button in actions. Intro: `t("Things JARVIS has been told to stop announcing — a window that's often
open, a decorative light, etc. Muting an entity silences announcements about it while JARVIS keeps
observing it normally (not the same as excluding it). Persists across restarts.")`.

Body (from `jarvis/mutes` `list`):

* `all === true` → `ha-alert warning` `t("Blanket mute is ON — all announcements are suppressed.")` with
  an action button `t("Turn off")` → `{action: "clear"}` **after** `confirmDialog({heading: t("Clear every
  mute?"), message: t("This also unmutes every entity and category below."), confirmLabel: t("Clear all"),
  destructive: true})`.
* Chips (`<ul>`): one per `entities[]` (label = friendly name, id in `.jv-mono` title) and one per
  `categories[]` (label + `jv-state-badge level="info" nodot label=t("category")`), each with a 44 px-hit
  `×` button `aria-label=t("Unmute {name}")` → `{action: "unmute", entity_id}` / `{…, category}` (focus then
  moves to the next / previous chip's `×`, else the entity picker, §4.20).
* Empty and not `all`: `t("Nothing muted. JARVIS announces about everything it observes. Mute an entity
  below (or run jarvis.shush) to silence announcements about it without excluding it.")`.
* Add row: an entity picker (`{entity:{}}` → `<jv-picker allowCustom>` over `hass.states`; custom allowed
  because a category name is also valid here) + a category `ha-select` (→ `<select>`) with `— none —` and
  the eight known categories + `t("Mute")` button (`.jv-btn.primary`, disabled while both are empty). Click
  → `{action: "mute", entity_id?}` and/or `{action: "mute", category?}` (one call per filled field); on
  success the response replaces the list and the inputs clear.
* `t("Clear all")` text button (`.jv-btn.text`, danger colour) when anything is muted → same confirm as
  above → `{action: "clear"}`.

Every mutating call answers the full list, so the card replaces its state with the response and does not
re-fetch. Error: `ha-alert error` `t("Couldn't load the mute list — {message}")` + Retry; mutation failure:
toast `t("Mute change failed — {message}")`, state unchanged.

### 4.16 Brief me now — tool card `<jarvis-tool-briefing>` (category General; id `briefing`)

Placed in **General** because the `briefing_*` keys are in the catalogue's `core` category (settings.md
§7 said "Voice & Audio" — superseded). `<jv-section heading=t("Briefings") icon="mdi:weather-sunset-up">`;
actions badge `level="ok" label=t("Scheduled")` when `briefing_morning_enabled || briefing_evening_enabled`
(from `host.value`), else `neutral` `t("Off")`. Body: one line summarising the schedule —
`t("Morning {time}", …)` / `t("Evening {time}", …)` for the enabled ones (from `host.value`) and a link
`t("Edit schedule")` → `navigate("settings", "core/briefing_morning_enabled")` (flashes the first key);
then the button `t("Brief me now")` (`.jv-btn.primary`, full width on narrow).

Click:
1. Guard (client-side, kept from the old panel because the service returns `announced: false`
   silently): `speakers = host.value("announcement_speakers")` (array, non-empty) **or**
   `host.value("broadcast_group")` non-empty. When neither: `ha-alert warning` inline `t("No announcement
   speakers set — choose them under Voice & Audio › Announcement Speakers.")` with an action button
   `t("Choose speakers")` → `navigate("settings", "voice/announcement_speakers")`. Do not call the service.
2. Else button disabled with label `t("Briefing…")`; `hass.callService("jarvis", "briefing", {announce:
   true})`; success → status line `t("Briefing requested — listen for it.")` (clears after 6 s); failure →
   `ha-alert error` with the HA error message. Re-enable the button in `finally`.

### 4.17 Voice confirmation test — tool card `<jarvis-tool-voice-confirm-test>` (category Voice & Audio; id `voice-confirm-test`)

`<jv-section heading=t("Voice Confirmation") icon="mdi:microphone-question">`; actions badge from
`host.value("voice_confirm_enabled")` (`ok` `ON` / `neutral` `OFF`) and the mode as text
(`enumLabel("voice_confirm_mode", …)`). Body: `t("Run the test to see whether your satellite can speak
on its own (native mode) or needs the room speaker (gated mode).")` + button `t("Test satellite audio")`
(`.jv-btn.primary`). Click → button disabled, label `t("Playing…")`, status `t("Firing announce to your
satellite — listen for it…")`; `ws("jarvis/voice_confirm_test")`:

* `ok === true` → `ha-alert success` `{note}` + `satellite` in `.jv-mono`;
* `ok === false` → `ha-alert warning` `{note}` (+ `error` as a second line when present);
* error frame → `ha-alert error` `{message}`.

Result stays until the next test. Link under it: `t("Change mode")` → `navigate("settings",
"voice/voice_confirm_mode")`.

### 4.18 Diagnostics — tool card `<jarvis-tool-diagnostics>` (category General; id `diagnostics`)

Placed in **General** (settings.md §7 had it under Cameras only because of the last row; it is a service
test panel for notify / TTS / observer / routing). `<jv-section heading=t("Diagnostics") subheading=t("Test")
icon="mdi:stethoscope">`. A `<ul>` of seven rows, each `label` left and a `t("Run")` button (`.jv-btn`)
right (44 px rows; on narrow the button is full width under the label):

| label (old text, translated keys exist for the labels marked ✓) | call |
|---|---|
| `TTS — JARVIS voice test` | `jarvis.test_tts {}` |
| `Observer — fire status event` | `jarvis.observer_status {}` |
| `Briefing — manual trigger` | `jarvis.briefing {}` (same speaker guard as §4.16; inline warning instead of calling) |
| `Doorbell — run diagnostics` | `jarvis.diagnose_doorbell {}` |
| `Notification — test phone push` | `jarvis.test_notify {}`; when `host.value("notify_service")` is `""` show `t("No notify service set")` and disable |
| `Routing — dump routing state to log` | `jarvis.test_routing {}` |
| `Camera — analyze now (vision → reasoning)` | `ha-select` (→ `<select>`) of `data.config.cameras.filter(c => c.enabled !== false)` (`name`; empty → `— no cameras —` and the Run disabled) then `jarvis.analyze_camera {entity_id, announce: true}` |

Per row: the button is disabled while its call is in flight (`t("Running…")`); success → a transient
`role="status"` text `t("Done — check the speakers / log.")` next to the button for 4 s; failure → the
HA error message in `--jv-danger-text` (stays until the next run). No toast. Six rows are harmless tests
and run at once; the **camera row asks first** (it spends LLM credits and speaks the result, like Cameras
› Analyze now): `confirmDialog` heading `Analyze {name} now?`, message `JARVIS runs one vision → reasoning
pass on this camera and announces the result. It uses LLM credits and takes a few seconds.`, confirm
`Analyze now`.

### 4.19 Wellbeing Context — tool card `<jarvis-tool-wellbeing>` (category Home & Extras; id `wellbeing`)

A pointer card so the old Settings card's place is not a dead end: `<jv-section heading=t("Wellbeing
Context") icon="mdi:heart-pulse">`, actions badge `ON` (`ok`) / `OFF` (`neutral`) from
`host.value("biometrics_enabled")`, the intro `The discovered wearables and the wearable-context switch are
on the People view. Context only — never medical.`, an `Open People` button (`navigate("people")`) and a
`Map a kind to an entity` link → `/settings/core/biometric_entities` (§4.11). No commands.

### 4.20 Keyboard focus after a row's Remove

Every row removal in these editors goes through `keepRowFocus()` (`src/focus.ts`, DESIGN.md §8): after the
host re-renders, focus moves to the same control in the **next** row, else in the **previous** row, else a
fallback — never to `<body>`. Rows are found again by a stable key attribute read before the removal (never
by index), through the control's own shadow root; focus only moves when the activated control had it and
it has since fallen to `<body>`. A removal that only takes effect when the backend answers returns its
Promise to `keepRowFocus()`; focus is placed once it settles (on the same row's control again when a failed
write brings the row back). Lists are rendered with `repeat()` keyed by the row key so a late re-render
never moves the focused control to another row.

| editor | row / key | control | fallback when no row is left |
|---|---|---|---|
| Appliances (§4.10) | `.list > .row` / `data-uid` | the row's Remove | `+ Add appliance` |
| Voice confirm (§4.2) | `.rows > li` / `data-key` (the stored entry) | `×` | the add picker |
| Pairings (§4.9, orphaned pairings) | `.rows > li` / `data-sat` | Remove, else the row's speaker select | the empty note |
| Biometric map (§4.11, unknown kinds) | `.rows > li` / `data-kind` | Remove, else the row's picker | — (the last fixed kind's picker is the previous row) |
| Muted announcements (§4.15, chips) | `ul.chips > li` / `data-key` (`entity:<id>` / `category:<name>`) | the chip's `×` (disabled until `jarvis/mutes` answers, so the removal returns that call's Promise) | the add row's entity picker |

The smoke test activates each Remove on the first / last / only row and asserts where focus lands.

---

## 5. Actions summary

| # | user action | trigger | call(s) | confirm? | success | failure |
|---|---|---|---|---|---|---|
| T1 | Pick provider for a role | select change | `host.saveMany([[*_provider, p], ["llm_base_url",""]?])` then `jarvis/list_models {provider}` | no | row "Saved ✓"; model list refreshed; mismatch note when stored model missing | row "Save failed — …"; select reverts |
| T2 | Pick / type model | `value-changed` / blur | `host.save(*_model, id)` | no | row "Saved ✓" | row error; control reverts |
| T3 | "Use {model}" | button | `host.save(*_model, suggested)` | no | as T2 | as T2 |
| T4 | Add / remove entity, domain, label, area; toggle rule or speaker; change pairing; change biometric row | picker/switch change | `host.save(key, nextValue)` | no | optimistic; row "Saved ✓" | revert; row error |
| T5 | Save appliances | Save button | `host.save("appliance_profile", rows)` (+ host's `jarvis/reload_appliances`) | no | "Saved — appliance monitor reloaded" | "Save failed — …" (draft kept) / "Saved — appliance monitor reload failed: …" |
| T6 | Governance toggle | switch | `jarvis/set_enforcement {key, enabled}` then `jarvis/get_enforcement` | safety ON→OFF and capability OFF→ON | toast "{name} → ON/OFF"; row updated | toast "{name} — {message}"; switch snaps back |
| T7 | Energy agency chip | click | `host.save("energy_agency", v)` then `jarvis/energy {action:"status"}` | no | chip pressed; status re-read | row error on the Governance row + toast |
| T8 | Hazard scan | button | `jarvis/hazard {action:"scan"}` | **yes** (not destructive) | results list / all clear; after 30 s "still scanning in the background" | alert "Scan failed: …" |
| T9 | Mute | button | `jarvis/mutes {action:"mute", entity_id?|category?}` | no | list replaced | toast |
| T10 | Unmute one | chip × | `jarvis/mutes {action:"unmute", …}` | no | list replaced | toast |
| T11 | Clear all / turn blanket off | button | `jarvis/mutes {action:"clear"}` | **yes**, destructive | list replaced | toast |
| T12 | Brief me now | button | guard → `jarvis.briefing {announce:true}` | no (guard may refuse) | "Briefing requested — listen for it." | alert with message |
| T13 | Test satellite audio | button | `jarvis/voice_confirm_test` | no | success/warning alert with note | error alert |
| T14 | Diagnostics Run | button | the row's service | camera row only | transient "Done …" | inline message |
| T17 | Remove a row (appliance, voice-confirm entry, orphaned pairing, unknown biometric kind) | `×` / Remove | `host.save(key, next)` (appliances: draft only, then Save) | no | focus moves to the next / previous row's control or the fallback (§4.20) | row error; row stays |
| T15 | Refresh (tool card) | icon button | that card's status command | no | re-rendered | card error state |
| T16 | Edit schedule / Choose speakers / Change mode links | click | `navigate("settings", "<cat>/<key>")` | no | scroll + flash | — |

Confirm dialogs use `confirmDialog()` from `src/components` (never `window.confirm`). Writes through
`host.save` inherit settings.md §5's optimistic / queued / debounced-refetch behaviour; a tool card's own
command is never queued — its control is disabled while in flight instead.

---

## 6. States

| element | loading | empty | error | in flight |
|---|---|---|---|---|
| model role | stored value + "Loading models…" | provider `""` → model control disabled with `— inherit main agent —`; `models: []` → "No models found — {error}" and free-text entry | (never an error frame; `unknown_command` → treat as `models: []` with `t("not supported by this backend")`) | select disabled during save |
| entity / domain / label / area pickers | — (synchronous from `hass`/`data`) | `data` null → picker works from `hass.states`; areas/labels/cast/satellites/rules missing → the per-editor empty message, picker still usable where custom values are allowed | row status | optimistic |
| appliances | — | "No appliances declared yet — …" | row status | Save disabled, label "Saving…" |
| governance | `jv-empty kind="loading" heading=t("Loading governance switches…")` | "No governance switches reported." | alert + Retry | the one switch disabled |
| energy | `jv-section loading` | `kw == null` → badge "No meter" + the backend's advice line | alert + Retry | chips disabled |
| hazard | `jv-section loading` (status) | `center === null` → location line + Scan disabled | alert + Retry; scan alert | Scan button "Scanning…" |
| mutes | `jv-section loading` | "Nothing muted. …" | alert + Retry | Mute button disabled |
| briefing | — | no speakers → inline warning + link | alert | button "Briefing…" |
| voice test | — | — | alert | button "Playing…" |
| diagnostics | — | no cameras → "— no cameras —" | inline message per row | that row's button "Running…" |
| any | `hass` undefined | — | — | every control disabled (the view's existing offline banner) |
| any | `unknown_command` | — | `t("Not available on this backend — update the JARVIS integration.")` | — |

---

## 7. Out of scope (with reasons)

| old feature | why not here | where |
|---|---|---|
| Floor Plan Editor (rooms, elements, background, vacuum-map / SweetHome3D import) | pointer-events editor, own spec | editor.md (`/jarvis/residence/editor`; linked from Home & Extras › Elsewhere in the panel) |
| Cameras: enable / disable, JARVIS-only rename (`jarvis/rename_camera`), indoor/outdoor (`jarvis/camera_location`), camera diagnostics (`jarvis/camera_diagnostics`), Camera Watch live tiles | camera commands + signed snapshots, own spec | cameras spec |
| Doorbell Training dataset + `jarvis.train_doorbell_backlog` | dataset viewer | cameras spec |
| Document Library (`jarvis/documents`) and semantic search (`jarvis/semantic_search`) | file upload / ingest / probe UI, own spec | documents spec |
| Faces / voices (`jarvis/faces`, `jarvis/voices`, `jarvis/face_reference`) | identity management, own spec | people.md |
| Wellbeing Context enable / disable and the discovered-wearables list (`jarvis/biometrics`) | identity / wellbeing context lives with the people it describes; `biometrics_enabled` is also a generic switch | the People view (people.md); here only the `biometric_entities` map editor (§4.11) and the §4.19 pointer card |
| Observer Tuning / Memory stats, System Diagnostics "Run check" + judgment calibration | read-only runtime stats, already on the Logs view | Logs |
| Operational Mode chips (`jarvis/mode`) | on the Overview view | Overview |
| Onboarding welcome card | lives on the dashboard; the view only honours its deep links | — |
| AI Models "retired-model self-heal" (auto-save a replacement) | silent config write on page open; replaced by an explicit "Use {model}" button | §4.1 / §9 R2 |
| `jarvis/energy {action:"set_agency"}` | one write path for `energy_agency` (the catalogue row's pipeline) | §4.13 / §9 R3 |
| `ha-slider` for 0..1 floats, shared toast helper, stale-snapshot banner | nice-to-haves from settings.md | later |

---

## 8. Strings

**Phase 3 status:** every panel key is now translated in all 22 language files (`frontend/i18n-missing.json` reports nothing missing; `npm run i18n:report` regenerates it). The de.json / ✓ / ✗ columns below record what existed before the port; the code's `t()` keys (`npm run i18n:keys`) are authoritative where they differ from this list.

`t()` key = the English string (placeholders `{…}`). "de" = the exact key exists today in
`custom_components/jarvis/frontend/i18n/de.json` (checked for the rows marked; the remaining keys are
new in every language until a translation pass). Technical values (entity ids, model ids, provider ids,
category ids, backend advice sentences, rule ids) are not translated.

### 8.1 Card and group headings

| string | de |
|---|---|
| AI Models | yes |
| Main Agent / Classifier / Reasoning / Review / Vision / Camera Rsn | yes (all six) |
| Excluded Entities | yes |
| Routine Learning | yes |
| Sentinel Rules | yes |
| Announcement Speakers | yes |
| Satellite → Speaker | yes |
| Appliances | yes |
| Energy Management | yes |
| Hazard Monitor | yes |
| Voice Confirmation | yes |
| Diagnostics | yes |
| Briefings | no |
| Muted Announcements | no |
| Governance | no |
| Enforcement | no |
| Owner opt-in capabilities | no |
| Safety & governance — kill-switches (keep ON) | no |
| Shush | no |
| Test | no |
| Agency | yes |

### 8.2 Controls and notes

| string | de |
|---|---|
| {provider} — needs setup | no (old text was built by concatenation) |
| — inherit main agent — | no |
| Loading models… | no (`loading…` exists — different casing/text) |
| No models found — {error} | no (`no models found` partial, not a key) |
| not supported by this backend | no |
| Custom… | no (`✎ Custom…` exists; the new key drops the glyph) |
| enter model id | no |
| {model} is not offered by {provider} | no |
| Vision throttle and thinking: see Cameras | no |
| Use {model} | no |
| Use | no |
| — none — | yes |
| — no cameras — | yes |
| Remove | no |
| Remove {name} | no |
| Clear | no |
| Add | no |
| "{value}" is not a known entity id | no |
| not found | no |
| Require / Exempt / exempt | no |
| No rooms detected yet. | no |
| No Home Assistant labels found. | no |
| {count} rules | no |
| unknown rule | no |
| No sentinel rules reported. | no |
| not a Cast device | no |
| No Cast devices found | yes |
| Choose the media players JARVIS announces through. Empty = the broadcast group, then every speaker. | no |
| No satellites found | yes |
| satellite not found | no |
| + Add appliance | no |
| Save appliances | yes |
| Remove appliance | no |
| Name required | no |
| learned ~{watts} W | no |
| No appliances declared yet — JARVIS falls back to generic power guesses until you add some. | no |
| Optional: point a wellbeing kind at a specific entity when auto-discovery picks the wrong one. Context only — never medical. | no |
| unknown kind | no |
| overridden | no |
| default: ON / default: OFF | no |
| Turn OFF the safety enforcement "{name}"? | no (same key as logs.md) |
| This reverts that guard to observe-only (log-only) until you turn it back on. Only do this for debugging. | no (logs.md) |
| Enable "{name}"? / This makes the kernel authoritative for that capability. | no (logs.md) |
| Turn off / Enable | no |
| {name} → {state} / {name} — {message} | no |
| Loading governance switches… / No governance switches reported. / Couldn't load governance switches — {message} | no (logs.md) |
| JARVIS's kernel brings each capability online along a shadow → parity → enforce ladder, … survive a restart. | no (logs.md, same key) |
| These ship OFF. Turning one ON makes the kernel authoritative for that capability — your choice, behaviour-changing. | no (logs.md) |
| These ship ON and guard autonomous behaviour. Turning one OFF reverts that guard to observe-only (log-only) — only for debugging. | no (logs.md) |
| Whole-home power, peak awareness, and load advice. Pick how much JARVIS may act — it never sheds critical loads (fridge, medical, network). | no |
| No meter | no |
| {kw} kW · over peak | no |
| Effective now: {agency} (raised by the current mode) | no |
| Running now | yes |
| protected | no |
| Meter: {entity} / Peak threshold: {watts} W | no |
| Couldn't load energy data — {message} | no |
| Location: override {lat}, {lon}. / Location: home {lat}, {lon}. / Location: no home coordinates set in Home Assistant. | no (`Location: using home coordinates.` exists but is no longer used) |
| Earthquakes / Severe weather / Disasters | no |
| {km} km, M ≥ {mag} / {km} km | no |
| Scan now / Scanning… | no (`SCAN NOW` upper-case does not exist either) |
| Checking USGS, NWS and NASA EONET… | no |
| All clear near {lat}, {lon} — no active earthquakes, severe weather, or disasters. | no |
| {place} — {km} km away | no |
| {quakes} quakes · {weather} warnings · {disasters} events | no |
| Couldn't load hazard status — {message} / Scan failed: {message} | no |
| Things JARVIS has been told to stop announcing — … Persists across restarts. | no |
| Blanket mute is ON — all announcements are suppressed. | no |
| Clear every mute? / This also unmutes every entity and category below. / Clear all | no |
| category | no |
| Unmute {name} | no |
| Nothing muted. JARVIS announces about everything it observes. Mute an entity below (or run jarvis.shush) to silence announcements about it without excluding it. | no |
| Mute | no |
| Couldn't load the mute list — {message} / Mute change failed — {message} | no |
| Scheduled / Off | no |
| Morning {time} / Evening {time} / Edit schedule | no |
| Brief me now | no (`BRIEF ME NOW` upper-case exists; new key is sentence case) |
| Briefing… | no |
| No announcement speakers set — choose them under Voice & Audio › Announcement Speakers. | no |
| Choose speakers | no |
| Briefing requested — listen for it. | no |
| Run the test to see whether your satellite can speak on its own (native mode) or needs the room speaker (gated mode). | no |
| Test satellite audio / Playing… | no (`TEST SATELLITE AUDIO` upper-case does not exist either) |
| Firing announce to your satellite — listen for it… | no |
| Change mode | no |
| TTS — JARVIS voice test | yes |
| Observer — fire status event | yes |
| Briefing — manual trigger | yes |
| Doorbell — run diagnostics | yes |
| Notification — test phone push | yes |
| Routing — dump routing state to log | yes |
| Camera — analyze now (vision → reasoning) | yes |
| Run | yes |
| Running… | no |
| Done — check the speakers / log. | no |
| No notify service set | no |
| Refresh | no |
| Retry | no (settings.md) |
| Not available on this backend — update the JARVIS integration. | no |
| ON / OFF | yes |

Humanised rule ids, kind names and the `advisory / opt-in / autonomous` chip labels go through
`enumLabel` / existing keys (`advisory`, `opt-in`, `autonomous` exist in de.json).

---

## 9. Risks

1. **HA picker availability is session-dependent.** `ha-selector` and friends are defined only after HA
   loaded a form somewhere in the same page session; a fresh browser landing directly on `/jarvis` sees
   none of them and gets the fallback. Both branches must therefore be first-class and emit the same
   `value-changed` shape; test both (the harness only exercises the fallback — look at the HA branch in a
   real instance). `watchDefinitions` makes the swap seamless mid-session, but a picker that swaps while
   focused loses focus: only swap when the element is not `:focus-within` (re-check on next render).
2. **No silent self-heal of retired models.** The old panel auto-saved a replacement model when the
   provider stopped listing the stored one; this spec replaces that with a visible warning and a one-tap
   "Use {model}". A user whose Groq model was retired keeps a broken assistant until they tap — the
   warning must be prominent (warn-tinted note under the control, not a tooltip).
3. **Two write paths for `energy_agency` and `biometrics_enabled`.** Resolved on the backend:
   `jarvis/energy set_agency` and `jarvis/biometrics enable|disable` now write through
   `config_apply.async_apply_many` (runtime_config + config.json + native entities), like
   `jarvis/update_config`, so neither masks the other. The Energy card still saves `energy_agency` through
   `host.save` (one pipeline, row status); `biometrics_enabled` is switched in the People view or the
   generic row.
4. **`list_models` never errors.** Failures come back as `{models: [], error}` with a fixed generic
   message; the specific cause is only in the HA log. Say so in the note ("see the Home Assistant log").
5. **Consumed keys and search / deep links.** `model`, `classifier_model`, … are no longer rendered as
   rows; any link or test that queries `jarvis-config-field[data-key="model"]` must target the owner
   (`llm_provider`). `tests/unit/test_panel_writable_keys.py` and friends are static and unaffected, but
   the smoke test's "every view renders content" is; keep the owner rows' `data-key`.
6. **Optimistic list edits can interleave.** Two quick toggles on the Sentinel list produce two saves of
   the whole array; `host.save` already queues a second write to the same key behind the first, but the
   second must be computed from the *latest draft*, not from `value` at click time — editors keep a local
   draft array that they mutate and send, and only overwrite it from `value` when no save is in flight.
7. **`satellite_pairings` keys are satellites that may disappear** (renamed entity). The editor shows
   orphans with a Remove button rather than dropping them, so a temporarily unavailable satellite keeps
   its pairing.
8. **`excluded_labels` by id vs name.** Storing ids is forward-compatible (the backend matches both) but
   a label renamed in HA keeps working only with ids; legacy names stay as they are. The chip resolves
   both.
9. **`voice_confirm_entities` `!` prefix** is easy to lose: the editor must round-trip `"!lock.x"`
   unchanged when toggling other rows, and the fallback datalist must not offer `!`-prefixed ids.
10. **Appliance Save semantics changed from "type to save" to an explicit Save**: a user who edits a
    watts field and navigates away loses the draft. Warn with the row's existing dirty indicator
    (`{count} items` style) and, on category switch with a dirty draft, keep the draft in memory for the
    view's lifetime (the element is re-created per render — store drafts in a module-level `Map<key,
    draft>` keyed by setting key, cleared on successful save).
11. **Hazard scan is slow and external.** Three HTTP feeds, no server timeout documented; set a local
    30 s guard on the UI (keep the request alive, but re-enable the button and say "still scanning in the
    background" after 30 s).
12. **Fixture gaps.** `frontend/dev/fixtures/panel_data.json` still has `satellites[]` with `area_id` and
    no `area` (the backend sends `area` = name; the pairings editor falls back to `area_id`, then `name`),
    and `cast_devices` with two entries; `sentinel_rules[]` now carry `desc` (the toggle list also accepts
    a legacy `name`). `jarvis_list_models.json`, `jarvis_energy.json`, `jarvis_hazard.json` (status and scan
    fields in one file, since the harness answers both actions with it), `jarvis_mutes.json`,
    `jarvis_voice_confirm_test.json`, `jarvis_get_enforcement.json`, `jarvis_set_enforcement.json`,
    `jarvis_reload_appliances.json` and the three `config_*_registry_list.json` exist; `config_schema.json`
    carries `voice_confirm_entities = ["light.living_room", "!camera.front_door"]` and
    `biometric_entities = {"heart_rate": "sensor.watch_heart_rate"}` (regenerated by
    `scripts/config-schema-fixture.py`) for the smoke assertions of §4.2 / §4.11.
13. **Governance in two views.** Resolved: only Settings › Governance writes; the Logs card is read-only and
    re-reads `get_enforcement` on enter / Refresh, so it can lag a write by at most one fetch.
14. **`callService` has no structured result.** The Diagnostics rows and Brief-me-now can only report
    "requested"; the real outcome is audible or in the log. Copy says so.
15. **Translations.** ~110 new English keys; the few old upper-case HUD keys (`BRIEF ME NOW`,
    `✎ Custom…`) are deliberately not reused — the new panel does not shout.
16. **Bundle size.** Ten editor elements + seven tool cards add perhaps 60–80 kB minified; still a single
    bundle, but lazy `import()` of `editors/` and `tools/` chunks is not available (one-file build), so keep
    templates lean and share `<jv-picker>` and the toggle-list element.
