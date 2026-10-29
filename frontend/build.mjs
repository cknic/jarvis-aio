// esbuild entry for the JARVIS panel.
//
//   npm run build            -> ../custom_components/jarvis/frontend/jarvis-panel.js
//   OUT=/tmp/x.js npm run build
//
// The output is a single self-contained ES module (Lit is bundled) that
// panel_register.py serves from /jarvis_panel_static/jarvis-panel.js with a
// sha1 cache-bust query. The build is deterministic: CI rebuilds and fails
// when the committed bundle differs from the source.
import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_OUTFILE = path.resolve(
  HERE,
  "..",
  "custom_components",
  "jarvis",
  "frontend",
  "jarvis-panel.js",
);

export const OUTFILE = process.env.OUT
  ? path.resolve(process.cwd(), process.env.OUT)
  : DEFAULT_OUTFILE;

/** The shared esbuild options (also used by the dev server's watch mode). */
export function buildOptions(overrides = {}) {
  return {
    entryPoints: [path.join(HERE, "src", "panel.ts")],
    bundle: true,
    format: "esm",
    target: "es2022",
    minify: true,
    sourcemap: false,
    legalComments: "none",
    charset: "utf8",
    outfile: OUTFILE,
    logLevel: "info",
    tsconfig: path.join(HERE, "tsconfig.json"),
    banner: {
      js: "/* JARVIS panel. Built from frontend/ with `npm run build`; do not edit by hand. */",
    },
    ...overrides,
  };
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  await esbuild.build(buildOptions());
}
