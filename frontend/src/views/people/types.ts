/**
 * Wire shapes for the people view (frontend/specs/people.md §2). They mirror
 * what websocket.py's ws_faces / ws_face_reference / ws_camera_snapshot /
 * ws_voices / ws_biometrics pass to connection.send_result. The backend is
 * the source of truth; every field a view reads is guarded in format.ts.
 */

export type Relationship = "resident" | "guest" | "unknown";

/** One row of FacesResponse.recent (recognition.recent_faces). */
export interface FaceRow {
  name: string;
  camera_entity: string;
  camera: string;
  confidence: number;
  /** int seconds; 1_000_000_000 for Frigate-sensor rows without a timestamp */
  age_seconds: number;
  is_unknown: boolean;
  is_resident: boolean;
  relationship: Relationship | string;
  /** "/api/jarvis/snapshot/faces/<file>.jpg" - MUST be signed before use */
  snapshot_url: string | null;
  is_low_confidence: boolean;
  source: "recent_cache" | "frigate_sensor" | "llm_guess" | "best_effort_unknown" | string;
}

export interface FacesResponse {
  recent?: FaceRow[];
  residents?: string[];
  /** normalised names that have a reference photo */
  references?: string[];
  llm_face_recognition?: boolean;
  recognition_source?: string;
}

export interface FacesState {
  recent: FaceRow[];
  residents: string[];
  references: string[];
  llmFaceRecognition: boolean;
  recognitionSource: string;
}

export interface ImageResponse {
  image?: string | null;
}

export interface VoiceProfile {
  name: string;
  count: number;
  /** epoch seconds (float), 0 when unknown */
  updated: number;
}

export interface VoiceMatch {
  name: string;
  score: number;
  similarity: number;
  count: number;
  trusted: boolean;
}

export interface VoicesResponse {
  profiles?: VoiceProfile[];
  current?: VoiceMatch | null;
  local_enabled?: boolean;
  delegate_stt?: string;
  model_path?: string;
  backend_available?: boolean;
  /** only on action:"identify" */
  match?: VoiceMatch | null;
}

export interface VoicesState {
  profiles: VoiceProfile[];
  current: VoiceMatch | null;
  localEnabled: boolean;
  delegateStt: string;
  modelPath: string;
  backendAvailable: boolean;
}

export interface BiometricEntity {
  kind: string;
  entity: string;
  value: string;
  unit: string;
  name: string;
}

export interface BiometricsResponse {
  enabled?: boolean;
  found?: number;
  entities?: BiometricEntity[];
}

export interface BiometricsState {
  enabled: boolean;
  found: number;
  entities: BiometricEntity[];
}

/** The model a <jarvis-face-card> renders (spec §3.6). */
export interface FaceCardModel {
  name: string;
  relation: Relationship;
  lowConf: boolean;
  cameraEntity: string;
  cameraLabel: string;
  confidence: number;
  /** null = not seen / no timestamp */
  ageSeconds: number | null;
  /** unsigned /api/ path */
  snapshotUrl: string | null;
  hasReference: boolean;
  canCaptureFromSighting: boolean;
  labelable: boolean;
  actions: Array<"make_resident" | "remove_resident">;
}

export interface CameraOption {
  entity: string;
  label: string;
}

/** What a face card asks the view to do. */
export type FaceActionDetail =
  | { action: "make_resident"; name: string }
  | { action: "remove_resident"; name: string }
  | { action: "remove_photo"; name: string }
  | { action: "set_photo"; name: string; file: File }
  | { action: "from_sighting"; name: string; src: string | null; cameraEntity: string }
  | { action: "snapshot_now"; name: string; cameraEntity: string }
  | { action: "label"; name: string; src: string | null; cameraEntity: string }
  | { action: "enlarge"; name: string; src: string | null; cameraEntity: string; caption: string };

/** Per-card async state. */
export interface Loadable<T> {
  status: "idle" | "loading" | "loaded" | "error";
  data: T | null;
  error: string | null;
  code: string | null;
}

export function idle<T>(): Loadable<T> {
  return { status: "idle", data: null, error: null, code: null };
}
