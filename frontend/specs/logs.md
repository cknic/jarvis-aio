# Spec: `logs` view (Lit panel)

Derived from the OLD panel (`custom_components/jarvis/frontend/jarvis-panel.js`): its
"Logs" tab (System Log), plus the pieces the brief folds into this view that the old
panel scattered elsewhere — the Activity Feed (old dashboard), System Diagnostics
(old Settings › General), Cognitive Core stats (old dashboard status card) and
Governance / enforcement switches (old Settings › Governance, the "shadow → parity →
enforce" control surface). The view agent implements from THIS document only.

Route: `/jarvis/logs` (panel `route.path === "/logs"`). Admin-only panel; every command
below is `@websocket_api.require_admin`.

---

## Purpose

One place for an admin to answer "what has JARVIS been doing, and is it healthy?":

1. **System Log** — JARVIS's internal debug ring buffer (what the brain decided, which
   engine answered, routing, errors). Primary content of the view.
2. **Activity** — the persisted household activity log (observer events, sentinel
   alerts, announcements) from the SQLite `activity_log` table.
3. **Diagnostics** — health of the core services JARVIS calls (LLM, embeddings, TTS,
   STT, cameras, routines, DB, scheduler, host) plus judgment calibration.
4. **Cognitive Core** — learning statistics and last pattern-analysis result.
5. **Governance** — the kernel enforce kill-switches, with read + confirmed toggle.

No navigation into other views is required; the view is self-contained.

---

## Data

Transport: `hass.callWS(request)`. On success the promise resolves with the handler's
`send_result` payload (the object documented under "Response"). On failure the promise
rejects with `{code: string, message: string}` (HA's `send_error`); the `code` values
each handler emits are listed per command. All timestamps are strings, already
formatted server-side unless noted.

### 1. `jarvis/get_debug_log` — System Log

Request (voluptuous):
```
{ type: "jarvis/get_debug_log" }          // no other fields accepted
```

Response:
```
{
  entries: Array<{
    date: string,   // "YYYY-MM-DD"  (server local date)
    ts:   string,   // "HH:MM:SS"    (server local time, NOT converted to HA tz)
    cat:  string,   // category, upper-case word, see list below
    msg:  string    // message, truncated to 500 chars server-side, plain text
  }>
}
```
- Order: **oldest → newest** (it is `list(deque)`); the UI must reverse for newest-first.
- Max 500 entries (deque `maxlen=500`). On HA start up to 200 entries are reloaded from
  `jarvis.log`, so the list is rarely empty after the first conversation.
- Never errors (no try/except; `send_result` always). An empty list is the only
  "empty" state.
- Categories actually emitted by the backend (`jarvis_log("<CAT>", …)` call sites):
  `CAMERA, AGENT, LEARN, SAFETY, REPLY, OBSERVER, MODE, VOICE, OFFER, LOOP, LOCAL,
  GATE, ERROR, CONFIG, BIO, WORKING_MEMORY, OFFLINE, ENERGY, DEDUP, CONV, CLASSIFY,
  CERT, AUTO`. Also reserved in `_CONV_CATEGORIES`: `ROUTE`. The old panel additionally
  styled `REASON` and `TTS`, which no backend call site emits today. Treat `cat` as an
  open string: any value may appear.
- Fetch: on view enter, then every **20 s** while the view is visible (the old panel
  piggy-backed on its 20 s `get_panel_data` poll and re-fetched the debug log on each
  poll while the Logs tab was active; it also re-fetched on every filter/search change,
  which the new view should NOT do — filter client-side from the cached entries).
  Also on manual Refresh.

### 2. `jarvis/get_activity_log` — Activity

Request:
```
{
  type:  "jarvis/get_activity_log",
  hours?: int,     // default 24; window back from now
  limit?: int      // default 50; max rows
}
```
Old panel used `{hours: 2, limit: 30}` for the dashboard feed. For this view use
`{hours: 24, limit: 100}`.

Response:
```
{
  entries: Array<{
    ts:      string,  // "HH:MM" in HA local time (UTC row converted via dt_util.as_local);
                      // falls back to the first 5 chars of the raw ISO timestamp on parse error
    urgency: string,  // DB value; observed: "low" | "medium" | "high" | "critical" | "muted"
                      // (default "low"); treat as open string, style known ones
    tag:     string,  // UPPER-CASED: entity_id object-id (after the ".") truncated to 20
                      // chars, or the `source` when there is no entity_id
    msg:     string,  // the stored message (free text, may be empty)
    source:  string   // "observer" | "agent" | "sentinel" | "cognitive_core" | "vision" |
                      // "doorbell" | "periodic" | "stated" | "observed" (open string;
                      // default "observer")
  }>
}
```
- Order: **newest first** (SQL `ORDER BY timestamp DESC`).
- Error: `code: "activity_log_failed"`, `message: <exception text>`. The DB layer
  itself swallows read errors and returns `[]`, so in practice the error path is rare.
- Fetch: on view enter, every 20 s while visible, and on manual Refresh.

### 3. `jarvis/diagnostics` — Service health

Request:
```
{ type: "jarvis/diagnostics" }
```

Response (`diagnostics.service_health.run_service_health`):
```
{
  overall: "ok" | "warn" | "down" | "off",
  summary: string,   // English sentence, e.g. "all 9 core services healthy",
                     // "1 service(s) failing — 7/9 healthy",
                     // "7/9 healthy, 2 idle (not recently used)", "no core services active"
  services: Array<{
    name:   string,  // "LLM" | "Embeddings" | "TTS" | "STT" | "Cameras" | "Routines" |
                     // "Conversation store" | "Scheduler" | "Host"  (fixed order as listed)
    key:    string,  // "llm" | "embeddings" | "tts" | "stt" | "cameras" | "routines" |
                     // "database" | "scheduler" | "host"
    status: "ok" | "idle" | "warn" | "down" | "off",
    detail: string,  // human-readable reason / summary; may be ""
    ...              // individual checks may add extra keys (e.g. URLs are redacted); ignore unknown keys
  }>
}
```
Status semantics (from the module): `ok` = verified working; `idle` = reachable but not
recently exercised — NOT a failure, show calmly, never red; `warn` = soft concern (e.g.
cloud circuit breaker open); `down` = a genuine failure during real use — the ONLY
alarming state; `off` = not configured / not enabled — not a failure. `overall` ignores
`off` services.
- This call performs live probes (LLM ping etc.) and can take several seconds.
- Error: `code: "diagnostics_failed"`. Old panel showed the error as "Couldn't run
  diagnostics — restart Home Assistant after updating." (the command did not exist in
  older builds).
