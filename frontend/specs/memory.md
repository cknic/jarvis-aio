# Memory view — specification

Derived from the OLD panel's `memory` tab (`custom_components/jarvis/frontend/jarvis-panel.js`:
markup at `_html()` ~line 5776, helpers `_fetchKnowledge/_renderKnowledgeList/_teachKnowledge/
_forgetKnowledge/_fetchPersonRoutines/_renderPersonRoutines/_fetchBriefings/_renderBriefings`
~lines 1508-1690, wiring ~lines 6112 and 6182-6194) and the backend handlers in
`custom_components/jarvis/websocket.py`, `knowledge.py`, `person_patterns.py`, `database.py`.
The view agent should be able to implement this view from this document alone.

Route: `/jarvis/memory` (tab id `memory`, tab label **Memory**). Admin-only like the whole panel.
Implementation: `<jarvis-view-memory>` (`src/views/memory.ts`, with `src/views/memory/format.ts`,
`styles.ts`, `types.ts`).

---

## 1. Purpose

Show the user what JARVIS "remembers" and let them curate it:

1. **Knowledge** — the durable, curated facts and preferences JARVIS recalls in conversation
   (SQLite `knowledge.db`, one value per `(subject, key)`). The user can **teach** a new fact
   (or overwrite an existing key) and **forget** any fact.
2. **Person routines** — read-only list of habits the pattern analyzer has attributed to one
   specific person (from sole-occupant activity), grouped by person.
3. **Recent briefings** — read-only, full text of the last briefings JARVIS delivered (phone
   notifications truncate long ones; this is where the user reads the whole thing).

Everything on this view is backed by three read commands and two write commands (below).
The old tab used **no** `hass.callService` and wrote **no** setting via `jarvis/update_config`.
It also did **not** read anything from `jarvis/get_panel_data` (see §2.6 for the two
snapshot fields that exist but were not used).

---

## 2. Data

All commands are registered in `websocket.py::async_register` and decorated
`@websocket_api.require_admin` + `@websocket_api.async_response`. On failure every handler calls
`connection.send_error(msg["id"], <code>, str(exc))`, which `hass.callWS()` surfaces as a rejected
promise whose value is an object `{code: string, message: string}` (NOT an `Error` — see Risks); the
view calls through `this.ws()` (`src/ws.ts`), which normalises that into a `WsError {code, message}`.

Type conventions below: `number(epoch)` = seconds since the Unix epoch as a float (Python
`time.time()`), `string(iso-naive-utc)` = ISO-8601 with microseconds and **no** timezone suffix,
produced in UTC (e.g. `"2026-10-29T06:30:12.123456"`).

### 2.1 `jarvis/get_knowledge` — list facts

Request (voluptuous):
```python
{
    vol.Required("type"): "jarvis/get_knowledge",
    vol.Optional("subject"): str,     # filter to one subject; the old panel never sent it
}
```
Frontend sends exactly: `{ type: "jarvis/get_knowledge" }`.

Response (`send_result`):
```ts
{
  facts: Fact[];          // knowledge.all_facts(subject) — ALL non-deleted, non-expired facts,
                          // sorted by updated_at DESC (newest first)
  stats: KnowledgeStats;  // knowledge.stats()
}

interface Fact {
  id: number;                     // INTEGER PK — use for forget (sent back as fact_id)
  kind: "fact" | "preference" | "event" | "profile";
  subject: string;                // "household" (default) | "primary" | any normalized person id
                                  // such as "sam_smith" (identity.normalize: lower-case, spaces→"_")
  key: string;                    // the "what" (e.g. "trash day"); unique per subject
  value: string;                  // the "is" (e.g. "Tuesday")
  source: "stated" | "observed" | "inferred";
  confidence: number;             // 0..1, rounded to 3 dp (1.0 for user-stated facts)
  salience: number;               // 0..1, rounded to 3 dp — not shown by the old panel
  created_at: number;             // epoch seconds (float)
  updated_at: number;             // epoch seconds (float)
  last_referenced: number | null; // epoch seconds or null
  expires_at: number | null;      // epoch seconds or null; expired facts are already filtered out
}

interface KnowledgeStats {
  total: number;                          // count of live facts
  by_kind: Record<string, number>;        // e.g. {"fact": 12, "preference": 3}
  by_subject: Record<string, number>;     // e.g. {"household": 10, "primary": 5}
}
```
Error code: `"knowledge_failed"`.
Fetched: once when the view is entered/connected. Not polled. The old panel re-rendered this
list only from the `facts` array returned by teach/forget (no re-fetch after a mutation).

