/**
 * A minimal ZIP reader for SweetHome3D `.sh3d` files (editor.md section 6.1):
 * reads the central directory, then an entry's bytes - method 0 (stored) or
 * 8 (deflate, through `DecompressionStream("deflate-raw")`). No ZIP64, no
 * encryption (SweetHome3D produces neither). Pure apart from the browser's
 * DecompressionStream; throws ZipError with a machine code the caller maps
 * to a translated message.
 */

export type ZipErrorCode = "not_zip" | "no_inflate" | "unsupported";
export class ZipError extends Error {
  readonly code: ZipErrorCode;
  constructor(code: ZipErrorCode, message: string) {
    super(message);
    this.name = "ZipError";
    this.code = code;
  }
}

export interface ZipEntry {
  name: string;
  method: number;
  flags: number;
  compressedSize: number;
  size: number;
  localOffset: number;
}

const EOCD_SIG = 0x06054b50;
const CEN_SIG = 0x02014b50;
const LOC_SIG = 0x04034b50;

/** True for the "PK" magic. */
export function isZip(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

/** True when the browser can inflate deflate-raw streams. */
export function canInflate(): boolean {
  return typeof (globalThis as { DecompressionStream?: unknown }).DecompressionStream === "function";
}

function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/** The entries of the central directory, in stored order. */
export function zipEntries(bytes: Uint8Array): ZipEntry[] {
  if (!isZip(bytes) || bytes.length < 22) throw new ZipError("not_zip", "not a ZIP archive");
  const dv = view(bytes);
  // the end-of-central-directory record sits in the last 22 + 65535 bytes
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (dv.getUint32(i, true) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ZipError("not_zip", "no end of central directory");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  if (count === 0xffff || p === 0xffffffff) throw new ZipError("unsupported", "ZIP64 archives are not supported");
  const dec = new TextDecoder("utf-8");
  const out: ZipEntry[] = [];
  for (let n = 0; n < count; n++) {
    if (p + 46 > bytes.length || dv.getUint32(p, true) !== CEN_SIG) throw new ZipError("not_zip", "corrupt central directory");
    const flags = dv.getUint16(p + 8, true);
    const method = dv.getUint16(p + 10, true);
    const compressedSize = dv.getUint32(p + 20, true);
    const size = dv.getUint32(p + 24, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOffset = dv.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    out.push({ name, method, flags, compressedSize, size, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const DS = (globalThis as { DecompressionStream?: new (format: string) => TransformStream<Uint8Array, Uint8Array> }).DecompressionStream;
  if (!DS) throw new ZipError("no_inflate", "DecompressionStream is not available");
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  const stream = new Blob([copy]).stream().pipeThrough(new DS("deflate-raw"));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

/** The uncompressed bytes of one entry. */
export async function zipRead(bytes: Uint8Array, e: ZipEntry): Promise<Uint8Array> {
  if (e.flags & 0x1) throw new ZipError("unsupported", "encrypted entries are not supported");
  const dv = view(bytes);
  const p = e.localOffset;
  if (p + 30 > bytes.length || dv.getUint32(p, true) !== LOC_SIG) throw new ZipError("not_zip", "corrupt local header");
  const start = p + 30 + dv.getUint16(p + 26, true) + dv.getUint16(p + 28, true);
  const data = bytes.subarray(start, start + e.compressedSize);
  if (e.method === 0) return data;
  if (e.method === 8) return inflateRaw(data);
  throw new ZipError("unsupported", `compression method ${e.method} is not supported`);
}