- Fetch: **on demand only** — on view enter (once) and on the "Run check" button. Do not
  poll (it is expensive).

### 4. `jarvis/get_calibration` — Judgment calibration (rendered inside Diagnostics)

The old panel fetched this together with `jarvis/diagnostics` and appended it under the
service list. Request:
```
{ type: "jarvis/get_calibration" }
```
Response (never errors; falls back to a stub with `error`):
```
{
  calibration: {
    n:         int,            // judged decisions with a confidence; 0 → "no data"
    good_rate: number|null,    // 0..1
    brier:     number|null,    // lower is better, 0 perfect
    ece:       number|null,    // expected calibration error
    kind:      string|null,
    bins: Array<{ lo: number, hi: number, count: int,
                  mean_confidence: number|null, good_rate: number|null }>  // 5 equal bins
  },
  interruption_budget: {
    window_s: number, judged: int, good: int, unnecessary: int, wrong: int,
    unwelcome_rate: number|null,   // 0..1
    multiplier: number,            // 0.25..1.0
    assessment: "no data" | "healthy" | "borderline" | "over-interrupting"
  },
  stats: { total: int, judged: int, good: int, unnecessary: int, wrong: int },
  suggestion: { kind: "suggestion", judged: int, good: int, unnecessary: int, wrong: int,
                good_rate: number|null, unwelcome_rate: number|null },
  suggestion_threshold?: { base: number, effective: number, learned_delta: number },
  error?: string               // only on the fallback payload; then calibration = {n:0},
                               // interruption_budget = {judged:0} and the other keys are absent
}
```
- Fetch: together with `jarvis/diagnostics` (same triggers).

### 5. `jarvis/get_cognitive_status` — Cognitive Core

