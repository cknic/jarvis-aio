# Overview view — specification

Derived from the old panel's "dashboard" tab ("Command Center") in
`custom_components/jarvis/frontend/jarvis-panel.js` (`data-tab="dashboard"`, the
`this._currentTab === 'dashboard'` block of `_html()`, `_data()`, `_fetchLiveData()`,
`_patchLiveDom()`, `_renderAreaDetail()`, `_renderAreaLightsPopover()`, the lockdown
switch in the masthead, and the Operational Mode card that lived on the Settings tab).
Backend contract verified against `custom_components/jarvis/websocket.py`,
`panel_data.py`, `modes.py`, `cognitive_core.py` (`LockdownManager.status`),
`config_apply.py` and `services.yaml`.

The view agent implements this view from this document alone. Everything the view
needs from the backend is written out below; "undocumented" means the field exists on
the wire but nothing in the old panel consumed it.

Implementation: `<jarvis-view-overview>` (`src/views/overview.ts`, extending `JarvisView`)
with `src/views/overview/areas.ts` (`<jarvis-ov-areas>`: the Areas grid, the area
detail dialog and the lights popover), `ov-dialog.ts` (`<jarvis-ov-dialog>`, the
dialog fallback), `model.ts` (pure helpers) and `styles.ts`.

---

## 1. Purpose

Status at a glance for the Home Assistant admin who opened the JARVIS panel:

* Is JARVIS awake or asleep, is the observer running, how many LLM providers are usable,
  is lockdown engaged, which operational mode is active, how many voice satellites are
  online, where do alerts go (notify target), which area is "dominant" (most recently
  occupied), and one card per area (occupied, lights on/total, temperature/humidity, last
  motion, capabilities).
* Three kinds of action, all admin-only: set the operational mode, engage/lift lockdown,
  and quiet JARVIS for a while (nap 30/60 min) or clear all mutes (unshush = "wake").
  Per-area light control is kept because the area card already shows the light count
  and the backend exposes a flag for it (`light_control_enabled`).

Not ported (see §7): greeting/honorific, masthead, reactor ring, radar, demo-room
rotation, `_mockData`, Camera Watch, Activity Feed, Goals, Cognitive Core readout,
onboarding card, sparklines, Briefing / Status Dump / Analyze Now buttons.

The panel is registered with `require_admin=True`; every command below is either
`@websocket_api.require_admin` or gates its write branch on admin. The view never has
to handle a non-admin viewer, but it must still handle an `unauthorized` error
gracefully (toast + no state change).

---

## 2. Data

All calls go through `this.ws(type, payload)` (`JarvisView.ws` → `src/ws.ts`: resolves
with the `result` object or rejects with a `WsError` whose `.message` is the backend's
error message and `.code` the error code string such as `"lockdown_failed"`). Services
go through `hass.callService(domain, service, data, target)` (guarded: a `hass` without
`callService` fails the action with "Home Assistant connection not available").

### 2.1 `jarvis/get_panel_data` — the status snapshot

**Request**

```json
{ "type": "jarvis/get_panel_data" }
```

No other fields. Admin only.

**Fetch policy.** The panel **shell** (`src/panel.ts`) owns the snapshot: it loads it
once, refreshes it every **20 000 ms** while the browser tab is visible, and on every
`jarvis-refresh` event a view dispatches (debounced 250 ms); the view receives it as the
`data` property and never calls `jarvis/get_panel_data` itself. The view adds:

1. Realtime nudge: subscribe once to `state_changed` via
   `hass.connection.subscribeEvents(cb, "state_changed")`; when `event.data.entity_id`'s
   domain is in `{light, lock, cover, climate, sensor, binary_sensor, person,
   device_tracker, alarm_control_panel}` and the document is visible, arm one 2 000 ms
   timer (further events while it is armed are ignored) that then calls `refresh()` —
   a burst coalesces into one snapshot fetch at the end of the window. Unsubscribe and
   clear the timer on disconnect.
2. After every successful action in §4 (lockdown, mode, auto switch, nap/unshush, light
   toggle) `refresh()` once (services and lights: after a 500 ms delay so HA has
   applied the state).

The shell keeps the previous snapshot on a failed fetch and shows its own error alert
with Retry (§5). Re-render from the new object; do not patch DOM by hand.

**Response shape** (top-level keys, wire order). Only the keys this view uses are
typed in full; the `config` dict carries ~150 more keys (every panel setting) which the
view ignores.