### 2.2 `jarvis/add_knowledge` — teach a fact (upsert)

Request:
```python
{
    vol.Required("type"): "jarvis/add_knowledge",
    vol.Required("key"): str,
    vol.Required("value"): str,
    vol.Optional("subject"): str,   # default server-side: "household" (knowledge.DEFAULT_SUBJECT)
    vol.Optional("kind"): str,      # default server-side: "fact"; anything outside
                                    # ("fact","preference","event","profile") is coerced to "fact"
}
```
Frontend sends exactly what the old panel sent:
```js
{ type: "jarvis/add_knowledge", key, value, subject,
  kind: subject === "primary" ? "preference" : "fact" }
```
where `key`/`value` are the trimmed input values and `subject` is `"household"` or `"primary"`
(the two options of the subject select). Server side calls
`knowledge.remember(key, value, subject=..., kind=..., source="stated")`:
- strips `key`/`value`; if either is empty after stripping it returns `None` → response `ok: false`;
- upserts on `(subject, key)`: re-teaching an existing key updates its value in place
  (and a `stated` write overrides a previously observed/inferred one and un-tombstones a
  previously forgotten fact);
- `confidence` and `salience` are set to 1.0, `expires_at` to null.

Response:
```ts
{
  ok: boolean;     // bool(stored fact) — false when the store rejected it (empty after strip,
                   // DB unavailable). In that case `facts` is still the current full list.
  facts: Fact[];   // knowledge.all_facts() — full list, all subjects, newest first
}
```
Error code: `"add_failed"`.

### 2.3 `jarvis/forget_knowledge` — soft-delete a fact

Request:
```python
{
    vol.Required("type"): "jarvis/forget_knowledge",
    vol.Optional("fact_id"): int,   # the Fact.id — NOTE the name: "id" is reserved by the HA WS
                                    # protocol (message sequence number) and would be overwritten
    vol.Optional("subject"): str,   # alternative addressing by (subject, key) — unused by the panel
    vol.Optional("key"): str,
}
```
Frontend sends exactly: `{ type: "jarvis/forget_knowledge", fact_id: <number> }`.

**Hard constraint**: `tests/unit/test_ws_id_field.py::test_forget_button_sends_fact_id` reads the
BUILT bundle `custom_components/jarvis/frontend/jarvis-panel.js`, finds the first occurrence of
the literal `jarvis/forget_knowledge` and asserts that the text up to the next `}` contains
`fact_id`. So the call must be written as a single flat object literal with the string literal
`"jarvis/forget_knowledge"` first and `fact_id` as a sibling key before any `}`:
```js
await hass.callWS({ type: "jarvis/forget_knowledge", fact_id: id });
```
Do not build the type string dynamically, do not nest an object between `type` and `fact_id`.

Server: `knowledge.forget(fact_id=..., subject=..., key=...)` sets `deleted_at` (tombstone) on
matching rows with `deleted_at IS NULL`; returns `cur.rowcount`.

Response:
```ts
{
  removed: number;   // rows tombstoned: 1 normally, 0 if the id was unknown or already deleted
  facts: Fact[];     // full current list, all subjects, newest first
}
```
Error code: `"forget_failed"`.

### 2.4 `jarvis/get_person_routines` — per-person learned routines

