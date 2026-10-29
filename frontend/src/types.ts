/**
 * Shared types. `Hass` is the subset of Home Assistant's `hass` object the
 * panel relies on; `PanelData` is the `jarvis/get_panel_data` snapshot
 * (panel_data.build_snapshot + websocket.py's `config` block). Both are kept
 * loose (index signatures) on purpose: the backend is the source of truth and
 * views read what they need. Spec agents document the exact per-view shapes in
 * frontend/specs/<view>.md.
 */

export interface WsMessage {
  type: string;
  [key: string]: unknown;
}

export interface HassConnection {
  subscribeEvents?<T = unknown>(
    callback: (event: T) => void,
    eventType?: string,
  ): Promise<() => Promise<void> | void>;
  subscribeMessage?<T = unknown>(
    callback: (message: T) => void,
    message: WsMessage,
  ): Promise<() => Promise<void> | void>;
}

export interface HassEntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed?: string;
  last_updated?: string;
}

export interface Hass {
  callWS<T = unknown>(message: WsMessage): Promise<T>;
  callService?(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: Record<string, unknown>,
  ): Promise<unknown>;
  language?: string;
  locale?: { language?: string; number_format?: string; time_format?: string };
  themes?: { darkMode?: boolean; theme?: string };
  user?: { id?: string; name?: string; is_admin?: boolean };
  states?: Record<string, HassEntityState>;
  config?: Record<string, unknown>;
  connection?: HassConnection;
  localize?: (key: string, ...args: unknown[]) => string;
  dockedSidebar?: "docked" | "always_hidden" | "auto";
  [key: string]: unknown;
}

/** HA passes `route = {prefix: "/jarvis", path: "/<view>[/...]"}`. */
export interface Route {
  prefix: string;
  path: string;
}

export interface PanelInfo {
  config?: Record<string, unknown> | null;
  url_path?: string;
  title?: string | null;
  icon?: string | null;
  [key: string]: unknown;
}

export type StatusLevel = "live" | "warn" | "off";

export interface StatusTile {
  state: string;
  level: StatusLevel;
}

export interface AreaRow {
  id: string;
  name: string;
  caps: string[];
  active: boolean;
  bedroom: boolean;
  lights_on: number;
  lights_total: number;
  temp: string | null;
  humidity: string | null;
  temp_entity: string | null;
  humidity_entity: string | null;
  last_motion: string | null;
  [key: string]: unknown;
}

export interface DominantRoom {
  area_id: string | null;
  name: string;
  subtitle: string;
  coord: string;
  temp: string;
  humidity: string;
  lights: string;
  satellite: string;
  last_motion: string;
}

export interface PanelData {
  status: Record<string, StatusTile>;
  version?: string;
  meta: {
    bedrooms: number;
    areas_monitored: number;
    announcements_today: number;
    est_cost: string;
    uptime: string;
    [key: string]: unknown;
  };
  dominant: DominantRoom;
  areas: AreaRow[];
  sleep_reason?: string | null;
  doorbell_training?: Record<string, unknown>;
  doors?: Record<string, unknown>;
  lockdown?: { active: boolean; since?: number; reason?: string; auto?: boolean; [k: string]: unknown };
  intrusion?: { active: boolean; confirmed?: boolean; [k: string]: unknown };
  knowledge?: Record<string, unknown>;
  suggestions?: Array<Record<string, unknown>>;
  goals?: Array<Record<string, unknown>>;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

/** The `jarvis/config_schema` response (admin-only, no arguments). */
export type FieldKind = "bool" | "int" | "float" | "enum" | "str" | "list" | "json";

export interface FieldOption {
  value: string;
  label: string;
}

export interface ConfigField {
  key: string;
  kind: FieldKind;
  label: string;
  category: string;
  default: unknown;
  options: Array<FieldOption | string> | null;
  min: number | null;
  max: number | null;
  step: number | null;
  expose: boolean;
}

export interface ConfigSchema {
  fields: ConfigField[];
  values: Record<string, unknown>;
  categories: string[];
}

/** Events views dispatch (bubbles + composed) and the panel handles. */
export interface JarvisNavigateDetail {
  view: string;
  /** optional sub-path under the view, e.g. "cameras" -> /jarvis/settings/cameras */
  path?: string;
}
