/**
 * Semantic design tokens for the JARVIS panel.
 *
 * THIS IS THE ONLY FILE THAT MAY SPELL A COLOUR - and even here every value is
 * derived from a Home Assistant theme variable, so the panel follows whatever
 * theme (light, dark, or a user theme) HA is running. No hex, no rgb(), no web
 * fonts. `npm run lint:theme` enforces the rule for every other file.
 *
 * Every component includes `base` (which includes these tokens) so the `--jv-*`
 * names resolve inside every shadow root. Because they are defined on :host,
 * a parent can still override one for a subtree with an inline style.
 *
 * HA token reference (defaults, light / dark):
 *   --primary-background-color   #fafafa / #111111
 *   --secondary-background-color #e5e5e5 / #202020
 *   --card-background-color      #ffffff / #1c1c1c
 *   --primary-text-color         #212121 / #e1e1e1
 *   --secondary-text-color       #727272 / #9b9b9b
 *   --disabled-text-color        #bdbdbd / #6f6f6f
 *   --text-primary-color         #ffffff            (text ON the primary colour)
 *   --primary-color #03a9f4  --accent-color #ff9800
 *   --success-color #43a047  --warning-color #ffa600  --error-color #db4437  --info-color #039be5
 *   --divider-color rgba(0,0,0,.12) / rgba(225,225,225,.12)
 *   --ha-card-border-radius 12px  --ha-card-border-width 1px  --ha-card-box-shadow none
 *   --app-header-background-color / --app-header-text-color (the HA top bar),
 *     --app-header-border-bottom (1px solid --divider-color),
 *     --app-header-selection-bar-color (tab indicator; HA falls back to the header text)
 *   --black-color #000 / --white-color #fff (fixed, theme-independent)
 *   --ha-color-on-danger-loud (2025.x: text on a filled danger button, --white-color)
 *   --mdc-dialog-scrim-color (only when a theme sets it; HA's own scrim is rgba(0,0,0,.32))
 *   --ha-font-family-body (2025.x) falling back to --paper-font-body1_-_font-family
 *
 * Contrast: the raw state colours (--jv-ok/--jv-warn/--jv-danger/--jv-accent/
 * --jv-info) are for dots, bars, borders and filled buttons. As SMALL TEXT they
 * fail WCAG AA in HA light (warn 1.96:1, accent 2.63:1, ok 3.30:1 on a card),
 * so text that must carry a state colour uses the --jv-*-text variants below,
 * which mix the colour toward the page text until it reads at >= 4.5:1 on a
 * card and on its own --jv-*-soft tint in both HA light and HA dark.
 */
import { css } from "lit";

