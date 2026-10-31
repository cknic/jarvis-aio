#!/usr/bin/env node
// Smoke test for the BUILT panel bundle under jsdom.
//
// Loads custom_components/jarvis/frontend/jarvis-panel.js with a mock hass
// (fixtures from dev/fixtures), mounts <jarvis-panel>, visits every view route
// in light, in dark and in a theme with a primary-coloured app bar, and asserts:
//   - no uncaught error / unhandled rejection / console.error,
//   - each view element renders content into its shadowRoot,
//   - no literal colour or web font in any stylesheet the panel adopts,
//   - the app bar's own rules use only the --jv-header-* colour tokens,
//   - every <img> src is data:, a panel static asset, or a SIGNED /api/ path,
//   - the ten tabs render in VIEWS order inside a non-wrapping, scrollable
//     tablist; the narrow bottom nav shows the four primary views plus
//     "More", whose focus-trapped bottom sheet lists the other six, closes on
//     Escape / scrim click and shows the active secondary view as current,
//   - tab navigation pushes /jarvis/<view> and the back button restores it;
//     jarvis-refresh fetches the snapshot exactly once (the poll is paused),
//   - a sub-route (/residence/editor) mounts the owning view with subPath,
//   - every Settings category shows its registered tool cards and field
//     editors (settings/tools), with no error state; the voice-confirm list
//     and the biometrics map render the fixture values and save one edit as
//     exactly their key through jarvis/update_config,
//   - every jarvis-editor-* / jarvis-tool-* element the bundle defines
//     rendered in a check that actually ran (a new editor must be added here,
//     under a category the Settings walk visits),
//   - every floor-plan editor sub-tab (/residence/editor/<tab>) mounts its
//     element and the canvas draws the rooms, in light and dark,
//   - keyboard focus survives a row's Remove (src/focus.ts) in the editor's
//     Openings, Doors, Cameras & pins lists and toasts and in the Settings
//     appliances, voice confirm, pairings, biometrics and muted-announcements
//     editors: it lands on the next row's control, else the previous row's,
//     else the fallback - also when the backend answers late (Doors, mutes:
//     the neighbours are disabled until it does) or fails (the row comes
//     back with its own control focused), and a focused toast holds its
//     auto-dismiss (released when a re-render strips its focused Undo),
//   - an editor round trip: add a room through the store, undo, redo, save
//     (exactly floor_plan_rooms is written, and it is the stored fixture plus
//     the new room), reload the saved snapshot (clean, no conflict banner),
//   - backgrounds travel one floor per jarvis/set_floor_background message;
//     a plan file's images keep the background card busy while they are
//     written (an open align tool is cancelled first, an alignment ending
//     inside the loop does not clear its busy, a second Import JSON is
//     ignored with focus kept) and report a partial or total failure by floor,
//   - overlapping immediate-save writes of one key (opacity, a background
//     per floor): only the latest sets the status or reverts, and it reverts
//     to the last confirmed value, never to a refused earlier one,
//   - the narrow editor canvas takes the fitted plan's aspect ratio (zoom and
//     pan do not resize it) and its grid fills a letterboxed svg,
//   - the editor model self-test (src/views/residence/editor/selftest.ts:
//     parse/serialize round trip of the fixture plan, units, geometry),
//   - every WS command literal in src/ has a dev/fixtures file, no fixture is
//     orphaned, and every call made during the run was answered by one,
//   - a non-English language file loads and translates the tab bar.
// Exit 1 on any failure; prints "SMOKE TEST CLEAN" on success.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";
import * as esbuild from "esbuild";
import { findViolations } from "./colour-rules.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const BUNDLE = process.env.OUT
  ? path.resolve(process.cwd(), process.env.OUT)
  : path.resolve(ROOT, "..", "custom_components", "jarvis", "frontend", "jarvis-panel.js");
const FIXTURES = path.join(ROOT, "dev", "fixtures");
const SRC = path.join(ROOT, "src");
const I18N = path.resolve(ROOT, "..", "custom_components", "jarvis", "frontend", "i18n");
const PREFIX = "/jarvis";

const failures = [];
const passes = [];
function check(name, ok, detail = "") {
  (ok ? passes : failures).push(name + (detail && !ok ? ` -- ${detail}` : ""));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!fs.existsSync(BUNDLE)) {
  console.error(`bundle not found at ${BUNDLE}; run \`npm run build\` first`);
  process.exit(1);
}

// ── jsdom window with error capture ────────────────────────────────────────
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (e) => errors.push(`jsdomError: ${e && e.message ? e.message : e}`));
virtualConsole.on("error", (...args) => errors.push(`console.error: ${args.map(String).join(" ")}`));
virtualConsole.on("warn", () => undefined);
virtualConsole.on("log", () => undefined);
virtualConsole.on("info", () => undefined);
virtualConsole.on("debug", () => undefined);

const dom = new JSDOM(`<!doctype html><html><head></head><body></body></html>`, {
  url: `http://localhost${PREFIX}/overview`,
  pretendToBeVisual: true,
  runScripts: "outside-only",
  virtualConsole,
});
const { window } = dom;
const { document } = window;
window.addEventListener("error", (e) => errors.push(`window.error: ${e.message || e.error}`));
window.addEventListener("unhandledrejection", (e) => errors.push(`unhandledrejection: ${e.reason}`));
process.on("unhandledRejection", (r) => errors.push(`node unhandledRejection: ${r && r.stack ? r.stack : r}`));

// Browser APIs jsdom lacks that Lit / the panel touch.
if (!window.matchMedia) {
  window.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false });
}
if (!window.ResizeObserver) {
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
}
window.structuredClone ??= (v) => JSON.parse(JSON.stringify(v));
// i18n fetch: serve the real language files from disk, 404 otherwise.
window.fetch = async (input) => {
  const url = String(input);
  const m = url.match(/\/jarvis_panel_static\/i18n\/([a-z0-9-]+)\.json$/i);
  if (m) {
    const file = path.join(I18N, `${m[1]}.json`);
    if (fs.existsSync(file)) {
      const text = fs.readFileSync(file, "utf8");
      return { ok: true, status: 200, json: async () => JSON.parse(text), text: async () => text };
    }
  }
  return { ok: false, status: 404, json: async () => ({}), text: async () => "" };
};

// ── mock hass (same routing as dev/mock-hass.ts) ───────────────────────────
const wsCalls = [];
function fixture(name) {
  const file = path.join(FIXTURES, `${name}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : undefined;
}
const ROUTES = { "jarvis/get_panel_data": "panel_data", "jarvis/config_schema": "config_schema" };
/** answered without a fixture file (the mock signs paths itself) */
const SYNTHETIC = new Set(["auth/sign_path"]);
const fixtureName = (type) => ROUTES[type] ?? type.replace(/\//g, "_");
/** WS types called during the run that no fixture answered (they got {}) */
const fixtureMisses = new Set();
function makeHass(language = "en") {
  return {
    language,
    locale: { language },
    themes: { darkMode: false },
    user: { is_admin: true, name: "Smoke" },
    states: {},
    config: { location_name: "Smoke" },
    connection: { subscribeEvents: async () => () => {}, subscribeMessage: async () => () => {} },
    localize: (k) => k,
    async callWS(msg) {
      wsCalls.push(msg.type);
      if (msg.type === "auth/sign_path") return { path: `${msg.path}?authSig=smoke` };
      const data = fixture(fixtureName(msg.type));
      if (data === undefined) fixtureMisses.add(msg.type);
      return data === undefined ? {} : JSON.parse(JSON.stringify(data));
    },
    async callService() {},
  };
}

// ── HA theme variables (what the harness sets) ─────────────────────────────
const LIGHT = {
  "--primary-background-color": "#fafafa", "--secondary-background-color": "#e5e5e5", "--card-background-color": "#ffffff",
  "--primary-text-color": "#212121", "--secondary-text-color": "#727272", "--disabled-text-color": "#bdbdbd",
  "--text-primary-color": "#ffffff", "--primary-color": "#03a9f4", "--accent-color": "#ff9800",
  "--success-color": "#43a047", "--warning-color": "#ffa600", "--error-color": "#db4437", "--info-color": "#039be5",
  "--divider-color": "rgba(0, 0, 0, 0.12)", "--ha-card-border-radius": "12px", "--ha-card-box-shadow": "none",
  "--ha-card-border-width": "1px", "--ha-card-border-color": "rgba(0, 0, 0, 0.12)", "--mdc-theme-primary": "#03a9f4",
  "--black-color": "#000000", "--white-color": "#ffffff",
  "--app-header-background-color": "#fafafa", "--app-header-text-color": "#212121",
  "--ha-font-family-body": "Roboto, Noto, sans-serif", "--paper-font-body1_-_font-family": "Roboto, Noto, sans-serif",
};
const DARK = {
  ...LIGHT,
  "--primary-background-color": "#111111", "--secondary-background-color": "#202020", "--card-background-color": "#1c1c1c",
  "--primary-text-color": "#e1e1e1", "--secondary-text-color": "#9b9b9b", "--disabled-text-color": "#6f6f6f",
  "--divider-color": "rgba(225, 225, 225, 0.12)", "--ha-card-border-color": "rgba(225, 225, 225, 0.12)",
  "--app-header-background-color": "#101e24", "--app-header-text-color": "#e1e1e1",
};
// Many community themes paint the app bar in the primary colour with white
// text (HA's own derivedStyles did too, pre-2021). Anything the panel draws on
// the header must then come from the header tokens, not the page palette.
const COLOURED_HEADER = {
  ...LIGHT,
  "--app-header-background-color": "#03a9f4", "--app-header-text-color": "#ffffff",
  "--app-header-border-bottom": "none", "--app-header-selection-bar-color": "#ffffff",
};
const THEMES = { light: LIGHT, dark: DARK, "coloured-header": COLOURED_HEADER };
function applyTheme(name) {
  const vars = THEMES[name] ?? LIGHT;
  const root = document.documentElement;
  for (const k of Object.keys(COLOURED_HEADER)) root.style.removeProperty(k);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.setAttribute("data-theme", name);
}

// ── load the bundle ────────────────────────────────────────────────────────
// Record every tag the bundle defines, for the completeness check at the end.
const definedTags = new Set();
{
  const registry = window.customElements;
  const define = registry.define.bind(registry);
  registry.define = (name, ...rest) => {
    definedTags.add(name);
    return define(name, ...rest);
  };
}
let code = fs.readFileSync(BUNDLE, "utf8");
check("bundle has no import statements (self-contained ES module)", !/^\s*import\s/m.test(code) && !/\bimport\s*\(\s*["']/.test(code));
// A trailing `export{...}` (if the entry exports anything) is the only module
// syntax a classic-script eval cannot swallow; strip it, nothing else.
code = code.replace(/\bexport\s*\{[^}]*\};?\s*$/, "");
try {
  window.eval(code);
  check("bundle evaluates", true);
} catch (err) {
  check("bundle evaluates", false, String(err && err.stack ? err.stack : err));
  report();
}
check("<jarvis-panel> registered", !!window.customElements.get("jarvis-panel"));

// ── fixtures: every WS command the sources send has one (and none is stale) ─
// Same literal rule as tests/unit/test_ws_contract.py: command types are
// quoted literals in src/**/*.ts, never built at runtime.
function walkTs(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkTs(p, out);
    else if (ent.name.endsWith(".ts")) out.push(p);
  }
  return out;
}
const sourceTypes = new Map(); // ws type -> first file that sends it
for (const file of walkTs(SRC)) {
  for (const m of fs.readFileSync(file, "utf8").matchAll(/["'`]((?:jarvis|config|auth)\/[a-z0-9_]+(?:\/[a-z0-9_]+)*)["'`]/g)) {
    if (!sourceTypes.has(m[1])) sourceTypes.set(m[1], path.relative(ROOT, file));
  }
}
{
  const missing = [...sourceTypes.keys()].filter((t) => !SYNTHETIC.has(t) && !fs.existsSync(path.join(FIXTURES, `${fixtureName(t)}.json`)));
  check(`fixtures: each of the ${sourceTypes.size} WS types in src/ has dev/fixtures/<type>.json`, sourceTypes.size > 20 && missing.length === 0, missing.map((t) => `${t} (${sourceTypes.get(t)})`).join(", "));
  const wanted = new Set([...sourceTypes.keys()].map(fixtureName));
  const orphans = fs.readdirSync(FIXTURES).filter((f) => f.endsWith(".json") && !wanted.has(f.slice(0, -5)));
  check("fixtures: no orphaned fixture (every file answers a type the sources send)", orphans.length === 0, orphans.join(", "));
}

