# Settings view plug-ins

The Settings view (`src/views/settings.ts`) is "settings as data": it renders
one `<jarvis-config-field>` per entry of `jarvis/config_schema` and writes
through `jarvis/update_config`. It knows no key by hand. Two extension
points, both in `src/views/settings/registry.ts`, let the Phase 3 tools hook
in without touching the view:

| extension    | registers                                        | renders where                                   |
| ------------ | ------------------------------------------------ | ----------------------------------------------- |
| field editor | `registerFieldEditor(key \| predicate, factory)` | inside the key's row, in place of the kind switch |
| tool card    | `registerToolCard(category, {id, title, element})` | at the top of that category, above the fields |

Both get everything through a `SettingsHost` (read any key's effective value,
write through the view's single save pipeline, re-fetch, toast). Specs with the
exact backend contracts: `frontend/specs/settings-tools.md` (what each tool
shows and writes), `frontend/specs/settings.md` (the generic view). The design
rules in `frontend/DESIGN.md` apply unchanged (tokens only, 44 px targets,
`haDefined()` for every HA element, `t()` for every string).

## Wiring a plug-in module

Every plug-in lives in `src/views/settings/tools/` - field editors and tool
cards alike, one module per element - and registers itself at top level.
`settings.ts` imports the folder's barrel once, in the block marked
`plug-ins` right after the registry import, and never changes:

```ts
// settings.ts
import "./settings/tools";
```

A new module is one line in the barrel, `tools/index.ts` (or, for a runtime
tool card, in `tools/runtime.ts`, which imports the `runtime-*.ts` cards and
registers them):

```ts
// tools/index.ts
import "./models";          // registerFieldEditor(...) for the AI model roles
import "./runtime";         // the runtime tool cards (runtime-energy.ts, ...)
```

That is the only line a Build agent adds outside its own files. Shared
helpers sit next to them (`lists-controls.ts`, `runtime-base.ts`); the
fixtures your commands need go under `dev/fixtures/<type with / -> _>.json`.

## SettingsHost

```ts
interface SaveResult { ok: boolean; error?: WsError }   // no error = the user cancelled a confirm dialog

interface SettingsHost {
  value(key): unknown;                 // schema.values[key] ?? field.default; undefined when not in the catalogue
  field(key): ConfigField | undefined;
  save(key, value): Promise<SaveResult>;           // coerced to the kind; never throws
  saveMany([[key, value], ...]): Promise<SaveResult>;   // in order, stops at the first failure
  refetch(): void;                     // debounced silent jarvis/config_schema re-fetch
  refreshSnapshot(): void;             // JarvisView.refresh() -> jarvis/get_panel_data
  toast(message): void;                // hass-notification
}
```

`save()` is the view's own `_change` → `_save`: confirm-before-enable for
`CONFIRM_ON_ENABLE` keys, the `ui_language` ordering, the appliance-monitor
reload after `appliance_profile` / `appliance_announce_unknown`, the per-row
*Saving… / Saved ✓ / Save failed* status, queueing of a second write to the
same key (only the latest value is sent; both callers get the final result),
the debounced schema re-fetch and the shell refresh. Never call
`ws("jarvis/update_config")` yourself.

## Field editors

```ts
import { html } from "lit";
import { registerFieldEditor } from "../registry";

registerFieldEditor(
  "satellite_pairings",                       // exact key, or (field) => boolean
  (field, value, onChange, ctx) => html`...`, // the control
  { consumes: [], noReset: false },           // optional
);
```

`factory(field, value, onChange, ctx)`:

* `field` – the owner key's catalogue entry (`ConfigField`: key, kind, label,
  category, default, options, min, max, step, expose).
