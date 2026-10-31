# Intrusion view — specification

Derived from the old panel's `intrusion` tab (`custom_components/jarvis/frontend/jarvis-panel.js`,
markup at `_html()` ~L5703, logic in `_fetchIntrusion / _renderIntrusion / _wireIntrusionLog /
_fetchIntrusionLog / _renderIntrusionLog / _wireIntrusionLabels / _signedUrl / _signSnapshotImgs`).
The view agent should not need the old file; everything it does is recorded here.

Route: `/jarvis/intrusion` (panel `route.path === "/intrusion"`). Admin-only (the whole panel is
`require_admin=True`), so every admin-gated branch below is always available.

Implementation: `<jarvis-view-intrusion>` (`src/views/intrusion.ts`) with `src/views/intrusion/`:
`settings.ts` (`<jv-intrusion-settings>`, the four settings), `log.ts` (`<jv-intrusion-log>`, Card 2),
`snapshot.ts` (`<jv-intrusion-snapshot>`, a signed still with its full-size dialog) and `shared.ts`.

---

## Purpose

One place to see whether JARVIS currently thinks someone is in the house, to respond to that
alert (hold escalation / call it off as a false alarm), to review the history of intrusion events
with their camera stills, to label each event REAL or FALSE ALARM (the training signal that damps
low-confidence alerts for patterns the household keeps calling benign), and to tune the four
intrusion settings that the old tab exposed.

Backend module: `custom_components/jarvis/intrusion.py` (snapshots, call-off, acknowledge, event
log, learning). Live investigation state: `cognitive_core.intrusion_status()` and
`cognitive_core.lockdown_status()` via the panel snapshot.

---

## Data

All commands go through the panel's `ws()` helper (`this.ws` / `ws(hass, …)` from `src/ws.ts`, which
wraps `hass.callWS` and rejects with a `WsError {code, message}`). Every `ts` field is **epoch seconds** (not ms): multiply
by 1000 before `new Date()`. Format dates with the HA locale (`hass.locale`), never
`toLocaleString()` bare.

### D1. `jarvis/intrusion` — one command, six actions

Registered in `websocket.py` as `ws_intrusion`. Request schema (voluptuous):

```python
{
    vol.Required("type"): "jarvis/intrusion",
    vol.Required("action"): vol.In(["status", "dismiss", "acknowledge", "log", "label", "learning"]),
    vol.Optional("reason"): str,
    vol.Optional("event_id"): str,
    vol.Optional("label"): vol.Any(str, None),
    vol.Optional("limit"): int,
}
```

Admin-gated branches: `dismiss`, `acknowledge`, `label`, `log` (a non-admin receives
`send_error(code="unauthorized", "administrator privileges are required for this action")`).
`status` and `learning` are open, but `status` for a non-admin is redacted (no `last_snapshot`).
Since the panel is admin-only, the view always sees the full shapes below.

Any exception inside the handler is returned as `send_error(code="intrusion_failed", message=str(exc))`
— `hass.callWS` rejects with `{code, message}`.

#### `status()` — the shared status dict

Returned alone by `action:"status"` and spread into the `dismiss` and `acknowledge` responses.

| field | type | meaning |
|---|---|---|
| `last_snapshot` | `null \| {path: str, url: str, camera: str, ts: int}` | most recent intrusion still captured this run (module-level, **not persisted across HA restarts**). `url` is `/api/jarvis/snapshot/intrusion/<tag>_<camera-slug>_<ts>.jpg` — must be signed (D4) before use as `<img src>`. `path` is the server filesystem path: never render it. `camera` is an entity id like `camera.front_door`. |
| `called_off` | bool | a user call-off is currently suppressing escalation (10-min cooldown) |
| `acknowledged` | bool | a user acknowledgement (5-min window) is holding the no-response auto-escalation |
| `suppressed_for` | int (seconds, ≥0) | seconds left on the call-off cooldown; 0 when not called off |
| `false_alarms_24h` | int | call-offs recorded in the last 24 h (module-level, not persisted) |

Note: `status()` says nothing about whether an investigation is *active* — that comes from the
panel snapshot (D2).

