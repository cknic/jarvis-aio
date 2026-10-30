#!/usr/bin/env node
// `npm run dev` - the standalone harness at http://localhost:5173/
//
// A tiny http server (no dependencies beyond esbuild, already installed):
//   /                             -> dev/index.html  (also /jarvis/* deep links)
//   /mock-hass.js                 -> dev/mock-hass.ts transpiled on the fly
//   /fixtures/*.json              -> dev/fixtures/
//   /jarvis_panel_static/jarvis-panel.js   -> the built bundle (same URL HA uses)
//   /jarvis_panel_static/i18n/<lang>.json  -> custom_components/jarvis/frontend/i18n/
//   /jarvis_panel_static/<other>           -> custom_components/jarvis/frontend/<other>
// It also rebuilds the bundle on every source change (esbuild watch). Pass
// --no-watch to serve only. PORT overrides 5173.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { buildOptions, OUTFILE } from "../build.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const DEV = path.join(ROOT, "dev");
const HA_FRONTEND = path.resolve(ROOT, "..", "custom_components", "jarvis", "frontend");
const PORT = Number(process.env.PORT || 5173);
const WATCH = !process.argv.includes("--no-watch");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}

function sendFile(res, file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, `not found: ${path.relative(ROOT, file)}`);
  send(res, 200, fs.readFileSync(file), TYPES[path.extname(file)] || "application/octet-stream");
}

function safeJoin(base, rel) {
  const p = path.normalize(path.join(base, rel));
  return p.startsWith(base) ? p : null;
}

async function handle(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = decodeURIComponent(url.pathname);
  try {
    if (p === "/" || p === "/index.html" || p === "/jarvis" || p.startsWith("/jarvis/")) {
      return sendFile(res, path.join(DEV, "index.html"));
    }
    if (p === "/mock-hass.js") {
      const src = fs.readFileSync(path.join(DEV, "mock-hass.ts"), "utf8");
      const out = await esbuild.transform(src, { loader: "ts", format: "esm", target: "es2022", sourcefile: "mock-hass.ts" });
      return send(res, 200, out.code, TYPES[".js"]);
    }
    if (p === "/jarvis_panel_static/jarvis-panel.js") return sendFile(res, OUTFILE);
    if (p.startsWith("/jarvis_panel_static/")) {
      const file = safeJoin(HA_FRONTEND, p.slice("/jarvis_panel_static/".length));
      return file ? sendFile(res, file) : send(res, 403, "forbidden");
    }
    if (p.startsWith("/fixtures/")) {
      const file = safeJoin(path.join(DEV, "fixtures"), p.slice("/fixtures/".length));
      return file ? sendFile(res, file) : send(res, 403, "forbidden");
    }
    if (p.startsWith("/api/")) {
      // snapshot images etc. - the harness has none; a 1x1 transparent PNG keeps <img> happy
      return send(res, 200, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64"), "image/png");
    }
    const file = safeJoin(DEV, p);
    return file ? sendFile(res, file) : send(res, 403, "forbidden");
  } catch (err) {
    console.error(err);
    send(res, 500, String(err && err.stack ? err.stack : err));
  }
}

if (WATCH) {
  const ctx = await esbuild.context(buildOptions({ logLevel: "info" }));
  await ctx.watch();
  console.log(`esbuild: watching src/ -> ${path.relative(process.cwd(), OUTFILE)}`);
} else if (!fs.existsSync(OUTFILE)) {
  console.error(`bundle missing at ${OUTFILE}; run \`npm run build\` first`);
  process.exit(1);
}

http.createServer(handle).listen(PORT, () => {
  console.log(`JARVIS harness: http://localhost:${PORT}/jarvis/overview  (Ctrl+C to stop)`);
});
