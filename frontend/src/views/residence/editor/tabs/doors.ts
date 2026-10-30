/**
 * <jarvis-editor-doors> - the Doors tab of the floor-plan editor
 * (editor.md sections 3.7, 5 "Doors", 6 D1-D2).
 *
 * The door-mapping grid: one row per model door slot (Front Door, Garage
 * Door / Garage Door {n} per bay, Garage Side / Rear, Kitchen <-> Garage,
 * Cellar / Bulkhead, Basement) with a <jv-picker> over the binary_sensor /
 * cover / lock entities that can report open/closed, and the slot's live
 * state next to it (data.doors[slot] for the backend slots, the mapped
 * entity's own state for the client-only garage_<n> bays). Blank = auto-detect
 * by name. Every change writes the WHOLE `door_mapping` dict immediately
 * (store.writeSetting -> jarvis/update_config, optimistic, reverted on error,
 * jarvis-refresh on success). Slots that are mapped but no longer in the slot
 * list (garage_3 after the bays dropped to 2) are listed under "Other mapped
 * slots" with a remove button.
 *
 * The canvas is read-only in this mode: the openings layer outlines the
 * markers whose sensor is mapped to a slot, and hovering a slot row glows the
 * marker bound to that slot's entity on the current floor.
 */
import { html, css, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { base } from "../../../../theme/base";
import { t } from "../../../../i18n";
import { watchDefinitions } from "../../../../ha";
import { keepRowFocus, type RowFocus } from "../../../../focus";
import "../../../../components";
import "../../../../components/jv-picker";
import type { PickerChangeDetail, PickerItem } from "../../../../components/jv-picker";
import type { BadgeLevel } from "../../../../components";
import type { Hass } from "../../../../types";
import { JarvisEditorTab } from "../tab-base";
import { doorEntityCandidates, doorSlots, friendlyName, otherMappedSlots, type DoorMapping, type DoorSlotDef } from "../model";
import { HA_FORM_TAGS, annexStyles, icon, setGlow } from "./openings-doors-pins-shared";

const KEY = "door_mapping";
/** Domains that can report open/closed (the HA picker's filter; the fallback list uses doorEntityCandidates). */
const DOOR_DOMAINS = ["binary_sensor", "cover", "lock"];

/** open / closed of one entity, or null when it has no state. */
function entityOpenState(hass: Hass | undefined, eid: string): "open" | "closed" | null {
  if (!eid) return null;
  const st = hass?.states?.[eid]?.state;
  if (st == null || st === "unavailable" || st === "unknown") return null;
  return st === "on" || st === "open" || st === "opening" || st === "unlocked" ? "open" : "closed";
}

let _seq = 0;

/**
 * An "Other mapped slots" Remove hands keyboard focus to the next / previous
 * row's Remove. Those are disabled while the write saves, and the last row
 * takes the list with it: then the heading, else the slot grid.
 */
const REMOVE_FOCUS: RowFocus = { row: ".other > li", key: "data-slot", control: "[data-remove]", fallback: [".sub", "fieldset.slots"] };

@customElement("jarvis-editor-doors")
export class JarvisEditorDoors extends JarvisEditorTab {
  static override styles = [
    base,
    annexStyles,
    css`
      fieldset.slots {
        border: 0;
        margin: 0;
        padding: 0;
        min-width: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
        gap: var(--jv-space-3);
      }
      .slot {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-1);
        min-width: 0;
        padding: var(--jv-space-2) var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        transition: background-color var(--jv-ease);
      }
      .slot:hover,
      .slot:focus-within {
        background: var(--jv-hover);
      }
      .slot-head {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-height: 28px;
        min-width: 0;
      }
      .slot-name {
        flex: 1 1 auto;
        min-width: 0;
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      jv-picker {
        display: block;
        min-width: 0;
      }
      .sub {
        margin: var(--jv-space-4) 0 var(--jv-space-2);
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        color: var(--jv-text-2);
      }
      .other {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-2);
      }
      .other li {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-width: 0;
        padding: var(--jv-space-1) var(--jv-space-1) var(--jv-space-1) var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
      }
      .other .what {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .other .jv-icon-btn {
        width: var(--jv-tap);
        height: var(--jv-tap);
      }
      .status-row {
        margin-top: var(--jv-space-3);
      }
    `,
  ];

  private readonly _uid = `jed${++_seq}`;

  override connectedCallback(): void {
    super.connectedCallback();
    watchDefinitions(this, [...HA_FORM_TAGS, "jv-picker"]);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    setGlow(null, this.store);
  }

  // ── actions ───────────────────────────────────────────────────────────
  private _write(next: DoorMapping): void {
    const s = this.store;
    if (!s) return;
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(next)) if (typeof v === "string" && v) clean[k] = v;
    void s.writeSetting(KEY, clean);
  }

  private _setSlot(slot: string, eid: string): void {
    const s = this.store;
    if (!s) return;
    const cur = s.settings.doorMapping;
    if ((cur[slot] ?? "") === eid) return;
    const next: DoorMapping = { ...cur };
    if (eid) next[slot] = eid;
    else delete next[slot];
    this._write(next);
  }

  /** Glow the opening marker on this floor whose sensor is `eid` (null clears). */
  private _glowEntity(eid: string | null): void {
    const s = this.store;
    if (!s) return;
    const o = eid ? s.openings().find((x) => x.entity === eid) : undefined;
    setGlow(o?.id ?? null, s);
  }

  // ── render ────────────────────────────────────────────────────────────
  private _stateBadge(def: DoorSlotDef, mapped: string) {
    const s = this.store as NonNullable<typeof this.store>;
    let st: "open" | "closed" | null = null;
    if (def.backend) {
      const raw = s.data?.doors?.[def.slot];
      st = raw === "open" ? "open" : raw === "closed" ? "closed" : null;
    } else {
      // client-only per-bay slot: the 3D model reads the mapped entity (bay 1 falls back to `garage`)
      const map = s.settings.doorMapping;
      const eid = mapped || (def.n === 1 ? map.garage || "" : "");
      st = entityOpenState(this.hass, eid);
    }
    if (!st) return nothing;
    const level: BadgeLevel = st === "open" ? "warn" : "neutral";
    return html`<jv-state-badge level=${level} .label=${st === "open" ? t("Open") : t("Closed")}></jv-state-badge>`;
  }

  private _items(selected: string): PickerItem[] {
    return doorEntityCandidates(this.hass, selected).map((e) => {
      const name = friendlyName(this.hass, e);
      return name !== e ? { value: e, label: name, secondary: e } : { value: e, label: e };
    });
  }

  override render() {
    const s = this.store;
    if (!s) return nothing;
    const mapping = s.settings.doorMapping;
    const slots = doorSlots(s.config);
    const others = otherMappedSlots(mapping, slots);
    const status = s.settingStatus[KEY];
    const busy = status?.level === "saving";
    return html`
      <p class="help">
        ${t("Map the model's doors to your entities. Blank = auto-detect by name. Per-bay garage slots drive the 3D model only; JARVIS's door awareness uses Front, Garage, Garage Side / Rear, Kitchen ↔ Garage, Cellar and Basement.")}
      </p>
      <fieldset class="slots" tabindex="-1" aria-label=${t("Doors")} aria-busy=${busy ? "true" : "false"}>
        ${repeat(
          slots,
          (d) => d.slot,
          (d) => {
            const label = t(d.label, d.n != null ? { n: d.n } : undefined);
            const mapped = mapping[d.slot] ?? "";
            const lid = `${this._uid}-${d.slot}`;
            return html`
              <div class="slot" data-slot=${d.slot} @pointerenter=${() => this._glowEntity(mapped || null)} @pointerleave=${() => this._glowEntity(null)} @focusin=${() => this._glowEntity(mapped || null)} @focusout=${() => this._glowEntity(null)}>
                <div class="slot-head">
                  <span class="slot-name" id=${lid}>${label}</span>
                  ${this._stateBadge(d, mapped)}
                </div>
                <jv-picker
                  kind="entity"
                  .hass=${this.hass}
                  .data=${s.data}
                  .label=${label}
                  .placeholder=${mapped ? t("type to find an entity…") : t("— auto-detect —")}
                  .domains=${DOOR_DOMAINS}
                  .items=${() => this._items(mapped)}
                  .value=${mapped}
                  ?disabled=${busy}
                  @value-changed=${(e: CustomEvent<PickerChangeDetail>) => {
                    e.stopPropagation();
                    const v = e.detail?.value;
                    this._setSlot(d.slot, typeof v === "string" ? v : "");
                  }}
                ></jv-picker>
              </div>
            `;
          },
        )}
      </fieldset>
      <div class="status-row" role="status" aria-live="polite">
        ${status?.level === "saving"
          ? html`<span class="status">${t("Saving…")}</span>`
          : status?.level === "saved"
            ? html`<span class="status ok">${t("Saved")}</span>`
            : nothing}
      </div>
      ${status?.level === "error" ? html`<p class="err" role="alert">${t("Save failed — {message}", { message: status.message || "" })}</p>` : nothing}
      ${others.length
        ? html`
            <h3 class="sub" tabindex="-1">${t("Other mapped slots")}</h3>
            <ul class="other">
              ${others.map((slot) => {
                const eid = mapping[slot] ?? "";
                const name = friendlyName(this.hass, eid);
                return html`<li data-slot=${slot}>
                  <span class="what">
                    <span class="jv-mono">${slot}</span>
                    <span class="jv-muted jv-truncate">${name}${name !== eid ? html` · <span class="jv-mono">${eid}</span>` : nothing}</span>
                  </span>
                  <button type="button" class="jv-icon-btn" data-remove ?disabled=${busy} aria-label=${t("Remove {name}", { name: slot })} title=${t("Remove")} @click=${(e: Event) => keepRowFocus(e, this, REMOVE_FOCUS, () => this._setSlot(slot, ""))}>
                    ${icon("mdi:close", "×")}
                  </button>
                </li>`;
              })}
            </ul>
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "jarvis-editor-doors": JarvisEditorDoors;
  }
}
