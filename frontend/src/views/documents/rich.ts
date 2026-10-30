/**
 * tRich(): translate a sentence whose placeholders are rendered as markup -
 * a technical value in `<code>` (backend error strings, paths, model names
 * stay verbatim and in --jv-font-code, spec §4) or a nested template such as
 * a link button. Plain string/number values are substituted like t().
 *
 *   tRich("Couldn't delete {name}: {error}", { name, error: code(err) })
 *   tRich("Curated facts live on the {memory} page.", { memory: html`<button>…</button>` })
 */
import { html, type TemplateResult } from "lit";
import { t } from "../../i18n";

export interface CodeVar {
  code: string;
}

export type RichVar = string | number | TemplateResult | CodeVar;

export function code(value: unknown): CodeVar {
  return { code: value === undefined || value === null ? "" : String(value) };
}

function isTemplate(v: unknown): v is TemplateResult {
  return !!v && typeof v === "object" && "strings" in (v as object) && "values" in (v as object);
}

export function tRich(key: string, vars: Record<string, RichVar>): TemplateResult {
  const plain: Record<string, string | number> = {};
  const rich = new Map<string, TemplateResult | CodeVar>();
  for (const [k, v] of Object.entries(vars)) {
    if (typeof v === "string" || typeof v === "number") plain[k] = v;
    else rich.set(k, v);
  }
  // Translate with sentinels for the rich placeholders, then split them out.
  const sentinels: Record<string, string> = {};
  for (const k of rich.keys()) sentinels[k] = `\u0000${k}\u0000`;
  const text = t(key, { ...plain, ...sentinels });
  const parts: Array<string | TemplateResult> = [];
  const re = /\u0000([A-Za-z0-9_]+)\u0000/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const v = rich.get(m[1]);
    if (isTemplate(v)) parts.push(v);
    else if (v) parts.push(html`<code class="tech">${v.code}</code>`);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return html`${parts}`;
}