// ── the editor model self-test (pure; bundled on the fly, not in the panel) ─
function canon(v) {
  return JSON.stringify(v, (_k, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.keys(val).sort().reduce((acc, k) => ((acc[k] = val[k]), acc), {});
    }
    return val;
  });
}
try {
  const built = await esbuild.build({
    entryPoints: [path.join(SRC, "views", "residence", "editor", "selftest.ts")],
    bundle: true, platform: "node", format: "esm", write: false, logLevel: "silent",
  });
  const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
  const fails = mod.selfTest(fixture("panel_data").config);
  check("editor model self-test (fixture plan parse -> serialize round trip, units, geometry)", fails.length === 0, fails.slice(0, 4).join(" | "));
} catch (err) {
  check("editor model self-test (fixture plan parse -> serialize round trip, units, geometry)", false, String(err && err.stack ? err.stack : err));
}

// ── host emulation: HA re-sets `route` on navigation ───────────────────────
const panel = document.createElement("jarvis-panel");
const routeFromLocation = () => ({ prefix: PREFIX, path: window.location.pathname.slice(PREFIX.length) });
const syncRoute = () => { panel.route = routeFromLocation(); };
window.addEventListener("location-changed", syncRoute);
window.addEventListener("popstate", syncRoute);

applyTheme("light");
panel.panel = { config: {} };
panel.narrow = false;
panel.route = routeFromLocation();
panel.hass = makeHass("en");
document.body.appendChild(panel);

async function settle(ms = 30) {
  for (let i = 0; i < 4; i++) {
    await panel.updateComplete;
    await sleep(ms);
  }
}
await settle();

const sr = panel.shadowRoot;
check("panel has a shadowRoot", !!sr);
check("snapshot requested over WS", wsCalls.includes("jarvis/get_panel_data"));
const tabs = [...sr.querySelectorAll('[role="tab"][data-view]')];
const EXPECTED_VIEWS = ["overview", "intrusion", "cameras", "people", "suggestions", "memory", "documents", "residence", "logs", "settings"];
const PRIMARY_NAV = ["overview", "intrusion", "residence", "settings"];
const SECONDARY_NAV = EXPECTED_VIEWS.filter((k) => !PRIMARY_NAV.includes(k));
check("tab bar rendered with role=tablist", !!sr.querySelector('[role="tablist"]') && tabs.length === EXPECTED_VIEWS.length, `tabs=${tabs.length}`);
const viewKeys = tabs.map((t) => t.dataset.view);
check("views: " + viewKeys.join(","), viewKeys.length === new Set(viewKeys).size);
check("tabs in the agreed order", viewKeys.join(",") === EXPECTED_VIEWS.join(","), viewKeys.join(","));
check("tablist is inside the .tabs-wrap fade container", sr.querySelector('.tabs-wrap > [role="tablist"]') !== null);
{
  // the row must scroll, never wrap: the tablist's own rules say so
  const rules = flatRules(ownCss(sr));
  const listRule = rules.find((r) => r.selector === '[role="tablist"]');
  const tabRule = rules.find((r) => r.selector === ".tab");
  check("tablist scrolls horizontally (overflow-x: auto, no wrap)", !!listRule && /overflow-x:\s*auto/.test(listRule.decls) && !/flex-wrap:\s*wrap/.test(listRule.decls), listRule?.decls);
  check("tabs do not shrink or wrap (flex: none; white-space: nowrap)", !!tabRule && /flex:\s*none/.test(tabRule.decls) && /white-space:\s*nowrap/.test(tabRule.decls), tabRule?.decls);
  const fades = rules.filter((r) => /^\.tabs-wrap::(before|after)$/.test(r.selector));
  check("tab row has two fade edges painted in --jv-header-bg", fades.length === 2 && fades.every((r) => /--jv-header-bg/.test(r.decls)), fades.map((r) => r.selector).join(","));
  // the inline / second-line switch follows the panel's width, not the viewport
  const own = ownCss(sr);
  check("tab row layout switches on a jv-panel container query (not a viewport media query)", /@container jv-panel \(min-width: 1560px\)[^{]*\{\s*\.tabs-wrap/.test(own) && !/@media[^{]*\{\s*\.tabs-wrap/.test(own));
}
{
  // mouse affordances for the overflowing row: a chevron on each edge
  // (hidden from AT, out of the tab order) and the vertical wheel
  const wrap = sr.querySelector(".tabs-wrap");
  const chevrons = [...(wrap?.querySelectorAll(":scope > button.tab-scroll") || [])];
  check("tab row has start/end chevron buttons outside the tablist", chevrons.length === 2 && chevrons[0].classList.contains("start") && chevrons[1].classList.contains("end"));
  check("chevrons are aria-hidden and not in the tab order", chevrons.every((b) => b.getAttribute("aria-hidden") === "true" && b.getAttribute("tabindex") === "-1"));
  const list = sr.querySelector('[role="tablist"]');
  const geom = { scrollWidth: 1200, clientWidth: 600 };
  for (const [k, v] of Object.entries(geom)) Object.defineProperty(list, k, { configurable: true, get: () => v });
  list.scrollLeft = 0;
  const down = new window.WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true });
  list.dispatchEvent(down);
  check("vertical wheel over an overflowing tab row scrolls it sideways", down.defaultPrevented && list.scrollLeft === 120, `scrollLeft=${list.scrollLeft}`);
  list.scrollLeft = 600;
  const atEnd = new window.WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true });
  list.dispatchEvent(atEnd);
  check("wheel at the row's end falls through to the page", !atEnd.defaultPrevented && list.scrollLeft === 600);
  const sideways = new window.WheelEvent("wheel", { deltaX: 80, deltaY: 10, bubbles: true, cancelable: true });
  list.scrollLeft = 0;
  list.dispatchEvent(sideways);
  check("horizontal wheel / trackpad input is left native", !sideways.defaultPrevented && list.scrollLeft === 0);
  chevrons[1]?.click();
  check("end chevron pages the row forward", list.scrollLeft > 0, `scrollLeft=${list.scrollLeft}`);
  for (const k of Object.keys(geom)) delete list[k];
  list.scrollLeft = 0;
}
check("exactly one tab aria-selected", tabs.filter((t) => t.getAttribute("aria-selected") === "true").length === 1);
check("app bar present", !!sr.querySelector("header"));
check("version from snapshot shown", /10\.0\.0-dev/.test(sr.querySelector("header")?.textContent || ""));
check("app bar mark is an inline SVG in currentColor (no raster logo)", !!sr.querySelector("header svg.logo") && !sr.querySelector("header img"));

// ── the app bar keys off --jv-header-* only ────────────────────────────────
// A theme may give the header its primary colour; a selected-tab underline in
// --jv-accent or a hover tint of the page text would then vanish or clash.
function flatRules(cssText) {
  const src = cssText
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "")
    .replace(/@(media|container|supports)[^{]*\{/g, "");
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(src))) out.push({ selector: m[1].trim(), decls: m[2].trim() });
  return out;
}
function ownCss(shadow) {
  const out = [];
  for (const sheet of shadow.adoptedStyleSheets || []) {
    try { out.push([...sheet.cssRules].map((r) => r.cssText).join("\n")); } catch { /* ignore */ }
  }
  for (const style of shadow.querySelectorAll("style")) out.push(style.textContent || "");
  return out.join("\n");
}
{
  const HEADER_SEL = /^(header\b|\.tab\b|\.tabs-wrap\b|\.brand\b|\.logo\b|\.ver\b|\.bar-actions\b|\[role="tablist"\]|:host\(\[narrow\]\)\s+(header|\.brand|\.ver))/;
  const COLOUR_PROP = /^(color|background|background-color|border|border-top|border-bottom|border-color|border-bottom-color|box-shadow|outline|outline-color|fill|stroke)$/;
  const offenders = [];
  const rules = flatRules(ownCss(sr)).filter((r) => r.selector.split(",").some((s) => HEADER_SEL.test(s.trim())));
  check("app bar rules found in the shell stylesheet", rules.length >= 6, `rules=${rules.length}`);
  for (const r of rules) {
    for (const decl of r.decls.split(";")) {
      const i = decl.indexOf(":");
      if (i < 0) continue;
      const prop = decl.slice(0, i).trim().toLowerCase();
      const value = decl.slice(i + 1).trim();
      if (!COLOUR_PROP.test(prop)) continue;
      for (const v of value.matchAll(/var\(\s*(--jv-[\w-]+)/g)) {
        if (!v[1].startsWith("--jv-header-")) offenders.push(`${r.selector} { ${prop}: ${value} }`);
      }
    }
  }
  check("app bar colours come only from --jv-header-* tokens", offenders.length === 0, offenders.slice(0, 3).join("; "));
}

// ── walk every view in both themes ─────────────────────────────────────────
function* shadowRoots(root) {
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    if (node.shadowRoot) {
      yield node.shadowRoot;
      stack.push(...node.shadowRoot.querySelectorAll("*"));
    }
    if (node.children) stack.push(...node.children);
  }
}
function collectCss(root) {
  const out = [];
  for (const shadow of shadowRoots(root)) {
    for (const sheet of shadow.adoptedStyleSheets || []) {
      try { out.push([...sheet.cssRules].map((r) => r.cssText).join("\n")); } catch { /* ignore */ }
    }
    for (const style of shadow.querySelectorAll("style")) out.push(style.textContent || "");
  }
  return out;
}
function deepText(root) {
  let out = "";
  for (const shadow of shadowRoots(root)) out += " " + (shadow.textContent || "");
  return out;
}
function collectImgs(root) {
  const out = [];
  for (const shadow of shadowRoots(root)) out.push(...shadow.querySelectorAll("img"));
  return out;
}
function deepAll(root, selector) {
  const out = [];
  for (const shadow of shadowRoots(root)) out.push(...shadow.querySelectorAll(selector));
  return out;
}
/** error states a fixture-backed view must not show (DESIGN.md section 6) */
function errorStates(root) {
  return deepAll(root, 'jv-empty[kind="error"], ha-alert[alert-type="error"]').map((e) => {
    const where = e.getRootNode()?.host?.tagName?.toLowerCase() || "?";
    return `${where}: ${e.getAttribute("heading") || e.heading || ""} ${e.message || e.textContent || ""}`.trim().slice(0, 120);
  });
}
function themeChecks(label) {
  const cssViolations = collectCss(panel).flatMap((css) => findViolations(css));
  check(`${label} no literal colour in adopted styles`, cssViolations.length === 0, cssViolations.slice(0, 3).map((v) => `${v.kind} ${v.match}`).join("; "));
  const badImgs = collectImgs(panel).map((i) => i.getAttribute("src")).filter((s) => !imgOk(s));
  check(`${label} every <img> is data:/static/signed`, badImgs.length === 0, badImgs.join(", "));
}
function imgOk(src) {
  if (!src) return false;
  if (src.startsWith("data:")) return true;
  const u = new URL(src, "http://localhost/");
  if (u.pathname.startsWith("/jarvis_panel_static/")) return true;
  if (u.pathname.startsWith("/api/")) return u.searchParams.has("authSig");
  return false;
}

for (const theme of Object.keys(THEMES)) {
  applyTheme(theme);
  for (const key of viewKeys) {
    panel.route = { prefix: PREFIX, path: `/${key}` };
    await settle(15);
    const view = sr.querySelector("[data-jv-view]");
    const tag = view ? view.tagName.toLowerCase() : "(none)";
    check(`[${theme}] /${key} mounts jarvis-view-${key}`, tag === `jarvis-view-${key}`, `got ${tag}`);
    if (view) {
      const vs = view.shadowRoot;
      // text may live in nested shadow roots (a stub is jv-section > jv-empty with property-set copy)
      const hasContent = !!vs && [...vs.children].some((c) => c.tagName !== "STYLE") && deepText(view).trim().length > 0;
      check(`[${theme}] /${key} view shadowRoot has content`, hasContent);
      check(`[${theme}] /${key} view received hass/data/route`, view.hass === panel.hass && view.route?.path === `/${key}` && !!view.data);
      const errs = errorStates(view);
      check(`[${theme}] /${key} shows no error state with the fixtures`, errs.length === 0, errs.slice(0, 3).join(" | "));
    }
    check(`[${theme}] /${key} tab selected`, sr.querySelector(`[role="tab"][data-view="${key}"]`)?.getAttribute("aria-selected") === "true");
    themeChecks(`[${theme}] /${key}`);
  }
}

