# Native entities and a stock dashboard

From `10.0.0-fork.1` JARVIS is also an ordinary Home Assistant **device** with
ordinary entities. Everything the custom panel's Overview showed — observer state,
sleep, lockdown, mode, room occupancy, pending suggestions — is now a sensor,
switch, select, number, alarm panel or event entity you can put on any
dashboard, use in automations, expose to voice, and read from the history and
logbook. The panel itself becomes an **admin-only** workshop; household members
get stock entities instead.

This page lists what the integration creates, what each entity reads and what
writing to it does, the two security changes that came with it, how to import
the example dashboard, and what still lives only in the panel.

## The JARVIS device

Every entity attaches to one device:

| Field | Value |
| --- | --- |
| Name | **JARVIS** |
| Manufacturer | `jarvis-aio fork` |
| Model | `AI butler` |
| Software version | the integration version from `manifest.json` |
| Identifier | `(jarvis, <config entry id>)` |

Find it under **Settings → Devices & services → JARVIS → 1 device**. That page
is the authoritative list of entity ids on *your* install; the tables below give
the ids Home Assistant produces by default.

### How entity ids are formed

All entities use `has_entity_name = True`, so Home Assistant names each one
`JARVIS <entity name>` and derives the id as `<domain>.jarvis_<entity name>`
(lower-cased, spaces to underscores). The unique id is `<entry_id>_<key>`, so
renaming an entity or changing its id in the UI survives restarts and upgrades.

A fresh refresh of the data behind every entity happens at most every 20 s
while something is listening, and immediately (debounced ~2 s) when a light,
lock, cover, climate, sensor, binary sensor, person, device tracker or alarm
panel changes state, or when you change a setting, mode or lockdown from
anywhere (panel, entity, service call).

## Entities

### Binary sensors (read-only)

| Entity id | Reads | Notes |
| --- | --- | --- |
| `binary_sensor.jarvis_asleep` | the household **sleep** state (`ASLEEP`/`AWAKE`) | attribute: the reason JARVIS believes the house is asleep (quiet hours, bedroom-only motion, …) |
| `binary_sensor.jarvis_<area>_occupied` | whether JARVIS considers that **area active** right now | one per area JARVIS monitors; device class `occupancy`, so the stock **Area card** lights it up via `alert_classes: [occupancy]`. Attributes mirror the area row: lights on/total, temperature, humidity, last motion, capabilities |

### Sensors (read-only)

| Entity id | Reads | Notes |
| --- | --- | --- |
| `sensor.jarvis_observer` | observer status: `RUNNING`, `READY` or `DISABLED` | `READY` = enabled but idle (quiet hours / asleep); `DISABLED` = switched off |
| `sensor.jarvis_llm_providers` | `N READY` configured LLM providers, or `UNSET` | |
| `sensor.jarvis_broadcast` | `ONLINE` when a broadcast speaker group is configured, else `UNSET` | |
| `sensor.jarvis_notify` | `READY` when a notify service is configured, else `UNSET` | |
| `sensor.jarvis_satellites` | `available / total` voice satellites, or `NONE` | |
| `sensor.jarvis_suggestions` | the number of pending automation **suggestions** | attribute `items`: list of `{id, description, yaml, confidence, count, pattern_type, entities, why_headline, evidence}` — the example dashboard renders it with a Markdown card. Applying a suggestion is still a panel action |

Other snapshot blocks (dominant area, goals, knowledge statistics, doorbell
training, meta such as announcements today / estimated cost) are published on
the same device where a platform exposes them; check the device page for the
exact set on your version.

### Switches (read **and** write) — one per boolean setting

Each switch mirrors one setting from the panel's Settings tab. Turning it on or
off calls the same write path as the panel (`config_apply.async_apply`), so the
value is persisted to `/config/jarvis/config.json`, applied immediately, and
the panel and the entity never disagree.

| Setting key | Entity name | Category |
| --- | --- | --- |
| `observer_enabled` | Observer (`switch.jarvis_observer`) | learning — also starts/stops the observer |
| `cognition_enabled` | Cognition | learning |
| `announcements_enabled` | Proactive announcements | core |
| `announce_notify_only` | Announce to notifications only | core |
| `arrival_greeting_enabled` | Arrival greeting | core |
| `departure_alerts_enabled` | Departure alerts | core |
| `routine_alerts_enabled` | Routine alerts | core |
| `driving_mode_enabled` | Driving mode | core |
| `briefing_morning_enabled` | Morning briefing | core |
| `briefing_evening_enabled` | Evening briefing | core |
| `voice_confirm_enabled` | Voice confirmation | voice |
| `tts_use_ha_voice` | Use Home Assistant TTS voice | voice |
| `proximity_volume` | Proximity volume | voice |
| `continued_conversation_enabled` | Continued conversation | voice |
| `sentinel_enabled` | Sentinel | safety |
| `door_window_alerts_enabled` | Door/window alerts | safety |
| `intrusion_vision_confirm` | Intrusion vision confirm | safety |
| `intrusion_vision_veto` | Intrusion vision veto | safety |
| `hazard_monitor_enabled` | Hazard monitor | safety |
| `camera_auto_analyze` | Camera auto-analyze | cameras |
| `camera_auto_analyze_motion` | Camera auto-analyze motion | cameras |
| `package_detection` | Package detection | cameras |
| `light_control_enabled` | Dashboard light control | home |
| `operational_mode_auto` | Automatic operational mode | governance |

