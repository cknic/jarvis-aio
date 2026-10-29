// Shared "no literal colour / no web font" detector, used by
// scripts/lint-theme.mjs (on source files) and scripts/smoke.mjs (on the CSS
// the built panel actually adopts at runtime).
//
// A literal colour is: a #hex in a CSS value position, a colour function
// (rgb/rgba/hsl/hsla/hwb/lab/lch/oklab/oklch/color()), or a CSS named colour
// as a value token of a `property: value` declaration. `transparent`,
// `currentColor` and `inherit` are keywords, not colours, and stay allowed;
// so does color-mix() of tokens.

export const NAMED_COLOURS = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue " +
    "blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk " +
    "crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki " +
    "darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue " +
    "dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite " +
    "gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki " +
    "lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen " +
    "lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen " +
    "magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen " +
    "mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream " +
    "mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid " +
    "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum " +
    "powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown " +
    "seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen " +
    "steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen"
  ).split(/\s+/),
);

const HEX_RE = /(^|[\s:(,])(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8}))(?=$|[\s;,)!'"`}])(?!\s*\{)/gm;
const FUNC_RE = /(^|[^\w-])((?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\()/gim;
// property: value;  (also matches `prop: value }` and end-of-template values)
const DECL_RE = /(^|[;{\s])(-{0,2}[a-zA-Z][\w-]*)\s*:\s*([^;{}]+?)\s*(?=;|\}|$)/gm;
const FONT_FAMILY_RE = /font-family\s*:\s*([^;}]+)/gi;
const WEBFONT_RE = /(@import\b|@font-face\b|fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|fonts\.bunny\.net|rel=["']?stylesheet)/gi;

const GENERIC_FAMILIES = new Set([
  "sans-serif", "serif", "monospace", "cursive", "fantasy", "system-ui", "ui-sans-serif",
  "ui-serif", "ui-monospace", "ui-rounded", "math", "emoji", "fangsong", "inherit", "initial",
  "unset", "revert",
]);

/** Strip // line comments, /* block comments *‌/ and <!-- html comments -->. */
export function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:\\"'`])\/\/[^\n]*/g, (m, pre) => pre + " ".repeat(m.length - pre.length));
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

/**
 * Find literal colours / web fonts in `text`. Returns [{line, kind, match}].
 * `text` may be TypeScript (css`` / html`` templates) or plain CSS.
 */
export function findViolations(text) {
  const src = stripComments(text);
  const out = [];
  let m;

  HEX_RE.lastIndex = 0;
  while ((m = HEX_RE.exec(src))) {
    out.push({ line: lineOf(src, m.index + m[1].length), kind: "hex colour", match: m[2] });
  }

  FUNC_RE.lastIndex = 0;
  while ((m = FUNC_RE.exec(src))) {
    out.push({ line: lineOf(src, m.index + m[1].length), kind: "colour function", match: m[2].trim() });
  }

  DECL_RE.lastIndex = 0;
  while ((m = DECL_RE.exec(src))) {
    const prop = m[2].toLowerCase();
    if (prop.startsWith("--jv-") && prop.includes("font")) continue;
    const value = m[3];
    const tokens = value.split(/[\s,()\/]+/).filter(Boolean);
    for (const tok of tokens) {
      if (NAMED_COLOURS.has(tok.toLowerCase()) && tok === tok.toLowerCase()) {
        out.push({ line: lineOf(src, m.index + m[1].length), kind: "named colour", match: `${prop}: ${tok}` });
      }
    }
  }

  FONT_FAMILY_RE.lastIndex = 0;
  while ((m = FONT_FAMILY_RE.exec(src))) {
    const value = m[1].replace(/var\([^)]*\)/g, "").trim();
    const families = value
      .split(",")
      .map((f) => f.trim().replace(/^['"]|['"]$/g, "").toLowerCase())
      .filter(Boolean);
    const bad = families.filter((f) => !GENERIC_FAMILIES.has(f));
    if (bad.length) {
      out.push({ line: lineOf(src, m.index), kind: "font-family", match: bad.join(", ") });
    }
  }

  WEBFONT_RE.lastIndex = 0;
  while ((m = WEBFONT_RE.exec(src))) {
    out.push({ line: lineOf(src, m.index), kind: "web font / import", match: m[1] });
  }

  return out;
}
