/** Styles for <jarvis-view-residence> (tokens only; see ../../theme/tokens.ts). */
import { css } from "lit";

export const residenceStyles = css`
      .res {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-4);
        align-items: start;
      }
      @media (min-width: 1280px) {
        .res {
          grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
        }
      }
      .controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-4);
        margin-bottom: var(--jv-space-3);
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .field > span {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        letter-spacing: 0.04em;
      }
      select {
        font: inherit;
        color: var(--jv-text);
        background: var(--jv-surface);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        max-width: 100%;
      }
      .seg {
        display: inline-flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1);
        border: 0;
        padding: 0;
        margin: 0;
      }
      .seg legend {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        padding: 0;
        margin-bottom: 2px;
      }
      .seg button {
        appearance: none;
        font: inherit;
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        min-height: 36px;
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface);
        color: var(--jv-text);
        cursor: pointer;
        transition: background-color var(--jv-ease);
      }
      .seg button:hover {
        background: var(--jv-hover);
      }
      .seg button[aria-pressed="true"] {
        background: var(--jv-accent-soft);
        border-color: var(--jv-accent);
        color: var(--jv-text);
      }
      .hint {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        align-self: end;
        padding-bottom: 8px;
      }
      .scene {
        position: relative;
        height: 560px;
        border-radius: var(--jv-radius-sm);
        background: var(--jv-bg-2);
        border: var(--jv-border-width) solid var(--jv-border);
        overflow: hidden;
        cursor: grab;
        touch-action: pan-y;
        user-select: none;
        -webkit-user-select: none;
      }
      .scene.dragging {
        cursor: grabbing;
      }
      .scene svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      .scene svg text {
        font-family: var(--jv-font-code);
      }
      /* the overlays sit on the drawing: a translucent surface chip keeps the
         captions readable over the model and the --jv-bg-2 scene background */
      .overlay {
        position: absolute;
        pointer-events: none;
        padding: var(--jv-space-1) var(--jv-space-2);
        border-radius: var(--jv-radius-sm);
        background: color-mix(in srgb, var(--jv-surface) 85%, transparent);
        font-size: var(--jv-font-size-xs);
        line-height: 1.3;
      }
      .banner {
        top: var(--jv-space-3);
        left: var(--jv-space-3);
        max-width: 55%;
        color: var(--jv-text-2);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .banner strong {
        color: var(--jv-text);
        font-weight: var(--jv-font-weight-medium);
      }
      .stats {
        top: var(--jv-space-3);
        right: var(--jv-space-3);
        display: flex;
        gap: var(--jv-space-4);
        text-align: right;
      }
      .stat .k {
        color: var(--jv-text-2);
        letter-spacing: 0.06em;
      }
      .stat .v {
        color: var(--jv-text);
        font-size: var(--jv-font-size-m);
        font-weight: var(--jv-font-weight-medium);
        font-variant-numeric: tabular-nums;
      }
      .placeholder {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        color: var(--jv-text-2);
      }
      .planhint {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-2);
        margin: var(--jv-space-3) 0 0;
        padding: var(--jv-space-2) var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-info-soft);
        font-size: var(--jv-font-size-s);
      }
      .planhint a {
        color: var(--jv-accent-text);
      }
      .dom {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-3);
        margin-top: var(--jv-space-4);
        padding-top: var(--jv-space-3);
        border-top: 1px solid var(--jv-divider);
      }
      .dom .name {
        font-size: var(--jv-font-size-xl);
        font-weight: var(--jv-font-weight-medium);
        line-height: 1.2;
      }
      .gauges {
        display: flex;
        gap: var(--jv-space-3);
      }
      .gauge {
        position: relative;
        width: 64px;
        text-align: center;
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
      }
      .gauge svg {
        display: block;
        width: 64px;
        height: 64px;
      }
      .gauge .track {
        fill: none;
        stroke: var(--jv-neutral-soft);
        stroke-width: 5;
      }
      .gauge .arc {
        fill: none;
        stroke: var(--jv-accent);
        stroke-width: 5;
        stroke-linecap: round;
        transition: stroke-dashoffset var(--jv-ease);
      }
      .gauge.dim .arc {
        stroke: var(--jv-text-3);
      }
      .gauge .val {
        position: absolute;
        top: 22px;
        left: 0;
        right: 0;
        color: var(--jv-text);
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        font-variant-numeric: tabular-nums;
      }
      .mm-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: var(--jv-space-2);
      }
      .mm-room {
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface-2);
      }
      .mm-room.on {
        border-color: var(--jv-ok);
        background: var(--jv-ok-soft);
      }
      .mm-room summary,
      .mm-room .row {
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        min-height: var(--jv-tap);
        padding: var(--jv-space-2) var(--jv-space-3);
        cursor: pointer;
        list-style: none;
      }
      .mm-room summary::-webkit-details-marker {
        display: none;
      }
      .mm-dot {
        flex: none;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--jv-text-3);
      }
      .mm-room.on .mm-dot {
        background: var(--jv-ok);
      }
      .mm-body {
        flex: 1 1 auto;
        min-width: 0;
      }
      .mm-name {
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .mm-meta {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .mm-sensors {
        list-style: none;
        margin: 0;
        padding: 0 var(--jv-space-3) var(--jv-space-2) calc(var(--jv-space-3) + 10px + var(--jv-space-3));
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .mm-sensors li {
        display: flex;
        justify-content: space-between;
        gap: var(--jv-space-2);
        padding: 2px 0;
      }
      .mm-sensors .on {
        color: var(--jv-ok-text);
      }
      .mm-state {
        margin: var(--jv-space-2) 0 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .subtext {
        margin: 0 0 var(--jv-space-3);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .err {
        margin-bottom: var(--jv-space-3);
        padding: var(--jv-space-2) var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-danger-soft);
        font-size: var(--jv-font-size-s);
      }
      /* Narrow rules key off the card's own width (container query) so they
         apply on a phone AND inside a narrow HA layout / the harness frame. */
      .wrap {
        container-type: inline-size;
      }
      @container (max-width: 768px) {
        .scene {
          height: 340px;
        }
        .stat.style {
          display: none;
        }
        .controls > * {
          flex: 1 1 100%;
        }
        .seg button {
          padding: 8px 14px;
        }
      }
      @container (max-width: 520px) {
        .banner {
          max-width: calc(100% - 2 * var(--jv-space-3));
        }
        .stats {
          top: calc(var(--jv-space-3) + 1.6em);
          left: var(--jv-space-3);
          right: auto;
          text-align: left;
          gap: var(--jv-space-3);
        }
      }
      @container (max-width: 380px) {
        .stat.sqft {
          display: none;
        }
      }
`;