// ── settings: each category's tool cards and field editors (settings/tools) ─
// registerToolCard / registerFieldEditor run on import; settings.ts imports
// the tools barrel once, so a missing import shows up here as missing cards.
const SETTINGS_TOOL_CARDS = {
  core: ["briefing", "diagnostics"], voice: ["voice-confirm-test"], learning: [],
  safety: ["energy", "hazard", "mutes"], cameras: [], home: ["wellbeing"], governance: ["governance"],
};
const SETTINGS_FIELD_EDITORS = {
  core: ["jarvis-editor-model-role", "jarvis-editor-biometrics-map", "jv-picker"],
  voice: ["jarvis-editor-pairings", "jarvis-editor-toggle-list", "jarvis-editor-voice-confirm", "jv-picker"],
  learning: ["jv-picker"], safety: ["jarvis-editor-toggle-list", "jarvis-editor-appliances"], cameras: ["jv-picker"], home: ["jv-picker"],
};
/** tool card / field editor elements whose rendered check passed (completeness check: what ran, not what is listed) */
const toolCardTags = new Set();
const fieldEditorTags = new Set();
// every category either table names is visited: a field editor listed under a category with no tool-card
// entry is still navigated to and checked
const SETTINGS_CATEGORIES = [...new Set([...Object.keys(SETTINGS_TOOL_CARDS), ...Object.keys(SETTINGS_FIELD_EDITORS)])];
for (const theme of ["light", "dark"]) {
  applyTheme(theme);
  for (const cat of SETTINGS_CATEGORIES) {
    const ids = SETTINGS_TOOL_CARDS[cat] ?? [];
    panel.route = { prefix: PREFIX, path: `/settings/${cat}` };
    await settle(20);
    const view = sr.querySelector("jarvis-view-settings");
    const cards = [...(view?.shadowRoot?.querySelectorAll("[data-tool-id]") ?? [])];
    const got = cards.map((c) => c.dataset.toolId);
    check(`[${theme}] /settings/${cat} tool cards: ${ids.join(",") || "(none)"}`, got.join(",") === ids.join(","), got.join(","));
    if (got.join(",") === ids.join(",")) for (const c of cards) toolCardTags.add(c.tagName.toLowerCase());
    const empty = cards.filter((c) => !c.shadowRoot || deepText(c).trim().length === 0).map((c) => c.dataset.toolId);
    check(`[${theme}] /settings/${cat} every tool card rendered content`, empty.length === 0, empty.join(","));
    for (const tag of SETTINGS_FIELD_EDITORS[cat] ?? []) {
      const rendered = deepAll(view, tag).length > 0;
      check(`[${theme}] /settings/${cat} field editor <${tag}> rendered`, rendered);
      if (rendered) fieldEditorTags.add(tag);
    }
    const errs = view ? errorStates(view) : ["no view"];
    check(`[${theme}] /settings/${cat} shows no error state`, errs.length === 0, errs.slice(0, 3).join(" | "));
    themeChecks(`[${theme}] /settings/${cat}`);
  }
}
// ── settings: two field editors save one edit through jarvis/update_config ─
// (once, in HA light: the loop above leaves dark applied)
{
  applyTheme("light");
  const writes = [];
  const backend = makeHass("en");
  const fixtureCall = backend.callWS;
  backend.callWS = async (msg) => {
    if (msg.type === "jarvis/update_config") {
      writes.push({ key: msg.key, value: JSON.parse(JSON.stringify(msg.value)) });
      return { key: msg.key, value: msg.value };
    }
    return fixtureCall(msg);
  };
  panel.hass = backend;
  const settingsEditor = async (cat, tag) => {
    panel.route = { prefix: PREFIX, path: `/settings/${cat}` };
    await settle(20);
    return deepAll(sr.querySelector("jarvis-view-settings"), tag)[0] ?? null;
  };

  // voice_confirm_entities = ["light.living_room", "!camera.front_door"]: Require / Exempt per row
  const vc = await settingsEditor("voice", "jarvis-editor-voice-confirm");
  const vcRows = [...(vc?.shadowRoot?.querySelectorAll(".rows > li") ?? [])];
  const pressed = (li) => [...li.querySelectorAll(".seg button")].map((b) => b.getAttribute("aria-pressed")).join(",");
  check("voice-confirm: one row per stored entry, in order", vcRows.map((li) => li.title).join(",") === "light.living_room,!camera.front_door", vcRows.map((li) => li.title).join(","));
  check("voice-confirm: Require pressed for the bare id, Exempt for the '!' entry", vcRows.length === 2 && pressed(vcRows[0]) === "true,false" && pressed(vcRows[1]) === "false,true", vcRows.map(pressed).join(" | "));
  vcRows[0]?.querySelectorAll(".seg button")[1]?.click();
  await settle(20);
  check("voice-confirm: Exempt on the first row saves exactly voice_confirm_entities with '!light.living_room'",
    writes.length === 1 && writes[0].key === "voice_confirm_entities" && canon(writes[0].value) === canon(["!light.living_room", "!camera.front_door"]), JSON.stringify(writes));

  // biometric_entities = {heart_rate: "sensor.watch_heart_rate"}: nine kind -> entity pickers
  writes.length = 0;
  const bm = await settingsEditor("core", "jarvis-editor-biometrics-map");
  const bmRows = [...(bm?.shadowRoot?.querySelectorAll(".rows > li") ?? [])];
  const bmRow = (kind) => bmRows.find((li) => li.querySelector(".sec.jv-mono")?.textContent === kind);
  check("biometrics map: nine kind rows, no unknown kind", bmRows.length === 9 && !bmRows.some((li) => li.classList.contains("unknown")), `rows=${bmRows.length}`);
  check("biometrics map: heart_rate picker shows the stored entity", bmRow("heart_rate")?.querySelector("jv-picker")?.value === "sensor.watch_heart_rate" && bmRow("steps")?.querySelector("jv-picker")?.value === "");
  bmRow("steps")?.querySelector("jv-picker")?.dispatchEvent(new window.CustomEvent("value-changed", { detail: { value: "sensor.watch_steps" }, bubbles: true, composed: true }));
  await settle(20);
  check("biometrics map: picking steps saves exactly biometric_entities with both kinds",
    writes.length === 1 && writes[0].key === "biometric_entities" && canon(writes[0].value) === canon({ heart_rate: "sensor.watch_heart_rate", steps: "sensor.watch_steps" }), JSON.stringify(writes));
  const errs = errorStates(sr.querySelector("jarvis-view-settings"));
  check("settings editors: no error state after the saves", errs.length === 0, errs.slice(0, 3).join(" | "));
  panel.hass = makeHass("en");
  await settle(20);
}
panel.route = { prefix: PREFIX, path: "/settings/core/tool:briefing" };
await settle(20);
check("settings deep link /settings/core/tool:briefing flashes that card",
  sr.querySelector("jarvis-view-settings")?.shadowRoot?.querySelector('[data-tool-id="briefing"]')?.hasAttribute("flash") === true);
{
  // "Elsewhere in the panel" links: the old Settings cards that moved to a view
  window.history.replaceState(null, "", `${PREFIX}/settings/home`);
  panel.route = { prefix: PREFIX, path: "/settings/home" };
  await settle(20);
  const link = [...(sr.querySelector("jarvis-view-settings")?.shadowRoot?.querySelectorAll(".ports button") ?? [])].find((b) => /Floor Plan Editor/.test(b.textContent || ""));
  check("settings: 'Elsewhere in the panel' lists the floor-plan editor", !!link);
  link?.click();
  await settle(20);
  check("settings: that link opens /jarvis/residence/editor", window.location.pathname === `${PREFIX}/residence/editor` && !!planEditorNow(), window.location.pathname);
  // the Logs governance card is read-only and links to Settings › Governance
  panel.route = { prefix: PREFIX, path: "/logs" };
  await settle(20);
  const gov = deepAll(sr.querySelector("jarvis-view-logs"), "jv-logs-governance")[0];
  check("logs: governance card is read-only (no switches)", !!gov && gov.shadowRoot.querySelectorAll('input[type="checkbox"], ha-switch').length === 0 && /\d+ of \d+ ON/.test(deepText(gov)), deepText(gov).replace(/\s+/g, " ").slice(0, 160));
  [...(gov?.shadowRoot?.querySelectorAll("button") ?? [])].find((b) => /Change in Settings/.test(b.textContent || ""))?.click();
  await settle(20);
  check("logs: 'Change in Settings' -> /jarvis/settings/governance/tool:governance", window.location.pathname === `${PREFIX}/settings/governance/tool:governance`, window.location.pathname);
}
function planEditorNow() {
  return sr.querySelector("jarvis-view-residence")?.shadowRoot?.querySelector("jarvis-plan-editor") ?? null;
}

// ── floor-plan editor: every sub-tab, light and dark ───────────────────────
const EDITOR_TABS = { rooms: "jarvis-editor-rooms", openings: "jarvis-editor-openings", doors: "jarvis-editor-doors", pins: "jarvis-editor-pins", import: "jarvis-editor-import" };
const planEditor = () => sr.querySelector("jarvis-view-residence")?.shadowRoot?.querySelector("jarvis-plan-editor") ?? null;
const planCanvas = () => planEditor()?.shadowRoot?.querySelector("jv-plan-canvas") ?? null;
/** editor tab elements whose rendered check passed (completeness check) */
const editorTabTags = new Set();
for (const theme of ["light", "dark"]) {
  applyTheme(theme);
  for (const [tab, tag] of Object.entries(EDITOR_TABS)) {
    panel.route = { prefix: PREFIX, path: `/residence/editor/${tab}` };
    await settle(20);
    const ed = planEditor();
    check(`[${theme}] /residence/editor/${tab} mounts <jarvis-plan-editor>`, !!ed);
    if (!ed) continue;
    check(`[${theme}] editor/${tab}: store.tab follows the route`, ed.store.tab === tab, ed.store.tab);
    check(`[${theme}] editor/${tab}: <${tag}> is defined (not the placeholder)`, !!window.customElements.get(tag));
    const el = ed.shadowRoot?.querySelector(tag);
    const rendered = !!el?.shadowRoot && deepText(el).trim().length > 0;
    check(`[${theme}] editor/${tab}: <${tag}> rendered content`, rendered);
    if (rendered) editorTabTags.add(tag);
    const canvas = planCanvas();
    const drawn = canvas ? deepAll(canvas, '[data-hit^="room:"]').length : 0;
    check(`[${theme}] editor/${tab}: canvas draws every room of the floor`, drawn === ed.store.rooms().length && drawn > 0, `drawn=${drawn} rooms=${ed.store.rooms().length}`);
    check(`[${theme}] editor/${tab}: clean after load`, ed.store.loaded && !ed.store.dirty && ed.store.warnings.length === 0, ed.store.dirtyKeys.join(",") + " " + ed.store.warnings.join("; "));
    const errs = errorStates(ed);
    check(`[${theme}] editor/${tab}: no error state`, errs.length === 0, errs.slice(0, 3).join(" | "));
    themeChecks(`[${theme}] editor/${tab}`);
  }
}
applyTheme("light");

// ── keyboard focus survives a row's Remove (src/focus.ts keepRowFocus) ─────
// A keyboard user who activates a row's Remove lands on the same control in
// the next row, else in the previous row, else on the list's fallback (its
// Add control, a heading) - never on <body>. Each step focuses the control,
// activates it (Enter on a button is a click), settles and reads focus down
// through every shadow root.
function deepActive() {
  let a = document.activeElement;
  while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
  return a;
}
/** `node` is `ancestor` or inside it, across shadow roots */
function inside(node, ancestor) {
  for (let n = node; n; n = n.parentNode ?? n.host ?? null) if (n === ancestor) return true;
  return false;
}
/**
 * focus `btn`, click it, settle -> the deep focus (null when the control was missing or never took
 * focus); `latency`: also wait that long for a delayed backend reply, and settle again
 */
