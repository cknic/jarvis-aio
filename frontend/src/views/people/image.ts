/**
 * Client-side image preparation (spec §3.8) and the per-view thumbnail cache.
 *
 * Every image sent to `set_reference` is decoded, scaled so its longer edge is
 * <= 1024 px and re-encoded as JPEG q0.85 through a <canvas>: HA's WebSocket
 * drops frames above 4 MiB, so a raw phone photo would silently kill the
 * connection. Nothing here runs at render time.
 */
import { t } from "../../i18n";
import type { Hass } from "../../types";
import { ws, signPath } from "../../ws";
import { normName } from "./format";
import type { ImageResponse } from "./types";

export const MAX_EDGE = 1024;
export const JPEG_QUALITY = 0.85;

export class NotAnImageError extends Error {
  constructor() {
    super(t("That file is not an image"));
    this.name = "NotAnImageError";
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new NotAnImageError());
    img.src = src;
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Decode `source` (a Blob / File or a data: / blob: / http URL), downscale and
 * return a JPEG data URL. Rejects with NotAnImageError for non-images.
 */
export async function prepareImage(source: Blob | string): Promise<string> {
  if (source instanceof Blob && source.type && !source.type.startsWith("image/")) throw new NotAnImageError();
  let w = 0;
  let h = 0;
  let drawable: CanvasImageSource;
  let revoke: string | null = null;
  try {
    if (source instanceof Blob && typeof createImageBitmap === "function") {
      try {
        const bmp = await createImageBitmap(source);
        drawable = bmp;
        w = bmp.width;
        h = bmp.height;
      } catch {
        throw new NotAnImageError();
      }
    } else {
      let url: string;
      if (source instanceof Blob) {
        url = URL.createObjectURL(source);
        revoke = url;
      } else {
        url = source;
      }
      const img = await loadImage(url);
      drawable = img;
      w = img.naturalWidth || img.width;
      h = img.naturalHeight || img.height;
    }
    if (!w || !h) throw new NotAnImageError();
    const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.drawImage(drawable, 0, 0, cw, ch);
    const out = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    if (!out.startsWith("data:image/")) throw new NotAnImageError();
    if ("close" in drawable && typeof (drawable as ImageBitmap).close === "function") (drawable as ImageBitmap).close();
    return out;
  } finally {
    if (revoke) URL.revokeObjectURL(revoke);
  }
}

/** Read the bytes behind a signed /api/ URL as a data URL (same-origin, authSig in the query). */
export async function fetchAsDataUrl(signedUrl: string): Promise<string | null> {
  try {
    const res = await fetch(signedUrl, { cache: "no-store" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.size) return null;
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

/**
 * Per-view cache of reference photos (per normalised name) and camera frames
 * (per entity). A `null` entry means "asked, nothing there" so a card never
 * re-asks within the view's lifetime; `drop*` after a mutation.
 */
export class ThumbCache {
  private _refs = new Map<string, Promise<string | null>>();
  private _cams = new Map<string, Promise<string | null>>();
  private _failedUrls = new Set<string>();
  private _refGen = new Map<string, number>();

  /** Bumped on every dropReference so a card re-resolves a replaced photo. */
  referenceGeneration(name: string): number {
    return this._refGen.get(normName(name)) ?? 0;
  }

  reference(hass: Hass | undefined, name: string): Promise<string | null> {
    const key = normName(name);
    if (!key || !hass) return Promise.resolve(null);
    let p = this._refs.get(key);
    if (!p) {
      p = ws<ImageResponse>(hass, "jarvis/face_reference", { name })
        .then((res) => (typeof res?.image === "string" && res.image ? res.image : null))
        .catch(() => null);
      this._refs.set(key, p);
    }
    return p;
  }

  camera(hass: Hass | undefined, entity: string, fresh = false): Promise<string | null> {
    if (!entity || !hass) return Promise.resolve(null);
    let p = fresh ? undefined : this._cams.get(entity);
    if (!p) {
      p = ws<ImageResponse>(hass, "jarvis/camera_snapshot", { entity_id: entity })
        .then((res) => (typeof res?.image === "string" && res.image ? `data:image/jpeg;base64,${res.image}` : null))
        .catch(() => null);
      this._cams.set(entity, p);
    }
    return p;
  }

  /** Like camera() but rejects with the WsError (for "Snapshot now", where the message matters). */
  async cameraStrict(hass: Hass | undefined, entity: string): Promise<string | null> {
    const res = await ws<ImageResponse>(hass, "jarvis/camera_snapshot", { entity_id: entity });
    const url = typeof res?.image === "string" && res.image ? `data:image/jpeg;base64,${res.image}` : null;
    this._cams.set(entity, Promise.resolve(url));
    return url;
  }

  dropReference(name: string): void {
    const key = normName(name);
    this._refs.delete(key);
    this._refGen.set(key, (this._refGen.get(key) ?? 0) + 1);
  }

  dropCamera(entity: string): void {
    this._cams.delete(entity);
  }

  markFailed(url: string): void {
    if (url) this._failedUrls.add(url);
  }

  hasFailed(url: string): boolean {
    return this._failedUrls.has(url);
  }

  signed(hass: Hass | undefined, path: string): Promise<string> {
    return signPath(hass, path);
  }
}