```ts
interface PanelData {
  status: {
    observer:      StatusTile;   // state: "RUNNING" | "READY" | "DISABLED"
    sleep:         StatusTile;   // state: "ASLEEP" | "AWAKE"
    llm_providers: StatusTile;   // state: "<n> READY" | "UNSET"
    broadcast:     StatusTile;   // state: "ONLINE" | "UNSET"
    notify:        StatusTile;   // state: "READY" | "UNSET"
    satellites:    StatusTile;   // state: "<avail> / <total>" | "NONE"
  };
  version: string;               // integration version from manifest.json, e.g. "9.21.0"; "?" if unreadable
  meta: {
    bedrooms: number;            // count of configured bedroom areas
    areas_monitored: number;     // == areas.length
    announcements_today: number; // spoken announcements today (0 on DB error)
    est_cost: string;            // e.g. "$0.03" or "—"
    uptime: string;              // "2d 14h" | "14h 22m" | "42m 10s" | "7s" (integration process uptime)
  };
  dominant: Dominant;
  areas: AreaRow[];              // sorted: active first, then bedrooms, then name (case-insensitive)
  sleep_reason: string | null;   // non-null ONLY when status.sleep.state === "ASLEEP"
  doorbell_training: unknown;    // not used here
  doors: Record<string, boolean>;// not used here
  lockdown: Lockdown;
  intrusion: unknown;            // not used here
  knowledge: unknown;            // not used here
  suggestions: unknown[];        // not used here
  goals: unknown[];              // not used here
  config: PanelConfig;           // see below (subset)
}

interface StatusTile {
  state: string;                 // ALL-CAPS English token, see per-tile values above
  level: "live" | "warn" | "off";
}

interface Dominant {
  area_id: string | null;        // null when nobody is detected anywhere
  name: string;                  // area friendly name; or "AWAY" / "AT HOME" when area_id is null
  subtitle: string;              // "Occupied · 4m" | "Occupied" | "no presence detected"
  coord: string;                 // "#" + area_id[:8]  — HUD artefact, DO NOT RENDER
  temp: string;                  // "72°F" | "21°C" | "—"
  humidity: string;              // "44%" | "—"
  lights: string;                // "ON" | "OFF" (one light) | "2/5" (several) | "—"
  satellite: string;             // assist_satellite entity id suffix, truncated to 20 chars, or "—"
  last_motion: string;           // "12s" | "4m" | "2h" | "—"
}

interface AreaRow {
  id: string;                    // HA area_id — key for area_lights and light.turn_* target
  name: string;                  // area friendly name
  caps: Capability[];            // ordered subset of the 11 codes below; never empty (areas with no caps are not listed)
  active: boolean;               // occupied right now
  bedroom: boolean;              // area is in the configured bedroom list
  lights_on: number;
  lights_total: number;          // 0 => the area has no light.* entities
  temp: string | null;           // "72°F" / "21°C" (integer + "°" + first char of unit, "F" if unit blank)
  humidity: string | null;       // "44%"
  temp_entity: string | null;    // sensor entity id (not used here)
  humidity_entity: string | null;// sensor entity id (not used here)
  last_motion: string;           // "12s" | "4m" | "2h" | "—"  (ALWAYS a string; "—" when no presence sensor)
}

type Capability =
  | "sat"      // assist_satellite present
  | "spkr"     // media_player present
  | "mmwave"   // binary_sensor occupancy/motion/presence
  | "cam"      // camera
  | "light"    // light
  | "switch"   // switch
  | "lock"     // lock
  | "climate"  // climate
  | "door"     // binary_sensor door/window/garage_door/opening
  | "leak"     // binary_sensor moisture
  | "alarm";   // binary_sensor smoke/gas/carbon_monoxide/safety/tamper/problem
// Wire order is always: sat, spkr, mmwave, cam, light, switch, lock, climate, door, leak, alarm.

interface Lockdown {               // cognitive_core.LockdownManager.status()
  active: boolean;
  since: number;                   // epoch seconds (float); 0.0 when never engaged
  reason: string;                  // e.g. "requested from panel", "alarm armed"; "" when inactive
  auto: boolean;                   // true when engaged automatically by the alarm arming
  arm_mode?: string;               // alarm arm mode that triggered it — ABSENT in the fallback dict (manager not initialised)
  exempt_windows: number;          // windows that were already open at engage time
}

// Subset of PanelData.config this view reads (all other keys are ignored):
interface PanelConfig {
  light_control_enabled: boolean;      // default true; false => light pills are indicators only, no toggling
  operational_mode_auto: boolean;      // default true; auto away<->normal by occupancy
  notify_service: string;              // "" or e.g. "notify.mobile_app_pixel_8"
  notify_services_available: string[]; // every "notify.<svc>" HA currently has (not used here beyond display count)
  observer_enabled: boolean;           // configured on/off (status.observer tells whether it is actually running)
  announcements_enabled: boolean;      // proactive announcements master switch
  broadcast_group: string;             // media_player entity id or ""
  bedroom_areas: string[];             // area ids
  satellites: { entity_id: string; name: string; area: string }[]; // every assist_satellite.* with its area name ("" if none)
  ui_language: string;                 // "auto" or a language code — used by the shared t() loader, not by this view
  lockdown: Lockdown;                  // DUPLICATE of top-level lockdown (same function). Use the top-level one.
}
```

Status tile semantics (from `panel_data.build_snapshot_with_context`):

| tile | state | level | meaning |
|---|---|---|---|
| observer | `RUNNING` | live | observer loop is running |
| observer | `READY` | warn | enabled in config but not running (yet) |
| observer | `DISABLED` | off | observer disabled in config |
| sleep | `ASLEEP` | warn | `sleep_reason` says why (e.g. `manual nap (27min remaining)`, `wearable reports asleep`, bedroom-occupancy/quiet-hours reasons) |
| sleep | `AWAKE` | live | |
| llm_providers | `3 READY` | live | number of providers with a usable key/endpoint |
| llm_providers | `UNSET` | warn | no provider configured |
| broadcast | `ONLINE` / `UNSET` | live / warn | a broadcast speaker group is configured |
| notify | `READY` / `UNSET` | live / warn | `config.notify_service` non-empty |
| satellites | `2 / 3` | live if avail == total, warn otherwise | available / total assist_satellite entities |
| satellites | `NONE` | off | no assist_satellite entities |