Request:
```
{ type: "jarvis/get_cognitive_status" }
```
Response (`cognitive_core.status()`); never rejects — on exception the handler sends
`{ running: false, error: string, learning: {} }` as a RESULT:
```
{
  running:            boolean,
  tick_count:         int,
  actions_taken:      int,
  offers_made:        int,
  autonomous_actions: int,
  autonomy_grants:    Array<{ pattern_key: string, approvals: int, granted: boolean,
                              threshold: number, confidence: number }>,
  uptime_hours:       number,   // 1 decimal
  last_tick_ago:      number,   // seconds, 1 decimal
  ignore_rules:       int,
  learning: {                   // {} when the state logger is not running
    state_changes: int, commands: int, suggestions: int /* pending */,
    patterns: int /* person_patterns rows */, days_of_data: int
  },
  last_analysis: {              // {} until the first analysis of this HA session
    ts: number /* epoch seconds */, patterns_found: int, new_suggestions: int,
    person_routines: int, facts: int, near_misses: int
  },
  certification: {              // may be {} on error
    is_certified: boolean, coverage: number, closed_loop_rate: number,
    exercised: string[], closed: string[], missing: string[],
    results: Array<{ scenario: string, exercised: boolean, closed_loop: boolean, note: string }>,
    observations?: int
  },
  error?: string                // fallback payload only
}
```
- Fetch: on view enter and every 20 s while visible (old panel refreshed it on each
  20 s poll), and on manual Refresh.

### 6. `jarvis/get_enforcement` — Governance switches

Request:
```
{ type: "jarvis/get_enforcement" }
```
Response:
```
{
  switches: Array<{
    key:         string,   // stable id, e.g. "continuity_resume", "authority"
    name:        string,   // human label, e.g. "Capability authority"
    explanation: string,   // 1–3 sentences, English, includes what ON/OFF do and the fail-safe
    category:    "capability" | "safety",
    phase:       string,   // roadmap tag, e.g. "G4", "I-B.4"; may be ""
    default:     boolean,  // shipped code default
    enabled:     boolean,  // live value
    overridden:  boolean   // an owner override is stored in jarvis_config
  }>
}
```
- Order: registry order — capabilities first, then safety rungs. Current registry (10):
  capability: `continuity_resume` (default OFF), `agency_orchestration` (ON),
  `knowledge_graph` (ON); safety: `authority`, `agency_budget`, `loop_detect`,
  `safety_seam`, `hazard_situation`, `intrusion_gate`, `delivery_situation` (all ON).
  Do NOT hard-code these; render whatever comes back.
- Error: `code: "enforcement_failed"`.
- Fetch: on view enter and after every successful `set_enforcement`; also on manual
  Refresh. No polling needed.

### 7. `jarvis/set_enforcement` — toggle one switch

Request:
```
{ type: "jarvis/set_enforcement", key: string, enabled: boolean }   // both required
```
Response:
```
{ switch: <one switch object, same shape as in get_enforcement, refreshed> }
```
- Errors: `code: "invalid_key"` (`message: "Unknown enforcement switch '<key>'"`),
  `code: "enforcement_set_failed"`.
- Side effects: persists `enforce_override__<key>` in `jarvis_config` (survives
  restarts) and sets the live module flag immediately.

### Not used by this view

- `jarvis/get_panel_data`: the old Logs tab read nothing from the snapshot. The only
  snapshot-adjacent fields the old consolidated cards used were
  `meta.announcements_today` etc. on the dashboard, which stay in the dashboard view.
- `hass.callService`: **none**. The old Logs tab, Governance card, Diagnostics card,
  Cognitive stats and Activity feed call no HA services.
- `jarvis/update_config`: **no keys written** from any of these cards.
- `auth/sign_path` / snapshot images: not used.

---

## Layout

Page title: **Logs**. Desktop (`!narrow`): two columns — left column 2/3 width holds the
System Log card (tall, fills viewport height minus header); right column 1/3 stacks
Activity, Diagnostics, Cognitive Core, Governance. Mobile (`narrow`): single column in
the order System Log → Activity → Diagnostics → Cognitive Core → Governance; the System
Log is primary and gets a fixed-height scroll region (~55vh) so the other cards remain
reachable. A single header toolbar holds a **Refresh** button (refreshes everything
except Diagnostics, which has its own button) and a "Last updated HH:MM:SS" caption.

