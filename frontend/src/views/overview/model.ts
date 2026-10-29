/**
 * Overview view - wire types, display mappings and small helpers shared by
 * src/views/overview.ts and src/views/overview/*.ts. Shapes follow
 * frontend/specs/overview.md (sections 2.1 - 2.6).
 */
import type { PanelData } from "../../types";
import { WsError } from "../../ws";
import { t } from "../../i18n";

// ── wire types ───────────────────────────────────────────────────────────────

export interface LockdownState {
  active: boolean;
  since: number;
  reason: string;
  auto: boolean;
  arm_mode?: string;
  exempt_windows: number;
}

export interface ModeInfo {
  active: string;
  since: number;
  reason: string;
  description: string;
  overrides?: Record<string, unknown>;
  available: { name: string; description: string }[];
}

/** `jarvis/mode action:set` = set_mode result merged with mode_info(). */
export interface ModeSetResult extends Partial<ModeInfo> {
  ok?: boolean;
  mode?: string;
  error?: string;
}

export interface SetLockdownResult {
  ok?: boolean;
  lockdown?: Partial<LockdownState>;
}

export interface AreaLight {
  entity_id: string;
  name: string;
  on: boolean;
}

export interface AreaLightsResult {
  area_id: string;
  name: string;
  lights: AreaLight[];
}

/** The handful of config keys this view reads (never store `config` wholesale). */
export interface OverviewConfig {
  lightControl: boolean;
  autoMode: boolean;
  notifyService: string;
  satelliteNames: string[];
}

export type TileLevel = "ok" | "warn" | "off" | "danger";

export interface Tile {
  key: string;
  label: string;
  value: string;
  secondary: string;
  level: TileLevel;
}

// ── capabilities ─────────────────────────────────────────────────────────────

export const CAP_ICONS: Record<string, string> = {
  sat: "mdi:microphone",
  spkr: "mdi:speaker",
  mmwave: "mdi:motion-sensor",
  cam: "mdi:cctv",
  light: "mdi:lightbulb",
  switch: "mdi:toggle-switch",
  lock: "mdi:lock",
  climate: "mdi:thermostat",
  door: "mdi:door",
  leak: "mdi:water-alert",
  alarm: "mdi:smoke-detector",
};

const CAP_LABELS: Record<string, string> = {
  sat: "Satellite",
  spkr: "Speaker",
  mmwave: "Presence",
  cam: "Camera",
  light: "Lights",
  switch: "Switch",
  lock: "Lock",
  climate: "Climate",
  door: "Door",
  leak: "Leak",
  alarm: "Alarm",
};

export function capLabel(code: string): string {
  const label = CAP_LABELS[code];
  return label ? t(label) : code;
}

// ── normalisers ──────────────────────────────────────────────────────────────

export const EMPTY_LOCKDOWN: LockdownState = { active: false, since: 0, reason: "", auto: false, exempt_windows: 0 };

export function normalizeLockdown(raw: unknown): LockdownState {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    active: !!o.active,
    since: typeof o.since === "number" ? o.since : 0,
    reason: typeof o.reason === "string" ? o.reason : "",
    auto: !!o.auto,
    arm_mode: typeof o.arm_mode === "string" ? o.arm_mode : undefined,
    exempt_windows: typeof o.exempt_windows === "number" ? o.exempt_windows : 0,
  };
}

export function pickConfig(config: Record<string, unknown> | undefined | null): OverviewConfig {
  const c = config ?? {};
  const sats = Array.isArray(c.satellites) ? (c.satellites as Array<Record<string, unknown>>) : [];
  return {
    lightControl: c.light_control_enabled !== false,
    autoMode: c.operational_mode_auto !== false,
    notifyService: typeof c.notify_service === "string" ? c.notify_service : "",
    satelliteNames: sats.map((s) => String(s?.name || s?.entity_id || "")).filter(Boolean),
  };
}

export function pickMode(raw: Partial<ModeInfo> | null | undefined): ModeInfo | null {
  if (!raw || typeof raw.active !== "string" || !Array.isArray(raw.available)) return null;
  return {
    active: raw.active,
    since: typeof raw.since === "number" ? raw.since : 0,
    reason: typeof raw.reason === "string" ? raw.reason : "",
    description: typeof raw.description === "string" ? raw.description : "",
    available: raw.available
      .map((m) => (typeof m === "string" ? { name: m, description: "" } : m))
      .filter((m) => m && typeof m.name === "string"),
  };
}

