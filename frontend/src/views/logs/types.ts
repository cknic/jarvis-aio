/**
 * Response shapes of the WebSocket commands the logs view calls. Every
 * field is optional on purpose: the backend is the source of truth and some
 * handlers (get_calibration, get_cognitive_status) answer a partial payload
 * with an `error` field instead of rejecting. See frontend/specs/logs.md.
 */

/** jarvis/get_debug_log -> {entries} (oldest -> newest, <= 500) */
export interface DebugEntry {
  date: string;
  ts: string;
  cat: string;
  msg: string;
}
export interface DebugLogResponse {
  entries?: DebugEntry[];
}

/** jarvis/get_activity_log {hours, limit} -> {entries} (newest first) */
export interface ActivityEntry {
  ts: string;
  urgency?: string;
  tag?: string;
  msg?: string;
  source?: string;
}
export interface ActivityResponse {
  entries?: ActivityEntry[];
}

/** jarvis/diagnostics */
export interface ServiceRow {
  name: string;
  key: string;
  status: string;
  detail?: string;
  [extra: string]: unknown;
}
export interface DiagnosticsResponse {
  overall?: string;
  summary?: string;
  services?: ServiceRow[];
}

/** jarvis/get_calibration (never rejects; `error` on the fallback payload) */
export interface CalibrationBin {
  lo: number;
  hi: number;
  count: number;
  mean_confidence: number | null;
  good_rate: number | null;
}
export interface CalibrationResponse {
  calibration?: {
    n?: number;
    good_rate?: number | null;
    brier?: number | null;
    ece?: number | null;
    kind?: string | null;
    bins?: CalibrationBin[];
  };
  interruption_budget?: {
    window_s?: number;
    judged?: number;
    good?: number;
    unnecessary?: number;
    wrong?: number;
    unwelcome_rate?: number | null;
    multiplier?: number;
    assessment?: string;
  };
  stats?: { total?: number; judged?: number; good?: number; unnecessary?: number; wrong?: number };
  suggestion?: Record<string, unknown>;
  suggestion_threshold?: { base: number; effective: number; learned_delta: number };
  error?: string;
}

/** jarvis/get_cognitive_status (never rejects; `error` on the fallback payload) */
export interface CognitiveStatus {
  running?: boolean;
  tick_count?: number;
  actions_taken?: number;
  offers_made?: number;
  autonomous_actions?: number;
  uptime_hours?: number;
  last_tick_ago?: number;
  ignore_rules?: number;
  learning?: {
    state_changes?: number;
    commands?: number;
    suggestions?: number;
    patterns?: number;
    days_of_data?: number;
  };
  last_analysis?: {
    ts?: number;
    patterns_found?: number;
    new_suggestions?: number;
    person_routines?: number;
    facts?: number;
    near_misses?: unknown;
  };
  certification?: Record<string, unknown>;
  error?: string;
}

/** jarvis/get_enforcement -> {switches}; jarvis/set_enforcement -> {switch} */
export interface EnforcementSwitch {
  key: string;
  name: string;
  explanation: string;
  category: string;
  phase: string;
  default: boolean;
  enabled: boolean;
  overridden: boolean;
}
export interface EnforcementResponse {
  switches?: EnforcementSwitch[];
}
export interface SetEnforcementResponse {
  switch?: EnforcementSwitch;
}
