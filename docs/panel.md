# The JARVIS panel

The sidebar entry **JARVIS** (`/jarvis`) is the integration's admin page. It is
registered by `panel_register.py` with `require_admin=True`, served from
`/jarvis_panel_static/jarvis-panel.js` (one self-contained ES module, sha1
cache-bust query, `embed_iframe=False` so Home Assistant's own elements are
available) and written in TypeScript with [Lit](https://lit.dev) under
`frontend/`. Household members do not see it; they get the native entities and
the stock dashboard described in [native-entities.md](native-entities.md).

This page covers what each view does and which backend commands it uses, the
standalone harness, the no-literal-colour rule, translations, tests and what
is still missing. Build commands and the source layout are in
[frontend/README.md](../frontend/README.md); the per-view contracts (exact
WebSocket shapes, every string, the risks found while porting) are in
`frontend/specs/<view>.md`.

## How it is put together

* **Shell** (`src/panel.ts`): app bar with HA's header tokens, a tab bar (a
  bottom nav plus `ha-menu-button` when Home Assistant says `narrow`; below
  520 px only the current view's label is shown, the other six are icons with
  an `aria-label`, and the version moves to Overview so the bar stays one row
  on a 360 px phone), routing
  of `/jarvis/<view>[/<sub>]` with `history.pushState` + `location-changed` so
  deep links and the back button work, the snapshot poll
  (`jarvis/get_panel_data` once, every 20 s while the tab is visible, and
  whenever a view dispatches `jarvis-refresh`), an error alert when the
  WebSocket fails, and the translation bootstrap.
* **Views** (`src/views/<key>.ts`): one custom element per view,
  `<jarvis-view-<key>>`, receiving `hass`, `narrow`, `data` (the snapshot) and
  `route`. Anything not in the snapshot is fetched by the view with its own
  loading, empty and error states; writes re-fetch and ask the shell to
  refresh.
* **Theme** (`src/theme/tokens.ts`): the only file allowed to mention a
  colour, and even there every `--jv-*` token is `var(--primary-color)`,
  `var(--card-background-color)`, `var(--error-color)` … or a `color-mix()`
  of them. Light, dark and custom HA themes therefore work without any theme
  code in the panel.
* **Components** (`src/components/`): `jv-section` (an `ha-card` when
  defined, a token-styled card otherwise), `jv-state-badge`, `jv-kv`,
  `jv-empty` and `jv-confirm` / `confirmDialog()` (an `ha-dialog` when
  defined, a native `<dialog>` otherwise). HA elements such as `ha-icon`,
  `ha-switch`, `ha-select`, `ha-textfield` and `ha-alert` are feature-detected
  at render time (`haDefined()` / `watchDefinitions()`), because some are
  lazy-loaded, and every one has a plain, token-styled fallback.

The backend gained exactly one command for the panel: the read-only,
admin-only `jarvis/config_schema` (`websocket.py` → `config_apply.build_schema`),
which returns every panel-writable setting with its kind, default, options,
bounds and current value and never includes a secret-looking key
(`config_apply.looks_secret`). Everything else is the same `jarvis/*`
WebSocket surface as before, and all writes still go through
`jarvis/update_config {key, value}`; `panel_register.py` did not change.
Images from the authenticated `/api/jarvis/snapshot/{kind}/{filename}` view
go through `auth/sign_path` first (`signPath()` in `src/ws.ts`), because an
`<img>` cannot carry a bearer token.

## The views

### Overview — `/jarvis/overview`

The at-a-glance page. **System Status** maps the snapshot's status tokens to
tiles (observer, sleep with its reason, LLM providers, broadcast, notify
target, satellites, lockdown) and shows bedrooms, the version and the estimated
cost in a footer. **Operational Mode** reads `jarvis/mode` and sets it with
one tap per chip (the backend description is the tooltip); the "Follow
occupancy automatically" switch writes `operational_mode_auto` through
`jarvis/update_config`. The header's lockdown switch calls
`jarvis/set_lockdown` (engaging asks for confirmation) and follows what the
backend answers, not what was requested. **Right now** shows the dominant
room; **Quick Actions** call `jarvis.nap` (30 / 60 min) and
`jarvis.unshush`. **Areas** lists every room with its capabilities, readings,
a pulsing occupancy dot and a lights pill that opens a per-room light
popover (`jarvis/area_lights`, optimistic toggles, "Turn all off"). A
throttled `state_changed` subscription nudges a refresh for the relevant
domains.

