/**
 * Small form-control helpers shared by the Rooms and Import tabs of the
 * floor-plan editor: a select, a number field, a text field (optionally with a
 * <datalist>), a switch and an alert, each using Home Assistant's element when
 * it is defined in the page and a token-styled native element otherwise
 * (DESIGN.md section 2). Every control renders a VISIBLE label.
 *
 * All callbacks fire on `change` (a committed value), never on `input`.
 */
import { html, nothing, css, type TemplateResult } from "lit";
import { html as staticHtml, literal } from "lit/static-html.js";
import { live } from "lit/directives/live.js";
import { haDefined } from "../../../../ha";

/** Feature-detected HA elements the controls may use (pass to watchDefinitions). */
export const HA_CONTROL_TAGS = ["ha-textfield", "ha-select", "ha-list-item", "mwc-list-item", "ha-switch", "ha-icon", "ha-alert"];

export const controlStyles = css`
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--jv-space-1);
    min-width: 0;
  }
  .field-label {
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
    font-weight: var(--jv-font-weight-medium);
  }
  .field input:not([type="checkbox"]):not([type="range"]):not([type="file"]),
  .field select,
  .field ha-textfield,
  .field ha-select {
    width: 100%;
    display: block;
    min-width: 0;
    box-sizing: border-box;
  }
  .field input:not([type="checkbox"]):not([type="range"]):not([type="file"]),
  .field select {
    font: inherit;
    color: var(--jv-text);
    background: var(--jv-surface);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    padding: 0 var(--jv-space-3);
    min-height: var(--jv-tap);
  }
  .field input:not([type="checkbox"]):not([type="range"]):not([type="file"]):disabled,
  .field select:disabled {
    color: var(--jv-text-3);
    background: var(--jv-surface-2);
    cursor: not-allowed;
  }
  .field input[type="checkbox"] {
    width: 20px;
    height: 20px;
    margin: 0;
    accent-color: var(--jv-accent);
  }
  .field input[type="range"] {
    width: 100%;
    min-height: var(--jv-tap);
    accent-color: var(--jv-accent);
  }
  .field input[type="file"] {
    font: inherit;
    color: var(--jv-text);
    min-height: var(--jv-tap);
    max-width: 100%;
  }
  .switch-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--jv-space-3);
    min-height: var(--jv-tap);
  }
  .switch-row .field-label {
    color: var(--jv-text);
  }
  .status {
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
    min-height: 1.2em;
    overflow-wrap: anywhere;
  }
  .status.saved {
    color: var(--jv-ok-text);
  }
  .status.error {
    color: var(--jv-danger-text);
  }
  .alert {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2) var(--jv-space-3);
    padding: var(--jv-space-3) var(--jv-space-4);
    border-radius: var(--jv-radius-sm);
    color: var(--jv-text);
    font-size: var(--jv-font-size-s);
  }
  .alert > span {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .alert.info {
    background: var(--jv-info-soft);
  }
  .alert.warning {
    background: var(--jv-warn-soft);
  }
  .alert.error {
    background: var(--jv-danger-soft);
  }
  .alert.success {
    background: var(--jv-ok-soft);
  }
  ha-alert {
    display: block;
  }
  .hint {
    margin: 0;
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
    overflow-wrap: anywhere;
  }
`;

export interface SelectOption {
  value: string;
  label: string;
}

export function jvIcon(icon: string, fallback = ""): TemplateResult | typeof nothing {
  if (haDefined("ha-icon")) return html`<ha-icon .icon=${icon}></ha-icon>`;
  return fallback ? html`<span aria-hidden="true">${fallback}</span>` : nothing;
}

export function jvAlert(type: "info" | "warning" | "error" | "success", body: unknown): TemplateResult {
  if (haDefined("ha-alert")) return html`<ha-alert alert-type=${type}>${body}</ha-alert>`;
  return html`<div class="alert ${type}" role=${type === "error" ? "alert" : "status"}>${body}</div>`;
}

