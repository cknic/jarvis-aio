# JARVIS panel - design rules for view agents

This is the contract every view under `src/views/` follows. The scaffold
(shell, tokens, shared components, harness, smoke test, CI) is owned by the
scaffold agent; each view agent owns `src/views/<key>.ts`, optionally
`src/views/<key>/*.ts`, and the fixtures `dev/fixtures/*.json` its view needs.
What each view shows, with the exact WebSocket request/response shapes, is in
`specs/<key>.md`.

The old panel (12k lines, hand-written HUD, ~500 literal colours, Google
Fonts, scanlines) is gone. The new panel is a normal Home Assistant admin
page: it looks like Settings, follows the user's HA theme (light, dark, or a
custom theme), works at 360 px, and is usable with a keyboard and a screen
reader.

## 1. The view element

```ts
import { html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { JarvisView } from "./view-base";
import { base } from "../theme/base";
import { t } from "../i18n";
import "../components";

@customElement("jarvis-view-<key>")
export class JarvisView<Key> extends JarvisView {
  static override styles = [base, css`...`];
  override render() { ... }
}
```

* Tag name `jarvis-view-<key>` and the properties `hass`, `narrow`, `data`,
  `route` are fixed - the panel sets them. `JarvisView` (src/views/view-base.ts)
  declares them and adds `refresh()`, `navigate(view, path?)`, `ws(type,
  payload?)` and `subPath`. Extending it is optional; keeping the properties is
  not.
* `data` is the `jarvis/get_panel_data` snapshot (`PanelData` in
  src/types.ts). It is `null` until the first fetch; the panel refreshes it
  every 20 s while the tab is visible and whenever a view dispatches
  `jarvis-refresh`. Do not poll it yourself.
* `hass` is replaced by HA on every state change. Read `hass.states` for live
  entity state; call `ws()` for JARVIS commands. Never cache `hass`.
* Per-view data (anything not in the snapshot) is fetched by the view with
  `ws()` in `firstUpdated()` / on demand, with its own loading, empty and error
  states (see 6). Re-fetch after a mutation; also call `refresh()` if the
  mutation changes something the snapshot shows.
* `route.path` is `/<key>[/<sub>]`; `subPath` gives `<sub>`. Use it for
  deep-linkable sub-screens (e.g. `/settings/cameras`) via
  `navigate("settings", "cameras")`. Never call `history.pushState` yourself;
  dispatch `jarvis-navigate` (bubbling, composed, `detail: {view, path?}`)
  and the panel does it HA's way (`pushState` + `location-changed`).

## 2. Components

HA's own elements are registered in the main window (the panel is not an
iframe) but some are lazy-loaded. **Feature-detect every HA element** with
`haDefined("ha-xxx")` (src/ha.ts) at render time and fall back to a plain
element styled with tokens; call `watchDefinitions(this, ["ha-xxx"])` in
`connectedCallback()` so the view re-renders when the element arrives.

| Need                   | Use                                                           | Fallback                                   |
| ---------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| card                   | `<jv-section heading icon subheading flush loading>`          | (built in - wraps ha-card or `.jv-card`)   |
| icon                   | `<ha-icon icon="mdi:...">`                                    | nothing / text label                       |
| icon button            | `<ha-icon-button .label=...><ha-icon .../></ha-icon-button>`  | `<button class="jv-icon-btn" aria-label>`  |
| button                 | `<ha-button>` or `<button class="jv-btn [primary|danger|text]">` | the `.jv-btn` classes                    |
| toggle                 | `<ha-switch .checked @change>` inside `<ha-formfield .label>` | `<input type="checkbox" role="switch">`    |
| select                 | `<ha-select .value .label @selected>` + `<ha-list-item value>` (`mwc-list-item` on older HA) | `<select>`       |
| text / number          | `<ha-textfield .value .label type="number" min max step>`     | `<input>` with a `<label>`                 |
| alert                  | `<ha-alert alert-type="error|warning|info|success" .title>`   | `<div role="alert">` with `--jv-*-soft`    |
| dialog / confirm       | `confirmDialog({heading, message, confirmLabel, destructive})` or `<jv-confirm>` | (built in - ha-dialog or `<dialog>`) |
| status pill            | `<jv-state-badge level="ok|warn|danger|info|neutral|accent" label pulse>` (`fromLevel()` maps live/warn/off) | - |
| key/value row          | `<jv-kv label value mono stacked>` (or slot a badge)          | -                                          |
| empty / loading / error| `<jv-empty kind="empty|loading|error" icon heading message>` + `<x slot="action">` | -                       |
| snapshot image         | `signPath(hass, "/api/jarvis/snapshot/...")` then `<img src=${signed}>` | - (an unsigned `/api/` src fails the smoke test) |
| entity / area / label picker | `<jv-picker kind multiple .hass .value @value-changed>` (src/components/jv-picker.ts; wraps `ha-selector` / HA pickers) | (built in - chips + combobox) |

