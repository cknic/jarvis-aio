# People view — specification (Phase 3 Lit panel)

Derived from the old panel's **Faces** tab (`git show 47bede5:custom_components/jarvis/frontend/jarvis-panel.js`:
markup `_html()` ~L4755–4777, logic `_wireFaces / _facesAction / _fetchFaces / _renderFaces / _faceCard /
_uploadFaceReference / _captureFaceImage / _labelFaceAs / _snapshotReferenceNow / _openFaceLightbox /
_loadFaceReference / _loadFaceSnap / _facesAge / _faceNorm` ~L8359–9005; the Voices card
`_fetchVoices / _renderVoices / _voicesSetCfg / _voicesForget / _voicesRecord / _recordWavBase64 /
_encodeWavBase64` ~L8397–8569) and the old Settings tab's **Wellbeing Context** card (markup ~L5383–5397,
logic `_fetchBio / _renderBio / _wireBio` ~L7953–8012), plus the backend in
`custom_components/jarvis/websocket.py` (`ws_faces`, `ws_face_reference`, `ws_voices`, `ws_biometrics`,
`ws_camera_snapshot`, `ws_update_config`), `recognition.py`, `face_roster.py`, `voice_roster.py`,
`speaker_id.py`, `voice_recognition.py`, `biometrics.py`, `stt.py`, `snapshot_view.py`. The view agent does
**not** need to open the old panel; every contract it needs is recorded here.

Route: `/jarvis/people` (`route.path === "/people"`). Element `<jarvis-view-people>` in
`src/views/people.ts` (+ `src/views/people/`: `face-card.ts`, `lightbox.ts`, `image.ts`, `record-wav.ts`,
`format.ts`, `styles.ts`, `types.ts`). Registered in `src/views/index.ts` as `{ key: "people", title:
"People", icon: "mdi:account-group-outline", element: "jarvis-view-people" }`, fourth in `VIEWS` (after
`cameras`, before `suggestions`); on narrow it is reached through the bottom nav's "More" sheet.

The whole panel is `require_admin=True`. **Everything on this page is biometric data about other
people** (face frames, reference photos, voiceprints, wearable readings). Every command below is
admin-only end to end (`_deny_non_admin` on every action of `jarvis/faces` and `jarvis/voices`, including
`list`; `@require_admin` on `jarvis/face_reference`, `jarvis/camera_snapshot`, `jarvis/update_config`;
`enable`/`disable` of `jarvis/biometrics`; the `faces` kind of `/api/jarvis/snapshot/` answers 401 to a
non-admin; `jarvis/biometrics status` is open). A non-admin never reaches the view, but if any call ever rejects with `code: "unauthorized"`
show its message in that card's error slot and stop retrying.

---

## 1. Purpose

One admin page for *who JARVIS knows*:

* **Faces** — the household roster (residents) layered on top of whatever vision backend names faces
  (Frigate face recognition, Double Take → CompreFace/DeepStack, or JARVIS's own best-effort LLM
  matcher). Shows each resident with the frame from when they were last recognised, guests and unknown
  faces recently seen, lets the admin add/remove residents, enrol a **reference photo** per resident
  (file upload, "use this sighting", or "snapshot a camera now"), and **name an unknown face** straight
  from its snapshot. JARVIS runs no face engine of its own; residents stand intrusion monitoring down,
  guests and unknowns never do, and an *LLM GUESS* never does either.