### Card A — System Log (primary)
- Header: "System Log"; right-aligned count badge: `"{n} entries"` when unfiltered, or
  `"{shown} of {total}"` when a category filter or search text is active.
- Controls row: a search `<input type="search" placeholder="Search log…">` (client-side,
  debounced 200 ms, case-insensitive substring match over `msg` and `cat`) and a wrapping
  row of **category chips**: `All` first, then one chip per distinct `cat` present in the
  loaded entries, ordered: the known list first in this order
  `CONV, LOCAL, AGENT, GATE, DEDUP, CLASSIFY, CAMERA, ROUTE, ERROR` (only those present),
  then any other categories alphabetically. Exactly one chip is active; default `All`.
  Filter state is per-visit (in-memory), not persisted.
- Body: a scrollable monospace list, **newest first**. Each row:
  `[ts] [cat badge] [msg]` — `ts` is `HH:MM:SS` (show `date` only in a `title`
  tooltip on the row, or as a day separator when the `date` changes between adjacent
  rows); the `cat` badge is colour-coded via a token map (ERROR → error colour,
  AGENT/LOCAL/CONV → primary/accent tones, GATE/DEDUP → muted, else default) using HA
  theme variables; `msg` wraps, `white-space: pre-wrap`.
- A row is "error-styled" (subtle error background/left border) when `cat === "ERROR"`
  OR `msg` contains "error" or "failed" case-insensitively (old behaviour; keep).
- Scroll preservation on the 20 s refresh: compute a signature of
  `length + first.ts+first.msg + last.ts+last.msg` of the *displayed* list; if unchanged
  and the filter/search is unchanged, do not touch the DOM. When it changes: if the user
  was within 40 px of the top (reading the newest) or the filter/search changed, scroll to
  top; otherwise keep their scroll offset. With Lit `repeat()` keyed on
  `date+ts+msg+index` this mostly falls out naturally — but the "keep offset" rule is
  mandatory.

### Card B — Activity
- Header: "Activity"; right badge `"Last {total}"` unfiltered or `"{shown} of {total}"`
  with a search.
- Optional search input `placeholder="Search activity…"` (client-side, over `msg` and
  `tag`, debounced 200 ms).
- Rows newest first (already in that order): `ts` (HH:MM) · an urgency indicator
  (left border colour: `critical` → error, `high` → warning, `medium` → primary,
  `low` → neutral, `muted` → neutral at 50 % opacity, unknown → neutral) · `**tag**` ·
  `msg`. An icon per tag is a nice-to-have (old panel mapped MOTION/DOOR/ALARM/PACKAGE/
  ENERGY/WEATHER/CAMERA/BRIEF/ROUTINE keywords to inline SVGs); use `ha-icon` with
  mdi names if implemented, else omit.
- Show `source` as a tooltip on the row.

### Card C — Diagnostics
- Header: "System Diagnostics"; right badge shows `summary` (or `overall` upper-cased if
  summary missing) coloured by `overall` (`down` → error, `warn` → warning, `ok` →
  success, `off` → neutral).
- Sub-text: `Health of the core services JARVIS calls — LLM, embeddings, speech. A quick
  "is everything up?" check.`
- Button: **Run check** (icon mdi:refresh). While running: disabled, label "Checking…".
- Body: one row per service: `name` + status pill (`OK`, `IDLE`, `WARN`, `DOWN`, `OFF`,
  else `?`) + `detail` in secondary text under it. `idle` and `off` must look calm
  (neutral), only `down` is red, `warn` amber.
- Sub-section **Judgment calibration** (from `get_calibration`):
  - If `calibration.n === 0`: header "Judgment calibration" + text "No judged decisions
    yet — this appears once JARVIS's decisions accrue outcomes."
  - Else: header "Judgment calibration" with meta `Brier {brier} · ECE {ece} · n={n}`;
    one horizontal bar per bin with `count > 0`: label `{lo%}–{hi%}`, bar width =
    `good_rate*100`%, trailing `{good_rate%} good · n={count}` (percent = `Math.round(v*100)+"%"`,
    `"—"` for null).
  - Line: if `interruption_budget.judged > 0`:
    `Interruption budget: **{assessment}** — {unwelcome_rate%} of {judged} recent decisions dismissed (cap ×{multiplier}).`
    else `Interruption budget: no recent judged decisions.`
  - Line (only if `suggestion_threshold` present and `|learned_delta| > 0.001`):
    `Suggestion bar {raised|lowered} to {effective%} (from {base%}) based on recent usefulness.`
    (`raised` when `learned_delta > 0`).

