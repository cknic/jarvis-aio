#!/usr/bin/env node
// Lists the t("…") keys used by the panel sources that have no entry in the
// translation dictionaries (custom_components/jarvis/frontend/i18n/*.json).
// Those strings show in English in every language until someone adds them.
//
//   npm run i18n:keys            # human-readable report
//   npm run i18n:keys -- --json  # {"keys": n, "untranslated": [...]}
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, "..", "src");
const I18N = path.resolve(HERE, "..", "..", "custom_components", "jarvis", "frontend", "i18n");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith(".ts")) out.push(p);
  }
  return out;
}

// t("key"), t('key'), t(`key`) - the first argument when it is a plain literal
// (keys with {placeholders} are still literals; template keys with ${} are
// skipped, they are built at runtime).
const T_RE = /\bt\(\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
const keys = new Map(); // key -> first file:line
for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, "utf8");
  let m;
  while ((m = T_RE.exec(text))) {
    const raw = m[2];
    if (m[1] === "`" && raw.includes("${")) continue;
    const key = raw.replace(/\\(["'`\\])/g, "$1").replace(/\\n/g, "\n");
    if (!keys.has(key)) {
      const line = text.slice(0, m.index).split("\n").length;
      keys.set(key, `${path.relative(path.resolve(HERE, ".."), file)}:${line}`);
    }
  }
}

const known = new Set();
for (const f of fs.readdirSync(I18N).filter((n) => n.endsWith(".json"))) {
  try {
    for (const k of Object.keys(JSON.parse(fs.readFileSync(path.join(I18N, f), "utf8")))) known.add(k);
  } catch {
    /* malformed files are reported by scripts/i18n_coverage.py */
  }
}

const untranslated = [...keys.keys()].filter((k) => !known.has(k)).sort((a, b) => a.localeCompare(b));
if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ keys: keys.size, translated: keys.size - untranslated.length, untranslated }, null, 2));
} else {
  console.log(`${keys.size} t() keys in src/, ${keys.size - untranslated.length} have a dictionary entry, ${untranslated.length} are English-only:\n`);
  for (const k of untranslated) console.log(`  ${JSON.stringify(k)}    (${keys.get(k)})`);
}
