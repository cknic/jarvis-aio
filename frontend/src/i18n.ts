/**
 * Translations. Dictionaries live at
 * custom_components/jarvis/frontend/i18n/<lang>.json (served from
 * /jarvis_panel_static/i18n/<lang>.json) and are keyed by the ENGLISH string:
 *
 *   t("Settings")                 -> "Einstellungen" when de.json is loaded
 *   t("{count} areas", {count: 4}) -> "4 areas" (placeholders survive lookup)
 *
 * Unknown keys (and English) fall back to the key itself, so a missing entry
 * is never a crash, only an untranslated label. The panel calls
 * `loadLanguage()` from hass.language (or config.ui_language when set) and
 * re-renders; components that cache strings can subscribe with
 * `onLanguageChange()`.
 */

export const I18N_BASE = "/jarvis_panel_static/i18n";

type Dict = Record<string, string>;

let _dict: Dict | null = null;
let _lang = "en";
let _loading: Promise<boolean> | null = null;
const _cache = new Map<string, Dict | null>();
const _listeners = new Set<(lang: string) => void>();

export function t(key: string, vars?: Record<string, string | number>): string {
  let s = (_dict && _dict[key]) || key;
  if (vars) {
    s = s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
  }
  return s;
}

export function currentLanguage(): string {
  return _lang;
}

export function onLanguageChange(cb: (lang: string) => void): () => void {
  _listeners.add(cb);
  return () => {
    _listeners.delete(cb);
  };
}

async function fetchDict(lang: string): Promise<Dict | null> {
  if (_cache.has(lang)) return _cache.get(lang) ?? null;
  let dict: Dict | null = null;
  try {
    const res = await fetch(`${I18N_BASE}/${lang}.json`);
    if (res.ok) {
      const json: unknown = await res.json();
      if (json && typeof json === "object") dict = json as Dict;
    }
  } catch {
    dict = null;
  }
  _cache.set(lang, dict);
  return dict;
}

/**
 * Load `lang` ("de", "pt-BR", "zh-Hant" ...). Tries the full tag first, then
 * the base language, so region variants can be added without code changes.
 * Resolves true when the active dictionary changed.
 */
export async function loadLanguage(lang: string | undefined | null): Promise<boolean> {
  const full = String(lang || "en").toLowerCase();
  if (full === _lang && !_loading) return false;
  if (_loading) await _loading.catch(() => false);
  if (full === _lang) return false;
  const run = (async () => {
    const base = full.split("-")[0];
    let dict: Dict | null = null;
    if (base !== "en") {
      dict = (await fetchDict(full)) || (full !== base ? await fetchDict(base) : null);
    }
    _dict = dict;
    _lang = full;
    for (const cb of _listeners) {
      try {
        cb(full);
      } catch {
        /* a listener must never break the others */
      }
    }
    return true;
  })();
  _loading = run;
  try {
    return await run;
  } finally {
    _loading = null;
  }
}

/** Pick the UI language: an explicit panel setting wins over hass.language. */
export function resolveLanguage(uiLanguage: unknown, hassLanguage: unknown): string {
  const explicit = typeof uiLanguage === "string" ? uiLanguage.trim() : "";
  if (explicit && explicit !== "auto") return explicit;
  return typeof hassLanguage === "string" && hassLanguage ? hassLanguage : "en";
}
