/**
 * The search form shared by "Search documents" and "Conversation memory":
 * an <ha-textfield> (fallback <input type="search">) with a visible label for
 * assistive tech, a Clear control and a primary Search button. Enter submits;
 * a blank submit or an emptied field clears (spec §3.2 / A6).
 */
import { html, nothing, type TemplateResult } from "lit";
import { haDefined } from "../../ha";
import { t } from "../../i18n";

export interface QueryFormOptions {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  pending: boolean;
  disabled: boolean;
  /** true when a result set is shown (enables Clear even with an empty field) */
  hasResults: boolean;
  onInput: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}

export function renderQueryForm(o: QueryFormOptions): TemplateResult {
  const blank = !o.value.trim();
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      o.onSubmit();
    } else if (e.key === "Escape" && (o.value || o.hasResults)) {
      e.preventDefault();
      o.onClear();
    }
  };
  const onInput = (e: Event) => {
    const v = (e.target as HTMLInputElement).value ?? "";
    o.onInput(v);
    if (!v && o.hasResults) o.onClear();
  };
  const field = haDefined("ha-textfield")
    ? html`<ha-textfield
        id=${o.id}
        type="search"
        .label=${o.label}
        .placeholder=${o.placeholder}
        .value=${o.value}
        .disabled=${o.disabled}
        .readOnly=${o.pending}
        autocomplete="off"
        @input=${onInput}
        @keydown=${onKeydown}
      ></ha-textfield>`
    : html`<label class="visually-hidden" for=${o.id}>${o.label}</label>
        <input
          id=${o.id}
          type="search"
          autocomplete="off"
          placeholder=${o.placeholder}
          .value=${o.value}
          ?disabled=${o.disabled}
          ?readonly=${o.pending}
          @input=${onInput}
          @keydown=${onKeydown}
        />`;
  const showClear = (!!o.value || o.hasResults) && !o.pending;
  return html`
    <form
      class="query"
      @submit=${(e: Event) => {
        e.preventDefault();
        if (blank) o.onClear();
        else o.onSubmit();
      }}
    >
      <div class="field">${field}</div>
      ${showClear
        ? html`<button class="jv-icon-btn clear" type="button" aria-label=${t("Clear")} ?disabled=${o.disabled} @click=${o.onClear}>
            <span aria-hidden="true">×</span>
          </button>`
        : nothing}
      <button class="jv-btn primary submit" type="submit" ?disabled=${blank || o.pending || o.disabled}>
        ${o.pending ? t("Searching…") : t("Search")}
      </button>
    </form>
  `;
}