* **Voices** — the experimental in-process speaker-ID (Path B, issue #397): enrolled voiceprints
  (embeddings, never audio), the live "speaking now" readout from the STT tee, enrol / identify from a
  4-second browser-microphone clip, forget a voiceprint, and the three keys that switch the tee on.
* **Wellbeing Context** — the opt-in wearable context (`biometrics.py`): on/off plus the list of wearable
  entities JARVIS discovered. Context only, never medical; off by default.

Backend modules: `recognition.py` (recent faces, pinned snapshots, reference photos, LLM guesses),
`face_roster.py` (resident list, `<config>/jarvis/face_roster.json`), `voice_roster.py`
(`<config>/jarvis/voices_ref/<norm>.json` centroids), `speaker_id.py` (ONNX embedding + cosine match),
`voice_recognition.py` (`current_local_speaker()`), `stt.py` (the "JARVIS Speaker-ID" STT tee),
`biometrics.py` (discovery heuristics), `snapshot_view.py` (`/api/jarvis/snapshot/{kind}/{filename}`).

---

## 2. Data

All calls go through `this.ws(type, payload)` (`src/ws.ts`), which rejects with `WsError {code, message}`.
Codes any call may produce: `unauthorized`, `unknown_command` (backend older than the panel), `timeout`,
`no_connection` (raised locally). Handler-specific codes are listed per command. Every `*_failed` error
carries `str(exc)` as its message — show it.

### 2.1 `jarvis/faces` — roster, recent sightings, reference photos (one command, five actions)

`websocket.ws_faces`. Request schema (voluptuous, exact):

```python
{
    vol.Required("type"): "jarvis/faces",
    vol.Optional("action"): vol.In(["list", "add_resident", "remove_resident", "set_reference", "remove_reference"]),
    vol.Optional("name"): str,
    vol.Optional("image"): str,   # base64 JPEG for set_reference; a data: URL prefix is tolerated
    vol.Optional("limit"): int,   # recent rows, default 20, clamped to >= 1 (old panel sent 24)
}
```

`action` defaults to `"list"`. **Every action, `list` included, is admin-gated** (`_deny_non_admin` →
`send_error("unauthorized", "administrator privileges are required for this action")`). Handler
exception → `send_error("faces_failed", str(exc))`.

Side effects by action (all file I/O on the executor):

| action | requires | effect | notes |
|---|---|---|---|
| `list` | — | reloads the roster file | |
| `add_resident` | `name` | `face_roster.add_resident(name)` (normalised key, latest display spelling kept); `jarvis_log("CAMERA", …)` | adding an existing resident is a silent no-op |
| `remove_resident` | `name` | `face_roster.remove_resident(name)` **and** `recognition.remove_face_reference(name)` — the enrolled reference photo is deleted too | confirm text must say the photo goes with it |
| `set_reference` | `name`, `image` | `base64.b64decode(image.split(",", 1)[-1])` → `recognition.set_face_reference(name, bytes)` → `<config>/jarvis/faces_ref/<norm>.jpg` (atomic replace; overwrites silently) | undecodable base64 → empty bytes → stored = False → **`send_error("reference_failed", "could not store the reference photo")`** (no list response). The bytes are stored as-is, whatever the file type; send JPEG. |
| `remove_reference` | `name` | deletes `<config>/jarvis/faces_ref/<norm>.jpg` | not exposed in the old UI; new optional action |

**An action whose required fields are missing (e.g. `add_resident` without `name`) is not an error — the
handler silently falls through to the `list` branch.** Validate client-side (non-empty trimmed `name`,
non-empty `image`) before sending.

Response for **every** action (after the side effect; `set_reference`'s failure path excepted):

```ts
interface FacesResponse {
  recent: FaceRow[];            // newest first (sorted by age_seconds ascending), at most `limit`
  residents: string[];          // display names, sorted case-insensitively (face_roster.residents())
  references: string[];         // NORMALISED names that have a reference photo (file stems of faces_ref/*.jpg), sorted
  llm_face_recognition: boolean; // effective value of the config key (runtime_config → config.json → entry)
  recognition_source: string;   // "both" | "frigate" | "doubletake" (free string server-side; default "both")
}

interface FaceRow {
  name: string;                 // display name from the backend; "Unknown" for best-effort unknown rows
  camera_entity: string;        // "camera.<slug>" (may be "" for a cache row with no camera; guard)
  camera: string;               // the slug after "camera." (old panel showed it with "_" → " ")
  confidence: number;           // 0..100, rounded to 1 dp; 0.0 for unknown rows
  age_seconds: number;          // int; **1_000_000_000 for Frigate-sensor rows that carry no timestamp**
  is_unknown: boolean;          // name is "unknown" / "unknown person" / "unknown_face" / "Unknown"
  is_resident: boolean;         // name is on the roster (false for unknown)
  relationship: "resident" | "guest" | "unknown";
  snapshot_url: string | null;  // "/api/jarvis/snapshot/faces/<norm>.jpg" (named) or ".../unknown_<camera>.jpg" (unknown) — MUST be signed (2.6) before use as <img src>
  is_low_confidence: boolean;   // true = best-effort LLM guess, badge "LLM GUESS", never authoritative
  source: "recent_cache" | "frigate_sensor" | "llm_guess" | "best_effort_unknown";
}
```

Semantics the view relies on (`recognition.recent_faces`):

* One row per `(lower-cased name, camera_entity)`; a trusted recognition always outranks an LLM guess for
  the same pair; within a tier the fresher wins. Rows older than 2 h (`CACHE_MAX_AGE`) are dropped.
* An unknown row exists per camera only when **no named row** exists for that camera.
* The cache is persisted across restarts (#331), so rows survive an HA restart but their `age_seconds`
  keep growing; `snapshot_url` files are pruned beyond 60 (`_MAX_FACE_SNAPSHOTS`) → expect 404s.
* Name normalisation (`recognition._face_norm`, also used for `references` and the snapshot filename):
  `identity.normalize(name)` (lower-case, whitespace → `_`), then strip everything outside `[a-z0-9_-]`,
  cap 80 chars. The old panel mirrored it client-side as
  `String(name).trim().toLowerCase().split(/\s+/).join("_").replace(/[^a-z0-9_-]/g, "").slice(0, 80)`;
  reuse that mirror to decide `hasReference = references.includes(norm(name))`. A mismatch (accented
  names) only degrades "Change photo" to "Set photo" — never gate anything else on it.
* Resident "last seen" = the freshest `recent` row whose `name.trim().toLowerCase()` equals the
  resident's (old panel logic). Residents beyond `limit` rows are simply "not seen recently", so send a
  generous `limit` (**60**; the call is cheap and the gallery is scrollable).

### 2.2 `jarvis/face_reference` — one enrolled reference photo, inline

```python
@websocket_api.require_admin
{
    vol.Required("type"): "jarvis/face_reference",
    vol.Required("name"): str,       # display OR normalised name; the backend normalises
}
```

Response `{ image: string | null }` — `"data:image/jpeg;base64,…"` or `null` when no photo is enrolled
(or the file is empty/unreadable). Error `face_reference_failed`. The photo lives outside `www/`, so this
is the **only** way to display it; cache the data URL per normalised name for the view's lifetime and
drop that cache entry after any `set_reference` / `remove_reference` / `remove_resident` for the name.

### 2.3 `jarvis/camera_snapshot` — a fresh frame from a camera

```python
@websocket_api.require_admin
{
    vol.Required("type"): "jarvis/camera_snapshot",
    vol.Required("entity_id"): str,  # must exist in hass.states and start with "camera."
}
```

Response `{ image: string | null }` — **bare base64 JPEG, no `data:` prefix** (down-scaled to 960 px);
`null` when every backend/proxy path produced no frame. Errors: `unknown_camera` (message = the entity id),
`snapshot_failed`. Used (a) as the third thumbnail fallback for a card whose camera is known, cached per
camera entity for the view's lifetime, and (b) for "Snapshot now" enrolment. Build the data URL as
`` `data:image/jpeg;base64,${image}` ``.

### 2.4 `jarvis/voices` — voiceprints (one command, four actions)

`websocket.ws_voices`. Request schema (exact):

```python
{
    vol.Required("type"): "jarvis/voices",
    vol.Optional("action"): vol.In(["list", "enroll", "identify", "forget"]),
    vol.Optional("name"): str,
    vol.Optional("audio"): str,   # base64 WAV clip; a data:audio/wav;base64, prefix is tolerated
}
```

Default `"list"`; **every action admin-gated** (`unauthorized`). Handler exception → `voices_failed`.

| action | requires | effect | response |
|---|---|---|---|
| `list` | — | — | `VoicesResponse` |
| `enroll` | `name`, `audio` | decode → `speaker_id.embed_wav(bytes)` → `voice_roster.enroll(name, emb)` (running-mean centroid, `count += 1`; a clip whose embedding dim differs from the stored profile is rejected); `jarvis_log("VOICE", …)` | `VoicesResponse`; failures are **errors**: `enroll_failed` with message `"could not embed that clip (backend off, clip too short, or unreadable)"` or `"could not store the voiceprint"` |
| `identify` | `audio` | decode → embed → `speaker_id.identify(emb)` | **`{ match: VoiceMatch | null }` only** — no roster fields |
| `forget` | `name` | `voice_roster.remove(name)` (deletes the profile file); `jarvis_log` | `VoicesResponse` |

As with faces, **a missing required field silently falls through to `list`** — `identify` without
`audio` returns a `VoicesResponse` with no `match` key. Validate before sending; treat an `identify`
response without a `match` key as "no match".

```ts
interface VoicesResponse {
  profiles: { name: string; count: number; updated: number }[];  // updated = epoch seconds (float, 0 if unknown); ordered by normalised name
  current: VoiceMatch | null;      // voice_recognition.current_local_speaker(): the STT tee's latest match within the last 20 s, else null
  local_enabled: boolean;          // config voice_recognition_local
  delegate_stt: string;            // config voice_recognition_delegate_stt ("" = unset)
  model_path: string;              // config voice_embedding_model_path ("" = default <config>/jarvis/models/speaker.onnx)
  backend_available: boolean;      // onnxruntime importable AND the model file loads
}

interface VoiceMatch {
  name: string;
  score: number;        // 0..100, 1 dp (cosine clamped to [0,1] × 100)
  similarity: number;   // raw cosine, -1..1, 4 dp
  count: number;        // enrolled samples for that profile
  trusted: boolean;     // similarity >= voice_local_trust_threshold (0.75) AND count >= voice_local_min_samples (2)
}
```

Audio contract: the backend decodes with the stdlib `wave` module, so the clip **must be a PCM WAV**
(8/16/24/32-bit, any rate, any channel count — it down-mixes and resamples to 16 kHz). Send what the old
panel sent: **16 kHz, mono, 16-bit PCM WAV, 4 s**, as `data:audio/wav;base64,…` (~128 KB). A clip
shorter than the backend's voiced-sample floor is rejected with `enroll_failed` (for `identify` it yields
`match: null`). `WebM/Opus` from `MediaRecorder` will **not** decode — do not use `MediaRecorder`.

Thresholds live in the Settings catalogue (`voice_local_trust_threshold` float 0.75,
`voice_local_guess_threshold` float 0.55, `voice_local_min_samples` int 2) — link there, do not
duplicate.

### 2.5 `jarvis/biometrics` — Wellbeing Context

```python
{
    vol.Required("type"): "jarvis/biometrics",
    vol.Required("action"): vol.In(["status", "enable", "disable"]),
}
```

`enable` / `disable` are admin-gated; `status` is open. `enable`/`disable` write `biometrics_enabled`
through `config_apply.async_apply_many` (runtime_config + config.json + native entity; see Risk 9) and
`jarvis_log("BIO", …)`. The response's `enabled` is read back from `jarvis_config`. Then, for every action,
discovery runs over **all** `sensor.*` + `binary_sensor.*` states (regardless of `enabled`) and the
response is:

```ts
interface BiometricsResponse {
  enabled: boolean;
  found: number;                  // entities.length
  entities: {
    kind: "heart_rate" | "resting_hr" | "sleep_stage" | "sleep_state" | "spo2" | "steps" | "respiratory" | "stress" | "temperature" | string; // string: a user key from biometric_entities
    entity: string;               // entity_id
    value: string;                // raw state ("72", "asleep", "unknown", "unavailable", …)
    unit: string;                 // unit_of_measurement or ""
    name: string;                 // friendly_name or ""
  }[];
}
```

Error `biometrics_failed`. Discovery is keyword/unit heuristics over `entity_id + friendly_name`
(`"sleep"`, `"steps"`, `"stress"`, `"_hr"`, `"pulse"`, unit `bpm`/`%`…), so expect false positives
(`binary_sensor.bedroom_sleep_mode` lands under `sleep_state`); always show the entity id. The explicit
override map `biometric_entities` (`{kind: entity_id}`) is a Settings JSON field.

### 2.6 `auth/sign_path` — face snapshots

`snapshot_url` values are `/api/jarvis/snapshot/faces/<file>.jpg`, served by `snapshot_view.py`
(`requires_auth`, **admin only for kind `faces`**, `image/jpeg`, `Cache-Control: no-store`, 404 when
pruned/missing, 401 for a non-admin). Use `signPath(this.hass, url)` from `src/ws.ts` (300 s signature,
cached 240 s) and set `<img src>` only once the signed URL resolves — the smoke test fails on an unsigned
`/api/` src. To **read the bytes** of a pinned frame (for "Label" / "From sighting") `fetch(signedUrl)`
works because the signature is in the query string; never fetch the raw path.

### 2.7 `jarvis/update_config` — the five keys this view writes

```python
@websocket_api.require_admin
{
    vol.Required("type"): "jarvis/update_config",
    vol.Required("key"): str,
    vol.Required("value"): vol.Any(bool, str, int, float, list, dict, None),
}
```

Response `{key, value}` (echo). Errors `invalid_key`, `no_entry`, `no_data`, `update_failed`. No
coercion — send the right JSON type.

| key | kind | default | catalogue label / category | where it shows |
|---|---|---|---|---|
| `llm_face_recognition` | bool | `false` | "LLM face recognition" / cameras | Faces options switch; also echoed in `FacesResponse.llm_face_recognition` and `data.config.llm_face_recognition` |
| `voice_recognition_local` | bool | `false` | "Local speaker ID" / voice | Voices "Identify speakers in-process" switch; echoed as `VoicesResponse.local_enabled` and `data.config.voice_recognition_local` |
| `voice_recognition_delegate_stt` | str | `""` | "Delegate STT" / voice | Voices text field (shown only when local is on); `VoicesResponse.delegate_stt`, `data.config.voice_recognition_delegate_stt` |
| `voice_embedding_model_path` | str | `""` | "Speaker embedding model path" / voice | Voices text field (shown only when local is on); `VoicesResponse.model_path` |

…and a fifth: `biometrics_enabled` (bool, default `false`, catalogue key) — the Wellbeing switch writes it
through `jarvis/update_config` (the single write path Settings uses too) and then re-reads
`jarvis/biometrics {action: "status"}` for the discovery list (A17).

### 2.8 `jarvis/get_panel_data` — snapshot fields read (optional)

`data.config.llm_face_recognition` (bool), `data.config.recognition_source` (str),
`data.config.voice_recognition_local` (bool), `data.config.voice_recognition_delegate_stt` (str),
`data.config.voice_recognition_source` (str — the *external* speaker service, read-only hint),
`data.config.identity_voice_fingerprint` (bool). `biometrics_enabled` and `voice_embedding_model_path`
are **not** in the snapshot. Prefer the per-command responses (fresh); use the snapshot only to
pre-render switches before the first fetch resolves.

### 2.9 Client-side HA state used directly

`hass.states` filtered to `camera.*` for the "Snapshot now" camera select (sorted by entity id, label =
`attributes.friendly_name || entity_id`); `hass.states[row.camera_entity]?.attributes.friendly_name` for
the meta line (fallback: `row.camera.replace(/_/g, " ")`). Remember the chosen camera per browser in
`localStorage["jarvis_faces_snap_cam"]` (old key; wrap in try/catch).

### 2.10 Services

None. The old Faces tab made no `hass.callService` call.

### 2.11 Fetch / refresh schedule

| data | when |
|---|---|
| `jarvis/faces {action:"list", limit:60}` | `firstUpdated`; Refresh button; after every faces mutation (the mutation response *is* a fresh list — use it and skip the extra call); after `llm_face_recognition` is written |
| `jarvis/face_reference` | lazily per resident card that has `hasReference` and no pinned snapshot; cached per norm name |
| `jarvis/camera_snapshot` | lazily per card with a `camera_entity` but neither pinned snapshot nor reference; cached per camera; and on "Snapshot now" |
| `jarvis/voices {action:"list"}` | `firstUpdated`; Refresh; after enroll/forget (response is the list); after a voice config write; and quietly on every new shell snapshot (`updated()` when `data` changed, not while a voice action or a recording is in flight; a failed quiet refetch keeps the last list) so the 20 s `current` readout stays live |
| `jarvis/biometrics {action:"status"}` | `firstUpdated`; Refresh; after the Wellbeing switch's `update_config` write |
| `auth/sign_path` | whenever an `<img>` is rendered with an unsigned `/api/` path (signPath caches) |

---

## 3. Layout

`<div class="jv-grid">` of `<jv-section>` cards. Desktop order (3-col grid above 1100 px):

1. **Household** — `jv-span-all` (gallery).
2. **Recently seen** — `jv-span-all` (gallery).
3. **Voices** — one column.
4. **Wellbeing Context** — one column.
5. **Face recognition options** — one column.

Narrow (≤ 600 px, one column) order: **Recently seen, Household, Voices, Wellbeing Context, Face
recognition options** — on a phone the reason to open this page is "who was that?" / "name this face";
roster maintenance comes second. Implement by rendering the cards in narrow order and using CSS `order` on
`:host(:not([narrow]))`, or by branching on `this.narrow`.

### 3.1 Card "Household" (`mdi:home-account`)

Header: heading `Household`, subheading `{n} residents` (`1 resident` singular) · `people who live here`.
Header actions slot: Refresh icon button (`mdi:refresh`, `aria-label` `Refresh`; disabled while any faces
fetch is in flight).

Card intro (`--jv-text-2`, collapsible on narrow behind a "What is this?" text button): the old
explanatory copy, split into the two strings in §7 ("Faces JARVIS recognizes …" and "A recognized face
that isn't a resident is a guest …").

**Add resident row**: `<ha-textfield>` (label `Add a resident by name`, Enter submits) + primary button
`Add resident`. Disabled while the add is pending; cleared on success. Empty/whitespace → no call.

**Gallery**: `<ul>` with `display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:
var(--jv-space-3)` (2 columns at 360 px). One **face card** (§3.6) per resident, in `residents` order,
with `relation: "resident"`, the freshest matching `recent` row (if any) for camera / confidence / age /
pinned snapshot, `hasReference`, and the resident controls.

Empty: `<jv-empty compact icon="mdi:account-plus-outline">` message `No residents yet. Add the people who
live here (or name a recognized face below); recognized residents then won't trigger intrusion alerts.`

### 3.2 Card "Recently seen" (`mdi:account-clock-outline`)

Header: heading `Recently seen`, subheading `guests & unknown faces`. Gallery of face cards for every
`recent` row with `is_resident === false`, in backend order (newest first):
`relation = row.relationship` (`guest` or `unknown`), `lowConf = row.is_low_confidence`, action
`Make resident` on guest rows (not on unknown rows), and the **Name this face** control on every row.

Footer line when `recognition_source` is non-empty: `Reading identities from: {source}` (source in
`--jv-font-code`) + `each snapshot is the frame captured when JARVIS recognized the face (falls back to
the live camera view until the next sighting).`

Empty: `<jv-empty compact icon="mdi:account-question-outline">` message `No guests or unknown faces seen
recently. When your backend names a face that isn't a resident, it appears here as a guest.`

### 3.3 Card "Voices" (`mdi:account-voice`) — marked `Experimental` with a `<jv-state-badge level="info" nodot>`

Top to bottom:

1. Switch `Identify speakers in-process` → `voice_recognition_local` (optimistic; checked =
   `local_enabled`). Help text under it: `Needs onnxruntime and a speaker model; see the voice
   recognition guide.` Changing it shows the info alert `Restart Home Assistant (or reload JARVIS) for
   the "JARVIS Speaker-ID" speech-to-text entity to appear or disappear.` (the STT tee is only registered
   at platform setup — `stt.async_setup_entry` — see Risk 11).
2. When `local_enabled`: two text fields, saved on blur / Enter when changed —
   `Delegate STT entity` (placeholder `e.g. stt.faster_whisper`, value `delegate_stt`) →
   `voice_recognition_delegate_stt`; `Model path` (placeholder `<config>/jarvis/models/speaker.onnx`,
   value `model_path`) → `voice_embedding_model_path`. Suggestions for the delegate: `hass.states` keys
   starting with `stt.` (a `<datalist>`).
3. Status row (`aria-live="polite"`): badge `Speaker-ID backend ready` (`level="ok"`) or `Backend not
   installed` (`level="warn"`) with the hint `add onnxruntime and a model to enable`; then `Speaking now:
   {name} · {score}%` plus `(guess)` when `!trusted`, or `Speaking now: —` when `current` is null.
4. Enrolled list (`<ul>`): one row per profile — name, `{count} samples` (`1 sample`), `updated`
   formatted with the HA locale as a relative time when `updated > 0`, and an icon button `Forget
   voiceprint` (`mdi:delete-outline`, destructive). Empty: `No enrolled voices yet. Record a short sample
   below to teach JARVIS a voice.`
5. Enrol row: text field `Name this voice…` (datalist = `residents` from the faces response), button
   `Record & enroll` (`mdi:microphone`), button `Identify` (`mdi:microphone-question`). Both buttons are
   **disabled when `!backend_available`** (tooltip `Install the speaker-ID backend first`) and while a
   recording/upload is in flight. While recording, the pressed button shows `Recording… {s}s` with a
   countdown (text, no spinner) and `aria-live` announces start/stop.
6. Footer copy: `Voiceprints are stored as embeddings, never audio. A match only identifies a resident
   above a confidence threshold; weaker matches are shown as a guess and never stand security alerts
   down.` + a text link `Thresholds are in Settings → Voice & Audio.` → `navigate("settings", "voice")`.

### 3.4 Card "Wellbeing Context" (`mdi:heart-pulse`)

Header: heading `Wellbeing Context`; header badge `On · {n} sensors` (`level="ok"`) / `Off`
(`level="neutral"`). Intro: `Lets JARVIS read a connected wearable (heart rate, sleep, steps) so it can
be quieter when you're resting.` **`Context only — not medical.`** `Off by default; health data stays
private.` Switch `Use wearable context` (checked = `enabled`, optimistic, rolled back on error). Body:

* `enabled === false` → `<jv-empty compact>` `Off — enable to let JARVIS use wearable context. Health
  readings are never diagnosed or alarmed on.` (do **not** list the discovered entities while off —
  parity, and it keeps health data off-screen until opted in).
* `enabled && entities.length === 0` → `No wearable entities found. Connect a wearable integration
  (Withings, Google Fit, Oura, etc.) to Home Assistant.`
* else a `<ul>` of `<jv-kv>` rows: label = kind with `_` → space (`heart rate`, `sleep state`; **not**
  translated — technical token), value = `{value} {unit}`; `title` / secondary = `name` and the entity id
  in `--jv-font-code`. Group rows by `kind` when more than one entity shares it.

### 3.5 Card "Face recognition options" (`mdi:face-recognition`)

* Switch `Best-effort face recognition` + `Experimental` badge → `llm_face_recognition` (optimistic;
  checked = `FacesResponse.llm_face_recognition`, pre-rendered from `data.config` before the first fetch).
  Help: `No dedicated face backend? With this on, JARVIS asks its own local vision model whether a camera
  frame matches a resident's reference photo (set one on each resident card). It's a rough guess —
  results are clearly marked LLM GUESS, and this never disables intrusion alerts. For reliable
  recognition, use Frigate's native face recognition instead.`
* `<jv-kv label="Recognition source" value=${recognition_source} mono>` (read-only here) + text link
  `Change in Settings → Cameras` → `navigate("settings", "cameras")`.
* Text link `Voice recognition setup guide` → `docs/voice-recognition.md` on GitHub (open in a new tab,
  `rel="noopener"`) — or omit if the scaffold has no external-link convention.

### 3.6 The face card (shared by 3.1 and 3.2; put it in `src/views/people/face-card.ts`)

```ts
interface FaceCardModel {
  name: string;                       // display; "Unknown" for unknown rows
  relation: "resident" | "guest" | "unknown";
  lowConf: boolean;                   // LLM GUESS badge replaces the relation badge
  cameraEntity: string;               // "" when none
  cameraLabel: string;                // friendly name or slug with spaces
  confidence: number;                 // 0..100
  ageSeconds: number | null;          // null = not seen / no timestamp (>= 1e8)
  snapshotUrl: string | null;         // unsigned /api/ path
  hasReference: boolean;              // resident cards only
  canCaptureFromSighting: boolean;    // resident with a sighting that has a camera_entity
  labelable: boolean;                 // Recently-seen cards: show "Name this face"
  actions: ("make_resident" | "remove_resident")[];
}
```

Visual: square thumbnail (`aspect-ratio: 1/1; object-fit: cover; border-radius: var(--jv-radius)`),
a `<jv-state-badge nodot>` overlaid bottom-left — `Resident` (`accent`), `Guest` (`info`), `Unknown`
(`neutral`), `LLM guess` (`warn`) when `lowConf` — the name (bold, `.jv-truncate` + `title`), a meta line
(`{cameraLabel} · {confidence}% · {age}`; confidence only when `relation !== "unknown" && !lowConf &&
confidence > 0`; age via `formatAge` below; resident with no sighting → `Not seen recently`), then the
controls.

Thumbnail source priority: (1) `snapshotUrl` → signed → `<img>`; (2) `hasReference` → `jarvis/face_reference`
data URL; (3) `cameraEntity` → `jarvis/camera_snapshot` data URL (cached per camera); (4) an avatar with
the first letter of the name (`--jv-surface-2` background, `--jv-text-2`). Render the `<img>` only once a
usable `src` exists; `@error` → fall to the next source, finally the avatar (and remember the failure so a
re-render does not retry a 404). The thumbnail is a `<button class="jv-tap">` (`aria-label` `Enlarge
{name}`) that opens the lightbox (§3.7). Reserve the square so the grid never jumps.

Controls (each a `.jv-btn text` or small `.jv-btn`, wrapping; 44 px hit boxes via `.jv-hit`):

* `labelable`: a row `<ha-textfield label="Name this face…" list="people-names">` + button `Label`
  (Enter submits). The `<datalist id="people-names">` holds `residents`.
* `make_resident` → button `Make resident`; `remove_resident` → text button `Remove` (danger).
* Resident reference controls: `Set photo` / `Change photo` (a `<label>` wrapping a hidden
  `<input type="file" accept="image/*">`), `From sighting` when `canCaptureFromSighting`, and a
  `Snapshot now` row (camera `<select>` + button) when at least one `camera.*` entity exists. When
  `hasReference`: text button `Remove photo` (new; destructive).

`formatAge(s)`: `null`/non-finite/`< 0`/`>= 1e8` → `""`; `< 60` → `{n}s ago`; `< 3600` → `{n}m ago`;
else `{n}h ago` (n rounded). Prefer HA's `relativeTime` when the shell exposes a formatter; otherwise these
three keys.

### 3.7 Lightbox

`<ha-dialog>` when defined, else a native `<dialog>` (full-width on narrow, focus trapped, Escape and a
Close button close it). Content: the card's current image at `max-height: 80vh; object-fit: contain`,
caption `{name} · {cameraLabel} · {age}`. Source = the `src` the card currently shows; if the card only
shows the avatar, try `jarvis/camera_snapshot` first and show `No snapshot to enlarge` as a toast if that
yields nothing. Re-sign a pinned URL if it is older than 240 s (signPath does this).

### 3.8 Client-side image preparation (new; required — see Risk 1)

Every image sent in `set_reference` (file upload, "From sighting", "Snapshot now") is first decoded into
an `<img>`/`createImageBitmap`, scaled so its longer edge is ≤ 1024 px, and re-encoded as JPEG quality
0.85 via a `<canvas>` (`toDataURL("image/jpeg", 0.85)`). Send the resulting data URL. Reject anything
that is not an image (`file.type` not starting with `image/`, or decode failure) with the toast
`That file is not an image`. The old panel sent raw files; a 6 MB phone photo exceeds the WebSocket
frame limit and silently drops the connection.

### 3.9 Microphone capture (new file `src/views/people/record-wav.ts`)

`recordWavBase64(seconds = 4, onTick?)`: feature-detect **at call time** (`navigator.mediaDevices?.getUserMedia`
and `window.AudioContext || webkitAudioContext`; throw `recording not supported in this browser` otherwise
— jsdom in the smoke test has neither, so nothing may touch them at render). `getUserMedia({audio:true})`
→ `AudioContext` → `MediaStreamSource` → capture Float32 frames for `seconds` (a `ScriptProcessorNode(4096,1,1)`
as the old panel did is acceptable; an `AudioWorklet` loaded from a Blob URL is nicer but optional) →
flatten → nearest-sample downsample to 16 000 Hz → 16-bit PCM → 44-byte RIFF/WAVE header (`fmt ` 16, PCM
1, mono, 16 kHz, byte rate 32 000, block align 2, 16 bits) → `"data:audio/wav;base64," + btoa(bytes)`.
Always stop every track and close the context in `finally`. Requires a **secure context** (HTTPS or
`localhost`); on a plain-HTTP LAN URL `navigator.mediaDevices` is undefined — show the error
`Microphone needs a secure (HTTPS) connection` when `window.isSecureContext === false`.

---

## 4. Actions

Toasts: `hass-notification` via a local `notify()` (same shape as `src/views/intrusion/shared.ts`; copy
it, do not import another view's file). Error toasts show `WsError.message`. Buttons are disabled while
their own call is pending; the faces gallery keeps the old rows visible during a refetch (set `loading` on
the `<jv-section>`).

| # | trigger | call | confirm? | success | failure |
|---|---|---|---|---|---|
| A1 | `Add resident` (button / Enter) | `jarvis/faces {action:"add_resident", name, limit:60}` | No | replace faces state from the response; clear field; toast `Added {name} as a resident` | toast; keep field value |
| A2 | `Make resident` on a guest card | `jarvis/faces {action:"add_resident", name, limit:60}` | No | replace state; toast as A1 | toast |
| A3 | `Remove` on a resident card | `jarvis/faces {action:"remove_resident", name, limit:60}` | **Yes** — `confirmDialog({heading: t("Remove {name} from the household?"), message: t("They will count as a guest again and their reference photo is deleted. Intrusion monitoring will no longer stand down for them."), confirmLabel: t("Remove"), destructive: true})` | replace state; drop cached reference; toast `Removed {name}` | toast |
| A4 | `Set photo` / `Change photo` file chosen | prepare image (§3.8) → `jarvis/faces {action:"set_reference", name, image, limit:60}` | **Yes when `hasReference`** — `confirmDialog({heading: t("Replace the reference photo for {name}?"), message: t("The current photo is overwritten."), confirmLabel: t("Replace")})`; no confirm for a first photo | replace state; drop cached reference for `name`; toast `Reference photo set for {name}` | toast (`reference_failed` message included); reset the file input |
| A5 | `From sighting` on a resident card | capture the card's current image (data URL as-is; a pinned frame via `fetch(signedUrl)` → blob → data URL; else `jarvis/camera_snapshot {entity_id}`) → §3.8 → `set_reference` | as A4 | toast `Reference photo set for {name} from this sighting` | toast `No snapshot available to assign` when nothing could be captured; otherwise the error message |
| A6 | `Snapshot now` (camera select + button) | `jarvis/camera_snapshot {entity_id}` → §3.8 → `set_reference` | as A4 | toast `Reference photo set for {name} from {camera}`; remember the camera in localStorage | `Pick a camera first` when the select is empty; `No frame from that camera` when `image` is null; else the error |
| A7 | `Label` on a Recently-seen card (button / Enter; name non-empty) | capture as A5 → §3.8 → `jarvis/faces {action:"set_reference", name, image, limit:60}` | **Yes when the typed name already has a reference** (`references.includes(norm(name))`) — same dialog as A4; otherwise none | replace state; clear the field; drop cached reference; toast `Reference photo set for {name} from this sighting`. If `name` is not a resident, the toast adds ` — add them to the household to stand intrusion down.` | as A5 |
| A8 | `Remove photo` (new) | `jarvis/faces {action:"remove_reference", name, limit:60}` | **Yes** — `confirmDialog({heading: t("Remove the reference photo for {name}?"), confirmLabel: t("Remove"), destructive: true})` | replace state; drop cache; toast `Reference photo removed` | toast |
| A9 | thumbnail click | none (lightbox) | No | — | toast `No snapshot to enlarge` |
| A10 | Refresh (Household header) | faces list + voices list + biometrics status | No | re-render | per-card error state |
| A11 | `Best-effort face recognition` switch | `jarvis/update_config {key:"llm_face_recognition", value:<bool>}` | No | optimistic; then faces list refetch; toast `Saved` | roll back; toast |
| A12 | `Identify speakers in-process` switch | `update_config {key:"voice_recognition_local", value:<bool>}` | No | optimistic; voices refetch; show the restart info alert (§3.3) | roll back; toast |
| A13 | Delegate STT / Model path blur or Enter (value changed) | `update_config {key:"voice_recognition_delegate_stt" \| "voice_embedding_model_path", value:<string>}` | No | toast `Saved`; voices refetch (updates `backend_available`) | toast; restore the saved value |
| A14 | `Record & enroll` | validate name (else toast `Name the voice first`); record 4 s (§3.9); `jarvis/voices {action:"enroll", name, audio}` | No | replace voices state from the response; clear name; toast `Enrolled {name} ({count} samples)` (count from the matching profile) | mic error → toast `Microphone unavailable — {message}`; empty clip → `No audio captured`; WS error → its message (`enroll_failed` text is user-readable) |
| A15 | `Identify` | record 4 s; `jarvis/voices {action:"identify", audio}` | No | `match?.name` → toast `Heard: {name} ({score}%)` + `, guess` when `!trusted`; else `No confident match`. Also render the result inline under the status row (`aria-live`) so it survives the toast | as A14 |
| A16 | `Forget voiceprint` | `jarvis/voices {action:"forget", name}` | **Yes** — `confirmDialog({heading: t("Forget the voiceprint for {name}?"), message: t("JARVIS will no longer recognize this voice until it is enrolled again."), confirmLabel: t("Forget"), destructive: true})` | replace state; toast `Forgot the voiceprint for {name}` | toast |
| A17 | `Use wearable context` switch | `jarvis/update_config {key:"biometrics_enabled", value:<bool>}`, then `jarvis/biometrics {action:"status"}` | No (opt-in toggle; the card text is the disclosure) | optimistic; replace biometrics state from the status response; toast `Wellbeing context on` / `Wellbeing context off`; `refresh()` | roll back; toast |
| A18 | `Thresholds are in Settings` / `Change in Settings → Cameras` links | `navigate("settings", "voice")` / `navigate("settings", "cameras")` | No | — | — |

Concurrency: one in-flight faces mutation at a time (queue or ignore clicks); per-card pending flags for
reference actions; a single recording at a time (both mic buttons disabled while one records).

---

## 5. States

| region | loading | empty | error | disabled |
|---|---|---|---|---|
| Household gallery | `<jv-section loading>` + 4 skeleton squares on first load; old cards stay during refetch | §3.1 empty copy | `<ha-alert alert-type="error">` `Could not load faces.` + `WsError.message` + Retry (`unknown_command` → `Faces need a newer JARVIS backend — restart Home Assistant after updating.`) | add row disabled while pending |
| Recently seen gallery | same skeleton | §3.2 empty copy | shares the faces error (one fetch) | — |
| Face card thumbnail | avatar with initial until a source resolves (no spinner) | avatar | `@error` → next source → avatar; never a broken-image icon | — |
| Face card controls | — | — | per-action toast | the acting control only |
| Voices card | skeleton rows | `No enrolled voices yet…` | `Could not load voices.` + message + Retry (`unknown_command` → `Voice ID needs a newer JARVIS backend.`) | Record/Identify disabled when `!backend_available` with the tooltip; config fields disabled while saving |
| Voices "Speaking now" | `—` | `—` | — | — |
| Recording | button text `Recording… {s}s`, `aria-live` | — | mic errors as toasts | the other mic button |
| Wellbeing card | skeleton | §3.4 copy per state | `Could not load wellbeing context.` + message + Retry | switch disabled while pending |
| Options card | switches reflect `data.config` (or defaults `false` / `"both"`) and are disabled until the faces fetch resolves | — | shares the faces error | — |
| No `hass` | render nothing | — | — | — |

Never show `undefined`, `NaN`, `[object Object]`, a server file path, or a raw base64 string.

---

## 6. Fixtures (`frontend/dev/fixtures/`)

`jarvis_faces.json`:

```json
{
  "recent": [
    {"name": "Sam", "camera_entity": "camera.front_door", "camera": "front_door", "confidence": 97.4, "age_seconds": 140,
     "is_unknown": false, "is_resident": true, "relationship": "resident",
     "snapshot_url": "/api/jarvis/snapshot/faces/sam.jpg", "is_low_confidence": false, "source": "recent_cache"},
    {"name": "Alex Rivera", "camera_entity": "camera.driveway", "camera": "driveway", "confidence": 88.0, "age_seconds": 2650,
     "is_unknown": false, "is_resident": false, "relationship": "guest",
     "snapshot_url": "/api/jarvis/snapshot/faces/alex_rivera.jpg", "is_low_confidence": false, "source": "frigate_sensor"},
    {"name": "Priya", "camera_entity": "camera.kitchen", "camera": "kitchen", "confidence": 61.0, "age_seconds": 400,
     "is_unknown": false, "is_resident": true, "relationship": "resident",
     "snapshot_url": null, "is_low_confidence": true, "source": "llm_guess"},
    {"name": "Unknown", "camera_entity": "camera.back_yard", "camera": "back_yard", "confidence": 0.0, "age_seconds": 75,
     "is_unknown": true, "is_resident": false, "relationship": "unknown",
     "snapshot_url": "/api/jarvis/snapshot/faces/unknown_back_yard.jpg", "is_low_confidence": false, "source": "best_effort_unknown"}
  ],
  "residents": ["Priya", "Sam"],
  "references": ["sam"],
  "llm_face_recognition": true,
  "recognition_source": "frigate"
}
```

`jarvis_face_reference.json`: `{"image": "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}`
(a 1×1 placeholder so the harness shows the reference path working; the backend always sends JPEG).

`jarvis_camera_snapshot.json`: `{"image": null}` (exercises the "no frame" branches; the smoke test only
needs no unsigned `/api/` src).

`jarvis_voices.json`:

```json
{
  "profiles": [{"name": "Sam", "count": 3, "updated": 1761600000.0}, {"name": "Priya", "count": 1, "updated": 1761500000.0}],
  "current": {"name": "Sam", "score": 81.2, "similarity": 0.8123, "count": 3, "trusted": true},
  "local_enabled": true,
  "delegate_stt": "stt.faster_whisper",
  "model_path": "",
  "backend_available": true
}
```

`jarvis_biometrics.json`:

```json
{
  "enabled": true,
  "found": 3,
  "entities": [
    {"kind": "heart_rate", "entity": "sensor.sam_watch_heart_rate", "value": "64", "unit": "bpm", "name": "Sam Watch Heart rate"},
    {"kind": "sleep_state", "entity": "binary_sensor.sam_watch_asleep", "value": "off", "unit": "", "name": "Sam Watch Asleep"},
    {"kind": "steps", "entity": "sensor.sam_watch_steps", "value": "4210", "unit": "steps", "name": "Sam Watch Steps"}
  ]
}
```

Mock limits: the harness returns the same fixture for every `action`, so an `identify` in the harness
answers with the list shape (no `match` → "No confident match"), mutations snap back on refetch, and the
pinned `snapshot_url`s 404 after signing (`?authSig=mock`) — the `@error` fallback chain is therefore
exercised for real. The mic buttons work in the harness only over `http://localhost` (secure context).

---

## 7. Strings

Every user-visible string is a `t()` key (English text). Checked against `custom_components/jarvis/frontend/i18n/de.json`
(✓ = exact key exists; ✗ = new, English until the translation pass). `{name}`, `{n}`, `{count}`, `{score}`,
`{camera}`, `{source}`, `{s}`, `{message}` are placeholders substituted after `t()`.

### Headings, labels, controls

| key | de.json | notes |
|---|---|---|
| `People` | ✗ | tab title (registry) |
| `Household` | ✓ `Haushalt` | card heading |
| `people who live here` | ✗ | subheading |
| `{n} residents` / `1 resident` | ✗ | subheading count |
| `Recently seen` | ✗ | card heading (old: "Recently Seen") |
| `guests & unknown faces` | ✗ | subheading |
| `Voices` | ✗ | card heading |
| `Wellbeing Context` | ✓ `Wohlbefinden-Kontext` | card heading |
| `Face recognition options` | ✗ | card heading |
| `Experimental` | ✗ | badge (old: "EXPERIMENTAL") |
| `Refresh` | ✗ | icon button label |
| `Add a resident by name` | ✗ | text field label |
| `Add resident` | ✗ | button (old: "+ Add resident") |
| `Make resident` | ✗ | guest card button (old: "+ Resident") |
| `Remove` | ✗ | resident card button / confirm label |
| `Set photo` / `Change photo` / `From sighting` / `Snapshot now` / `Remove photo` | ✗ | reference controls (old had "📷 " prefixes) |
| `Name this face…` | ✗ | field label |
| `Label` | ✗ | button |
| `Enlarge {name}` | ✗ | thumbnail aria-label |
| `Close` | ✗ | lightbox |
| `Resident` / `Guest` / `Unknown` / `LLM guess` | `Guest` ✓ `Gast`; others ✗ | badges (old: upper-case; use title case keys, style with CSS if desired) |
| `Not seen recently` | ✗ | meta |
| `{n}s ago` / `{n}m ago` / `{n}h ago` | ✗ | `formatAge` |
| `Camera to snapshot {name} from` | ✗ | select aria-label |
| `— camera —` | ✗ | select placeholder option |
| `Reading identities from: {source}` | ✗ | footer |
| `each snapshot is the frame captured when JARVIS recognized the face (falls back to the live camera view until the next sighting).` | ✗ | footer |
| `Identify speakers in-process` | ✗ | switch |
| `Needs onnxruntime and a speaker model; see the voice recognition guide.` | ✗ | help |
| `Restart Home Assistant (or reload JARVIS) for the "JARVIS Speaker-ID" speech-to-text entity to appear or disappear.` | ✗ | info alert |
| `Delegate STT entity` / `e.g. stt.faster_whisper` | ✗ | field + placeholder |
| `Model path` | ✗ | field (placeholder is the technical default path, not translated) |
| `Speaker-ID backend ready` / `Backend not installed` / `add onnxruntime and a model to enable` | ✗ | status |
| `Speaking now: {name} · {score}%` / `Speaking now: —` / `(guess)` | ✗ | status |
| `{count} samples` / `1 sample` | ✗ | profile row |
| `Forget voiceprint` | ✗ | icon button label |
| `Name this voice…` | ✗ | field |
| `Record & enroll` / `Identify` | ✗ | buttons (old had "🎤 ") |
| `Recording… {s}s` | ✗ | live button text |
| `Install the speaker-ID backend first` | ✗ | disabled tooltip |
| `Voiceprints are stored as embeddings, never audio. A match only identifies a resident above a confidence threshold; weaker matches are shown as a guess and never stand security alerts down.` | ✗ | footer |
| `Thresholds are in Settings → Voice & Audio.` | ✗ | link |
| `On · {n} sensors` / `Off` | ✗ | wellbeing badge |
| `Use wearable context` | ✗ | switch |
| `Lets JARVIS read a connected wearable (heart rate, sleep, steps) so it can be quieter when you're resting.` | ✗ (prefix `Lets JARVIS read a connected wearable` ✓ — use the full sentence as the key) | intro |
| `Context only — not medical.` / `Off by default; health data stays private.` | ✗ | intro |
| `Best-effort face recognition` | ✗ | switch |
| `No dedicated face backend? With this on, JARVIS asks its own local vision model whether a camera frame matches a resident's reference photo (set one on each resident card). It's a rough guess — results are clearly marked LLM GUESS, and this never disables intrusion alerts. For reliable recognition, use Frigate's native face recognition instead.` | ✗ | help |
| `Recognition source` | ✗ | kv label |
| `Change in Settings → Cameras` / `Voice recognition setup guide` / `What is this?` | ✗ | links |
| `Faces JARVIS recognizes from your vision backend — Frigate face recognition, or middleware like Double Take paired with external detectors such as CompreFace or DeepStack. JARVIS runs no face engine of its own; flag the people who live here as residents so it can tell a household member from a guest or an unknown face, and stand intrusion monitoring down when the person it sees is a resident.` | ✗ | intro 1 |
| `A recognized face that isn't a resident is a guest — the jarvis_face_recognized event carries that status (relationship: resident / guest / unknown) so your automations can treat household and visitors differently.` | ✗ | intro 2 (render `jarvis_face_recognized` / `relationship` in code font by splitting around them, or keep plain) |

### Empty / error states

| key | de.json |
|---|---|
| `No residents yet. Add the people who live here (or name a recognized face below); recognized residents then won't trigger intrusion alerts.` | ✗ |
| `No guests or unknown faces seen recently. When your backend names a face that isn't a resident, it appears here as a guest.` | ✗ |
| `No enrolled voices yet. Record a short sample below to teach JARVIS a voice.` | ✗ |
| `Off — enable to let JARVIS use wearable context. Health readings are never diagnosed or alarmed on.` | ✗ |
| `No wearable entities found. Connect a wearable integration (Withings, Google Fit, Oura, etc.) to Home Assistant.` | ✗ |
| `Could not load faces.` / `Could not load voices.` / `Could not load wellbeing context.` | ✗ |
| `Faces need a newer JARVIS backend — restart Home Assistant after updating.` / `Voice ID needs a newer JARVIS backend.` | ✗ |
| `Retry` | ✗ |
| `Loading...` | ✓ `Wird geladen...` (three dots, not the ellipsis character) |

### Confirm dialogs

| key | de.json |
|---|---|
| `Remove {name} from the household?` / `They will count as a guest again and their reference photo is deleted. Intrusion monitoring will no longer stand down for them.` | ✗ |
| `Replace the reference photo for {name}?` / `The current photo is overwritten.` / `Replace` | ✗ |
| `Remove the reference photo for {name}?` | ✗ |
| `Forget the voiceprint for {name}?` / `JARVIS will no longer recognize this voice until it is enrolled again.` / `Forget` | ✗ |
| `Cancel` | ✗ (jv-confirm supplies its own default) |

### Toasts

| key | de.json |
|---|---|
| `Added {name} as a resident` / `Removed {name}` | ✗ |
| `Reference photo set for {name}` / `Reference photo set for {name} from this sighting` / `Reference photo set for {name} from {camera}` / `Reference photo removed` | ✗ |
| ` — add them to the household to stand intrusion down.` | ✗ (suffix for A7) |
| `No snapshot available to assign` / `No snapshot to enlarge` / `Pick a camera first` / `No frame from that camera` / `That file is not an image` | ✗ |
| `Saved` | ✗ |
| `Name the voice first` / `Microphone unavailable — {message}` / `Microphone needs a secure (HTTPS) connection` / `No audio captured` / `recording not supported in this browser` | ✗ |
| `Enrolled {name} ({count} samples)` / `Heard: {name} ({score}%)` / `, guess` / `No confident match` / `Forgot the voiceprint for {name}` | ✗ |
| `Wellbeing context on` / `Wellbeing context off` | ✗ |

Not translated: entity ids, camera slugs, `recognition_source` values, biometric `kind` tokens, model
paths, numbers, the `jarvis_face_recognized` event name. Since Phase 3 every key is translated in all 22
language files (`frontend/i18n-missing.json`); the de.json column records the state before the port.

---

## 8. Out of scope

| feature | why |
|---|---|
| **Recording from a voice satellite / satellite picker** | The old Voices card recorded from the **browser microphone** (`getUserMedia`); it never had a satellite picker, and no backend command can pull audio from an `assist_satellite` entity — `jarvis/voices` only accepts an uploaded WAV. The satellite path is the hands-free one: the "JARVIS Speaker-ID" STT tee (`stt.py`) embeds every utterance that reaches the pipeline, and `jarvis_voice_enroll_candidate` (docs/voice-recognition.md, Step 3) labels it. The only satellite-related control in the old panel was `jarvis/voice_confirm_test` ("TEST SATELLITE AUDIO"), which belongs to Settings → Voice & Audio (settings.md §2.6) and is not voice biometrics. |
| Enrolling a voice by **uploading** a WAV file | Not in the old panel; trivial to add later (`<input type="file" accept="audio/wav">` → same `enroll` call) but unverified against real exports. |
| Per-profile sample management (list / delete individual samples) | `voice_roster` stores one running-mean centroid per person; there are no individual samples to show. |
| Threshold sliders for voice trust / guess / min samples | Catalogue keys in Settings (`voice_local_*`); link instead of duplicating. |
| `voice_recognition_source`, `identity_voice_fingerprint`, `voice_recognition_auto_enroll` (external speaker service) | Plain settings in Settings → Voice & Audio; this view shows in-process ID only (parity). |
| `biometric_entities` override editor | Settings → General's biometric map editor (nine kind → entity pickers, settings-tools.md §4.11; Settings › Home & Extras has a Wellbeing pointer card back to this view); the view shows what discovery found. |
| Listing discovered wearables while Wellbeing is **off** | Parity and privacy: the old panel hid them; keep health data off-screen until opted in. |
| Camera Watch tiles, camera rename/location, doorbell training | the Cameras view (cameras.md). |
| Deleting pinned recognition snapshots | No backend action exists (`_MAX_FACE_SNAPSHOTS` pruning only). |
| Editing the external `recognition_source` here | One place only (Settings → Cameras); the view shows it read-only with a link. |
| Unicode glyph prefixes ("◉", "⟳", "📷", "🎤", "✓", "✗") in button text | Replaced by `mdi:` icons; part of the HUD look. |
| Full-panel re-render after every config write | The Lit view updates from the echo / refetches its own card. |

---

## 9. Risks

1. **WebSocket frame size.** HA 2026.2.3's `websocket_api/http.py` sets no `max_msg_size`, so aiohttp's
   default **4 MiB per message** applies. The old panel sent raw file bytes as base64 (+33 %); a
   3 MB+ phone photo kills the socket (the frontend reconnects, the call rejects or hangs). §3.8's
   client-side downscale is mandatory, not a nicety. A 4 s 16 kHz WAV is ~128 KB and is safe.
2. **Missing-field fall-through.** `jarvis/faces` and `jarvis/voices` treat an action without its required
   fields as `list` and answer 200. The view must validate before sending and must not interpret a list
   response to `identify` as a match.
3. **`set_reference` has its own error code** (`reference_failed`) while the other actions never signal a
   per-action failure (a remove of a non-existent name is a silent no-op). Only `set_reference` and the
   `*_failed` wrappers can fail visibly.
4. **`age_seconds` of 1e9** marks Frigate-sensor rows (no timestamp); `formatAge` must hide ≥ 1e8 and the
   "freshest sighting" pick must treat them as oldest (they already sort last).
5. **Snapshot 404s are normal**: pinned frames are pruned at 60 files, `unknown_<camera>.jpg` is
   overwritten per camera, and the signature lasts 300 s. Always chain `@error` to the next source and
   never retry a failed URL within the same render cycle. Signed URLs come back as the same string from
   `signPath` for 240 s, so Lit will not re-create the `<img>` needlessly.
6. **Reading a pinned frame for enrolment** (A5/A7) depends on `fetch(signedUrl)` succeeding
   (same-origin, `authSig` in the query). Behind an ingress/proxy that strips query strings it fails →
   the camera_snapshot fallback must be in place.
7. **Normalisation mirror.** `references` are normalised server-side via `identity.normalize`; the
   client mirror only decides `Set photo` vs `Change photo` and whether A7 confirms. Never gate a write on
   it; on doubt, call `jarvis/face_reference` (null = no photo).
8. **Labelling does not add a resident.** A7 only stores a reference photo under the typed name; the LLM
   matcher and the intrusion stand-down only consider **residents**, so an unknown face named "Alex" stays
   a guest until "Make resident" / "Add resident". The A7 toast suffix says so; a one-tap follow-up could
   be added later.
9. **Two write paths for `biometrics_enabled`.** Resolved: `jarvis/biometrics enable|disable` now write
   through `config_apply.async_apply_many` like `jarvis/update_config`, so neither masks the other. The
   view uses `update_config` (one pipeline with Settings) and trusts the `enabled` returned by the
   following `jarvis/biometrics status`, which is what the backend acts on (`biometrics.is_enabled()`
   reads `jarvis_config.get`).
10. **Discovery heuristics are loose.** `biometrics._classify` walks the kinds in order and matches on
    keywords in `entity_id + friendly_name` *or* on the unit: `"sleep"` catches `binary_sensor.bedroom_sleep_mode`,
    `"stress"` and `"_hr"` are substrings, and **every sensor with unit `%` that matched no earlier keyword
    lands under `spo2`** (humidity and battery-level sensors included), every `bpm` sensor under
    `heart_rate`. Expect noisy `found` counts; always show the entity id so the user can add
    `biometric_entities` overrides, and never phrase the list as "your vitals".
11. **Toggling `voice_recognition_local` does not add/remove the STT tee at runtime**:
    `stt.async_setup_entry` only runs at platform setup and requires local on + a delegate + a ready
    backend. The info alert in §3.3 is the honest UX; the backend reload is out of this view's hands.
12. **`current` (Speaking now) is a 20 s window fed only by the STT tee.** Without the tee in the Assist
    pipeline it is always `—`; do not make the card look broken (the status row still shows the backend
    badge). The `updated()`-driven refetch keeps it live without a private poll.
13. **`backend_available` triggers a model load** (`_load_session`, once per process; a missing
    `onnxruntime` logs a warning the first time). Refetching the voices list is cheap afterwards but the
    very first call after a restart may take a second — keep the skeleton, no timeout shorter than HA's.
14. **Microphone capture needs a secure context** and `ScriptProcessorNode` is deprecated (still shipped
    by every browser). `AudioWorklet` requires a module URL — a Blob URL works inside the single bundle.
    Nothing in §3.9 may run at render time (jsdom smoke test).
15. **Privacy of the harness fixtures**: keep fixture names fictional; the `data:` reference image is a
    1×1 placeholder, never a real face.
16. **i18n**: `Guest`, `Household`, `Wellbeing Context`, `Loading...` exist; the old upper-case badge
    keys (`RESIDENT`, `GUEST`, `UNKNOWN`, `LLM GUESS`, `ENABLE`/`DISABLE`) are not reused — title-case
    keys with CSS styling. `Lets JARVIS read a connected wearable` exists only as a prefix; the full
    sentence is the new key.
17. **`jarvis/faces list` is admin-gated** (unlike most `status` reads); `tests/unit/test_ws_contract.py`
    pins that every `jarvis/*` literal in `frontend/src` is registered — all six commands here
    (`faces`, `face_reference`, `camera_snapshot`, `voices`, `biometrics`, `update_config`) are.
18. **`remove_resident` deletes the reference photo** server-side; the confirm text must say so and the
    client cache for that name must be dropped, or the card would show a stale photo after re-adding.