The view should **not** display the raw ALL-CAPS tokens; map them to the strings in §6
and keep `level` for colour. Treat an unknown token by showing it verbatim.

**Errors**: `send_error(id, "panel_data_failed", str(exc))` — the old panel logged and
kept the previous data.

### 2.2 `jarvis/mode` — operational mode (status + set)

**Request**

```json
{ "type": "jarvis/mode", "action": "status" }
{ "type": "jarvis/mode", "action": "set", "mode": "<name>", "reason": "<optional free text>" }
```

voluptuous: `action` required, `vol.In(["status","set"])`; `mode` optional str;
`reason` optional str. The `set` branch is admin-gated (`unauthorized` error otherwise).

**Fetch policy**: `status` on first `hass`, again whenever a new snapshot (`data`)
arrives (it is cheap: in-memory dict; one call in flight at a time), and after every
`set` (the `set` response itself carries `mode_info()`). The view sends
`reason: "requested from panel"` with `set`.

**Response — `status`** (`modes.mode_info()`):

```ts
interface ModeInfo {
  active: string;                  // mode name, lowercase, e.g. "normal"
  since: number;                   // epoch seconds (float); 0.0 if never set
  reason: string;                  // e.g. "auto: home empty", "" or whatever the setter passed
  description: string;             // active mode's description (English prose from the backend)
  overrides: {
    proactive: boolean;
    banter: number | null;         // 0 | 1 | 2 | null (= keep user setting)
    announce_scope: "all" | "notable" | "critical";
    auto_actions: boolean;
    quiet: boolean;
  };
  available: { name: string; description: string }[];  // sorted by name; built-ins + user custom_modes
}
```

Built-in modes (names are stable identifiers; descriptions come from the backend and
may be shown as tooltips, untranslated): `away`, `focus`, `guest`, `lab`, `movie`,
`normal`, `party`. Users can add custom modes, so render whatever `available` returns.

**Response — `set`**: `{**set_mode_result, **mode_info()}`, i.e. the `ModeInfo` fields
above plus:

```ts
{ ok: boolean; mode?: string; error?: string }
// ok=false, error="unknown mode '<name>'" when the name is not in available.
// On success `mode` is the new active name and `active` already equals it.
```

Side effects of a successful set on the backend: a log line, `mode_scene.apply_mode_entry`
(may dim lights etc. for movie mode), and a coordinator refresh. **Errors**:
`mode_failed` (exception) or `unauthorized`.

The `operational_mode_auto` flag is read from `PanelData.config` and written with
`jarvis/update_config` (§2.4). When it is true, the backend flips between `away` and
`normal` on its own as the home empties/fills; discretionary modes (party/movie/lab/
guest/focus) are always manual.

### 2.3 `jarvis/set_lockdown` — engage / lift lockdown

**Request**

```json
{ "type": "jarvis/set_lockdown", "on": true }
```

`on` required bool. Admin only. Backend reason is fixed to `"requested from panel"`.

**Response**

```ts
{ ok: boolean; lockdown: Lockdown }   // Lockdown as in §2.1
```

`ok === false` means the request was ignored (lockdown manager / hass unavailable);
`lockdown.active` then still reflects the real state — show an error toast and render
`lockdown`. **Errors**: `lockdown_failed`.

What lockdown does (from `services.yaml`): locks every lock and closes every open door;
windows already open are left alone and counted in `exempt_windows`; a window opening
during lockdown is flagged as a breach. The alarm arming also auto-engages it
(`auto: true`). Lifting it is `on: false`.

The old panel used this WS command (never the `jarvis.lockdown` service) and patched
the switch from the response before refetching the snapshot. Do the same: apply
`res.lockdown` immediately, then refetch.

### 2.4 `jarvis/update_config` — write one setting

**Request**

```json
{ "type": "jarvis/update_config", "key": "operational_mode_auto", "value": true }
```

`key` required str, must be in `PANEL_WRITABLE_KEYS`; `value` required
`vol.Any(bool, str, int, float, list, dict, None)`. Admin only.

**Response**: `{ key: string, value: any }` — the value as applied (echo).
**Errors**: `invalid_key`, `no_entry`, `no_data`, `update_failed`.

Keys this view writes:

| key | kind (config_apply FieldSpec) | default | label |
|---|---|---|---|
| `operational_mode_auto` | bool | `true` | Automatic operational mode |

(The old dashboard also wrote `onboarding_dismissed` = true; the onboarding card is not
ported, so this view writes nothing else. `light_control_enabled` is read-only here —
it is a Settings toggle.)

### 2.5 `jarvis/area_lights` — the lights in one area

**Request**

```json
{ "type": "jarvis/area_lights", "area_id": "<AreaRow.id>" }
```

`area_id` required str. Admin only. Called when the per-area light popover opens.

**Response**