export const tokens = css`
  :host {
    /* ── typography ─────────────────────────────────────────────────── */
    --jv-font: var(
      --ha-font-family-body,
      var(--paper-font-body1_-_font-family, var(--mdc-typography-font-family, sans-serif))
    );
    --jv-font-code: var(--ha-font-family-code, var(--code-font-family, monospace));
    --jv-font-size-xs: var(--ha-font-size-xs, 11px);
    --jv-font-size-s: var(--ha-font-size-s, 12px);
    --jv-font-size-m: var(--ha-font-size-m, 14px);
    --jv-font-size-l: var(--ha-font-size-l, 16px);
    --jv-font-size-xl: var(--ha-font-size-xl, 20px);
    --jv-font-size-2xl: var(--ha-font-size-2xl, 24px);
    --jv-font-weight-normal: var(--ha-font-weight-normal, 400);
    --jv-font-weight-medium: var(--ha-font-weight-medium, 500);
    --jv-font-weight-bold: var(--ha-font-weight-bold, 700);
    --jv-line-height: var(--ha-line-height-normal, 1.5);

    /* ── surfaces & text ─────────────────────────────────────────────── */
    --jv-bg: var(--primary-background-color);
    --jv-bg-2: var(--secondary-background-color, var(--primary-background-color));
    --jv-surface: var(--ha-card-background, var(--card-background-color));
    --jv-text: var(--primary-text-color);
    --jv-text-2: var(--secondary-text-color);
    /* --jv-text-3 is HA's DISABLED colour (1.9:1 on a light card): disabled
       controls, placeholders and inactive dots only - never a readable label. */
    --jv-text-3: var(--disabled-text-color, var(--secondary-text-color));
    --jv-on-accent: var(--text-primary-color);
    --jv-on-danger: var(--ha-color-on-danger-loud, var(--white-color, var(--text-primary-color)));

    /* ── the app bar: everything drawn ON the header keys off these, never
       off the page palette (a theme may give the header its primary colour) */
    --jv-header-bg: var(--app-header-background-color, var(--primary-background-color));
    --jv-header-text: var(--app-header-text-color, var(--primary-text-color));
    --jv-header-indicator: var(--app-header-selection-bar-color, var(--jv-header-text));
    --jv-header-hover: color-mix(in srgb, var(--jv-header-text) 10%, transparent);
    --jv-header-border: var(--app-header-border-bottom, 1px solid var(--divider-color));

    /* ── accents & state colours ─────────────────────────────────────── */
    --jv-accent: var(--primary-color, var(--mdc-theme-primary));
    --jv-accent-2: var(--accent-color, var(--jv-accent));
    --jv-ok: var(--success-color, var(--state-active-color, var(--jv-accent)));
    --jv-warn: var(--warning-color, var(--jv-accent-2));
    --jv-danger: var(--error-color, var(--mdc-theme-error));
    --jv-info: var(--info-color, var(--jv-accent));
    --jv-neutral: var(--secondary-text-color);

    /* tints: use for chips, badges, highlighted rows - never raw colours */
    --jv-accent-soft: color-mix(in srgb, var(--jv-accent) 14%, transparent);
    --jv-ok-soft: color-mix(in srgb, var(--jv-ok) 16%, transparent);
    --jv-warn-soft: color-mix(in srgb, var(--jv-warn) 20%, transparent);
    --jv-danger-soft: color-mix(in srgb, var(--jv-danger) 14%, transparent);
    --jv-info-soft: color-mix(in srgb, var(--jv-info) 14%, transparent);
    --jv-neutral-soft: color-mix(in srgb, var(--jv-text) 8%, transparent);
    --jv-hover: color-mix(in srgb, var(--jv-text) 6%, transparent);
    --jv-pressed: color-mix(in srgb, var(--jv-text) 12%, transparent);
    --jv-surface-2: color-mix(in srgb, var(--jv-text) 4%, var(--jv-surface));
    --jv-skeleton: color-mix(in srgb, var(--jv-text) 8%, transparent);
    /* dialog backdrop: HA's scrim is always a dark dim (never derived from the
       text colour, which would be a white haze over a dark theme) */
    --jv-scrim: var(--mdc-dialog-scrim-color, color-mix(in srgb, var(--black-color, var(--primary-text-color)) 32%, transparent));

    /* readable state text (see the contrast note at the top): use these for
       any 11-14 px text that carries a state colour, on a card or on a tint */
    --jv-ok-text: color-mix(in srgb, var(--jv-ok) 55%, var(--jv-text));
    --jv-warn-text: color-mix(in srgb, var(--jv-warn) 45%, var(--jv-text));
    --jv-danger-text: color-mix(in srgb, var(--jv-danger) 60%, var(--jv-text));
    --jv-info-text: color-mix(in srgb, var(--jv-info) 55%, var(--jv-text));
    --jv-accent-text: color-mix(in srgb, var(--jv-accent) 55%, var(--jv-text));

    /* ── borders, radii, shadow, focus ───────────────────────────────── */
    --jv-border: var(--ha-card-border-color, var(--divider-color));
    --jv-border-width: var(--ha-card-border-width, 1px);
    --jv-divider: var(--divider-color);
    --jv-radius: var(--ha-card-border-radius, 12px);
    --jv-radius-sm: min(8px, var(--jv-radius));
    --jv-radius-pill: 999px;
    --jv-shadow: var(--ha-card-box-shadow, none);
    --jv-focus: var(--jv-accent);
    --jv-focus-ring: 0 0 0 2px var(--jv-surface), 0 0 0 4px var(--jv-focus);
    /* for controls inside a clipped box (overflow: hidden / auto) */
    --jv-focus-ring-inset: inset 0 0 0 2px var(--jv-surface), inset 0 0 0 4px var(--jv-focus);
    /* for controls on the app bar (the header's own colours, always inset) */
    --jv-header-focus-ring: inset 0 0 0 2px var(--jv-header-bg), inset 0 0 0 4px var(--jv-header-indicator);

    /* ── spacing scale (4 / 8 / 12 / 16 / 24) and tap size ───────────── */
    --jv-space-1: 4px;
    --jv-space-2: 8px;
    --jv-space-3: 12px;
    --jv-space-4: 16px;
    --jv-space-5: 24px;
    --jv-tap: 44px;
    --jv-header-height: var(--header-height, 56px);

    /* ── motion ──────────────────────────────────────────────────────── */
    --jv-ease: 160ms ease;
  }
`;
