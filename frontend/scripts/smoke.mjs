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
//   - tab navigation pushes /jarvis/<view> and the back button restores it,
//   - a non-English language file loads and translates the tab bar.
// Exit 1 on any failure; prints "SMOKE TEST CLEAN" on success.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";
import { findViolations } from "./colour-rules.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const BUNDLE = process.env.OUT
  ? path.resolve(process.cwd(), process.env.OUT)
  : path.resolve(ROOT, "..", "custom_components", "jarvis", "frontend", "jarvis-panel.js");
const FIXTURES = path.join(ROOT, "dev", "fixtures");
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
      const data = fixture(ROUTES[msg.type] ?? msg.type.replace(/\//g, "_"));
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
check("tab bar rendered with role=tablist", !!sr.querySelector('[role="tablist"]') && tabs.length >= 7, `tabs=${tabs.length}`);
const viewKeys = tabs.map((t) => t.dataset.view);
check("views: " + viewKeys.join(","), viewKeys.length === new Set(viewKeys).size);
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
  const HEADER_SEL = /^(header\b|\.tab\b|\.brand\b|\.logo\b|\.ver\b|\.bar-actions\b|\[role="tablist"\]|:host\(\[narrow\]\)\s+(header|\.brand|\.ver))/;
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
function collectImgs(root) {
  const out = [];
  for (const shadow of shadowRoots(root)) out.push(...shadow.querySelectorAll("img"));
  return out;
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
      const hasContent = !!vs && [...vs.children].some((c) => c.tagName !== "STYLE") && (vs.textContent || "").trim().length > 0;
      check(`[${theme}] /${key} view shadowRoot has content`, hasContent);
      check(`[${theme}] /${key} view received hass/data/route`, view.hass === panel.hass && view.route?.path === `/${key}` && !!view.data);
    }
    check(`[${theme}] /${key} tab selected`, sr.querySelector(`[role="tab"][data-view="${key}"]`)?.getAttribute("aria-selected") === "true");
    const cssViolations = collectCss(panel).flatMap((css) => findViolations(css));
    check(`[${theme}] /${key} no literal colour in adopted styles`, cssViolations.length === 0, cssViolations.slice(0, 3).map((v) => `${v.kind} ${v.match}`).join("; "));
    const badImgs = collectImgs(panel).map((i) => i.getAttribute("src")).filter((s) => !imgOk(s));
    check(`[${theme}] /${key} every <img> is data:/static/signed`, badImgs.length === 0, badImgs.join(", "));
  }
}

// ── narrow: bottom nav instead of tabs ─────────────────────────────────────
panel.narrow = true;
await settle(10);
check("narrow: bottom nav rendered", !!sr.querySelector("nav.bottom") && sr.querySelectorAll("nav.bottom [data-view]").length >= 7);
check("narrow: tablist hidden", !sr.querySelector('[role="tablist"]'));
check("narrow: menu button present", !!(sr.querySelector("ha-menu-button") || sr.querySelector(".menu-btn")));
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

// jarvis-refresh from a view
const before = wsCalls.filter((t) => t === "jarvis/get_panel_data").length;
sr.querySelector("[data-jv-view]").dispatchEvent(new window.CustomEvent("jarvis-refresh", { bubbles: true, composed: true }));
await sleep(400);
await settle(10);
check("jarvis-refresh re-fetches the snapshot", wsCalls.filter((t) => t === "jarvis/get_panel_data").length === before + 1);

// keyboard: ArrowRight on the tablist moves to the next view
panel.route = { prefix: PREFIX, path: "/overview" };
await settle(10);
sr.querySelector('[role="tablist"]').dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
await settle(10);
check("ArrowRight on tablist -> next view (intrusion)", window.location.pathname === `${PREFIX}/intrusion`, window.location.pathname);

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

// ── teardown & errors ──────────────────────────────────────────────────────
panel.remove();
await sleep(20);
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