```ts
{
  area_id: string;
  name: string;                                   // area friendly name
  lights: { entity_id: string; name: string; on: boolean }[];  // sorted by name (case-insensitive); only light.* in the area, excluded entities skipped
}
```

**Errors**: `area_lights_failed`.

### 2.6 Services (`hass.callService`) — no response body; a throw means failure

| action | call |
|---|---|
| Nap 30 min | `callService("jarvis", "nap", { duration_minutes: 30 })` |
| Nap 60 min | `callService("jarvis", "nap", { duration_minutes: 60 })` |
| Unshush all (= wake / resume) | `callService("jarvis", "unshush", {})` — no arguments clears every mute and any nap |
| All lights in an area off | `callService("light", "turn_off", {}, { area_id })` — note the 4th `target` argument |
| All lights in an area on | `callService("light", "turn_on", {}, { area_id })` |
| One light toggle | `callService("light", on ? "turn_off" : "turn_on", { entity_id })` |

`jarvis.nap` (services.yaml): "Suppress non-critical announcements for a set duration.
Critical events (smoke, leak, forced entry) still break through." `duration_minutes`
1–480, default 30. A nap makes `status.sleep` read `ASLEEP` with `sleep_reason`
`manual nap (<n>min remaining)` on the next snapshot. `jarvis.unshush`: "Undo a shush.
With no arguments, clears all mutes."

There is no `jarvis.wake` service; "Unshush all" is the resume action.

### 2.7 Not used by this view (documented so nobody re-adds them by accident)

`jarvis/get_activity_log`, `jarvis/get_cognitive_status`, `jarvis/run_analysis`,
`jarvis/get_area_sparklines`, `jarvis/goal_action`, `jarvis/camera_snapshot`,
`auth/sign_path`, `jarvis.briefing`, `jarvis.observer_status`. See §7.

---

## 3. Layout