Shared components (`src/components/`) are frozen: add your own under
`src/views/<key>/` instead of editing them.

## 3. Layout

* A view renders `<div class="jv-grid">` of `<jv-section>` cards: 1 column
  under 600 px, 2 under 1100 px, 3 above (`base.ts`). `.jv-span-all` for a
  full-width card (tables, logs, the floor plan).
* The panel adds the page padding (16 px, 12 px when narrow) and the max
  width (1400 px). Views do not add outer margins.
* Card content padding is 12/16 px; `flush` on `<jv-section>` for lists that
  run edge to edge (then give rows their own 16 px horizontal padding).
* Spacing scale: 4 / 8 / 12 / 16 / 24 px (`--jv-space-1..5`). Nothing else.
* Tap targets: 44 px minimum (`--jv-tap`, `.jv-tap`, `.jv-btn`, `.jv-icon-btn`
  already are). Rows that are clickable are at least 44 px tall. A control
  that must stay visually smaller (a 32 px chip, a 28 px pill, a text link)
  gets the class `.jv-hit`, which extends its hit box to 44 px with a
  `::before` (so the element itself must not `overflow: hidden`); native
  `<input>` / `<select>` get `min-height: var(--jv-tap)` instead.
* Sticky things inside a view sit below the panel's app bar: use
  `top: calc(var(--jv-sticky-top, 0px) + <gap>)`. The panel sets
  `--jv-sticky-top` (56 px, plus the 48 px tab row while the panel is narrower
  than 1560 px and the tabs take their own line) and uses it for
  `scroll-padding`, so focus and `scrollIntoView` never land
  under the header or the bottom nav.
* No fixed heights on text containers; no `overflow: hidden` that clips
  text; long values wrap (`overflow-wrap: anywhere`) or truncate with
  `.jv-truncate` and a `title`.

## 4. Typography and colour

* Font: inherit (`--jv-font` = HA's body font; `--jv-font-code` for ids,
  entity ids, YAML, timestamps). **Never** set a named `font-family`, never
  `@import` or load a web font. Sizes: `--jv-font-size-xs..2xl`; weights
  `--jv-font-weight-normal|medium|bold`. Headline inside a card is the card
  heading - do not add your own `<h1>`.
* Colour: **only** the `--jv-*` tokens from `src/theme/tokens.ts`. No `#hex`,
  no `rgb()/hsl()`, no named colours (`red`, `white`, ...). `npm run
  lint:theme` fails the build otherwise, and the smoke test re-checks the
  CSS the browser actually adopts. `transparent`, `currentColor`, `inherit`
  are fine. Need a tint? `--jv-ok-soft`, `--jv-warn-soft`, `--jv-danger-soft`,
  `--jv-accent-soft`, `--jv-neutral-soft`, `--jv-hover`, `--jv-surface-2`.
  Need a new token? Ask the scaffold owner; do not add it locally.
* State colours mean one thing each: `--jv-ok` (running, online, occupied,
  success), `--jv-warn` (degraded, asleep, needs attention), `--jv-danger`
  (error, lockdown, intrusion, destructive actions), `--jv-info` (neutral
  highlight), `--jv-accent` (the primary action / selected state). Never
  convey state by colour alone: pair it with text or an icon.
* The raw state colours are for dots, bars, borders and filled buttons. As
  **text** they fail WCAG AA in HA light (`--jv-warn` 1.96:1, `--jv-accent`
  2.63:1, `--jv-ok` 3.30:1 on a card, worse on their own tint), so any 11-14 px
  text that carries a state uses `--jv-ok-text`, `--jv-warn-text`,
  `--jv-danger-text`, `--jv-info-text` or `--jv-accent-text` (>= 4.5:1 on a
  card and on the matching `--jv-*-soft` tint in both themes). On a tint, the
  badge pattern is best: `color: var(--jv-text)` and the state in the dot or
  the border.
