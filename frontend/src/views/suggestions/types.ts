/**
 * Wire shapes for the suggestions view (see frontend/specs/suggestions.md).
 * Everything is read defensively: the backend never raises, but fields may be
 * missing, "" or 0, so every accessor in format.ts tolerates that.
 */

export interface Suggestion {
  id: number;
  created?: string;
  description?: string;
  /** JSON text (despite the name) or "" */
  yaml?: string;
  confidence?: number;
  count?: number;
  pattern_type?: string;
  entities?: string[];
  why_headline?: string;
  evidence?: string[];
}

export interface GoalStep {
  n: number;
  step: string;
  status: "pending" | "done" | "failed" | "skipped" | string;
  note?: string;
}

export interface Goal {
  id: number;
  title?: string;
  outcome?: string;
  status?: "active" | "done" | "failed" | "cancelled" | string;
  steps_done?: number;
  steps_total?: number;
  steps?: GoalStep[];
  next_check_ts?: string;
  deadline_ts?: string | null;
  last_result?: string;
  updated_ts?: string;
}

export interface SuggestionActionResult {
  ok?: boolean;
  installed?: boolean;
  reason?: string | null;
  alias?: string | null;
}

export interface GoalActionResult {
  ok?: boolean;
  goals?: Goal[];
}

export interface NearMiss {
  type?: string;
  description?: string;
  occurrences?: number;
  needed?: number | null;
}

export interface CognitiveStatus {
  running?: boolean;
  error?: string;
  learning?: {
    state_changes?: number;
    commands?: number;
    suggestions?: number;
    patterns?: number;
    days_of_data?: number;
  };
  ignore_rules?: number;
  last_analysis?: {
    ts?: number;
    patterns_found?: number;
    new_suggestions?: number;
    person_routines?: number;
    facts?: number;
    near_misses?: NearMiss[];
  };
}

export interface AnalysisResult {
  ran?: boolean;
  reason?: string;
  error?: string;
  ts?: number;
  patterns_found?: number;
  new_suggestions?: number;
  person_routines?: number;
  facts?: number;
  near_misses?: NearMiss[];
  state_changes?: number;
  days_of_data?: number;
  backfill?: { imported?: number; entities?: number; considered?: number };
  diagnostic?: {
    top_sources?: Array<{ entity_id: string; changes: number }>;
    candidates?: Array<{ entity_id: string; state: string; hour: number; occurrences: number; days: number; coverage: number }>;
    total_days?: number;
    min_days?: number;
    min_occurrences?: number;
  };
}

/** Detail of the "jv-toast" event the sub-cards dispatch; the view shows it. */
export interface ToastDetail {
  message: string;
  tone?: "ok" | "danger" | "neutral";
}