async function activate(btn, latency = 0) {
  if (!btn) return null;
  btn.focus();
  if (deepActive() !== btn) return null;
  btn.click();
  await settle(10);
  if (latency) {
    await sleep(latency);
    await settle(10);
  }
  return deepActive();
}
/** the websocket round trip the latency cases simulate (longer than activate's settle) */
const LATENCY = 80;
function describe(el) {
  if (!el) return "the control was missing or never had focus";
  const cls = typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/).join(".")}` : "";
  return `${el.tagName.toLowerCase()}${cls} in ${el.getRootNode()?.host?.tagName?.toLowerCase() ?? "document"}`;
}
{
  const tabRoot = (tag) => planEditor()?.shadowRoot?.querySelector(tag)?.shadowRoot ?? null;
  const store = planEditor()?.store;
  // Openings: the fixture's three on the 1st floor (e1, e2, e3)
  panel.route = { prefix: PREFIX, path: "/residence/editor/openings" };
  await settle(20);
  let root = tabRoot("jarvis-editor-openings");
  const opening = (id) => root?.querySelector(`.row[data-id="${id}"] [data-remove]`);
  let now = await activate(opening("e1"));
  check("focus: Openings - Remove on the first row -> the next row's Remove", !!now?.matches("[data-remove]") && now.closest(".row")?.dataset.id === "e2", describe(now));
  now = await activate(opening("e3"));
  check("focus: Openings - Remove on the last row -> the previous row's Remove", !!now?.matches("[data-remove]") && now.closest(".row")?.dataset.id === "e2", describe(now));
  now = await activate(opening("e2"));
  check("focus: Openings - Remove on the only row -> the first add button", !!now && now === root?.querySelector(".toolbar .jv-btn"), describe(now));

  // the editor's toasts: Dismiss hands focus to the next / previous toast, else the current editor tab
  for (const x of [...(store?.toasts ?? [])]) store.dismissToast(x.id);
  for (const m of ["Toast one", "Toast two", "Toast three"]) store?.toast(m, undefined, 0);
  await settle(10);
  const dismiss = (text) => [...(planEditor()?.shadowRoot?.querySelectorAll(".toasts > .toast") ?? [])].find((x) => x.textContent.includes(text))?.querySelector("[data-dismiss]");
  now = await activate(dismiss("Toast one"));
  check("focus: editor toast - Dismiss on the first -> the next toast's Dismiss", !!now?.matches("[data-dismiss]") && /Toast two/.test(now.closest(".toast")?.textContent || ""), describe(now));
  now = await activate(dismiss("Toast three"));
  check("focus: editor toast - Dismiss on the last -> the previous toast's Dismiss", !!now?.matches("[data-dismiss]") && /Toast two/.test(now.closest(".toast")?.textContent || ""), describe(now));
  now = await activate(dismiss("Toast two"));
  check("focus: editor toast - Dismiss on the only one -> the current editor tab", now?.getAttribute("role") === "tab" && now.getAttribute("aria-selected") === "true", describe(now));
  // auto-dismissing toasts: the one focus lands on holds its timer while it has focus, the others still go
  for (const m of ["Timed one", "Timed two", "Timed three"]) store?.toast(m, undefined, 400);
  await settle(5);
  const toastText = () => [...(planEditor()?.shadowRoot?.querySelectorAll(".toasts > .toast") ?? [])].map((x) => x.textContent.trim()).join(" | ");
  now = await activate(dismiss("Timed one"));
  check("focus: timed toast - Dismiss on the first -> the next toast's Dismiss", !!now?.matches("[data-dismiss]") && /Timed two/.test(now.closest(".toast")?.textContent || ""), describe(now));
  await sleep(600);
  await settle(5);
  now = deepActive();
  check("focus: timed toast - the focused toast outlives its 400 ms (held), the unfocused one is gone",
    /Timed two/.test(now?.closest?.(".toast")?.textContent || "") && !/Timed three/.test(toastText()), `${describe(now)}; toasts: ${toastText()}`);
  planEditor()?.shadowRoot?.querySelector('[role="tab"][aria-selected="true"]')?.focus();
  await sleep(1700); // released: at least TOAST_RESUME_MS (1.5 s) again
  await settle(5);
  check("focus: timed toast - once focus leaves, it auto-dismisses again", !/Timed two/.test(toastText()), toastText());
  // a held toast whose focused Undo a re-render strips (the history moved on): focus falls to <body>, and
  // some browsers send no focusout for that - swallowed here - yet the hold must end and the toast go
  for (const x of [...(store?.toasts ?? [])]) store.dismissToast(x.id);
  const held = store?.toast("Stripped toast", { label: "Undo", run: () => store.undo() }, 400);
  await settle(5);
  const strippedToast = () => [...(planEditor()?.shadowRoot?.querySelectorAll(".toasts > .toast") ?? [])].find((x) => x.textContent.includes("Stripped toast"));
  const undoBtn = strippedToast()?.querySelector(".jv-btn.text");
  undoBtn?.focus();
  check("focus: stripped toast - focus on its Undo holds it", !!undoBtn && deepActive() === undoBtn && !!store?.heldToasts.includes(held), describe(deepActive()));
  const swallow = (e) => e.stopImmediatePropagation();
  planEditor()?.shadowRoot?.addEventListener("focusout", swallow, true);
  store?.change("Smoke step", (d) => {
    d.floors.find((f) => f.key === store.floor).rooms[0].x += 1;
  });
  await settle(5);
  planEditor()?.shadowRoot?.removeEventListener("focusout", swallow, true);
  now = deepActive();
  check("focus: stripped toast - the Undo is gone, focus fell to <body> and the hold was released after the update",
    !!strippedToast() && !strippedToast().querySelector(".jv-btn.text") && (!now || now === document.body) && !store.heldToasts.includes(held), `${describe(now)}; held ${JSON.stringify(store?.heldToasts)}`);
  await sleep(1700); // released: at least TOAST_RESUME_MS (1.5 s)
  await settle(5);
  check("focus: stripped toast - it auto-dismisses", !strippedToast(), toastText());
  while (store?.dirty && store.canUndo) store.undo();
  await settle(10);
  check("focus: Openings - undo restores the three openings, clean", store?.openings().length === 3 && !store.dirty);

  // Doors: "Other mapped slots" (the fixture's garage_1 - no garage bays - plus two) against a backend that
  // keeps writes and answers after LATENCY ms, as HA does: the other Removes are disabled until it answers
  const stored = JSON.parse(JSON.stringify(fixture("panel_data")));
  stored.config.door_mapping = { ...stored.config.door_mapping, garage_7: "cover.garage_door", garage_8: "cover.garage_door" };
  const keeping = makeHass("en");
  const fixtureCall = keeping.callWS;
  let failNext = false;
  keeping.callWS = async (msg) => {
    if (msg.type === "jarvis/update_config") {
      await sleep(LATENCY);
      if (failNext) {
        failNext = false;
        throw { code: "update_failed", message: "simulated write failure" };
      }
      stored.config[msg.key] = JSON.parse(JSON.stringify(msg.value));
      return { key: msg.key, value: msg.value };
    }
    if (msg.type === "jarvis/get_panel_data") {
      wsCalls.push(msg.type);
      return JSON.parse(JSON.stringify(stored));
    }
    return fixtureCall(msg);
  };
  panel.hass = keeping;
  panel.route = { prefix: PREFIX, path: "/residence/editor/doors" };
  await panel.refresh();
  await settle(20);
  root = tabRoot("jarvis-editor-doors");
  const slot = (k) => root?.querySelector(`.other > li[data-slot="${k}"] [data-remove]`);
  check("focus: Doors - three other mapped slots listed", root?.querySelectorAll(".other > li").length === 3, String(root?.querySelectorAll(".other > li").length));
  now = await activate(slot("garage_1"));
  check("focus: Doors - while the write is in flight the row is gone and the other Removes are disabled",
    !slot("garage_1") && slot("garage_7")?.disabled === true && slot("garage_8")?.disabled === true && stored.config.door_mapping.garage_1 !== undefined, describe(now));
  await sleep(LATENCY);
  await settle(10);
  now = deepActive();
  check("focus: Doors - Remove on the first other slot -> the next one's Remove once the write answered", !!now?.matches("[data-remove]") && now.closest("li")?.dataset.slot === "garage_7", describe(now));
  failNext = true;
  now = await activate(slot("garage_8"), LATENCY);
  check("focus: Doors - a Remove whose write fails -> the row comes back with focus on its own Remove", !!now?.matches("[data-remove]") && now.closest("li")?.dataset.slot === "garage_8" && store?.settingStatus.door_mapping?.level === "error",
    `${describe(now)}; rows ${[...(root?.querySelectorAll(".other > li") ?? [])].map((li) => `${li.dataset.slot}${li.querySelector("[data-remove]")?.disabled ? "(disabled)" : ""}`).join(",")}; status ${JSON.stringify(store?.settingStatus.door_mapping)}`);
  now = await activate(slot("garage_8"), LATENCY);
  check("focus: Doors - Remove on the last other slot -> the previous one's Remove", !!now?.matches("[data-remove]") && now.closest("li")?.dataset.slot === "garage_7", describe(now));
  now = await activate(slot("garage_7"), LATENCY);
  check("focus: Doors - Remove on the only other slot -> the slot grid", !!now?.matches("fieldset.slots"), describe(now));
  check("focus: Doors - the removals wrote door_mapping with only the front door left", canon(stored.config.door_mapping) === canon({ front: "binary_sensor.front_door" }), canon(stored.config.door_mapping));
  panel.hass = makeHass("en");
  await panel.refresh();
  await settle(20);

  // Cameras & pins: the fixture's camera c1 and pin binary_sensor.front_door, plus two cameras and a pin
  panel.route = { prefix: PREFIX, path: "/residence/editor/pins" };
  await settle(20);
  store?.change("Add cameras and a pin", (d) => {
    const cam = (id, x) => ({ id, x, y: 60, angle: 0, fov: 90, range: 50, entity: "", indoor: true, extra: {} });
    d.cameras["1f"].push(cam("c8", 120), cam("c9", 160));
    d.pins["1f"].push({ e: "light.smoke_lamp", x: 150, y: 60, extra: {} });
  });
  await settle(10);
  root = tabRoot("jarvis-editor-pins");
  const camera = (id) => root?.querySelector(`.rows > .row[data-key="camera:${id}"] [data-remove]`);
  now = await activate(camera("c1"));
  check("focus: Cameras - Remove on the first camera -> the next camera's Remove", !!now?.matches("[data-remove]") && now.closest(".row")?.dataset.key === "camera:c8", describe(now));
  now = await activate(camera("c9"));
  check("focus: Cameras - Remove on the last camera -> the previous camera's Remove", !!now?.matches("[data-remove]") && now.closest(".row")?.dataset.key === "camera:c8", describe(now));
  store?.select({ kind: "camera", id: "c8" });
  await settle(10);
  now = await activate(root?.querySelector('.rows > .row[data-key="camera:c8"] .actions .jv-btn.danger'));
  check("focus: Cameras - Delete in the only camera's form -> + Camera", !!now && now === root?.querySelector(".toolbar .jv-btn"), describe(now));
  const pin = (e) => root?.querySelector(`.chips > .chip[data-key="pin:${e}"] [data-remove]`);
  now = await activate(pin("binary_sensor.front_door"));
  check("focus: Pins - Remove on the first pin -> the next pin's Remove", !!now?.matches("[data-remove]") && now.closest(".chip")?.dataset.key === "pin:light.smoke_lamp", describe(now));
  now = await activate(pin("light.smoke_lamp"));
  check("focus: Pins - Remove on the only pin -> the add picker", !!now && inside(now, root?.querySelector(".add-pin jv-picker")), describe(now));
  while (store?.dirty && store.canUndo) store.undo();
  await settle(10);
  check("focus: Cameras & pins - undo restores the fixture's camera and pin, clean", store?.cameras().length === 1 && store.pins().length === 1 && !store.dirty);

  // Rooms: a selected polygon corner's Remove corner -> the room inspector's heading (the corner block goes)
  panel.route = { prefix: PREFIX, path: "/residence/editor/rooms" };
  await settle(20);
  const floor = store?.floor;
  store?.change("Add room", (d) => {
    d.floors.find((f) => f.key === floor).rooms.push({ id: "smoke-poly", name: "Smoke Poly", x: 400, y: 5, w: 40, h: 30, type: "room", points: [[400, 5], [440, 5], [440, 35], [400, 35]], extra: {} });
  });
  store?.select({ kind: "vtx", id: "smoke-poly", sub: 1 });
  await settle(10);
  root = tabRoot("jarvis-editor-rooms");
  now = await activate(root?.querySelector('[aria-labelledby="corner-h"] .actions .jv-btn'));
  check("focus: Rooms - Remove corner -> the room inspector's heading", !!now && now === root?.querySelector("#insp-h") && store.rooms().find((r) => r.id === "smoke-poly")?.points?.length === 3, describe(now));
  store?.select(null);
  while (store?.dirty && store.canUndo) store.undo();
  await settle(10);
  check("focus: Rooms - undo removes the polygon room again, clean", !store?.rooms().some((r) => r.id === "smoke-poly") && !store.dirty);
}

// Settings list editors: appliances in place (/settings/safety, the fixture's
// Washer and Dryer); the others mounted on their own with what the field row
// does on a change (re-render, then hand the editor its new value).
{
  panel.route = { prefix: PREFIX, path: "/settings/safety" };
  await settle(20);
  const appl = deepAll(sr.querySelector("jarvis-view-settings"), "jarvis-editor-appliances")[0];
  const rows = () => [...(appl?.shadowRoot?.querySelectorAll(".list > .row") ?? [])];
  const dryer = rows()[1]?.dataset.uid;
  let now = await activate(rows()[0]?.querySelector("[data-remove]"));
  check("focus: Settings appliances - Remove on the first row -> the next row's Remove", !!now?.matches("[data-remove]") && now.closest(".row")?.dataset.uid === dryer && rows().length === 1, describe(now));
  now = await activate(rows()[0]?.querySelector("[data-remove]"));
  check("focus: Settings appliances - Remove on the only row -> + Add appliance", !!now && now === appl?.shadowRoot?.querySelector(".foot > .jv-btn"), describe(now));

  const box = document.createElement("div");
  document.body.appendChild(box);
  const mount = async (tag, props) => {
    const el = document.createElement(tag);
    Object.assign(el, { hass: panel.hass, label: tag, ...props });
    el.onChange = (next) => void Promise.resolve().then(() => { el.value = next; });
    box.appendChild(el);
    await settle(5);
    return el;
  };
  const vc = await mount("jarvis-editor-voice-confirm", { data: null, value: ["light.smoke_a", "!switch.smoke_b", "lock.smoke_c"] });
  const x = (k) => vc.shadowRoot.querySelector(`.rows > li[data-key="${k}"] .x`);
  now = await activate(x("light.smoke_a"));
  check("focus: Settings voice confirm - Remove on the first row -> the next row's Remove", !!now?.matches(".x") && now.closest("li")?.dataset.key === "!switch.smoke_b", describe(now));
  now = await activate(x("lock.smoke_c"));
  check("focus: Settings voice confirm - Remove on the last row -> the previous row's Remove", !!now?.matches(".x") && now.closest("li")?.dataset.key === "!switch.smoke_b", describe(now));
  now = await activate(x("!switch.smoke_b"));
  check("focus: Settings voice confirm - Remove on the only row -> the add picker", !!now && inside(now, vc.shadowRoot.querySelector("jv-picker")), describe(now));

  const pr = await mount("jarvis-editor-pairings", {
    satellites: [{ entity_id: "assist_satellite.kitchen", label: "Kitchen", name: "Kitchen" }],
    speakers: [],
    value: { "assist_satellite.gone_a": "media_player.a", "assist_satellite.gone_b": "media_player.b" },
  });
  const orphan = (k) => pr.shadowRoot.querySelector(`.rows > li[data-sat="${k}"] [data-remove]`);
  now = await activate(orphan("assist_satellite.gone_a"));
  check("focus: Settings pairings - Remove on the first orphan -> the next orphan's Remove", !!now?.matches("[data-remove]") && now.closest("li")?.dataset.sat === "assist_satellite.gone_b", describe(now));
  now = await activate(orphan("assist_satellite.gone_b"));
  check("focus: Settings pairings - Remove on the only orphan -> the satellite's speaker select", !!now?.matches("select, ha-select") && now.closest("li")?.dataset.sat === "assist_satellite.kitchen", describe(now));

  const bm = await mount("jarvis-editor-biometrics-map", { data: null, value: { heart_rate: "sensor.smoke_hr", smoke_a: "sensor.smoke_a", smoke_b: "sensor.smoke_b" } });
  const kind = (k) => bm.shadowRoot.querySelector(`.rows > li[data-kind="${k}"] .remove`);
  now = await activate(kind("smoke_a"));
  check("focus: Settings biometrics - Remove on the first unknown kind -> the next one's Remove", !!now?.matches(".remove") && now.closest("li")?.dataset.kind === "smoke_b", describe(now));
  now = await activate(kind("smoke_b"));
  check("focus: Settings biometrics - Remove on the only unknown kind -> the last kind's picker", !!now && inside(now, bm.shadowRoot.querySelector('.rows > li[data-kind="temperature"] jv-picker')), describe(now));
  box.remove();

  // Muted Announcements (/settings/safety): the chips come from the jarvis/mutes reply, LATENCY ms later;
  // every Unmute is disabled until it answers (the fixture's two entities and one category)
  const muted = JSON.parse(JSON.stringify(fixture("jarvis_mutes")));
  const backend = makeHass("en");
  const fixtureCall = backend.callWS;
  backend.callWS = async (msg) => {
    if (msg.type !== "jarvis/mutes") return fixtureCall(msg);
    wsCalls.push(msg.type);
    if (msg.action === "unmute") {
      await sleep(LATENCY);
      if (msg.entity_id) muted.entities = muted.entities.filter((x) => x !== msg.entity_id);
      if (msg.category) muted.categories = muted.categories.filter((x) => x !== msg.category);
    }
    return JSON.parse(JSON.stringify(muted));
  };
  panel.hass = backend;
  panel.route = { prefix: PREFIX, path: "/settings/core" };
  await settle(10);
  panel.route = { prefix: PREFIX, path: "/settings/safety" };
  await settle(20);
  const mutes = deepAll(sr.querySelector("jarvis-view-settings"), "jarvis-tool-mutes")[0];
  const unmute = (k) => mutes?.shadowRoot?.querySelector(`ul.chips > li[data-key="${k}"] button.jv-icon-btn`);
  check("focus: Settings mutes - one chip per muted entity and category", mutes?.shadowRoot?.querySelectorAll("ul.chips > li").length === 3, String(mutes?.shadowRoot?.querySelectorAll("ul.chips > li").length));
  now = await activate(unmute("entity:binary_sensor.back_door"));
  check("focus: Settings mutes - while jarvis/mutes is in flight every Unmute is disabled", unmute("entity:light.hallway_strip")?.disabled === true && muted.entities.includes("binary_sensor.back_door"), describe(now));
  await sleep(LATENCY);
  await settle(10);
  now = deepActive();
  check("focus: Settings mutes - Unmute on the first chip -> the next chip's Unmute once the list came back", !!now?.matches("button.jv-icon-btn") && now.closest("li")?.dataset.key === "entity:light.hallway_strip" && !unmute("entity:binary_sensor.back_door"), describe(now));
  now = await activate(unmute("category:appliances"), LATENCY);
  check("focus: Settings mutes - Unmute on the last chip -> the previous chip's Unmute", !!now?.matches("button.jv-icon-btn") && now.closest("li")?.dataset.key === "entity:light.hallway_strip", describe(now));
  now = await activate(unmute("entity:light.hallway_strip"), LATENCY);
  check("focus: Settings mutes - Unmute on the only chip -> the entity picker", !!now && inside(now, mutes?.shadowRoot?.querySelector(".add jv-picker")) && muted.entities.length === 0 && muted.categories.length === 0, describe(now));
  panel.hass = makeHass("en");
  await settle(10);
}

// ── editor round trip: add a room via the store, undo, redo, save, reload ──
{
  panel.route = { prefix: PREFIX, path: "/residence/editor/rooms" };
  await settle(20);
  const ed = planEditor();
  const store = ed?.store;
  check("editor: store available on <jarvis-plan-editor>", !!store);
  if (store) {
    const floor = store.floor;
    const before = store.rooms().length;
    const NAME = "Smoke Room";
    store.change("Add room", (doc) => {
      const f = doc.floors.find((x) => x.key === floor);
      f.rooms.push({ id: "smoke-room", name: NAME, x: 400, y: 5, w: 40, h: 30, type: "room", extra: {} });
    });
    await settle(10);
    check("editor: add room -> one more room", store.rooms().length === before + 1, `${store.rooms().length} vs ${before}`);
    check("editor: add room -> dirty with exactly floor_plan_rooms", store.dirty && store.dirtyKeys.join(",") === "floor_plan_rooms", store.dirtyKeys.join(","));
    check("editor: add room -> undo available with its label", store.canUndo && /Add room/.test(store.undoLabel), store.undoLabel);
    check("editor: the canvas draws the new room", !!planCanvas() && deepAll(planCanvas(), '[data-hit="room:smoke-room"]').length === 1);
    store.undo();
    await settle(10);
    check("editor: undo -> room gone, clean again, redo available", store.rooms().length === before && !store.dirty && store.canRedo);
    check("editor: undo -> the canvas no longer draws it", deepAll(planCanvas(), '[data-hit="room:smoke-room"]').length === 0);
    store.redo();
    await settle(10);
    check("editor: redo -> room back, dirty", store.rooms().length === before + 1 && store.dirty);

    // save against a backend that keeps what it is sent
    const stored = JSON.parse(JSON.stringify(fixture("panel_data")));
    const writes = [];
    const backend = makeHass("en");
    const fixtureCall = backend.callWS;
    backend.callWS = async (msg) => {
      if (msg.type === "jarvis/update_config") {
        writes.push({ key: msg.key, value: JSON.parse(JSON.stringify(msg.value)) });
        stored.config[msg.key] = JSON.parse(JSON.stringify(msg.value));
        return { key: msg.key, value: msg.value };
      }
      if (msg.type === "jarvis/get_panel_data") {
        wsCalls.push(msg.type);
        return JSON.parse(JSON.stringify(stored));
      }
      return fixtureCall(msg);
    };
    panel.hass = backend;
    await settle(10);
    const snapshotsBefore = wsCalls.filter((t) => t === "jarvis/get_panel_data").length;
    const res = await store.save();
    await sleep(400);
    await settle(20);
    check("editor: save resolves ok", res && res.ok === true, JSON.stringify(res).slice(0, 160));
    check("editor: save writes exactly floor_plan_rooms once", writes.length === 1 && writes[0].key === "floor_plan_rooms", writes.map((w) => w.key).join(","));
    const saved = writes[0]?.value;
    const original = fixture("panel_data").config.floor_plan_rooms;
    const savedRooms = saved?.[floor]?.rooms ?? [];
    const added = savedRooms.filter((r) => r.name === NAME);
    check("editor: the new room is serialised as {name, x, y, w, h, type} (no client id)", added.length === 1 && canon(added[0]) === canon({ name: NAME, x: 400, y: 5, w: 40, h: 30, type: "room" }), JSON.stringify(added));
    const withoutNew = saved ? JSON.parse(JSON.stringify(saved)) : null;
    if (withoutNew?.[floor]?.rooms) withoutNew[floor].rooms = withoutNew[floor].rooms.filter((r) => r.name !== NAME);
    check("editor: round trip - the rest of the saved plan equals the stored fixture plan", canon(withoutNew) === canon(original), canon(withoutNew).slice(0, 200));
    check("editor: clean after save, history kept", !store.dirty && store.canUndo);
    check("editor: a successful save asks the shell for a fresh snapshot", wsCalls.filter((t) => t === "jarvis/get_panel_data").length > snapshotsBefore);
    check("editor: reloaded snapshot with the saved plan is adopted silently", !store.remoteChanged && !store.dirty && store.rooms().some((r) => r.name === NAME));
    panel.hass = makeHass("en");
    await settle(10);
  }
}

// ── editor backgrounds: one floor per jarvis/set_floor_background message ──
{
  panel.route = { prefix: PREFIX, path: "/residence/editor/import" };
  await settle(20);
  const store = planEditor()?.store;
  check("backgrounds: store available on the Import tab", !!store);
  if (store) {
    // a backend that merges one floor like floorplan_import.merge_floor_background
    const stored = JSON.parse(JSON.stringify(fixture("panel_data")));
    stored.config.floor_plan_bg = { "2f": "data:image/png;base64,TWO" };
    const sent = [];
    /** floors whose write the backend refuses, and how long it takes to answer (the plan-file import below) */
    const rejectFloors = new Set();
    let bgLatency = 0;
    const floorLatency = new Map(); // per-floor latency, over bgLatency (answers out of order)
    const backend = makeHass("en");
    const fixtureCall = backend.callWS;
    backend.callWS = async (msg) => {
      if (msg.type === "jarvis/set_floor_background") {
        sent.push(JSON.parse(JSON.stringify(msg)));
        const latency = floorLatency.get(msg.floor) ?? bgLatency;
        if (latency) await sleep(latency);
        if (rejectFloors.has(msg.floor)) throw { code: "update_failed", message: "simulated disk full" };
        const bg = { ...stored.config.floor_plan_bg };
        if ("image" in msg) {
          if (msg.image) bg[msg.floor] = msg.image;
          else delete bg[msg.floor];
        }
        if ("align" in msg) {
          const al = { ...(bg._align || {}) };
          if (msg.align) al[msg.floor] = msg.align;
          else delete al[msg.floor];
          if (Object.keys(al).length) bg._align = al;
          else delete bg._align;
        }
        stored.config.floor_plan_bg = bg;
        return { floor: msg.floor, bytes: typeof bg[msg.floor] === "string" ? bg[msg.floor].length : 0, align: bg._align?.[msg.floor] ?? null };
      }
      if (msg.type === "jarvis/update_config") sent.push(JSON.parse(JSON.stringify(msg)));
      if (msg.type === "jarvis/get_panel_data") {
        wsCalls.push(msg.type);
        return JSON.parse(JSON.stringify(stored));
      }
      return fixtureCall(msg);
    };
    panel.hass = backend;
    await settle(10);
    store.refresh(); // load the 2f background from this backend first
    await sleep(400);
    await settle(10);
    check("backgrounds: the stored 2f image is loaded", store.settings.bg["2f"] === "data:image/png;base64,TWO", JSON.stringify(store.settings.bg));
    const img = "data:image/png;base64,ONE";
    const ok = await store.writeFloorBackground("1f", { image: img });
    check("backgrounds: an upload resolves ok", ok === true, JSON.stringify(store.settingStatus.floor_plan_bg));
    check("backgrounds: an upload sends exactly that floor's image", sent.length === 1 && sent[0].type === "jarvis/set_floor_background" && sent[0].floor === "1f" && sent[0].image === img && !("align" in sent[0]), JSON.stringify(sent).slice(0, 200));
    check("backgrounds: the editor shows the new image and the other floor stays", store.settings.bg["1f"] === img && store.settings.bg["2f"] === "data:image/png;base64,TWO", JSON.stringify(store.settings.bg));
    await sleep(400);
    await settle(10);
    sent.length = 0;
    const align = { x: 1.5, y: -2, w: 300 };
    await store.writeFloorBackground("1f", { align });
    check("backgrounds: an alignment sends no image at all", sent.length === 1 && canon(sent[0]) === canon({ type: "jarvis/set_floor_background", floor: "1f", align }), JSON.stringify(sent).slice(0, 200));
    check("backgrounds: the alignment is stored under _align, images kept", canon(stored.config.floor_plan_bg) === canon({ "1f": img, "2f": "data:image/png;base64,TWO", _align: { "1f": align } }), canon(stored.config.floor_plan_bg).slice(0, 200));
    await sleep(400);
    await settle(10);
    sent.length = 0;
    const huge = "data:image/png;base64," + "A".repeat(4 * 1024 * 1024);
    const refused = await store.writeFloorBackground("bsmt", { image: huge });
    check("backgrounds: an image over the 4 MiB frame is refused before sending", refused === false && sent.length === 0 && store.settingStatus.floor_plan_bg?.level === "error" && /per image/.test(store.settingStatus.floor_plan_bg?.message || ""), JSON.stringify(store.settingStatus.floor_plan_bg).slice(0, 160));
    check("backgrounds: the refused image never reaches the overlay", !store.settings.bg.bsmt);
    await store.writeFloorBackground("1f", { image: null, align: null });
    check("backgrounds: remove sends null image and alignment for that floor", sent.length === 1 && sent[0].image === null && sent[0].align === null && sent[0].floor === "1f");
    check("backgrounds: remove leaves the other floors' images", canon(stored.config.floor_plan_bg) === canon({ "2f": "data:image/png;base64,TWO" }) && !store.settings.bg["1f"], canon(stored.config.floor_plan_bg));
    check("backgrounds: floor_plan_bg is never written whole", !sent.some((m) => m.type === "jarvis/update_config"));

    // a plan file with two background images, written floor by floor through the Import tab's handler
    await sleep(400);
    await settle(10);
    const imp = planEditor()?.shadowRoot?.querySelector("jarvis-editor-import");
    const bgCard = () => imp?.shadowRoot?.querySelector('section[aria-labelledby="imp-bg-h"]');
    const planCard = () => imp?.shadowRoot?.querySelector('section[aria-labelledby="imp-file-h"]');
    const planFile = (bg) => ({ target: { value: "", files: [{ text: async () => JSON.stringify({ jarvis_floor_plan: 1, floor_plan_bg: bg }) }] } });
    /** wait for confirmDialog's <jv-confirm> and press its confirm button */
    const acceptConfirm = async () => {
      for (let waited = 0; waited < 2000; waited += 10) {
        const btn = document.body.querySelector("jv-confirm")?.shadowRoot?.querySelector("[data-autofocus]");
        if (btn) {
          btn.click();
          return true;
        }
        await sleep(10);
      }
      return false;
    };
    const ONE = "data:image/png;base64,T05F", TWO = "data:image/png;base64,VFdP";
    const two = { "1f": ONE, "2f": TWO, _align: { "1f": { x: 1, y: 2, w: 300 } } };
    const label = (f) => store.floorLabel(f);
    check("backgrounds: the Import tab is mounted", !!imp && !!bgCard() && !!planCard());
    sent.length = 0;
    rejectFloors.clear();
    rejectFloors.add("2f");
    bgLatency = LATENCY;
    let run = imp?._onPlanFile(planFile(two));
    check("backgrounds: plan file - 'Also import 2 background images?' is confirmed", await acceptConfirm());
    await sleep(LATENCY / 2);
    await settle(2);
    const upload = bgCard()?.querySelector(".actions .jv-btn");
    const bgButtons = [...(bgCard()?.querySelectorAll("button") ?? [])];
    check("backgrounds: plan file - while its writes are in flight the background card is busy (Upload / Remove / Align disabled)",
      imp?._busy === "bg" && upload?.getAttribute("aria-busy") === "true" && bgButtons.length > 0 && bgButtons.every((b) => b.disabled), `busy=${imp?._busy} ${bgButtons.map((b) => `${b.textContent.trim()}:${b.disabled}`).join(", ")}`);
    await run;
    await settle(10);
    const noticeText = () => planCard()?.querySelector("ha-alert, [role='alert']")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    check("backgrounds: plan file - one set_floor_background per floor, with that floor's alignment only",
      sent.length === 2 && sent.every((m) => m.type === "jarvis/set_floor_background") && sent[0].floor === "1f" && sent[0].image === ONE && canon(sent[0].align) === canon({ x: 1, y: 2, w: 300 }) && sent[1].floor === "2f" && sent[1].image === TWO && !("align" in sent[1]),
      JSON.stringify(sent).slice(0, 240));
    check("backgrounds: plan file - a partial failure names the failed floor (only)",
      noticeText().includes(`Imported 1 of 2 background images; ${label("2f")} failed — simulated disk full`) && !noticeText().includes(label("1f")), noticeText());
    check("backgrounds: plan file - busy cleared after the loop, the stored floor kept", imp?._busy === "" && !bgCard()?.querySelector(".actions .jv-btn")?.disabled && stored.config.floor_plan_bg["1f"] === ONE, `busy=${imp?._busy}`);
    sent.length = 0;
    rejectFloors.add("1f");
    run = imp?._onPlanFile(planFile(two));
    await acceptConfirm();
    await run;
    await settle(10);
    check("backgrounds: plan file - every floor failing shows the plain failure notice", sent.length === 2 && noticeText().includes("Image import failed — simulated disk full") && !/Imported \d+ of/.test(noticeText()), noticeText());

    // the loop owns the background card: an align tool open when it starts is cancelled first (its Done /
    // Enter would commit mid-loop), an alignment that does end inside the loop releases only its own busy
    // claim, and a second Import JSON is ignored meanwhile - focus stays on it (aria-disabled, not disabled)
    rejectFloors.clear();
    bgLatency = 150;
    sent.length = 0;
    await sleep(400);
    await settle(10);
    planCanvas()?.setTool({ id: "bg-align", order: 8.5, hits: ["*"], render: () => null });
    await settle(5);
    const alignWasOpen = planCanvas()?.tool?.id === "bg-align";
    run = imp?._onPlanFile(planFile(two));
    await acceptConfirm();
    await sleep(bgLatency / 2);
    await settle(2);
    check("backgrounds: plan file - an open align tool is cancelled before the backgrounds are written", alignWasOpen && !planCanvas()?.tool && imp?._busy === "bg", `tool=${planCanvas()?.tool?.id} busy=${imp?._busy}`);
    const importJson = [...(planCard()?.querySelectorAll(".actions .jv-btn") ?? [])].find((b) => /Import JSON/.test(b.textContent || ""));
    const planInput = imp?.shadowRoot?.querySelector("#imp-plan-file");
    let picked = 0;
    if (planInput) planInput.click = () => { picked += 1; };
    importJson?.focus();
    importJson?.click();
    await settle(2);
    if (planInput) delete planInput.click;
    check("backgrounds: plan file - Import JSON is ignored while busy, aria-disabled and still focused",
      !!importJson && picked === 0 && importJson.getAttribute("aria-disabled") === "true" && !importJson.disabled && deepActive() === importJson, `picked=${picked} aria-disabled=${importJson?.getAttribute("aria-disabled")} ${describe(deepActive())}`);
    const alignRun = imp?._writeAlign("1f", { x: 0, y: 0, w: 120 });
    const alignBusy = imp?._busy;
    await alignRun;
    check("backgrounds: plan file - an alignment ending inside the loop leaves the loop's busy state", alignBusy === "align" && imp?._busy === "bg", `during=${alignBusy} after=${imp?._busy} sent=${sent.length}`);
    await run;
    await settle(10);
    check("backgrounds: plan file - busy cleared once the loop ends", imp?._busy === "" && sent.length === 3 && importJson?.getAttribute("aria-disabled") === "false", `busy=${imp?._busy} sent=${sent.length}`);

    // overlapping writes of floor_plan_bg: the earlier (1f) is refused, the later (2f) confirmed -> the
    // editor shows the 2f image and the stored 1f one, not the refused 1f image the later write's overlay held
    await sleep(400);
    await settle(10);
    bgLatency = 40;
    rejectFloors.add("1f");
    const stored1f = stored.config.floor_plan_bg["1f"];
    const X1 = "data:image/png;base64,WDE=", X2 = "data:image/png;base64,WDI=";
    const w1 = store.writeFloorBackground("1f", { image: X1 });
    const w2 = store.writeFloorBackground("2f", { image: X2 });
    const both = await Promise.all([w1, w2]);
    check("backgrounds: overlapping writes - the refused earlier floor is dropped, the confirmed later one shown",
      both[0] === false && both[1] === true && store.settings.bg["2f"] === X2 && store.settings.bg["1f"] === stored1f && store.settingStatus.floor_plan_bg?.level === "saved",
      `${JSON.stringify(both)} 1f=${String(store.settings.bg["1f"]).slice(0, 40)} 2f=${String(store.settings.bg["2f"]).slice(0, 40)} ${JSON.stringify(store.settingStatus.floor_plan_bg)}`);
    rejectFloors.clear();

    // the later write (2f) answers first while the earlier (1f) is still in flight: both floors stay
    // shown (writes to different floors are independent), and 1f's late success folds in, not dropped
    await sleep(400);
    await settle(10);
    floorLatency.set("1f", 160).set("2f", 20);
    const Y1 = "data:image/png;base64,WTE=", Y2 = "data:image/png;base64,WTI=";
    const v1 = store.writeFloorBackground("1f", { image: Y1 });
    const v2 = store.writeFloorBackground("2f", { image: Y2 });
    await v2;
    const midBg = { ...store.settings.bg };
    await v1;
    check("backgrounds: out-of-order answers - the in-flight earlier floor stays shown when the later one answers first",
      midBg["1f"] === Y1 && midBg["2f"] === Y2, `1f=${String(midBg["1f"]).slice(0, 40)} 2f=${String(midBg["2f"]).slice(0, 40)}`);
    check("backgrounds: out-of-order answers - the earlier floor's late success is kept, status saved",
      store.settings.bg["1f"] === Y1 && store.settings.bg["2f"] === Y2 && store.settingStatus.floor_plan_bg?.level === "saved",
      `1f=${String(store.settings.bg["1f"]).slice(0, 40)} 2f=${String(store.settings.bg["2f"]).slice(0, 40)} ${JSON.stringify(store.settingStatus.floor_plan_bg)}`);
    floorLatency.clear();
    bgLatency = 0;

    // Remove background goes away with the image: keyboard focus moves to the upload button in its place
    await sleep(400);
    await settle(10);
    const removeBg = [...(bgCard()?.querySelectorAll(".actions .jv-btn") ?? [])].find((b) => /Remove background/.test(b.textContent || ""));
    removeBg?.focus();
    removeBg?.click();
    const removeConfirmed = await acceptConfirm();
    for (let waited = 0; waited < 1000 && bgCard()?.querySelector(".actions .jv-btn.danger-text"); waited += 10) await sleep(10);
    await settle(10);
    check("backgrounds: after Remove background, focus is on the upload button that took its place",
      !!removeBg && removeConfirmed && !bgCard()?.querySelector(".actions .jv-btn.danger-text") && deepActive()?.hasAttribute?.("data-bg-upload") === true, describe(deepActive()));
    panel.hass = makeHass("en");
    await sleep(400);
    await settle(10);
  }
}

// ── overlapping immediate-save writes of one key (the opacity slider's change, twice) ──────────────
// Only the latest write started sets the status or reverts, and it reverts to the last CONFIRMED value
// (no overlay when none was), never to the overlay it saw. The backend answers each write when told to.
{
  panel.route = { prefix: PREFIX, path: "/residence/editor/import" };
  await settle(20);
  const store = planEditor()?.store;
  check("overlapping writes: store available", !!store);
  if (store) {
    const KEY = "floor_plan_bg_opacity";
    const stored = JSON.parse(JSON.stringify(fixture("panel_data")));
    const base = stored.config[KEY]; // 0.2 in the fixture
    /** writes of KEY waiting for an answer, in send order */
    const waiting = [];
    const backend = makeHass("en");
    const fixtureCall = backend.callWS;
    backend.callWS = async (msg) => {
      if (msg.type === "jarvis/update_config" && msg.key === KEY) {
        return new Promise((resolve, reject) => waiting.push({
          value: msg.value,
          ok() { stored.config[KEY] = msg.value; resolve({ key: KEY, value: msg.value }); },
          fail() { reject({ code: "update_failed", message: "simulated refusal" }); },
        }));
      }
      if (msg.type === "jarvis/get_panel_data") {
        wsCalls.push(msg.type);
        return JSON.parse(JSON.stringify(stored));
      }
      return fixtureCall(msg);
    };
    panel.hass = backend;
    await panel.refresh();
    await settle(10);
    const shown = () => store.settings.bgOpacity;
    const level = () => store.settingStatus[KEY]?.level;
    /** start two overlapping writes; resolves once both reached the backend */
    const overlap = async (a, b) => {
      waiting.length = 0;
      const first = store.writeSetting(KEY, a);
      const second = store.writeSetting(KEY, b);
      for (let i = 0; i < 50 && waiting.length < 2; i++) await sleep(2);
      return [first, second];
    };
    check("overlapping writes: the fixture's opacity is loaded", shown() === base, String(shown()));

    // earlier confirmed, later refused (answered in that order): back to the earlier value, error
    let [first, second] = await overlap(0.4, 0.6);
    check("overlapping writes: both in flight -> the later value shows, saving", waiting.length === 2 && shown() === 0.6 && level() === "saving", `${waiting.length} ${shown()} ${level()}`);
    waiting[0].ok();
    await first;
    check("overlapping writes: the earlier one confirmed while the later is in flight -> still the later value, saving", shown() === 0.6 && level() === "saving", `${shown()} ${level()}`);
    waiting[1].fail();
    const r1 = [await first, await second];
    check("overlapping writes: earlier confirmed + later refused -> the confirmed earlier value, error", r1[0] === true && r1[1] === false && shown() === 0.4 && level() === "error", `${JSON.stringify(r1)} ${shown()} ${level()}`);
    await sleep(400);
    await settle(10);
    check("overlapping writes: ... and the next snapshot agrees", shown() === 0.4 && stored.config[KEY] === 0.4, `${shown()} ${stored.config[KEY]}`);

    // the same, the later refusal answering first: nothing confirmed yet -> the snapshot's value, then the
    // earlier confirmation shows; the later write's error stands (the user's last change did not save)
    [first, second] = await overlap(0.5, 0.7);
    waiting[1].fail();
    await second;
    check("overlapping writes: later refused before the earlier answered -> no overlay (the snapshot's value), error", shown() === 0.4 && level() === "error", `${shown()} ${level()}`);
    waiting[0].ok();
    await first;
    check("overlapping writes: ... the earlier confirmation then shows, the error stays", shown() === 0.5 && level() === "error", `${shown()} ${level()}`);
    await sleep(400);
    await settle(10);

    // the reverse: earlier refused, later confirmed -> the later value throughout, saved
    [first, second] = await overlap(0.3, 0.8);
    waiting[0].fail();
    await first;
    check("overlapping writes: earlier refused while the later is in flight -> still the later value, saving (no revert)", shown() === 0.8 && level() === "saving", `${shown()} ${level()}`);
    waiting[1].ok();
    const r2 = [await first, await second];
    check("overlapping writes: earlier refused + later confirmed -> the later value, saved", r2[0] === false && r2[1] === true && shown() === 0.8 && level() === "saved", `${JSON.stringify(r2)} ${shown()} ${level()}`);
    await sleep(400);
    await settle(10);
    check("overlapping writes: ... and the next snapshot agrees", shown() === 0.8 && stored.config[KEY] === 0.8, `${shown()} ${stored.config[KEY]}`);
    panel.hass = makeHass("en");
    await panel.refresh();
    await settle(10);
  }
}

// ── narrow editor: the canvas is as tall as the fitted plan; the grid fills what the svg shows ──
// jsdom has no layout: the CSS that sizes the svg and the ratio the canvas sets on it are asserted,
// and a letterboxed box is simulated by giving the svg a client rect taller than the plan needs.
{
  panel.route = { prefix: PREFIX, path: "/residence/editor/rooms" };
  await settle(20);
  const wide = planCanvas();
  const wideRule = wide ? flatRules(ownCss(wide.shadowRoot)).find((r) => r.selector === "svg") : null;
  check("editor canvas: the wide svg keeps its clamp(360px, 65vh, 820px) height", !!wideRule && /height:\s*clamp\(360px,\s*65vh,\s*820px\)/.test(wideRule.decls), wideRule?.decls);
  panel.narrow = true;
  await settle(20);
  const canvas = planCanvas();
  const svgEl = canvas?.shadowRoot?.querySelector("svg");
  check("narrow editor: the canvas is narrow", canvas?.hasAttribute("narrow") === true);
  canvas?.fit();
  await settle(5);
  const fitted = canvas?.fittedViewBox;
  const ratioOf = () => Number(/--jv-plan-ratio:\s*([\d.]+)/.exec(svgEl?.getAttribute("style") || "")?.[1]);
  check("narrow editor: the svg carries the auto-fit viewBox's aspect ratio", !!fitted && Math.abs(ratioOf() - fitted.w / fitted.h) < 1e-3, `style="${svgEl?.getAttribute("style")}" fitted=${JSON.stringify(fitted)}`);
  const rule = canvas ? flatRules(ownCss(canvas.shadowRoot)).find((r) => r.selector === ":host([narrow]) svg") : null;
  check("narrow editor: the narrow svg height follows that ratio, at least 260 px and at most min(70vh, 520px)",
    !!rule && /height:\s*auto/.test(rule.decls) && /aspect-ratio:\s*var\(--jv-plan-ratio/.test(rule.decls) && /min-height:\s*260px/.test(rule.decls) && /max-height:\s*min\(70vh,\s*520px\)/.test(rule.decls), rule?.decls);
  const ratio = ratioOf();
  canvas?.zoomBy(0.5);
  canvas?.panBy(30, 10);
  await settle(5);
  check("narrow editor: zoom and pan leave the canvas's ratio (its size) alone", !!fitted && ratioOf() === ratio && canvas.viewBox.w !== fitted.w, `ratio ${ratio} -> ${ratioOf()}`);
  if (canvas && svgEl) {
    canvas.fit();
    const vb = canvas.viewBox;
    const W = 300, H = Math.round((W * vb.h) / vb.w) + 200; // taller than the plan: `meet` leaves bands above and below
    svgEl.getBoundingClientRect = () => ({ left: 0, top: 0, right: W, bottom: H, width: W, height: H, x: 0, y: 0, toJSON() {} });
    canvas.requestRender();
    await settle(5);
    const grid = svgEl.querySelector('g[data-layer="grid"] > rect');
    const s = W / vb.w;
    const want = { x: vb.x, y: vb.y - (H - vb.h * s) / 2 / s, w: vb.w, h: H / s };
    const got = { x: Number(grid?.getAttribute("x")), y: Number(grid?.getAttribute("y")), w: Number(grid?.getAttribute("width")), h: Number(grid?.getAttribute("height")) };
    const near = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));
    check("letterboxed canvas: the grid covers the whole svg (the bands above and below the plan too)", near(got.x, want.x) && near(got.y, want.y) && near(got.w, want.w) && near(got.h, want.h) && got.h > vb.h, `grid ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
    delete svgEl.getBoundingClientRect;
  }
  panel.narrow = false;
  await settle(10);
  planCanvas()?.fit();
}

