#!/usr/bin/env node
// Fails when any file under src/ (except src/theme/tokens.ts) spells a colour
// (#hex, rgb()/hsl()/..., CSS named colours) or pulls in a web font
// (font-family with a named face, @import, @font-face, Google Fonts).
// Colours come from the --jv-* semantic tokens, fonts from HA's font tokens.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findViolations } from "./colour-rules.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, "..", "src");
const ALLOWED = new Set([path.join(SRC, "theme", "tokens.ts")]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(ts|js|mjs|css|html)$/.test(ent.name)) out.push(p);
  }
  return out;
}

let failures = 0;
let files = 0;
for (const file of walk(SRC)) {
  if (ALLOWED.has(file)) continue;
  files++;
  const text = fs.readFileSync(file, "utf8");
  for (const v of findViolations(text)) {
    failures++;
    console.error(`${path.relative(process.cwd(), file)}:${v.line}: ${v.kind}: ${v.match}`);
  }
}

if (failures) {
  console.error(`\nlint:theme: ${failures} literal colour/font use(s) in ${files} files. Use the --jv-* tokens (src/theme/tokens.ts) and HA font tokens.`);
  process.exit(1);
}
console.log(`lint:theme: OK (${files} files, no literal colours or web fonts outside src/theme/tokens.ts)`);
