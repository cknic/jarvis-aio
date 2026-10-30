/**
 * Browser-microphone capture for voice enrolment / identification (spec §3.9).
 *
 *   const dataUrl = await recordWavBase64(4, (left) => ...);
 *
 * Captures `seconds` of Float32 audio from getUserMedia through an
 * AudioContext, downsamples to 16 kHz mono, encodes 16-bit PCM WAV and returns
 * it as "data:audio/wav;base64,...". Everything is feature-detected AT CALL
 * TIME: nothing here may run at render (the jsdom smoke test has no
 * mediaDevices / AudioContext). Requires a secure context.
 */
import { t } from "../../i18n";

const TARGET_RATE = 16_000;

type AudioContextCtor = new () => AudioContext;

function audioContextCtor(): AudioContextCtor | null {
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
  return w.AudioContext || w.webkitAudioContext || null;
}

export function recordingSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && !!audioContextCtor();
}

export async function recordWavBase64(seconds = 4, onTick?: (secondsLeft: number) => void): Promise<string> {
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    throw new Error(t("Microphone needs a secure (HTTPS) connection"));
  }
  const Ctor = audioContextCtor();
  if (!navigator.mediaDevices?.getUserMedia || !Ctor) {
    throw new Error(t("recording not supported in this browser"));
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new Ctor();
  const chunks: Float32Array[] = [];
  let processor: ScriptProcessorNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let tick: ReturnType<typeof setInterval> | null = null;
  try {
    if (ctx.state === "suspended") await ctx.resume().catch(() => undefined);
    source = ctx.createMediaStreamSource(stream);
    processor = ctx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (ev: AudioProcessingEvent) => {
      chunks.push(new Float32Array(ev.inputBuffer.getChannelData(0)));
    };
    source.connect(processor);
    // Some engines only pulse a ScriptProcessorNode that reaches the destination.
    processor.connect(ctx.destination);

    const total = Math.max(1, Math.round(seconds));
    let left = total;
    onTick?.(left);
    await new Promise<void>((resolve) => {
      tick = setInterval(() => {
        left -= 1;
        if (left <= 0) {
          if (tick) clearInterval(tick);
          tick = null;
          resolve();
        } else {
          onTick?.(left);
        }
      }, 1000);
    });
    onTick?.(0);

    const inputRate = ctx.sampleRate || TARGET_RATE;
    const pcm = downsample(flatten(chunks), inputRate, TARGET_RATE);
    if (!pcm.length) throw new Error(t("No audio captured"));
    return "data:audio/wav;base64," + base64(encodeWav(pcm, TARGET_RATE));
  } finally {
    if (tick) clearInterval(tick);
    try {
      processor?.disconnect();
      source?.disconnect();
    } catch {
      /* already gone */
    }
    for (const track of stream.getTracks()) {
      try {
        track.stop();
      } catch {
        /* ignore */
      }
    }
    await ctx.close().catch(() => undefined);
  }
}

function flatten(chunks: Float32Array[]): Float32Array {
  let n = 0;
  for (const c of chunks) n += c.length;
  const out = new Float32Array(n);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

/** Nearest-sample downsample (what the old panel did). */
function downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (!input.length) return input;
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const n = Math.floor(input.length / ratio);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = input[Math.min(input.length - 1, Math.round(i * ratio))] ?? 0;
  }
  return out;
}

/** 44-byte RIFF/WAVE header + 16-bit PCM mono. */
export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const bytesPerSample = 2;
  const dataLen = samples.length * bytesPerSample;
  const buf = new ArrayBuffer(44 + dataLen);
  const view = new DataView(buf);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataLen, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, "data");
  view.setUint32(40, dataLen, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++, off += 2) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buf);
}

function base64(bytes: Uint8Array): string {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}