/** "—" (backend placeholder), null and "" all mean "no value". */
export function dash(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return !s || s === "—" ? null : s;
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Compact relative duration from an epoch-seconds timestamp ("4m", "2h", "3d"). */
export function relTime(epochS: number, nowMs: number = Date.now()): string {
  if (!epochS || !Number.isFinite(epochS)) return "";
  const diff = Math.max(0, Math.floor(nowMs / 1000 - epochS));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

/** Message for a failed call; `unauthorized` gets the admin hint. */
export function errMsg(err: unknown): string {
  if (err instanceof WsError) {
    if (err.code === "unauthorized") return t("Administrator privileges are required for this action");
    return err.message || err.code;
  }
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return String(err ?? "");
}

// ── events ───────────────────────────────────────────────────────────────────

/** HA's standard toast. */
export function toast(from: EventTarget, message: string): void {
  from.dispatchEvent(new CustomEvent("hass-notification", { detail: { message }, bubbles: true, composed: true }));
}

export function requestRefresh(from: EventTarget, delayMs = 0): void {
  const fire = () => from.dispatchEvent(new CustomEvent("jarvis-refresh", { bubbles: true, composed: true }));
  if (delayMs > 0) setTimeout(fire, delayMs);
  else fire();
}

// ── status tiles (spec 3.2) ──────────────────────────────────────────────────

const READY_RE = /^(\d+) READY$/;
const SATS_RE = /^(\d+) \/ (\d+)$/;

function level(l: string | undefined): TileLevel {
  return l === "live" ? "ok" : l === "warn" ? "warn" : "off";
}

export function statusTiles(d: PanelData, lockdown: LockdownState, cfg: OverviewConfig): Tile[] {
  const s = d.status ?? {};
  const tiles: Tile[] = [];
  const tile = (key: string, label: string, value: string, lvl: TileLevel, secondary = "") =>
    tiles.push({ key, label, value, level: lvl, secondary });

  const sleep = s.sleep;
  if (sleep) {
    const v = sleep.state === "AWAKE" ? t("Awake") : sleep.state === "ASLEEP" ? t("Asleep") : sleep.state;
    tile("sleep", t("Sleep"), v, level(sleep.level), sleep.state === "ASLEEP" ? d.sleep_reason || "" : "");
  }
  const obs = s.observer;
  if (obs) {
    const map: Record<string, string> = { RUNNING: t("Running"), READY: t("Ready"), DISABLED: t("Disabled") };
    tile("observer", t("Observer"), map[obs.state] ?? obs.state, level(obs.level));
  }
  const llm = s.llm_providers;
  if (llm) {
    const m = READY_RE.exec(llm.state);
    const v = m ? t("{n} ready", { n: m[1] }) : llm.state === "UNSET" ? t("Not set") : llm.state;
    tile("llm", t("LLM Providers"), v, level(llm.level));
  }
  tile(
    "lockdown",
    t("Lockdown"),
    lockdown.active ? t("Engaged") : t("Off"),
    lockdown.active ? "danger" : "off",
    lockdown.active ? lockdown.reason : "",
  );
  const sats = s.satellites;
  if (sats) {
    const m = SATS_RE.exec(sats.state);
    const v = m ? t("{a} / {b} online", { a: m[1], b: m[2] }) : sats.state === "NONE" ? t("None") : sats.state;
    const names = cfg.satelliteNames;
    const sec = names.length ? names.slice(0, 3).join(", ") + (names.length > 3 ? ` +${names.length - 3}` : "") : "";
    tile("satellites", t("Satellites"), v, level(sats.level), sec);
  }
  const notify = s.notify;
  if (notify) {
    const v = notify.state === "READY" ? cfg.notifyService || t("Ready") : notify.state === "UNSET" ? t("Not set") : notify.state;
    tile("notify", t("Notify target"), v, level(notify.level));
  }
  const bc = s.broadcast;
  if (bc) {
    const v = bc.state === "ONLINE" ? t("Online") : bc.state === "UNSET" ? t("Not set") : bc.state;
    tile("broadcast", t("Broadcast"), v, level(bc.level));
  }
  return tiles;
}

/** Domains whose state changes nudge a snapshot refetch (spec 2.1). */
export const NUDGE_DOMAINS = new Set([
  "light",
  "lock",
  "cover",
  "climate",
  "sensor",
  "binary_sensor",
  "person",
  "device_tracker",
  "alarm_control_panel",
]);