Use HA's own look through the panel's design system (DESIGN.md): every card is a
`<jv-section>` (HA's card surface), colours only through the `--jv-*` tokens of
`src/theme/tokens.ts` (which map to HA's theme variables — `--jv-ok` ← `--success-color`,
`--jv-warn` ← `--warning-color`, `--jv-danger` ← `--error-color`, …), state pills via
`<jv-state-badge>`, key/value rows via `<jv-kv>`. No literal colours, no fonts, no
scanlines. Icons via `<ha-icon icon="mdi:...">` when defined. Status levels map to:
`live` → `ok`, `warn` → `warn`, `off` → `neutral`. Lockdown engaged uses `danger`.

Grid: the shared `.jv-grid` (responsive columns); single column when `narrow` is true.
Order below is also the mobile order (top = primary).

### 3.1 Header row (not a masthead — plain toolbar height)

* No view title (the shell's tab bar names the view).
* A full-width **lockdown bar**: icon, `Lockdown: Engaged` / `Lockdown: Off`, secondary
  text, and the **Lockdown switch** (`ha-switch`, or a native `role="switch"` checkbox)
  with `aria-label` "Lockdown"; danger tint when engaged; `aria-live="polite"`. Tooltip:
  "Lockdown engaged — tap to lift" / "Tap to engage lockdown". When `lockdown.auto`
  is true add secondary text "engaged automatically (alarm armed)" and when
  `lockdown.reason` is non-empty show it as secondary text. Show "since <relative
  time>" from `lockdown.since` when active.

The switch is disabled until the first snapshot has arrived. On mobile the bar stays
first.

### 3.2 Card "Status" (primary)

Six tiles in a 2- or 3-column mini-grid, each: coloured dot (level), label, value:

| label | value source | secondary |
|---|---|---|
| Sleep | AWAKE → "Awake", ASLEEP → "Asleep" | `sleep_reason` when asleep |
| Observer | RUNNING → "Running", READY → "Ready", DISABLED → "Disabled" | — |
| LLM providers | "<n> READY" → "<n> ready", UNSET → "Not set" | — |
| Lockdown | `lockdown.active` → "Engaged" / "Off" (level: active → treat as `warn` colour but use `--error-color`) | reason |
| Satellites | "a / t" → "a / t online", NONE → "None" | up to 3 `config.satellites[].name` joined by ", " then "+N" |
| Notify target | READY → `config.notify_service` as-is, UNSET → "Not set" | — |

Also show Broadcast (ONLINE → "Online", UNSET → "Not set") as a seventh tile if space
allows; it was in the old status list.

Card footer (secondary text, one line, wraps): "Bedrooms <meta.bedrooms> · Areas
monitored <meta.areas_monitored> · Announcements today <meta.announcements_today> ·
Uptime <meta.uptime> · v<version>". Omit `est_cost` unless it is not "—" (then append
"· Est. cost <est_cost>").

### 3.3 Card "Operational mode"

* Heading "Operational mode", right-aligned chip with the active mode name
  (capitalised, e.g. "Normal").
* Secondary text: `ModeInfo.description` (backend English prose) and, when `reason`
  is non-empty, "since <relative since> · <reason>".
* Chip row: one `ha-chip`/button per `available[]` entry, active one filled; tooltip =
  that mode's description. Clicking a non-active chip calls `set` (§4.2).
* Row with `ha-switch` labelled "Follow occupancy automatically" bound to
  `config.operational_mode_auto`, helper text "Switches between Away and Normal as the
  home empties and fills. Party, Movie, Lab, Guest and Focus are always manual."

### 3.4 Card "Right now" (dominant area)

* Heading "Right now".
* Big line: `dominant.name` (when `area_id` is null: "AWAY" → "Nobody home",
  "AT HOME" → "Someone is home"); secondary `dominant.subtitle` ("no presence detected"
  → "No presence detected").
* Four small stats: Temperature `temp`, Humidity `humidity`, Lights `lights`, Last
  motion `last_motion`; a fifth "Satellite" `satellite` only when not "—".
* Never render `coord`.
* Clicking the card when `area_id` is set opens that area's detail dialog (§3.6).

### 3.5 Card "Quick actions"

Three `ha-button`s in a wrap row: "Nap 30 min", "Nap 60 min", "Unshush all". Tooltips:

* Nap: "Mute JARVIS's non-critical announcements for 30 minutes. Does not change
  lights, covers or locks. Safety alerts still come through." (60 for the second)
* Unshush all: "Cancel any active nap or shush and resume normal announcements."

When `status.sleep.state === "ASLEEP"` and `sleep_reason` starts with "manual nap",
show that reason next to the buttons so the user sees the remaining time.

### 3.6 Card "Areas" + area detail dialog

Heading "Areas" with right-side count "<occupied> occupied · <total>" where occupied =
`areas.filter(a => a.active).length`, total = `areas.length`.

Area tile grid (`minmax(150px, 1fr)`, 8 px gap; 2 columns on narrow). Each tile is a
button (`role="button"`, `tabindex=0`, Enter/Space opens the dialog, `aria-label`
"<name> details" followed by ", Occupied" / ", Vacant", ", Bedroom" and the readings —
an `aria-label` replaces the name computed from the content, so the state must be
folded into it rather than placed in a visually-hidden span):

* Top row: capability icons (max 5, then "+N"), each `ha-icon` with `title` = §6
  capability label. Icon map: sat `mdi:microphone`, spkr `mdi:speaker`, mmwave
  `mdi:motion-sensor`, cam `mdi:cctv`, light `mdi:lightbulb`, switch
  `mdi:toggle-switch`, lock `mdi:lock`, climate `mdi:thermostat`, door
  `mdi:door`, leak `mdi:water-alert`, alarm `mdi:smoke-detector`.
* Readings row (only if `temp` or `humidity` non-null): `temp`, `humidity`.
* Footer: area `name` (ellipsis), occupancy dot (`active` → `--success-color`,
  else `--disabled-text-color`), bedroom badge `mdi:bed` when `bedroom`, and the
  **light pill** when `lights_total > 0`: `<lights_on>/<lights_total>` with a lit
  style when `lights_on > 0`. Tooltip "<on>/<total> lights on" + " — tap to toggle"
  when `config.light_control_enabled !== false`. The pill is a nested button that
  stops propagation and opens the lights popover (§3.7) when light control is enabled;
  otherwise it is a static indicator.

Active tiles come first already (backend sort); do not re-sort.

**Area detail dialog** (`ha-dialog`, or an inline overlay if `ha-dialog` is not
defined — see §8): heading = `name`, status chip "Occupied" / "Vacant", bedroom badge,
rows: Temperature, Humidity (only when present), Lights (the same pill, opens the
popover), Last motion (`last_motion`, hide when "—"), Capabilities (comma-separated §6
labels, or "—"). Close button "Close"; backdrop click closes.

### 3.7 Lights popover (per area)

Opened from a light pill. Title = area name (updated from `area_lights.name`), list of
rows each a button: dot, `name`, "On"/"Off"; tapping a row toggles that light
(optimistic flip, then refetch after 500 ms). Footer button "Turn all off", disabled
when no light is on. Body states: "Loading lights…" until the WS answers; "No
controllable lights in this room." when `lights` is empty. Closing: "Close" button or
backdrop.

---

## 4. Actions

Feedback uses HA's standard toast: `this.dispatchEvent(new CustomEvent("hass-notification",
{ detail: { message }, bubbles: true, composed: true }))`. Errors show
`err.message || String(err)` appended after an em-dash, as the old panel did. The
texts below are the `message` values (§6 lists them as strings).

| # | action | trigger | call | confirm? | in flight | success | failure |
|---|---|---|---|---|---|---|---|
| 4.1a | Engage lockdown | lockdown switch, currently off | `jarvis/set_lockdown {on:true}` | **Yes** — `ha-dialog`/`confirm`: "Engage lockdown? JARVIS will lock every lock and close every open door. Windows already open are left as they are." Buttons "Engage" / "Cancel". (New: the old panel had no confirmation, but this actuates the home.) | switch disabled | apply `res.lockdown`, toast "Lockdown engaged", refetch snapshot | if `res.ok === false`: toast "Lockdown request was not accepted"; on throw: toast "Lockdown failed — <msg>"; switch reverts to `lockdown.active` |
| 4.1b | Lift lockdown | switch, currently on | `jarvis/set_lockdown {on:false}` | No | same | toast "Lockdown lifted" | "Lockdown failed — <msg>" |
| 4.2 | Set mode | mode chip (not the active one) | `jarvis/mode {action:"set", mode}` | No | all chips disabled | if `res.ok`: toast "<Mode> mode" (e.g. "Movie mode"), render returned ModeInfo, refetch snapshot; if `res.ok === false`: toast "Mode change failed — <res.error>" | toast "Mode change failed — <msg>"; re-enable chips |
| 4.3 | Auto mode toggle | ha-switch in mode card | `jarvis/update_config {key:"operational_mode_auto", value: <bool>}` | No | switch disabled | render `res.value`, toast "Automatic mode on" / "Automatic mode off", refetch | toast "Couldn't save — <msg>", switch reverts |
| 4.4 | Nap 30 / Nap 60 | buttons | `jarvis.nap {duration_minutes: 30|60}` | No | button disabled | toast "Napping for 30 minutes" / "…60 minutes", refetch after 500 ms | toast "Nap failed — <msg>" |
| 4.5 | Unshush all | button | `jarvis.unshush {}` | No | button disabled | toast "Announcements resumed", refetch after 500 ms | toast "Unshush failed — <msg>" |
| 4.6 | Open area detail | area tile click / Enter / Space; dominant card click | none (local state `expandedAreaId`) | No | — | dialog shows the matching `AreaRow`; if the id is no longer in `areas` after a refetch, close it | — |
| 4.7 | Open lights popover | light pill (only when `light_control_enabled !== false`) | `jarvis/area_lights {area_id}` | No | "Loading lights…" | render `lights`; ignore the response if the user closed/switched area meanwhile | set `lights = []`, toast "Couldn't load lights — <msg>" |
| 4.8 | Toggle one light | popover row | `light.turn_on` / `light.turn_off {entity_id}` | No | optimistic flip | refetch snapshot after 500 ms | toast "Light failed — <msg>", revert row |
| 4.9 | Turn all off | popover footer | `light.turn_off {} target {area_id}` | No | button disabled | mark all rows off, toast "<Area> lights off", close popover, refetch after 500 ms | toast "<Area> lights — <msg>" |

Rules carried over from the old code: a light pill click must `stopPropagation()` so it
doesn't also open the detail dialog; when light control is disabled the pill has no
click handler at all; mode chip clicks on the already-active mode are no-ops.

---

## 5. States

| state | when | what the user sees |
|---|---|---|
| **Loading (first)** | no snapshot yet | skeleton `<jv-section loading>` cards for System Status, Operational Mode, Right now, Areas (grey blocks; no mock data — the old `_mockData` is gone) and the header lockdown switch disabled |
| **Loaded** | snapshot present | §3 |
| **Refreshing** | later polls | no spinner; render in place when the new object arrives (Lit re-render; no DOM patching) |
| **Error (snapshot)** | a `get_panel_data` fetch throws | owned by the **shell**, for every view: an `ha-alert alert-type="error"` titled "Could not load JARVIS data" (styled fallback without HA elements) with the error message and a "Retry" button; the last snapshot (if any) stays rendered and polling keeps running; the alert clears on the next success. The view itself renders no error card (the strings "Couldn't load JARVIS status —" / "Connection to JARVIS lost — retrying…" are not used) |
| **Mode unavailable** | `jarvis/mode status` throws (e.g. HA not restarted after update) | Mode card body: "Couldn't load modes — restart Home Assistant after updating."; chips hidden |
| **Empty areas** | `areas.length === 0` | Areas card body: "No areas with JARVIS-relevant devices yet. Assign satellites, speakers, presence sensors or lights to Home Assistant areas." |
| **Nobody home** | `dominant.area_id === null` | Right-now card shows "Nobody home" / "Someone is home" + "No presence detected"; stats show "—" |
| **No satellites** | `status.satellites.state === "NONE"` | tile value "None", level `off` |
| **Light control disabled** | `config.light_control_enabled === false` | pills are static, tooltip without "tap to toggle", popover never opens |
| **Action in flight** | §4 | the triggering control is disabled; nothing else blocks |
| **Not admin** | any `unauthorized` error | toast "Administrator privileges are required for this action" and the control reverts (should not happen: the panel is admin-only) |

Lit housekeeping: clear the nudge timer and the `state_changed` subscription in
`disconnectedCallback`; re-subscribe in `connectedCallback` / when `hass` arrives. (The
20 s interval belongs to the shell.)

---

## 6. Strings

All user-visible English strings go through `t(key)` where `key` is the exact English
string (the existing i18n mechanism: `/jarvis_panel_static/i18n/<lang>.json`, keyed by
English, fallback = the key). Checked against `de.json`, `fr.json`, `es.json`
(337 keys each, identical key sets). "✓" = already translated in those files (reuse the
key byte-for-byte); "new" = falls back to English until Phase 3 adds translations.
Phase 3 did: every panel key is now translated in all 22 language files
(`frontend/i18n-missing.json`), and `npm run i18n:keys` lists the keys the code
actually uses (e.g. `Nap 30 min` / `Nap 60 min`, `Notify target`, `Est. cost`,
`since {time}`, `{name} details`, `No areas yet`, `Bedroom`).

Dynamic values (`<n>`, names, temps, times) are interpolated **outside** `t()`; never
build a key with a number in it.

### Headings / labels

| key | status |
|---|---|
| `Overview` | new |
| `System Status` | ✓ (use as the Status card heading) |
| `Sleep` | new |
| `Observer` | ✓ |
| `LLM Providers` | new |
| `Broadcast` | new |
| `Notify` | new (tile label; or the longer new key `Notify target`) |
| `Satellites` | new |
| `Lockdown` | ✓ |
| `Bedrooms` | ✓ |
| `Areas Monitored` | new |
| `Announcements Today` | new |
| `Uptime` | new |
| `Operational Mode` | ✓ |
| `Mode` | ✓ |
| `AUTO · follow occupancy` | ✓ (exists; prefer the clearer new key `Follow occupancy automatically`) |
| `Quick Actions` | ✓ |
| `Briefing` | ✓ (not used — dropped) |
| `Unshush All` | ✓ |
| `Nap 30m` / `Nap 60m` | new (or new `Nap 30 min` / `Nap 60 min`) |
| `Areas` | new |
| `Right now` | new |
| `Temperature` | ✓ |
| `Humidity` | ✓ |
| `Lights` | ✓ |
| `Last motion` | ✓ |
| `Capabilities` | ✓ |
| `Light Control` | ✓ (not needed here) |
| `Close` | new |
| `Turn all off` | new |
| `Retry` | new |

### State words

| key | status |
|---|---|
| `ON` / `OFF` | ✓ |
| `OCCUPIED` | ✓ (de "Belegt") — prefer new `Occupied` / `Vacant` in Title case |
| `Awake` / `Asleep` | new |
| `Running` / `Ready` / `Disabled` | new |
| `Online` / `Not set` / `None` | new |
| `Engaged` | new |
| `Nobody home` / `Someone is home` / `No presence detected` | new |
| `Loading...` | ✓ (three ASCII dots) |
| `Loading lights…` | new |
| `No controllable lights in this room.` | new |
| `No satellites found` | ✓ |
| `ERROR` | ✓ |

### Tooltips / helper text (new unless noted)

* `Lockdown engaged — tap to lift`
* `Tap to engage lockdown`
* `engaged automatically (alarm armed)`
* `Engage lockdown? JARVIS will lock every lock and close every open door. Windows already open are left as they are.`
* `Engage` / `Cancel`
* `Switches between Away and Normal as the home empties and fills. Party, Movie, Lab, Guest and Focus are always manual.`
* `Mute JARVIS's non-critical announcements for 30 minutes. Does not change lights, covers or locks. Safety alerts still come through.` (and the 60-minute variant)
* `Cancel any active nap or shush and resume normal announcements.`
* `lights on` (suffix after "<on>/<total>") and `— tap to toggle`
* `No areas with JARVIS-relevant devices yet. Assign satellites, speakers, presence sensors or lights to Home Assistant areas.`
* `Couldn't load JARVIS status —`
* `Connection to JARVIS lost — retrying…`
* `Couldn't load modes — restart Home Assistant after updating.`
* `Administrator privileges are required for this action`

