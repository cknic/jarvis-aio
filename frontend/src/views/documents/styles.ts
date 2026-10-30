/**
 * Styles for the documents view and its cards. Tokens only (DESIGN.md §4).
 * `cardStyles` is shared by the two search card elements; `viewStyles` is the
 * library + engine cards rendered by <jarvis-view-documents> itself.
 */
import { css } from "lit";

export const cardStyles = css`
  ul,
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  code,
  .tech {
    font-family: var(--jv-font-code);
    font-size: 0.95em;
    overflow-wrap: anywhere;
  }
  .caption {
    margin: 0 0 var(--jv-space-3);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  .hint {
    margin: var(--jv-space-3) 0 0;
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  /* text links are buttons (keyboard operable) in the accent text colour */
  .link {
    appearance: none;
    display: inline;
    border: 0;
    padding: 0;
    margin: 0;
    background: transparent;
    color: var(--jv-accent-text);
    font: inherit;
    font-weight: var(--jv-font-weight-medium);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  /* hover keeps the AA text colour (raw --jv-accent is 2.63:1 in HA light) */
  .link:hover {
    text-decoration-thickness: 2px;
  }

  /* ── the shared query form ─────────────────────────────────────── */
  form.query {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    align-items: center;
  }
  form.query .field {
    flex: 1 1 180px;
    min-width: 0;
  }
  form.query ha-textfield {
    width: 100%;
  }
  form.query input {
    width: 100%;
    min-height: var(--jv-tap);
    padding: 0 var(--jv-space-3);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-surface);
    color: var(--jv-text);
    font: inherit;
  }
  form.query input::placeholder {
    color: var(--jv-text-3);
  }
  form.query input:disabled {
    opacity: 0.6;
  }
  form.query .clear {
    flex: none;
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-xl);
  }
  form.query .submit {
    flex: none;
  }
  @media (max-width: 599px) {
    form.query .field {
      flex: 1 1 100%;
    }
    form.query .submit {
      flex: 1 1 auto;
    }
  }

  /* ── results ───────────────────────────────────────────────────── */
  .results-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2);
    margin: var(--jv-space-3) 0 var(--jv-space-2);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  .hit {
    padding: var(--jv-space-3) 0;
    border-top: 1px solid var(--jv-divider);
  }
  .hit .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--jv-space-1) var(--jv-space-2);
    margin-bottom: var(--jv-space-1);
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
  }
  .hit .meta .source,
  .hit .meta .role {
    color: var(--jv-text);
    font-weight: var(--jv-font-weight-medium);
    overflow-wrap: anywhere;
  }
  .hit .meta .score {
    color: var(--jv-accent-text);
    font-variant-numeric: tabular-nums;
  }
  .hit .meta .chunk,
  .hit .meta .when {
    font-family: var(--jv-font-code);
    font-variant-numeric: tabular-nums;
  }

  /* ── alert fallback (when ha-alert is not defined) ─────────────── */
  ha-alert {
    display: block;
  }
  .alert {
    display: flex;
    align-items: flex-start;
    gap: var(--jv-space-2);
    padding: var(--jv-space-3);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-info-soft);
    color: var(--jv-text);
    border-left: 4px solid var(--jv-info);
    overflow-wrap: anywhere;
  }
  .alert.success {
    background: var(--jv-ok-soft);
    border-left-color: var(--jv-ok);
  }
  .alert.warning {
    background: var(--jv-warn-soft);
    border-left-color: var(--jv-warn);
  }
  .alert.error {
    background: var(--jv-danger-soft);
    border-left-color: var(--jv-danger);
  }
  .alert-icon {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--jv-info);
    color: var(--jv-on-accent);
    font-size: var(--jv-font-size-s);
    font-weight: var(--jv-font-weight-bold);
  }
  /* ok/warn fills are too light for a white glyph (1.96:1 / 3.3:1 in HA
     light): ring in the state colour on the surface, glyph in --jv-text */
  .alert.success .alert-icon,
  .alert.warning .alert-icon {
    background: var(--jv-surface);
    color: var(--jv-text);
    box-shadow: inset 0 0 0 2px var(--_ring);
  }
  .alert.success .alert-icon {
    --_ring: var(--jv-ok);
  }
  .alert.warning .alert-icon {
    --_ring: var(--jv-warn);
  }
  .alert.error .alert-icon {
    background: var(--jv-danger);
    color: var(--jv-on-danger);
  }
  .alert-body {
    flex: 1 1 auto;
    min-width: 0;
    padding-top: 1px;
  }
  .alert-body strong {
    display: block;
    font-weight: var(--jv-font-weight-medium);
  }
  .alert-body p {
    margin: 0;
  }
  .alert-body p + p {
    margin-top: var(--jv-space-1);
  }
  .alert .jv-btn {
    flex: none;
    align-self: center;
  }
  .alert-dismiss {
    flex: none;
    margin: calc(-1 * var(--jv-space-2)) calc(-1 * var(--jv-space-2)) calc(-1 * var(--jv-space-2)) 0;
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-xl);
  }
  .alert-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    margin-top: var(--jv-space-2);
  }
  details.problems {
    margin-top: var(--jv-space-2);
  }
  details.problems summary {
    cursor: pointer;
    min-height: var(--jv-tap);
    display: flex;
    align-items: center;
    font-weight: var(--jv-font-weight-medium);
  }
  details.problems ul {
    margin: var(--jv-space-1) 0 0;
    padding-left: var(--jv-space-4);
    list-style: disc;
    font-family: var(--jv-font-code);
    font-size: var(--jv-font-size-s);
  }
  details.problems li {
    overflow-wrap: anywhere;
  }

  /* ── loading skeleton ──────────────────────────────────────────── */
  .loading {
    display: grid;
    gap: var(--jv-space-2);
    padding: var(--jv-space-2) 0;
  }
  .loading .jv-skeleton {
    height: 32px;
  }
  .loading .jv-skeleton:nth-child(2) {
    width: 80%;
  }
  .loading .jv-skeleton:nth-child(3) {
    width: 60%;
  }
`;