Request:
```python
{ vol.Required("type"): "jarvis/get_person_routines" }
```

Response (`websocket._get_person_routines()` → `pattern_analyzer.get_person_patterns()` →
`person_patterns.read()`; the helper never raises and returns `{}` on any internal error):
```ts
{
  routines: Record<string, PersonRoutine[]>;   // keyed by normalized person id
                                               // ("sam", "sam_smith"); rows whose person is ""
                                               // are dropped server-side
}

interface PersonRoutine {
  id: number | null;          // person_patterns.id
  pattern_type: string;       // observed values written by the analyzer: "time_routine",
                              // "repeated_command", "sequence", "numeric_trigger",
                              // "confirm_sequence", "presence" — treat as a free string, "" if missing
  description: string;        // human sentence, e.g. "Sam usually starts the coffee around 06:40"
  confidence: number;         // 0..1, rounded to 2 dp (0 when missing)
  occurrences: number;        // int, default 0 when missing (old panel printed "?" for falsy)
  last_seen: string;          // ISO-8601 LOCAL server time without zone (datetime.now().isoformat()),
                              // or "" — the old panel did not show it
}
```
Within each person the DB returns rows ordered `confidence DESC`; the dict is keyed in
`ORDER BY person` order (JSON object key order is not guaranteed — sort person keys client-side as
the old panel did).
Error code: `"person_routines_failed"` (only if the executor job itself fails — practically never;
an empty `{}` is the normal "nothing learned / DB missing" answer).
Fetched: once on view enter, in parallel with 2.1 and 2.5. Not polled.

### 2.5 `jarvis/briefings` — recent briefings, full text

Request:
```python
{
    vol.Required("type"): "jarvis/briefings",
    vol.Optional("limit", default=10): int,   # clamped server-side to 1..50
}
```
Frontend sends: `{ type: "jarvis/briefings", limit: 10 }` (old value; keep 10).

Server: `database.get_recent_messages(hours=24*30, device_id="briefing", limit=limit)` (rows of
the `conversations` table tagged `device_id="briefing"`, oldest first, last 30 days), strips the
`"[Briefing] "` content prefix, then reverses so the result is **newest first**.

Response:
```ts
{
  briefings: Array<{
    text: string;              // full briefing text, prefix removed; may contain newlines
    timestamp: string | null;  // conversations.timestamp: ISO-8601 naive UTC
                               // (datetime.now(timezone.utc).replace(tzinfo=None).isoformat()),
                               // e.g. "2026-10-29T06:30:12.123456" — NO "Z". Append "Z" before
                               // new Date() unless it already ends in Z or ±hh:mm (old `when()`).
  }>;
}
```
Error code: `"briefings_failed"`.
Fetched: once on view enter. Not polled. Because of the 30-day window the list can legitimately
be empty on a healthy install.

### 2.6 `jarvis/get_panel_data` fields that exist but the old memory tab did NOT use

- Top-level `knowledge: KnowledgeStats` (`panel_data._get_knowledge_stats()` → `knowledge.stats()`,
  shape as in 2.1; `{total:0, by_kind:{}, by_subject:{}}` on error). Could be used for a tab-bar
  badge; the view itself must use `get_knowledge`.
- `config.memory_stats: {backend: "none"|"pgvector"|"chromadb"|"fts5"|"unavailable", total_memories: number}`
  — conversational long-term memory stats, shown in the old **Settings** tab (Stored Memories /
  Backend), not on Memory. Leave to the settings spec.

### 2.7 Commands that exist but are out of scope for this view

- `jarvis/search_memory` `{type, query: str (required), k?: int = 5}` → `{results: any[]}` —
  searches conversational memory. Registered but **never called by the old panel**. Not part of
  this view; since Phase 3 the Documents view's "Conversation memory" card
  (`<jarvis-docs-memory>`, `k: 8`) uses it (documents.md).
