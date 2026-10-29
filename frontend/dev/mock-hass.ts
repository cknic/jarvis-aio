/**
 * Mock `hass` for the standalone harness (dev/index.html) and the smoke test.
 *
 * callWS routing:
 *   jarvis/get_panel_data -> fixtures/panel_data.json
 *   jarvis/config_schema  -> fixtures/config_schema.json
 *   auth/sign_path        -> {path: path + "?authSig=mock"}
 *   anything else         -> fixtures/<type with "/" -> "_">.json if present, else {}
 * Two set-style commands echo the request so the harness reflects what was
 * asked for until the next (static) refetch snaps it back:
 *   jarvis/mode {action:"set", mode} -> jarvis_mode.json + {ok, active: mode, mode}
 *   jarvis/set_lockdown {on}         -> {ok: true, lockdown: {active: on, ...}}
 * callService is logged (and echoed to `onLog`). Nothing here talks to a real
 * Home Assistant. The dev server transpiles this file on the fly, so keep it
 * dependency-free (no imports from src/).
 */

export interface MockLog {
  kind: "ws" | "service" | "fixture-miss" | "error";
  text: string;
  at: number;
}

export interface MockHassOptions {
  language?: string;
  darkMode?: boolean;
  fixturesBase?: string;
  /** receives every logged call */
  onLog?: (entry: MockLog) => void;
  /** override / extend the fixture routing: return undefined to fall through */
  handlers?: Record<string, (msg: Record<string, unknown>) => unknown | Promise<unknown>>;
  /** fixture loader (the smoke test reads from disk instead of fetch) */
  loadFixture?: (name: string) => Promise<unknown | undefined>;
}

export interface MockHass {
  callWS<T = unknown>(msg: Record<string, unknown> & { type: string }): Promise<T>;
  callService(domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>): Promise<void>;
  language: string;
  locale: { language: string; number_format: string; time_format: string };
  themes: { darkMode: boolean; theme: string };
  user: { id: string; name: string; is_admin: boolean };
  states: Record<string, { entity_id: string; state: string; attributes: Record<string, unknown> }>;
  config: Record<string, unknown>;
  connection: {
    subscribeEvents: (cb: (e: unknown) => void, type?: string) => Promise<() => void>;
    subscribeMessage: (cb: (m: unknown) => void, msg: Record<string, unknown>) => Promise<() => void>;
  };
  localize: (key: string) => string;
  dockedSidebar: "docked" | "always_hidden" | "auto";
  /** harness helpers */
  log: MockLog[];
  setLanguage(lang: string): MockHass;
}

export const FIXTURE_ROUTES: Record<string, string> = {
  "jarvis/get_panel_data": "panel_data",
  "jarvis/config_schema": "config_schema",
};