### Intrusion — `/jarvis/intrusion`

Status card (ARMED / INVESTIGATING / CONFIRMED / CALLED OFF with a local
countdown), the active breach's zones or path, the lockdown and acknowledged
banners, the last still as a signed image, and the two actions: **Call off
(false alarm)** (confirmed, destructive) and **I'm looking** (acknowledge),
both through `jarvis/intrusion`. **Response settings** writes
`intrusion_response_timeout`, `intrusion_vision_confirm`,
`intrusion_vision_veto` and `intrusion_requires_confinement` with real
numbers and booleans. The **log** (`jarvis/intrusion {action: "log"}`) shows
each event with its still and a REAL / FALSE ALARM pair; labelling is what
JARVIS learns benign patterns from, and the card says how many patterns are
currently damped. Optional live refresh subscribes to the
`jarvis_intrusion_confirmed` / `_unresolved` bus events.

### Suggestions — `/jarvis/suggestions`

Pending suggestions from the snapshot with the type, confidence, the
headline and the "What JARVIS observed" evidence, entity chips, a
pretty-printed view of the automation payload (it is JSON, not YAML) and
**Create automation** / **Dismiss** through `jarvis/suggestion_action`.
Advisory suggestions are detected and relabelled **Acknowledge**; a confirmed
sequence asks before installing. **Goals** adds, cancels and deletes through
`jarvis/goal_action`. **Routine Learning** reads `jarvis/get_cognitive_status`
and runs `jarvis/run_analysis` with the full result (patterns found, closest
routine, busiest source, backfill). A link jumps to the learning section of
Settings.

### Memory — `/jarvis/memory`

**What JARVIS Knows** (`jarvis/get_knowledge`) grouped by household / about
me / person, with hedge and expiry markers, a teach form
(`jarvis/add_knowledge`) and a confirmed per-fact forget
(`jarvis/forget_knowledge {fact_id}` — the WebSocket protocol reserves `id`).
**Person Routines** (`jarvis/get_person_routines`) and **Recent Briefings**
(`jarvis/briefings`) are read-only. Each card loads once and keeps its own
error state, so one failing read never blanks the others.

### Residence — `/jarvis/residence`

The 3D model the old panel drew, ported to a typed module
(`src/views/residence/house3d.ts`, geometry unchanged for plan-driven homes)
whose palette is built at render time from the computed `--jv-*` values, so
it is correct in light and dark. Home style select (writes
`residence_style`), floor pills, five view presets, pointer drag or arrow
keys to rotate, the property banner and stats strip, the dominant-room
gauges, and the **mmWave Presence** card (`jarvis/mmwave_overview`). Without a
floor plan it shows a sample home and links to
[floor-plan-import.md](floor-plan-import.md); the in-panel editor is Phase 3.

### Logs — `/jarvis/logs`

Owns its own 20 s poll (paused while the document is hidden). **System Log**
(`jarvis/get_debug_log`, newest first, day separators, data-driven category
chips, debounced search, scroll position preserved across refreshes),
**Activity Feed** (`jarvis/get_activity_log`), **System Diagnostics**
(`jarvis/diagnostics` + `jarvis/get_calibration`, on demand), **Cognitive
Core** (`jarvis/get_cognitive_status`) and **Governance**
(`jarvis/get_enforcement` / `jarvis/set_enforcement`: the capability and
safety switches, each confirmed when it matters).

### Settings — `/jarvis/settings[/<section>[/<key>]]`

