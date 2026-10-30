/**
 * Pure helpers for the documents view: error normalisation (incl. the
 * connection-lost rule of spec §4 / Risk 10), upload validation and base64
 * encoding, sorting, labels and timestamps. No DOM rendering here.
 */
import { t } from "../../i18n";
import type { DocSource, DocStatus, EngineStatus } from "./types";

/** documents.py _SUPPORTED, compared lower-cased */
export const SUPPORTED_EXTENSIONS = [".pdf", ".txt", ".md"] as const;

/**
 * Client-side upload cap (spec §2.1.4 / Risk 1): HA's WebSocket closes on any
 * inbound frame over 4 MiB, and base64 inflates by 4/3 plus the JSON envelope.
 */
export const MAX_UPLOAD_BYTES = 3_000_000;

export function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function extensionOf(name: string): string {
  const m = /\.[^./\\]+$/.exec(String(name || ""));
  return m ? m[0].toLowerCase() : "";
}

export function isSupportedFile(name: string): boolean {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(extensionOf(name));
}

/**
 * Mirror of documents.py `_safe_filename` (basename, chars outside
 * [A-Za-z0-9._ \-()] -> "_", strip leading/trailing "." and " ", 180 chars).
 * Returns null where the backend would reject the name.
 */
export function backendSafeName(name: string): string | null {
  const raw = String(name || "").replace(/\\/g, "/").trim();
  const baseName = raw.slice(raw.lastIndexOf("/") + 1);
  const safe = baseName.replace(/[^A-Za-z0-9._ \-()]/g, "_").replace(/^[. ]+|[. ]+$/g, "");
  if (!safe || safe === "." || safe === ".." || !isSupportedFile(safe)) return null;
  return safe.slice(0, 180);
}

/** true when `delete` cannot address this indexed name (spec Risk 5) */
export function deleteCannotAddress(source: string): boolean {
  return backendSafeName(source) !== source;
}

/** mdi icon by extension (decorative) */
export function fileIcon(name: string): string {
  switch (extensionOf(name)) {
    case ".pdf":
      return "mdi:file-pdf-box";
    case ".md":
      return "mdi:language-markdown";
    default:
      return "mdi:file-document-outline";
  }
}

/** FTS returns GROUP BY order; always sort client-side (Risk 16). */
export function sortSources(sources: unknown): DocSource[] {
  const list = Array.isArray(sources) ? (sources as DocSource[]) : [];
  return list
    .filter((s) => s && typeof s === "object" && typeof s.source === "string")
    .map((s) => ({ source: s.source, chunks: num(s.chunks) }))
    .sort((a, b) => a.source.localeCompare(b.source));
}

/** Normalise a status response (every field defensively). */
export function normaliseStatus(res: unknown): DocStatus {
  const o = (res && typeof res === "object" ? res : {}) as Partial<DocStatus>;
  return {
    chroma: !!o.chroma,
    fts: !!o.fts,
    directory: typeof o.directory === "string" ? o.directory : "",
    chunk_count: num(o.chunk_count),
    sources: sortSources(o.sources),
  };
}

export function normaliseEngine(res: unknown): EngineStatus {
  const o = (res && typeof res === "object" ? res : {}) as Partial<EngineStatus>;
  return {
    enabled: !!o.enabled,
    ollama_configured: !!o.ollama_configured,
    vector_count: num(o.vector_count),
    base: typeof o.base === "string" ? o.base : "",
    model: typeof o.model === "string" ? o.model : "",
  };
}

/** The `{engine}` value of the library subheading. */
export function indexLabel(status: DocStatus): string {
  if (status.chroma) return t("Vector index (ChromaDB)");
  if (status.fts) return t("Keyword index");
  return t("No index");
}

export function chunksLabel(n: unknown): string {
  const v = num(n);
  return v === 1 ? t("1 chunk") : t("{count} chunks", { count: v });
}

/** 0..100, clamped (chroma scores may be negative). */
export function scorePct(score: unknown): number {
  return Math.max(0, Math.min(100, Math.round(num(score) * 100)));
}

/**
 * A connection-loss rejection does not look like a backend error (Risk 10):
 * home-assistant-js-websocket rejects with ERR_CONNECTION_LOST (3), seen as
 * code "3", an empty message or a purely numeric one.
 */
export function isConnectionLost(err: unknown): boolean {
  let code = "";
  let msg = "";
  if (err && typeof err === "object") {
    const o = err as { code?: unknown; message?: unknown };
    code = o.code === undefined || o.code === null ? "" : String(o.code);
    msg = typeof o.message === "string" ? o.message : o.message === undefined || o.message === null ? "" : String(o.message);
  } else if (err !== undefined && err !== null) {
    msg = String(err);
  }
  msg = msg.trim();
  return code === "3" || !msg || /^\d+$/.test(msg);
}

/** The text to show for a rejected call: `err.message`, or the interruption fallback. */
export function errorMessage(err: unknown): string {
  if (isConnectionLost(err)) return t("the connection was interrupted");
  const o = err as { message?: unknown };
  return typeof o.message === "string" ? o.message.trim() : String(err);
}

/**
 * Timestamps are naive UTC without "Z" (chroma/FTS) or may carry an offset
 * (pgvector). Returns "" when empty or unparseable.
 */
export function tsToLocale(ts: unknown, locale?: string): string {
  if (typeof ts !== "string") return "";
  const s = ts.trim();
  if (!s) return "";
  const zoned = s.endsWith("Z") || /[+-]\d\d:\d\d$/.test(s);
  const d = new Date(zoned ? s : `${s}Z`);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleString(locale || undefined);
  } catch {
    return d.toLocaleString();
  }
}

/** Only pgvector/chromadb scores are similarities (Risk 13). */
export function isVectorBackend(backend: unknown): boolean {
  return backend === "pgvector" || backend === "chromadb";
}

/** Read a File as bare base64 (no data: prefix). */
export async function readBase64(file: Blob): Promise<string> {
  if (typeof FileReader !== "undefined") {
    const viaReader = await new Promise<string | null>((resolve) => {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const out = typeof reader.result === "string" ? reader.result : "";
          const i = out.indexOf(",");
          resolve(i >= 0 ? out.slice(i + 1) : null);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      } catch {
        resolve(null);
      }
    });
    if (viaReader !== null) return viaReader;
  }
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  const STEP = 0x8000;
  for (let i = 0; i < buf.length; i += STEP) {
    bin += String.fromCharCode(...buf.subarray(i, i + STEP));
  }
  return btoa(bin);
}

/** A rough "is this long enough to clamp" test; measurement is unreliable under jsdom. */
export function isLongText(text: string): boolean {
  if (!text) return false;
  if (text.length > 280) return true;
  const lines = text.split("\n").length;
  return lines > 4;
}
