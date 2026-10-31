# Documents view — specification

Derived from the OLD panel's **Document Library** card, which lived on the old *Settings* tab
(`git show 47bede5:custom_components/jarvis/frontend/jarvis-panel.js`: markup ~lines 5500-5533,
`_fetchDocLibrary/_renderDocLibrary/_renderDocSearch/_wireDocLibrary` ~lines 9236-9410,
`_fetchVectorBackend/_renderVectorBackend/_wireVectorBackend` ~lines 9412-9478), and from the
backend: `custom_components/jarvis/websocket.py` (`ws_documents` ~line 2885, `ws_semantic_search`
~line 2820, `ws_search_memory` ~line 1945, `_is_admin/_deny_non_admin` ~line 154),
`documents.py`, `embeddings.py`, `memory.py`, `memory_pgvector.py`, `config_apply.py`,
`__init__.py` (the 10-minute auto-ingest tick ~line 652). The view agent should be able to build
this view from this document alone; it never needs the old panel.

Route: `/jarvis/documents` (tab id `documents`, tab label **Documents**, element
`jarvis-view-documents`, icon `mdi:file-document-multiple-outline`). Admin-only like the whole
panel. This is a **new tab**: the old panel had no Documents tab (the card sat inside Settings). It
is registered in `src/views/index.ts` after `memory` (before `residence`); on narrow it is in the
bottom nav's "More" sheet. Files: `src/views/documents.ts` (+ `src/views/documents/`:
`search-card.ts` `<jarvis-docs-search>`, `memory-card.ts` `<jarvis-docs-memory>`, `query-form.ts`,
`clamp.ts`, `alerts.ts`, `rich.ts`, `format.ts`, `styles.ts`, `types.ts`).

Related specs: `settings.md` §2.6 (the same two commands in one table row each, superseded by
§2 below where they differ), §5.5 (the "not yet ported" row this view closes), §7 risk 12
(`document_watch_folders`); `memory.md` §2.7 / §7 (declines `search_memory`; this spec picks it
up, §2.4).

---

## 1. Purpose

Give the household's paperwork a home and show what JARVIS can retrieve from it:

1. **Document Library** — the files JARVIS has indexed from `/config/jarvis/documents` (manuals,
   receipts, notes: `.pdf`, `.txt`, `.md`). The user can **upload** a file from the browser,
   **re-index the folder**, **scan the configured watch folders** now, and **delete** a document
   (file + index). This is the corpus behind the `search_documents` agent tool JARVIS uses in
   conversation ("what's the furnace filter size?").
2. **Search documents** — run the same retrieval JARVIS uses, to check that a document was indexed
   and what a question would surface (source, score, passage).