Settings as data. The view fetches `jarvis/config_schema` (every key in
`PANEL_WRITABLE_KEYS` with its kind, default, options, bounds and current
value — secret-looking keys are never included) and renders one control per
field: switch, select, number, text, one-item-per-line list with suggestions
drawn from `hass.states`, or a JSON editor with live validation. Sections are
General, Voice & Audio, Learning, Safety & Energy, Cameras, Home & Extras,
Governance and Other; search covers key, label, help and option labels. Each
write is `jarvis/update_config {key, value}` with per-row saving / saved /
failed status, a reset-to-default action, confirmation before enabling
`friday_automator`, `autonomy_enforce` or `suggest_garage_confirmation`, a
`jarvis/reload_appliances` call after the appliance keys, and the language
dictionary is loaded before `ui_language` is saved. The only per-key knowledge
in the view is presentation (labels, help, option names, confirm texts) in
`src/views/settings/presentation.ts`; every section ends with a short "Not yet
ported" list of the old tools that are Phase 3.

## The harness

    cd frontend
    npm ci
    npm run dev          # http://localhost:5173/jarvis/overview

`dev/index.html` mounts the real bundle with a mock `hass`
(`dev/mock-hass.ts`) whose `callWS` answers from `dev/fixtures/`:
`jarvis/get_panel_data` → `panel_data.json`, `jarvis/config_schema` →
`config_schema.json` (generated from the real catalogue by
`frontend/scripts/config-schema-fixture.py`), `auth/sign_path` → a mock signed
path, anything else → `<type with / replaced by _>.json` when present, else
`{}`; `jarvis/mode {action: "set"}` and `jarvis/set_lockdown` are echoed
(`{ok: true, …}` with the requested mode / state) so a chip tap or the
lockdown switch visibly takes effect. The toolbar toggles HA light / dark (the
real HA default theme values set on `<html>`, exactly what Home Assistant
does), a 390 px narrow frame, the language, and a log of every WebSocket and
service call. Deep links work (`/jarvis/settings/cameras`). The fixtures are
static, so a mutation visibly snaps back on the next refetch; that is the
mock, not the view. HA's own
elements are not defined in the harness, so it always shows the fallback
branches (`ha-switch` → a native switch, `ha-dialog` → `<dialog>`, …); the HA
branches follow the same contract but need a look in a real Home Assistant.

## The no-literal-colour rule

The panel must look like Home Assistant in every theme, which only works if
it never chooses a colour. So:

* `src/theme/tokens.ts` is the only file that may name a colour, and even
  there every `--jv-*` token derives from an HA variable (`--primary-color`,
  `--card-background-color`, `--primary-text-color`, `--error-color`,
  `--warning-color`, `--success-color`, `--divider-color`,
  `--app-header-*`, `--black-color`, `--ha-card-border-radius`, …) with
  `color-mix()` for the soft tints. The raw state colours are for dots, bars,
  borders and filled buttons; as small text they fail WCAG AA in HA light
  (warning 1.96:1, primary 2.63:1 on a card), so status text uses the
  `--jv-ok-text` / `--jv-warn-text` / `--jv-danger-text` / `--jv-accent-text`
  / `--jv-info-text` variants, which are mixed toward the page text until they
  read at 4.5:1 or better on a card and on their own tint in both themes.
  Everything drawn on the app bar (tab indicator, hover, focus ring, border,
  the status badge, the inline SVG mark) uses the `--jv-header-*` tokens
  (`--app-header-background-color`, `--app-header-text-color`,
  `--app-header-selection-bar-color`, `--app-header-border-bottom`), so a
  theme that paints the header in its primary colour still gets a visible
  selected tab.
* Everywhere else `#hex`, `rgb()` / `hsl()` and friends, CSS named colours
  (`red`, `white`, …) and any named `font-family`, `@import`, `@font-face` or
  Google Fonts URL are forbidden. `transparent`, `currentColor`, `inherit`
  and the generic font families are fine.