export function fixtureNameFor(type: string): string {
  return FIXTURE_ROUTES[type] ?? type.replace(/\//g, "_");
}

export function createMockHass(opts: MockHassOptions = {}): MockHass {
  // absolute: the harness page lives at /jarvis/<view>, so a relative path would miss
  const base = opts.fixturesBase ?? "/fixtures";
  const cache = new Map<string, Promise<unknown | undefined>>();
  const log: MockLog[] = [];
  const push = (kind: MockLog["kind"], text: string) => {
    const entry: MockLog = { kind, text, at: Date.now() };
    log.push(entry);
    if (log.length > 500) log.shift();
    opts.onLog?.(entry);
  };

  const loadFixture =
    opts.loadFixture ??
    (async (name: string): Promise<unknown | undefined> => {
      try {
        const res = await fetch(`${base}/${name}.json`, { cache: "no-store" });
        if (!res.ok) return undefined;
        return await res.json();
      } catch {
        return undefined;
      }
    });

  const fixture = (name: string) => {
    let p = cache.get(name);
    if (!p) {
      p = loadFixture(name);
      cache.set(name, p);
    }
    return p;
  };

  const hass: MockHass = {
    language: opts.language ?? "en",
    locale: { language: opts.language ?? "en", number_format: "language", time_format: "language" },
    themes: { darkMode: !!opts.darkMode, theme: "default" },
    user: { id: "mock-admin", name: "Mock Admin", is_admin: true },
    states: {
      "camera.front_door": { entity_id: "camera.front_door", state: "idle", attributes: { friendly_name: "Front Door", access_token: "mock-token" } },
      "light.living_room": { entity_id: "light.living_room", state: "on", attributes: { friendly_name: "Living Room", brightness: 180 } },
      "binary_sensor.living_room_occupancy": { entity_id: "binary_sensor.living_room_occupancy", state: "on", attributes: { device_class: "occupancy" } },
    },
    config: { location_name: "Mock Home", latitude: 39.78, longitude: -89.65, unit_system: { temperature: "°C" }, version: "2026.2.3" },
    connection: {
      subscribeEvents: async () => () => undefined,
      subscribeMessage: async () => () => undefined,
    },
    localize: (key: string) => key,
    dockedSidebar: "docked",
    log,

    async callWS<T = unknown>(msg: Record<string, unknown> & { type: string }): Promise<T> {
      const { type } = msg;
      const extra = Object.keys(msg).filter((k) => k !== "type");
      push("ws", `${type}${extra.length ? " " + JSON.stringify(Object.fromEntries(extra.map((k) => [k, msg[k]]))) : ""}`);
      const custom = opts.handlers?.[type];
      if (custom) {
        const out = await custom(msg);
        if (out !== undefined) return out as T;
      }
      if (type === "auth/sign_path") {
        const path = String(msg.path ?? "");
        return { path: path + (path.includes("?") ? "&" : "?") + "authSig=mock" } as T;
      }
      if (type === "jarvis/set_lockdown") {
        // shaped like ws_set_lockdown's result: {ok, lockdown: <status>}
        const on = !!msg.on;
        return {
          ok: true,
          lockdown: { active: on, since: on ? Date.now() / 1000 : null, reason: on ? "requested from panel" : null, auto: false, exempt_windows: 0 },
        } as T;
      }
      const data = await fixture(fixtureNameFor(type));
      if (data === undefined) {
        push("fixture-miss", `${type} -> no fixtures/${fixtureNameFor(type)}.json, returning {}`);
        return {} as T;
      }
      const out = structuredClone(data) as Record<string, unknown>;
      if (type === "jarvis/mode" && msg.action === "set" && typeof msg.mode === "string") {
        // shaped like ws_mode's set result: {**set_mode_result, **mode_info()}
        Object.assign(out, { ok: true, mode: msg.mode, active: msg.mode, since: Date.now() / 1000, reason: String(msg.reason ?? "requested from panel") });
      }
      return out as T;
    },

    async callService(domain, service, data, target) {
      push("service", `${domain}.${service} ${JSON.stringify({ ...(data ?? {}), ...(target ? { target } : {}) })}`);
    },

    setLanguage(lang: string) {
      hass.language = lang;
      hass.locale = { ...hass.locale, language: lang };
      return hass;
    },
  };
  return hass;
}

/* ── HA default theme values for the harness ─────────────────────────────── *
 * Copied from Home Assistant frontend's default light theme and darkStyles.
 * Setting these on <html> is what HA itself does; the panel reads only these. */
export const HA_LIGHT: Record<string, string> = {
  "--primary-text-color": "#212121",
  "--secondary-text-color": "#727272",
  "--text-primary-color": "#ffffff",
  "--text-light-primary-color": "#212121",
  "--disabled-text-color": "#bdbdbd",
  "--primary-color": "#03a9f4",
  "--dark-primary-color": "#0288d1",
  "--light-primary-color": "#b3e5fc",
  "--accent-color": "#ff9800",
  "--divider-color": "rgba(0, 0, 0, 0.12)",
  "--outline-color": "rgba(0, 0, 0, 0.12)",
  "--error-color": "#db4437",
  "--warning-color": "#ffa600",
  "--success-color": "#43a047",
  "--info-color": "#039be5",
  "--card-background-color": "#ffffff",
  "--primary-background-color": "#fafafa",
  "--secondary-background-color": "#e5e5e5",
  "--clear-background-color": "#ffffff",
  "--state-icon-color": "#44739e",
  "--state-active-color": "#fdd835",
  "--state-inactive-color": "#44739e",
  "--black-color": "#000000",
  "--white-color": "#ffffff",
  "--app-header-background-color": "#fafafa",
  "--app-header-text-color": "#212121",
  "--mdc-theme-primary": "#03a9f4",
  "--mdc-theme-error": "#db4437",
  "--ha-card-background": "#ffffff",
  "--ha-card-border-radius": "12px",
  "--ha-card-border-width": "1px",
  "--ha-card-border-color": "rgba(0, 0, 0, 0.12)",
  "--ha-card-box-shadow": "none",
  "--header-height": "56px",
  "--ha-font-family-body": "Roboto, Noto, sans-serif",
  "--ha-font-family-code": "'Roboto Mono', Consolas, Menlo, monospace",
  "--paper-font-body1_-_font-family": "Roboto, Noto, sans-serif",
  "--ha-font-size-xs": "10px",
  "--ha-font-size-s": "12px",
  "--ha-font-size-m": "14px",
  "--ha-font-size-l": "16px",
  "--ha-font-size-xl": "20px",
  "--ha-font-size-2xl": "24px",
  "--ha-font-weight-normal": "400",
  "--ha-font-weight-medium": "500",
  "--ha-font-weight-bold": "700",
  "--ha-line-height-normal": "1.5",
  "--mdc-icon-size": "24px",
};

export const HA_DARK: Record<string, string> = {
  ...HA_LIGHT,
  "--primary-background-color": "#111111",
  "--card-background-color": "#1c1c1c",
  "--ha-card-background": "#1c1c1c",
  "--secondary-background-color": "#202020",
  "--clear-background-color": "#111111",
  "--primary-text-color": "#e1e1e1",
  "--secondary-text-color": "#9b9b9b",
  "--disabled-text-color": "#6f6f6f",
  "--app-header-text-color": "#e1e1e1",
  "--app-header-background-color": "#101e24",
  "--divider-color": "rgba(225, 225, 225, 0.12)",
  "--outline-color": "rgba(225, 225, 225, 0.12)",
  "--ha-card-border-color": "rgba(225, 225, 225, 0.12)",
  "--state-icon-color": "#9da0a2",
  "--state-inactive-color": "#9da0a2",
};

/** Apply a theme to <html> the way HA does (custom properties + color-scheme). */
export function applyTheme(doc: Document, dark: boolean): void {
  const vars = dark ? HA_DARK : HA_LIGHT;
  const root = doc.documentElement;
  for (const k of Object.keys(HA_DARK)) root.style.removeProperty(k);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.style.colorScheme = dark ? "dark" : "light";
  root.setAttribute("data-theme", dark ? "dark" : "light");
  root.style.setProperty("background-color", vars["--primary-background-color"]);
  root.style.setProperty("color", vars["--primary-text-color"]);
  root.style.setProperty("font-family", vars["--ha-font-family-body"]);
}
