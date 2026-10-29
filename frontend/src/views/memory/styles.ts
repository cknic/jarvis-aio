/**
 * Styles for <jarvis-view-memory>. Tokens only (see DESIGN.md §4).
 */
import { css } from "lit";

export const memoryStyles = css`
  /* ── layout: knowledge wide on the left, routines + briefings stacked right */
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--jv-space-4);
    align-items: start;
  }
  @media (min-width: 1024px) {
    .layout {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    }
  }
  .col {
    display: grid;
    gap: var(--jv-space-4);
    min-width: 0;
  }

  /* ── teach form ─────────────────────────────────────────────────── */
  form.teach {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    align-items: flex-end;
    margin: 0 0 var(--jv-space-3);
  }
  form.teach .field {
    flex: 1 1 160px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--jv-space-1);
  }
  form.teach .field.subject {
    flex: 0 1 150px;
  }
  form.teach label {
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
  }
  form.teach ha-textfield {
    width: 100%;
  }
  form.teach input,
  form.teach select {
    width: 100%;
    min-height: var(--jv-tap);
    padding: 0 var(--jv-space-3);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-surface);
    color: var(--jv-text);
    font: inherit;
  }
  form.teach input::placeholder {
    color: var(--jv-text-3);
  }
  form.teach input:disabled,
  form.teach select:disabled {
    opacity: 0.6;
  }
  form.teach .submit {
    flex: 0 0 auto;
  }
  :host([narrow]) form.teach .field,
  :host([narrow]) form.teach .field.subject {
    flex: 1 1 100%;
  }
  :host([narrow]) form.teach .submit {
    flex: 1 1 100%;
    width: 100%;
  }
  @media (max-width: 599px) {
    form.teach .field,
    form.teach .field.subject,
    form.teach .submit {
      flex: 1 1 100%;
      width: 100%;
    }
  }
  .form-msg {
    margin: 0 0 var(--jv-space-3);
    padding: var(--jv-space-2) var(--jv-space-3);
    border-radius: var(--jv-radius-sm);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  .form-msg.error {
    background: var(--jv-danger-soft);
    color: var(--jv-text);
  }
  .form-msg.ok {
    background: var(--jv-ok-soft);
    color: var(--jv-text);
  }

  /* ── lists ──────────────────────────────────────────────────────── */
  ul,
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .group + .group {
    margin-top: var(--jv-space-4);
  }
  .group-head {
    margin: 0 0 var(--jv-space-1);
    font-size: var(--jv-font-size-xs);
    font-weight: var(--jv-font-weight-medium);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--jv-text-2);
  }
  .fact {
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
    min-height: var(--jv-tap);
    padding: var(--jv-space-1) 0;
    border-bottom: 1px solid var(--jv-divider);
  }
  .fact:last-child {
    border-bottom: 0;
  }
  .fact.busy {
    opacity: 0.6;
  }
  .fact .text {
    flex: 1 1 auto;
    min-width: 0;
  }
  .fact .key {
    display: block;
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
    overflow-wrap: anywhere;
  }
  .fact .value {
    display: block;
    overflow-wrap: anywhere;
  }
  .marker {
    flex: none;
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    cursor: help;
  }
  .fact ha-icon-button,
  .fact .jv-icon-btn {
    flex: none;
    color: var(--jv-text-2);
    --mdc-icon-button-size: var(--jv-tap);
    --mdc-icon-size: 20px;
  }

  .routine {
    padding: var(--jv-space-2) 0;
    border-bottom: 1px solid var(--jv-divider);
  }
  .routine:last-child {
    border-bottom: 0;
  }
  .routine .desc {
    margin: 0 0 var(--jv-space-1);
    overflow-wrap: anywhere;
  }
  .routine .meta {
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
    font-variant-numeric: tabular-nums;
  }
  .bar {
    flex: 1 1 auto;
    height: 6px;
    min-width: 40px;
    border-radius: var(--jv-radius-pill);
    background: var(--jv-accent-soft);
    overflow: hidden;
  }
  .bar > span {
    display: block;
    height: 100%;
    background: var(--jv-accent);
    border-radius: inherit;
  }
  .routine .pct {
    flex: none;
    white-space: nowrap;
  }

  .briefing {
    padding: var(--jv-space-3) 0;
    border-bottom: 1px solid var(--jv-divider);
  }
  .briefing:first-child {
    padding-top: 0;
  }
  .briefing:last-child {
    border-bottom: 0;
  }
  .briefing time,
  .briefing .when {
    display: block;
    margin-bottom: var(--jv-space-1);
    font-family: var(--jv-font-code);
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
  }
  .briefing.latest time,
  .briefing.latest .when {
    color: var(--jv-accent-text);
    font-weight: var(--jv-font-weight-medium);
  }
  .briefing p {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  /* ── per-card states ────────────────────────────────────────────── */
  .alert {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2) var(--jv-space-3);
    padding: var(--jv-space-3);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-danger-soft);
    color: var(--jv-text);
  }
  .alert .body {
    flex: 1 1 200px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .alert strong {
    display: block;
    font-weight: var(--jv-font-weight-medium);
  }
  ha-alert {
    display: block;
  }
  .loading {
    display: grid;
    gap: var(--jv-space-2);
    padding: var(--jv-space-2) 0;
  }
  .loading .jv-skeleton {
    height: 36px;
  }
  .loading .jv-skeleton:nth-child(2) {
    width: 80%;
  }
  .loading .jv-skeleton:nth-child(3) {
    width: 60%;
  }
`;
