/**
 * Typed wrappers around hass.callWS.
 *
 *   const data = await ws<PanelData>(hass, "jarvis/get_panel_data");
 *   await ws(hass, "jarvis/update_config", { key, value });
 *
 * HA rejects a failed command with a plain `{code, message}` object, not an
 * Error; `ws()` normalises that into a `WsError` so callers can show
 * `err.message` and branch on `err.code` ("unauthorized", "unknown_command",
 * "not_found", "timeout", ...).
 */
import type { Hass } from "./types";

export class WsError extends Error {
  readonly code: string;
  readonly command: string;
  override readonly cause?: unknown;

  constructor(command: string, code: string, message: string, cause?: unknown) {
    super(message);
    this.name = "WsError";
    this.command = command;
    this.code = code;
    this.cause = cause;
  }

  static from(command: string, err: unknown): WsError {
    if (err instanceof WsError) return err;
    if (err && typeof err === "object") {
      const o = err as { code?: unknown; message?: unknown; error?: { code?: unknown; message?: unknown } };
      const code = String(o.code ?? o.error?.code ?? "unknown_error");
      const message = String(o.message ?? o.error?.message ?? `${command} failed`);
      return new WsError(command, code, message, err);
    }
    return new WsError(command, "unknown_error", err ? String(err) : `${command} failed`, err);
  }
}

export async function ws<T = unknown>(
  hass: Hass | undefined | null,
  type: string,
  payload?: Record<string, unknown>,
): Promise<T> {
  if (!hass || typeof hass.callWS !== "function") {
    throw new WsError(type, "no_connection", "Home Assistant connection not available");
  }
  try {
    return await hass.callWS<T>({ ...(payload ?? {}), type });
  } catch (err) {
    throw WsError.from(type, err);
  }
}

// ── signed URLs ─────────────────────────────────────────────────────────────
// Snapshot images are served from the authenticated /api/jarvis/snapshot/...
// view. An <img src> cannot carry a bearer token, so ask HA for a short-lived
// signed path first. Signatures last `expires` seconds (300); the cache hands
// the same URL back for 240 s and then re-signs, so an <img> never gets a URL
// about to expire. Non-/api paths (data:, /jarvis_panel_static/...) pass
// through unchanged.

const SIGN_EXPIRES_S = 300;
const SIGN_REFRESH_MS = 240_000;
const _signed = new Map<string, { url: string; ts: number }>();

export function isApiPath(path: string): boolean {
  return /^\/api\//.test(path);
}

export async function signPath(
  hass: Hass | undefined | null,
  path: string,
  expires: number = SIGN_EXPIRES_S,
): Promise<string> {
  if (!path) return "";
  if (!hass || !isApiPath(path)) return path;
  const hit = _signed.get(path);
  const now = Date.now();
  if (hit && now - hit.ts < SIGN_REFRESH_MS) return hit.url;
  try {
    const res = await hass.callWS<{ path?: string }>({ type: "auth/sign_path", path, expires });
    const url = res?.path || path;
    _signed.set(path, { url, ts: now });
    return url;
  } catch {
    // Fall back to the raw path: the image 401s instead of the view crashing,
    // and the smoke test flags an unsigned /api/ src so the bug is visible.
    return path;
  }
}

/** Drop cached signatures (tests, or after an auth change). */
export function clearSignedCache(): void {
  _signed.clear();
}