export interface SelectArgs {
  id: string;
  label: string;
  value: string;
  options: readonly SelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function jvSelect(a: SelectArgs): TemplateResult {
  const inOptions = a.options.some((o) => o.value === a.value);
  const onSelect = (e: Event) => {
    const el = e.target as HTMLSelectElement & { value?: string };
    const next = String(el.value ?? "");
    if (next !== a.value) a.onChange(next);
  };
  let control: TemplateResult;
  if (haDefined("ha-select")) {
    const item = haDefined("ha-list-item") ? literal`ha-list-item` : literal`mwc-list-item`;
    control = html`
      <ha-select id=${a.id} .value=${live(a.value)} aria-label=${a.label} ?disabled=${!!a.disabled} naturalMenuWidth fixedMenuPosition
        @selected=${onSelect} @closed=${(e: Event) => e.stopPropagation()}>
        ${inOptions ? nothing : staticHtml`<${item} .value=${a.value} disabled>${a.value || "∅"}</${item}>`}
        ${a.options.map((o) => staticHtml`<${item} .value=${o.value}>${o.label}</${item}>`)}
      </ha-select>`;
  } else {
    control = html`
      <select id=${a.id} .value=${live(a.value)} aria-label=${a.label} ?disabled=${!!a.disabled} @change=${onSelect}>
        ${inOptions ? nothing : html`<option value=${a.value} disabled>${a.value || "∅"}</option>`}
        ${a.options.map((o) => html`<option value=${o.value} ?selected=${o.value === a.value}>${o.label}</option>`)}
      </select>`;
  }
  return html`<div class="field"><label class="field-label" for=${a.id}>${a.label}</label>${control}</div>`;
}

export interface NumberArgs {
  id: string;
  label: string;
  value: number | null;
  min?: number;
  max?: number;
  step?: number | "any";
  placeholder?: string;
  disabled?: boolean;
  /** text shown after the label, e.g. the unit */
  suffix?: string;
  onChange: (value: number | null) => void;
}

export function jvNumber(a: NumberArgs): TemplateResult {
  const text = a.value === null || a.value === undefined || !Number.isFinite(a.value) ? "" : String(a.value);
  const onChange = (e: Event) => {
    const el = e.target as HTMLInputElement;
    const raw = String(el.value ?? "").trim();
    if (raw === "") {
      if (a.value !== null) a.onChange(null);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      el.value = text;
      return;
    }
    let v = n;
    if (a.min != null && v < a.min) v = a.min;
    if (a.max != null && v > a.max) v = a.max;
    if (v !== a.value) a.onChange(v);
    else el.value = text;
  };
  const label = a.suffix ? `${a.label} (${a.suffix})` : a.label;
  const control = haDefined("ha-textfield")
    ? html`<ha-textfield id=${a.id} type="number" .value=${live(text)} .placeholder=${a.placeholder ?? ""} aria-label=${label}
        min=${a.min ?? nothing} max=${a.max ?? nothing} step=${a.step ?? "any"} ?disabled=${!!a.disabled} @change=${onChange}></ha-textfield>`
    : html`<input id=${a.id} type="number" inputmode="decimal" .value=${live(text)} placeholder=${a.placeholder ?? ""} aria-label=${label}
        min=${a.min ?? nothing} max=${a.max ?? nothing} step=${a.step ?? "any"} ?disabled=${!!a.disabled} @change=${onChange} />`;
  return html`<div class="field"><label class="field-label" for=${a.id}>${label}</label>${control}</div>`;
}

export interface TextArgs {
  id: string;
  label: string;
  value: string;
  /** suggestions rendered as a <datalist> */
  suggestions?: readonly string[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function jvText(a: TextArgs): TemplateResult {
  const onChange = (e: Event) => {
    const el = e.target as HTMLInputElement;
    const next = String(el.value ?? "").trim();
    if (next !== a.value) a.onChange(next);
    else el.value = a.value;
  };
  const listId = a.suggestions ? `${a.id}-list` : undefined;
  // ha-textfield cannot host a <datalist>: the suggestion variant is always the native input
  const control =
    !a.suggestions && haDefined("ha-textfield")
      ? html`<ha-textfield id=${a.id} type="text" .value=${live(a.value)} .placeholder=${a.placeholder ?? ""} aria-label=${a.label} ?disabled=${!!a.disabled} @change=${onChange}></ha-textfield>`
      : html`<input id=${a.id} type="text" .value=${live(a.value)} placeholder=${a.placeholder ?? ""} aria-label=${a.label} list=${listId ?? nothing}
          autocomplete="off" ?disabled=${!!a.disabled} @change=${onChange} />
          ${listId ? html`<datalist id=${listId}>${a.suggestions!.map((s) => html`<option value=${s}></option>`)}</datalist>` : nothing}`;
  return html`<div class="field"><label class="field-label" for=${a.id}>${a.label}</label>${control}</div>`;
}

export interface SwitchArgs {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

export function jvSwitch(a: SwitchArgs): TemplateResult {
  const onToggle = (e: Event) => {
    const el = e.target as HTMLInputElement & { checked?: boolean };
    const next = !!el.checked;
    if (next !== a.checked) a.onChange(next);
  };
  const control = haDefined("ha-switch")
    ? html`<ha-switch id=${a.id} .checked=${live(a.checked)} ?disabled=${!!a.disabled} aria-label=${a.label} @change=${onToggle}></ha-switch>`
    : html`<input id=${a.id} type="checkbox" role="switch" .checked=${live(a.checked)} ?disabled=${!!a.disabled} aria-label=${a.label} @change=${onToggle} />`;
  return html`<div class="field switch-row"><label class="field-label" for=${a.id}>${a.label}</label>${control}</div>`;
}