3. **Search engine** — whether retrieval is keyword-only (SQLite FTS5, always available) or
   semantic (vectors from the user's Ollama server), with **Enable / Disable / Test** and the
   vector count. Enabling needs a re-index afterwards; the card says so.
4. **Conversation memory search** (new, optional, lowest priority) — a query box over the
   long-term conversation memory (`jarvis/search_memory`), which the backend has always had and
   the old panel never exposed. Its contract is three fields; it is included because it answers
   "does JARVIS remember that we talked about X?" and shares the layout of card 2.

The settings behind the feature (`semantic_search`, `embed_model`, `embed_base_url`,
`document_watch_folders`, and the fallback Ollama host `llm_base_url`) stay in **Settings**; this
view links to them (§2.3). The only setting this view changes is `semantic_search`, through the
purpose-built command alone: Enable is `jarvis/semantic_search enable` (writes it through
`config_apply.async_apply_many`, initialises the vector store and probes Ollama), Disable is
`jarvis/semantic_search disable` (§4 A7/A8). Neither sends `jarvis/update_config`.

Nothing on this view comes from `jarvis/get_panel_data` except `config.memory_stats` (§2.4);
in particular the snapshot does **not** carry `document_watch_folders` or `semantic_search`
(verified against the `config` block in `ws_get_panel_data`; the old panel's prefill from
`pd.config.document_watch_folders` always read `undefined`). No `hass.callService` calls.

Background behaviour the copy must respect: a scheduler tick every **10 minutes**
(`__init__.py` `_docs_tick`) runs `documents.auto_ingest_new` (new/changed files in the documents
folder, by mtime) and `documents.scan_watch_folders`. So files dropped in the folder or a watch
folder appear by themselves within ~10 minutes; the buttons only make it happen now, and
**Ingest folder** additionally re-indexes everything (needed after enabling semantic search).

---

## 2. Data

All three commands are registered in `websocket.py::async_register` and are
`@websocket_api.async_response`. On an unexpected exception each handler calls
`connection.send_error(msg["id"], <code>, str(exc))`; `ws()` (src/ws.ts) turns that into a thrown
`WsError {code, message, command}`. Codes you will see:

| code | from | meaning |
|---|---|---|
| `documents_failed` | `jarvis/documents` | handler exception (the `documents.py` functions themselves never raise, so this is rare: import error, executor failure) |
| `semantic_search_failed` | `jarvis/semantic_search` | handler exception |
| `search_failed` | `jarvis/search_memory` | handler exception |
| `unauthorized` | `jarvis/documents` (every action), `jarvis/semantic_search` (`enable`/`disable`/`test`) | caller is not an admin (`_deny_non_admin`): message "administrator privileges are required for this action". Unreachable from the admin-only panel; handle generically |
| `invalid_format` | any | voluptuous rejected the message (unknown `action`, extra key, wrong type). HA's schema is strict: **do not send keys the schema does not list** (no `k` to `jarvis/documents`, no `query` to `jarvis/semantic_search`) |

Two of the three (`jarvis/documents`, `jarvis/semantic_search`) are **not** decorated
`require_admin`; they gate per action with `_deny_non_admin`. `jarvis/search_memory` is
`require_admin`. Irrelevant for the panel (admin-only) but it is why the codes differ.

Type conventions: `string(iso-naive-utc)` = ISO-8601 with microseconds and **no** timezone suffix,
produced in UTC (`datetime.now(timezone.utc).replace(tzinfo=None).isoformat()`, e.g.
`"2026-10-29T06:30:12.123456"`): append `"Z"` before `new Date()`.

### 2.1 `jarvis/documents` — the library

Request schema (voluptuous, exact):
```python
{
    vol.Required("type"): "jarvis/documents",
    vol.Required("action"): vol.In(["status", "ingest", "search", "upload", "scan_watch", "delete"]),
    vol.Optional("query"): str,       # search only
    vol.Optional("filename"): str,    # upload (original name) and delete (the indexed `source`)
    vol.Optional("content"): str,     # upload only: base64 of the file bytes
}
```
Each action writes an `AGENT` line to the JARVIS log (visible on the Logs view) when it did
something: ingest always, upload/delete on `ok`, scan_watch when `new_files > 0`.

Constants from `documents.py` the UI must mirror: `_SUPPORTED = (".pdf", ".txt", ".md")`
(extension compared lower-cased), `_MAX_FILE_MB = 25` (compared as `len(raw) > 25 * 1_000_000`,
i.e. 25,000,000 bytes), `DOCS_DIR = /config/jarvis/documents` (resolved through `paths.config_path_str`;
the `status` response returns the real path in `directory` — show that, never hard-code it),
chunking 900 chars with 150 overlap (why `chunks` is roughly `text length / 750`).

#### 2.1.1 `action: "status"` — what is indexed

Frontend sends exactly `{ type: "jarvis/documents", action: "status" }`.

Response (`documents.library_status()`, never raises):
```ts
{
  chroma: boolean;        // ChromaDB collection available (practically always false on HA's
                          // Python 3.14 - its onnxruntime dependency has no wheel; keep the branch)
  fts: boolean;           // SQLite FTS5 table `document_fts` in jarvis.db available (normal case)
  directory: string;      // absolute path of the documents folder, e.g. "/config/jarvis/documents"
  chunk_count: number;    // total indexed chunks (chroma count, else SUM over document_fts);
                          // 0 on any internal error. NOT the vector count (that is §2.2.1)
  sources: Array<{
    source: string;       // the file name as indexed (basename, e.g. "furnace-manual.pdf")
    chunks: number;       // chunks for that file
  }>;                     // chroma: sorted by source; fts: GROUP BY order (unsorted) - sort client-side
}
```
`chroma: false, fts: false` means no store at all (FTS5 init failed) - every ingest will fail with
"no vector or FTS store available"; show the error state copy of §5. **Only indexed files are
listed.** A file that sits in the folder but failed extraction (scanned PDF, no PDF library) or
has an unsupported extension is invisible here (Risk 4); the per-file errors come back only from
`ingest` / `scan_watch` / `upload`.

Fetched: on view enter, after every mutation (§4), on **Refresh**, and when the document becomes
visible again (`visibilitychange`) because the 10-minute auto-ingest changes it behind the user's
back. Not otherwise polled.

#### 2.1.2 `action: "ingest"` — re-index the whole folder

Frontend sends exactly `{ type: "jarvis/documents", action: "ingest" }`.

Server: `documents.ingest_directory_async(hass)` = `ingest_directory(DOCS_DIR)` in the executor
(creates the folder if missing; for every `.pdf/.txt/.md` file: extract text, chunk, **delete the
file's old chunks, add the new ones**; files over 25 MB skipped with an error row), then, if
`embeddings.is_enabled()` (setting `semantic_search` true - the base URL always resolves, §2.2),
embeds every successful file's chunks through Ollama (batches of 32, 60 s timeout per call) and
replaces its vectors. It is a **full re-index** of everything, every time; with semantic search on
this can take minutes for a large library (Risk 3). Duplicate ingests are serialised by a lock.

Response:
```ts
// folder unreadable
{ ok: false; error: string;           // "cannot access <dir>: <exc>"
  files: []; total_chunks: 0; semantic: false }

// normal
{
  ok: true;
  directory: string;
  files_seen: number;                 // supported files found
  files_ingested: number;             // files with ok: true
  total_chunks: number;               // sum of chunks over ok files
  files: Array<{
    source: string;                   // file name
    chunks: number;                   // 0 when !ok
    ok: boolean;
    error?: string;                   // when !ok, see list below
    ingested?: string;                // string(iso-naive-utc), ok files only
    chunk_texts?: string[];           // ok files only: THE FULL TEXT OF EVERY CHUNK (Risk 2) - ignore it
  }>;
  semantic: boolean;                  // true only when at least one file was embedded this run
  embedded_files?: number;            // present when semantic search is enabled and ok
  embedded_chunks?: number;           //   "
  semantic_error?: string;            // "Ollama embeddings unavailable — pull the embed model and check
                                      //  the host; keyword search is active" - embedding stopped at the
                                      //  first failing file; keyword index is still complete
}
```
Per-file `error` strings (verbatim from the backend, show as technical detail, do not translate):
`"larger than 25MB — skipped"`, `"unsupported type <ext>"`, `"read error: <exc>"`,
`"pypdf failed: <exc>"`, `"pdfplumber failed: <exc>"`, `"PyPDF2 failed: <exc>"`,
`"no PDF library installed — add 'pypdf' to read PDFs (plain .txt/.md files work without it)"`,
`"no extractable text (scanned image PDF?)"`, `"fts store failed: <exc>"`,
`"no vector or FTS store available"`.

#### 2.1.3 `action: "search"` — test retrieval

Frontend sends exactly `{ type: "jarvis/documents", action: "search", query }` with a trimmed,
non-empty `query` (the client never sends an empty one: with semantic search on, an empty string
would still be sent to Ollama). `k` is **fixed at 5** server-side and cannot be requested (the
agent tool uses 4).

Server: `documents.search_documents_async(hass, query, 5)`: if semantic is enabled and the query
embeds and the vector store returns hits → those; otherwise keyword (`search_documents`: chroma if
available, else FTS5 `MATCH` over the first 8 word tokens OR-ed). So a library that was ingested
before semantic search was enabled silently answers with keyword hits (`engine: "keyword"`) until
it is re-indexed.

Response:
```ts
{
  results: Array<{
    text: string;                 // the chunk (up to ~900 chars)
    source: string;               // file name
    chunk: number | string;       // chunk index: number from vectors/chroma, STRING from FTS (stored as TEXT)
    score: number | null;         // semantic: cosine similarity 0..1 (only > 0 returned), 3 dp;
                                  // chroma: 1 - distance (can be < 0); FTS: null
    engine: "semantic" | "keyword";
  }>;                             // best first; [] for no match or blank query
}
```

#### 2.1.4 `action: "upload"` — browser upload

Frontend sends exactly
`{ type: "jarvis/documents", action: "upload", filename: file.name, content: <base64> }` where
`content` is the **bare** base64 of the file bytes (strip the `data:…;base64,` prefix from a
`FileReader.readAsDataURL` result, or encode an `ArrayBuffer` yourself). Standard alphabet;
`b64decode(validate=False)` ignores stray characters, so line breaks are harmless.

**Size — two limits, the smaller wins (Risk 1):**
* backend: decoded size `> 25,000,000` bytes → `{ok: false, error: "file exceeds 25MB"}`;
* transport: Home Assistant's WebSocket (`websocket_api/http.py`, `web.WebSocketResponse(heartbeat=55)`,
  aiohttp default `max_msg_size = 4,194,304`) **closes the connection** for any inbound frame over
  4 MiB; HA then reconnects and the pending `callWS` rejects (not with a `{code, message}`
  object — see Risk 10). Base64 inflates by 4/3 plus the JSON envelope, so the client must refuse
  files larger than **3,000,000 bytes** (→ 4,000,000 base64 chars) *before* reading them and
  explain that bigger files go into the folder (the path from `status.directory`), not through
  the browser. The old panel's 25 MB client check was wrong.

Server: `documents.save_and_ingest_upload(hass, filename, content)`:
1. `_safe_filename`: takes the basename (after `\`→`/`), replaces every char outside
   `[A-Za-z0-9._ \-()]` with `_`, strips leading/trailing `.` and spaces, caps at 180 chars,
   requires a supported extension (case-insensitive). The stored name can therefore differ from
   `file.name` (`"Händbuch (2024).pdf"` → `"H_ndbuch (2024).pdf"`): always show the returned
   `filename`.
2. Writes the bytes to `DOCS_DIR/<safe>` — **silently overwriting** a file of the same name — then
   ingests that file (its previous chunks are replaced), then embeds it when semantic search is on.

Response:
```ts
// rejected before saving (no file written)
{ ok: false; error: string }
//   "unsupported or unsafe filename (allowed: .pdf, .txt, .md)" | "could not decode file content"
//   | "file exceeds 25MB" | "path escapes documents directory" | "write failed: <exc>"

// saved but NOT indexed (the file stays on disk; it will not appear in `status`, Risk 4)
{ ok: false; filename: string; chunks: 0; error: string }   // a §2.1.2 per-file error

// indexed
{
  ok: true;
  filename: string;               // the sanitised name actually stored = the future `source`
  chunks: number;
  embedded?: number;              // vectors stored, when semantic search is on and Ollama answered
  semantic_note?: string;         // "saved & indexed; Ollama embedding unavailable" - keyword only
}
```
Only one file per call; the view uploads a multi-select sequentially and reports per file.

#### 2.1.5 `action: "scan_watch"` — pull new files from the watch folders now

Frontend sends exactly `{ type: "jarvis/documents", action: "scan_watch" }`.

Server: `documents.scan_watch_folders(hass)`: reads the `document_watch_folders` setting (a
string split on newlines **and** commas, or a JSON list; blank entries dropped), lists each
existing folder non-recursively for supported files ≤ 25 MB, skips files already seen with the
same mtime (table `document_watch_seen`), **copies** new ones into `DOCS_DIR` under a sanitised
name, ingests (+ embeds) them, and marks them seen. The originals are never touched. The same
scan runs automatically every 10 minutes.

Response:
```ts
// nothing configured
{ ok: true; watched: 0; new_files: 0; note: "no watch folders configured" }

// scanned
{
  ok: true;
  watched: number;                // configured folder entries (missing folders still count)
  new_files: number;              // files ingested OK this run
  files: Array<{                  // one row per new/changed candidate (copy failures are omitted)
    source: string;               // original basename in the watch folder
    ok: boolean;
    filename: string;             // name stored in DOCS_DIR (sanitised)
    chunks: number;
    error?: string;               // §2.1.2 per-file error
  }>;
}
```

#### 2.1.6 `action: "delete"` — remove a document

Frontend sends exactly `{ type: "jarvis/documents", action: "delete", filename: source }` with
`source` taken verbatim from `status.sources[].source`.

Server: `documents.delete_source(filename)`: sanitises the name (same rule as upload), purges the
chunks (chroma + FTS) and the vectors (`doc_vectors`) for the **sanitised** name, then unlinks
`DOCS_DIR/<safe>`. A file that came from a watch folder stays in its original folder and stays
"seen", so it does not come back unless it changes.

Response:
```ts
{ ok: false; error: "invalid filename" }                                   // sanitiser rejected it
{ ok: false; filename: string; error: string }                             // "file remove failed: <exc>" - chunks already purged
{ ok: true;  filename: string }                                            // also returned when nothing matched (Risk 5)
```

### 2.2 `jarvis/semantic_search` — the retrieval engine

Request schema (exact):
```python
{
    vol.Required("type"): "jarvis/semantic_search",
    vol.Required("action"): vol.In(["status", "enable", "disable", "test"]),
}
```
Resolution rules from `embeddings.py` the copy relies on:
* model = setting `embed_model` or `"nomic-embed-text"`;
* base = setting `embed_base_url`, else `llm_base_url`, else `const.DEFAULT_OLLAMA_BASE_URL`
  (`"http://homeassistant.local:11434/v1"`), trimmed of a trailing `/` and a trailing `/v1`.
  Because of the fallback **`ollama_configured` is always `true`** today; the old panel's
  "needs an Ollama host" branch is dead code. Show `base` instead so the user sees where the probe
  goes;
* `is_enabled()` = setting `semantic_search` && base non-empty → in practice just the setting;
* a probe/embed calls `POST {base}/api/embed` (60 s timeout) and on failure falls back to
  `POST {base}/api/embeddings` per text (another 60 s) → **a failing probe can take ~2 minutes**
  (Risk 3). Probes never mark the service DOWN in diagnostics; real ingest/search failures do.

#### 2.2.1 `action: "status"`
```ts
{
  enabled: boolean;            // the raw `semantic_search` setting (true even if Ollama is down)
  ollama_configured: boolean;  // bool(base) - always true (see above)
  vector_count: number;        // rows in doc_vectors (0 on error). Stays > 0 after `disable`
  base: string;                // admin only (always for the panel): resolved Ollama base, "" if none
  model: string;               // admin only: the embed model name
}
```
The effective engine for the badge: `enabled && vector_count > 0` → semantic is actually answering;
`enabled && vector_count === 0` → enabled but nothing embedded yet (re-index needed);
`!enabled` → keyword.

#### 2.2.2 `action: "enable"`
Server: writes `semantic_search = true` through `config_apply.async_apply_many` (runtime_config +
config.json + config-changed signal, the same path as `jarvis/update_config`), creates the
`doc_vectors` table, then probes. The setting stays `true` even when the probe fails.
```ts
{ ok: true;  model: string; base: string; dim: number; enabled: true }          // Ollama answered (dim e.g. 768)
{ ok: false; model: string; base: string; error: string; enabled: true }        // enabled, Ollama not ready
{ ok: false; error: "no Ollama base URL configured (set llm_base_url to your Ollama host)"; enabled: true }  // unreachable today
```
`error` strings (verbatim, technical): `"model '<m>' not found on Ollama (404) — run: ollama pull <m>"`,
`"model '<m>' returned no embeddings — is '<m>' pulled? run: ollama pull <m>"` (optionally with
`(<ollama error>)`), `"Ollama /api/embed HTTP <n>: <body>"`, `"Ollama /api/embed unreachable: <exc>"`,
`"model '<m>' not found — run: ollama pull <m>"`, `"unreachable: <exc>"`, `"HTTP <n>"`, or the
default `"Ollama did not return an embedding — is the embed model pulled? Try: ollama pull <m>"`.
Existing documents have **no vectors** until re-indexed: after a successful enable the view must
offer **Ingest folder** (§4 A2) prominently.

#### 2.2.3 `action: "disable"`
Writes `semantic_search = false` (also through `config_apply.async_apply_many`). Vectors are kept.
→ `{ enabled: false; ok: true }`. Called by A8 (the response is not read: the view re-reads
`status`).

#### 2.2.4 `action: "test"`
Probe only, no write: `{ ok: true; model; base; dim }` | `{ ok: false; model; base; error }` |
`{ ok: false; error: "no Ollama base URL configured …" }`. Works whether or not semantic search is
enabled (so the user can check Ollama before enabling).

### 2.3 Settings this view reads indirectly and links to (writes only `semantic_search`)

| key | kind | default | category (Settings route) | used by |
|---|---|---|---|---|
| `semantic_search` | bool | `false` | `learning` | `embeddings.is_enabled()`; written by A7 / A8 (`jarvis/semantic_search enable` / `disable`) |
| `embed_model` | str | `"nomic-embed-text"` | `learning` | model name in probes/ingest |
| `embed_base_url` | str | `""` | `learning` | Ollama host override for embeddings |
| `document_watch_folders` | str (newline- or comma-separated paths; a JSON list is also accepted by the backend) | `""` | `learning` | `scan_watch` and the 10-minute tick |
| `llm_base_url` | str | `""` | `core` | fallback Ollama host when `embed_base_url` is blank |

Deep links (settings.md §4.3): `this.navigate("settings", "learning/document_watch_folders")`,
`"learning/embed_model"`, `"learning/embed_base_url"`, `"core/llm_base_url"`. The Settings view
scrolls to and flashes the field. None of these values is in the snapshot; if the view ever needs
to *display* the watch-folder list it must read `jarvis/config_schema` (settings.md §2.1) —
not required: `scan_watch.watched` gives the count and the link opens the editor.

### 2.4 `jarvis/search_memory` — conversation memory (optional card)

Request schema (exact):
```python
{
    vol.Required("type"): "jarvis/search_memory",
    vol.Required("query"): str,
    vol.Optional("k", default=5): int,
}
```
Frontend sends `{ type: "jarvis/search_memory", query, k: 8 }` (trimmed, non-empty query; 8 is a
UI choice — chroma clamps to 20, FTS/pgvector use it as LIMIT).

Server: `memory.search_memory(query, k)`: pgvector if configured, else ChromaDB, else SQLite FTS5
(`memory_fts`, first 8 words OR-ed), else `[]`. Empty query → `[]`. Error code `search_failed`.

Response:
```ts
{
  results: Array<{
    text: string;        // the stored turn (user or assistant message)
    role: string;        // "user" | "assistant" | "" (metadata may be missing)
    timestamp: string;   // string(iso-naive-utc) from chroma/FTS; pgvector: ts.isoformat() (may carry an offset); "" if unknown
    score: number;       // vector backends: similarity 0..1 (3 dp); FTS: abs(rank) * 0.1 - a relative rank, NOT a percentage
  }>;                    // best first
}
```
Whether to show the card: `data.config.memory_stats` (snapshot) is
`{backend: "none" | "pgvector" | "chromadb" | "fts5" | "unavailable", total_memories: number, last_consolidated?: string}`
(the harness fixture says `"sqlite"`; treat any unknown string as "some backend"). Render the card
whenever `data` is loaded; when `backend` is `"none"`/`"unavailable"` or `total_memories === 0`,
show the empty hint instead of the search box (§5). Show the score as a percentage **only** when
`backend` is `pgvector`/`chromadb`; otherwise hide it (Risk 13).

### 2.5 Not used

* `hass.callService`: none. `jarvis/update_config`: none (A7 / A8 write `semantic_search` through
  `jarvis/semantic_search`); every other setting edit goes to Settings.
* `jarvis/get_panel_data`: only `config.memory_stats` (§2.4). The view does **not** call
  `refresh()` after mutations — nothing on the snapshot changes.

---

## 3. Layout

Four `<jv-section>` cards in a `.jv-grid`. Order (and mobile priority, top to bottom):
**Document Library** (`.jv-span-all` — it is the list) → **Search documents** → **Search engine**
→ **Conversation memory**. On ≥ 1100 px the last three share one row (3 columns); between 600 and
1100 px two columns with Library full width; under 600 px one column. Follow DESIGN.md for
everything visual (tokens only, 44 px targets, no spinners — use the `loading` attribute of
`<jv-section>` and disabled buttons with a changed label).

### 3.1 Card "Document Library" (primary; `flush`, `.jv-span-all`)

* Heading **Document Library**; `icon="mdi:file-document-multiple-outline"`.
* `subheading`: `t("{count} documents · {chunks} chunks · {engine}")` once `status` is loaded,
  where `engine` is `t("Keyword index")` (`fts && !chroma`), `t("Vector index (ChromaDB)")` (`chroma`),
  or `t("No index")` (neither). Before load: empty subheading and `loading`.
* `slot="actions"`: an icon button **Refresh** (`mdi:refresh`, `aria-label=t("Refresh")`).
* Intro line (`--jv-text-2`, 12/16 px padding because the card is `flush`):
  *Drop PDF, .txt or .md files into {directory} (picked up within 10 minutes) or upload below.
  JARVIS answers from them in conversation.* — `{directory}` is `status.directory` in
  `--jv-font-code`, wrapped (`overflow-wrap: anywhere`). The whole sentence is one `t()` key with
  the `{directory}` placeholder.
* **Toolbar** (wrapping flex row; on narrow the three buttons stack full width, Upload first):
  * `<button class="jv-btn primary">` **Upload files** → opens a hidden
    `<input type="file" accept=".pdf,.txt,.md" multiple>` (label the input for a11y; the button
    is the visible control). While uploading the label becomes **Uploading {n} of {total}…**.
  * `<button class="jv-btn">` **Ingest folder** (`title`/help: *Re-index every file in the folder.
    Needed once after enabling semantic search.*). While running: **Indexing…**.
  * `<button class="jv-btn">` **Scan watch folders**. While running: **Scanning…**. Next to it a
    text link **Watch folders…** → `navigate("settings", "learning/document_watch_folders")`.
  * Optional: the card accepts drag-and-drop of files anywhere on it (same handler as Upload;
    highlight with `--jv-accent-soft` and a dashed `--jv-accent` border while dragging over).
    Keyboard users have the button, so this is progressive enhancement only.
* **Result banner** (`aria-live="polite"`, an `<ha-alert>` with a dismiss button, replaced by each
  new operation): the one-line outcome of the last upload / ingest / scan / delete (§4 feedback
  column) and, when there are per-file errors, a `<details>` **Show {n} problems** with a
  `<ul>` of `source — error` rows in `--jv-font-code`.
* **List** (`<ul>`; after a successful `status`): one `<li>` per `sources[]` entry sorted by
  `source` (localeCompare), min-height 44 px, 16 px horizontal padding, divider between rows:
  * leading `<ha-icon>` by extension: `.pdf` → `mdi:file-pdf-box`, `.md` → `mdi:language-markdown`,
    else `mdi:file-document-outline` (decorative, `aria-hidden`);
  * name (`.jv-truncate` + `title`, `overflow-wrap` on narrow);
  * trailing `t("{count} chunks")` in `--jv-text-2` (singular `t("1 chunk")`);
  * trailing icon button **Delete** (`mdi:delete-outline`, `aria-label=t("Delete {name}", {name})`),
    disabled while that row's delete is pending.
  On narrow the row is name on the first line, chunks + delete on the second.
* Footer line (`--jv-text-2`, small): *Files are also picked up automatically every 10 minutes.*

### 3.2 Card "Search documents"

* Heading **Search documents**; `icon="mdi:text-search"`.
* Subheading: *The same retrieval JARVIS uses when you ask it a question.*
* Form: `<ha-textfield>` (fallback `<input type="search">`) labelled **Search documents**
  (visually a placeholder *e.g. furnace filter size*), `autocomplete="off"`, plus a
  `<button class="jv-btn primary">` **Search** (disabled while the query is blank or a search is
  pending; label **Searching…** while pending). Enter submits. A clear (`×`) control / `type=search`
  native clear returns to the idle state.
* Results header (after a search): `t("{count} results for “{query}”")` (singular `1 result`) and,
  when `results.length > 0`, a `<jv-state-badge>` for the engine of the first hit:
  `engine === "semantic"` → `level="accent" label=t("Semantic")`, else `level="neutral" label=t("Keyword")`.
* Result list (`<ul>`): per hit
  * first line: `source` (medium weight) · score when `score != null` and `engine === "semantic"`:
    `t("{pct}% match", {pct: Math.round(score * 100)})` (chroma scores may be negative — clamp to 0;
    keyword hits show no score) · `t("chunk {n}", {n: chunk})` in `--jv-font-code` `--jv-text-2`;
  * second line: `text`, `white-space: pre-wrap`, clamped to 4 lines with a **Show more** /
    **Show less** toggle button (never `overflow: hidden` without the toggle; the old panel cut at
    220 chars with "…"). Render as text, never HTML.
* Nothing in this card writes anything.

### 3.3 Card "Search engine"

* Heading **Search engine**; `icon="mdi:vector-combine"`.
* Status row: `<jv-state-badge>` + text, derived from §2.2.1:
  * `!enabled` → `level="neutral"`, label **Keyword (FTS5)**; line: *Works everywhere with no
    setup. Enable semantic search to match on meaning using your Ollama server; re-index the
    folder afterwards.*
  * `enabled && vector_count > 0` → `level="ok"`, label **Semantic (Ollama)**; line:
    `t("Meaning-based matching with {model} · {count} vectors")`.
  * `enabled && vector_count === 0` → `level="warn"`, label **Semantic (Ollama) — not indexed yet**;
    line: *Semantic search is on but no document has been embedded. Run Ingest folder.* with an
    inline **Ingest folder** button (same action as §4 A2).
* `<jv-kv>` rows (`mono`): **Ollama host** = `base` (or `t("not set")`), **Model** = `model`,
  **Vectors** = `vector_count`. Each of host/model gets a trailing text link **Change…** →
  `navigate("settings", "learning/embed_base_url")` / `"learning/embed_model"`; under host a
  caption *Falls back to the LLM base URL (Settings → General).* linking `core/llm_base_url`.
* Buttons (wrapping row; full width stacked on narrow):
  * when `!enabled`: `<button class="jv-btn primary">` **Enable semantic search**
    (**Checking Ollama…** while pending);
  * when `enabled`: `<button class="jv-btn">` **Disable semantic search**;
  * always: `<button class="jv-btn text">` **Test connection** (**Testing…** while pending).
* Probe result area (`aria-live="polite"`): an `<ha-alert>` — `success` *Ollama answered:
  {model}, {dim}-dimensional vectors.* or `warning` *Ollama is not ready: {error}* with the
  technical error verbatim in `--jv-font-code`. Stays until the next probe or a dismiss.
* The settings themselves (`semantic_search`, `embed_*`) are also plain switches/fields in
  Settings → Learning; toggling there and here are equivalent (Risk 9).

### 3.4 Card "Conversation memory" (optional, last)

* Heading **Conversation memory**; `icon="mdi:brain"`; subheading
  `t("{count} memories · {backend}")` from `data.config.memory_stats` (backend shown as a technical
  value). A caption links **Memory** (`navigate("memory")`) for the curated facts, to make the
  difference clear: this card searches past *conversations*.
* Same form as 3.2 (label **Search conversations**, placeholder *e.g. when did we buy the dishwasher*).
* Results (`<ul>`): per hit a first line with `role` → `t("You")` for `"user"`, `t("JARVIS")` for
  `"assistant"`, else nothing; the time (`new Date(ts.endsWith("Z") || /[+-]\d\d:\d\d$/.test(ts) ? ts : ts + "Z").toLocaleString()`,
  blank when `ts` is empty/unparseable); the score as `{pct}% match` only for vector backends
  (§2.4); second line `text`, pre-wrap, 4-line clamp with Show more.
* Read-only.

---

## 4. Actions

| # | Action | Trigger | Command | Confirmation | Feedback (success) | Feedback (failure) |
|---|---|---|---|---|---|---|
| A1 | Upload | **Upload files** / drop | `jarvis/documents {action:"upload", filename, content}` per file, sequentially | none | banner *Uploaded {filename} — {chunks} chunks* (+ *, {n} embedded* when `embedded`; + *· {semantic_note}* when present); then re-`status` | per file: `ok:false` → banner `warning` *Couldn't index {filename}: {error}* (file saved, not listed — say so when `filename` is present: *The file was saved to the folder but could not be indexed.*); thrown → `error` *Upload failed — {message}*. Client-side rejections before any call: extension not in `.pdf/.txt/.md` → *{name}: only PDF, .txt and .md files can be uploaded*; `size > 3,000,000` → *{name} is larger than 3 MB — copy it into {directory} instead; it is picked up within 10 minutes* |
| A2 | Ingest folder | button (3.1), inline button (3.3) | `jarvis/documents {action:"ingest"}` | none, but the button `title` warns it re-indexes everything | banner *Indexed {files_ingested} of {files_seen} files, {total_chunks} chunks* (+ *, {embedded_chunks} embedded* when `semantic`; + `warning` tone and *· {semantic_error}* when present); problems list from `files[].error`; re-`status` and re-`semantic_search status` (vector count changed) | `ok:false` → `error` *Couldn't read the documents folder: {error}*; thrown → *Indexing failed — {message}* |
| A3 | Scan watch folders | button | `jarvis/documents {action:"scan_watch"}` | none | `watched === 0` → `info` *No watch folders configured.* with a **Set up watch folders** link (settings deep link); else *Scanned {watched} folders — {new_files} new documents* (+ problems list); re-`status` | thrown → *Scan failed — {message}* |
| A4 | Delete | row icon button | `jarvis/documents {action:"delete", filename: source}` | **yes** — `confirmDialog({heading: t("Delete {name}?", {name}), message: t("This removes the file from the documents folder and everything JARVIS indexed from it."), confirmLabel: t("Delete"), destructive: true})` | banner *Deleted {filename}*; re-`status` | `ok:false` → *Couldn't delete {name}: {error}*; thrown → *Delete failed — {message}*. Leave the row in place on failure |
| A5 | Search documents | **Search** / Enter | `jarvis/documents {action:"search", query}` | none | results list (3.2) | inline `<ha-alert error>` in the card: *Search failed — {message}* + **Retry** |
| A6 | Clear search | clear control / empty submit | — | — | back to idle copy | — |
| A7 | Enable semantic search | button | `jarvis/semantic_search {action:"enable"}` (writes the setting, vector store + probe) | none | `ok` → alert `success` *Semantic search is on ({model}, {dim}-dimensional). Run Ingest folder to embed your documents.* with an inline **Ingest folder** button; re-`status` (3.3) | `ok:false` → alert `warning` *Semantic search is on, but Ollama isn't ready: {error}* (it IS enabled now — re-`status` shows the warn badge); thrown → *Couldn't enable semantic search — {message}* |
| A8 | Disable semantic search | button | `jarvis/semantic_search {action:"disable"}` | none (not destructive: vectors are kept) | alert `info` *Semantic search is off — keyword search is active.*; re-`status` (3.3) | thrown → *Couldn't disable semantic search — {message}* |
| A9 | Test connection | button | `jarvis/semantic_search {action:"test"}` | none | alert `success` *Ollama answered: {model}, {dim}-dimensional vectors.* | `ok:false` → alert `warning` *Ollama is not ready: {error}*; thrown → *Test failed — {message}* |
| A10 | Search conversations | **Search** / Enter (3.4) | `jarvis/search_memory {query, k: 8}` | none | results list (3.4) | inline alert *Search failed — {message}* + **Retry** |
| A11 | Refresh | icon button (3.1), `visibilitychange` → visible | `jarvis/documents {action:"status"}` + `jarvis/semantic_search {action:"status"}` | — | lists update silently | card error state (§5) |
| A12 | Retry | button in an error state | the failed read | — | — | — |
| A13 | Open setting | text links | `navigate("settings", "<category>/<key>")` (§2.3), `navigate("memory")` | — | — | — |

Rules for every mutating action (A1-A4, A7-A9):
* disable **all** of Upload / Ingest / Scan / Enable / Disable / Test while any one of them is
  pending (the backend serialises ingests with a lock; a second call just queues and the user
  would see nothing for minutes) — except Delete, which stays available per row;
* keep the pressed button's "…ing" label and set the card's `loading`;
* no optimistic updates: the list changes only after the re-fetched `status`;
* messages from the backend (`error`, `semantic_error`, `semantic_note`, per-file errors, probe
  `error`) are shown verbatim as technical detail (`--jv-font-code`), never translated; the
  sentence around them is a `t()` key with a `{error}` placeholder;
* when a call throws, use `err.message` (a `WsError`); if `err.code === "3"` or the message is
  empty or purely numeric (Risk 10) show `t("the connection was interrupted")` instead;
* `status` re-fetches after a mutation must not wipe the result banner.

---

## 5. States

Each card keeps its own state; a failure in one never blanks another.

| Card | Loading | Empty | Error | Disabled |
|---|---|---|---|---|
| Document Library | `<jv-section loading>` + `<jv-empty kind="loading">` in the list area; toolbar enabled (upload/ingest work before the first `status` resolves) | after a successful `status` with `sources.length === 0`: `<jv-empty icon="mdi:file-document-plus-outline" heading=t("No documents yet") message=t("Upload a manual or receipt, or drop files into {directory}.")>` with the **Upload files** button in `slot="action"`; when `!fts && !chroma` the message is instead `t("No document index is available — SQLite FTS5 is missing on this Home Assistant. Check the logs.")` and the toolbar is disabled | `<ha-alert alert-type="error" title=t("Couldn't load the library")>` with `message` + **Retry** | all toolbar buttons while a mutation runs; a row's Delete while its delete runs |
| Search documents | idle: hint line *Type a question to see which passages JARVIS would use.*; pending: button **Searching…**, field read-only | after a search: `<jv-empty compact icon="mdi:text-search" heading=t("No matches") message=t("Try different words, or index more documents.")>`; when the library is known empty (`status.sources.length === 0`) the field is disabled with the hint *Add a document first.* | inline `<ha-alert error>` *Search failed — {message}* + **Retry** | Search button while blank/pending |
| Search engine | `<jv-section loading>` with the badge area blank | — (always has content) | `<ha-alert error title=t("Couldn't read the search engine status")>` + **Retry**; the Document Library still works | Enable/Disable/Test while any mutation runs |
| Conversation memory | `data === null` → `loading`; | `memory_stats.backend` ∈ {`none`, `unavailable`} or `total_memories === 0` → `<jv-empty compact icon="mdi:brain" heading=t("No conversation memory yet") message=t("JARVIS stores conversations once a memory backend is available; see Settings → Learning.")>` and no form; after a search with no hits: *No matching conversations.* | inline alert + **Retry** | Search button while blank/pending |

Other states:
* `hass` undefined → render shells in loading; fetch when `hass` arrives (`updated()` on first
  truthy `hass`).
* `document.visibilityState` becomes `"visible"` → A11 (silent refresh; keep scroll and form).
* Between the first paint and the `status` response the directory in the intro line is unknown:
  render the intro without the path (second `t()` key *Drop PDF, .txt or .md files into the
  documents folder or upload below.*), swap once known.
* Non-admin: unreachable (panel is `require_admin`).

---

## 6. Strings

**Phase 3 status:** every panel key is now translated in all 22 language files (`frontend/i18n-missing.json` reports nothing missing; `npm run i18n:report` regenerates it). The de.json / ✓ / ✗ columns below record what existed before the port; the code's `t()` keys (`npm run i18n:keys`) are authoritative where they differ from this list.

Pass every user-visible string through `t()`; keys are the exact English strings below.
Checked against `custom_components/jarvis/frontend/i18n/de.json` (337 keys): the old card's
strings were upper-case HUD labels (`"UPLOAD FILE"`, `"INGEST FOLDER"`, `"SCAN WATCH"`,
`"KEYWORD (FTS)"`, `"DISABLE"`, `"TEST"`) which the new sentence-case UI does not reuse. Rows marked
**yes** already have a translation; everything else is English in every language until the
translation pass (keep the English text exactly as written so the entries match).

| English key (exact) | Where | In i18n files? |
|---|---|---|
| `Documents` | tab label | no |
| `Document Library` | card 1 heading | yes (de "Dokumentbibliothek") |
| `Search engine` | card 3 heading | yes (de "Suchmaschine") |
| `Settings` | link text | yes (de "Einstellungen") |
| `Memory` | link text (card 4) | yes (de "Gedächtnis") |
| `Loading...` | any textual loading fallback (three ASCII dots) | yes (de "Wird geladen...") |
| `{count} documents · {chunks} chunks · {engine}` | card 1 subheading | no |
| `Keyword index` / `Vector index (ChromaDB)` / `No index` | the `{engine}` value | no |
| `Refresh` | icon button aria-label | no |
| `Drop PDF, .txt or .md files into {directory} (picked up within 10 minutes) or upload below. JARVIS answers from them in conversation.` | intro | no |
| `Drop PDF, .txt or .md files into the documents folder or upload below.` | intro before `status` | no |
| `Upload files` / `Uploading {n} of {total}…` | toolbar | no |
| `Ingest folder` / `Indexing…` | toolbar + inline buttons | no |
| `Re-index every file in the folder. Needed once after enabling semantic search.` | Ingest `title` | no |
| `Scan watch folders` / `Scanning…` | toolbar | no |
| `Watch folders…` / `Set up watch folders` | settings links | no |
| `Files are also picked up automatically every 10 minutes.` | card 1 footer | no |
| `{count} chunks` / `1 chunk` | row meta | no |
| `Delete {name}` | row icon aria-label | no |
| `Delete {name}?` / `This removes the file from the documents folder and everything JARVIS indexed from it.` / `Delete` | confirm dialog | no |
| `Deleted {filename}` / `Couldn't delete {name}: {error}` / `Delete failed — {message}` | A4 feedback | no |
| `Uploaded {filename} — {chunks} chunks` / `, {n} embedded` / `Couldn't index {filename}: {error}` / `The file was saved to the folder but could not be indexed.` / `Upload failed — {message}` | A1 feedback | no |
| `{name}: only PDF, .txt and .md files can be uploaded` / `{name} is larger than 3 MB — copy it into {directory} instead; it is picked up within 10 minutes` | A1 client checks | no |
| `Indexed {files_ingested} of {files_seen} files, {total_chunks} chunks` / `, {embedded_chunks} embedded` / `Couldn't read the documents folder: {error}` / `Indexing failed — {message}` | A2 feedback | no |
| `No watch folders configured.` / `Scanned {watched} folders — {new_files} new documents` / `Scan failed — {message}` | A3 feedback | no |
| `Show {n} problems` | problems `<details>` | no |
| `No documents yet` / `Upload a manual or receipt, or drop files into {directory}.` / `No document index is available — SQLite FTS5 is missing on this Home Assistant. Check the logs.` / `Couldn't load the library` | card 1 states | no |
| `Search documents` | card 2 heading + field label | no |
| `The same retrieval JARVIS uses when you ask it a question.` | card 2 subheading | no |
| `e.g. furnace filter size` | card 2 placeholder (the old key was `test a search`, which exists in de.json but reads badly as a placeholder — do not reuse) | no |
| `Search` / `Searching…` / `Retry` | buttons | no |
| `Type a question to see which passages JARVIS would use.` / `Add a document first.` / `No matches` / `Try different words, or index more documents.` / `Search failed — {message}` | card 2 states | no |
| `{count} results for “{query}”` / `1 result for “{query}”` | results header | no |
| `Semantic` / `Keyword` | engine badge | no |
| `{pct}% match` / `chunk {n}` / `Show more` / `Show less` | result rows | no |
| `Keyword (FTS5)` / `Semantic (Ollama)` / `Semantic (Ollama) — not indexed yet` | card 3 badge labels | no |
| `Works everywhere with no setup. Enable semantic search to match on meaning using your Ollama server; re-index the folder afterwards.` | card 3 (off) | no |
| `Meaning-based matching with {model} · {count} vectors` | card 3 (on) | no |
| `Semantic search is on but no document has been embedded. Run Ingest folder.` | card 3 (on, 0 vectors) | no |
| `Ollama host` / `Model` / `Vectors` / `not set` / `Change…` | kv rows | no |
| `Falls back to the LLM base URL (Settings → General).` | caption | no |
| `Enable semantic search` / `Checking Ollama…` / `Disable semantic search` / `Test connection` / `Testing…` | buttons | no |
| `Ollama answered: {model}, {dim}-dimensional vectors.` / `Ollama is not ready: {error}` / `Test failed — {message}` | A9/A7 alerts | no |
| `Semantic search is on ({model}, {dim}-dimensional). Run Ingest folder to embed your documents.` / `Semantic search is on, but Ollama isn't ready: {error}` / `Couldn't enable semantic search — {message}` | A7 | no |
| `Semantic search is off — keyword search is active.` / `Couldn't disable semantic search — {message}` | A8 | no |
| `Couldn't read the search engine status` | card 3 error title | no |
| `Conversation memory` / `Search conversations` / `e.g. when did we buy the dishwasher` | card 4 | no |
| `{count} memories · {backend}` | card 4 subheading | no |
| `You` / `JARVIS` | role labels | no |
| `No conversation memory yet` / `JARVIS stores conversations once a memory backend is available; see Settings → Learning.` / `No matching conversations.` | card 4 states | no |
| `the connection was interrupted` | fallback for a numeric/empty error message | no |

Never translated: file names, `directory`, `base`, `model`, backend error strings, numbers,
timestamps, `memory_stats.backend`.

---

## 7. Out of scope (with reasons)

* **Editing `document_watch_folders`, `embed_model`, `embed_base_url`, `semantic_search` as
  fields** — they are catalogue settings rendered by Settings → Learning (settings.md §2.1/§3);
  duplicating the editor here would create two sources of truth and the snapshot does not even
  carry the values. This view links (A13). The old card's inline watch-folder text field that saved
  on blur is deliberately not ported.
* **Listing files that are in the folder but not indexed** — no backend command lists the
  directory; `status` reports the index only. Needs a backend addition (Risk 4).
* **Uploads over 3 MB** — the WebSocket frame limit (Risk 1). A proper fix is an authenticated HTTP
  upload view (`/api/jarvis/documents/upload`, multipart), a backend change outside this view.
* **Progress for long ingests** — the command answers once at the end; no streaming/subscription
  exists. The view shows a pending label only.
* **Per-document actions beyond delete** (download, open, re-index one file, preview) — no
  backend support (`ingest` is all-or-nothing; the files are not served over HTTP).
* **Choosing `k` / paging search results** — `jarvis/documents search` hard-codes 5.
* **ChromaDB as a user-facing option** — the backend still detects it but it cannot be installed
  on HA's Python; the badge handles `chroma: true` and nothing else is built around it.
* **Semantic search for conversation memory** — `search_memory` uses whatever memory backend
  exists; the Ollama vectors are documents-only. The card explains nothing about engines.
* **A "Brief me / ask JARVIS" box** — chat is HA's Assist dialog (docs/panel.md).
* **Dictionary entries** — listed in §6 for the translation pass, not added by the view agent.

---

## 8. Fixtures (harness + smoke)

The mock (`dev/mock-hass.ts`) and the smoke router (`scripts/smoke.mjs`) resolve fixtures **by
message type only**: every `action` of `jarvis/documents` receives the same `jarvis_documents.json`,
and every action of `jarvis/semantic_search` the same `jarvis_semantic_search.json`. Neither echoes
or special-cases these commands. So write **union** fixtures that make every action render
sensibly:

* `dev/fixtures/jarvis_documents.json` — the `status` shape (`chroma: false, fts: true,
  directory: "/config/jarvis/documents", chunk_count, sources: 4-6 realistic rows such as
  `furnace-manual.pdf`, `dishwasher-receipt-2024.pdf`, `wifi-setup.md`, `house notes.txt`) **plus**
  `results: [...]` (3 hits with `engine: "semantic"`, numeric `chunk`, `score` 0.4-0.9, ~300-char
  `text`, so the harness search shows something) **plus** `ok: true, filename: "wifi-setup.md",
  chunks: 3, files_seen: 4, files_ingested: 4, total_chunks: 57, semantic: true, embedded_chunks: 57,
  watched: 1, new_files: 0, files: []` so upload / ingest / scan / delete banners read as successes.
  Do **not** include `chunk_texts`.
* `dev/fixtures/jarvis_semantic_search.json` — `{"enabled": true, "ollama_configured": true,
  "vector_count": 57, "base": "http://homeassistant.local:11434", "model": "nomic-embed-text",
  "ok": true, "dim": 768}`.
* `dev/fixtures/jarvis_search_memory.json` — `{"results": [...]}` with 3 rows (`role` user/assistant,
  `timestamp` iso-naive-utc, `score` 0.3-0.8).

In the harness a mutation therefore "succeeds" and the list snaps back on the next `status`
(documented mock limitation). The smoke test requires the view to render content in light, dark
and coloured-header themes with these fixtures and the fixture `panel_data.json` (`memory_stats`
present), and to produce no `console.error`; make sure an `action: "upload"` is never fired on
mount.

---

## 9. Risks / ambiguities

1. **Upload size: the transport limit is 4 MiB, not 25 MB.** HA's WebSocket server uses aiohttp's
   default `max_msg_size` (4,194,304 bytes, verified in `homeassistant/components/websocket_api/http.py`
   + aiohttp 3.13). A base64 upload above that closes the socket: HA's frontend reconnects, every
   view's pending call fails, and the toast in the old panel would have said something
   meaningless. Cap at 3,000,000 raw bytes client-side (§2.1.4) and point to the folder. The
   backend's own 25 MB check only matters for files placed in the folder.
2. **`ingest` echoes the whole library's text** (`files[].chunk_texts`) because
   `ingest_directory_async` passes the executor result straight to `send_result`. For a 2,000-chunk
   library that is ~2 MB of JSON per click. Ignore the field, do not store it in `@state`, and
   avoid calling `ingest` on mount or on a timer. A backend fix (strip `chunk_texts` in
   `ws_documents`) is a one-liner outside this view; note it for Phase 3 backend work.
3. **Long-running calls, no cancel.** `ingest` with semantic search embeds every chunk (32 per
   Ollama call, 60 s timeout each); `enable`/`test` against an unreachable host take up to ~120 s
   (two 60 s timeouts). `hass.callWS` has no client timeout, so the promise simply waits; keep the
   pending state honest and disable the sibling buttons (§4). If HA reconnects meanwhile the
   pending promise rejects (Risk 10).
4. **`status` shows the index, not the folder.** An uploaded file that failed extraction
   (`ok: false` with `filename`) is on disk but never listed and cannot be deleted from the UI
   (delete would work by name, but there is no row). Same for a scanned PDF dropped in the
   folder: the 10-minute tick retries it forever and logs nothing visible here. Surface the
   per-file errors in the banner (§3.1) so the user at least sees why.
5. **Non-ASCII names break delete silently.** Files dropped into the folder manually keep their
   original names in the index (`ingest_file` uses `os.path.basename`), but `delete_source`
   sanitises the name first (`Händbuch.pdf` → `H_ndbuch.pdf`), purges nothing, finds no file and
   still answers `{ok: true}`. The view cannot detect this except by the row still being there
   after the re-fetch: if the deleted `source` is still present in the next `status`, show
   *Couldn't delete {name}: the file name contains characters the backend cannot address — rename
   it in the folder and re-index.* instead of the success banner. Uploads are safe (the name is
   sanitised before it is stored, and the returned `filename` is what the index holds).
6. **`ollama_configured` is always true** (default-host fallback), so there is no "not
   configured" state; a wrong host surfaces only through the probe error. Always show `base`.
7. **`enable` leaves the setting on when the probe fails** (`enabled: true, ok: false`). The
   badge must follow `enabled`, not `ok`; the alert explains. Conversation retrieval then tries
   Ollama on every query and falls back to keyword after the timeout — a slow JARVIS until fixed
   or disabled; say so in the warning (*Until Ollama answers, searches fall back to keyword after a
   delay.* — add this sentence to the A7 failure alert).
8. **Semantic search enabled ≠ semantic results.** With `vector_count === 0` (enabled, never
   re-indexed) every search answers `engine: "keyword"`; the warn badge + inline Ingest button in
   3.3 exist for this. Likewise `disable` keeps the vectors, so `vector_count` stays > 0 while
   `enabled` is false — the badge logic in §2.2.1 handles it.
9. **Two editors for `semantic_search`.** Settings → Learning has the switch and this view has
   Enable/Disable; the switch writes through `jarvis/update_config`, the buttons through
   `jarvis/semantic_search enable|disable`, and both land in `config_apply` (runtime_config +
   config.json + config-changed signal), so the stored value agrees. Neither view pushes to the other; the Settings view re-reads `config_schema` on its own
   schedule, and this view re-fetches `semantic_search status` on `visibilitychange`.
10. **Connection-loss rejections do not look like a backend error.** When the socket drops (which
    an oversized upload causes) home-assistant-js-websocket rejects every pending call with
    `ERR_CONNECTION_LOST` (= 3): older releases reject with the bare number, current ones with
    `{type: "result", success: false, error: {code: 3, message: "Connection lost"}}`. Through
    `WsError.from` that becomes either `code: "unknown_error", message: "3"` or `code: "3",
    message: "Connection lost"` (not verified against a vendored copy — the library is not in
    `frontend/node_modules`; HA supplies it at runtime). Treat `code === "3"`, an empty message or
    an all-digit message as "connection interrupted" (§4 rules) and re-run A11 once `hass` is
    replaced, since HA reconnects by itself.
11. **Per-action fixtures do not exist** (§8): the harness cannot show a failed upload or a
    disabled engine without editing the fixture; both themes still must be checked with the union
    fixture, and the smoke test only proves the happy path renders.
12. **`chunk` is a string from FTS** and a number elsewhere; `score` is `null` from FTS and can
    be negative from chroma. Format defensively (`Number(chunk)`, hide score unless semantic and
    `> 0`).
13. **Memory-search scores are not comparable across backends** (`abs(rank) * 0.1` for FTS is an
    arbitrary magnitude); show percentages only for `pgvector`/`chromadb`, and note that
    `memory_stats.backend` comes from the snapshot (20 s refresh) while results come live — a
    just-switched backend can mislabel one search.
14. **Timestamps:** document `ingested` and memory `timestamp` are naive UTC (append `"Z"`),
    except pgvector which may already carry an offset — the regex guard in §3.4 covers both.
15. **Overwrite on upload is silent** (same sanitised name → file replaced, chunks replaced). The
    banner shows the stored `filename`; if it already existed in the previous `status.sources`,
    say *replaced* instead of *uploaded* (client-side check, cheap).
16. **Sort order from FTS is undefined**; always sort `sources` client-side (§3.1).
17. **Contract test**: `tests/unit/test_ws_contract.py` extracts every `"jarvis/[a-z_]+"` string
    literal from `frontend/src` and requires it to be registered and present in the committed
    bundle. Write the three command names as plain string literals (they are all registered);
    do not build them dynamically, and rebuild the bundle before handing over.
18. **The tab itself.** Done: `src/views/index.ts` registers `{ key: "documents", title:
    "Documents", icon: "mdi:file-document-multiple-outline", element: "jarvis-view-documents" }` after
    `memory`. Settings → Learning's "Elsewhere in the panel" card links here ("Document Library").

### 9.1 Ownership

The view agent owns `src/views/documents.ts`, `src/views/documents/**` and the three fixtures in
§8. It does not edit `src/views/index.ts` (the registration of §9.18 is in place),
`src/components/*`, `src/theme/*`, the i18n dictionaries, or `websocket.py`.