export const viewStyles = css`
  /* flush card: content gets its own 16 px gutter */
  .gut {
    padding: 0 var(--jv-space-4);
  }
  .intro {
    margin: 0 0 var(--jv-space-3);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  .footer {
    margin: 0;
    padding: var(--jv-space-3) var(--jv-space-4) var(--jv-space-4);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }

  /* drag-and-drop highlight on the whole card */
  jv-section.library {
    border-radius: var(--jv-radius);
    outline: 2px dashed transparent;
    outline-offset: -2px;
    transition: outline-color var(--jv-ease);
  }
  jv-section.library.drag {
    outline-color: var(--jv-accent);
    background: var(--jv-accent-soft);
  }

  /* ── toolbar ───────────────────────────────────────────────────── */
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2);
    margin-bottom: var(--jv-space-3);
  }
  .toolbar .jv-btn {
    flex: none;
  }
  .toolbar .link {
    margin-left: var(--jv-space-1);
  }
  @media (max-width: 599px) {
    .toolbar .jv-btn {
      flex: 1 1 100%;
      width: 100%;
    }
    .toolbar .link {
      margin: 0;
      min-height: var(--jv-tap);
      display: inline-flex;
      align-items: center;
    }
  }
  .banner {
    margin-bottom: var(--jv-space-3);
  }
  .banner:empty {
    display: none;
  }

  /* ── document rows ─────────────────────────────────────────────── */
  .row {
    display: flex;
    align-items: center;
    gap: var(--jv-space-3);
    min-height: var(--jv-tap);
    padding: var(--jv-space-1) var(--jv-space-2) var(--jv-space-1) var(--jv-space-4);
    border-top: 1px solid var(--jv-divider);
  }
  .row.busy {
    opacity: 0.6;
  }
  .row .ficon {
    flex: none;
    color: var(--jv-text-2);
    --mdc-icon-size: 22px;
  }
  .row .name {
    flex: 1 1 auto;
    min-width: 0;
  }
  .row .chunks {
    flex: none;
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    white-space: nowrap;
  }
  .row ha-icon-button,
  .row .jv-icon-btn {
    flex: none;
    color: var(--jv-text-2);
    --mdc-icon-button-size: var(--jv-tap);
    --mdc-icon-size: 20px;
  }
  @media (max-width: 599px) {
    .row {
      flex-wrap: wrap;
      row-gap: 0;
      padding-top: var(--jv-space-2);
    }
    .row .name {
      flex: 1 1 calc(100% - 22px - var(--jv-space-3));
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      overflow-wrap: anywhere;
    }
    .row .chunks {
      flex: 1 1 auto;
      margin-left: calc(22px + var(--jv-space-3));
    }
  }
  .list-state {
    padding: 0 var(--jv-space-4);
  }

  /* ── engine card ───────────────────────────────────────────────── */
  .engine-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2);
    margin-bottom: var(--jv-space-2);
  }
  .engine-line {
    margin: 0 0 var(--jv-space-3);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  .engine-line .jv-btn {
    margin-top: var(--jv-space-2);
  }
  .kv-value {
    display: inline-flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: baseline;
    gap: var(--jv-space-2);
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .kv-value .link {
    font-family: var(--jv-font);
    font-size: var(--jv-font-size-s);
    white-space: nowrap;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    margin: var(--jv-space-3) 0;
  }
  @media (max-width: 599px) {
    .buttons .jv-btn {
      flex: 1 1 100%;
      width: 100%;
    }
  }
  .probe:empty {
    display: none;
  }
`;