* `value` – already the kind's JS type: `list → string[]`, `json → parsed
  value`, `bool → boolean`, `int/float → number | null`, `str/enum → string`
  (the row applies `coerce.normalise()`; an unreadable stored value yields the
  kind's empty value and the row shows the usual "stored value is not a …"
  warning). While a save is in flight the row passes the value you last
  emitted (optimistic); it reverts to the stored value when the save fails.
* `onChange(next)` – save the **owner** key with the same JS type. The row
  coerces it, emits `field-change`, and the view's pipeline does the rest; the
  status appears in the row's status slot. Do not dispatch `field-change`
  yourself and do not also call `ctx.host.save(field.key, …)` (double save).
* `ctx` – `{ hass, data, narrow, disabled, label, id, placeholder, host }`.
  `disabled` is true while `hass` is missing (the view shows its offline
  banner). Put `ctx.id` on your primary control (the row's `<label for>`
  points at it) and use `ctx.label` for `aria-label`. `ctx.host` is the
  `SettingsHost` for any other key.

Options:

* `consumes: string[]` – sibling keys the editor edits too. Their generic rows
  are **not** rendered; a search hit on a consumed key shows the owner's row;
  the deep link `/settings/<cat>/<consumedKey>` scrolls to and flashes the
  owner; the owner row shows the help text of every consumed key (joined
  with a line break) and the save status of the owner **and** each consumed
  key (most severe level wins, messages joined with " · "). Save consumed
  keys with `ctx.host.save(consumedKey, value)`.
* `noReset: true` – hide the row's "Default: … / Reset to default" (when the
  editor has its own reset path, e.g. the AI Models editor).

Resolution: an exact-key registration beats a predicate; among several of
the same kind the **last registered wins**, so a plug-in imported after the
built-in overrides it. `registerFieldEditor()` returns an unregister function.

What stays with the row: label, `key` code, "HA entity" badge, help / hint,
default + reset and the status slot. What the editor owns: the control, its
own transient notes ("Loading models…"), its HA-element detection
(`haDefined` / `watchDefinitions(this, [...])` inside your element).

Editors read `hass` / `data` from `ctx` on every render; never cache `hass`.
A factory may return a template that uses your own custom element (`html`
`<jarvis-editor-x .hass=${ctx.hass} …>`) — that is the normal shape for
anything with state (drafts, fetches). Keep the module's `jarvis/…` command
strings literal (the WS contract test greps for them).

### Built-in: `<jv-picker>` for id lists

`registry.ts` registers one editor itself: every `kind: "list"` key whose name
ends in `_entities`, `_domains`, `_labels` or `_areas` renders a multi-select
`<jv-picker>` (`voice_confirm_entities`, `announcement_speakers` is **not**
matched — it ends in `_speakers` —, `pattern_include_entities` with the
`binary_sensor / device_tracker / person / sensor` filter from the spec,
`excluded_entities`, `excluded_domains` (custom values allowed),
`excluded_labels` (custom allowed; stores the label id, resolves legacy
names), `presence_only_entities`, `outdoor_areas`, `outdoor_entities`,
`indoor_entities`, `bedroom_areas`, `lab_areas`). Every add / remove saves the
whole array at once. The `!`-prefixed voice-confirm exemptions round-trip
unchanged (shown with an "exempt" tag); ids that no longer resolve are kept and
tagged "not found". A spec editor for one of these keys simply registers
the exact key and wins: `voice_confirm_entities` does
(`tools/voice-confirm-list.ts`, a Require / Exempt toggle per entry; Exempt
stores `"!"+id`), and so does the json key `biometric_entities`
(`tools/biometrics-map.ts`, nine kind -> entity pickers, §4.11).

## `<jv-picker>` (`src/components/jv-picker.ts`)

```html
<jv-picker kind="entity|area|domain|label|device" multiple allow-custom
           .hass=${hass} .data=${data} .value=${ids} .label=${label}
           .domains=${["media_player"]} .placeholder=${""} ?disabled=${off}
           @value-changed=${(e) => { e.stopPropagation(); use(e.detail.value); }}>