### Capability labels (new; codes are wire values, labels are display)

`sat` → `Satellite` (✓ as `SATELLITE`), `spkr` → `Speaker`, `mmwave` → `Presence`,
`cam` → `Camera`, `light` → `Lights` (✓), `switch` → `Switch`, `lock` → `Lock`,
`climate` → `Climate`, `door` → `Door`, `leak` → `Leak`, `alarm` → `Alarm`.

### Toasts (new)

`Lockdown engaged`, `Lockdown lifted`, `Lockdown request was not accepted`,
`Lockdown failed —`, `mode` (suffix: "<Mode> mode"), `Mode change failed —`,
`Automatic mode on`, `Automatic mode off`, `Couldn't save —`,
`Napping for 30 minutes`, `Napping for 60 minutes`, `Nap failed —`,
`Announcements resumed`, `Unshush failed —`, `Couldn't load lights —`,
`Light failed —`, `lights off` (suffix: "<Area> lights off").

Mode names (`normal`, `away`, …) and descriptions, `sleep_reason`, `lockdown.reason`,
`notify_service`, area names and `dominant.subtitle` are backend/HA values: display as
received (capitalise mode names), never translate.

---

## 7. Dropped to Phase 3

| old dashboard feature | why not now |
|---|---|
| Masthead (brand, version badge, `[ STATUS: NOMINAL ]`, clock, greeting + honorific, global search) | HUD chrome; the shell owns navigation and HA already shows time. Version moves to the Status footer. |
| Reactor ring / radial gauges / radar sweep / scanlines / Google Fonts | explicitly out of scope — HA theme instead |
| Demo room rotation + `_mockData` fallback | fake data before the first fetch is misleading; skeletons instead |
| Camera Watch (stream/still/WS-snapshot fallback chain, DIAG, `jarvis_camera_event` focus) | large, camera-specific; now the Cameras view (cameras.md) |
| Activity Feed (`jarvis/get_activity_log hours:2 limit:30`, search box) | now the Logs view's Activity Feed (logs.md) |
| Cognitive Core readout (`jarvis/get_cognitive_status`: learning.days_of_data/state_changes/commands/suggestions, ignore_rules, last_analysis.ts/patterns_found/new_suggestions) | diagnostics, not at-a-glance status; now on the Logs view (Cognitive Core card) and the Suggestions view's learning card |
| "Analyze Now" (`jarvis/run_analysis` → `{ran, reason?, patterns_found?, new_suggestions?, near_misses?, diagnostic?, backfill?}`) | now on the Suggestions view (suggestions.md) |
| "Briefing" (`jarvis.briefing`) and "Status Dump" (`jarvis.observer_status`) quick actions | not in the overview brief (status/mode/lockdown/nap); now the Settings › General "Briefings" and "Diagnostics" tool cards (settings-tools.md §4.16, §4.18) |
| Goals card (`jarvis/goal_action create/cancel/delete`, `goals[]`) | own feature; now on the Suggestions view |
| Onboarding welcome card (`config.onboarding {show, steps[], done_count, total}`, writes `onboarding_dismissed`) | first-run guidance with jumps into Settings cards that don't exist yet in the new panel |
| Area temp/humidity sparklines (`jarvis/get_area_sparklines` → `{sparklines: {area_id: {temp?: number[], humidity?: number[]}}}`, polled every 300 s) | extra recorder query; nice-to-have trend, not status |
| Lockdown tile text `ARMED`/`OFF`, status badge `LOCKDOWN`/`NOMINAL` | replaced by the switch + "Engaged"/"Off" |
| Hamburger `hass-toggle-menu` button | shell concern |

