# Cameras view — specification (Phase 2 Lit panel)

Derived from the old panel (`git show 47bede5:custom_components/jarvis/frontend/jarvis-panel.js`):
the dashboard **Camera Watch** card (`_html()` ~L4623–4638, `_setupCameras / _renderCamSelector /
_camToken / _camSource / _camName / _renderCameraFeed` ~L7770–7912, `_runCamDiagnostics / _frameLuma /
_armCamWatchdog / _camFallback / _camJarvisFallback / _selectCam` ~L9587–9745, `_subscribeCameraEvents /
_onCamEvent` ~L9791–9828), the settings **Cameras** card (`_html()` ~L5562–5582, `_renderCameraSettings`
~L7914–7950, `_rerenderCameraSettings / _wireCameraSettings` ~L9483–9585), the **Doorbell Training** card
(`_html()` ~L5680–5688, `_renderDoorbellTraining / _dbTrainRow` ~L2919–2955, scan wiring ~L6500–6517),
the Diagnostics rows "Camera — analyze now" (~L5661–5665, wiring ~L6519–6540) and "Doorbell — run
diagnostics" (~L5650), the floor-plan editor's "Compute coverage" (~L7343–7358, `_renderCameras`
~L4103–4132); and from the backend: `custom_components/jarvis/websocket.py` (`_get_cameras`,
`ws_camera_snapshot`, `ws_camera_diagnostics`, `ws_rename_camera`, `ws_camera_location`,
`ws_compute_camera_coverage`, `ws_update_config`, the `config` block of `ws_get_panel_data`),
`panel_data.py` (`_get_camera_overrides`, `_get_camera_names`, `_get_doorbell_training`, `_get_runtime_json`),
`camera.py` (`display_name`, `merge_camera_name`, `resolve_camera_source`, `_disabled_cameras`,
`probe_camera`, `_get_best_image`, `_downscale_jpeg`, the `jarvis_camera_event` emitters), `outdoor.py`
(`is_outdoor`, `location_mode`, `set_entity_location`), `recognition.py` (`jarvis_face_recognized`,
`CONFIDENCE_THRESHOLD`, `_relationship_fields`), `doorbell_training.py` (`log_event`, `load_events`,
`stats`, `scan_backlog`), `camera_coverage.py` (`infer_coverage`), `__init__.py` (the `analyze_camera`,
`train_doorbell_backlog`, `diagnose_doorbell` service handlers) and `services.yaml`. The view agent does
**not** need to open the old panel; every contract it needs is here.

Route: `/jarvis/cameras` (panel `route.path === "/cameras"`); element `<jarvis-view-cameras>` in
`src/views/cameras.ts` (+ `src/views/cameras/*.ts`), extending `JarvisView` (`src/views/view-base.ts`:
`hass`, `narrow`, `data`, `route`, `subPath`, `refresh()`, `navigate(view, path)`, `ws<T>(type, payload)`).
Helpers: `signPath(hass, path, expires?)` and `WsError` (`src/ws.ts`), `t()` (`src/i18n.ts`), `haDefined()` /
`watchDefinitions()` (`src/ha.ts`), `jv-section`, `jv-empty`, `jv-kv`, `jv-state-badge`, `confirmDialog()`
(`src/components/`). Admin-only like the whole panel (`require_admin=True`; every command below is
`@websocket_api.require_admin`, pinned by `tests/unit/test_admin_gating.py`).

The view is **not yet in the registry**: `src/views/index.ts` (scaffold-owned) needs one import line and one
`VIEWS` entry — `{ key: "cameras", title: "Cameras", icon: "mdi:cctv", element: "jarvis-view-cameras" }` —
placed after `residence` and before `logs`. That is the only shared-file edit; see Risks R1.

---

## 1. Purpose

One page for everything camera-shaped that the old panel spread over three tabs:

* **watch** a camera live (the Camera Watch tile with its three-tier frame fallback chain), with the view
  jumping to the camera that just saw something (`jarvis_camera_event`, confident `jarvis_face_recognized`),
  a one-tap **DIAG** probe that explains *why* a tile is blank, and **Analyze now** (`jarvis.analyze_camera`)
  for an on-demand vision → reasoning pass on the selected camera;
* **choose and label** the cameras JARVIS may use: enable/disable (`disabled_cameras`), a JARVIS-only display
  name (`jarvis/rename_camera`), indoor/outdoor/auto designation (`jarvis/camera_location`), and read-only links
  into Settings › Cameras for the related catalogue keys (recognition source, confidence, alert level, …);
* **review the doorbell training dataset** (`data.doorbell_training`) and run a backlog scan
  (`jarvis.train_doorbell_backlog`).

Everything the Settings view already does for the catalogue keys stays there (settings-as-data); this view
links to it and never renders a generic config field itself.

---

## 2. Data

`ws()` rejects with `WsError {code, message}`. HA-level codes any call may produce: `unauthorized`,
`unknown_command` (backend older than the panel — the old tile special-cased this, see §2.3), `timeout`,
`no_connection` (raised locally when `hass` is missing). Backend-specific codes are listed per command.

### 2.1 `jarvis/get_panel_data` — snapshot fields this view reads

Arrives as the `data` property (`PanelData`, `null` until the first fetch; the shell refreshes it every
20 s while the tab is visible and on `refresh()`). The view never calls it itself. Fields used:

