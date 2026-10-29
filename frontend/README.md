# JARVIS panel (frontend)

The Home Assistant sidebar panel for JARVIS, written in TypeScript with
[Lit](https://lit.dev) and bundled by esbuild into ONE file:

    custom_components/jarvis/frontend/jarvis-panel.js

That bundle is what HACS ships and what `panel_register.py` serves at
`/jarvis_panel_static/jarvis-panel.js` (admin-only panel, `embed_iframe=False`,
sha1 cache-bust). It is committed, so **rebuild and commit it with every
source change** - CI (`.github/workflows/validate.yml`, job `frontend`)
rebuilds and fails on a stale bundle.

The source lives here, at the repo root, on purpose: `custom_components/` is
the HACS payload and must contain only the bundle and the `i18n/`
dictionaries (plus the legacy `jarvis-logo.png`, which the panel no longer
references: the app-bar mark is an inline SVG drawn in the header text colour).

## Commands

    cd frontend
    npm ci               # Node >= 22 (CI uses 22)
    npm run build        # -> ../custom_components/jarvis/frontend/jarvis-panel.js
    npm run check        # tsc --noEmit (strict)
    npm run lint:theme   # no literal colours / web fonts outside src/theme/tokens.ts
    npm run smoke        # built bundle under jsdom: every view, light + dark
    npm run all          # check + lint:theme + build + smoke
    npm run dev          # harness at http://localhost:5173/ (rebuilds on change)
    npm run i18n:keys    # t() keys in src/ with no entry in i18n/*.json (English-only)

`OUT=/path/x.js npm run build` writes elsewhere (the smoke test honours `OUT`
too). From the repo root, `node scripts/smoke_panel.js` runs the same smoke
test.

## Layout

    build.mjs                 esbuild config (entry src/panel.ts, esm, es2022, minified)
    tsconfig.json             strict, experimentalDecorators for Lit
    src/panel.ts              <jarvis-panel> shell: app bar, tabs / bottom nav, routing,
                              snapshot polling, error alert, i18n bootstrap
    src/ws.ts                 ws(hass, type, payload) + WsError; signPath() for /api/ images
    src/i18n.ts               t(key, vars) + loadLanguage() from /jarvis_panel_static/i18n/
    src/ha.ts                 haDefined() / watchDefinitions() feature detection, navigateHa()
    src/types.ts              Hass, Route, PanelData, ConfigSchema ...
    src/theme/tokens.ts       the --jv-* tokens, all derived from HA theme variables
    src/theme/base.ts         shared styles: grid, buttons, focus ring, visually-hidden
    src/components/           jv-section, jv-state-badge, jv-kv, jv-empty, jv-confirm
    src/views/index.ts        VIEWS registry (order = tab order) and the view imports
    src/views/view-base.ts    JarvisView base class (hass / narrow / data / route + helpers)
    src/views/<key>.ts        one element per view: overview, intrusion, suggestions,
                              memory, residence, logs, settings
    dev/index.html            standalone harness (light/dark, narrow, language, WS log)
    dev/mock-hass.ts          mock hass: callWS -> dev/fixtures/*.json, HA theme values
    dev/fixtures/             panel_data.json, config_schema.json, <ws_type>.json ...
    scripts/lint-theme.mjs    the colour / font lint
    scripts/smoke.mjs         the jsdom smoke test
    scripts/dev-server.mjs    the harness server (no dependencies)
    scripts/colour-rules.mjs  detector shared by lint and smoke
    scripts/i18n-keys.mjs     the untranslated-keys report
    scripts/config-schema-fixture.py
                              regenerates dev/fixtures/config_schema.json from the
                              backend catalogue (needs a Python with Home Assistant)
    specs/<key>.md            per-view specs (written by the spec agents)
    DESIGN.md                 the rules for view agents

## How the panel talks to Home Assistant

* HA sets `hass`, `narrow`, `route` (`{prefix: "/jarvis", path: "/<view>"}`)
  and `panel` on `<jarvis-panel>`. The shell maps `route.path` to a view from
  `VIEWS` (default `overview`) and navigates with `history.pushState` +
  `location-changed`, so deep links and the back button work.
* The snapshot (`jarvis/get_panel_data`) is fetched once, every 20 s while the
  document is visible, and when a view fires `jarvis-refresh`. Views receive
  it as `data`. All other commands go through `ws()`; writes use
  `jarvis/update_config {key, value}`; the settings form reads
  `jarvis/config_schema`.
* Snapshot images come from the authenticated `/api/jarvis/snapshot/...`
  view; `signPath()` asks `auth/sign_path` for a 300 s signed URL (cached,
  re-signed after 240 s) because an `<img>` cannot send a bearer token.
* Translations: `custom_components/jarvis/frontend/i18n/<lang>.json`, keyed
  by the English string, loaded for `hass.language` (or `config.ui_language`
  when set) with fallback to the key.

## The no-literal-colour rule

The panel has no palette of its own. `src/theme/tokens.ts` defines the
`--jv-*` tokens purely from HA theme variables (`--primary-color`,
`--card-background-color`, `--error-color`, `--app-header-background-color`,
`--ha-card-border-radius`, ...) with `color-mix()` for tints, so the panel
follows HA light, HA dark and user themes automatically. Every other file is
forbidden from spelling a colour or a font family; `npm run lint:theme`
checks the source and `npm run smoke` checks the stylesheets the built panel
actually adopts. See DESIGN.md for the full rules.

## Harness

`npm run dev` serves `dev/index.html` with a mock `hass` whose `callWS`
answers from `dev/fixtures/` (`jarvis/get_panel_data` -> `panel_data.json`,
`jarvis/config_schema` -> `config_schema.json`, `auth/sign_path` -> signed
mock path, anything else -> `<type with / -> _>.json` or `{}`), toggles for
HA light / dark (the real HA default theme values set on `<html>`), narrow
(a 390 px frame) and language, and a log of every WS call / service call.
Deep links work: http://localhost:5173/jarvis/settings.