---

## 8. Risks

1. **`lockdown.arm_mode` is optional.** `LockdownManager.status()` returns it, but the
   fallback dict used when the manager isn't initialised (`panel_data._get_lockdown_status`
   / `cognitive_core.lockdown_status`) omits it. Treat as `string | undefined`.
2. **`set_lockdown` can answer `ok:false` with a 200-style result** (manager or hass
   missing). The switch must follow `res.lockdown.active`, not the requested value.
3. **`jarvis/mode set` merges two dicts**: `{**set_mode_result, **mode_info()}`. On an
   unknown mode `set_mode` returns `available` as a *list of strings*, but `mode_info()`
   overwrites it with the list of `{name, description}` objects, so `available` is
   always the object list. `ok`/`error` survive. Don't rely on `mode` being present on
   failure.
4. **`jarvis/mode` is not `require_admin` as a whole**; only `set` is gated and answers
   `unauthorized`. Harmless here (panel is admin-only) but handle the error code.
5. **`dominant.coord`** is `"#" + area_id[:8]` — looks like data, is a HUD prop. Never
   render. `dominant.satellite` is the entity-id suffix truncated to 20 characters, not a
   friendly name.
6. **`AreaRow.last_motion` is `"—"` (never null) when absent**, while `temp`/`humidity`
   are `null`. `Dominant.*` use `"—"` everywhere. Normalise in one helper.