### Card D — Cognitive Core
- Header: "Cognitive Core"; right badge `Running` / `Stopped` from `running`
  (success / neutral).
- Compact key/value grid (old panel's "COGNITIVE CORE" meta block):
  `Data` → `{learning.days_of_data}d` · `States` → `{learning.state_changes}` ·
  `Cmds` → `{learning.commands}` · `Suggestions` → `{learning.suggestions}` ·
  `Ignores` → `{ignore_rules}`.
  Additional values that are cheap to show and were not on the old card (optional,
  secondary row): `Uptime {uptime_hours}h` · `Ticks {tick_count}` ·
  `Autonomous {autonomous_actions}` · `Offers {offers_made}`.
- Line: if `last_analysis.ts`:
  `Last analysis: {ago} · {patterns_found} found, {new_suggestions} stored` where `ago`
  = minutes `"{m}m ago"` if < 60, hours `"{h}h ago"` if < 1440 min, else `"{d}d ago"`.
  Else `Last analysis: not yet this session`.
- All numbers default to `0` when missing (`?? 0`); `learning` may be `{}`.
- If the payload carries `error`, show it as secondary text under the grid (do not
  treat as a failed request).

### Card E — Governance
- Header: "Governance"; right badge "Enforcement".
- Intro text (verbatim from old panel): `JARVIS's kernel brings each capability online
  along a shadow → parity → enforce ladder, each behind a kill-switch. Here you control
  those switches: the opt-in capabilities ship OFF (enable when you're ready), and the
  live safety guards ship ON (leave them on). Changes take effect immediately and
  survive a restart.`
- Two groups, each only when non-empty:
  1. `category === "capability"` → heading "Owner opt-in capabilities", sub-text
     `These ship OFF. Turning one ON makes the kernel authoritative for that capability
     — your choice, behaviour-changing.`
  2. `category === "safety"` → heading "Safety & governance — kill-switches (keep ON)",
     sub-text `These ship ON and guard autonomous behaviour. Turning one OFF reverts
     that guard to observe-only (log-only) — only for debugging.`
- Each switch row: `name` (bold) + small muted `phase` tag (if non-empty) + small
  warning-coloured "overridden" tag when `overridden`; `explanation` as secondary text;
  an `ha-switch` (or a toggle button labelled ON/OFF) on the right reflecting `enabled`.
- If `switches` is empty: "No governance switches reported."

---

## Actions

| # | Trigger | Command | Confirm? | Feedback |
|---|---------|---------|----------|----------|
| 1 | Header **Refresh** | `get_debug_log`, `get_activity_log`, `get_cognitive_status`, `get_enforcement` in parallel | no | button spinner while any in flight; per-card error states on failure (no toast) |
| 2 | Category chip click | none (client filter) | no | chip becomes active; count badge updates; list scrolls to top |
| 3 | System Log search input | none (client filter, 200 ms debounce) | no | count badge `"{shown} of {total}"`; empty-match message (see States) |
| 4 | Activity search input | none (client filter, 200 ms debounce) | no | badge `"{shown} of {total}"` |
| 5 | Diagnostics **Run check** | `jarvis/diagnostics` then `jarvis/get_calibration` | no | button disabled + "Checking…" until both settle; on reject show error text in body |
| 6 | Governance toggle (safety, ON→OFF) | `set_enforcement {key, enabled:false}` | **yes** — dialog: title `Turn OFF the safety enforcement "{name}"?`, body `This reverts that guard to observe-only (log-only) until you turn it back on. Only do this for debugging.`, confirm "Turn off" (destructive style), cancel "Cancel" | success toast `✓ {name} → OFF`; then re-fetch `get_enforcement`. Failure toast `✗ {name} — {message}`; switch snaps back to its previous state |
| 7 | Governance toggle (capability, OFF→ON) | `set_enforcement {key, enabled:true}` | **yes** — dialog: title `Enable "{name}"?`, body `This makes the kernel authoritative for that capability.`, confirm "Enable" | as above with `→ ON` |
| 8 | Governance toggle (safety OFF→ON, or capability ON→OFF) | `set_enforcement` | no (these moves reduce autonomy / restore a guard) | as above |

Confirmation dialogs: use HA's `showConfirmationDialog` (fire `show-dialog` with
`dialogTag: "dialog-box"`) or an in-view `ha-dialog`; never `window.confirm`.
The toggle control is disabled while its request is in flight. The row is updated
from the `switch` object in the `set_enforcement` response immediately, then the whole
list is refreshed with `get_enforcement`.