```ts
data.config.cameras: Camera[]                 // EVERY camera.* entity HA has, disabled ones included,
                                              // sorted by `name` (websocket._get_cameras); [] on any error
Camera = {
  entity_id: string;                          // "camera.front_door"
  name: string;                               // display name: camera_names[entity_id] (trimmed) if non-blank,
                                              // else HA friendly_name, else entity_id  (camera.display_name)
  raw_name: string;                           // HA friendly_name (what a blank custom name reverts to)
  enabled: boolean;                           // entity_id NOT in disabled_cameras
  outdoor: boolean;                           // resolved location (outdoor.is_outdoor: explicit lists →
                                              // HA area → name keywords; default indoor)
  location_mode: "auto" | "indoor" | "outdoor"; // exact-id pin in indoor_entities / outdoor_entities, else "auto"
}
data.config.camera_overrides: { [entity_id: string]: string }  // original → frame-source entity_id
                                              // (e.g. a go2rtc/Frigate restream twin of a Nest cam).
                                              // Read-only here: `camera_overrides` is NOT a panel-writable key.
data.config.camera_names: { [entity_id: string]: string }      // the JARVIS-only names map (what rename writes)
data.config.disabled_cameras: string[]        // _get_runtime_json(..., "disabled_cameras", []); tolerate
                                              // null (fixture) and a JSON string (pre-Phase-2 panels stored
                                              // JSON.stringify(list)) → treat both as [] / parse
// read-only values shown next to the Settings links (all also in jarvis/config_schema `values`):
data.config.recognition_source: "both" | "frigate" | "doubletake"   // default "both"
data.config.identity_min_confidence: number                         // default 0.45 (may arrive as a string)
data.config.camera_alert_level: "off" | "urgent" | "important" | "all"
data.config.camera_auto_analyze: boolean
data.config.camera_auto_analyze_motion: boolean
data.config.camera_motion_vision: boolean
data.config.package_detection: boolean
data.config.llm_face_recognition: boolean
data.config.vision_min_interval: number                              // seconds, 0 = off (may be a string)

data.doorbell_training: {
  stats: {
    total: number;                            // records in <config>/jarvis/doorbell_log.jsonl (ring of 5000)
    notable?: number;                         // records with notable === true
    by_category?: { [category: string]: number };   // "?" when a record has no category
    by_source?: { [image_source: string]: number }; // "live" | "event-media" | "backlog" | "?"
    first?: string | null;                    // ts of the oldest record
    last?: string | null;                     // ts of the newest record
  };
  recent: DoorbellEvent[];                    // the LAST 12 records, OLDEST FIRST (newest last) —
                                              // reverse for display
}
// On any backend exception the whole block is {stats: {total: 0}, recent: []} (no `notable`, no
// `by_source`): every optional field above must be defaulted.
DoorbellEvent = {
  ts: string;                                 // naive-UTC isoformat + "Z": "2026-10-29T13:47:02.123456Z"
                                              // (microseconds may be absent) — parse with new Date(ts)
  camera: string;                             // camera name as the analyser saw it (may equal entity_id)
  entity_id: string;                          // "camera.front_doorbell"
  image_source: "live" | "event-media" | "backlog" | string;
  summary: string;                            // one line; may be ""
  analysis: string;                           // full text; fallback when summary is ""
  category: string;                           // free text, e.g. "delivery", "visitor"; may be ""
  notable: boolean;
}
```

Not read from the snapshot: `data.config.floor_plan_cameras` (editor data, see §7).

### 2.2 `hass.states` — live camera entity state

For the selected camera **source** entity (§3.1 step 1) read `hass.states[src]`:

```ts
state: "idle" | "recording" | "streaming" | "unavailable" | "unknown" | string
attributes.friendly_name?: string
attributes.frontend_stream_type?: "hls" | "web_rtc" | string   // "web_rtc" ⇒ the MJPEG proxy will most
                                                              // likely hang (Nest), expect tier escalation
attributes.access_token?: string             // HA's camera token. NOT used for URLs in this view (the
                                             // smoke test requires every /api/ <img> to be SIGNED, §2.3)
attributes.entity_picture?: string           // "/api/camera_proxy/<id>?token=…" — not used, same reason
```

A camera that is in `data.config.cameras` but missing from `hass.states` (removed since the last 20 s
snapshot) renders as "Unavailable" and is never streamed. The reverse (new entity not yet in the snapshot)
appears after the next tick; do not merge `hass.states` into the list yourself.

### 2.3 Frame sources for the live tile (HA camera proxy + `jarvis/camera_snapshot`)

The tile shows the **source** entity's pixels under the **selected** entity's identity:

```ts
const ov = data.config.camera_overrides ?? {};
const src = ov[entity] && ov[entity] !== entity && hass.states?.[ov[entity]] ? ov[entity] : entity;
// mirrors camera.resolve_camera_source: the override is ignored when its target does not exist
```

An `<img>` cannot carry the bearer token, and the smoke test (`scripts/smoke.mjs`) fails on any `/api/`
image `src` without `authSig`, so **both proxy tiers go through `auth/sign_path`**:

| tier | URL | how | watchdog |
|---|---|---|---|
| 1 `stream` | `/api/camera_proxy_stream/<src>` | `img.src = await signPath(hass, path)` (300 s signature; validated once when the MJPEG request opens, the stream keeps running after expiry) | 6000 ms: escalate when the `<img>` has no decoded pixels (`naturalWidth === 0`) **or** its mean luma ≤ 10 (black stream — Nest MJPEG decodes a steady black frame) |
| 2 `still` | `/api/camera_proxy/<src>` | refreshed every 2000 ms. **Sign each refresh with the cache-buster inside the signed path** — `hass.callWS({type: "auth/sign_path", path: \`/api/camera_proxy/${src}?_=${Date.now()}\`, expires: 30})` → `img.src = res.path` — because HA signs the query parameters too (`async_sign_path` puts `params` in the JWT and `async_validate_signed_request` compares them; only `width`/`height` are exempt), so appending `&_=…` *after* signing 401s. Call `auth/sign_path` directly here, not `signPath()`, whose cache is keyed by the full path and would grow by one entry per refresh. | 5000 ms after the first still: same no-pixels / black test |
| 3 `jarvis` | `jarvis/camera_snapshot` (below) | `img.src = \`data:image/jpeg;base64,${image}\`` every 6000 ms | none — last tier |