The entity id is `switch.jarvis_` + the entity name slug (for example
`switch.jarvis_proactive_announcements`); the unique id is `<entry_id>_<setting key>`.

### Selects (read and write)

| Entity id | Options | Writing |
| --- | --- | --- |
| `select.jarvis_mode` | `normal`, `party`, `lab`, `movie`, `guest`, `away`, `focus` | sets the operational **mode** (same as the panel's mode picker and `jarvis/mode` WS action), applies the mode's scene entry, and is logged. Attributes: `since`, `reason`, `description`, `overrides` |
| `select.jarvis_ui_language` | the panel languages (`auto`, …) | setting `ui_language` |
| `select.jarvis_output_language` | the output languages (blank = follow UI) | setting `output_language` |
| `select.jarvis_directive_preset` | the directive presets (default `guardian_steward`) | setting `directive_preset` |
| `select.jarvis_banter_level` | `0`, `1`, `2` | setting `banter_level` |
| `select.jarvis_voice_confirmation_mode` | `auto`, `native`, `gated` | setting `voice_confirm_mode` |
| `select.jarvis_camera_alert_level` | `off`, `urgent`, `important`, `all` | setting `camera_alert_level` |
| `select.jarvis_energy_agency` | `advisory`, `opt_in`, `autonomous` | setting `energy_agency` |

Setting selects write through `config_apply.async_apply` exactly like the switches.

### Numbers (read and write)

| Entity id | Range | Writing |
| --- | --- | --- |
| `number.jarvis_intrusion_response_timeout` | 30–900 s, step 30 (default 120) | setting `intrusion_response_timeout`: how long JARVIS waits for you to answer an "is this you?" check before treating a breach as confirmed |

Text-type settings (quiet-hours start/end, briefing times) have no text platform
yet and stay in the panel.

### Alarm control panel (read and write)

| Entity id | State | Writing |
| --- | --- | --- |
| `alarm_control_panel.jarvis_lockdown` | `armed_away` while **lockdown** is active, `disarmed` otherwise, `triggered` while an intrusion is active | **Arm (away)** engages lockdown (`cognitive_core.request_lockdown(True)` — locks every lock, closes open doors); **Disarm** lifts it. No code is required. Attributes: `since`, `reason`, `auto` (engaged automatically), `exempt_windows` |

This is the same lockdown the panel button and the `jarvis.lockdown` service
drive, so all three stay in step.

### Who can write to the entities

Home Assistant lets **every** user in its default *Users* group call entity
services; the frontend only hides what you hide. That is deliberate here: the
switches, selects, number and alarm panel above are the household's write
surface, the replacement for the admin-only panel, and a non-admin member can
turn Sentinel off, change the mode, or **disarm the lockdown without a code**
exactly as they could flip any light. If that is not what you want, Home
Assistant's own tools apply: put the member in the **read-only** group
(Settings → People → user → *Administrator* off, *Read only*… shown in
advanced mode), or simply keep those entities off the dashboards they see. The
WebSocket write commands the panel uses remain admin-only regardless.

### Event (read-only)

| Entity id | Fires on | Notes |
| --- | --- | --- |
| `event.jarvis_activity` | a JARVIS activity: announcements, mode changes, lockdown engaged/lifted, intrusion investigation steps, observer decisions | event type and a short message are in the attributes. Because it is an event entity, it shows up in the **Logbook** with no extra configuration — the example dashboard's logbook card lists it |

## Phase 0 changes that came with this

### The panel is admin-only

The sidebar panel is now registered with `require_admin=True`. Non-admin users
do not see it in the sidebar and cannot open `/jarvis`. The reason: the panel
exposes household data (face sightings, intrusion stills, documents, memory)
and controls paid LLM work. Household members get the entities above instead,
which honour Home Assistant's normal per-user dashboard visibility.

On the WebSocket side, every write command the panel uses is gated the same way:
commands that are admin-only in their entirety carry `@require_admin`
(config writes, lockdown, model listing, floor-plan writes, …), and mixed
read/write commands (`jarvis/mode`, `jarvis/mutes`, `jarvis/intrusion`,
`jarvis/energy`, `jarvis/hazard`, `jarvis/biometrics`, `jarvis/semantic_search`)
answer plain status reads for anyone but reply `unauthorized` to a non-admin
who tries the write actions. `jarvis/faces`, `jarvis/voices` and
`jarvis/documents` are admin-only in every action, reads included: they
enumerate biometric data (face frames, the voiceprint roster, on-demand
speaker identification) or document contents. Two open status reads are
redacted for non-admins: `jarvis/intrusion status` omits `last_snapshot` (the
server path, camera and snapshot URL of the latest still) and
`jarvis/semantic_search status` omits `base` and `model` (the internal
embedding endpoint). Stock cards therefore keep working for everyone;
changing JARVIS's behaviour needs an admin, or one of the writable entities
above (see *Who can write to the entities* below).

### Snapshots are served authenticated

Face-sighting frames and intrusion stills used to be written under
`<config>/www/jarvis/…` and handed out as `/local/jarvis/…` URLs. Home Assistant
serves `/local` **without authentication**, so anyone who could reach the HA
port could pull camera frames of the household. They now live outside the web
root at

```
<config>/jarvis/snapshots/faces/<name>.jpg
<config>/jarvis/snapshots/intrusion/<tag>_<camera>_<ts>.jpg
```

and are served only through

```
/api/jarvis/snapshot/faces/{filename}         admin only
/api/jarvis/snapshot/intrusion/{filename}     any authenticated user
```

Authentication is required for both; `faces` additionally requires an admin,
because pinned face frames are biometric images of other residents under a
guessable name (`<name>.jpg`, `unknown_<camera>.jpg`) and the `jarvis/faces`
commands are admin-only for the same reason. Intrusion stills stay open to
every logged-in user on purpose: JARVIS pushes them to every household phone,
and the companion app fetches the image with that member's own token. (The
notification carries the **relative** `/api/jarvis/snapshot/...` path — the
companion apps only attach the user's token to relative URLs.)

Filenames are restricted to a single safe path component ending in `.jpg`/`.jpeg`,
the file is read off the event loop, and the response is `Cache-Control: no-store`.
The panel asks the frontend for a signed URL before setting an `<img src>`; the
companion app fetches notification images with the user's own auth, so
`notify.mobile_app_*` attachments keep working.

Nothing is migrated. Frames already under `<config>/www/jarvis/{faces,intrusion}`
are left in place (and remain reachable at `/local/jarvis/...` until you delete
that directory). Pinned faces persisted with a `/local/` URL re-pin on their
next confident sighting.

### secrets.yaml is parsed once, not on every poll

Provider keys live in Home Assistant's `secrets.yaml`. Reads are now cached per
path on the file's modification time and size, so a hot path costs one
`os.stat()` instead of a YAML parse (the panel's data poll was re-parsing the
file up to five times a cycle). Editing or replacing the file invalidates the
cache on the next read; JARVIS's own narrow writes reset it explicitly.

## Importing the example dashboard

`examples/jarvis-dashboard.yaml` is a **sections**-view dashboard built from
stock cards only, so it follows your theme (light, dark or auto) with nothing to
install.

1. **Settings → Dashboards → Add dashboard → New dashboard from scratch.**
   Give it a title (for example *JARVIS*) and an icon.
2. Open the new dashboard, click the **pencil** (Edit), then the **three-dot
   menu → Raw configuration editor**.
3. Replace the contents with the file and **Save**.
4. Fix the user-specific parts:
   * **Rooms** — the file has two example Area cards (`kitchen`, `living_room`)
     plus a commented template; add one per room using your own area ids
     (Settings → Areas → open a room: the id is the last part of the URL).
   * **Temperature graph** — swap `sensor.kitchen_temperature` /
     `sensor.living_room_temperature` for your sensors.
   * If any `jarvis_*` id does not resolve, open the JARVIS device page and
     copy the id Home Assistant chose.

What is on it: badges for observer, mode and sleep; a Lockdown tile with
arm/disarm; an entities card of the status sensors; the logbook for
`event.jarvis_activity`, lockdown and mode (24 h); Area cards with occupancy
alerts and light toggles; a 24 h temperature history; a Markdown card listing
pending suggestions from `sensor.jarvis_suggestions`'s `items` attribute; and
buttons for `jarvis.briefing`, `jarvis.nap` (`duration_minutes: 30`) and
`jarvis.unshush` (with a confirmation).

**Chat is not a card.** Talk to JARVIS through Home Assistant's own **Assist**
dialog (chat bubble in the top bar, or press <kbd>A</kbd>) with the pipeline
whose conversation agent is JARVIS, or from any voice satellite on that pipeline.

## What stays panel-only (admins)

The panel remains the place for things that need rich UI or touch sensitive
data:

* **Floor-plan editor** and the 3D Residence view (room drawing, background
  import, SweetHome3D / vacuum-map import).
* **Faces and voices** — enrolling, forgetting and reviewing face and speaker
  identities, and their snapshot frames.
* **Documents** — uploading, indexing and searching the household document store.
* **Model pickers** — LLM provider keys and the per-tier provider/model
  assignments (Conversation, Classifier, Reasoning, Review); `jarvis/list_models`
  is admin-only by design.
* **Camera diagnostics** — coverage maps, test analyses, doorbell training
  backlog and review.
* Reviewing and **applying suggestions**, goals and knowledge; text settings
  (quiet hours, briefing times) and every non-exposed advanced setting.

Everything else — status, occupancy, sleep, mode, lockdown, the common
behaviour toggles, and the activity log — is a plain entity now.