// ── sub-routes: /residence/editor stays with the Residence view ────────────
panel.route = { prefix: PREFIX, path: "/residence/editor" };
await settle(10);
{
  const view = sr.querySelector("[data-jv-view]");
  check("sub-route /residence/editor mounts jarvis-view-residence", view?.tagName.toLowerCase() === "jarvis-view-residence", view?.tagName);
  check("sub-route: view.route.path is the full path", view?.route?.path === "/residence/editor", view?.route?.path);
  check("sub-route: view.subPath === 'editor'", view?.subPath === "editor", String(view?.subPath));
  check("sub-route: residence tab selected", sr.querySelector('[role="tab"][data-view="residence"]')?.getAttribute("aria-selected") === "true");
}
panel.route = { prefix: PREFIX, path: "/settings/cameras/foo" };
await settle(10);
check("sub-route: nested subPath 'cameras/foo'", sr.querySelector("[data-jv-view]")?.subPath === "cameras/foo");

// ── narrow: bottom nav instead of tabs ─────────────────────────────────────
panel.route = { prefix: PREFIX, path: "/overview" };
panel.narrow = true;
await settle(10);
const nav = sr.querySelector("nav.bottom");
check("narrow: bottom nav rendered", !!nav);
check("narrow: tablist hidden", !sr.querySelector('[role="tablist"]'));
check("narrow: menu button present", !!(sr.querySelector("ha-menu-button") || sr.querySelector(".menu-btn")));
{
  const items = [...nav.querySelectorAll(".nav-item")];
  check("narrow: five items (4 primary + More)", items.length === 5, `items=${items.length}`);
  const primary = items.filter((i) => !i.hasAttribute("data-more")).map((i) => i.dataset.view);
  check("narrow: primary items are " + PRIMARY_NAV.join(","), primary.join(",") === PRIMARY_NAV.join(","), primary.join(","));
  const more = nav.querySelector(".nav-item[data-more]");
  check("narrow: More is the last item", items[items.length - 1] === more);
  check("narrow: More has aria-haspopup=dialog and aria-expanded=false", more?.getAttribute("aria-haspopup") === "dialog" && more?.getAttribute("aria-expanded") === "false");
  check("narrow: overview is current, More is not", nav.querySelector('[data-view="overview"]')?.getAttribute("aria-current") === "page" && !more?.hasAttribute("aria-current") && !more?.hasAttribute("data-view"));
  check("narrow: no sheet before More is pressed", !sr.querySelector('[role="dialog"]'));

  // open the sheet
  more.click();
  await settle(10);
  const sheet = sr.querySelector('.sheet[role="dialog"]');
  check("More: bottom sheet opens as role=dialog aria-modal", !!sheet && sheet.getAttribute("aria-modal") === "true" && !!sheet.getAttribute("aria-labelledby"));
  check("More: aria-expanded=true while open", more.getAttribute("aria-expanded") === "true");
  check("More: header, main and nav are inert while open", sr.querySelector("header")?.hasAttribute("inert") && sr.querySelector("main")?.hasAttribute("inert") && nav.hasAttribute("inert"));
  const sheetItems = [...(sheet?.querySelectorAll(".sheet-item[data-view]") ?? [])];
  check("More: sheet lists the six secondary views in order", sheetItems.map((i) => i.dataset.view).join(",") === SECONDARY_NAV.join(","), sheetItems.map((i) => i.dataset.view).join(","));
  check("More: focus moved into the sheet", !!sheet && sheet.contains(sr.activeElement), sr.activeElement?.outerHTML?.slice(0, 60));
  // focus trap: Tab from the last focusable wraps to the first, Shift+Tab back
  const focusables = [...sheet.querySelectorAll('button:not([disabled])')];
  focusables[focusables.length - 1].focus();
  sheet.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
  check("More: Tab on the last control wraps to the first", sr.activeElement === focusables[0], sr.activeElement?.outerHTML?.slice(0, 60));
  sheet.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
  check("More: Shift+Tab on the first control wraps to the last", sr.activeElement === focusables[focusables.length - 1], sr.activeElement?.outerHTML?.slice(0, 60));
  // Escape closes and returns focus to More
  sheet.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  await settle(10);
  check("More: Escape closes the sheet", !sr.querySelector('[role="dialog"]'));
  check("More: focus returns to the More item", sr.activeElement === nav.querySelector(".nav-item[data-more]"), sr.activeElement?.outerHTML?.slice(0, 60));
  check("More: inert lifted after close", !sr.querySelector("main")?.hasAttribute("inert"));

  // scrim click closes
  nav.querySelector(".nav-item[data-more]").click();
  await settle(10);
  check("More: reopens", !!sr.querySelector('[role="dialog"]'));
  sr.querySelector(".scrim").click();
  await settle(10);
  check("More: scrim click closes the sheet", !sr.querySelector('[role="dialog"]'));

  // picking a secondary view navigates, closes the sheet and shows it as current in the bar
  window.history.replaceState(null, "", `${PREFIX}/overview`);
  nav.querySelector(".nav-item[data-more]").click();
  await settle(10);
  sr.querySelector('.sheet-item[data-view="cameras"]').click();
  await settle(10);
  check("More: picking Cameras -> URL /jarvis/cameras", window.location.pathname === `${PREFIX}/cameras`, window.location.pathname);
  check("More: picking Cameras mounts jarvis-view-cameras", sr.querySelector("[data-jv-view]")?.tagName.toLowerCase() === "jarvis-view-cameras");
  check("More: sheet closed after picking", !sr.querySelector('[role="dialog"]'));
  const moreNow = nav.querySelector(".nav-item[data-more]");
  check("More: active secondary view shown as the current item", moreNow?.getAttribute("aria-current") === "page" && moreNow?.dataset.view === "cameras" && /Cameras/.test(moreNow?.textContent || ""), moreNow?.outerHTML?.slice(0, 160));
  check("More: no primary item is current", [...nav.querySelectorAll(".nav-item:not([data-more])")].every((i) => !i.hasAttribute("aria-current")));
  // the sheet marks the active view too
  moreNow.click();
  await settle(10);
  check("More: sheet marks Cameras aria-current", sr.querySelector('.sheet-item[data-view="cameras"]')?.getAttribute("aria-current") === "page");
  check("More: sheet opens focused on the current item", sr.activeElement === sr.querySelector('.sheet-item[data-view="cameras"]'));
  sr.querySelector(".scrim").click();
  await settle(10);
  // every secondary view is reachable through the sheet
  for (const key of SECONDARY_NAV) {
    nav.querySelector(".nav-item[data-more]").click();
    await settle(5);
    sr.querySelector(`.sheet-item[data-view="${key}"]`).click();
    await settle(5);
    check(`More: sheet -> /${key}`, window.location.pathname === `${PREFIX}/${key}` && sr.querySelector("[data-jv-view]")?.tagName.toLowerCase() === `jarvis-view-${key}` && nav.querySelector(".nav-item[data-more]")?.dataset.view === key, window.location.pathname);
  }
  // back to a primary view: More is plain again
  nav.querySelector('.nav-item[data-view="settings"]').click();
  await settle(10);
  const morePlain = nav.querySelector(".nav-item[data-more]");
  check("More: plain again on a primary view", !morePlain?.hasAttribute("aria-current") && !morePlain?.hasAttribute("data-view") && /More/.test(morePlain?.textContent || ""));
  // leaving narrow closes an open sheet
  morePlain.click();
  await settle(10);
  panel.narrow = false;
  await settle(10);
  check("More: leaving narrow closes the sheet", !sr.querySelector('[role="dialog"]') && !sr.querySelector("nav.bottom"));
}
panel.narrow = false;
await settle(10);