#### `action: "status"`
Request `{type:"jarvis/intrusion", action:"status"}` → response = `status()` above.

#### `action: "dismiss"` (call off as false alarm)
Request `{type:"jarvis/intrusion", action:"dismiss", reason:"panel"}` (`reason` optional, default
`"panel"`). Side effects: 10-min escalation suppression, false-alarm record, decision-record
outcome "wrong", clears `safety_mgr._investigation` (so the snapshot's `intrusion.active` becomes
false on the next poll), `jarvis_log("SAFETY", …)`.

Response: `{ok: true, suppressed_seconds: 600, recorded: {ts: int, reason: str, camera: str}, ...status()}`.

#### `action: "acknowledge"` ("I'm looking — hold")
Request `{type:"jarvis/intrusion", action:"acknowledge", reason:"panel"}`. Holds the no-response
auto-escalation for 300 s **without** suppressing evidence-based escalation (a confirmed person on
camera still alerts). Does NOT clear the investigation.

Response: `{ok: true, held_seconds: 300, ...status()}`.

#### `action: "log"`
Request `{type:"jarvis/intrusion", action:"log", limit: 40}` (`limit` optional, default 50,
clamped to 1..200 server-side; the old panel sent 40). The log is persisted in
`<config>/jarvis/intrusion_log.json`, max 200 events.

Response:
```ts
{
  events: IntrusionEvent[],   // most recent FIRST
  learning: LearningSummary,
}
```

`IntrusionEvent` (produced by `intrusion.record_event`):

| field | type | notes |
|---|---|---|
| `id` | str | `"evt_<int ts>_<n>"` — the key for `label` |
| `ts` | float | epoch seconds |
| `kind` | str | `"investigating" \| "unresolved" \| "confirmed" \| "false_alarm"` (docstring lists `false_alarm`; only the first three are ever written by `cognitive_core` today — render unknown kinds generically) |
| `reason` | str | free text, e.g. `"motion while away"`, `"vision shows no one at the breach"`, `"damped (learned benign)"`, `"no response; unconfirmed activity"`, or the vision confirmation reason. May be `""`. |
| `breach` | str | human breach point name (`breach_name`), may be `""` |
| `breach_area` | str | HA area id of the breach, may be `""` |
| `camera` | str | camera entity id or `""` |
| `snapshot_url` | str | `/api/jarvis/snapshot/intrusion/…jpg` or `""` (must be signed, D4). Only `confirmed`/`unresolved` events normally carry one. |
| `snapshot_path` | str | server filesystem path — **never render** |
| `zones` | str[] | zone names the activity reached |
| `max_depth` | int \| null | rooms-deep the activity reached |
| `label` | `null \| "real" \| "false"` | user verdict |
| `labeled_ts` | float | **only present once the event has been labelled at least once** (stays after CLEAR) |
| `pattern` | str | `"<area-or-camera>|<3h-bucket>"` learning key (internal; may be shown in a tooltip, not needed) |

`LearningSummary` (`intrusion.learning_summary()`):

| field | type | notes |
|---|---|---|
| `events` | int | total events in the log |
| `labeled` | int | events with a non-null label |
| `patterns` | `{[pattern: str]: {false: int, real: int}}` | per-pattern label counts (all-time, note: *not* windowed, unlike damping itself) |
| `damped_patterns` | str[] | patterns currently damped (≥3 false, 0 real) |
| `min_false_to_damp` | int | 3 |

#### `action: "label"`
Request `{type:"jarvis/intrusion", action:"label", event_id: str, label: "real" | "false" | ""}`.
`""` (or `null`) clears the label. Any other string → `{ok:false, error:"label must be 'real' or 'false'"}`.

Response: `{ok: true, id: str, label: "real"|"false"|null, learning: LearningSummary}`
or `{ok: false, error: "event not found" | "label must be 'real' or 'false'", learning: LearningSummary}`.
**A failed label is a successful WS result with `ok:false`, not a WS error** — check `ok`.

#### `action: "learning"`
Request `{type:"jarvis/intrusion", action:"learning"}` → `LearningSummary`. The old tab never
called it (it takes `learning` from the `log` response); the new view needn't either.

