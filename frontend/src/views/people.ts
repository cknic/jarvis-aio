/**
 * <jarvis-view-people> - who JARVIS knows (frontend/specs/people.md).
 *
 * Five cards:
 *   - Household: the resident roster with last-seen frames, add / remove,
 *     reference photo enrolment (file, "From sighting", "Snapshot now").
 *   - Recently seen: guests and unknown faces; "Make resident" and "Name this face".
 *   - Voices: in-process speaker-ID - enrolled voiceprints, "speaking now",
 *     enrol / identify from a 4 s browser-microphone clip, the three config keys.
 *   - Wellbeing Context: opt-in wearable context and what discovery found.
 *   - Face recognition options: the LLM matcher switch, recognition source.
 *
 * Everything here is biometric data about other people: destructive actions
 * confirm, images only ever render through signPath / data URLs, and the
 * discovered wearables stay off-screen until the user opts in.
 */
import { html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { JarvisView } from "./view-base";
import { base } from "../theme/base";
import { t } from "../i18n";
import { haDefined, watchDefinitions } from "../ha";
import { confirmDialog } from "../components";
import "../components";
import "./people/face-card";
import "./people/lightbox";
import type { JarvisFaceCard } from "./people/face-card";
import type { JarvisPeopleLightbox } from "./people/lightbox";
import { peopleStyles } from "./people/styles";
import {
  idle,
  type BiometricsResponse,
  type BiometricsState,
  type CameraOption,
  type FaceActionDetail,
  type FaceCardModel,
  type FaceRow,
  type FacesResponse,
  type FacesState,
  type Loadable,
  type VoicesResponse,
  type VoicesState,
} from "./people/types";
import {
  FACES_LIMIT,
  NO_TIMESTAMP_AGE,
  cameraLabel,
  cameraLabelFor,
  cameraOptions,
  coerceBiometrics,
  coerceFaces,
  coerceVoices,
  errorCode,
  errorMessage,
  freshestFor,
  groupByKind,
  identifyMatch,
  localeOf,
  normName,
  notify,
  relativeEpoch,
  rememberCamera,
  sttEntities,
} from "./people/format";
import { NotAnImageError, ThumbCache, fetchAsDataUrl, prepareImage } from "./people/image";
import { recordWavBase64 } from "./people/record-wav";

const HA_TAGS = ["ha-card", "ha-icon", "ha-icon-button", "ha-textfield", "ha-alert", "ha-switch", "ha-dialog"];
const VOICES_REFRESH_MS = 15_000;
const RECORD_SECONDS = 4;
const VOICE_GUIDE_URL = "https://github.com/sam3gp8/jarvis-aio/blob/main/docs/voice-recognition.md";

type SwitchOpts = { checked: boolean; disabled: boolean; label: string; title?: string; onChange: (on: boolean) => void };

@customElement("jarvis-view-people")
export class JarvisViewPeople extends JarvisView {
  static override styles = [base, peopleStyles];

  @state() private _faces: Loadable<FacesState> = idle();
  @state() private _voices: Loadable<VoicesState> = idle();
  @state() private _bio: Loadable<BiometricsState> = idle();

  // faces
  @state() private _addName = "";
  @state() private _facesBusy = false; // one in-flight faces mutation at a time
  @state() private _cardBusy = new Set<string>();
  @state() private _llmOverride: boolean | null = null;
  @state() private _llmPending = false;

  // voices
  @state() private _localOverride: boolean | null = null;
  @state() private _localPending = false;
  @state() private _showRestartInfo = false;
  @state() private _delegateDraft: string | null = null;
  @state() private _modelDraft: string | null = null;
  @state() private _savingKey: string | null = null;
  @state() private _voiceName = "";
  @state() private _recording: { mode: "enroll" | "identify"; left: number } | null = null;
  @state() private _voiceBusy = false;
  @state() private _identifyResult: string | null = null;
  @state() private _forgetting = new Set<string>();
  @state() private _liveMessage = "";

  // wellbeing
  @state() private _bioPending = false;
  @state() private _bioOverride: boolean | null = null;

  @query("jarvis-people-lightbox") private _lightbox?: JarvisPeopleLightbox;

  private readonly _cache = new ThumbCache();
  private _started = false;
  private _lastVoicesFetch = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, HA_TAGS);
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (!this._started && this.hass) {
      this._started = true;
      void this._loadAll();
      return;
    }
    // Keep "Speaking now" (a 20 s window) alive off the shell's snapshot cadence.
    if (changed.has("data") && this._started && this._voices.status === "loaded" && !this._voiceBusy && !this._recording) {
      if (Date.now() - this._lastVoicesFetch >= VOICES_REFRESH_MS) void this._loadVoices(true);
    }
  }

  // ── data ───────────────────────────────────────────────────────────────

  private _loadAll(): Promise<void> {
    return Promise.all([this._loadFaces(), this._loadVoices(), this._loadBio()]).then(() => undefined);
  }

  private async _loadFaces(): Promise<void> {
    if (this._faces.code === "unauthorized") return;
    this._faces = { ...this._faces, status: "loading", error: null };
    try {
      const res = await this.ws<FacesResponse>("jarvis/faces", { action: "list", limit: FACES_LIMIT });
      this._applyFaces(res);
    } catch (err) {
      this._faces = { status: "error", data: this._faces.data, error: errorMessage(err), code: errorCode(err) };
    }
  }

  private _applyFaces(res: FacesResponse | null | undefined): void {
    this._faces = { status: "loaded", data: coerceFaces(res, this._faces.data), error: null, code: null };
    this._llmOverride = null;
  }

  private async _loadVoices(quiet = false): Promise<void> {
    if (this._voices.code === "unauthorized") return;
    if (!quiet) this._voices = { ...this._voices, status: "loading", error: null };
    this._lastVoicesFetch = Date.now();
    try {
      const res = await this.ws<VoicesResponse>("jarvis/voices", { action: "list" });
      this._applyVoices(res);
    } catch (err) {
      if (!quiet || !this._voices.data) {
        this._voices = { status: "error", data: this._voices.data, error: errorMessage(err), code: errorCode(err) };
      }
    }
  }

  private _applyVoices(res: VoicesResponse | null | undefined): void {
    this._voices = { status: "loaded", data: coerceVoices(res), error: null, code: null };
    this._localOverride = null;
    this._lastVoicesFetch = Date.now();
  }

  private async _loadBio(): Promise<void> {
    if (this._bio.code === "unauthorized") return;
    this._bio = { ...this._bio, status: "loading", error: null };
    try {
      const res = await this.ws<BiometricsResponse>("jarvis/biometrics", { action: "status" });
      this._applyBio(res);
    } catch (err) {
      this._bio = { status: "error", data: this._bio.data, error: errorMessage(err), code: errorCode(err) };
    }
  }

  private _applyBio(res: BiometricsResponse | null | undefined): void {
    this._bio = { status: "loaded", data: coerceBiometrics(res), error: null, code: null };
    this._bioOverride = null;
  }

  private _refreshAll(): void {
    void this._loadAll();
  }

  // ── faces: derived ─────────────────────────────────────────────────────

  private get _facesData(): FacesState | null {
    return this._faces.data;
  }

  private _cameras(): CameraOption[] {
    return cameraOptions(this.hass);
  }

  private _residentModel(name: string, f: FacesState): FaceCardModel {
    const row = freshestFor(f.recent, name);
    const hasReference = f.references.includes(normName(name));
    return {
      name,
      relation: "resident",
      lowConf: !!row?.is_low_confidence,
      cameraEntity: row?.camera_entity ?? "",
      cameraLabel: row ? cameraLabel(this.hass, row) : "",
      confidence: row?.confidence ?? 0,
      ageSeconds: row && row.age_seconds < NO_TIMESTAMP_AGE ? row.age_seconds : null,
      snapshotUrl: row?.snapshot_url ?? null,
      hasReference,
      canCaptureFromSighting: !!row && (!!row.snapshot_url || !!row.camera_entity),
      labelable: false,
      actions: ["remove_resident"],
    };
  }

  private _recentModel(row: FaceRow): FaceCardModel {
    const relation = row.relationship === "guest" ? "guest" : "unknown";
    return {
      name: row.name,
      relation,
      lowConf: row.is_low_confidence,
      cameraEntity: row.camera_entity,
      cameraLabel: cameraLabel(this.hass, row),
      confidence: row.confidence,
      ageSeconds: row.age_seconds < NO_TIMESTAMP_AGE ? row.age_seconds : null,
      snapshotUrl: row.snapshot_url,
      hasReference: false,
      canCaptureFromSighting: false,
      labelable: true,
      actions: relation === "guest" ? ["make_resident"] : [],
    };
  }

  // ── faces: actions ─────────────────────────────────────────────────────

  private _cardKey(name: string, cameraEntity = ""): string {
    return `${normName(name) || name}|${cameraEntity}`;
  }

  private _setCardBusy(key: string, on: boolean): void {
    const next = new Set(this._cardBusy);
    if (on) next.add(key);
    else next.delete(key);
    this._cardBusy = next;
  }

  private async _facesMutation(payload: Record<string, unknown>): Promise<FacesResponse> {
    this._facesBusy = true;
    try {
      const res = await this.ws<FacesResponse>("jarvis/faces", { ...payload, limit: FACES_LIMIT });
      this._applyFaces(res);
      return res;
    } finally {
      this._facesBusy = false;
    }
  }

  private async _addResident(name: string, fromField: boolean): Promise<void> {
    const clean = name.trim();
    if (!clean || this._facesBusy) return;
    try {
      await this._facesMutation({ action: "add_resident", name: clean });
      if (fromField) this._addName = "";
      notify(this, t("Added {name} as a resident", { name: clean }));
      this.refresh();
    } catch (err) {
      notify(this, errorMessage(err));
    }
  }

  private async _removeResident(name: string): Promise<void> {
    if (this._facesBusy) return;
    const ok = await confirmDialog({
      heading: t("Remove {name} from the household?", { name }),
      message: t("They will count as a guest again and their reference photo is deleted. Intrusion monitoring will no longer stand down for them."),
      confirmLabel: t("Remove"),
      destructive: true,
    });
    if (!ok) return;
    this._setCardBusy(this._cardKey(name), true);
    try {
      await this._facesMutation({ action: "remove_resident", name });
      this._cache.dropReference(name);
      notify(this, t("Removed {name}", { name }));
      this.refresh();
    } catch (err) {
      notify(this, errorMessage(err));
    } finally {
      this._setCardBusy(this._cardKey(name), false);
    }
  }

  private async _removePhoto(name: string): Promise<void> {
    if (this._facesBusy) return;
    const ok = await confirmDialog({
      heading: t("Remove the reference photo for {name}?", { name }),
      confirmLabel: t("Remove"),
      destructive: true,
    });
    if (!ok) return;
    this._setCardBusy(this._cardKey(name), true);
    try {
      await this._facesMutation({ action: "remove_reference", name });
      this._cache.dropReference(name);
      notify(this, t("Reference photo removed"));
    } catch (err) {
      notify(this, errorMessage(err));
    } finally {
      this._setCardBusy(this._cardKey(name), false);
    }
  }

  /** Confirm when `name` already has a reference photo; false = user declined. */
  private async _confirmReplace(name: string): Promise<boolean> {
    const has = this._facesData?.references.includes(normName(name)) ?? false;
    if (!has) return true;
    return confirmDialog({
      heading: t("Replace the reference photo for {name}?", { name }),
      message: t("The current photo is overwritten."),
      confirmLabel: t("Replace"),
    });
  }

  private async _storeReference(name: string, image: string, successToast: string): Promise<boolean> {
    try {
      await this._facesMutation({ action: "set_reference", name, image });
      this._cache.dropReference(name);
      notify(this, successToast);
      return true;
    } catch (err) {
      notify(this, errorMessage(err));
      return false;
    }
  }

  private async _setPhotoFromFile(name: string, file: File): Promise<void> {
    if (this._facesBusy) return;
    if (!file.type.startsWith("image/")) {
      notify(this, t("That file is not an image"));
      return;
    }
    if (!(await this._confirmReplace(name))) return;
    this._setCardBusy(this._cardKey(name), true);
    try {
      const image = await prepareImage(file);
      await this._storeReference(name, image, t("Reference photo set for {name}", { name }));
    } catch (err) {
      notify(this, err instanceof NotAnImageError ? err.message : errorMessage(err));
    } finally {
      this._setCardBusy(this._cardKey(name), false);
    }
  }

  /** The card's current image as a data URL: data: as-is, a signed frame via fetch, else a fresh camera frame. */
  private async _captureSighting(src: string | null, cameraEntity: string): Promise<string | null> {
    if (src && src.startsWith("data:")) return src;
    if (src) {
      const fetched = await fetchAsDataUrl(src);
      if (fetched) return fetched;
    }
    if (cameraEntity) return this._cache.camera(this.hass, cameraEntity, true);
    return null;
  }

  private async _fromSighting(name: string, src: string | null, cameraEntity: string): Promise<void> {
    if (this._facesBusy) return;
    if (!(await this._confirmReplace(name))) return;
    this._setCardBusy(this._cardKey(name), true);
    try {
      const raw = await this._captureSighting(src, cameraEntity);
      if (!raw) {
        notify(this, t("No snapshot available to assign"));
        return;
      }
      const image = await prepareImage(raw);
      await this._storeReference(name, image, t("Reference photo set for {name} from this sighting", { name }));
    } catch (err) {
      notify(this, errorMessage(err));
    } finally {
      this._setCardBusy(this._cardKey(name), false);
    }
  }

  private async _snapshotNow(name: string, cameraEntity: string): Promise<void> {
    // _facesBusy is only set once the capture is done; the card flag covers the capture itself
    if (this._facesBusy || this._cardBusy.has(this._cardKey(name))) return;
    if (!cameraEntity) {
      notify(this, t("Pick a camera first"));
      return;
    }
    if (!(await this._confirmReplace(name))) return;
    this._setCardBusy(this._cardKey(name), true);
    try {
      const raw = await this._cache.cameraStrict(this.hass, cameraEntity);
      if (!raw) {
        notify(this, t("No frame from that camera"));
        return;
      }
      const image = await prepareImage(raw);
      const camera = cameraLabelFor(this.hass, cameraEntity);
      if (await this._storeReference(name, image, t("Reference photo set for {name} from {camera}", { name, camera }))) {
        rememberCamera(cameraEntity);
      }
    } catch (err) {
      notify(this, errorMessage(err));
    } finally {
      this._setCardBusy(this._cardKey(name), false);
    }
  }

  private async _labelFace(card: JarvisFaceCard | null, name: string, src: string | null, cameraEntity: string): Promise<void> {
    const rowKey = card?.model ? this._cardKey(card.model.name, card.model.cameraEntity) : this._cardKey(name, cameraEntity);
    // _facesBusy is only set once the capture is done; the card flag covers the capture itself
    if (this._facesBusy || this._cardBusy.has(rowKey)) return;
    const f = this._facesData;
    if (!(await this._confirmReplace(name))) return;
    this._setCardBusy(rowKey, true);
    try {
      const raw = await this._captureSighting(src, cameraEntity);
      if (!raw) {
        notify(this, t("No snapshot available to assign"));
        return;
      }
      const image = await prepareImage(raw);
      const isResident = !!f && f.residents.some((r) => r.trim().toLowerCase() === name.trim().toLowerCase());
      let toast = t("Reference photo set for {name} from this sighting", { name });
      if (!isResident) toast += t(" — add them to the household to stand intrusion down.");
      if (await this._storeReference(name, image, toast)) card?.clearLabel();
    } catch (err) {
      notify(this, errorMessage(err));
    } finally {
      this._setCardBusy(rowKey, false);
    }
  }

  private async _enlarge(name: string, src: string | null, cameraEntity: string, caption: string): Promise<void> {
    let url = src;
    if (!url && cameraEntity) url = await this._cache.camera(this.hass, cameraEntity);
    if (!url) {
      notify(this, t("No snapshot to enlarge"));
      return;
    }
    this._lightbox?.open(url, caption || name);
  }

  private _onFaceAction(e: CustomEvent<FaceActionDetail>): void {
    e.stopPropagation();
    const d = e.detail;
    const card = e.target instanceof HTMLElement && e.target.tagName.toLowerCase() === "jarvis-face-card" ? (e.target as JarvisFaceCard) : null;
    switch (d.action) {
      case "make_resident":
        void this._addResident(d.name, false);
        break;
      case "remove_resident":
        void this._removeResident(d.name);
        break;
      case "remove_photo":
        void this._removePhoto(d.name);
        break;
      case "set_photo":
        void this._setPhotoFromFile(d.name, d.file);
        break;
      case "from_sighting":
        void this._fromSighting(d.name, d.src, d.cameraEntity);
        break;
      case "snapshot_now":
        void this._snapshotNow(d.name, d.cameraEntity);
        break;
      case "label":
        void this._labelFace(card, d.name, d.src, d.cameraEntity);
        break;
      case "enlarge":
        void this._enlarge(d.name, d.src, d.cameraEntity, d.caption);
        break;
    }
  }

  // ── config writes ──────────────────────────────────────────────────────

  private async _writeConfig(key: string, value: unknown): Promise<void> {
    await this.ws("jarvis/update_config", { key, value });
  }

  private async _toggleLlm(on: boolean): Promise<void> {
    if (this._llmPending) return;
    this._llmPending = true;
    this._llmOverride = on;
    try {
      await this._writeConfig("llm_face_recognition", on);
      notify(this, t("Saved"));
      await this._loadFaces();
      this.refresh();
    } catch (err) {
      this._llmOverride = null;
      notify(this, errorMessage(err));
    } finally {
      this._llmPending = false;
    }
  }

  private async _toggleLocal(on: boolean): Promise<void> {
    if (this._localPending) return;
    this._localPending = true;
    this._localOverride = on;
    try {
      await this._writeConfig("voice_recognition_local", on);
      this._showRestartInfo = true;
      await this._loadVoices(true);
      this.refresh();
    } catch (err) {
      this._localOverride = null;
      notify(this, errorMessage(err));
    } finally {
      this._localPending = false;
    }
  }

  private async _saveVoiceField(key: "voice_recognition_delegate_stt" | "voice_embedding_model_path", value: string): Promise<void> {
    const v = this._voices.data;
    const current = key === "voice_recognition_delegate_stt" ? v?.delegateStt ?? "" : v?.modelPath ?? "";
    const next = value.trim();
    if (next === current || this._savingKey) {
      if (key === "voice_recognition_delegate_stt") this._delegateDraft = null;
      else this._modelDraft = null;
      return;
    }
    this._savingKey = key;
    try {
      await this._writeConfig(key, next);
      notify(this, t("Saved"));
      await this._loadVoices(true);
      this.refresh();
    } catch (err) {
      notify(this, errorMessage(err));
    } finally {
      this._savingKey = null;
      if (key === "voice_recognition_delegate_stt") this._delegateDraft = null;
      else this._modelDraft = null;
    }
  }

  // ── voices: mic actions ────────────────────────────────────────────────

  private async _record(mode: "enroll" | "identify"): Promise<string | null> {
    this._recording = { mode, left: RECORD_SECONDS };
    this._liveMessage = t("Recording… {s}s", { s: RECORD_SECONDS });
    try {
      const clip = await recordWavBase64(RECORD_SECONDS, (left) => {
        if (this._recording) this._recording = { mode, left };
      });
      if (!clip) {
        notify(this, t("No audio captured"));
        return null;
      }
      return clip;
    } catch (err) {
      const msg = errorMessage(err);
      notify(this, msg === t("No audio captured") ? msg : t("Microphone unavailable — {message}", { message: msg }));
      return null;
    } finally {
      this._recording = null;
      this._liveMessage = "";
    }
  }

  private async _enrollVoice(): Promise<void> {
    const name = this._voiceName.trim();
    if (!name) {
      notify(this, t("Name the voice first"));
      return;
    }
    if (this._recording || this._voiceBusy) return;
    this._voiceBusy = true;
    try {
      const audio = await this._record("enroll");
      if (!audio) return;
      const res = await this.ws<VoicesResponse>("jarvis/voices", { action: "enroll", name, audio });
      this._applyVoices(res);
      this._voiceName = "";
      const profile = this._voices.data?.profiles.find((p) => normName(p.name) === normName(name));
      notify(this, t("Enrolled {name} ({count} samples)", { name, count: profile?.count ?? 1 }));
    } catch (err) {
      notify(this, errorMessage(err));
    } finally {
      this._voiceBusy = false;
    }
  }

  private async _identifyVoice(): Promise<void> {
    if (this._recording || this._voiceBusy) return;
    this._voiceBusy = true;
    try {
      const audio = await this._record("identify");
      if (!audio) return;
      const res = await this.ws<VoicesResponse>("jarvis/voices", { action: "identify", audio });
      const match = identifyMatch(res);
      const text = match
        ? t("Heard: {name} ({score}%)", { name: match.name, score: Math.round(match.score * 10) / 10 }) + (match.trusted ? "" : t(", guess"))
        : t("No confident match");
      this._identifyResult = text;
      notify(this, text);
    } catch (err) {
      notify(this, errorMessage(err));
    } finally {
      this._voiceBusy = false;
    }
  }

  private async _forgetVoice(name: string): Promise<void> {
    if (this._forgetting.has(name)) return;
    const ok = await confirmDialog({
      heading: t("Forget the voiceprint for {name}?", { name }),
      message: t("JARVIS will no longer recognize this voice until it is enrolled again."),
      confirmLabel: t("Forget"),
      destructive: true,
    });
    if (!ok) return;
    this._forgetting = new Set([...this._forgetting, name]);
    try {
      const res = await this.ws<VoicesResponse>("jarvis/voices", { action: "forget", name });
      this._applyVoices(res);
      notify(this, t("Forgot the voiceprint for {name}", { name }));
    } catch (err) {
      notify(this, errorMessage(err));
    } finally {
      const next = new Set(this._forgetting);
      next.delete(name);
      this._forgetting = next;
    }
  }

  // ── wellbeing ──────────────────────────────────────────────────────────

  private async _toggleBio(on: boolean): Promise<void> {
    if (this._bioPending) return;
    this._bioPending = true;
    this._bioOverride = on;
    try {
      // Write through update_config (runtime_config + config.json + config-changed
      // signal) so Settings and its Wellbeing card see the new value - the same
      // path jarvis/biometrics enable / disable take (config_apply) - then re-read
      // the status.
      await this.ws("jarvis/update_config", { key: "biometrics_enabled", value: on });
      const res = await this.ws<BiometricsResponse>("jarvis/biometrics", { action: "status" });
      this._applyBio(res);
      notify(this, on ? t("Wellbeing context on") : t("Wellbeing context off"));
      this.refresh();
    } catch (err) {
      this._bioOverride = null;
      notify(this, errorMessage(err));
    } finally {
      this._bioPending = false;
    }
  }

  // ── shared render helpers ──────────────────────────────────────────────

  private _icon(icon: string): TemplateResult | typeof nothing {
    return haDefined("ha-icon") ? html`<ha-icon .icon=${icon} aria-hidden="true"></ha-icon>` : nothing;
  }

  private _iconButton(icon: string, label: string, onClick: () => void, disabled = false, slot?: string): TemplateResult {
    return haDefined("ha-icon-button")
      ? html`<ha-icon-button slot=${slot ?? nothing} .label=${label} title=${label} .disabled=${disabled} @click=${onClick}>
          ${this._icon(icon)}
        </ha-icon-button>`
      : html`<button slot=${slot ?? nothing} class="jv-icon-btn" type="button" aria-label=${label} title=${label} ?disabled=${disabled} @click=${onClick}>
          ${this._icon(icon) === nothing ? html`<span aria-hidden="true">•</span>` : this._icon(icon)}
        </button>`;
  }

  private _switch(opts: SwitchOpts): TemplateResult {
    const onChange = (e: Event) => opts.onChange(!!(e.target as HTMLInputElement).checked);
    if (haDefined("ha-switch")) {
      const sw = html`<ha-switch
        .checked=${live(opts.checked)}
        .disabled=${opts.disabled}
        aria-label=${opts.label}
        title=${opts.title ?? nothing}
        @change=${onChange}
      ></ha-switch>`;
      // the switch row already shows the visible label; the control only needs its accessible name
      return sw;
    }
    return html`
      <label class="switch" title=${opts.title ?? nothing}>
        <input type="checkbox" role="switch" aria-label=${opts.label} .checked=${live(opts.checked)} ?disabled=${opts.disabled} @change=${onChange} />
      </label>
    `;
  }

  private _textField(opts: {
    id: string;
    label: string;
    value: string;
    placeholder?: string;
    disabled?: boolean;
    list?: string[];
    /** the caller renders a visible <label for=id>; use a plain input without its own label */
    labelled?: boolean;
    onInput: (v: string) => void;
    onEnter?: () => void;
    onBlur?: (v: string) => void;
  }): TemplateResult {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.isComposing && opts.onEnter) {
        e.preventDefault();
        opts.onEnter();
      }
    };
    const listId = opts.list ? `${opts.id}-list` : undefined;
    const datalist = opts.list ? html`<datalist id=${listId!}>${opts.list.map((v) => html`<option value=${v}></option>`)}</datalist>` : nothing;
    if (haDefined("ha-textfield") && !opts.list && !opts.labelled) {
      return html`<ha-textfield
        id=${opts.id}
        .label=${opts.label}
        .value=${live(opts.value)}
        .placeholder=${opts.placeholder ?? ""}
        .disabled=${!!opts.disabled}
        autocomplete="off"
        @input=${(e: Event) => opts.onInput((e.target as HTMLInputElement).value)}
        @keydown=${onKey}
        @blur=${(e: Event) => opts.onBlur?.((e.target as HTMLInputElement).value)}
      ></ha-textfield>`;
    }
    const hidden = opts.labelled ? nothing : html`<label class="visually-hidden" for=${opts.id}>${opts.label}</label>`;
    return html`${hidden}
      <input
        id=${opts.id}
        type="text"
        autocomplete="off"
        list=${listId ?? nothing}
        placeholder=${opts.placeholder ?? opts.label}
        .value=${live(opts.value)}
        ?disabled=${!!opts.disabled}
        @input=${(e: Event) => opts.onInput((e.target as HTMLInputElement).value)}
        @keydown=${onKey}
        @blur=${(e: Event) => opts.onBlur?.((e.target as HTMLInputElement).value)}
      />${datalist}`;
  }

  private _loading(squares = 0): TemplateResult {
    if (squares > 0) {
      return html`<ul class="gallery" role="status" aria-live="polite" aria-label=${t("Loading...")}>
        ${Array.from({ length: squares }, () => html`<li><div class="jv-skeleton skeleton-square"></div></li>`)}
      </ul>`;
    }
    return html`<div class="loading" role="status" aria-live="polite" aria-label=${t("Loading...")}>
      <div class="jv-skeleton"></div>
      <div class="jv-skeleton"></div>
      <div class="jv-skeleton"></div>
    </div>`;
  }

  private _error(title: string, st: Loadable<unknown>, retry: () => void, olderBackend: string): TemplateResult {
    const message = st.code === "unknown_command" ? olderBackend : st.error || "";
    const canRetry = st.code !== "unauthorized";
    const btn = canRetry ? html`<button class="jv-btn" type="button" slot="action" @click=${retry}>${t("Retry")}</button>` : nothing;
    if (haDefined("ha-alert")) {
      return html`<ha-alert alert-type="error" .title=${title}>${message}${btn}</ha-alert>`;
    }
    return html`<div class="alert" role="alert">
      <div class="body"><strong>${title}</strong><span>${message}</span></div>
      ${btn}
    </div>`;
  }

  private _infoAlert(text: string): TemplateResult {
    return haDefined("ha-alert")
      ? html`<ha-alert alert-type="info">${text}</ha-alert>`
      : html`<div class="alert info" role="status"><div class="body"><span>${text}</span></div></div>`;
  }

  private _empty(message: string, icon: string): TemplateResult {
    return html`<jv-empty compact .icon=${icon} .message=${message}></jv-empty>`;
  }

  // ── Household ──────────────────────────────────────────────────────────

  private _renderIntro(): TemplateResult {
    const p1 = t(
      "Faces JARVIS recognizes from your vision backend — Frigate face recognition, or middleware like Double Take paired with external detectors such as CompreFace or DeepStack. JARVIS runs no face engine of its own; flag the people who live here as residents so it can tell a household member from a guest or an unknown face, and stand intrusion monitoring down when the person it sees is a resident.",
    );
    const p2 = t(
      "A recognized face that isn't a resident is a guest — the jarvis_face_recognized event carries that status (relationship: resident / guest / unknown) so your automations can treat household and visitors differently.",
    );
    const body = html`<p>${p1}</p>
      <p>${p2}</p>`;
    if (this.narrow) {
      return html`<details class="intro"><summary>${t("What is this?")}</summary>${body}</details>`;
    }
    return html`<div class="intro">${body}</div>`;
  }

  private _renderHousehold(): TemplateResult {
    const st = this._faces;
    const f = st.data;
    const n = f?.residents.length ?? 0;
    const sub = `${n === 1 ? t("1 resident") : t("{n} residents", { n })} · ${t("people who live here")}`;
    const busy = st.status === "loading" || this._facesBusy;
    const cameras = this._cameras();
    return html`
      <jv-section class="jv-span-all card-household" icon="mdi:home-account" .heading=${t("Household")} .subheading=${sub} ?loading=${busy && !!f}>
        ${this._iconButton("mdi:refresh", t("Refresh"), () => this._refreshAll(), st.status === "loading", "actions")}
        ${this._renderIntro()}
        <form
          class="form-row"
          @submit=${(e: Event) => {
            e.preventDefault();
            void this._addResident(this._addName, true);
          }}
        >
          <div class="grow">
            ${this._textField({
              id: "add-resident",
              label: t("Add a resident by name"),
              value: this._addName,
              disabled: this._facesBusy || st.status === "error",
              onInput: (v) => (this._addName = v),
            })}
          </div>
          <button class="jv-btn primary" type="submit" ?disabled=${this._facesBusy || !this._addName.trim()}>
            ${this._icon("mdi:account-plus-outline")}${t("Add resident")}
          </button>
        </form>
        ${st.status === "error" && !f
          ? this._error(t("Could not load faces."), st, () => void this._loadFaces(), t("Faces need a newer JARVIS backend — restart Home Assistant after updating."))
          : f
            ? n === 0
              ? this._empty(
                  t("No residents yet. Add the people who live here (or name a recognized face below); recognized residents then won't trigger intrusion alerts."),
                  "mdi:account-plus-outline",
                )
              : html`<ul class="gallery">
                  ${f.residents.map((name) => {
                    const model = this._residentModel(name, f);
                    return html`<li>
                      <jarvis-face-card
                        .hass=${this.hass}
                        .model=${model}
                        .cache=${this._cache}
                        .residents=${f.residents}
                        .cameras=${cameras}
                        ?busy=${this._cardBusy.has(this._cardKey(name))}
                      ></jarvis-face-card>
                    </li>`;
                  })}
                </ul>`
            : this._loading(4)}
      </jv-section>
    `;
  }

  // ── Recently seen ──────────────────────────────────────────────────────

  private _renderRecent(): TemplateResult {
    const st = this._faces;
    const f = st.data;
    const rows = f ? f.recent.filter((r) => !r.is_resident) : [];
    const cameras = this._cameras();
    return html`
      <jv-section
        class="jv-span-all card-recent"
        icon="mdi:account-clock-outline"
        .heading=${t("Recently seen")}
        .subheading=${t("guests & unknown faces")}
        ?loading=${(st.status === "loading" || this._facesBusy) && !!f}
      >
        ${st.status === "error" && !f
          ? this._error(t("Could not load faces."), st, () => void this._loadFaces(), t("Faces need a newer JARVIS backend — restart Home Assistant after updating."))
          : f
            ? rows.length === 0
              ? this._empty(
                  t("No guests or unknown faces seen recently. When your backend names a face that isn't a resident, it appears here as a guest."),
                  "mdi:account-question-outline",
                )
              : html`<ul class="gallery">
                  ${rows.map(
                    (row) => html`<li>
                      <jarvis-face-card
                        .hass=${this.hass}
                        .model=${this._recentModel(row)}
                        .cache=${this._cache}
                        .residents=${f.residents}
                        .cameras=${cameras}
                        ?busy=${this._cardBusy.has(this._cardKey(row.name, row.camera_entity))}
                      ></jarvis-face-card>
                    </li>`,
                  )}
                </ul>`
            : this._loading(4)}
        ${f && f.recognitionSource
          ? html`<p class="footer">
              ${this._sourceLine(f.recognitionSource)} ·
              ${t("each snapshot is the frame captured when JARVIS recognized the face (falls back to the live camera view until the next sighting).")}
            </p>`
          : nothing}
      </jv-section>
    `;
  }

  /** "Reading identities from: {source}" with the source in code font. */
  private _sourceLine(source: string): TemplateResult {
    const marker = "\u0000";
    const [before = "", after = ""] = t("Reading identities from: {source}", { source: marker }).split(marker);
    return html`${before}<span class="code">${source}</span>${after}`;
  }

  // ── Voices ─────────────────────────────────────────────────────────────

  private _renderVoices(): TemplateResult {
    const st = this._voices;
    const v = st.data;
    const cfg = (this.data?.config ?? {}) as Record<string, unknown>;
    const localOn = this._localOverride ?? v?.localEnabled ?? !!cfg.voice_recognition_local;
    const delegate = this._delegateDraft ?? v?.delegateStt ?? (typeof cfg.voice_recognition_delegate_stt === "string" ? cfg.voice_recognition_delegate_stt : "");
    const modelPath = this._modelDraft ?? v?.modelPath ?? "";
    const backend = !!v?.backendAvailable;
    const residents = this._facesData?.residents ?? [];
    const micDisabled = !backend || !!this._recording || this._voiceBusy || st.status !== "loaded";
    const micTitle = backend ? undefined : t("Install the speaker-ID backend first");
    const recLabel = (mode: "enroll" | "identify", idle: string) =>
      this._recording?.mode === mode ? t("Recording… {s}s", { s: this._recording.left }) : idle;
    const locale = localeOf(this.hass);

    const configBlock = html`
      <div class="switch-row">
        <span class="label">${t("Identify speakers in-process")}</span>
        ${this._switch({
          checked: localOn,
          disabled: this._localPending || st.status === "idle" || st.status === "error",
          label: t("Identify speakers in-process"),
          onChange: (on) => void this._toggleLocal(on),
        })}
      </div>
      <p class="help">${t("Needs onnxruntime and a speaker model; see the voice recognition guide.")}</p>
      ${this._showRestartInfo
        ? this._infoAlert(t('Restart Home Assistant (or reload JARVIS) for the "JARVIS Speaker-ID" speech-to-text entity to appear or disappear.'))
        : nothing}
      ${localOn
        ? html`
            <div class="field">
              <label for="voice-delegate">${t("Delegate STT entity")}</label>
              ${this._textField({
                id: "voice-delegate",
                label: t("Delegate STT entity"),
                placeholder: t("e.g. stt.faster_whisper"),
                labelled: true,
                value: delegate,
                disabled: this._savingKey === "voice_recognition_delegate_stt",
                list: sttEntities(this.hass),
                onInput: (val) => (this._delegateDraft = val),
                onEnter: () => void this._saveVoiceField("voice_recognition_delegate_stt", this._delegateDraft ?? delegate),
                onBlur: (val) => void this._saveVoiceField("voice_recognition_delegate_stt", val),
              })}
            </div>
            <div class="field">
              <label for="voice-model">${t("Model path")}</label>
              ${this._textField({
                id: "voice-model",
                label: t("Model path"),
                placeholder: "<config>/jarvis/models/speaker.onnx",
                labelled: true,
                value: modelPath,
                disabled: this._savingKey === "voice_embedding_model_path",
                onInput: (val) => (this._modelDraft = val),
                onEnter: () => void this._saveVoiceField("voice_embedding_model_path", this._modelDraft ?? modelPath),
                onBlur: (val) => void this._saveVoiceField("voice_embedding_model_path", val),
              })}
            </div>
          `
        : nothing}
    `;

    const statusBlock = v
      ? html`
          <div class="status" aria-live="polite">
            ${backend
              ? html`<jv-state-badge level="ok" .label=${t("Speaker-ID backend ready")}></jv-state-badge>`
              : html`<jv-state-badge level="warn" .label=${t("Backend not installed")}></jv-state-badge>
                  <span class="hint">${t("add onnxruntime and a model to enable")}</span>`}
          </div>
          <p class="speaking" aria-live="polite">
            ${v.current
              ? html`${t("Speaking now: {name} · {score}%", { name: v.current.name, score: Math.round(v.current.score * 10) / 10 })}
                ${v.current.trusted ? nothing : html` <span class="guess">${t("(guess)")}</span>`}`
              : t("Speaking now: —")}
          </p>
          ${this._identifyResult ? html`<p class="result" role="status" aria-live="polite">${this._identifyResult}</p>` : nothing}
        `
      : nothing;

    const listBlock = v
      ? v.profiles.length === 0
        ? this._empty(t("No enrolled voices yet. Record a short sample below to teach JARVIS a voice."), "mdi:account-voice")
        : html`<ul class="plain">
            ${v.profiles.map((p) => {
              const busy = this._forgetting.has(p.name);
              return html`<li>
                <div class="text">
                  <span class="jv-truncate" title=${p.name}>${p.name}</span>
                  <span class="sub">
                    ${p.count === 1 ? t("1 sample") : t("{count} samples", { count: p.count })}
                    ${p.updated > 0 ? html` · ${relativeEpoch(p.updated, locale)}` : nothing}
                  </span>
                </div>
                ${this._iconButton("mdi:delete-outline", t("Forget voiceprint"), () => void this._forgetVoice(p.name), busy)}
              </li>`;
            })}
          </ul>`
      : nothing;

    const enrolBlock = html`
      <div class="mic-row">
        <div class="grow">
          ${this._textField({
            id: "voice-name",
            label: t("Name this voice…"),
            value: this._voiceName,
            disabled: !!this._recording || this._voiceBusy,
            list: residents,
            onInput: (val) => (this._voiceName = val),
            onEnter: () => void this._enrollVoice(),
          })}
        </div>
        <button class="jv-btn primary" type="button" ?disabled=${micDisabled} title=${micTitle ?? nothing} @click=${() => void this._enrollVoice()}>
          ${this._icon("mdi:microphone")}${recLabel("enroll", t("Record & enroll"))}
        </button>
        <button class="jv-btn" type="button" ?disabled=${micDisabled} title=${micTitle ?? nothing} @click=${() => void this._identifyVoice()}>
          ${this._icon("mdi:microphone-question")}${recLabel("identify", t("Identify"))}
        </button>
      </div>
      <span class="sr-live" aria-live="assertive">${this._liveMessage}</span>
      <p class="footer">
        ${t("Voiceprints are stored as embeddings, never audio. A match only identifies a resident above a confidence threshold; weaker matches are shown as a guess and never stand security alerts down.")}
        <button class="link" type="button" @click=${() => this.navigate("settings", "voice")}>${t("Thresholds are in Settings → Voice & Audio.")}</button>
      </p>
    `;

    return html`
      <jv-section class="card-voices" icon="mdi:account-voice" .heading=${t("Voices")} ?loading=${st.status === "loading" && !!v}>
        <jv-state-badge slot="actions" level="info" nodot .label=${t("Experimental")}></jv-state-badge>
        ${configBlock}
        ${st.status === "error" && !v
          ? this._error(t("Could not load voices."), st, () => void this._loadVoices(), t("Voice ID needs a newer JARVIS backend."))
          : v
            ? html`${statusBlock}${listBlock}${enrolBlock}`
            : this._loading()}
      </jv-section>
    `;
  }

  // ── Wellbeing ──────────────────────────────────────────────────────────

  private _renderWellbeing(): TemplateResult {
    const st = this._bio;
    const b = st.data;
    const enabled = this._bioOverride ?? b?.enabled ?? false;
    const badge = b
      ? enabled
        ? html`<jv-state-badge slot="actions" level="ok" .label=${t("On · {n} sensors", { n: b.found })}></jv-state-badge>`
        : html`<jv-state-badge slot="actions" level="neutral" .label=${t("Off")}></jv-state-badge>`
      : nothing;
    let body: TemplateResult;
    if (st.status === "error" && !b) {
      body = this._error(t("Could not load wellbeing context."), st, () => void this._loadBio(), t("Could not load wellbeing context."));
    } else if (!b) {
      body = this._loading();
    } else if (!enabled) {
      body = this._empty(t("Off — enable to let JARVIS use wearable context. Health readings are never diagnosed or alarmed on."), "mdi:heart-pulse");
    } else if (b.entities.length === 0) {
      body = this._empty(t("No wearable entities found. Connect a wearable integration (Withings, Google Fit, Oura, etc.) to Home Assistant."), "mdi:watch-variant");
    } else {
      const groups = groupByKind(b.entities);
      const row = (e: { kind: string; entity: string; value: string; unit: string; name: string }, showKind: boolean) => html`
        <li>
          <jv-kv stacked .label=${showKind ? e.kind.replace(/_/g, " ") : e.name || e.entity} .value=${`${e.value}${e.unit ? ` ${e.unit}` : ""}`} title=${e.name}></jv-kv>
          <span class="sub code">${e.entity}</span>
        </li>`;
      body = html`${groups.map(([kind, items]) =>
        items.length > 1
          ? html`<section class="kind-group" aria-label=${kind.replace(/_/g, " ")}>
              <h3>${kind.replace(/_/g, " ")}</h3>
              <ul class="plain">${items.map((e) => row(e, false))}</ul>
            </section>`
          : html`<ul class="plain">${items.map((e) => row(e, true))}</ul>`,
      )}`;
    }
    return html`
      <jv-section class="card-wellbeing" icon="mdi:heart-pulse" .heading=${t("Wellbeing Context")} ?loading=${st.status === "loading" && !!b}>
        ${badge}
        <div class="intro">
          <p>${t("Lets JARVIS read a connected wearable (heart rate, sleep, steps) so it can be quieter when you're resting.")}</p>
          <p><strong>${t("Context only — not medical.")}</strong> ${t("Off by default; health data stays private.")}</p>
        </div>
        <div class="switch-row">
          <span class="label">${t("Use wearable context")}</span>
          ${this._switch({
            checked: enabled,
            disabled: this._bioPending || !b,
            label: t("Use wearable context"),
            onChange: (on) => void this._toggleBio(on),
          })}
        </div>
        ${body}
      </jv-section>
    `;
  }

  // ── Options ────────────────────────────────────────────────────────────

  private _renderOptions(): TemplateResult {
    const f = this._facesData;
    const cfg = (this.data?.config ?? {}) as Record<string, unknown>;
    const llm = this._llmOverride ?? f?.llmFaceRecognition ?? !!cfg.llm_face_recognition;
    const source = f?.recognitionSource || (typeof cfg.recognition_source === "string" && cfg.recognition_source) || "both";
    const ready = this._faces.status === "loaded" || !!f;
    return html`
      <jv-section class="card-options" icon="mdi:face-recognition" .heading=${t("Face recognition options")}>
        <div class="switch-row">
          <span class="label">${t("Best-effort face recognition")} <jv-state-badge level="info" nodot .label=${t("Experimental")}></jv-state-badge></span>
          ${this._switch({
            checked: llm,
            disabled: !ready || this._llmPending,
            label: t("Best-effort face recognition"),
            onChange: (on) => void this._toggleLlm(on),
          })}
        </div>
        <p class="help">
          ${t(
            "No dedicated face backend? With this on, JARVIS asks its own local vision model whether a camera frame matches a resident's reference photo (set one on each resident card). It's a rough guess — results are clearly marked LLM GUESS, and this never disables intrusion alerts. For reliable recognition, use Frigate's native face recognition instead.",
          )}
        </p>
        <jv-kv .label=${t("Recognition source")} .value=${source} mono></jv-kv>
        <div>
          <button class="link" type="button" @click=${() => this.navigate("settings", "cameras")}>${t("Change in Settings → Cameras")}</button>
        </div>
        <div>
          <a class="link" href=${VOICE_GUIDE_URL} target="_blank" rel="noopener noreferrer">${t("Voice recognition setup guide")}</a>
        </div>
      </jv-section>
    `;
  }

  // ── render ─────────────────────────────────────────────────────────────

  override render() {
    if (!this.hass) return nothing;
    // DOM order is the narrow order; desktop reorders with CSS `order` (styles.ts).
    return html`
      <div class="jv-grid" @face-action=${this._onFaceAction}>
        ${this._renderRecent()} ${this._renderHousehold()} ${this._renderVoices()} ${this._renderWellbeing()} ${this._renderOptions()}
      </div>
      <jarvis-people-lightbox></jarvis-people-lightbox>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-view-people": JarvisViewPeople;
  }
}
