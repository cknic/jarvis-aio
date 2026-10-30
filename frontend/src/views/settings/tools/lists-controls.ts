/**
 * Small shared controls for the settings tools in this folder: a select and a
 * switch that use HA's elements when they are defined and a token-styled
 * native element otherwise, plus the stylesheet those fallbacks need. Every
 * element that uses them calls `watchDefinitions(this, CONTROL_TAGS)` so it
 * re-renders when HA's elements arrive.
 */
import { html, css, nothing } from "lit";
import { live } from "lit/directives/live.js";
import { html as staticHtml, literal } from "lit/static-html.js";
import { haDefined } from "../../../ha";
import { t } from "../../../i18n";
import { toHaSelectValue, fromHaSelectValue } from "../coerce";

export const CONTROL_TAGS = ["ha-switch", "ha-select", "ha-list-item", "mwc-list-item", "ha-textfield", "ha-icon"];

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  label: string;
  value: string;
  options: SelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

/** `<ha-select>` + list items when defined, else a native `<select>`; `onChange` fires only when the value differs. */
export function renderSelect(p: SelectProps) {
  const handler = (e: Event) => {
    const el = e.target as HTMLSelectElement & { value?: string };
    const next = fromHaSelectValue(String(el.value ?? ""));
    if (next !== p.value) p.onChange(next);
  };
  if (haDefined("ha-select")) {
    const item = haDefined("ha-list-item") ? literal`ha-list-item` : literal`mwc-list-item`;
    return html`
      <ha-select
        id=${p.id ?? nothing}
        .label=${p.label}
        .value=${live(toHaSelectValue(p.value))}
        ?disabled=${!!p.disabled}
        naturalMenuWidth
        fixedMenuPosition
        @selected=${handler}
        @closed=${(e: Event) => e.stopPropagation()}
      >
        ${p.options.map((o) => staticHtml`<${item} .value=${toHaSelectValue(o.value)} ?disabled=${!!o.disabled}>${o.label}</${item}>`)}
      </ha-select>
    `;
  }
  return html`
    <select id=${p.id ?? nothing} class="jv-select" .value=${live(p.value)} ?disabled=${!!p.disabled} aria-label=${p.label} @change=${handler}>
      ${p.options.map((o) => html`<option value=${o.value} ?disabled=${!!o.disabled} ?selected=${o.value === p.value}>${o.label}</option>`)}
    </select>
  `;
}