// ── navigation: click pushes state, back restores ──────────────────────────
panel.route = { prefix: PREFIX, path: "/overview" };
await settle(10);
window.history.replaceState(null, "", `${PREFIX}/overview`);
sr.querySelector('[role="tab"][data-view="settings"]').click();
await settle(10);
check("click tab -> URL /jarvis/settings", window.location.pathname === `${PREFIX}/settings`, window.location.pathname);
check("click tab -> settings view mounted", sr.querySelector("[data-jv-view]")?.tagName.toLowerCase() === "jarvis-view-settings");
window.history.back();
await sleep(60);
await settle(10);
check("back button -> URL /jarvis/overview", window.location.pathname === `${PREFIX}/overview`, window.location.pathname);
check("back button -> overview view mounted", sr.querySelector("[data-jv-view]")?.tagName.toLowerCase() === "jarvis-view-overview");

// jarvis-navigate from a view
const active = sr.querySelector("[data-jv-view]");
active.dispatchEvent(new window.CustomEvent("jarvis-navigate", { bubbles: true, composed: true, detail: { view: "logs" } }));
await settle(10);
check("jarvis-navigate {view:'logs'} -> /jarvis/logs", window.location.pathname === `${PREFIX}/logs`, window.location.pathname);

// jarvis-refresh from a view: exactly one fetch. The panel's 20 s poll is stopped around the window (and
// restarted after) so a slow run cannot have it land inside the wait and add one.
panel._stopTimer();
await settle(10);
const before = wsCalls.filter((t) => t === "jarvis/get_panel_data").length;
sr.querySelector("[data-jv-view]").dispatchEvent(new window.CustomEvent("jarvis-refresh", { bubbles: true, composed: true }));
await sleep(400);
await settle(10);
const fetched = wsCalls.filter((t) => t === "jarvis/get_panel_data").length - before;
panel._startTimer();
check("jarvis-refresh re-fetches the snapshot (once)", fetched === 1, `${fetched} fetches`);

