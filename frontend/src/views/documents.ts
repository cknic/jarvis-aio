/**
 * <jarvis-view-documents> - the household's document library and what JARVIS
 * can retrieve from it (frontend/specs/documents.md).
 *
 * Four cards:
 *   - Document Library (full width): jarvis/documents status / upload /
 *     ingest / scan_watch / delete, with a result banner per operation.
 *   - Search documents: jarvis/documents {action: "search"} (./documents/search-card.ts).
 *   - Search engine: jarvis/semantic_search status / enable / disable / test.
 *   - Conversation memory: jarvis/search_memory (./documents/memory-card.ts).
 *
 * The library and engine state live here because they are coupled (an ingest
 * changes the vector count; the engine card offers Ingest folder; every
 * mutating button is disabled while any mutation runs). Nothing here writes
 * the snapshot, so the view never dispatches jarvis-refresh; the settings the
 * feature depends on are linked, never edited (Settings → Learning).
 */
import { html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { JarvisView } from "./view-base";
import { base } from "../theme/base";
import { t } from "../i18n";
import { haDefined, watchDefinitions } from "../ha";
import { confirmDialog } from "../components";
import "../components";
import "./documents/search-card";
import "./documents/memory-card";
import { cardStyles, viewStyles } from "./documents/styles";
import { renderAlert } from "./documents/alerts";
import { code, tRich } from "./documents/rich";
import {
  MAX_UPLOAD_BYTES,
  chunksLabel,
  deleteCannotAddress,
  errorMessage,
  fileIcon,
  indexLabel,
  isConnectionLost,
  isSupportedFile,
  normaliseEngine,
  normaliseStatus,
  num,
  readBase64,
} from "./documents/format";
import {
  idle,
  type AlertTone,
  type Banner,
  type BusyKind,
  type DeleteResult,
  type DocStatus,
  type EngineStatus,
  type IngestResult,
  type Loadable,
  type MemoryStats,
  type Problem,
  type ProbeResult,
  type ScanResult,
  type UploadResult,
} from "./documents/types";

const HA_TAGS = ["ha-card", "ha-icon", "ha-icon-button", "ha-alert", "ha-textfield"];

interface Probe {
  tone: AlertTone;
  body: TemplateResult | string;
  /** offer Ingest folder under the alert */
  ingest?: boolean;
}

@customElement("jarvis-view-documents")
export class JarvisViewDocuments extends JarvisView {
  static override styles = [base, cardStyles, viewStyles];

  @state() private _status: Loadable<DocStatus> = idle();
  @state() private _engine: Loadable<EngineStatus> = idle();
  @state() private _busy: BusyKind | null = null;
  @state() private _uploadProgress: { n: number; total: number } | null = null;
  @state() private _deleting = new Set<string>();
  @state() private _banner: Banner | null = null;
  @state() private _probe: Probe | null = null;
  @state() private _dragOver = false;

  private _started = false;
  /** set when a call failed with a connection-loss rejection; cleared when hass is replaced (HA reconnected) */
  private _connectionLost = false;

  // ── lifecycle ──────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, HA_TAGS);
    document.addEventListener("visibilitychange", this._onVisibility);
    if (this._started && this.hass) void this._loadAll();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("visibilitychange", this._onVisibility);
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (!this.hass) return;
    if (!this._started) {
      this._started = true;
      void this._loadAll();
    } else if (changed.has("hass") && this._connectionLost) {
      // HA reconnects by itself and hands the panel a new hass: catch up (Risk 10).
      this._connectionLost = false;
      void this._loadAll();
    }
  }

  private _onVisibility = (): void => {
    if (document.visibilityState === "visible" && this.hass && this._started && !this._busy) void this._loadAll();
  };

  // ── reads ──────────────────────────────────────────────────────────────

  private _loadAll(): Promise<void> {
    return Promise.all([this._loadStatus(), this._loadEngine()]).then(() => undefined);
  }

  private async _loadStatus(): Promise<void> {
    this._status = { status: "loading", data: this._status.data, error: null };
    try {
      const res = await this.ws<unknown>("jarvis/documents", { action: "status" });
      this._status = { status: "loaded", data: normaliseStatus(res), error: null };
    } catch (err) {
      if (isConnectionLost(err)) this._connectionLost = true;
      this._status = { status: "error", data: this._status.data, error: errorMessage(err) };
    }
  }

  private async _loadEngine(): Promise<void> {
    this._engine = { status: "loading", data: this._engine.data, error: null };
    try {
      const res = await this.ws<unknown>("jarvis/semantic_search", { action: "status" });
      this._engine = { status: "loaded", data: normaliseEngine(res), error: null };
    } catch (err) {
      if (isConnectionLost(err)) this._connectionLost = true;
      this._engine = { status: "error", data: this._engine.data, error: errorMessage(err) };
    }
  }

  // ── derived ────────────────────────────────────────────────────────────

  private get _directory(): string {
    return this._status.data?.directory || "";
  }

  /** the folder for copy, or a generic phrase before `status` has answered */
  private get _directoryOrPhrase(): string {
    return this._directory || t("the documents folder");
  }

  private get _noStore(): boolean {
    const s = this._status.data;
    return !!s && this._status.status === "loaded" && !s.fts && !s.chroma;
  }

  /** every mutating control except per-row Delete */
  private get _toolsDisabled(): boolean {
    return this._busy !== null || this._noStore;
  }

  private _fail(err: unknown): string {
    if (isConnectionLost(err)) this._connectionLost = true;
    return errorMessage(err);
  }

  private _problemsOf(files: unknown): Problem[] {
    if (!Array.isArray(files)) return [];
    const out: Problem[] = [];
    for (const f of files as Array<{ ok?: boolean; source?: string; filename?: string; error?: string }>) {
      if (!f || f.ok) continue;
      out.push({ source: String(f.source || f.filename || "?"), error: String(f.error || "") });
    }
    return out;
  }

  // ── actions: library ───────────────────────────────────────────────────

  private _openPicker(): void {
    this.renderRoot.querySelector<HTMLInputElement>("#doc-upload")?.click();
  }

  private _onPicked(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = "";
    if (files.length) void this._upload(files);
  }

  private async _upload(files: File[]): Promise<void> {
    if (!files.length || this._toolsDisabled) return;
    const dir = this._directoryOrPhrase;
    const lines: Array<string | TemplateResult> = [];
    const problems: Problem[] = [];
    let tone: AlertTone = "success";
    const accepted: File[] = [];
    for (const f of files) {
      if (!isSupportedFile(f.name)) {
        lines.push(t("{name}: only PDF, .txt and .md files can be uploaded", { name: f.name }));
        tone = "warning";
      } else if (f.size > MAX_UPLOAD_BYTES) {
        lines.push(t("{name} is larger than 3 MB — copy it into {directory} instead; it is picked up within 10 minutes", { name: f.name, directory: dir }));
        tone = "warning";
      } else {
        accepted.push(f);
      }
    }
    const previous = new Set((this._status.data?.sources ?? []).map((s) => s.source));
    this._busy = "upload";
    this._banner = null;
    try {
      for (let i = 0; i < accepted.length; i++) {
        const f = accepted[i];
        this._uploadProgress = { n: i + 1, total: accepted.length };
        try {
          const content = await readBase64(f);
          const res = await this.ws<UploadResult>("jarvis/documents", { action: "upload", filename: f.name, content });
          if (res?.ok) {
            const filename = String(res.filename || f.name);
            const chunks = num(res.chunks);
            const head = previous.has(filename)
              ? t("Replaced {filename} — {chunks} chunks", { filename, chunks })
              : t("Uploaded {filename} — {chunks} chunks", { filename, chunks });
            const embedded = res.embedded !== undefined && res.embedded !== null ? t(", {n} embedded", { n: num(res.embedded) }) : "";
            const note = res.semantic_note ? html` · <code class="tech">${String(res.semantic_note)}</code>` : nothing;
            if (res.semantic_note) tone = tone === "success" ? "warning" : tone;
            lines.push(html`${head}${embedded}${note}`);
          } else {
            if (tone !== "error") tone = "warning";
            const filename = String(res?.filename || f.name);
            const error = String(res?.error || "");
            const line = tRich("Couldn't index {filename}: {error}", { filename, error: code(error) });
            lines.push(res?.filename ? html`${line} ${t("The file was saved to the folder but could not be indexed.")}` : line);
            problems.push({ source: filename, error });
          }
        } catch (err) {
          tone = "error";
          lines.push(t("Upload failed — {message}", { message: this._fail(err) }));
        }
      }
    } finally {
      this._busy = null;
      this._uploadProgress = null;
    }
    this._banner = { tone, lines, problems: problems.length ? problems : undefined };
    if (accepted.length) await this._loadStatus();
  }

  private async _ingest(): Promise<void> {
    if (this._toolsDisabled) return;
    this._busy = "ingest";
    this._banner = null;
    try {
      const res = await this.ws<IngestResult>("jarvis/documents", { action: "ingest" });
      if (!res?.ok) {
        this._banner = { tone: "error", lines: [tRich("Couldn't read the documents folder: {error}", { error: code(res?.error || "") })] };
      } else {
        let tone: AlertTone = "success";
        const head = t("Indexed {files_ingested} of {files_seen} files, {total_chunks} chunks", {
          files_ingested: num(res.files_ingested),
          files_seen: num(res.files_seen),
          total_chunks: num(res.total_chunks),
        });
        const embedded = res.semantic ? t(", {embedded_chunks} embedded", { embedded_chunks: num(res.embedded_chunks) }) : "";
        let semErr: TemplateResult | typeof nothing = nothing;
        if (res.semantic_error) {
          tone = "warning";
          semErr = html` · <code class="tech">${String(res.semantic_error)}</code>`;
        }
        const line = html`${head}${embedded}${semErr}`;
        const problems = this._problemsOf(res.files);
        if (problems.length && tone === "success") tone = "warning";
        this._banner = { tone, lines: [line], problems: problems.length ? problems : undefined };
      }
    } catch (err) {
      this._banner = { tone: "error", lines: [t("Indexing failed — {message}", { message: this._fail(err) })] };
    } finally {
      this._busy = null;
    }
    await this._loadAll(); // the vector count changed too
  }

  private async _scanWatch(): Promise<void> {
    if (this._toolsDisabled) return;
    this._busy = "scan";
    this._banner = null;
    try {
      const res = await this.ws<ScanResult>("jarvis/documents", { action: "scan_watch" });
      if (num(res?.watched) === 0) {
        this._banner = { tone: "info", lines: [t("No watch folders configured.")], action: "watch-folders" };
      } else {
        const problems = this._problemsOf(res?.files);
        this._banner = {
          tone: problems.length ? "warning" : "success",
          lines: [t("Scanned {watched} folders — {new_files} new documents", { watched: num(res?.watched), new_files: num(res?.new_files) })],
          problems: problems.length ? problems : undefined,
        };
      }
    } catch (err) {
      this._banner = { tone: "error", lines: [t("Scan failed — {message}", { message: this._fail(err) })] };
    } finally {
      this._busy = null;
    }
    await this._loadStatus();
  }

  private async _delete(source: string): Promise<void> {
    if (this._deleting.has(source)) return;
    const ok = await confirmDialog({
      heading: t("Delete {name}?", { name: source }),
      message: t("This removes the file from the documents folder and everything JARVIS indexed from it."),
      confirmLabel: t("Delete"),
      destructive: true,
    });
    if (!ok) return;
    this._deleting = new Set([...this._deleting, source]);
    try {
      const res = await this.ws<DeleteResult>("jarvis/documents", { action: "delete", filename: source });
      if (!res?.ok) {
        this._banner = { tone: "error", lines: [tRich("Couldn't delete {name}: {error}", { name: source, error: code(res?.error || "") })] };
        return;
      }
      await this._loadStatus();
      const still = (this._status.data?.sources ?? []).some((s) => s.source === source);
      if (still && this._status.status === "loaded" && deleteCannotAddress(source)) {
        // Risk 5: the sanitiser rewrote the name, nothing matched, the backend still said ok.
        this._banner = {
          tone: "error",
          lines: [
            t("Couldn't delete {name}: {error}", {
              name: source,
              error: t("the file name contains characters the backend cannot address — rename it in the folder and re-index."),
            }),
          ],
        };
      } else {
        this._banner = { tone: "success", lines: [t("Deleted {filename}", { filename: String(res.filename || source) })] };
      }
    } catch (err) {
      this._banner = { tone: "error", lines: [t("Delete failed — {message}", { message: this._fail(err) })] };
    } finally {
      const next = new Set(this._deleting);
      next.delete(source);
      this._deleting = next;
    }
  }

  // ── actions: engine ────────────────────────────────────────────────────

  private async _enable(): Promise<void> {
    if (this._busy) return;
    this._busy = "enable";
    this._probe = null;
    try {
      // one message: "enable" writes semantic_search = true through
      // config_apply.async_apply_many (runtime_config - what Settings shows -,
      // config.json, the config-changed signal), then initialises the vector
      // store and probes Ollama.
      const res = await this.ws<ProbeResult>("jarvis/semantic_search", { action: "enable" });
      if (res?.ok) {
        this._probe = {
          tone: "success",
          body: t("Semantic search is on ({model}, {dim}-dimensional). Run Ingest folder to embed your documents.", {
            model: String(res.model || ""),
            dim: num(res.dim),
          }),
          ingest: true,
        };
      } else {
        this._probe = {
          tone: "warning",
          body: html`${tRich("Semantic search is on, but Ollama isn't ready: {error}", { error: code(res?.error) })}
          ${t("Until Ollama answers, searches fall back to keyword after a delay.")}`,
        };
      }
    } catch (err) {
      this._probe = { tone: "error", body: t("Couldn't enable semantic search — {message}", { message: this._fail(err) }) };
    } finally {
      this._busy = null;
    }
    await this._loadEngine();
  }

  private async _disable(): Promise<void> {
    if (this._busy) return;
    this._busy = "disable";
    this._probe = null;
    try {
      // "disable" writes semantic_search = false the same way (vectors are kept)
      await this.ws("jarvis/semantic_search", { action: "disable" });
      this._probe = { tone: "info", body: t("Semantic search is off — keyword search is active.") };
    } catch (err) {
      this._probe = { tone: "error", body: t("Couldn't disable semantic search — {message}", { message: this._fail(err) }) };
    } finally {
      this._busy = null;
    }
    await this._loadEngine();
  }

  private async _test(): Promise<void> {
    if (this._busy) return;
    this._busy = "test";
    this._probe = null;
    try {
      const res = await this.ws<ProbeResult>("jarvis/semantic_search", { action: "test" });
      if (res?.ok) {
        this._probe = { tone: "success", body: t("Ollama answered: {model}, {dim}-dimensional vectors.", { model: String(res.model || ""), dim: num(res.dim) }) };
      } else {
        this._probe = { tone: "warning", body: tRich("Ollama is not ready: {error}", { error: code(res?.error) }) };
      }
    } catch (err) {
      this._probe = { tone: "error", body: t("Test failed — {message}", { message: this._fail(err) }) };
    } finally {
      this._busy = null;
    }
  }

  // ── drag & drop (progressive enhancement; the button is the control) ───

  private _onDragOver(e: DragEvent): void {
    if (this._toolsDisabled) return;
    const types = e.dataTransfer?.types;
    if (!types || !Array.from(types).includes("Files")) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    if (!this._dragOver) this._dragOver = true;
  }

  private _onDragLeave(e: DragEvent): void {
    const section = e.currentTarget as HTMLElement;
    const to = e.relatedTarget as Node | null;
    if (to && section.contains(to)) return;
    this._dragOver = false;
  }

  private _onDrop(e: DragEvent): void {
    e.preventDefault();
    this._dragOver = false;
    if (this._toolsDisabled) return;
    const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
    if (files.length) void this._upload(files);
  }

  // ── shared bits ────────────────────────────────────────────────────────

  private _icon(icon: string, fallback: string): TemplateResult {
    return haDefined("ha-icon")
      ? html`<ha-icon .icon=${icon} aria-hidden="true"></ha-icon>`
      : html`<span aria-hidden="true">${fallback}</span>`;
  }

  private _iconButton(label: string, icon: string, fallback: string, onClick: () => void, disabled = false, title?: string): TemplateResult {
    return haDefined("ha-icon-button")
      ? html`<ha-icon-button .label=${label} title=${title ?? label} .disabled=${disabled} @click=${onClick}>${this._icon(icon, fallback)}</ha-icon-button>`
      : html`<button class="jv-icon-btn" type="button" aria-label=${label} title=${title ?? label} ?disabled=${disabled} @click=${onClick}>
          ${this._icon(icon, fallback)}
        </button>`;
  }

  private _skeleton(): TemplateResult {
    return html`
      <div class="loading" role="status" aria-live="polite" aria-label=${t("Loading...")}>
        <div class="jv-skeleton"></div>
        <div class="jv-skeleton"></div>
        <div class="jv-skeleton"></div>
      </div>
    `;
  }

  private _settingsLink(label: string, sub: string, cls = "link jv-hit"): TemplateResult {
    return html`<button class=${cls} type="button" @click=${() => this.navigate("settings", sub)}>${label}</button>`;
  }

  // ── card: Document Library ─────────────────────────────────────────────

  private _renderLibrary(): TemplateResult {
    const st = this._status;
    const s = st.data;
    const loaded = st.status === "loaded" || !!s;
    const subheading =
      s && loaded
        ? t("{count} documents · {chunks} chunks · {engine}", { count: s.sources.length, chunks: s.chunk_count, engine: indexLabel(s) })
        : "";
    const busy = this._busy;
    const disabled = this._toolsDisabled;
    const uploadLabel =
      busy === "upload" && this._uploadProgress
        ? t("Uploading {n} of {total}…", { n: this._uploadProgress.n, total: this._uploadProgress.total })
        : t("Upload files");
    return html`
      <jv-section
        class="jv-span-all library ${this._dragOver ? "drag" : ""}"
        flush
        icon="mdi:file-document-multiple-outline"
        .heading=${t("Document Library")}
        .subheading=${subheading}
        ?loading=${(st.status === "loading" && !s) || busy === "upload" || busy === "ingest" || busy === "scan"}
        @dragover=${this._onDragOver}
        @dragenter=${this._onDragOver}
        @dragleave=${this._onDragLeave}
        @drop=${this._onDrop}
      >
        <span slot="actions">${this._iconButton(t("Refresh"), "mdi:refresh", "↻", () => void this._loadAll(), st.status === "loading")}</span>

        <div class="gut">
          <p class="intro">
            ${this._directory
              ? tRich("Drop PDF, .txt or .md files into {directory} (picked up within 10 minutes) or upload below. JARVIS answers from them in conversation.", {
                  directory: code(this._directory),
                })
              : t("Drop PDF, .txt or .md files into the documents folder or upload below.")}
          </p>

          <div class="toolbar">
            <label class="visually-hidden" for="doc-upload">${t("Upload files")}</label>
            <input id="doc-upload" class="visually-hidden" type="file" accept=".pdf,.txt,.md" multiple tabindex="-1" @change=${this._onPicked} />
            <button class="jv-btn primary" type="button" ?disabled=${disabled} @click=${this._openPicker}>${uploadLabel}</button>
            <button
              class="jv-btn"
              type="button"
              ?disabled=${disabled}
              title=${t("Re-index every file in the folder. Needed once after enabling semantic search.")}
              @click=${() => void this._ingest()}
            >
              ${busy === "ingest" ? t("Indexing…") : t("Ingest folder")}
            </button>
            <button class="jv-btn" type="button" ?disabled=${disabled} @click=${() => void this._scanWatch()}>
              ${busy === "scan" ? t("Scanning…") : t("Scan watch folders")}
            </button>
            ${this._settingsLink(t("Watch folders…"), "learning/document_watch_folders")}
          </div>

          <div class="banner" aria-live="polite">${this._renderBanner()}</div>
        </div>

        ${st.status === "error" && !s
          ? html`<div class="list-state">
              ${renderAlert({ tone: "error", title: t("Couldn't load the library"), body: st.error || "", action: { label: t("Retry"), run: () => void this._loadStatus() } })}
            </div>`
          : s
            ? this._renderList(s)
            : html`<div class="list-state">${this._skeleton()}</div>`}
        ${st.status === "error" && s
          ? html`<div class="list-state">
              ${renderAlert({ tone: "error", title: t("Couldn't load the library"), body: st.error || "", action: { label: t("Retry"), run: () => void this._loadStatus() } })}
            </div>`
          : nothing}

        <p class="footer">${t("Files are also picked up automatically every 10 minutes.")}</p>
      </jv-section>
    `;
  }

  private _renderBanner(): TemplateResult | typeof nothing {
    const b = this._banner;
    if (!b) return nothing;
    const body = html`${b.lines.map((l) => html`<p>${l}</p>`)}`;
    const problems = b.problems?.length
      ? html`<details class="problems">
          <summary>${t("Show {n} problems", { n: b.problems.length })}</summary>
          <ul>
            ${b.problems.map((p) => html`<li>${p.source} — ${p.error}</li>`)}
          </ul>
        </details>`
      : nothing;
    const action =
      b.action === "watch-folders"
        ? html`<div class="alert-actions">${this._settingsLink(t("Set up watch folders"), "learning/document_watch_folders", "jv-btn")}</div>`
        : nothing;
    return renderAlert({ tone: b.tone, body, extra: html`${problems}${action}`, onDismiss: () => (this._banner = null) });
  }

  private _renderList(s: DocStatus): TemplateResult {
    if (s.sources.length === 0) {
      const noStore = !s.fts && !s.chroma;
      return html`
        <div class="list-state">
          <jv-empty
            icon="mdi:file-document-plus-outline"
            .heading=${t("No documents yet")}
            .message=${noStore
              ? t("No document index is available — SQLite FTS5 is missing on this Home Assistant. Check the logs.")
              : t("Upload a manual or receipt, or drop files into {directory}.", { directory: this._directoryOrPhrase })}
          >
            ${noStore
              ? nothing
              : html`<button slot="action" class="jv-btn primary" type="button" ?disabled=${this._toolsDisabled} @click=${this._openPicker}>${t("Upload files")}</button>`}
          </jv-empty>
        </div>
      `;
    }
    return html`
      <ul>
        ${s.sources.map((row) => {
          const busy = this._deleting.has(row.source);
          return html`
            <li class="row ${busy ? "busy" : ""}">
              <span class="ficon">${this._icon(fileIcon(row.source), "▪")}</span>
              <span class="name jv-truncate" title=${row.source}>${row.source}</span>
              <span class="chunks">${chunksLabel(row.chunks)}</span>
              ${this._iconButton(t("Delete {name}", { name: row.source }), "mdi:delete-outline", "🗑", () => void this._delete(row.source), busy, t("Delete"))}
            </li>
          `;
        })}
      </ul>
    `;
  }

  // ── card: Search engine ────────────────────────────────────────────────

  private _renderEngine(): TemplateResult {
    const st = this._engine;
    const e = st.data;
    const busy = this._busy;
    const pending = busy === "enable" || busy === "disable" || busy === "test";
    return html`
      <jv-section icon="mdi:vector-combine" .heading=${t("Search engine")} ?loading=${(st.status === "loading" && !e) || pending}>
        ${st.status === "error" && !e
          ? renderAlert({ tone: "error", title: t("Couldn't read the search engine status"), body: st.error || "", action: { label: t("Retry"), run: () => void this._loadEngine() } })
          : e
            ? this._renderEngineBody(e)
            : this._skeleton()}
        ${st.status === "error" && e
          ? renderAlert({ tone: "error", title: t("Couldn't read the search engine status"), body: st.error || "", action: { label: t("Retry"), run: () => void this._loadEngine() } })
          : nothing}
      </jv-section>
    `;
  }

  private _renderEngineBody(e: EngineStatus): TemplateResult {
    const busy = this._busy;
    const disabled = busy !== null;
    const ingestBtn = html`<button class="jv-btn" type="button" ?disabled=${this._toolsDisabled} @click=${() => void this._ingest()}>
      ${busy === "ingest" ? t("Indexing…") : t("Ingest folder")}
    </button>`;
    let badge: TemplateResult;
    let line: TemplateResult;
    if (!e.enabled) {
      badge = html`<jv-state-badge level="neutral" .label=${t("Keyword (FTS5)")}></jv-state-badge>`;
      line = html`<p class="engine-line">
        ${t("Works everywhere with no setup. Enable semantic search to match on meaning using your Ollama server; re-index the folder afterwards.")}
      </p>`;
    } else if (e.vector_count > 0) {
      badge = html`<jv-state-badge level="ok" .label=${t("Semantic (Ollama)")}></jv-state-badge>`;
      line = html`<p class="engine-line">${tRich("Meaning-based matching with {model} · {count} vectors", { model: code(e.model), count: e.vector_count })}</p>`;
    } else {
      badge = html`<jv-state-badge level="warn" .label=${t("Semantic (Ollama) — not indexed yet")}></jv-state-badge>`;
      line = html`<p class="engine-line">${t("Semantic search is on but no document has been embedded. Run Ingest folder.")}<br />${ingestBtn}</p>`;
    }
    const probe = this._probe;
    return html`
      <div class="engine-status">${badge}</div>
      ${line}
      <jv-kv .label=${t("Ollama host")} mono>
        <span class="kv-value">
          <span>${e.base || t("not set")}</span>
          ${this._settingsLink(t("Change…"), "learning/embed_base_url")}
        </span>
      </jv-kv>
      <p class="caption">${t("Falls back to the LLM base URL (Settings → General).")} ${this._settingsLink(t("Settings"), "core/llm_base_url")}</p>
      <jv-kv .label=${t("Model")} mono>
        <span class="kv-value">
          <span>${e.model || "—"}</span>
          ${this._settingsLink(t("Change…"), "learning/embed_model")}
        </span>
      </jv-kv>
      <jv-kv .label=${t("Vectors")} .value=${String(e.vector_count)} mono></jv-kv>
      <div class="buttons">
        ${e.enabled
          ? html`<button class="jv-btn" type="button" ?disabled=${disabled} @click=${() => void this._disable()}>${t("Disable semantic search")}</button>`
          : html`<button class="jv-btn primary" type="button" ?disabled=${disabled} @click=${() => void this._enable()}>
              ${busy === "enable" ? t("Checking Ollama…") : t("Enable semantic search")}
            </button>`}
        <button class="jv-btn text" type="button" ?disabled=${disabled} @click=${() => void this._test()}>${busy === "test" ? t("Testing…") : t("Test connection")}</button>
      </div>
      <div class="probe" aria-live="polite">
        ${probe
          ? renderAlert({
              tone: probe.tone,
              body: probe.body,
              extra: probe.ingest ? html`<div class="alert-actions">${ingestBtn}</div>` : nothing,
              onDismiss: () => (this._probe = null),
            })
          : nothing}
      </div>
    `;
  }

  // ── render ─────────────────────────────────────────────────────────────

  override render() {
    const libraryEmpty = this._status.status === "loaded" && this._status.data ? this._status.data.sources.length === 0 : null;
    const cfg = this.data?.config;
    const stats: MemoryStats | null | undefined = this.data
      ? cfg && typeof cfg.memory_stats === "object" && cfg.memory_stats !== null
        ? (cfg.memory_stats as MemoryStats)
        : null
      : undefined;
    return html`
      <div class="jv-grid">
        ${this._renderLibrary()}
        <jarvis-docs-search .hass=${this.hass} .libraryEmpty=${libraryEmpty}></jarvis-docs-search>
        ${this._renderEngine()}
        <jarvis-docs-memory .hass=${this.hass} .stats=${stats}></jarvis-docs-memory>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-view-documents": JarvisViewDocuments;
  }
}
