/**
 * Styles for <jarvis-view-overview> (tokens only; see DESIGN.md section 4).
 */
import { css } from "lit";

export const overviewStyles = css`
      .lockbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: var(--jv-space-2) var(--jv-space-4);
        margin-bottom: var(--jv-space-4);
      }
      .lockbar .text {
        display: flex;
        flex-direction: column;
        min-width: 0;
        text-align: right;
      }
      .lockbar .text .sub {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .lockbar.on .text .sub {
        color: var(--jv-danger-text);
      }
      .lockbar ha-icon {
        color: var(--jv-text-2);
      }
      .lockbar.on ha-icon {
        color: var(--jv-danger);
      }
      .switch {
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-height: var(--jv-tap);
        cursor: pointer;
      }
      .switch input {
        width: 20px;
        height: 20px;
        margin: 0;
        accent-color: var(--jv-accent);
      }
      /* status tiles */
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: var(--jv-space-3);
      }
      .tile {
        display: grid;
        grid-template-columns: 10px 1fr;
        column-gap: var(--jv-space-2);
        align-items: start;
        min-width: 0;
      }
      .tile .dot {
        width: 10px;
        height: 10px;
        margin-top: 5px;
        border-radius: 50%;
        background: var(--jv-text-3);
      }
      .tile .dot[data-level="ok"] {
        background: var(--jv-ok);
      }
      .tile .dot[data-level="warn"] {
        background: var(--jv-warn);
      }
      .tile .dot[data-level="danger"] {
        background: var(--jv-danger);
      }
      .tile .label {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .tile .value {
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .tile .sec {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
        overflow-wrap: anywhere;
      }
      .meta {
        margin: var(--jv-space-4) 0 0;
        padding-top: var(--jv-space-3);
        border-top: 1px solid var(--jv-divider);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      /* mode card */
      .desc {
        margin: 0 0 var(--jv-space-3);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        margin-bottom: var(--jv-space-3);
      }
      .chip {
        appearance: none;
        min-height: 36px;
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
        cursor: pointer;
        transition: background-color var(--jv-ease);
      }
      .chip:hover {
        background: var(--jv-hover);
      }
      .chip[aria-pressed="true"] {
        background: var(--jv-accent);
        border-color: transparent;
        color: var(--jv-on-accent);
        font-weight: var(--jv-font-weight-medium);
      }
      .chip[disabled] {
        cursor: default;
        opacity: 0.6;
      }
      .toggle-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--jv-space-3);
        padding-top: var(--jv-space-2);
        border-top: 1px solid var(--jv-divider);
      }
      .toggle-row .help {
        margin: 2px 0 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
      }
      /* right now */
      .now {
        appearance: none;
        display: block;
        width: 100%;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
      }
      button.now {
        cursor: pointer;
        border-radius: var(--jv-radius-sm);
      }
      .now .big {
        font-size: var(--jv-font-size-xl);
        font-weight: var(--jv-font-weight-medium);
        line-height: 1.3;
        overflow-wrap: anywhere;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--jv-space-2) var(--jv-space-3);
        margin-top: var(--jv-space-3);
      }
      .stats .k {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
      }
      .stats .v {
        font-variant-numeric: tabular-nums;
        overflow-wrap: anywhere;
      }
      /* quick actions */
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
      }
      .nap {
        margin: var(--jv-space-3) 0 0;
        color: var(--jv-warn-text);
        font-size: var(--jv-font-size-s);
      }
      /* skeletons */
      .sk {
        display: grid;
        gap: var(--jv-space-2);
      }
      .sk .jv-skeleton {
        height: 18px;
      }
      .sk .jv-skeleton:nth-child(2) {
        width: 70%;
      }
      .sk .jv-skeleton:nth-child(3) {
        width: 45%;
      }
      .tile .value.small {
        font-size: var(--jv-font-size-s);
      }
      /* narrow comes from HA; the viewport media queries in base.ts cover wide hosts */
      .narrow .jv-grid {
        grid-template-columns: minmax(0, 1fr);
      }
      .narrow .tiles {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .narrow .lockbar {
        justify-content: space-between;
      }
`;
