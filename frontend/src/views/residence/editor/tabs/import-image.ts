/**
 * Background image upload (editor.md section 6 I5): read a user-picked image,
 * downscale it to <= 1600 px on the long side, encode PNG when the source is
 * PNG or has transparency (else JPEG q 0.85) and refuse results over 1.5 MB -
 * backgrounds travel inside config.json and every panel snapshot (R2).
 * The caller may pass a smaller limit: every floor's image goes in ONE
 * jarvis/update_config message, which HA caps at 4 MiB. An opaque image that
 * is over the limit is re-encoded smaller (lower JPEG quality, then fewer
 * pixels) before it is refused.
 *
 * Also the natural-size cache the background layer needs for its aspect ratio.
 */

export const BG_MAX_SIDE = 1600;
export const BG_MAX_BYTES = 1.5 * 1024 * 1024;
const JPEG_QUALITY = 0.85;

export type ImageErrorCode = "too_large" | "unreadable";
export class ImageImportError extends Error {
  readonly code: ImageErrorCode;
  constructor(code: ImageErrorCode, message: string) {
    super(message);
    this.name = "ImageImportError";
    this.code = code;
  }
}

/** Approximate decoded size of a base64 data URL, in bytes. */
export function dataUrlBytes(url: string): number {
  const i = url.indexOf(",");
  const b64 = i >= 0 ? url.slice(i + 1) : url;
  return Math.floor((b64.length * 3) / 4);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageImportError("unreadable", "the browser could not decode this image"));
    img.src = src;
  });
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new ImageImportError("unreadable", r.error?.message || "the file could not be read"));
    r.readAsDataURL(file);
  });
}

function hasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  try {
    const data = ctx.getImageData(0, 0, w, h).data;
    // sample every 7th pixel - enough to catch a transparent margin or cut-out
    for (let i = 3; i < data.length; i += 4 * 7) if (data[i] < 250) return true;
    return false;
  } catch {
    return false;
  }
}

/** Re-encodings tried, in order, while the result is over the limit (scale of the 1600 px size, JPEG quality). */
const SHRINK_STEPS: ReadonlyArray<{ scale: number; q: number }> = [
  { scale: 1, q: 0.7 },
  { scale: 0.8, q: 0.7 },
  { scale: 0.65, q: 0.6 },
  { scale: 0.5, q: 0.6 },
];

/** File -> compressed data URL of at most min(maxBytes, BG_MAX_BYTES) decoded bytes (throws ImageImportError). */
export async function compressImage(file: File, maxBytes = BG_MAX_BYTES): Promise<{ url: string; width: number; height: number; bytes: number }> {
  const limit = Math.min(BG_MAX_BYTES, maxBytes);
  if (file.type && !file.type.startsWith("image/")) throw new ImageImportError("unreadable", "not an image file");
  const src = await readAsDataUrl(file);
  const img = await loadImage(src);
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  if (!iw || !ih) throw new ImageImportError("unreadable", "the image has no size");
  const k = Math.min(1, BG_MAX_SIDE / Math.max(iw, ih));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // no 2D canvas (very old WebView): accept the original when it already fits
    if (dataUrlBytes(src) > limit) throw new ImageImportError("too_large", "image too large");
    return { url: src, width: iw, height: ih, bytes: dataUrlBytes(src) };
  }
  let w = 1, h = 1;
  const draw = (scale: number) => {
    w = Math.max(1, Math.round(iw * k * scale));
    h = Math.max(1, Math.round(ih * k * scale));
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
  };
  draw(1);
  const transparent = hasTransparency(ctx, w, h);
  const png = /png|gif|webp|svg/i.test(file.type) || transparent;
  let url = canvas.toDataURL(png ? "image/png" : "image/jpeg", png ? undefined : JPEG_QUALITY);
  if (png && dataUrlBytes(url) > limit && !transparent) {
    // an opaque PNG screenshot that is still too big: JPEG keeps it under the limit
    url = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  }
  for (const step of SHRINK_STEPS) {
    if (dataUrlBytes(url) <= limit) break;
    if (transparent && step.scale === 1) continue; // PNG has no quality knob: only fewer pixels help
    draw(step.scale);
    url = transparent ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", step.q);
  }
  const bytes = dataUrlBytes(url);
  if (!url.startsWith("data:image/") || bytes > limit) throw new ImageImportError("too_large", "image too large after compression");
  return { url, width: w, height: h, bytes };
}

// ── natural sizes (for the background's aspect ratio) ───────────────────────
const _sizes = new Map<string, { w: number; h: number } | null>();
const _pending = new Map<string, Promise<void>>();

/** Cached natural size of an image URL; undefined while unknown (call ensureImageSize). */
export function imageSize(href: string): { w: number; h: number } | null | undefined {
  return _sizes.get(sizeKey(href));
}

function sizeKey(href: string): string {
  // data URLs can be megabytes: key them by length + head + tail
  return href.length > 256 ? `${href.length}:${href.slice(0, 96)}:${href.slice(-96)}` : href;
}

/**
 * Load the image once to learn its natural size; resolves when known (null when it failed).
 * `href` is the cache key (the stored value imageSize() is asked with); `src` the URL to load
 * when that differs (a signed /api/ path).
 */
export function ensureImageSize(href: string, src: string = href): Promise<void> {
  const key = sizeKey(href);
  if (_sizes.has(key)) return Promise.resolve();
  let p = _pending.get(key);
  if (!p) {
    p = loadImage(src)
      .then((img) => {
        const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        _sizes.set(key, w && h ? { w, h } : null);
      })
      .catch(() => {
        _sizes.set(key, null);
      })
      .finally(() => {
        _pending.delete(key);
      });
    _pending.set(key, p);
  }
  return p;
}