Escalation triggers: the `<img>` `error` event (404/401/connection refused) or the watchdog. Tier 1 → 2 → 3.
A camera that reached tier 3 is remembered **per entity for the session** (`Map<entity, "jarvis">`): re-selecting
it skips tiers 1–2 (the old panel's `_camModeByEntity`). Changing the selected camera, the resolved source or a
re-sign clears the timers and restarts at tier 1 (or 3 when remembered). The luma test:

```ts
// mean luminance of the CURRENT frame via a 32×32 canvas; null = cannot sample (no pixels yet, no 2d
// context in jsdom, tainted canvas) — null gets the benefit of the doubt (treated as a real frame)
function frameLuma(img: HTMLImageElement): number | null
```

`auth/sign_path` request/response (HA core): `{type: "auth/sign_path", path: string, expires?: number}` →
`{path: string}` (the path with `?authSig=<jwt>`); fails with `unauthorized` / `unknown_error`. On failure
`signPath()` returns the raw path (the image then 401s and the chain escalates); the direct tier-2 call must
be wrapped the same way.

#### `jarvis/camera_snapshot` — tier 3 and the only frame source that always works for WebRTC-only Nest cams

```python
{ vol.Required("type"): "jarvis/camera_snapshot", vol.Required("entity_id"): str }
```

Pass the **selected** entity (the backend applies `camera_overrides` itself via `_get_best_image`). Walks the
camera-backend registry (Frigate snapshot / Nest event media), then the standard HA snapshot, then a stream
wake + retry; downscales to ≤ 960 px on the longest side.

Response: `{ image: string | null }` — base64 JPEG, or `null` when no tier produced a frame (the backend logs
`CAMERA  <entity> snapshot: no frame — …` at most once per 5 min per entity). Errors: `unknown_camera`
(message = the entity id; state missing or not `camera.*`), `snapshot_failed` (message = exception text). An
`unknown_command` code means HA was not restarted after updating the integration — the old tile printed a
dedicated hint for it (§6). May take several seconds (stream wake); never call it concurrently for the same
entity — skip a tick while the previous one is in flight.

### 2.4 `jarvis/camera_diagnostics` — the DIAG probe

```python
{ vol.Required("type"): "jarvis/camera_diagnostics", vol.Optional("entity_id"): str }
```

Always send `entity_id` = the selected camera (the platform summary alone is of little use). Up to **30 s**
(the backend wraps `probe_camera` in `asyncio.wait_for(…, 30)`); disable the button meanwhile.

```ts
{
  summary: { entity_id: string; state: string; platform: string | null }[];  // every camera.* entity in HA
  platforms: { [platform: string]: number };   // counts per entity-registry platform; "?" = unregistered
  probe: Probe | null;                         // null when no entity_id was sent
}
Probe = {
  entity_id: string;                           // the SOURCE entity when an override applied
  tiers: [string, string][];                   // ordered [tier, detail]; tier ∈ "override" | "backend-match" |
                                               // "backend:<name>" (e.g. "backend:nest", "backend:frigate") |
                                               // "snapshot" | "wake-retry"; detail is English prose from the
                                               // backend — a detail starting with "OK" means that tier worked
  verdict: string;                             // English prose, e.g. "frames available via standard snapshot",
                                               // "NO FRAME from any tier — check the camera's source integration."
  // present unless the probe timed out:
  override?: string;                           // the source entity, only when camera_overrides applied
  state?: string;                              // HA state or "MISSING"
  available?: boolean;                         // state exists and != "unavailable"
  attrs?: { brand: string | null; model: string | null; supported_features: number | null;
            frontend_stream_type: string };    // "" when unset
  platform?: string | null;
  elapsed_ms?: number;
}
// timeout shape (no state/attrs/platform/elapsed_ms):
// { entity_id, tiers: [], verdict: "probe timed out after 30s (stream wake hanging?)" }
```

Error: `camera_diag_failed`. Side effect: `jarvis_log("CAMERA", "diag <entity>: <verdict>")` — the verdict is
also visible on the Logs view (CAMERA category). The old UI added a client-side **TILE** line (current tier,
decoded `naturalWidth×naturalHeight`, luma and "BLACK STREAM" when ≤ 10) and a hint when `platforms` has no
`nest` key (§3.1). Tier/verdict text is backend English: show verbatim, never through `t()`.

### 2.5 `jarvis/rename_camera` — JARVIS-only display name

```python
{ vol.Required("type"): "jarvis/rename_camera",
  vol.Required("entity_id"): str,
  vol.Required("name"): vol.Any(str, None) }
```

A non-blank `name` is trimmed and stored in the `camera_names` map; blank, whitespace or `null` **removes**
the entry (reverts to the HA friendly name). HA's entity is untouched. Response:

```ts
{ ok: true; camera_names: { [entity_id: string]: string }; cameras: Camera[] }   // Camera as in §2.1,
                                                                                 // already re-sorted by name
```

Errors: `unknown_camera` (not `camera.*` or no state), `rename_failed`. Logs `CONFIG  camera <id> renamed to
'<name>' (JARVIS only)` / `… name reverted (JARVIS only)`. Patch `data.config.cameras` / `camera_names` from
the response and `refresh()`.

### 2.6 `jarvis/camera_location` — indoor / outdoor / auto

```python
{ vol.Required("type"): "jarvis/camera_location",
  vol.Required("entity_id"): str,
  vol.Required("mode"): vol.In(["auto", "indoor", "outdoor"]) }
```

Pins the lower-cased exact entity id into `indoor_entities` / `outdoor_entities` (and out of the other);
`auto` removes it from both so heuristics resume. Globs the user wrote by hand in those lists are preserved.
Governs the intrusion investigator, the notable-outdoor-event filter and the motion scan immediately.
Response: `{ ok: true; cameras: Camera[] }` (read the new `outdoor` for the "Auto (indoor)" label). Errors:
`unknown_camera`, `camera_location_failed`. Logs `CONFIG  camera <id> location → INDOOR|OUTDOOR|AUTO (heuristics)`.

### 2.7 `jarvis/update_config` — only for `disabled_cameras`

```python
{ vol.Required("type"): "jarvis/update_config",
  vol.Required("key"): str,
  vol.Required("value"): vol.Any(bool, str, int, float, list, dict, None) }
```

Send `{key: "disabled_cameras", value: string[]}` — a **real array** of the entity ids JARVIS must not use
(the old panel sent `JSON.stringify(list)`; both are accepted — `camera._disabled_cameras()` parses a JSON
string — but the array keeps `config_schema` values typed). Response `{ key: "disabled_cameras", value: <as
sent> }`. Errors: `invalid_key`, `no_entry` ("No JARVIS config entry found"), `no_data`, `update_failed`.
Semantics: no entries ⇒ every camera is used; all ids ⇒ none (event watch, cognition, package watch,
`active_camera_states` all honour it). Compute the new list from the **current** `data.config.cameras`:

* toggle one off: `[...disabled, entity_id]`; on: `disabled.filter(x => x !== entity_id)`;
* "Enable all": `[]`; "Disable all": `cameras.map(c => c.entity_id)`.

Then optimistically set `enabled` on the local list, `refresh()`, and roll back on error.

### 2.8 Services (`hass.callService`)

Registered schemas (from `__init__.py`, **not** `services.yaml`, which also documents `frames` / `interval`
that the live schema rejects — do not send them):

| service | data | behaviour |
|---|---|---|
| `jarvis.analyze_camera` | `{ entity_id: string (required, camera.*), announce?: boolean (default true), prompt?: string }` | one vision → reasoning → incorporate pass on the camera; result spoken when `announce` and written to the log (CAMERA / VISION). No return value; the WS `call_service` resolves when the analysis finished (several seconds). The old button sent `{entity_id, announce: true}`. Errors reject the promise with HA's `{code, message}`. |
| `jarvis.train_doorbell_backlog` | `{ limit?: number (vol.Coerce(int), default 40) }` — the UI clamps to 1..500 as `services.yaml` documents | walks the Nest doorbell's recorded event history and appends analysed events to the dataset. **Blocking**: the promise resolves only when the whole scan is done (can be minutes for a large limit). Result is logged: `CAMERA  Backlog training: analysed N doorbell event(s) into the dataset (of M found)` or `CAMERA  Backlog training: <reason>` (no Nest event-media manager, no images, …). Nothing is returned to the caller; call `refresh()` when the promise settles so `data.doorbell_training` updates. |
| `jarvis.diagnose_doorbell` (optional, §3.3) | `{}` | checks `automation.doorbell_motion_analysis` exists/enabled, active cameras, the `jarvis.analyze_on_event` service and TTS entities; fires the bus event `jarvis_doorbell_diag` `{checks: {check: string, ok: boolean, state?, detail?, cameras?: string[], entities?: string[]}[], verdict: string}` and logs it at INFO. Nothing returned. |

`hass.callService` may be undefined in a degraded `hass`: guard and show `t("Home Assistant connection not
available")` like the Overview view does.

### 2.9 Bus events — event auto-focus

Subscribe once in `connectedCallback` (when `hass.connection?.subscribeEvents` exists), unsubscribe in
`disconnectedCallback` (the harness's mock returns a no-op unsubscribe). Both events are fired by the
backend as HA bus events; `e.data` is:

```ts
// "jarvis_camera_event" (camera.py: Nest pubsub + Frigate MQTT event "new")
{ entity_id: string;                 // "camera.<frigate camera name lower-cased>" or the Nest camera entity
  source: "nest" | "frigate";
  label: string;                     // Frigate: object label ("person", "car", …); Nest: event type
                                     // ("camera_motion", "camera_person", "doorbell_chime", … or "motion")
  confidence: number | null }        // Frigate: 0–100 integer percent (round(score*100)); Nest: null

// "jarvis_face_recognized" (recognition.py: Double Take MQTT, Frigate sub_label, Frigate tracked_object_update)
{ camera: string;                    // Frigate/Double Take camera NAME ("front_door"), not an entity id
  camera_entity: string;             // "camera.front_door" or "" when it could not be resolved
  name: string;                      // "Chris" | "unknown" | "unknown person"
  confidence: number;                // 0–100 float percent
  is_unknown: boolean;
  is_confident: boolean;             // confidence >= 60 (recognition.CONFIDENCE_THRESHOLD)
  is_resident: boolean;
  relationship: "resident" | "guest" | "unknown";
  source?: "frigate" | "frigate_tracked_object" }   // absent on the Double Take path
```

Old behaviour to keep: a face event counts only when `is_confident && camera_entity`, mapped to
`{entity_id: camera_entity, label: name || "FACE", confidence: Math.round(confidence)}`. A focus event
selects that camera (even if it is not in the enabled list — the old panel appended `{entity_id, name:
entity_id}`; the new view should instead ignore events for cameras that are **disabled** or unknown, see
R10), shows the EVENT badge with `label` (+ ` {confidence}%` when not null), and after **25 s** reverts to the
camera the user picked. A new event restarts the 25 s. Unsubscribe and clear the timer on disconnect.

### 2.10 Fetch / refresh schedule

| data | when |
|---|---|
| snapshot (`cameras`, overrides, names, `doorbell_training`, config values) | shell poll (20 s) + `refresh()` after every mutation |
| tier-1 stream | on select / source change; re-attached when the shell replaces the `<img>` |
| tier-2 still | every 2 s while in tier 2 |
| `jarvis/camera_snapshot` | every 6 s while in tier 3 (skip while one is in flight) |
| `jarvis/camera_diagnostics` | on DIAG click only |
| events | live subscription |
| **document hidden** | pause the still / snapshot timers (`visibilitychange`), resume on visible — the old panel kept polling in the background |

---

## 3. Layout

Single column at < 1100 px (narrow and tablet), order = mobile priority: **Camera Watch**, **Cameras**,
**Doorbell Training**. At ≥ 1100 px Camera Watch spans the full width (max-width 960 px, centred is fine) and
Cameras + Doorbell Training sit side by side (`jv-grid` two columns). Everything is `<jv-section>` cards;
nothing scrolls horizontally at 360 px.

### 3.1 Card A — "Camera Watch" (`icon="mdi:cctv"`)

Header right: `<jv-state-badge>`: `level="ok" pulse` + "Live" (tier 1/2 with frames), `level="danger" pulse`
+ "Event" (focus active), `level="warn"` + "Snapshot" (tier 3), `level="neutral"` + "No signal" (tier 3 with
`image: null`), `level="neutral" nodot` + "Unavailable" (source state `unavailable` / missing).

1. **Camera picker** — a horizontally wrapping chip row (`role="radiogroup"`, each chip a `<button
   role="radio" aria-checked>`) of the **enabled** cameras (`enabled !== false`) in snapshot order; label =
   `name`. The selected chip uses `--jv-accent` (+ `--jv-on-accent` text); the event-focused chip carries a
   `--jv-danger` ring. Remember the explicit pick per browser in `localStorage["jarvis_active_cam"]`
   (try/catch; the old key, keep it) and restore it when it is still an enabled camera, else select the first.
   > 8 cameras: still chips, wrapping (no `<select>` — the picker must be tappable while the stream plays).
2. **Tile** — `aspect-ratio: 16/9`, `--jv-surface-2` background, `<img alt=t("Live view of {name}")>` filling
   it (`object-fit: contain`). Overlays, each a `--jv-neutral-soft`/`--jv-danger-soft` pill with text:
   top-left the entity id (`--jv-font-code`), top-right the EVENT pill `EVENT · {label}{ · n%}` while focused;
   centred placeholder text when there is nothing to show (§5). No vignette, no scanlines, no glyphs.
3. **Source strip** (one line under the tile, `--jv-text-2`, wraps on narrow): `Source {name} → {source
   tail}` when an override applies, else `Source {name}`; `Stream` / `Stills` / `JARVIS snapshot`
   for the tier; `Target {label} [{n}%]` while event-focused else `Streaming`.
4. **Action row**: `DIAG` (secondary button; toggles the diagnostics panel; disabled while probing),
   `Analyze now` (primary; §4), an `Announce result` switch (`ha-switch` / native checkbox) default on,
   and `Open in Settings` text link → `navigate("settings", "cameras")`.
5. **Diagnostics panel** (collapsible region below the strip, `--jv-font-code`, `aria-live="polite"`):
   * `Probing {entity}… may take up to 30 s (stream wake)` while loading;
   * `TILE` line: `mode={stream|still|jarvis}`, `decoded {w}×{h}` or "no decoded pixels", `lum {x.x}` with
     "BLACK STREAM (decodes fine, shows nothing)" when ≤ 10 — the client half of the story;
   * `HA CAMERAS` line: `platforms` as `nest×2  frigate×3  ?×1`, and when no key contains `nest`, the old
     hint "No nest-platform entities: the Google Nest integration isn't delivering cameras to HA. Fix that
     first (SDM credentials / integration setup); JARVIS can only consume what HA has." (`--jv-danger-text`);
   * probe header `{entity_id}  state={state}  platform={platform ?? "?"}  stream={frontend_stream_type}`
     (last only when non-empty); one line per tier `  {tier}: {detail}` coloured `--jv-ok-text` when detail
     starts with `OK`, else `--jv-danger-text`; verdict line in bold + ` ({elapsed_ms} ms)` when present;
   * footer "Tap DIAG again to close · the verdict is also in the Logs view" with a link to `logs`.
   * error: `<ha-alert alert-type="error">` with `WsError.message`; for `unknown_command` the message
     "Restart Home Assistant to load the updated integration, then refresh." (§6).

### 3.2 Card B — "Cameras" (`icon="mdi:camera-outline"`, subheading = "Names are JARVIS-only (HA untouched;
blank reverts). Location governs intrusion + outdoor-event filtering — AUTO shows what the heuristics resolve.")

1. **Header line**: `{n} of {total} cameras in use` (`aria-live`), right: `Enable all` / `Disable all`
   (secondary buttons; disabled when already in that state).
2. **Rows** (`<ul>`; one `<li>` per camera in snapshot order, disabled ones at `opacity` via
   `--jv-text-3` text, never hidden):
   * `ha-switch` (fallback native checkbox) labelled with the camera name (`aria-label` = `t("Use {name}")`),
     bound to `enabled`;
   * entity id in `--jv-font-code`, plus a small `→ {source}` pill when `camera_overrides[entity_id]` exists
     (title: "Frames come from this entity (camera_overrides)");
   * **Name** text field (`ha-textfield` / native `<input>`), value = `camera_names[entity_id] ?? ""`,
     placeholder = `raw_name || entity_id`, `aria-label` = `t("JARVIS name for {entity}")`. Save on Enter or
     blur **only when changed** (compare with the last saved value); Escape restores the saved value;
   * **Location** segmented control (`role="radiogroup"`, three `<button role="radio">`): `Auto ({indoor|
     outdoor})` (resolved from `outdoor`), `Indoor`, `Outdoor`; `aria-checked` from `location_mode`;
     disabled while saving that row.
   On narrow the row stacks: switch + id on the first line, the name field full width, the segmented
   control full width.
3. **Related settings** (a `<jv-kv>` list, each row a link via `navigate("settings", "cameras/<key>")`,
   which the Settings view scrolls to and highlights; value text from `data.config`, formatted with the
   Settings view's option labels so the two agree):

   | key | label | value rendering |
   |---|---|---|
   | `recognition_source` | Face recognition source | `both`→"Both (Double Take + Frigate)", `frigate`→"Frigate only (sub_label)", `doubletake`→"Double Take only" |
   | `identity_min_confidence` | Recognition confidence | number as given (`0.45`); "—" when null/NaN |
   | `camera_alert_level` | Camera alerts | `off`→"Off — observe only", `urgent`→"Urgent only (default)", `important`→"Important — + deliveries", `all`→"Everything notable" |
   | `camera_auto_analyze` | Camera Watch (inspect doorbell presses) | On / Off |
   | `camera_auto_analyze_motion` | Also inspect Frigate detections | On / Off |
   | `camera_motion_vision` | Motion sensor → camera vision | On / Off |
   | `package_detection` | Package detection | On / Off |
   | `llm_face_recognition` | LLM face recognition | On / Off |
   | `vision_min_interval` | Minimum seconds between automatic analyses | `{n} s`, `0`→"Off" |

   This list is the only per-key knowledge in the view; keys missing from `data.config` render "—" and still
   link.

### 3.3 Card C — "Doorbell Training" (`icon="mdi:doorbell-video"`, subheading = "Analysed doorbell events —
JARVIS's visitor training data. Each press is logged automatically; run a backlog scan to mine the Nest
recorded-event history into the dataset.")

1. **Controls row**: `Scan backlog` (primary; shows `Scanning…` with `disabled` until the service promise
   settles), a number field `Max events` (`min=1 max=500 step=1`, default 40, invalid/empty → 40) and,
   optionally, `Run doorbell diagnostics` (secondary; calls `jarvis.diagnose_doorbell`; if the view
   subscribes to `jarvis_doorbell_diag` it renders `verdict` and the `checks` as ok/fail lines, otherwise a
   toast "Doorbell diagnostics ran — see the Home Assistant log"). The optional button is **not required**
   for parity with this task's scope; include it only if cheap.
2. **Stats line** (`aria-live`): `{total} analysed · {notable} notable` and `by_source` as
   `live {n} · event-media {n} · backlog {n}` ("none yet" when empty); `first`/`last` as a muted
   "{first} – {last}" range when both exist (HA locale date formatting).
3. **Recent list** (`<ul>`, newest first = `recent.slice().reverse()`): per row the time (`ts` → HA locale
   short date-time, `--jv-font-code`), a source badge (`jv-state-badge nodot`, `live`→`ok`,
   `event-media`→`info`, `backlog`→`neutral`, other→`neutral`), the `category` as a small pill when
   non-empty, a `notable` marker (`--jv-warn` dot + "Notable" text — never colour alone), the text
   `summary || analysis` (wrap, `.jv-truncate` to 3 lines with the full text as `title`). Empty state §5.

---

## 4. Actions

| trigger | call | confirm? | feedback |
|---|---|---|---|
| chip tap | select camera; persist to `localStorage`; clear focus; restart chain | – | tile re-attaches; strip updates |
| `<img>` error / watchdog | escalate tier (§2.3) | – | badge + strip tier text; no toast |
| DIAG | `jarvis/camera_diagnostics {entity_id}` | – | panel opens with "Probing…", then lines; button disabled ≤ 30 s; second tap closes |
| Analyze now | `hass.callService("jarvis", "analyze_camera", {entity_id, announce})` | – | button `Analyzing…` + disabled until settled; success toast "Camera review ran — check Logs for the result" with a Logs link; error toast with the message. Refuse with "No camera selected" when nothing is selected. |
| enable switch | `jarvis/update_config {key: "disabled_cameras", value}` (§2.7) | – | optimistic; toast "Camera enabled"/"Camera disabled"; rollback + error toast; `refresh()` |
| Enable all / Disable all | same with `[]` / all ids | **Disable all** confirms (`confirmDialog`, not destructive): heading "Disable all cameras?", body "JARVIS will stop watching every camera — doorbell analysis, package detection and intrusion confirmation go blind until you enable one again." | toast "All cameras enabled"/"All cameras disabled" |
| name Enter / blur (changed) | `jarvis/rename_camera {entity_id, name}` (`""` → revert) | – | row shows saving → saved tick for 2 s; toast `Renamed to "{name}"` / "Name reverted"; error toast + restore field value |
| location segment | `jarvis/camera_location {entity_id, mode}` | – | row control disabled while saving; toast `{name} → {mode}` ("auto (indoor)" form for auto); patch `cameras` from the response; `refresh()` |
| related-settings row | `navigate("settings", "cameras/<key>")` | – | – |
| Scan backlog | `hass.callService("jarvis", "train_doorbell_backlog", {limit})` | – | toast "Scanning doorbell backlog (up to {limit})…" immediately; button `Scanning…`; when settled: toast "Backlog scan finished — see Logs for the report" + `refresh()`; the old panel also re-fetched 4 s later because the scan ran on — keep one extra `refresh()` 4 s after settle |
| Run doorbell diagnostics (optional) | `hass.callService("jarvis", "diagnose_doorbell", {})` | – | see §3.3 |
| bus event | select the event camera, EVENT badge, 25 s revert | – | optional toast `Event · {camera} — camera focused` (the old panel toasted; keep it quiet on narrow) |

Toasts: use whatever shared helper exists; otherwise the per-view fallback other views use (an
`aria-live="polite"` region at the end of the view). Errors always show the `WsError.message`.

---

## 5. States

| region | loading | empty | error | notes |
|---|---|---|---|---|
| whole view | `data === null` → three `<jv-section loading>` skeletons | – | shell shows the WS alert | – |
| Camera Watch | – | `cameras.length === 0` → `<jv-empty icon="mdi:cctv-off" heading=t("No camera entities in Home Assistant.") message=t("Add a camera integration (Nest, Frigate, UniFi, generic …) and it appears here.")>`; all disabled → `heading=t("All cameras are disabled")`, `message=t("Enable at least one camera below to watch it here.")` | tier-3 `unknown_command` → placeholder "JARVIS snapshot unavailable — restart Home Assistant to load the updated integration, then refresh."; other tier-3 error → "JARVIS snapshot error — {message}" (first 120 chars) | tile placeholders: "No camera selected" (nothing selected), "Connecting…" (tier 1 before the first frame), "No frame — camera idle or unreachable. For Nest: verify the Google Nest integration is loaded and events are enabled." (tier 3 `image: null`), "Unavailable in Home Assistant" (source state `unavailable`/missing) |
| DIAG panel | "Probing {entity}… may take up to 30 s (stream wake)" | – | `ha-alert` error with message; `unknown_command` hint | closes on second DIAG tap |
| Cameras | – | `<jv-empty>` "No camera entities in Home Assistant." | per-row inline error (`--jv-danger-text`) + toast | disabled rows stay visible |
| Doorbell Training | – | "No analysed doorbell events yet. Run a backlog scan, or wait for the next doorbell press." | service error toast | `stats.total` 0 shows "0 analysed · 0 notable · none yet" |

Never render `undefined`/`NaN`; every optional snapshot field is defaulted. Optimistic toggles roll back
on error. All timers (`stream` watchdog, still interval, snapshot interval, focus revert, saved-tick) and
the two event subscriptions are cleared in `disconnectedCallback`; a timer callback checks that the entity
it was armed for is still the selected one before acting.

---

## 6. Strings

Every user-visible string goes through `t()`. Keys already present in `custom_components/jarvis/frontend/i18n/*.json`
(verified in `de.json`): `"Camera Watch"` → "Kameraüberwachung", `"Cameras"` → "Kameras",
`"Enable all"` → "Alle aktivieren", `"Disable all"` → "Alle deaktivieren", `"Doorbell Training"` →
"Türklingel-Training", `"No camera entities in Home Assistant."` → "Keine Kamera-Entitäten in Home
Assistant.", `"Camera"`, `"Diagnostics"`, `"Doorbell — run diagnostics"`, `"Inspect doorbell presses
(vision + event-media)"`, `"Location governs intrusion + outdoor-event filtering"`. The old HUD keys
(`"NO CAMERA SELECTED"`, `"AUTO (indoor)"`, `"INDOOR"`, `"OUTDOOR"`, `"— no cameras —"`) are **not** reused —
the new UI is sentence case.

New English keys (translation pass later; placeholders in `{braces}`):

```
Cameras
Camera Watch
Live
Event
Snapshot
No signal
Unavailable
Live view of {name}
No camera selected
Connecting…
No frame — camera idle or unreachable. For Nest: verify the Google Nest integration is loaded and events are enabled.
Unavailable in Home Assistant
JARVIS snapshot unavailable — restart Home Assistant to load the updated integration, then refresh.
JARVIS snapshot error — {message}
Source
Stream
Stills
JARVIS snapshot
Target
Streaming
EVENT · {label}
DIAG
Probe this camera's frame sources end-to-end
Analyze now
Analyzing…
Announce result
Open in Settings
Probing {entity}… may take up to 30 s (stream wake)
Tile
decoded {width}×{height}
no decoded pixels
BLACK STREAM (decodes fine, shows nothing)
HA cameras
No nest-platform entities: the Google Nest integration isn't delivering cameras to HA. Fix that first (SDM credentials / integration setup); JARVIS can only consume what HA has.
Tap DIAG again to close · the verdict is also in the Logs view
Restart Home Assistant to load the updated integration, then refresh.
Camera review ran — check Logs for the result
No camera selected
Names are JARVIS-only (HA untouched; blank reverts). Location governs intrusion + outdoor-event filtering — AUTO shows what the heuristics resolve.
{n} of {total} cameras in use
Use {name}
Frames come from this entity (camera_overrides)
JARVIS name for {entity}
Name
Location
Auto ({resolved})
Indoor
Outdoor
indoor
outdoor
Camera enabled
Camera disabled
All cameras enabled
All cameras disabled
Disable all cameras?
JARVIS will stop watching every camera — doorbell analysis, package detection and intrusion confirmation go blind until you enable one again.
Renamed to "{name}"
Name reverted
{name} → {mode}
auto ({resolved})
Related settings
Face recognition source
Recognition confidence
Camera alerts
Camera Watch (inspect doorbell presses)
Also inspect Frigate detections
Motion sensor → camera vision
Package detection
LLM face recognition
Minimum seconds between automatic analyses
Both (Double Take + Frigate)
Frigate only (sub_label)
Double Take only
Off — observe only
Urgent only (default)
Important — + deliveries
Everything notable
On
Off
{n} s
Analysed doorbell events — JARVIS's visitor training data. Each press is logged automatically; run a backlog scan to mine the Nest recorded-event history into the dataset.
Scan backlog
Scanning…
Max events
Run doorbell diagnostics
Doorbell diagnostics ran — see the Home Assistant log
{total} analysed · {notable} notable
none yet
Notable
No analysed doorbell events yet. Run a backlog scan, or wait for the next doorbell press.
Scanning doorbell backlog (up to {limit})…
Backlog scan finished — see Logs for the report
Event · {camera} — camera focused
All cameras are disabled
Enable at least one camera below to watch it here.
Add a camera integration (Nest, Frigate, UniFi, generic …) and it appears here.
Home Assistant connection not available
```

Not translated (technical / backend prose): entity ids, platform names, tier names and details, verdicts,
`image_source` values, categories, summaries, timestamps, numbers.

---

## 7. Out of scope (dropped to Phase 3 or elsewhere)

| old feature | where it was | why not here |
|---|---|---|
| **Camera coverage** — `jarvis/compute_camera_coverage` | Settings › Floor Plan editor, "Compute coverage" button: for each placed camera on the current floor the client computed geometric candidates (`_computeCoverage` ray-casts the camera's FOV cone against the plan's walls/openings) and sent `{type: "jarvis/compute_camera_coverage", camera: {entity: string, room: string, fov: number (deg, default 90), range_ft: number, indoor: boolean, candidates: {[room: string]: number /*0..1 fraction in view*/}, openings: string[]}}` → `{covered: string[] /*rooms the LLM/geometry confirms*/, reason: string, source: "llm" \| "geometry", ts: number /*epoch s*/}` (error `coverage_failed`; `candidates` empty ⇒ `{covered: [], reason: "Nothing in view.", source: "geometry"}`), stored the result as `coverage` on the camera entry and saved everything with `jarvis/update_config {key: "floor_plan_cameras", value: JSON string}` (`{[floor: string]: {id, x, y, angle, fov, range, entity, indoor, coverage?}[]}`). | The candidates come from the plan geometry, i.e. the editor the Residence spec (§8) deferred to Phase 3; without the editor there is no input to send. Not used anywhere else by the old panel. A read-only "sees: …" line per camera from `data.config.floor_plan_cameras[*][].coverage` is a possible Phase 3 nicety. |
| Faces card snapshots (`jarvis/camera_snapshot` for face thumbnails, "Snapshot now" reference photos, `jarvis/faces`, `jarvis/face_reference`) | Memory › Household Faces | the Faces feature is Phase 3 (docs/panel.md); this view only uses `camera_snapshot` for the tile |
| Diagnostics card's other service buttons (`jarvis.test_tts`, `observer_status`, `briefing`, `test_notify`, `test_routing`) | Settings › Diagnostics | not camera-related; Phase 3 per settings.md §7 |
| Camera placement / FOV cones on the floor plan | Floor Plan editor | editor feature (residence.md §8) |
| Catalogue keys (`camera_auto_analyze`, `camera_alert_level`, `recognition_source`, `identity_min_confidence`, `disabled_cameras` as a list editor, `indoor_entities`, `outdoor_entities`, …) as editable fields | Settings cards | Settings view owns every catalogue key; this view links (§3.2.3) and only writes `disabled_cameras` through the per-camera switches |
| `access_token`-based proxy URLs (`?token=`) | old tile | the smoke test and the design rule require signed `/api/` paths; `auth/sign_path` replaces them |
| HUD chrome: `◉ LIVE`, `◱`, upper-cased 18-char chip labels, vignette, scanlines, `TARGET … [87%]` monospace strip styling, chip text `— no cameras —` | old tile | design mandate |
| Realtime `state_changed`-driven refresh | dashboard | the Overview view does it; this view relies on the 20 s snapshot and the two camera events |

---

## 8. Risks / ambiguities

* **R1 — registry edit.** `src/views/index.ts` is scaffold-owned; adding the view is a two-line change
  (import + `VIEWS` entry) and the only acceptable shared edit. The smoke test asserts `tabs.length >= 7`
  and unique keys, so an eighth tab passes; the bottom nav already handles "icon-only except current" below
  520 px, but eight items at 360 px (≈45 px each) should be eyeballed in the harness. `tests/unit/test_ws_contract.py`
  requires every `jarvis/…` literal in `frontend/src` to be a registered command — all five used here are.
* **R2 — signed query parameters.** HA signs the query string (`async_sign_path` stores `params` in the JWT;
  only `width`/`height` are exempt). A cache-buster appended *after* signing invalidates the signature (401
  → the chain would wrongly escalate to tier 3 for every camera). Put `?_=<ts>` inside the path you sign
  (§2.3) and verify in a real HA that tier 2 refreshes. If HA ever rejects unknown params outright, fall
  back to the `width` param (`?width=<w>` varies the URL and is exempt).
* **R3 — MJPEG under jsdom / harness.** The harness never loads images; the 6 s watchdog fires after the
  smoke test moved on, and `canvas.getContext` returns `null` there (luma `null` ⇒ no escalation). Timers must
  be cleared on disconnect or jsdom reports open handles; never let a timer callback throw.
* **R4 — fixture mismatch.** `dev/fixtures/panel_data.json` (shared) has `config.cameras[]` without
  `enabled`, a `location_mode: "manual"` that does not exist, `camera_overrides: {"camera.kitchen": "indoor"}`
  (the value must be a camera entity id), `disabled_cameras: null` and `doorbell_training.recent: []`. Tolerate
  all of it (treat missing `enabled` as `true`, unknown `location_mode` as `"auto"`, an override whose target
  is not in `hass.states` as none) and add minimal realistic values (one disabled camera, `camera_overrides:
  {"camera.front_door": "camera.front_door_restream"}` only if that entity is also added to `mock-hass.ts`
  states — otherwise leave overrides empty, two `recent` events). `mock-hass.ts` has only
  `camera.front_door` in `states`; the other two fixture cameras will show "Unavailable in Home Assistant" in
  the harness, which is the correct behaviour, not a bug. Add `jarvis_camera_snapshot.json` (`{"image": null}`
  — a base64 JPEG would bloat the fixture; `null` exercises the "No frame" state) and
  `jarvis_camera_diagnostics.json` (a realistic `{summary, platforms, probe}` with a `nest` platform and
  mixed OK/failed tiers).
* **R5 — `train_doorbell_backlog` is blocking.** `hass.callService` resolves only when the scan ends
  (minutes for `limit` 500). Keep the button disabled with `Scanning…`, never queue a second call, and do not
  show a spinner that spins (DESIGN §5). HA may surface a WS timeout for very long calls — treat a rejection
  with code `timeout` as "still running" (toast "Scan still running — the dataset updates when it finishes").
* **R6 — `analyze_camera` schema.** The registered voluptuous schema accepts only `entity_id`, `prompt`,
  `announce`; `services.yaml` documents `frames`/`interval` which the live schema **rejects** (extra keys).
  Send only `{entity_id, announce}`.
* **R7 — probe timeout shape.** On the 30 s timeout `probe` lacks `state`, `attrs`, `platform`,
  `elapsed_ms`; `verdict` is still present. Default every field.
* **R8 — confidence scales.** `jarvis_camera_event.confidence` is an integer percent or `null`;
  `jarvis_face_recognized.confidence` is a float percent (threshold 60). Round for display; show no `%` when
  null.
* **R9 — `disabled_cameras` typing.** Older installs may hold `disabled_cameras` as a JSON string in
  `runtime_config`; `_get_runtime_json` parses strings, so the snapshot normally yields an array, but a
  defensive `Array.isArray(v) ? v : (typeof v === "string" ? JSON.parse(v) : [])` costs nothing.
* **R10 — events for disabled/unknown cameras.** The old tile appended unknown entities to its list and
  focused them even when disabled. With `disabled_cameras` being the user's explicit "do not use", the new
  view should ignore focus events for disabled cameras and for entity ids not in the snapshot (the backend
  does not emit events for disabled cameras today — `active_camera_states` gates them — so this only
  matters right after a toggle).
* **R11 — snapshot staleness after rename/location.** The 20 s snapshot can briefly revert a rename or
  location change if the shell poll races the write; patch `data.config.cameras` from the command response
  (both return the fresh list) and call `refresh()`, as the old panel did.
* **R12 — `name` vs `camera_names`.** `Camera.name` already applies the custom name; the text field's
  *value* must come from `camera_names[entity_id]` (so it is empty when no custom name is set) and its
  *placeholder* from `raw_name`. Confusing the two writes the HA name into the map on the first blur.
* **R13 — an eighth bottom-nav item** also pushes the Settings tab further right on phones; if the scaffold
  owner prefers, `cameras` could sit after `logs` — the spec places it before `logs` only to keep operational
  views together. Either order is fine for this view.
* **R14 — Logs link.** "check Logs for the result" uses `navigate("logs")`; the Logs view's CAMERA category
  chip is data-driven, so there is no sub-path to pass.
