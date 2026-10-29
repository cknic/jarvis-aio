/**
 * Shared styles every JARVIS element includes: the tokens, box-sizing, the
 * responsive card grid, button/tap-target rules, focus rings and the
 * visually-hidden utility. Views add their own css`` after `base`.
 *
 *   static styles = [base, css`...`];
 *
 * Grid breakpoints (viewport width): 1 column below 600px, 2 below 1100px,
 * 3 above. Use `.jv-grid` for the view's card layout and `.jv-span-all` on a
 * card that should take the full row.
 */
import { css } from "lit";
import { tokens } from "./tokens";

export const base = css`
  ${tokens}

  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--jv-font);
    font-size: var(--jv-font-size-m);
    line-height: var(--jv-line-height);
    color: var(--jv-text);
    -webkit-tap-highlight-color: transparent;
  }
  :host([hidden]) {
    display: none;
  }
  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

  /* ── layout ───────────────────────────────────────────────────────── */
  .jv-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--jv-space-4);
    align-items: start;
  }
  @media (min-width: 600px) {
    .jv-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 1100px) {
    .jv-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .jv-span-all {
    grid-column: 1 / -1;
  }
  .jv-stack {
    display: flex;
    flex-direction: column;
    gap: var(--jv-space-3);
  }
  .jv-row {
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
    min-width: 0;
  }
  .jv-row > .jv-grow {
    flex: 1 1 auto;
    min-width: 0;
  }
  .jv-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── card fallback (when ha-card is not yet defined) ──────────────── */
  .jv-card {
    background: var(--jv-surface);
    color: var(--jv-text);
    border-radius: var(--jv-radius);
    border: var(--jv-border-width) solid var(--jv-border);
    box-shadow: var(--jv-shadow);
  }

  /* ── typography helpers ───────────────────────────────────────────── */
  .jv-title {
    margin: 0;
    font-size: var(--jv-font-size-l);
    font-weight: var(--jv-font-weight-medium);
    line-height: 1.3;
  }
  .jv-subtitle,
  .jv-muted {
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  .jv-mono {
    font-family: var(--jv-font-code);
    font-variant-numeric: tabular-nums;
  }

  /* ── buttons & tap targets ────────────────────────────────────────── */
  .jv-tap {
    min-height: var(--jv-tap);
    min-width: var(--jv-tap);
  }
  .jv-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--jv-space-2);
    min-height: var(--jv-tap);
    padding: 0 var(--jv-space-4);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-surface);
    color: var(--jv-text);
    font: inherit;
    font-weight: var(--jv-font-weight-medium);
    cursor: pointer;
    transition: background-color var(--jv-ease);
  }
  .jv-btn:hover {
    background: var(--jv-hover);
  }
  .jv-btn:active {
    background: var(--jv-pressed);
  }
  .jv-btn[disabled],
  .jv-btn:disabled {
    cursor: default;
    opacity: 0.5;
  }
  .jv-btn.primary {
    background: var(--jv-accent);
    border-color: transparent;
    color: var(--jv-on-accent);
  }
  .jv-btn.danger {
    background: var(--jv-danger);
    border-color: transparent;
    color: var(--jv-on-danger);
  }
  .jv-btn.text {
    background: transparent;
    border-color: transparent;
    color: var(--jv-accent);
  }
  .jv-icon-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--jv-tap);
    height: var(--jv-tap);
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .jv-icon-btn:hover {
    background: var(--jv-hover);
  }

  /* ── focus: one ring everywhere ───────────────────────────────────── */
  :where(button, a, input, select, textarea, summary, [tabindex]):focus-visible {
    outline: none;
    box-shadow: var(--jv-focus-ring);
  }
  :where(button, a, input, select, textarea, summary, [tabindex]):focus:not(:focus-visible) {
    outline: none;
  }

  /* ── misc utilities ───────────────────────────────────────────────── */
  /* Extend a small control's hit box to the 44 px tap target without
     changing its visual size (chips, pills, text links). Not for <input>
     or <select> (replaced elements have no ::before): give those a
     min-height of var(--jv-tap) instead. */
  .jv-hit {
    position: relative;
  }
  .jv-hit::before {
    content: "";
    position: absolute;
    inset: calc((var(--jv-tap) - 100%) / -2) 0;
  }
  .visually-hidden {
    position: absolute !important;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
  .jv-divider {
    border: 0;
    border-top: 1px solid var(--jv-divider);
    margin: var(--jv-space-2) 0;
  }
  .jv-skeleton {
    background: var(--jv-skeleton);
    border-radius: var(--jv-radius-sm);
    min-height: 1em;
  }

  /* The ONE permitted animation: an occupancy pulse, motion-safe only. */
  @media (prefers-reduced-motion: no-preference) {
    @keyframes jv-pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.45;
      }
    }
    .jv-pulse {
      animation: jv-pulse 2s ease-in-out infinite;
    }
  }
`;