Toasts: use HA's `hass-notification` event (`fireEvent(this, "hass-notification",
{message})`) — the old panel used its own toast with `✓`/`✗` prefixes; keep the
prefixes in the message text so the i18n strings line up.

---

## States

| Card | Loading | Empty | Error | Disabled |
|------|---------|-------|-------|----------|
| System Log | skeleton rows / "Loading…" on first load only; silent on 20 s refresh | `entries.length === 0`: "No entries yet. Talk to JARVIS to generate log entries." If entries exist but filter/search matches nothing: `No entries match{ "<search>"}{ in <CAT>}.` (append the search in quotes when set, and ` in {cat}` when a category other than All is active) | "Error loading logs: {message}" in the body; keep the last good list visible if one exists and show the error as a banner above it | n/a |
| Activity | "Loading…" first load only | `No activity yet. Enable announcements or observer to see events here.`; with a non-matching search: `No events match "{q}".` | "Could not load the log." (existing i18n key) + message in tooltip; keep last good list | n/a |
| Diagnostics | "Loading…" in body on first run; "Checking…" button label on re-run | `services.length === 0`: show `summary` only ("no core services active") | `Couldn't run diagnostics — restart Home Assistant after updating.` followed by `{message}` in secondary text; badge shows "—" | Run check disabled while in flight |
| Calibration (inside Diagnostics) | shares Diagnostics loading | `n === 0`: "No judged decisions yet — this appears once JARVIS's decisions accrue outcomes." | never rejects; if payload has `error`, render the empty state | n/a |
| Cognitive Core | "Loading…" on first load only | all zeros is a valid state — render zeros | never rejects; if `error` present show it as secondary text and badge "Stopped" | n/a |
| Governance | "Loading governance switches…" | "No governance switches reported." | `Couldn't load governance switches — {message}` | each toggle disabled while its own `set_enforcement` is in flight |

Polling stops when the view is disconnected (`disconnectedCallback`) or the browser tab
is hidden (`document.visibilityState !== "visible"`), and resumes with an immediate fetch
on return. If `hass` is not yet set, render loading states and fetch once `hass` arrives.

---

## Strings

Every user-visible English string; wrap each with `t()`. Keys are the exact English
text (the i18n files are keyed that way). Column "de.json" = already present in
`custom_components/jarvis/frontend/i18n/de.json` (checked; fr.json agrees for every
"yes" below) — strings marked "no" are new keys that fall back to English until
translated. Dynamic fragments are shown as `{placeholders}`; interpolate AFTER
translating the template, i.e. the key is the template with the placeholder tokens.

