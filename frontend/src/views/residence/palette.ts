/**
 * The 3D model's palette, derived at render time from the panel's semantic
 * tokens (which are themselves HA theme variables), so the house follows HA
 * light / dark / custom themes. Every entry is a CSS colour expression built
 * with color-mix() over the token values - no colour is spelled here.
 *
 * `buildPalette(host)` reads the tokens with getComputedStyle(host); when a
 * token has no computed value (older engines, jsdom) it falls back to the
 * `var(--jv-*)` reference, which the SVG inline styles resolve the same way.
 */

export interface Palette {
  wallFill: string;
  wallStroke: string;
  wallFillDark: string;
  wallStrokeDark: string;
  roofFill: string;
  roofStroke: string;
  roofFillDark: string;
  roofStrokeDark: string;
  gableFill: string;
  gableStroke: string;
  chimneyFill: string;
  chimneyStroke: string;
  chimneyCap: string;
  solidDark: string;
  voidDark: string;
  doorOff: string;
  doorOn: string;
  doorStroke: string;
  doorOpen: string;
  doorOpenStroke: string;
  doorOpenGlow: string;
  doorOpenFaint: string;
  winOff: string;
  winOn: string;
  winDom: string;
  glassOff: string;
  glassOn: string;
  glassDom: string;
  edge: string;
  dim: string;
  faint: string;
  glowOn: string;
  glowDom: string;
  casedFill: string;
  casedStroke: string;
  roomFillOff: string;
  roomFillOn: string;
  roomFillMmwave: string;
  roomFillDom: string;
  roomStrokeOff: string;
  roomStrokeOn: string;
  roomStrokeMmwave: string;
  roomStrokeDom: string;
  roomWallOff: string;
  roomWallOn: string;
  roomWallMmwave: string;
  roomWallDom: string;
  dotOn: string;
  dotMmwave: string;
  dotDom: string;
  textOff: string;
  textOn: string;
  textMmwave: string;
  textDom: string;
  textHalo: string;
  bgGlow: string;
  shadow: string;
}

const TOKENS = ["--jv-surface", "--jv-text", "--jv-text-2", "--jv-accent", "--jv-ok", "--jv-warn"] as const;

/**
 * The computed token values end up inside the SVG's `style="..."` attributes
 * (house3d.ts renders a string that residence.ts injects with unsafeHTML),
 * and they come from the HA theme, i.e. from whatever a themes.yaml / HACS
 * theme put in --primary-text-color etc. Only a value that looks like a CSS
 * colour expression is used verbatim; anything else (quotes, `<`, `;`, ...)
 * falls back to the var() reference, which the inline style resolves itself.
 */
const COLOUR_VALUE_RE = /^[\w\s#(),.%/+-]+$/;

export function isColourValue(v: string): boolean {
  return v.length > 0 && v.length <= 200 && COLOUR_VALUE_RE.test(v);
}

/** `c` at `pct`% opacity. */
const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
/** `pct`% of `a` blended into `b` (opaque). */
const blend = (a: string, pct: number, b: string) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;

let _cacheKey = "";
let _cache: Palette | null = null;

/** Read the tokens the palette needs from `host`; empty values fall back to var() refs. */
export function readTokens(host: Element): Record<(typeof TOKENS)[number], string> {
  let cs: CSSStyleDeclaration | null = null;
  try {
    cs = typeof getComputedStyle === "function" ? getComputedStyle(host) : null;
  } catch {
    cs = null;
  }
  const out = {} as Record<(typeof TOKENS)[number], string>;
  for (const name of TOKENS) {
    let v = "";
    try {
      v = cs ? cs.getPropertyValue(name).trim() : "";
    } catch {
      v = "";
    }
    out[name] = isColourValue(v) ? v : `var(${name})`;
  }
  return out;
}

/** The palette for `host`'s current theme (cached on the token values). */
export function buildPalette(host: Element): Palette {
  const tk = readTokens(host);
  const key = TOKENS.map((n) => tk[n]).join("|");
  if (_cache && key === _cacheKey) return _cache;
  const surface = tk["--jv-surface"], text = tk["--jv-text"], text2 = tk["--jv-text-2"];
  const accent = tk["--jv-accent"], ok = tk["--jv-ok"], warn = tk["--jv-warn"];
  const p: Palette = {
    wallFill: blend(text, 5, surface),
    wallStroke: mix(text, 55),
    wallFillDark: blend(text, 14, surface),
    wallStrokeDark: mix(text, 40),
    roofFill: blend(text, 24, surface),
    roofStroke: mix(text, 60),
    roofFillDark: blend(text, 36, surface),
    roofStrokeDark: mix(text, 45),
    gableFill: blend(text, 9, surface),
    gableStroke: mix(text, 50),
    chimneyFill: blend(text, 40, surface),
    chimneyStroke: mix(text, 55),
    chimneyCap: mix(text, 12),
    solidDark: blend(text, 30, surface),
    voidDark: blend(text, 70, surface),
    doorOff: mix(accent, 12),
    doorOn: mix(accent, 35),
    doorStroke: mix(accent, 75),
    doorOpen: mix(warn, 40),
    doorOpenStroke: warn,
    doorOpenGlow: mix(warn, 45),
    doorOpenFaint: mix(warn, 14),
    winOff: mix(accent, 10),
    winOn: mix(accent, 75),
    winDom: mix(ok, 85),
    glassOff: mix(accent, 45),
    glassOn: accent,
    glassDom: ok,
    edge: mix(text, 50),
    dim: mix(text, 28),
    faint: mix(text, 14),
    glowOn: mix(accent, 50),
    glowDom: mix(ok, 55),
    casedFill: mix(text2, 12),
    casedStroke: mix(text2, 80),
    roomFillOff: mix(accent, 5),
    roomFillOn: mix(accent, 16),
    roomFillMmwave: mix(ok, 24),
    roomFillDom: mix(ok, 16),
    roomStrokeOff: mix(text, 30),
    roomStrokeOn: mix(accent, 70),
    roomStrokeMmwave: ok,
    roomStrokeDom: mix(ok, 90),
    roomWallOff: mix(text, 3),
    roomWallOn: mix(accent, 6),
    roomWallMmwave: mix(ok, 10),
    roomWallDom: mix(ok, 6),
    dotOn: accent,
    dotMmwave: ok,
    dotDom: ok,
    textOff: text2,
    textOn: text,
    textMmwave: blend(ok, 55, text),
    textDom: blend(ok, 55, text),
    textHalo: surface,
    bgGlow: mix(accent, 8),
    shadow: mix(text, 22),
  };
  _cacheKey = key;
  _cache = p;
  return p;
}

/** Cache key of the current palette (changes when the theme changes). */
export function paletteKey(host: Element): string {
  const tk = readTokens(host);
  return TOKENS.map((n) => tk[n]).join("|");
}
