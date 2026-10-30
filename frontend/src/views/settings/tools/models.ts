/**
 * AI Models — one field editor per LLM role (frontend/specs/settings-tools.md §4.1).
 *
 * Registered on each `*_provider` key and consuming the matching `*_model`
 * key, so the General category shows one row per role with the provider
 * select and the model picker side by side:
 *
 *   llm_provider / model                      Main Agent
 *   classifier_provider / classifier_model    Classifier
 *   reasoning_provider / reasoning_model      Reasoning
 *   review_provider / review_model            Review
 *   vision_provider / vision_model            Vision
 *   camera_reasoning_provider / …_model       Camera Rsn
 *
 * The live model list comes from `jarvis/list_models {provider}` (admin-only;
 * it never answers with an error frame — a failure is `{models: [], error}`),
 * cached per provider for the page until "jarvis-refresh" or a base-URL
 * change. A stored model the provider no longer lists is flagged with a
 * visible warning and a one-tap "Use {model}" button — there is no silent
 * self-heal (spec §9 R2).
 *
 * Writes: provider → host.saveMany([[providerKey, p], ["llm_base_url", ""]?])
 * (the legacy shared endpoint is cleared when the main agent moves to a cloud
 * provider, as the old panel did); model → host.save(modelKey, id).
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { registerFieldEditor, type SettingsHost } from "../registry";
import { base } from "../../../theme/base";
import { t } from "../../../i18n";
import { ws, WsError } from "../../../ws";
import { haDefined, watchDefinitions } from "../../../ha";
import type { Hass, PanelData } from "../../../types";
import "../../../components";
import "../../../components/jv-picker";
import type { PickerChangeDetail, PickerItem } from "../../../components/jv-picker";
import { CONTROL_TAGS, controlStyles, renderSelect, renderText, navigateFrom, type SelectOption } from "./lists-controls";

// ── roles ───────────────────────────────────────────────────────────────────

interface Role {
  providerKey: string;
  modelKey: string;
  /** English t() key (the old panel's card labels, translated already) */
  label: string;
  /** picks an image-capable model when suggesting a replacement */
  vision?: boolean;
}

export const MODEL_ROLES: readonly Role[] = [
  { providerKey: "llm_provider", modelKey: "model", label: "Main Agent" },
  { providerKey: "classifier_provider", modelKey: "classifier_model", label: "Classifier" },
  { providerKey: "reasoning_provider", modelKey: "reasoning_model", label: "Reasoning" },
  { providerKey: "review_provider", modelKey: "review_model", label: "Review" },
  { providerKey: "vision_provider", modelKey: "vision_model", label: "Vision", vision: true },
  { providerKey: "camera_reasoning_provider", modelKey: "camera_reasoning_model", label: "Camera Rsn" },
];

export const PROVIDERS = ["groq", "openai", "gemini", "ollama", "anthropic", "custom"] as const;
/** Cloud providers with a canonical endpoint: picking one for the main agent clears the legacy shared llm_base_url. */
const CLOUD_PROVIDERS = new Set(["groq", "openai", "gemini", "anthropic"]);
const VISION_RE = /vision|vl|scout|maverick|llama-4|gpt-4o|multimodal|qwen3\.\d|gemini/i;
const ERROR_MAX = 80;
const LIST_TIMEOUT_MS = 15_000;

// ── model list cache (per provider, per page) ──────────────────────────────

export interface ModelList {
  models: string[];
  /** backend's generic failure text, or our own note; empty on success */
  error: string;
}

const _lists = new Map<string, Promise<ModelList>>();

/** Drop every cached model list (jarvis-refresh, a base-URL change, the Refresh button). */
export function clearModelListCache(provider?: string): void {
  if (!provider) return _lists.clear();
  for (const k of [..._lists.keys()]) if (k.split("\u0000")[0] === provider) _lists.delete(k);
}

if (typeof window !== "undefined") {
  window.addEventListener("jarvis-refresh", () => clearModelListCache());
}