* `--jv-text-3` is HA's *disabled* colour (1.9:1 on a light card): disabled
  controls, placeholders and inactive dots only. Captions and labels the user
  reads are `--jv-text-2`.
* Text on a filled button: `--jv-on-accent` on `--jv-accent`, `--jv-on-danger`
  on `--jv-danger` (`.jv-btn.primary` / `.jv-btn.danger` already do).
* Both themes must look right. Toggle Dark in the harness before you finish.

## 5. Motion

One animation exists: `.jv-pulse` (opacity pulse, motion-safe only) for a
live occupancy dot. No other keyframes, no spinners that spin, no sweeps,
no scanlines, no transitions longer than 200 ms. Respect
`prefers-reduced-motion` for anything you do add (you should not need to).

## 6. States

Every data-bearing region shows one of: loading (`<jv-empty kind="loading">`
or a `loading` `<jv-section>`), empty (`<jv-empty>` with a helpful message and,
when sensible, an action), error (`<ha-alert alert-type="error">` with a Retry
button, the `WsError.message` as body), or content. Never a blank card, never
`undefined`/`NaN`/`[object Object]` on screen. Optimistic updates are fine for
toggles; roll back and show the error if the call fails.

## 7. Mobile

* Nothing scrolls horizontally at 360 px. Tables become stacked rows (`jv-kv
  stacked`) or lists on narrow; use `this.narrow` or a container query.
* The panel shows a bottom nav on narrow; the content already has the
  bottom padding. A view's primary action on narrow is a full-width button at
  the end of the card or a sticky bar (`position: sticky; bottom: 0`) inside
  the view - never a floating button over the nav.
* Dialogs are full-width on narrow (`<jv-confirm>` and `ha-dialog` already
  are).

## 8. Accessibility

* Every control has a visible label or `aria-label`; icon-only buttons use
  `ha-icon-button .label` / `aria-label`. Form fields use `<label for>` or
  the HA element's `.label`.
* Lists of items are `<ul>/<li>`; tables are `<table>` with `<th scope>`;
  groups of toggles are `<fieldset>`. Status that changes live sits in an
  `aria-live="polite"` region.
* Keyboard: everything clickable is a `<button>` or `<a>` (not a `div` with
  `@click`); focus order follows reading order; focus is visible (the base
  ring) and never removed. The ring is an OUTER 4 px box-shadow: a control
  inside an `overflow: hidden` / `overflow: auto` box either gets room for it
  (4 px padding) or uses `box-shadow: var(--jv-focus-ring-inset)`; a rule that
  sets its own `box-shadow` on a pressed state must restate the ring in its
  `:focus-visible` variant. Dialogs trap focus and close on Escape.
* Destructive actions (forget, delete, dismiss-all, call off, lockdown)
  confirm with `confirmDialog({destructive: true})`.

## 9. i18n

Every user-visible string goes through `t("English text")` - labels,
buttons, headings, placeholders, `aria-label`s, empty-state copy, alert
titles. Keys are the English string; placeholders use `{name}`:
`t("{count} areas", {count: n})`. Technical values (entity ids, model names,
timestamps, numbers from the backend) are not translated. Do not add
dictionary entries to `custom_components/jarvis/frontend/i18n/*.json` yourself;
list the new English keys at the end of your spec so they can be translated
in one pass.

## 10. Ownership and checks

* You own `src/views/<key>.ts`, `src/views/<key>/**`, and
  `dev/fixtures/*.json` for the commands your view calls (name them
  `<type with / -> _>.json`, see `dev/fixtures/README.md`). You do not edit
  `src/panel.ts`, `src/theme/*`, `src/components/*`, `src/views/index.ts`,
  `src/views/view-base.ts`, `scripts/*`, `dev/index.html`, `dev/mock-hass.ts`
  or another view.
* Before you hand over: `npm run all` (type check, theme lint, build, smoke)
  is green and the rebuilt bundle at
  `custom_components/jarvis/frontend/jarvis-panel.js` is part of your change.
  CI fails if the committed bundle is stale.
* Look at your view in the harness (`npm run dev`, http://localhost:5173/jarvis/<key>)
  in light, dark and narrow.