| String (key) | de.json | Where |
|---|---|---|
| `Logs` | yes (Protokolle) | view title / nav |
| `Refresh` | no | header button |
| `Last updated {time}` | no | header caption |
| `System Log` | yes (Systemprotokoll) | card A header |
| `{n} entries` | no | card A badge |
| `{shown} of {total}` | no | card A/B badge |
| `Search log…` | no | card A search placeholder |
| `All` | no (`ALL` → "Alle" exists; new view uses sentence case) | chip |
| `Loading...` | yes (Wird geladen...) | first-load placeholders (use this exact three-dot form, not the ellipsis character) |
| `No entries yet. Talk to JARVIS to generate log entries.` | no | card A empty |
| `No entries match` | no | card A filtered-empty prefix |
| ` in {cat}` / `"{search}"` | — technical fragments, not translated | |
| `Error loading logs:` | no | card A error |
| `Activity` | no (`Activity Feed` → "Aktivitäts-Feed" exists; use **`Activity Feed`** as the header key to reuse it) | card B header |
| `Last {total}` | no | card B badge |
| `Search activity…` | no | card B search placeholder |
| `No activity yet. Enable announcements or observer to see events here.` | no | card B empty |
| `No events match "{q}".` | no | card B filtered-empty |
| `Could not load the log.` | yes | card B error |
| `System Diagnostics` | yes (Systemdiagnose) | card C header |
| `Health of the core services JARVIS calls — LLM, embeddings, speech. A quick "is everything up?" check.` | no | card C sub-text |
| `RUN CHECK` | yes (PRÜFUNG STARTEN) — reuse as the button key even if rendered in sentence case via CSS | card C button |
| `Checking…` | no | card C button busy |
| `OK` / `WARN` / `DOWN` / `OFF` | `OFF` yes (AUS); others no | status pills |
| `IDLE` | yes (INAKTIV) | status pill |
| `Couldn't run diagnostics — restart Home Assistant after updating.` | no | card C error |
| `Judgment calibration` | no | card C sub-header |
| `No judged decisions yet — this appears once JARVIS's decisions accrue outcomes.` | no | calibration empty |
| `Brier {brier} · ECE {ece} · n={n}` | no | calibration meta |
| `{rate} good · n={count}` | no | calibration bin |
| `Interruption budget: {assessment} — {rate} of {judged} recent decisions dismissed (cap ×{multiplier}).` | no | calibration |
| `Interruption budget: no recent judged decisions.` | no | calibration |
| `Suggestion bar {dir} to {effective} (from {base}) based on recent usefulness.` | no | calibration |
| `raised` / `lowered` | no | calibration `{dir}` |
| `healthy` / `borderline` / `over-interrupting` / `no data` | no | `assessment` values (translate via t(), fall back to raw) |
| `Cognitive Core` | no | card D header |
| `Running` / `Stopped` | no | card D badge |
| `Data` / `States` / `Cmds` / `Suggestions` / `Ignores` | no | card D grid labels |
| `Uptime` / `Ticks` / `Autonomous` / `Offers` | no | card D optional row |
| `Last analysis: {ago} · {found} found, {stored} stored` | no | card D |
| `Last analysis: not yet this session` | no | card D |
| `{n}m ago` / `{n}h ago` / `{n}d ago` | no | relative time |
| `Governance` | no | card E header |
| `Enforcement` | no (`ENFORCEMENT` was the old badge; neither exists) | card E badge |
| `JARVIS's kernel brings each capability online along a shadow → parity → enforce ladder, each behind a kill-switch. Here you control those switches: the opt-in capabilities ship OFF (enable when you're ready), and the live safety guards ship ON (leave them on). Changes take effect immediately and survive a restart.` | no | card E intro |
| `Owner opt-in capabilities` | no | card E group 1 |
| `These ship OFF. Turning one ON makes the kernel authoritative for that capability — your choice, behaviour-changing.` | no | card E group 1 |
| `Safety & governance — kill-switches (keep ON)` | no | card E group 2 |
| `These ship ON and guard autonomous behaviour. Turning one OFF reverts that guard to observe-only (log-only) — only for debugging.` | no | card E group 2 |
| `overridden` | no | card E tag |
| `ON` / `OFF` | yes (AN / AUS) | toggle labels if a button is used |
| `Loading governance switches…` | no | card E loading |
| `No governance switches reported.` | no | card E empty |
| `Couldn't load governance switches — {message}` | no | card E error |
| `Turn OFF the safety enforcement "{name}"?` | no | dialog title |
| `This reverts that guard to observe-only (log-only) until you turn it back on. Only do this for debugging.` | no | dialog body |
| `Enable "{name}"?` | no | dialog title |
| `This makes the kernel authoritative for that capability.` | no | dialog body |
| `Turn off` / `Enable` / `Cancel` | no | dialog buttons |
| `✓ {name} → ON` / `✓ {name} → OFF` | no | success toast |
| `✗ {name} — {message}` | no | failure toast |

Backend-supplied text that is NOT translated (render verbatim): debug-log `cat` and
`msg`; activity `tag`/`msg`/`source`; diagnostics `summary`, `name`, `detail`; switch
`name`, `explanation`, `phase`.