export interface SwitchProps {
  id?: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

/** `<ha-switch>` when defined, else a native checkbox with role="switch". */
export function renderSwitch(p: SwitchProps) {
  const handler = (e: Event) => {
    const el = e.target as HTMLInputElement & { checked?: boolean };
    p.onChange(!!el.checked);
  };
  return haDefined("ha-switch")
    ? html`<ha-switch id=${p.id ?? nothing} .checked=${live(p.checked)} ?disabled=${!!p.disabled} aria-label=${p.label} @change=${handler}></ha-switch>`
    : html`<input id=${p.id ?? nothing} type="checkbox" role="switch" class="jv-switch" .checked=${live(p.checked)} ?disabled=${!!p.disabled} aria-label=${p.label} @change=${handler} />`;
}

export interface TextProps {
  id?: string;
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "number" | "url";
  min?: number;
  step?: number | "any";
  disabled?: boolean;
  invalid?: boolean;
  /** fires on change (blur / Enter) with the raw string */
  onChange: (value: string) => void;
  /** fires on every keystroke (draft editors) */
  onInput?: (value: string) => void;
}

/** `<ha-textfield>` when defined, else a native `<input>`. */
export function renderText(p: TextProps) {
  const read = (e: Event) => String((e.target as HTMLInputElement).value ?? "");
  const type = p.type ?? "text";
  if (haDefined("ha-textfield")) {
    return html`<ha-textfield
      id=${p.id ?? nothing}
      type=${type}
      .label=${p.label}
      .value=${live(p.value)}
      .placeholder=${p.placeholder ?? ""}
      min=${p.min ?? nothing}
      step=${p.step ?? nothing}
      ?disabled=${!!p.disabled}
      ?invalid=${!!p.invalid}
      @input=${p.onInput ? (e: Event) => p.onInput?.(read(e)) : nothing}
      @change=${(e: Event) => p.onChange(read(e))}
    ></ha-textfield>`;
  }
  return html`<input
    id=${p.id ?? nothing}
    class="jv-input"
    type=${type}
    .value=${live(p.value)}
    placeholder=${p.placeholder ?? ""}
    aria-label=${p.label}
    aria-invalid=${p.invalid ? "true" : "false"}
    min=${p.min ?? nothing}
    step=${p.step ?? nothing}
    ?disabled=${!!p.disabled}
    @input=${p.onInput ? (e: Event) => p.onInput?.(read(e)) : nothing}
    @change=${(e: Event) => p.onChange(read(e))}
  />`;
}

/** Styles for the native fallbacks above and the list rows the tools share. */
export const controlStyles = css`
  .jv-select,
  .jv-input,
  ha-select,
  ha-textfield {
    width: 100%;
    display: block;
    min-width: 0;
  }
  .jv-select,
  .jv-input {
    font: inherit;
    color: var(--jv-text);
    background: var(--jv-surface);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    padding: 0 var(--jv-space-3);
    min-height: var(--jv-tap);
  }
  .jv-input::placeholder {
    color: var(--jv-text-2);
  }
  .jv-input[aria-invalid="true"] {
    border-color: var(--jv-danger);
  }
  .jv-switch {
    width: 20px;
    height: 20px;
    margin: 0;
    accent-color: var(--jv-accent);
    flex: none;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    overflow: hidden;
  }
  .rows > li {
    display: flex;
    align-items: center;
    gap: var(--jv-space-3);
    min-height: var(--jv-tap);
    padding: var(--jv-space-2) var(--jv-space-3);
  }
  .rows > li + li {
    border-top: var(--jv-border-width) solid var(--jv-border);
  }
  .rows .text {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .rows .name {
    overflow-wrap: anywhere;
  }
  .rows .sec {
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
    overflow-wrap: anywhere;
  }
  .rows .ctl {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
    min-width: 0;
  }
  .note {
    margin: var(--jv-space-1) 0 0;
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
    overflow-wrap: anywhere;
  }
  .note.warn {
    color: var(--jv-warn-text);
  }
  .note.error {
    color: var(--jv-danger-text);
  }
  .note.ok {
    color: var(--jv-ok-text);
  }
  .link {
    appearance: none;
    font: inherit;
    font-size: var(--jv-font-size-s);
    background: transparent;
    border: 0;
    color: var(--jv-accent-text);
    cursor: pointer;
    padding: var(--jv-space-1) 0;
    min-height: 28px;
    /* .jv-hit adds height only: keep short labels ("Use") 44 px wide too */
    min-width: var(--jv-tap);
  }
  .link:disabled {
    cursor: default;
    color: var(--jv-text-3);
  }
`;

/** `t("ON")` / `t("OFF")` for a switch's visible state text. */
export function onOff(checked: boolean): string {
  return checked ? t("ON") : t("OFF");
}

/** The friendly name of an entity, or its id (never throws for a stale id). */
export function friendlyName(hass: { states?: Record<string, { attributes?: Record<string, unknown> }> } | undefined, id: string): string {
  const n = hass?.states?.[id]?.attributes?.friendly_name;
  return typeof n === "string" && n ? n : id;
}

/** Fire the panel's navigation event from a nested element. */
export function navigateFrom(el: HTMLElement, view: string, path?: string): void {
  el.dispatchEvent(new CustomEvent("jarvis-navigate", { bubbles: true, composed: true, detail: { view, path } }));
}