### D2. `jarvis/get_panel_data` — fields this view reads

Request `{type:"jarvis/get_panel_data"}` (no args). The shell fetches this on a 20 s poll and
should hand the view the snapshot; the view does not need its own call. Fields used:

```ts
snapshot.intrusion: {                      // cognitive_core.intrusion_status()
  active: boolean,                         // an investigation is open
  confirmed: boolean,                      // it has escalated (person confirmed / inward route)
  breach_area?: string|null,               // only present when active
  breach_name?: string|null,               // only present when active
  path?: string[],                         // area ids the activity traversed, only when active
  zones?: string[],                        // sorted zone names, only when active
}
snapshot.lockdown: {                       // cognitive_core.lockdown_status()
  active: boolean,
  since: number,                           // epoch seconds, 0.0 when inactive
  reason: string,                          // "" when inactive
  auto: boolean,                           // engaged automatically vs by user
  arm_mode: string,                        // present only when a LockdownManager exists (fallback dict omits it)
  exempt_windows: number,
}
snapshot.config: {
  intrusion_response_timeout: number,      // seconds, default 120
  intrusion_vision_confirm: boolean,       // default true
  intrusion_vision_veto: boolean,          // default true
  intrusion_requires_confinement: boolean, // default false
  // ...many other keys, ignore
}
```

Fallback shapes when the core is not up: `intrusion = {active:false, confirmed:false}`,
`lockdown = {active:false, since:0.0, reason:"", auto:false, exempt_windows:0}`. Treat every
optional field as possibly missing.

### D3. `jarvis/update_config` — the four settings

```python
{
    vol.Required("type"): "jarvis/update_config",
    vol.Required("key"): str,
    vol.Required("value"): vol.Any(bool, str, int, float, list, dict, None),
}
```
`@require_admin`. Response `{key: str, value: <echo of what you sent>}`. Errors:
`invalid_key` (not in `PANEL_WRITABLE_KEYS`), `no_entry`, `no_data`, or the exception text.
**No server-side coercion**: `config_apply.async_apply` stores the value exactly as sent
(the old panel sent `"120"` as a *string* from a `<select>`; send a real `Number` instead).

Keys written by this view (`config_apply.CONFIG_FIELDS`, category `safety`):

| key | kind | default | bounds | label (FieldSpec) | exposed as HA entity |
|---|---|---|---|---|---|
| `intrusion_response_timeout` | int (seconds) | 120 | 30..900 step 30 | Intrusion response timeout (s) | yes (`number.*`) |
| `intrusion_vision_confirm` | bool | true | — | Intrusion vision confirm | yes (`switch.*`) |
| `intrusion_vision_veto` | bool | true | — | Intrusion vision veto | yes (`switch.*`) |
| `intrusion_requires_confinement` | bool | false | — | Intrusion requires confinement | no |

The old tab offered the timeout as a select with exactly these choices:
`60 → "1 min"`, `120 → "2 min"`, `180 → "3 min"`, `300 → "5 min"`, `600 → "10 min"`.
Keep that select (a saved value outside the list, e.g. 90 set via the HA number entity, must
still be shown — add it as an extra option labelled `"<n> s"` rather than silently snapping).

After a successful write the backend refreshes the coordinator and fires
`SIGNAL_CONFIG_CHANGED`; the next `get_panel_data` poll reflects it. Update local state
optimistically from the echoed `value`.

### D4. `auth/sign_path` — snapshot images

An `<img src>` cannot carry the bearer token and `/api/jarvis/snapshot/...` requires auth. For
every `url` / `snapshot_url` that starts with `/api/`:

```js
const res = await hass.callWS({ type: "auth/sign_path", path, expires: 300 });
img.src = res.path;   // e.g. "/api/jarvis/snapshot/intrusion/x.jpg?authSig=…"
```
On signing failure, or for a non-`/api/` path (legacy `/local/...`, `data:`), fall back to the
raw path. Signed URLs expire after 300 s: re-sign when the list is re-fetched (do not cache signed
URLs across refreshes). The view at `/api/jarvis/snapshot/{kind}/{filename}` answers
`image/jpeg` with `Cache-Control: no-store`, 404 when the file was pruned (the backend keeps only
the last 40 stills, and the log keeps 200 events — so **old events will often reference a 404
snapshot**; render the `<img>` with an `onerror` that hides it / shows a "snapshot expired"
placeholder).

