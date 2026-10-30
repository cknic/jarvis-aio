/**
 * Wire shapes for the documents view (frontend/specs/documents.md §2). They
 * mirror what websocket.py's ws_documents / ws_semantic_search /
 * ws_search_memory pass to connection.send_result. The backend is the source
 * of truth, so every field the view reads is treated as optional-safe.
 */

import type { TemplateResult } from "lit";

// ── jarvis/documents ────────────────────────────────────────────────────────

export interface DocSource {
  /** file name as indexed (basename) */
  source: string;
  chunks: number;
}

/** action: "status" */
export interface DocStatus {
  chroma: boolean;
  fts: boolean;
  directory: string;
  chunk_count: number;
  sources: DocSource[];
}

export interface IngestFile {
  source: string;
  chunks: number;
  ok: boolean;
  error?: string;
  ingested?: string;
  // chunk_texts is deliberately not declared: never read or stored (Risk 2)
}

/** action: "ingest" */
export interface IngestResult {
  ok: boolean;
  error?: string;
  directory?: string;
  files_seen?: number;
  files_ingested?: number;
  total_chunks?: number;
  files?: IngestFile[];
  semantic?: boolean;
  embedded_files?: number;
  embedded_chunks?: number;
  semantic_error?: string;
}

export interface DocHit {
  text: string;
  source: string;
  /** number from vectors/chroma, STRING from FTS */
  chunk: number | string;
  /** semantic: 0..1; chroma: may be < 0; FTS: null */
  score: number | null;
  engine: "semantic" | "keyword" | string;
}

/** action: "search" */
export interface DocSearchResult {
  results?: DocHit[];
}

/** action: "upload" */
export interface UploadResult {
  ok: boolean;
  /** the sanitised name actually stored */
  filename?: string;
  chunks?: number;
  embedded?: number;
  semantic_note?: string;
  error?: string;
}

export interface ScanFile {
  /** original basename in the watch folder */
  source: string;
  ok: boolean;
  /** name stored in the documents folder */
  filename: string;
  chunks: number;
  error?: string;
}

/** action: "scan_watch" */
export interface ScanResult {
  ok: boolean;
  watched: number;
  new_files: number;
  note?: string;
  files?: ScanFile[];
}

/** action: "delete" */
export interface DeleteResult {
  ok: boolean;
  filename?: string;
  error?: string;
}

// ── jarvis/semantic_search ──────────────────────────────────────────────────

/** action: "status" */
export interface EngineStatus {
  enabled: boolean;
  ollama_configured: boolean;
  vector_count: number;
  base?: string;
  model?: string;
}

/** action: "enable" | "test" (and "disable", which only carries ok/enabled) */
export interface ProbeResult {
  ok: boolean;
  model?: string;
  base?: string;
  dim?: number;
  error?: string;
  enabled?: boolean;
}

// ── jarvis/search_memory ────────────────────────────────────────────────────

export interface MemoryHit {
  text: string;
  /** "user" | "assistant" | "" */
  role: string;
  /** iso-naive-utc, or with an offset (pgvector), or "" */
  timestamp: string;
  /** vector backends: 0..1; FTS: abs(rank) * 0.1 (not a percentage) */
  score: number;
}

export interface MemorySearchResult {
  results?: MemoryHit[];
}

/** data.config.memory_stats from the snapshot */
export interface MemoryStats {
  backend?: string;
  total_memories?: number;
  last_consolidated?: string;
}

// ── view-local state ────────────────────────────────────────────────────────

export type AlertTone = "success" | "warning" | "error" | "info";

export interface Problem {
  source: string;
  error: string;
}

/** The library card's result banner (one per operation). */
export interface Banner {
  tone: AlertTone;
  /** one line each; backend text inside is rendered verbatim in <code> */
  lines: Array<string | TemplateResult>;
  problems?: Problem[];
  /** an inline follow-up the banner offers */
  action?: "watch-folders";
}

export type BusyKind = "upload" | "ingest" | "scan" | "enable" | "disable" | "test";

/** Per-card async state; data survives a re-fetch so lists never flash. */
export interface Loadable<T> {
  status: "idle" | "loading" | "loaded" | "error";
  data: T | null;
  error: string | null;
}

export function idle<T>(): Loadable<T> {
  return { status: "idle", data: null, error: null };
}
