#!/usr/bin/env node
/**
 * Repo-level entry point for the panel smoke test (kept under this name so
 * existing docs / muscle memory still work). The real test lives in
 * frontend/scripts/smoke.mjs and runs the BUILT bundle under jsdom:
 *
 *   cd frontend && npm ci && npm run build && npm run smoke
 *   # or, from the repo root:
 *   node scripts/smoke_panel.js
 *
 * It needs frontend/node_modules (jsdom); run `npm ci` in frontend/ first.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const FRONTEND = path.resolve(__dirname, "..", "frontend");
const SMOKE = path.join(FRONTEND, "scripts", "smoke.mjs");

if (!fs.existsSync(path.join(FRONTEND, "node_modules", "jsdom"))) {
  console.error("smoke_panel: frontend/node_modules missing - run `cd frontend && npm ci` first.");
  process.exit(1);
}

const res = spawnSync(process.execPath, [SMOKE, ...process.argv.slice(2)], {
  cwd: FRONTEND,
  stdio: "inherit",
  env: process.env,
});
process.exit(res.status === null ? 1 : res.status);