### D5. Services

The old intrusion tab called **no** `hass.callService`. None are needed.

### D6. Live refresh (not in the old tab)

The backend fires HA bus events `jarvis_intrusion_confirmed` and `jarvis_intrusion_unresolved`
with `{reason, snapshot_url, snapshot_path, camera}`. The view subscribes to both
(`hass.connection.subscribeEvents(cb, type)`, once, when `hass` first arrives; unsubscribed on
disconnect) and on either event re-reads `status`, reloads the log and asks the shell for a new
snapshot (`refresh()`). Polling (below) still covers everything else.

### Fetch / refresh schedule

| data | when |
|---|---|
| `intrusion status` | when `hass` first arrives; after `dismiss`; after `acknowledge`; on a bus event (D6); on every new panel snapshot (the shell's 20 s tick), at most once per 5 s, silently (a failed silent re-read keeps the last status). Between reads the card counts `suppressed_for` down locally once a second. |
| `intrusion log` | on view connect; on the Refresh button; after a call-off; on a bus event; after every `label` call the one event is patched from the `label` response and `learning` replaced from it (no full re-fetch, so images are not re-signed). |
| `get_panel_data` (`intrusion`, `lockdown`, `config`) | provided by the shell's 20 s poll; also re-request right after a successful `update_config`. |
| `auth/sign_path` | each time an image element is (re)rendered with an unsigned `/api/` path. |

---

## Layout

Two-column on wide screens (≥ 1024 px: status card left ~⅓, log right ~⅔), single column stacked
on narrow/mobile with the **Status card first** (its call-off/hold buttons are the thing a person
reaching for their phone during an alert needs). Cards are `<jv-section>` (HA card surfaces); colours
only through the `--jv-*` tokens (DESIGN.md), state chips via `<jv-state-badge>` (`danger` / `warn` /
`ok` / `neutral`).

### Card 1 — "Intrusion" (status + response)

Header: title `Intrusion`; right-aligned status chip:
- `snapshot.intrusion.confirmed` → chip **CONFIRMED** (error colour)
- else `snapshot.intrusion.active` → chip **INVESTIGATING** (warning colour)
- else `status.called_off` → chip **CALLED OFF · {n}s** (warning), `n = suppressed_for`
- else → chip **ARMED** (success colour)
  (old panel showed only the last two; the first two come from the snapshot and are the
  requested "active/confirmed" status.)

Body, top to bottom:
1. **Active investigation line** (only when `snapshot.intrusion.active`): "Breach: {breach_name}"
   plus zones/path as chips (`zones` joined by " → " if non-empty). Secondary text.
2. **Lockdown line** (only when `snapshot.lockdown.active`): "Lockdown {auto ? "engaged
   automatically" : "engaged"} since {time}" + reason if non-empty. This view does *not* toggle
   lockdown (that lives in the shell header / `jarvis/set_lockdown {on: bool}`); link to it only.
3. **Acknowledged banner** (when `status.acknowledged`): "Acknowledged — automatic escalation held
   (you're handling it)".
4. **Last snapshot**: when `status.last_snapshot?.url` — else the newest log event that carries a
   `snapshot_url` (R1: `last_snapshot` is in-memory and empty after a restart) — the signed image
   (max-height ~280 px, `object-fit: contain`, rounded; tap opens it full size) with caption
   `{camera friendly name} · {time}`. Camera friendly
   name: `hass.states[camera]?.attributes.friendly_name` else strip `camera.` and replace `_` with
   spaces. Else the empty hint: "No intrusion snapshots captured. This stays empty unless JARVIS
   confirms an intruder on camera."
5. **False-alarm count** (when `false_alarms_24h > 0`): "{n} false alarm(s) called off in the last 24h".
6. **Response buttons** (row, wrap on mobile; primary = Call off):
   - `CALL OFF (FALSE ALARM)` — destructive styled (`.jv-btn` danger), **confirmed first** (A1).
   - `I'M LOOKING` — secondary (the key `I'M LOOKING (HOLD)` does not exist; see Strings).
   Both always enabled (parity: the backend accepts them even with no active investigation — a
   call-off then just arms the 10-min quiet window). Disabled only while a request is in flight.
   The last action's toast text is also shown in a `role="status"` line under the buttons for 5 s.
7. **Settings** (a sub-section with a thin divider, heading "Response settings"):
   - Select "Auto-escalate if no response after" → `intrusion_response_timeout` (options above).
   - Switch "Confirm Frigate person with JARVIS vision before alarming" → `intrusion_vision_confirm`.
   - Switch "Stay silent when JARVIS's own cameras clearly show no one (recommended) — turn OFF to
     stay ever-vigilant and alert on any unanswered activity" → `intrusion_vision_veto`.
   - Switch "Require confinement (Lockdown or armed alarm) for intrusion monitoring" →
     `intrusion_requires_confinement`.
   Rendered as a `<fieldset>` with legend "Response settings"; `ha-switch` + `ha-formfield` /
   `ha-select` when defined, native fallbacks otherwise. Switch state = `config[key] !== false` for the
   two vision keys (default true) and `config[key] === true` for confinement (default false),
   matching the old panel's defaults when the key is absent.

Card sub-text (secondary): "Last intrusion snapshot and false-alarm call-off. When JARVIS confirms
an intruder on camera it grabs a still; if it's not real, call it off here or say "it's a false
alarm"."

### Card 2 — "Intrusion Log"

Header: title `Intrusion Log`; right side `{labeled}/{events} LABELLED` (from `learning`); an
icon button Refresh (`mdi:refresh`, spins/disabled while loading).

Sub-text: "Every intrusion event with its snapshot. Mark each one real or false alarm — JARVIS
learns from your labels and stops firing the low-confidence alerts for patterns you keep calling
false. A confirmed intrusion always alerts, no matter what it has learned."

Learning banner (when `learning.damped_patterns.length > 0`): "JARVIS has learned {n} benign
pattern(s) — low-confidence alerts for these stay quiet."

Event list (most recent first; backend order already), each row:
- line 1: kind chip (`CONFIRMED` error, `UNRESOLVED` warning, `INVESTIGATING` neutral/info,
  anything else neutral with the raw kind upper-cased) · relative/absolute time (absolute on
  hover/title).
- line 2: `{breach || camera-friendly || "activity"}` + (`reason` ? ` — {reason}` : "").
- optional small extras (secondary text): zones joined by ", "; `max_depth` as "depth {n}".
- snapshot thumbnail when `snapshot_url` (signed; ~120 px tall on desktop, full-width on mobile;
  tap opens full-size in an `ha-dialog`; hide on `onerror`).
- actions: segmented pair `REAL` / `FALSE ALARM` (`role="group"` "Label this event", pressed state =
  current `label`), plus `Clear label` only when a label is set, and `labelled {time}` once
  `labeled_ts` exists. Clicking the already-selected label is a no-op.

Pagination: the old tab showed a flat list of 40. `limit: 40`; a "Show more" text button (shown when
the list is full, i.e. `events.length >= limit`, and `limit < 200`) re-requests with `limit: 200`.

Mobile: both cards full-width; log rows become a stacked layout (chip + time, text, image, buttons
full-width). Status card's two response buttons stretch to full width, stacked.

---

## Actions

| # | trigger | call | confirm? | success | failure |
|---|---|---|---|---|---|
| A1 | `CALL OFF (FALSE ALARM)` click | `{type:"jarvis/intrusion", action:"dismiss", reason:"panel"}` | **Yes** (`confirmDialog`, destructive): heading "Call off this intrusion as a false alarm?", message "Escalation stays quiet for 10 minutes and the event is recorded as a false alarm.", confirm "CALL OFF (FALSE ALARM)". Button disabled while pending. | toast "Intrusion called off"; replace status from the response (it already includes `status()`); request a snapshot refresh so `intrusion.active` flips; reload the log. | toast with the error message; re-enable button |
| A2 | `I'M LOOKING` click | `{type:"jarvis/intrusion", action:"acknowledge", reason:"panel"}` | No | toast "Acknowledged — holding escalation"; status from response | toast error; re-enable |
| A3 | Refresh icon in log header | `callWS {type:"jarvis/intrusion", action:"log", limit:40}` | No | list re-rendered, images re-signed | inline error state in list (see States) |
| A4 | `REAL` click on event | `{type:"jarvis/intrusion", action:"label", event_id, label:"real"}` | No | if `res.ok`: set event.label, replace `learning`, update header count + damped banner; else toast `res.error` (or "Could not save the label") | toast error (old panel swallowed errors silently — do better) |
| A5 | `FALSE ALARM` click | same with `label:"false"` | No | as A4 | as A4 |
| A6 | `Clear label` click | same with `label:""` | No | as A4 (label → null) | as A4 |
| A7 | timeout select change | `{type:"jarvis/update_config", key:"intrusion_response_timeout", value:<Number>}` | No | optimistic; toast "Saved"; local value from the echo; `jarvis-refresh` | toast "intrusion_response_timeout — {message}"; revert control |
| A8 | vision-confirm switch | `update_config {key:"intrusion_vision_confirm", value:<bool>}` | No | as A7 | as A7 |
| A9 | vision-veto switch | `update_config {key:"intrusion_vision_veto", value:<bool>}` | No | as A7 | as A7 |
| A10 | requires-confinement switch | `update_config {key:"intrusion_requires_confinement", value:<bool>}` | No | as A7 | as A7 |
| A11 | tap snapshot thumbnail | none (open `ha-dialog` with the already-signed URL; if older than ~4 min re-sign first) | No | — | — |

Toasts: use the HA `hass-notification` event
(`this.dispatchEvent(new CustomEvent("hass-notification", {detail:{message}, bubbles:true, composed:true}))`)
rather than a custom toast element. WS errors arrive as `{code, message}`; show `message`.

Concurrency: ignore clicks while the same action is pending; label buttons per-event pending flag.

---

## States

| area | loading | empty | error | disabled |
|---|---|---|---|---|
| Status card body | skeleton / "Loading…" placeholder until the first `status` resolves | no `last_snapshot` → "No intrusion snapshots captured. This stays empty unless JARVIS confirms an intruder on camera." (chip still ARMED) | `status` rejected → body text "Couldn't load — restart Home Assistant after updating." (old string; keep) + a Retry button; chip "—". Buttons still rendered. | response buttons disabled while their request is pending; settings controls disabled while their own write is pending |
| Snapshot image | `<img>` hidden until signed `src` set (reserve height to avoid jump) | — | `onerror` → hide image, show "Snapshot no longer available" secondary text | — |
| Log list | "Loading…" rows (3 skeleton rows) on first load; header count "…"; Refresh button disabled+spinning on manual refresh (keep old rows visible) | `events.length === 0` → "No intrusion events recorded yet." | `log` rejected → "Could not load the log." + Retry | label buttons disabled per-event while that event's label call is pending |
| Learning count | "…" | "0/0 LABELLED" | hidden | — |
| Settings | controls reflect `snapshot.config`; if snapshot not yet loaded show defaults (120/true/true/false) but disabled until it is | — | write failure → revert control value + toast | — |
| No `hass` yet | render nothing / skeleton | — | — | — |

Non-admin: cannot happen (panel admin-only). If a WS call ever returns `code:"unauthorized"`,
show its message in the card's error slot.

---

## Strings

All user-visible English strings, exactly as the `t()` key. The i18n files
(`custom_components/jarvis/frontend/i18n/<lang>.json`, fetched from
`/jarvis_panel_static/i18n/<lang>.json` by `hass.language`, full tag then base-language fallback,
missing key → English) are keyed by the exact English string, so reuse the keys marked ✓ verbatim.
Checked against `de.json`, `fr.json`, `es.json`.

| string (t() key) | in de.json | notes |
|---|---|---|
| `Intrusion` | ✓ | card 1 title |
| `Intrusion Log` | ✓ (also fr, es) | card 2 title |
| `ARMED` | ✓ (also fr, es) | status chip |
| `INVESTIGATING` | ✓ | chip |
| `UNRESOLVED` | ✓ | chip |
| `CONFIRMED` | ✗ | chip — new key |
| `CALLED OFF` | ✗ | chip prefix; render as `${t("CALLED OFF")} · ${n}s` |
| `REAL` | ✓ (fr, es) | label button |
| `FALSE ALARM` | ✓ (fr, es) | label button |
| `CLEAR` | ✓ — but de "Frei" / fr "Dégagé" are the *"area is clear"* sense, wrong for "remove label" | not used: the view uses the new key `Clear label` |
| `CALL OFF (FALSE ALARM)` | ✓ (fr, es) | button; old panel prefixed "✕ " outside the key |
| `I'M LOOKING (HOLD)` | ✗ — only `I'M LOOKING` ✓ exists | the view uses `I'M LOOKING` alone as the button text |
| `Auto-escalate if no response after` | ✓ (fr) | select label |
| `Confirm Frigate person with JARVIS vision before alarming` | ✓ | switch label |
| `Stay silent when JARVIS's own cameras clearly show no one (recommended) — turn OFF to stay ever-vigilant and alert on any unanswered activity` | ✗ | switch label (new key) |
| `Require confinement (Lockdown or armed alarm) for intrusion monitoring` | ✗ | switch label (new key) |
| `1 min` / `2 min` / `3 min` / `5 min` / `10 min` | ✗ | select options (use HA's duration formatting or new keys) |
| `No intrusion snapshots captured. This stays empty unless JARVIS confirms an intruder on camera.` | ✗ | empty state |
| `No intrusion events recorded yet.` | ✓ (es) | empty state |
| `Could not load the log.` | ✓ | error state |
| `Couldn't load — restart Home Assistant after updating.` | ✗ | status error |
| `Loading…` | ✗ (`Loading...` with three dots ✓ exists) | use key `Loading...` |
| `REFRESH` | ✗ | old button text "⟳ REFRESH"; with an icon button use tooltip `Refresh` |
| `LABELLED` | ✗ | header `${labeled}/${events} ${t("LABELLED")}` |
| `Acknowledged — automatic escalation held (you're handling it)` | ✗ | banner (old text prefixed "✓ ") |
| `{n} false alarm called off in the last 24h` / `{n} false alarms called off in the last 24h` | ✗ | two keys (singular/plural) |
| `JARVIS has learned {n} benign pattern — low-confidence alerts for these stay quiet.` / `…{n} benign patterns…` | ✗ | two keys |
| `Last intrusion snapshot and false-alarm call-off` | ✓ (prefix only) | card 1 sub-text begins with it; full old sentence: `Last intrusion snapshot and false-alarm call-off. When JARVIS confirms an intruder on camera it grabs a still; if it's not real, call it off here or say "it's a false alarm".` — use the full sentence as the key (new) |
| `Every intrusion event with its snapshot. Mark each one real or false alarm — JARVIS learns from your labels and stops firing the low-confidence alerts for patterns you keep calling false. A confirmed intrusion always alerts, no matter what it has learned.` | ✗ | card 2 sub-text (old markup bolded "real"/"false alarm") |
| `activity` | ✗ | fallback for an event with neither breach nor camera |
| `Intrusion called off` | ✗ | toast (old: "✓ intrusion called off") |
| `Acknowledged — holding escalation` | ✗ | toast |
| `Call off this intrusion as a false alarm?` / `Escalation stays quiet for 10 minutes and the event is recorded as a false alarm.` | ✗ | A1 confirm dialog |
| `Saved` / `Could not save the label` / `Label this event` / `labelled {time}` / `depth {n}` / `Open snapshot` / `Intrusion snapshot` / `just now` / `{n} min ago` / `{n} h ago` / `{n} d ago` / `Unknown error` | ✗ | used by the code (toasts, labels, relative times) |
| `Breach` | ✗ | new (active-investigation line) |
| `Lockdown engaged since` / `Lockdown engaged automatically since` | ✗ | new |
| `Response settings` | ✗ | new sub-heading |
| `Snapshot no longer available` | ✗ | new (img onerror) |
| `Retry` | ✗ | new |
| `Show more` | ✗ | new, optional |
| `intrusion snapshot` / `snapshot` | ✗ | img alt text |

Interpolation: `t(key, vars)` substitutes `{name}` placeholders after the lookup, so count-bearing
strings stay whole keys with `{n}`. Do not translate entity ids, camera names, or numbers. Since
Phase 3 every key is translated in all 22 language files (`frontend/i18n-missing.json`); the ✓/✗
column records the state before the port.

---

## Dropped to Phase 3

| feature of the old tab | why |
|---|---|
| Unicode glyph prefixes in button text ("✓ ", "✕ ", "⟳ ") | replaced by `mdi:` icons in HA buttons; glyphs were part of the HUD look. |
| Full-panel re-render (`_fetchAndRender`) after every setting change | the Lit view updates its own state from the WS echo; a global re-render is the old panel's bug, not a feature. |
| Toast text `✓ intrusion_response_timeout → 120` (raw key names shown to the user) | replace with a human toast; raw key only in the error path for diagnosability. |
| Lockdown **toggle** inside this view | not in the old intrusion tab either (header button, `jarvis/set_lockdown`); this view only *shows* lockdown state. Toggle stays in the shell/header spec. |
| Rendering `learning.patterns` per pattern (which room/time bucket is damped) | the old tab only showed the count; a per-pattern table with "un-damp" needs a backend action that does not exist. |
| Intruder route on the floor plan (`intrusion.path`, `zones` drawn on the 3-D/2-D house) | belongs to the residence/3-D view spec; here only listed as text chips. |

---

## Risks

1. **`last_snapshot`, `called_off`, `acknowledged`, `false_alarms_24h` are in-memory module state** —
   they reset on HA restart while the log (`intrusion_log.json`) persists. The view therefore falls
   back to the newest `events[i].snapshot_url` (reported by the log card when it loads) for the hero
   image when `last_snapshot` is null.
2. **Snapshot files are pruned at 40, the log at 200** → many older `snapshot_url`s 404. Handle
   `onerror`. The 404 arrives only after the signed GET, so there is no way to know in advance.
3. **Signed URLs expire in 300 s**; a long-open view with stale `src` values will break images
   after a reload-less idle. Re-sign on every list refresh and when opening the dialog.
4. **`label` failures are `ok:false` results**, not WS errors; also `event not found` can happen
   when the log was truncated between fetch and click. Re-fetch the log on `ok:false`.
5. **`update_config` does no coercion**; the old panel stored `"120"` (string) for
   `intrusion_response_timeout`, so an existing install may hold a string. Read it with
   `Number(config.intrusion_response_timeout) || 120` and always write a Number.
6. **`status()` carries no "active investigation" flag**; active/confirmed come from the 20 s
   `get_panel_data` poll, so the chip can lag a call-off by up to 20 s unless the shell is asked to
   re-poll after A1 (spec says do so).
7. `intrusion.kind` docstring lists `false_alarm` but no producer writes it; `_redact_intrusion_status`
   and `events[].snapshot_path` expose server paths — never render `path`/`snapshot_path`.
8. The `lockdown.arm_mode` key is absent in the fallback dict; `intrusion.breach_*`/`path`/`zones`
   are absent when inactive. Guard every optional.
9. `learning.patterns` counts are all-time while damping uses a 30-day window — the
   `damped_patterns` list is authoritative for the banner; do not recompute from `patterns`.
10. i18n: `CLEAR` is mistranslated in de/fr for this use; `I'M LOOKING (HOLD)` and
    `Loading…` (ellipsis character) have no exact keys. Decisions recorded in the Strings table.
11. No HA event fires for `investigating` or for call-off/acknowledge, so bus subscriptions (D6)
    only cover the confirmed/unresolved transitions; polling remains necessary.
12. The old tab's `reason:"panel"` is a free string the backend only logs/records; keep it as
    `"panel"` so the `false_alarms` records stay comparable with upstream.