```

* `value-changed` → `detail.value` is `string[]` (multiple) or
  `string | undefined` (single; `undefined` = cleared) — the same shape HA's
  pickers emit, in both branches, so one handler serves both.
* HA branch when defined: `ha-selector` (entity / area / label / device /
  select-with-custom-values), else `ha-entity-picker` / `ha-entities-picker`
  / `ha-area-picker` / `ha-areas-picker`. The branch is re-evaluated only
  while the picker is not focused, so a lazily arriving HA element never
  steals the caret.
* Fallback: chips for the selected values (label, id in code font, "exempt" /
  "not found" tags, a 44 px × button labelled "Remove {name}") + a
  `role="combobox"` input with a `role="listbox"` list (type to filter, ↑/↓,
  Enter picks or adds a custom value, Escape closes, Backspace on an empty
  input removes the last chip; 50 rows shown, "{count} more — type to
  filter"). An "Add" button appears for typed custom values.
* Sources: entities and domains from `hass.states`; areas from `hass.areas`,
  then `data.areas`, then `config/area_registry/list`; labels from
  `data.config.available_labels`, then `config/label_registry/list`; devices
  from `hass.devices`, then `config/device_registry/list`. Registry lists are
  fetched on first focus and shared for 60 s (`clearPickerRegistryCache()`).
  `.items` (`{value,label}[]` or a function) replaces the source for any kind
  — use it for models, Cast devices, satellites, rules.
* Harness fixtures for the three registry commands:
  `dev/fixtures/config_area_registry_list.json`,
  `config_label_registry_list.json`, `config_device_registry_list.json`.

## Tool cards

```ts
// tools/runtime.ts
import { registerToolCard } from "../registry";
import "./runtime-energy";   // defines <jarvis-tool-energy>

registerToolCard("safety", {
  id: "energy",                       // deep link /jarvis/settings/safety/tool:energy
  title: "Energy Management",         // English t() key; matched by the search box
  element: "jarvis-tool-energy",      // your custom element
  icon: "mdi:flash-outline",          // optional, informational
  keywords: ["power", "watts"],       // optional extra search words (not translated)
});
```

Categories: `core, voice, learning, safety, cameras, home, governance` (the
`category` values of `jarvis/config_schema`; display names are
`CATEGORY_NAMES` in `presentation.ts`). Cards render in registration order at
the **top** of their category, above the fields card; registering the same
`id` again replaces the card.

The element receives these properties (declare them with `@property({
attribute: false })`, or implement `ToolCardElement` from `registry.ts`):

| property | what                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| `hass`   | live HA (re-set on every state change; never cache it)                        |
| `data`   | the `jarvis/get_panel_data` snapshot or `null`                                 |
| `narrow` | HA's narrow flag                                                               |
| `host`   | the `SettingsHost`; **all** config writes go through `host.save()`             |
| `active` | `true` while the card is on screen — fetch on the first `true`, not on connect |

The view also sets `data-tool-id="<id>"` and toggles a boolean `flash`
attribute for ~1.6 s after a deep link; style `:host([flash])` with
`--jv-accent-soft` like the field row does. The element renders **its own
`<jv-section heading icon subheading>`** (so it can put a badge or a Refresh
button in `slot="actions"`) and owns its loading / empty / error states
(DESIGN.md §6). Runtime commands (`jarvis/energy`, `jarvis/hazard`, …) are
called with `ws(this.hass, "jarvis/…", payload)` from `src/ws.ts`; config keys
are never written with `update_config` directly.

In search mode a card shows under its category when the query matches its
(translated) title, id or a keyword; its contents are not searched. The
search-result count for a category is fields + matching cards.

## Row anatomy reference (`field.ts`)

`<jarvis-config-field>` properties: `field`, `value`, `label`, `help`,
`hint`, `placeholder`, `suggest`, `status`, `statuses` (consumed keys),
`hass`, `data`, `host`, `disabled`, `showKey`, `narrow`, `flash`. Events:
`field-change {key, value}` and `field-reset {key}`. The registry is consulted
in `render()` before the kind switch; when an editor matches, the control is
`<div class="control wide">${factory(…)}</div>` and `inlineControl` (the
switch-in-the-header layout for `bool`) is off.

## New English strings introduced by this foundation

Not yet in `custom_components/jarvis/frontend/i18n/*.json` (list them for the
translation pass; do not edit the dictionaries yourself):

```
"{value}" is not a known {thing}
entity id
area
domain
label
device
Selected
exempt
not found
Remove {name}
Search…
Replace…
Add
Loading…
No matches
Press Enter to add “{value}”
{count} more — type to filter        (already used by field.ts)
```

## Verifying

```sh
cd frontend
npm run check && npm run lint:theme
OUT=/path/elsewhere.js npm run build && OUT=/path/elsewhere.js npm run smoke
npm run dev     # http://localhost:5173/jarvis/settings/learning — light, dark, narrow
```

The harness and the smoke test never define HA's elements, so they exercise
the fallback branch only; look at the `ha-selector` branch in a real Home
Assistant (open any entity dialog first so the element is loaded).
