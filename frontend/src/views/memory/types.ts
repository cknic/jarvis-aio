/**
 * Wire shapes for the memory view (see frontend/specs/memory.md §2). These
 * mirror what websocket.py's handlers pass to connection.send_result; the
 * backend is the source of truth, so every field a view reads is optional-safe
 * in format.ts.
 */

export type FactKind = "fact" | "preference" | "event" | "profile";
export type FactSource = "stated" | "observed" | "inferred";

/** One curated fact from knowledge.db (jarvis/get_knowledge). */
export interface Fact {
  id: number;
  kind: FactKind | string;
  /** "household" | "primary" | a normalized person id such as "sam_smith" */
  subject: string;
  key: string;
  value: string;
  source: FactSource | string;
  /** 0..1 */
  confidence: number;
  /** 0..1 */
  salience: number;
  /** epoch seconds */
  created_at: number;
  /** epoch seconds */
  updated_at: number;
  last_referenced: number | null;
  expires_at: number | null;
}

export interface KnowledgeStats {
  total: number;
  by_kind: Record<string, number>;
  by_subject: Record<string, number>;
}

export interface GetKnowledgeResult {
  facts?: Fact[];
  stats?: KnowledgeStats;
}

export interface AddKnowledgeResult {
  ok?: boolean;
  facts?: Fact[];
}

export interface ForgetKnowledgeResult {
  removed?: number;
  facts?: Fact[];
}

/** One learned per-person routine (jarvis/get_person_routines). */
export interface PersonRoutine {
  id: number | null;
  pattern_type: string;
  description: string;
  /** 0..1 */
  confidence: number;
  occurrences: number;
  /** naive ISO in the server's LOCAL time, or "" - not convertible */
  last_seen: string;
}

export interface PersonRoutinesResult {
  routines?: Record<string, PersonRoutine[]>;
}

/** One delivered briefing (jarvis/briefings). */
export interface Briefing {
  text: string;
  /** naive ISO in UTC without "Z", or null */
  timestamp: string | null;
}

export interface BriefingsResult {
  briefings?: Briefing[];
}

/** The two subjects the teach form offers (old-panel parity). */
export type TeachSubject = "household" | "primary";

/** Per-card async state; "empty" is only reachable after a successful load. */
export interface Loadable<T> {
  status: "idle" | "loading" | "loaded" | "error";
  data: T | null;
  error: string | null;
}

export function idle<T>(): Loadable<T> {
  return { status: "idle", data: null, error: null };
}