// keyboard: ArrowRight on the tablist moves to the next view
panel.route = { prefix: PREFIX, path: "/overview" };
await settle(10);
sr.querySelector('[role="tablist"]').dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
await settle(10);
check("ArrowRight on tablist -> next view (intrusion)", window.location.pathname === `${PREFIX}/intrusion`, window.location.pathname);
sr.querySelector('[role="tablist"]').dispatchEvent(new window.KeyboardEvent("keydown", { key: "End", bubbles: true }));
await settle(10);
check("End on tablist -> last view (settings)", window.location.pathname === `${PREFIX}/settings`, window.location.pathname);
sr.querySelector('[role="tablist"]').dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
await settle(10);
check("ArrowRight on the last tab wraps to overview", window.location.pathname === `${PREFIX}/overview`, window.location.pathname);
sr.querySelector('[role="tablist"]').dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
await settle(10);
check("ArrowLeft on the first tab wraps to settings", window.location.pathname === `${PREFIX}/settings`, window.location.pathname);

// unknown route falls back to overview
panel.route = { prefix: PREFIX, path: "/no-such-view" };
await settle(10);
check("unknown route -> overview", sr.querySelector("[data-jv-view]")?.tagName.toLowerCase() === "jarvis-view-overview");

// ── i18n: German dictionary translates the tab bar ─────────────────────────
panel.hass = makeHass("de");
await settle(40);
check("i18n: de.json translates 'Settings'", /Einstellungen/.test(sr.querySelector('[role="tab"][data-view="settings"]')?.textContent || ""));
panel.hass = makeHass("en");
await settle(20);
check("i18n: back to English", /Settings/.test(sr.querySelector('[role="tab"][data-view="settings"]')?.textContent || ""));