- `jarvis/semantic_search` `{type, action: "status"|"enable"|"disable"|"test"}` and
  `jarvis/documents` `{type, action: "status"|"ingest"|"search"|"upload"|"scan_watch"|"delete", query?, filename?, content?}`
  — these powered the **Document Library** card (with its "Search engine: KEYWORD (FTS) /
  SEMANTIC (Ollama)" toggle) in the old **Settings** tab, not the Memory tab. Since Phase 3 they
  live in the Documents view (documents.md); because the old Memory tab never contained them, this
  view shows **no** note for them.

### 2.8 Services / settings

- `hass.callService`: none.
- `jarvis/update_config` keys written: none. (The `memory_threading_enabled/_hours/_max`
  settings are Settings → Learning, not this view.)

---

## 3. Layout

Three cards. The old panel stacked them in one column in this order; keep the order.

Desktop (≥ ~1024 px): optional two-column arrangement — **Knowledge** card in the left/wider
column (~60%), **Person routines** above **Recent briefings** in the right column. Narrow/mobile:
single column, Knowledge first. Follow HA theme variables (card background, primary/secondary
text, divider, primary color for accents, error color) — no literal colours.

### 3.1 Card "What JARVIS Knows" (primary on mobile)

- Header: title **What JARVIS Knows**; right-aligned badge with the fact count: `"{n} facts"`
  (singular `"1 fact"`). Before the first load the old panel showed `"— FACTS"`; show an empty
  or skeleton badge instead.
- Subtitle (secondary text): *Durable facts & preferences JARVIS recalls in conversation. Teach it
  something, or forget anything with ✕.*
- **Teach row** (form): text input *what* (placeholder `what  (e.g. trash day)`), text input *is*
  (placeholder `is  (e.g. Tuesday)`), select **subject** with options **Household** (`household`,
  default) and **About me** (`primary`), button **Teach**. Inputs have `autocomplete="off"`.
  Desktop: one wrapping flex row (inputs flex `1 1 160px`, select fixed ~130 px, button auto).
  Mobile: inputs stack full-width, select + button on one row (or button full width).
- **Fact list**, grouped by `subject`:
  - Group order: `household` first, then the rest alphabetically (old behaviour).
  - Group heading label: `household` → **Household**, `primary` → **About me**; any other subject
    (a normalized person id like `sam_smith`) → replace `_` with space and Title-Case
    (old showed it upper-cased; sentence/title case is fine in the new design).
  - Each fact row: small caption = `key`; main text = `value`; trailing markers:
    - hedge marker `~` (tooltip `"{source} · {pct}% sure"`, pct = `Math.round(confidence*100)`)
      when `source !== "stated" || confidence < 0.9`;
    - hourglass `⌛` (tooltip `expires`) when `expires_at` is non-null;
    - icon button **✕** (`aria-label="Forget"`, tooltip **Forget this**) at the row end.
  - Rows are sorted as received (newest `updated_at` first within the group).
  - Not shown by the old panel and still optional: `kind`, `salience`, `created_at`,
    `last_referenced`. If shown, format epoch seconds via `new Date(sec*1000)`.

### 3.2 Card "Person Routines"

- Header: title **Person Routines**; right badge **Learned** (old: `LEARNED`).
- Subtitle: *Habits JARVIS has confidently attributed to one person, from 30 days of sole-occupant
  activity — separate from household-wide facts above.*
- Body: groups per person (person keys sorted alphabetically); group heading = person id with
  `_`→space, Title-Case (e.g. `sam_smith` → "Sam Smith").
  Within a group items sorted by `confidence` desc. Each item: `description` as the main line;
  meta line with a confidence bar (width = pct) and text `"{pct}% · ×{occurrences}"` where
  `occurrences` falls back to `"?"` when falsy. `last_seen` optional (see Risks before showing it
  as an absolute time).
- Read-only: no actions.

### 3.3 Card "Recent Briefings"

- Header: title **Recent Briefings**; right badge **Full text** (old: `FULL TEXT`).
- Subtitle: *The full briefings JARVIS delivered — read here when a phone notification truncated a
  long one.*
- Body: list newest first (as returned). Each item: timestamp line =
  `new Date(ts ends with Z or ±hh:mm ? ts : ts + "Z").toLocaleString()` (empty string if `ts` is
  null/unparseable); the first item appends `" · latest"` and is visually emphasised (accent
  colour on the timestamp). Text rendered with `white-space: pre-wrap`, never as HTML.
- Read-only.

---

## 4. Actions

| Action | Trigger | Command | Confirmation | Feedback |
|---|---|---|---|---|
| Teach | **Teach** button click, or Enter in either text input | `jarvis/add_knowledge` (§2.2) | none | see below |
| Forget | **✕** button on a fact row | `jarvis/forget_knowledge` `{fact_id}` (§2.3) | none in the old panel (soft delete; re-teaching the same key revives it). **Superseded by DESIGN.md §8**, which lists forget among the destructive actions that confirm with `confirmDialog({destructive: true})`: the view asks "Forget this fact?" with the fact as the message and **Forget** as the confirm label. | see below |
| Load / reload | view enter; **Retry** button in a card's error state | the three read commands (§2.1, §2.4, §2.5) in parallel | — | per-card loading/error states |

**Teach — details**
- Client validation: trim both inputs; if either is empty do nothing (old) → new: keep the Teach
  button disabled until both are non-empty, and ignore Enter while invalid.
- While pending: disable the Teach button and inputs (prevent double submit).
- Success (`ok === true`): replace the fact list with `res.facts`, update the count badge, clear
  both text inputs (keep the subject selection), return focus to the *what* input. No toast; a
  brief inline confirmation `Got it - JARVIS will remember that.` (`role="status"`) is shown.
- `ok === false` (store rejected it): keep the inputs, show an inline error under the form:
  *Couldn't save that fact.* Still replace the list with `res.facts` if present.
- Rejected promise: keep the inputs, show inline error *Couldn't save that fact — {message}*
  (`err?.message || String(err)`).

**Forget — details**
- While pending: disable that row's ✕ (and optionally dim the row). Do not remove optimistically
  (the old panel waited for the response).
- Success: replace the list with `res.facts` (this also handles `removed === 0`, i.e. the fact
  was already gone — the list simply no longer contains it).
- Rejected promise: leave the list unchanged, show a toast/inline error
  *Couldn't forget that — {message}*.

**No auto-refresh.** The old panel explicitly suppressed its 5-second live re-render while on this
tab so the half-typed teach form and scroll position were not wiped. The new view must likewise
not re-render the teach form from polling; the three read commands run on view enter (and on
Retry) only.

---

## 5. States

Each of the three cards keeps its own `loading / loaded / error` state; a failure in one must not
blank the others.

| Card | Loading | Empty | Error | Disabled |
|---|---|---|---|---|
| Knowledge | list area shows *Loading...* (or 3 skeleton rows); badge blank; teach form usable | *Nothing yet. Say "remember that…" to JARVIS, or teach it above.* | *Couldn't load memory — {message}* + **Retry** | Teach button disabled when either input is blank or a teach is pending; a row's ✕ disabled while its forget is pending |
| Person routines | *Loading...* | *Nothing person-specific learned yet — JARVIS needs a few weeks of sole-occupant data before routines are confidently individual.* | *Couldn't load routines — {message}* + **Retry** | — |
| Briefings | *Loading...* | *No briefings yet — they appear here once JARVIS has delivered one.* | *Couldn't load briefings — {message}* + **Retry** | — |

- "Empty" is only shown after a successful load (old panel tracked `_knowledgeLoaded`,
  `_personRoutinesLoaded`, `_briefingsLoaded` to distinguish "not loaded yet" from "loaded, empty").
- `hass` not yet available: render the shell with loading states; fetch when `hass` arrives.
- Non-admin: not reachable (panel is `require_admin`), no special handling.
- Unknown subject / person keys never produce an error; they get the humanized fallback label.

---

## 6. Strings

Pass every user-visible string through `t()`. Keys are the exact English strings. Existing
translations were checked in `custom_components/jarvis/frontend/i18n/de.json`, `fr.json`,
`es.json`, `nl.json` (337 keys each, identical key sets). Only the rows marked **yes** already
have translations; the rest fall back to English until the i18n files are extended (keep the
English text exactly as below so future entries match).

| English key (exact) | Where | In i18n files? |
|---|---|---|
| `Memory` | tab label | yes (de "Gedächtnis", fr "Mémoire", es "Memoria", nl "Geheugen") |
| `What JARVIS Knows` | card title | yes (de "Was JARVIS weiß") |
| `Person Routines` | card title | yes (de "Personen-Routinen") |
| `Recent Briefings` | card title | no |
| `Household` | subject option + group label | yes (de "Haushalt") |
| `About me` | subject option + group label | yes (de "Über mich") |
| `Loading...` | all three loading states — use three ASCII dots, NOT the `…` character the old tab used, so the existing entry matches | yes (de "Wird geladen...") |
| `Teach` | button (old: `TEACH`, untranslated) | no |
| `Learned` | routines badge (old: `LEARNED`) | no |
| `Full text` | briefings badge (old: `FULL TEXT`) | no |
| `fact` / `facts` | count badge, composed as `${n} ${t(n === 1 ? "fact" : "facts")}` | no |
| `what  (e.g. trash day)` | placeholder (two spaces after "what", as in the old panel) | no |
| `is  (e.g. Tuesday)` | placeholder (two spaces after "is") | no |
| `Durable facts & preferences JARVIS recalls in conversation. Teach it something, or forget anything with ✕.` | knowledge subtitle | no |
| `Habits JARVIS has confidently attributed to one person, from 30 days of sole-occupant activity — separate from household-wide facts above.` | routines subtitle | no |
| `The full briefings JARVIS delivered — read here when a phone notification truncated a long one.` | briefings subtitle | no |
| `Nothing yet. Say "remember that…" to JARVIS, or teach it above.` | knowledge empty | no |
| `Nothing person-specific learned yet — JARVIS needs a few weeks of sole-occupant data before routines are confidently individual.` | routines empty | no |
| `No briefings yet — they appear here once JARVIS has delivered one.` | briefings empty | no |
| `Couldn't load memory` | knowledge error prefix (render as `${t("Couldn't load memory")} — ${message}`) | no |
| `Couldn't load routines` | routines error prefix | no |
| `Couldn't load briefings` | briefings error prefix | no |
| `Couldn't save that fact` | teach failure (append ` — ${message}` when there is one) | no |
| `Couldn't forget that` | forget failure | no |
| `Retry` | error-state button (new) | no |
| `Subject` | label of the subject select | no |
| `Got it - JARVIS will remember that.` | inline teach confirmation (ASCII hyphen) | no |
| `Forget this` | ✕ tooltip | no |
| `Forget` | ✕ aria-label, and the confirm button of the forget dialog | no |
| `Forget this fact?` | heading of the forget confirmation (DESIGN.md §8) | no |
| `expires` | hourglass tooltip | no |
| `sure` | hedge tooltip, composed `${source} · ${pct}% ${t("sure")}` | no |
| `latest` | first briefing suffix, composed `${when} · ${t("latest")}` | no |
| `stated` / `observed` / `inferred` | source names inside the hedge tooltip (optional to translate) | no |

Technical values (`subject` ids, person ids, `pattern_type`, numbers, timestamps) are never
translated. Since Phase 3 every key is translated in all 22 language files
(`frontend/i18n-missing.json`); the last column records the state before the port.

---

## 7. Dropped to Phase 3

Nothing that was on the old Memory tab is being dropped — all three cards and both write actions
are ported. For the record, the related features the scope brief mentions that were **not** on
this tab:

- **Document library** (`jarvis/documents`) — lived in Settings → "Document Library"; ported in
  Phase 3 to the Documents view. No note here because the old Memory tab never showed it.
- **Semantic search status / enable / disable / test** (`jarvis/semantic_search`) — the
  "Search engine" block inside that same Settings card; ported with the document library.
- **Conversational memory search** (`jarvis/search_memory`) — backend exists, old panel never
  exposed it; not added to this view (the Documents view's "Conversation memory" card added it).
- Backend capabilities the old UI never surfaced and this view does not add: `get_knowledge`
  subject filter, forget by `(subject, key)`, teaching `kind` other than fact/preference or
  `subject` other than household/primary, `stats.by_kind/by_subject` breakdown, routine
  `last_seen`/`pattern_type`/`id`, briefings `limit` > 10 ("show more").

---

## 8. Risks / ambiguities

1. **Error object shape.** `hass.callWS` rejects with `{code, message}`; the old panel did
   `String(err)` and would have shown "[object Object]". Use `err?.message ?? String(err)`.
2. **Regression test on the built bundle.** `tests/unit/test_ws_id_field.py` greps
   `custom_components/jarvis/frontend/jarvis-panel.js` for `jarvis/forget_knowledge` and requires
   `fact_id` before the next `}`. The esbuild output must keep that string literal and the flat
   object literal (minification keeps property names and string literals, so
   `{type:"jarvis/forget_knowledge",fact_id:e}` passes; a dynamically built type string or a
   helper that takes `(type, payload)` where `payload` is spread later would FAIL the test).
3. **Timestamps are inconsistent across the three feeds.** Facts use epoch seconds (float);
   briefings use naive ISO in UTC without "Z" (must append "Z"); person `last_seen` uses naive ISO
   in the server's LOCAL time (`datetime.now().isoformat()`), so it cannot be converted reliably —
   if displayed, show it as-is or as a date only, never through `+"Z"`.
4. **Person labels lose their casing.** `routines` is keyed by `identity.normalize(name)`
   (lower-case, underscores); the display name is reconstructed heuristically ("sam_smith" →
   "Sam Smith"). Fact `subject` can also be such a person id (not only household/primary).
5. **`occurrences` can be 0** (DB default 1, but the helper defaults missing to 0); the old UI
   printed `?` for falsy. `confidence` can be 0.
6. **`ok: false` from add_knowledge is silent in the old panel** — it just kept the inputs. The new
   view should surface it (the usual cause is an input that is empty after stripping, which the
   client already prevents, or an unwritable DB).
7. **Mutations return the full list for all subjects**, so any future subject filter in the UI must
   be applied client-side after teach/forget, not via the `subject` request field.
8. **`removed: 0` is not an error** (id already tombstoned/unknown); treat the returned `facts` as
   truth.
9. **Briefings window is 30 days** and the handler reverses a list that was already LIMITed
   oldest-first — with more than `limit` briefings in 30 days the server returns the OLDEST
   `limit` rows reversed, not the newest ones (SQL `ORDER BY timestamp ASC LIMIT ?`). This is a
   backend quirk, not something the view can fix; do not promise "the latest N" in copy beyond
   what the old panel said.
10. **Hedge threshold** (`source !== "stated" || confidence < 0.9`) and the `kind` choice
    (`preference` for "About me", `fact` for Household) are UI conventions from the old panel, not
    backend rules; keep them for parity.
11. The old panel marked this tab as "interacting" so live-data polling never rebuilt its DOM; in
    Lit make sure a shared panel-level snapshot refresh cannot reset the teach form or the
    per-card state (keep this view's state local to the view element).
12. `get_person_routines` swallows every backend error into `{}` — a broken `patterns.db` looks
    identical to "nothing learned yet". Nothing to do in the UI; just know the empty state may hide
    a backend fault.
