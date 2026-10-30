#!/usr/bin/env node
// Lists the t("…") keys used by the panel sources that have no entry in the
// translation dictionaries (custom_components/jarvis/frontend/i18n/*.json).
// Those strings show in English until someone adds them.
//
//   npm run i18n:keys                       # human-readable report (keys missing from EVERY language)
//   npm run i18n:keys -- --json             # the machine-readable report below, on stdout
//   npm run i18n:report                     # the same, written to frontend/i18n-missing.json
//   node scripts/i18n-keys.mjs --json --out <file>
//
// JSON shape (deterministic: sorted, no timestamps, no line numbers):
//   keys, translated, untranslated   t() keys in src/, how many have an entry in
//                                    at least one language, the ones that have none
//   languages: {<lang>: {file, entries, translated, missing}}
//                                    per dictionary: its entry count, how many source
//                                    keys it translates, how many it is missing
//   missing: [{key, source, languages}]
//                                    every source key absent from at least one
//                                    dictionary, the first file that uses it, and the
//                                    languages that lack it. The keys one language
//                                    needs: missing.filter(m => m.languages.includes("de"))
//   indirect: ["<file>: t(<expr>)"]  t() calls whose key is computed (table labels,
//                                    backend reasons); their strings are NOT in the
//                                    lists above - look them up in those tables.
//                                    Literal branches inside such a call
//                                    (t(x ? "On" : "Off"), t(v ?? "Front")) ARE counted.
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
// t(<non-literal>) - reported, not resolved
const T_INDIRECT_RE = /\bt\(\s*(?![\s"'`])([^,()]*(?:\([^()]*\))?[^,()]*)[,)]/g;
const keys = new Map(); // key -> first file:line
const keyFile = new Map(); // key -> first file (no line: keeps the JSON stable)
const indirect = new Set();
for (const file of walk(SRC).sort()) {
  const text = fs.readFileSync(file, "utf8");
  const rel = path.relative(path.resolve(HERE, ".."), file).split(path.sep).join("/");
  for (const im of text.matchAll(T_INDIRECT_RE)) {
    const expr = im[1].trim();
    // skip t() in comments and the t(key: string) signature itself
    if (!expr || /^[A-Za-z_$][\w$]*\s*:\s*[A-Za-z]/.test(expr)) continue;
    indirect.add(`${rel}: t(${expr})`);
    // literal fallbacks / branches are real keys: x ? "a" : "b", v ?? "c", v || "d"
    for (const lm of expr.matchAll(/(?:\?\?|\|\||\?|:)\s*(["'])((?:\\.|(?!\1)[^\\])*)\1/g)) {
      const key = lm[2].replace(/\\(["'`\\])/g, "$1");
      if (key.trim() && !keys.has(key)) {
        keys.set(key, `${rel}:${text.slice(0, im.index).split("\n").length}`);
        keyFile.set(key, rel);
      }
    }
  }
  let m;
  while ((m = T_RE.exec(text))) {
    const raw = m[2];
    if (m[1] === "`" && raw.includes("${")) continue;
    const key = raw.replace(/\\(["'`\\])/g, "$1").replace(/\\n/g, "\n");
    if (!keys.has(key)) {
      const line = text.slice(0, m.index).split("\n").length;
      keys.set(key, `${rel}:${line}`);
      keyFile.set(key, rel);
    }
  }
}

const known = new Set();
const dictionaries = new Map(); // lang -> Set of keys
for (const f of fs.readdirSync(I18N).filter((n) => n.endsWith(".json")).sort()) {
  try {
    const entries = Object.keys(JSON.parse(fs.readFileSync(path.join(I18N, f), "utf8")));
    for (const k of entries) known.add(k);
    dictionaries.set(f.slice(0, -5), new Set(entries));
  } catch {
    /* malformed files are reported by scripts/i18n_coverage.py */
  }
}

const byKey = (a, b) => (a < b ? -1 : a > b ? 1 : 0); // code-point order: same on every machine
const untranslated = [...keys.keys()].filter((k) => !known.has(k)).sort(byKey);
const argv = process.argv.slice(2);
const outIdx = argv.indexOf("--out");
const outFile = outIdx >= 0 ? argv[outIdx + 1] : undefined;
if (outIdx >= 0 && !outFile) {
  console.error("--out needs a file name");
  process.exit(2);
}
if (argv.includes("--json") || outFile) {
  const sourceKeys = [...keys.keys()].sort(byKey);
  const languages = {};
  for (const [lang, set] of dictionaries) {
    const translated = sourceKeys.filter((k) => set.has(k)).length;
    languages[lang] = {
      file: `custom_components/jarvis/frontend/i18n/${lang}.json`,
      entries: set.size,
      translated,
      missing: sourceKeys.length - translated,
    };
  }
  const missing = [];
  for (const key of sourceKeys) {
    const langs = [...dictionaries.keys()].filter((lang) => !dictionaries.get(lang).has(key));
    if (langs.length) missing.push({ key, source: keyFile.get(key), languages: langs });
  }
  const report = {
    regenerate: "cd frontend && npm run i18n:report",
    keys: keys.size,
    translated: keys.size - untranslated.length,
    languages,
    untranslated,
    indirect: [...indirect].sort(byKey),
  };
  // pretty-printed, except one line per `missing` entry (22 language codes each)
  const head = JSON.stringify(report, null, 2).replace(/\n\}$/, "");
  const rows = missing.map((m) => `    ${JSON.stringify(m)}`).join(",\n");
  const text = `${head},\n  "missing": [${rows ? `\n${rows}\n  ` : ""}]\n}\n`;
  if (outFile) {
    fs.writeFileSync(path.resolve(process.cwd(), outFile), text);
    console.log(`i18n: wrote ${outFile} (${missing.length} keys missing from at least one of ${dictionaries.size} languages, ${untranslated.length} from all)`);
  } else {
    process.stdout.write(text);
  }
} else {
  console.log(`${keys.size} t() keys in src/, ${keys.size - untranslated.length} have a dictionary entry, ${untranslated.length} are English-only:\n`);
  for (const k of untranslated) console.log(`  ${JSON.stringify(k)}    (${keys.get(k)})`);
}
