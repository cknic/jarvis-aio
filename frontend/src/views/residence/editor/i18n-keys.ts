/**
 * The English strings of the floor-plan editor's (and the Residence view's)
 * label tables: EDITOR_TABS, CANONICAL_FLOORS / FLOOR_LABELS, ROOM_TYPES /
 * ROOM_TYPE_LABEL, OPENING_PRESETS, HOUSE_KEYS (labels and options, STYLES
 * included), doorSlots(), WALL_LABELS, the 3D preview presets, the values
 * pinState() returns and the PlanFileError reasons.
 *
 * They reach the screen as t(label) - a computed key that `npm run i18n:keys`
 * reports as "indirect" and cannot resolve - so without this list the coverage
 * report counts them as done while no dictionary has them. The literal t()
 * calls below are what the extractor reads; the function is never called by
 * the panel and this module is not imported by the bundle. selftest.ts checks
 * that every label of the model's tables is listed here: add a key here when
 * you add a table row.
 */
import { t } from "../../../i18n";

export function tableLabelKeys(): string[] {
  return [
    // EDITOR_TABS (store.ts)
    t("Rooms"), t("Openings"), t("Doors"), t("Cameras & pins"), t("Import"),
    // CANONICAL_FLOORS (model.ts), FLOOR_LABELS (residence.ts)
    t("1st Floor"), t("2nd Floor"), t("Basement"), t("All"),
    // ROOM_TYPES (model.ts), ROOM_TYPE_LABEL (canvas.ts, tabs/rooms-layers.ts)
    t("Room"), t("Bathroom"), t("Stairs"), t("Door"), t("Outdoor zone"),
    // OPENING_PRESETS (model.ts) - also openingLabel()
    t("Window"), t("Interior Window"), t("Exterior Door"), t("Balcony Door"), t("Cellar Door"), t("Interior Door"), t("Cased Opening"), t("Front Dormer"), t("Rear Dormer"),
    // HOUSE_KEYS (model.ts)
    t("HOME STYLE"), t("Stories"), t("Has basement"), t("Front dormers"), t("Rear dormers"), t("Garage bays"), t("Chimney side"), t("Chimney count"),
    t("Basement entrance"), t("Bedrooms"), t("Bathrooms"), t("Square footage"),
    t("Right"), t("Left"), t("Center"), t("None"), t("Bulkhead"), t("Interior"),
    // STYLES (plan.ts) - residence_style options
    t("Cape Cod"), t("Colonial"), t("Dutch Colonial"), t("Ranch"), t("Two-Story"), t("Craftsman"), t("Modern"), t("Townhouse"), t("Apartment"), t("Cabin"),
    // doorSlots() (model.ts)
    t("Front Door"), t("Garage Door"), t("Garage Door {n}"), t("Garage Side / Rear"), t("Kitchen ↔ Garage"), t("Cellar / Bulkhead"),
    // WALL_LABELS (tabs/openings-doors-pins-shared.ts)
    t("Front"), t("Back"),
    // the 3D preview presets (editor.ts, residence.ts)
    t("FRONT"), t("RIGHT"), t("REAR"), t("LEFT"), t("ISO"),
    // pinState() values (model.ts)
    t("Open"), t("Closed"), t("Detected"), t("On"), t("Off"), t("Locked"), t("Unlocked"), t("At home"), t("Away"),
    // PlanFileError reasons (tabs/import-plan.ts)
    t("expected a JARVIS floor plan"),
  ];
}