// ── WS error surfaces as an alert ──────────────────────────────────────────
const broken = makeHass("en");
broken.callWS = async (msg) => {
  if (msg.type === "jarvis/get_panel_data") throw { code: "unknown_error", message: "simulated failure" };
  return {};
};
panel.hass = broken;
await panel.refresh();
await settle(10);
check("WS failure -> alert rendered", !!(sr.querySelector("ha-alert") || sr.querySelector('[role="alert"]')) && /simulated failure/.test(sr.textContent || ""));
panel.hass = makeHass("en");
await panel.refresh();
await settle(10);
check("recovery clears the alert", !sr.querySelector('[role="alert"]') && !sr.querySelector("ha-alert"));

// ── completeness: every editor / tool element the bundle defines is asserted ─
{
  // built from the checks that ran and passed, so a tag listed under a category the walk never visits
  // (or one that failed to render) does not count
  const asserted = new Set([...fieldEditorTags, ...editorTabTags, ...toolCardTags]);
  const pluggable = [...definedTags].filter((tag) => /^jarvis-(editor|tool)-/.test(tag));
  const unasserted = pluggable.filter((tag) => !asserted.has(tag));
  check(`completeness: each of the ${pluggable.length} jarvis-editor-* / jarvis-tool-* elements the bundle defines rendered in a check that ran (SETTINGS_FIELD_EDITORS, EDITOR_TABS or a tool card)`,
    definedTags.has("jarvis-panel") && pluggable.length > 0 && unasserted.length === 0, unasserted.join(", "));
}

// ── teardown & errors ──────────────────────────────────────────────────────
panel.remove();
await sleep(20);
check("every WS call during the run was answered by a fixture", fixtureMisses.size === 0, [...fixtureMisses].join(", "));
check("no uncaught errors", errors.length === 0, errors.slice(0, 5).join(" | "));

report();

function report() {
  for (const p of passes) console.log(`  ok   ${p}`);
  for (const f of failures) console.log(`  FAIL ${f}`);
  console.log(`\n${passes.length} passed, ${failures.length} failed`);
  if (failures.length) {
    console.error("SMOKE TEST FAILED");
    process.exit(1);
  }
  console.log("SMOKE TEST CLEAN");
  process.exit(0);
}