---

## Dropped to Phase 3

- **Per-entry category colour table with emoji icons** (💬 ⚡ 🤖 🔀 🏷️ 🧠 🔊 ❌ 🚧 🔇 📷)
  — emoji render inconsistently across platforms and fight the HA theme; replaced by a
  text badge with theme-token colours. Could return as `ha-icon` mdi mapping later.
- **Activity Feed tag icons** (inline SVG keyword→glyph mapping) — cosmetic; the HUD SVG
  set does not fit the HA look. Optional mdi mapping later.
- **Fixed chip set including REASON / TTS / ROUTE regardless of data** — those
  categories are never emitted today; chips are now data-driven.
- **Re-fetching the debug log on every filter/search keystroke** — wasteful; replaced by
  client-side filtering of the cached list.
- **Refreshing the debug log on each `get_panel_data` poll** — this view does not call
  `get_panel_data`; it owns its own 20 s timer.
- **Global search index entries** ("Logs" / "Settings · Governance" in the old header
  search box) — the header search is a shell concern, not this view's.
- **Downloadable diagnostics export** (`recent_debug_log()` feeds a backend export used
  by another surface) — no WS command exposes a file download for the panel; out of
  scope.
- **Autonomy grants list and certification report** from `get_cognitive_status` — the old
  panel never showed them; the fields are documented above so a Phase 3 "Cognition"
  card can add them without a backend change.

---

## Risks

- **"config-parity section"** in the brief is interpreted as the old Settings ›
  Governance card (the shadow → parity → enforce switch registry). No other element in
  the old panel mentions parity.
- **Debug log timestamps are server-local** (`datetime.now()` on the HA host) with no
  date/tz info beyond the `date` field; activity timestamps are HA-local `HH:MM`. The two
  cards can disagree when the HA host tz differs from the configured HA time zone. Do
  not try to re-zone them.
- **Debug log `cat` is open-ended**; new categories appear whenever a backend module
  adds a `jarvis_log()` call. The chip list and colour map must tolerate unknown values.
- **`get_debug_log` is unpaginated** (whole deque, ≤500 × ≤500 chars ≈ 250 KB worst
  case) every 20 s. Acceptable for an admin page, but keep the DOM diffing cheap
  (signature check before re-render).
- **`get_activity_log` default `urgency`/`source` domains are unenforced** strings from
  the DB; values other than those listed may appear. The `tag` is derived server-side and
  can be `""` when both `entity_id` and `source` are empty.
- **`jarvis/diagnostics` runs live probes** (LLM ping with retries, embeddings probe,
  host checks) — expect 1–10 s latency; never poll it. The handler logs with
  `_LOGGER.exception` on failure, so a failing probe also lands in HA's own log.
- **Service objects may carry extra keys** beyond `name/key/status/detail` (individual
  checks build their own dicts); ignore unknown keys.
- **`get_cognitive_status` and `get_calibration` never reject** — errors arrive as a
  successful result with an `error` field and partial shape (`learning: {}`,
  `calibration: {n: 0}`, `interruption_budget: {judged: 0}`, other keys absent). Guard
  every nested access.
- **`certification` may be `{}`**, and `last_analysis` is `{}` until the first analysis
  after an HA restart (it is in-memory on the analyzer).
- **`set_enforcement` has real behavioural consequences** (disables a safety guard or
  makes the kernel authoritative). The confirmation rules in Actions #6/#7 are mandatory;
  the response's `switch` object is the authoritative post-write state.
- **Admin gating**: all seven commands are `require_admin`; a non-admin user never
  reaches the panel (`require_admin=True` in `panel_register.py`), but if HA ever
  relaxes that, every call rejects with `code: "unauthorized"` — surface it as the
  card's error state rather than crashing.
- **i18n**: most strings in this view are new keys (see table). The 23 language files
  fall back to English for them; the i18n coverage script (`scripts/i18n_coverage.py`)
  will report them as untranslated. Reuse `Activity Feed`, `System Log`,
  `System Diagnostics`, `RUN CHECK`, `IDLE`, `ON`, `OFF`, `Loading...`,
  `Could not load the log.` where noted to maximise existing coverage.