/** `jarvis/list_models {provider}`; always resolves (never throws). */
export function loadModels(hass: Hass | undefined, provider: string, force = false, sig = ""): Promise<ModelList> {
  if (!provider) return Promise.resolve({ models: [], error: "" });
  // keyed by provider + the configured base URLs, so six roles on one provider
  // share one call and a base-URL save invalidates every role's list at once
  const key = `${provider}\u0000${sig}`;
  if (force) _lists.delete(key);
  const hit = _lists.get(key);
  if (hit) return hit;
  const call = ws<{ models?: unknown; error?: unknown }>(hass, "jarvis/list_models", { provider })
    .then((res) => {
      const models = Array.isArray(res?.models) ? [...new Set(res.models.filter((m): m is string => typeof m === "string" && !!m))].sort() : [];
      const error = typeof res?.error === "string" ? res.error : "";
      return { models, error: models.length ? "" : error } as ModelList;
    })
    .catch((err: unknown) => {
      const e = WsError.from("jarvis/list_models", err);
      if (e.code === "unknown_command") return { models: [], error: t("not supported by this backend") };
      return { models: [], error: e.message };
    });
  const timeout = new Promise<ModelList>((resolve) =>
    setTimeout(() => resolve({ models: [], error: t("timed out — see the Home Assistant log") }), LIST_TIMEOUT_MS),
  );
  const p = Promise.race([call, timeout]).then((r) => {
    // a failed list is not cached, so the next render / Refresh retries
    if (r.error && !r.models.length && _lists.get(key) === p) _lists.delete(key);
    return r;
  });
  _lists.set(key, p);
  return p;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** A replacement for a model the provider no longer offers (spec §4.1). */
export function suggestModel(models: string[], vision: boolean): string {
  if (!models.length) return "";
  if (vision) return models.find((m) => VISION_RE.test(m)) ?? "";
  return models[0];
}

// ── element ─────────────────────────────────────────────────────────────────

@customElement("jarvis-editor-model-role")
export class JarvisEditorModelRole extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) data: PanelData | null = null;
  @property({ type: Boolean, reflect: true }) narrow = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ attribute: false }) host?: SettingsHost;
  @property({ attribute: false }) modelRole: Role = MODEL_ROLES[0];
  /** the stored provider (owner key's value; "" = inherit for non-main roles) */
  @property({ type: String }) provider = "";
  /** the stored model (consumed key's value) */
  @property({ type: String }) model = "";
  /** the configured base URLs, joined — a change invalidates the cached list */
  @property({ type: String }) baseSig = "";
  @property({ type: String }) label = "";
  @property({ type: String }) controlId = "";

  @state() private _list: ModelList | null = null;
  @state() private _loading = false;
  @state() private _custom = false;
  @state() private _pendingProvider: string | null = null;
  @state() private _pendingModel: string | null = null;
  @state() private _saving = false;

  private _fetchedFor = "";
  private _fetchedSig = "";

  static override styles = [
    base,
    controlStyles,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
        gap: var(--jv-space-3);
        align-items: start;
      }
      :host([narrow]) .grid {
        grid-template-columns: minmax(0, 1fr);
      }
      .col {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-1);
      }
      .cap {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-2);
        min-height: 20px;
      }
      .cap .role {
        font-weight: var(--jv-font-weight-medium);
        color: var(--jv-text);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-3);
      }
      .mismatch {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-3);
        margin-top: var(--jv-space-1);
        padding: var(--jv-space-2) var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-warn-soft);
        color: var(--jv-text);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      .mismatch .jv-btn {
        min-height: 36px;
        padding: 0 var(--jv-space-3);
      }
      .jv-mono {
        overflow-wrap: anywhere;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, CONTROL_TAGS);
  }

  // ── derived ───────────────────────────────────────────────────────────
  private get _isMain(): boolean {
    return this.modelRole.providerKey === "llm_provider";
  }

  private _configured(): Set<string> | null {
    const raw = this.data?.config?.configured_providers;
    const list = Array.isArray(raw) ? raw.filter((p): p is string => typeof p === "string") : [];
    return list.length ? new Set(list) : null; // missing / empty -> treat every provider as configured
  }

  /** The provider shown in the select (optimistic while a save is in flight). */
  private _currentProvider(): string {
    return this._pendingProvider ?? this.provider;
  }

  /** The provider whose models are listed: the stored one or, for the main agent, the first configured. */
  private _effectiveProvider(): string {
    const p = this._currentProvider();
    if (p) return p;
    if (!this._isMain) return "";
    const conf = this._configured();
    return conf ? [...conf].find((x) => (PROVIDERS as readonly string[]).includes(x)) ?? PROVIDERS[0] : PROVIDERS[0];
  }

  private _currentModel(): string {
    return this._pendingModel ?? this.model;
  }

  // ── fetching ──────────────────────────────────────────────────────────
  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("provider") && this._pendingProvider !== null && this.provider === this._pendingProvider) this._pendingProvider = null;
    if (changed.has("model") && this._pendingModel !== null && this.model === this._pendingModel) this._pendingModel = null;
    const provider = this._effectiveProvider();
    if (!this.hass || !provider) return;
    if (provider !== this._fetchedFor || this.baseSig !== this._fetchedSig) {
      // never show the previous provider's list (it would flag a false mismatch)
      if (provider !== this._fetchedFor) this._list = null;
      this._fetchedFor = provider;
      this._fetchedSig = this.baseSig;
      this._fetch(provider);
    }
  }

  private _fetch(provider: string, force = false): void {
    this._loading = true;
    const sig = this.baseSig;
    const p = loadModels(this.hass, provider, force, sig);
    void p.then((list) => {
      if (this._fetchedFor !== provider || this._fetchedSig !== sig) return; // changed meanwhile
      this._list = list;
      this._loading = false;
      // the free-text path is the only one left when the list failed
      if (list.error && !list.models.length) this._custom = true;
    });
  }

  private _refresh(): void {
    const provider = this._effectiveProvider();
    if (!provider || !this.hass) return;
    this._list = null;
    this._fetch(provider, true);
  }

  // ── writes ────────────────────────────────────────────────────────────
  private async _setProvider(next: string): Promise<void> {
    if (!this.host || this._saving) return;
    const entries: Array<[string, unknown]> = [[this.modelRole.providerKey, next]];
    if (this._isMain && CLOUD_PROVIDERS.has(next) && str(this.host.value("llm_base_url")) !== "") entries.push(["llm_base_url", ""]);
    this._pendingProvider = next;
    this._saving = true;
    this._custom = false;
    try {
      const r = await this.host.saveMany(entries);
      if (!r.ok) this._pendingProvider = null; // the row shows the error; the select snaps back
    } finally {
      this._saving = false;
    }
  }

  private async _setModel(raw: string): Promise<void> {
    const next = raw.trim();
    if (!this.host || next === this._currentModel()) return;
    this._pendingModel = next;
    this._saving = true;
    try {
      const r = await this.host.save(this.modelRole.modelKey, next);
      if (!r.ok) this._pendingModel = null;
    } finally {
      this._saving = false;
    }
  }

  // ── render ────────────────────────────────────────────────────────────
  private _providerOptions(): SelectOption[] {
    const conf = this._configured();
    const stored = this._currentProvider();
    const opts: SelectOption[] = [];
    if (!this._isMain) opts.push({ value: "", label: t("— inherit main agent —") });
    for (const p of PROVIDERS) opts.push({ value: p, label: !conf || conf.has(p) ? p : t("{provider} — needs setup", { provider: p }) });
    if (stored && !(PROVIDERS as readonly string[]).includes(stored)) opts.unshift({ value: stored, label: t("{raw} (not an option)", { raw: stored }), disabled: true });
    return opts;
  }

  private _modelItems(): PickerItem[] {
    const live = this._list?.models ?? [];
    const stored = this._currentModel();
    const items: PickerItem[] = live.map((m) => ({ value: m, label: m }));
    if (stored && !live.includes(stored)) items.unshift({ value: stored, label: stored });
    return items;
  }

  private _renderModelControl(provider: string, off: boolean) {
    const model = this._currentModel();
    const label = t("Model");
    if (!provider) {
      return renderText({ label, value: "", placeholder: t("— inherit main agent —"), disabled: true, onChange: () => undefined });
    }
    const failed = !!this._list && !!this._list.error && !this._list.models.length;
    if (this._custom || failed) {
      return renderText({
        label,
        value: model,
        placeholder: t("enter model id"),
        disabled: off,
        onChange: (v) => void this._setModel(v),
      });
    }
    const onPick = (e: CustomEvent<PickerChangeDetail>) => {
      e.stopPropagation();
      const v = e.detail?.value;
      void this._setModel(Array.isArray(v) ? v[0] ?? "" : v ?? "");
    };
    return html`
      <jv-picker
        kind="domain"
        allow-custom
        .hass=${this.hass}
        .data=${this.data}
        .items=${this._modelItems()}
        .value=${model}
        .label=${label}
        .placeholder=${model ? t("Replace…") : t("Search…")}
        ?disabled=${off}
        @value-changed=${onPick}
      ></jv-picker>
    `;
  }

  override render() {
    const provider = this._effectiveProvider();
    const off = this.disabled || !this.hass || this._saving;
    const model = this._currentModel();
    const list = this._list;
    const listed = !!list && !list.error && list.models.length > 0;
    const failed = !!list && !!list.error && !list.models.length;
    const mismatch = listed && model !== "" && !list.models.includes(model);
    const suggestion = mismatch ? suggestModel(list.models, !!this.modelRole.vision) : "";
    const canToggleCustom = !!provider && !failed && listed;
    const error = failed ? (list.error.length > ERROR_MAX ? `${list.error.slice(0, ERROR_MAX)}…` : list.error) : "";
    const roleName = t(this.modelRole.label);

    return html`
      <div class="grid" role="group" aria-label=${this.label || roleName}>
        <div class="col">
          <span class="cap"><span class="role">${roleName}</span><span>${t("Provider")}</span></span>
          ${renderSelect({
            id: this.controlId || undefined,
            label: `${roleName} — ${t("Provider")}`,
            // the main agent never shows a blank: "" means the first configured provider
            value: this._isMain ? provider : this._currentProvider(),
            options: this._providerOptions(),
            disabled: off,
            onChange: (v) => void this._setProvider(v),
          })}
        </div>
        <div class="col">
          <span class="cap">
            <span>${t("Model")}</span>
            <span class="actions">
              ${canToggleCustom
                ? html`<button type="button" class="link jv-hit" ?disabled=${off} @click=${() => (this._custom = !this._custom)}>${this._custom ? t("Pick from list") : t("Custom…")}</button>`
                : nothing}
              ${provider
                ? html`<button type="button" class="link jv-hit" ?disabled=${off || this._loading} @click=${this._refresh}>${t("Refresh")}</button>`
                : nothing}
            </span>
          </span>
          ${this._renderModelControl(provider, off)}
          ${this._loading ? html`<p class="note" role="status">${t("Loading models…")}</p>` : nothing}
          ${!this._loading && failed ? html`<p class="note warn" role="status">${t("No models found — {error}", { error })}</p>` : nothing}
          ${!this._loading && listed && !mismatch && !this._custom
            ? html`<p class="note">${t("{count} models from {provider}", { count: list.models.length, provider })}</p>`
            : nothing}
          ${mismatch
            ? html`
                <div class="mismatch" role="alert">
                  ${haDefined("ha-icon") ? html`<ha-icon icon="mdi:alert-outline"></ha-icon>` : nothing}
                  <span>${t("{model} is not offered by {provider}", { model, provider })}</span>
                  ${suggestion
                    ? html`<button type="button" class="jv-btn" ?disabled=${off} @click=${() => void this._setModel(suggestion)}>${t("Use {model}", { model: suggestion })}</button>`
                    : nothing}
                </div>
              `
            : nothing}
          ${this.modelRole.vision
            ? html`<button type="button" class="link jv-hit" @click=${() => navigateFrom(this, "settings", "cameras/vision_thinking_enabled")}>${t("Vision throttle and thinking: see Cameras")}</button>`
            : nothing}
        </div>
      </div>
    `;
  }
}

// ── registration ───────────────────────────────────────────────────────────

const BASE_URL_KEYS = ["llm_base_url", "custom_base_url", "ollama_base_url"];

for (const role of MODEL_ROLES) {
  registerFieldEditor(
    role.providerKey,
    (_field, value, _onChange, ctx) => {
      const host = ctx.host;
      return html`
        <jarvis-editor-model-role
          .hass=${ctx.hass}
          .data=${ctx.data}
          .narrow=${ctx.narrow}
          .disabled=${ctx.disabled}
          .host=${host}
          .modelRole=${role}
          .provider=${str(value)}
          .model=${str(host?.value(role.modelKey))}
          .baseSig=${BASE_URL_KEYS.map((k) => str(host?.value(k))).join("|")}
          .label=${ctx.label}
          .controlId=${ctx.id}
        ></jarvis-editor-model-role>
      `;
    },
    { consumes: [role.modelKey], noReset: true },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-editor-model-role": JarvisEditorModelRole;
  }
}