* `npm run lint:theme` checks the sources (`scripts/colour-rules.mjs` is the
  detector) and `npm run smoke` re-checks the stylesheets the built panel
  actually adopts at runtime in HA light, HA dark and a theme with a
  primary-coloured app bar, so a colour cannot sneak in through a template
  string either; it also asserts that the app bar's own rules reference only
  `--jv-header-*` colour tokens. The Residence model's SVG palette is built
  from `getComputedStyle()` values of the tokens for the same reason; a
  computed value is only used when it looks like a CSS colour expression
  (otherwise the `var(--jv-*)` reference is kept) and is HTML-escaped on its
  way into the SVG, because those values come from the user's theme and the
  SVG is injected with `unsafeHTML`.
* State colours mean one thing each (`--jv-ok`, `--jv-warn`, `--jv-danger`,
  `--jv-info`, `--jv-accent`) and are never the only signal: they are paired
  with text or an icon.

The full contract for view code (layout, components, states, mobile,
accessibility, i18n, ownership) is `frontend/DESIGN.md`.

## Translations

Every user-visible string goes through `t("English text")`; the dictionaries
in `custom_components/jarvis/frontend/i18n/<lang>.json` are keyed by that
English string and loaded for `hass.language` (or the `ui_language` setting)
with fallback to English — the same mechanism and the same 22 files as
before. The Phase 2 views reuse the old keys where the text is identical, but
they introduce many new strings that are English in every language until a
translation pass adds them:

    cd frontend && npm run i18n:keys      # lists the untranslated keys

See `custom_components/jarvis/frontend/i18n/README.md` for how to translate.

## Tests and CI

* `npm run check` — `tsc --noEmit`, strict.
* `npm run lint:theme` — the colour / font lint above.
* `npm run build` — esbuild, deterministic, to
  `custom_components/jarvis/frontend/jarvis-panel.js`. **Commit the bundle
  with every source change**; the `frontend` CI job rebuilds and fails on a
  diff.
* `npm run smoke` — the built bundle under jsdom with the mock `hass`: every
  view in light, dark and a coloured-header theme renders content, no
  uncaught error or `console.error`, no literal colour in any adopted
  stylesheet, the app bar uses only `--jv-header-*` colours, every `<img>`
  is `data:`, a panel static asset or a *signed* `/api/` path, tab clicks push
  `/jarvis/<view>` and the back button restores it, `jarvis-navigate` /
  `jarvis-refresh` work, a German dictionary translates the tab bar, and a
  WebSocket failure surfaces as an alert. `node scripts/smoke_panel.js` from
  the repo root runs the same test.
* Python side: `tests/unit/test_ws_contract.py` pins that every command the
  sources send is registered in `websocket.py` and present in the committed
  bundle; `test_config_schema_ws.py` pins the `jarvis/config_schema` shape and
  its parity with the catalogue; `test_panel_writable_keys.py`,
  `test_briefing_schedule.py`, `test_suggestion_evidence.py`,
  `test_panel_data_doors.py` and `test_ws_id_field.py` guard the per-view
  contracts statically.

## Not yet ported (Phase 3)

Listed per section inside Settings as "Not yet ported". The plain settings
behind each old card are already editable through the catalogue; only the
tool parts are missing:

* the visual **floor-plan editor** (rooms, elements, background image,
  vacuum-map import and room detection, SweetHome3D import UI);
* **Camera Watch** live tiles, camera diagnostics, enable / rename /
  indoor-outdoor tools, **doorbell training**;
* **faces and voices** (`jarvis/faces`, `jarvis/voices`, `jarvis/face_reference`);
* the **document library** and the semantic-search probe;
* live **provider / model pickers** (`jarvis/list_models`) — the keys are
  plain text fields meanwhile;
* **energy** live draw / advice, **hazard** scan, the **mute** list,
  per-rule Sentinel rows, the appliance row editor, satellite → speaker
  pairing and announcement-speaker pickers (all editable as lists / JSON);
* **brief me now** (`jarvis.briefing` and the example dashboard's button
  still work), the onboarding card, area sparklines;
* nice-to-haves noted in the specs: a shared toast helper instead of
  per-view fallbacks, a stale-snapshot banner inside views, `ha-slider` for
  0..1 floats, suggestion history, real YAML rendering.

Chat is not coming back to the panel: it is Home Assistant's Assist dialog
with the JARVIS agent.
