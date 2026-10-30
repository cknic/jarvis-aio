/**
 * Styles for <jarvis-view-people>. Tokens only (DESIGN.md §4).
 */
import { css } from "lit";

export const peopleStyles = css`
  /* Cards are rendered in NARROW order (Recently seen first); desktop re-orders. */
  :host(:not([narrow])) .card-household {
    order: 1;
  }
  :host(:not([narrow])) .card-recent {
    order: 2;
  }
  :host(:not([narrow])) .card-voices {
    order: 3;
  }
  :host(:not([narrow])) .card-wellbeing {
    order: 4;
  }
  :host(:not([narrow])) .card-options {
    order: 5;
  }
  /* A phone-width window HA did not flag as narrow keeps the narrow order too. */
  @media (max-width: 600px) {
    :host(:not([narrow])) .jv-grid > * {
      order: 0;
    }
  }

  .intro {
    margin: 0 0 var(--jv-space-3);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  .intro p {
    margin: 0 0 var(--jv-space-2);
  }
  .intro p:last-child {
    margin-bottom: 0;
  }
  .intro code,
  .code {
    font-family: var(--jv-font-code);
    font-size: var(--jv-font-size-xs);
  }
  details.intro summary {
    cursor: pointer;
    color: var(--jv-accent-text);
    font-weight: var(--jv-font-weight-medium);
    min-height: var(--jv-tap);
    display: flex;
    align-items: center;
    list-style: none;
  }
  details.intro summary::-webkit-details-marker {
    display: none;
  }
  details.intro[open] summary {
    margin-bottom: var(--jv-space-2);
  }

  /* ── forms ─────────────────────────────────────────────────────────── */
  .form-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    align-items: center;
    margin: 0 0 var(--jv-space-3);
  }
  .form-row > .grow {
    flex: 1 1 200px;
    min-width: 0;
  }
  .form-row ha-textfield {
    width: 100%;
  }
  .form-row input,
  .form-row select,
  .field input,
  .mic-row input {
    width: 100%;
    min-height: var(--jv-tap);
    padding: 0 var(--jv-space-3);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-surface);
    color: var(--jv-text);
    font: inherit;
  }
  .form-row input::placeholder,
  .field input::placeholder,
  .mic-row input::placeholder {
    color: var(--jv-text-3);
  }
  .form-row input:disabled,
  .field input:disabled,
  .mic-row input:disabled {
    opacity: 0.6;
  }
  :host([narrow]) .form-row > .grow,
  :host([narrow]) .form-row > .jv-btn {
    flex: 1 1 100%;
    width: 100%;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--jv-space-1);
    margin: 0 0 var(--jv-space-3);
  }
  .field > label,
  .help {
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  .field ha-textfield {
    width: 100%;
  }
  .help {
    margin: var(--jv-space-1) 0 var(--jv-space-3);
  }

  /* ── switch rows ───────────────────────────────────────────────────── */
  .switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--jv-space-3);
    min-height: var(--jv-tap);
  }
  .switch-row .label {
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
    flex-wrap: wrap;
    font-weight: var(--jv-font-weight-medium);
  }
  label.switch {
    display: inline-flex;
    align-items: center;
    gap: var(--jv-space-2);
    min-height: var(--jv-tap);
    cursor: pointer;
  }
  label.switch input {
    width: 20px;
    height: 20px;
    accent-color: var(--jv-accent);
  }

  /* ── galleries ─────────────────────────────────────────────────────── */
  ul.gallery {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--jv-space-3);
  }
  ul.gallery > li {
    min-width: 0;
  }
  .skeleton-square {
    aspect-ratio: 1 / 1;
    border-radius: var(--jv-radius);
  }
  .footer {
    margin: var(--jv-space-3) 0 0;
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }

  /* ── lists ─────────────────────────────────────────────────────────── */
  ul.plain {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  ul.plain > li {
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
    min-height: var(--jv-tap);
    padding: var(--jv-space-1) 0;
    border-top: 1px solid var(--jv-divider);
  }
  ul.plain > li:first-child {
    border-top: 0;
  }
  ul.plain .text {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  ul.plain .sub {
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  .kind-group {
    margin: 0 0 var(--jv-space-3);
  }
  .kind-group h3 {
    margin: 0 0 var(--jv-space-1);
    font-size: var(--jv-font-size-s);
    font-weight: var(--jv-font-weight-medium);
    color: var(--jv-text-2);
    text-transform: capitalize;
  }

  /* ── status ────────────────────────────────────────────────────────── */
  .status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2);
    margin: var(--jv-space-3) 0;
  }
  .status .hint {
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  .speaking {
    margin: 0 0 var(--jv-space-3);
  }
  .speaking .guess {
    color: var(--jv-text-2);
  }
  .result {
    margin: 0 0 var(--jv-space-3);
    padding: var(--jv-space-2) var(--jv-space-3);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-info-soft);
  }
  .mic-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    margin: var(--jv-space-3) 0;
  }
  .mic-row > .grow {
    flex: 1 1 160px;
    min-width: 0;
  }
  .mic-row ha-textfield {
    width: 100%;
  }
  :host([narrow]) .mic-row > .grow,
  :host([narrow]) .mic-row > .jv-btn {
    flex: 1 1 100%;
    width: 100%;
  }
  .link {
    appearance: none;
    display: inline-flex;
    align-items: center;
    min-height: var(--jv-tap);
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--jv-accent-text);
    font: inherit;
    font-size: var(--jv-font-size-s);
    font-weight: var(--jv-font-weight-medium);
    cursor: pointer;
    text-decoration: underline;
  }
  a.link {
    text-decoration: underline;
  }
  .loading {
    display: grid;
    gap: var(--jv-space-2);
  }
  .loading .jv-skeleton {
    height: var(--jv-tap);
  }
  .alert {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2);
    padding: var(--jv-space-3);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-danger-soft);
    border-left: 4px solid var(--jv-danger);
  }
  .alert.info {
    background: var(--jv-info-soft);
    border-left-color: var(--jv-info);
  }
  .alert .body {
    flex: 1 1 200px;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .alert .body span {
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  ha-alert {
    display: block;
    margin: 0 0 var(--jv-space-3);
  }
  .sr-live {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
`;