7. **Temperature unit heuristic**: backend formats `int(round(v)) + "°" + unit[0]`, and
   defaults to `F` when the sensor has no unit. The view must not re-format or convert.
8. **Status tokens are English ALL-CAPS strings** used as enums; `llm_providers.state`
   and `satellites.state` embed numbers (`"3 READY"`, `"2 / 3"`). Parse with a regex
   (`/^(\d+) READY$/`, `/^(\d+) \/ (\d+)$/`) and fall back to showing the raw token.
9. **`config` is huge (~150 keys, includes base64 floor-plan images in
   `floor_plan_bg`)** and is sent on every 20 s poll. The view only reads the handful
   of keys in §2.1; do not store `config` in reactive state wholesale — pick the fields
   you need so Lit's change detection stays cheap.
10. **`config.lockdown` duplicates top-level `lockdown`.** Use the top-level one.
11. **Realtime refresh storm**: `state_changed` fires for every sensor in the house;
    the 2 s trailing throttle is load-bearing. Also every fetch triggers `recorder`-free
    but registry-heavy work on the backend (`_entities_in_area` iterates the whole
    entity registry per area), so do not poll faster than 20 s.
12. **Services have no result**: `jarvis.nap`/`jarvis.unshush` only throw on failure;
    the sleep tile updates on the next snapshot (hence the 500 ms delayed refetch).
13. **`ha-dialog`, `ha-switch`, `ha-chip`, `ha-alert` availability**: these are
    defined by the HA frontend globally but some are lazy-loaded (dialogs in
    particular). Guard with `customElements.get("ha-dialog")` and fall back to a simple
    inline overlay (position: fixed, backdrop) if undefined.
14. **i18n key drift**: the shared `t()` must keep the exact old keys (`System Status`,
    `Operational Mode`, `Last motion`, `Capabilities`, `ON`/`OFF`, `Loading...` with
    ASCII dots) to reuse the 22 language files; new keys silently stay English.
15. **Mode set side effects**: `mode_scene.apply_mode_entry` can dim lights / change
    media players for `movie`; the chip tooltip (backend description) is the only
    warning the user gets. No confirmation was deemed necessary (same as old panel).
16. **Lockdown confirmation is a new behaviour** (old masthead toggled instantly).
    If the owner prefers the instant toggle, drop the dialog in 4.1a; nothing else
    depends on it.
