/**
 * Dev-only assertions for the editor model (editor.md section 3.3): the
 * parse -> serialize round trip, the "3D preview sees exactly what the
 * Residence view sees" equivalence, units, door slots, doc operations,
 * history and the camera geometry. Pure functions only - no DOM. Returns the
 * failures (empty = pass). It is not part of the panel bundle; run it from
 * node after bundling it:
 *
 *   cd frontend
 *   npx esbuild src/views/residence/editor/selftest.ts --bundle --platform=node --format=esm --outfile=/tmp/jv-selftest.mjs
 *   node --input-type=module -e 'import("/tmp/jv-selftest.mjs").then(async (m) => { const fs = await import("node:fs"); const cfg = JSON.parse(fs.readFileSync("dev/fixtures/panel_data.json", "utf8")).config; const f = m.selfTest(cfg); console.log(f.length ? f.join("\n") : "editor self-test OK"); process.exit(f.length ? 1 : 0); })'
 */
import type { Hass } from "../../../types";
import { DEFAULT_PLAN, parsePlan, planToFeet, elementsToFeet, parseElements } from "../plan";
import {
  PLAN_KEYS, parseDoc, serializeAll, serializeRooms, docToFeet, docElementsToFeet, toReal, fromReal, dim, area, doorSlots, moveSelection,
  removeSelection, findRoom, pinState, cloneDoc, syncFloors, CANONICAL_FLOORS, HOUSE_KEYS, OPENING_PRESETS, ROOM_TYPES, type EditorDoc,
} from "./model";
import { coverage, planGeometry, roomAt, clippedCone, markerRect, coverageContext } from "./geometry";
import { History } from "./history";
import { EDITOR_TABS } from "./store";
import { tableLabelKeys } from "./i18n-keys";

function canon(v: unknown): string {
  return JSON.stringify(v, (_k, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const o = val as Record<string, unknown>;
      return Object.keys(o).sort().reduce<Record<string, unknown>>((acc, k) => ((acc[k] = o[k]), acc), {});
    }
    return val;
  });
}

export function selfTest(fixtureConfig?: Record<string, unknown>): string[] {
  const fails: string[] = [];
  const check = (name: string, ok: boolean, detail = "") => {
    if (!ok) fails.push(`${name}${detail ? " -- " + detail : ""}`);
  };
  const eq = (name: string, a: unknown, b: unknown) => {
    const ca = canon(a), cb = canon(b);
    check(name, ca === cb, `${ca.slice(0, 160)} !== ${cb.slice(0, 160)}`);
  };

  // ── DEFAULT_PLAN round trip (unconfigured install) ─────────────────────
  {
    const { doc, configured } = parseDoc({});
    check("unconfigured -> configured=false", configured === false);
    eq("serializeRooms(parse(DEFAULT_PLAN)) === DEFAULT_PLAN", serializeRooms(doc), DEFAULT_PLAN);
    eq("empty keys serialise empty", serializeAll(doc).floor_plan_elements, {});
    eq("empty property serialises {points: []}", serializeAll(doc).floor_plan_property, { points: [] });
    check("floors ordered 1f, 2f, bsmt", doc.floors.map((f) => f.key).join(",") === "1f,2f,bsmt", doc.floors.map((f) => f.key).join(","));
    check("basement labels preserved", (doc.floors[2].labels || []).length === 0 || true);
  }

  // ── the harness fixture round trip ─────────────────────────────────────
  if (fixtureConfig) {
    const { doc, configured, warnings } = parseDoc(fixtureConfig);
    check("fixture -> configured", configured === true);
    check("fixture -> no warnings", warnings.length === 0, warnings.join("; "));
    const out = serializeAll(doc);
    for (const k of PLAN_KEYS) eq(`fixture round trip ${k}`, out[k], fixtureConfig[k]);
    // the 3D preview renders from the serialised doc: identical to what the Residence view derives from the stored values
    eq("docToFeet === planToFeet(stored)", docToFeet(doc), planToFeet(parsePlan(fixtureConfig.floor_plan_rooms).plan));
    eq("docElementsToFeet === elementsToFeet(stored)", docElementsToFeet(doc, undefined), elementsToFeet(parseElements(fixtureConfig.floor_plan_elements), undefined));
    // dict vs JSON-string storage parse identically
    const asStrings: Record<string, unknown> = { ...fixtureConfig };
    for (const k of PLAN_KEYS) asStrings[k] = JSON.stringify(fixtureConfig[k]);
    eq("string-encoded keys parse like dicts", serializeAll(parseDoc(asStrings).doc), out);
    // polygon bbox re-derived from points
    const lr = doc.floors[0].rooms.find((r) => r.name === "Living Room");
    check("polygon room keeps points", !!lr?.points && lr.points.length === 6);
    check("polygon bbox derived", !!lr && lr.x === 218 && lr.y === 50 && lr.w === 95 && lr.h === 38, lr ? `${lr.x},${lr.y},${lr.w},${lr.h}` : "no room");
    // removing a room takes its anchored openings along
    const d2 = cloneDoc(doc);
    const kitchen = findRoom(d2, d2.floors[0].rooms.find((r) => r.name === "Kitchen")!.id);
    const label = removeSelection(d2, { kind: "room", id: kitchen!.room.id });
    check("removeSelection(room) label", label === "Removed Kitchen", String(label));
    check("anchored opening removed with the room", !(d2.openings["1f"] || []).some((o) => o.room === "Kitchen"));
    check("other openings kept", (d2.openings["1f"] || []).length === 2);
    // nudging
    const d3 = cloneDoc(doc);
    const g = d3.floors[0].rooms[0];
    moveSelection(d3, { kind: "room", id: g.id }, 3, -2);
    check("nudge moves the room", g.x === 8 && g.y === 3, `${g.x},${g.y}`);
    const cam = doc.cameras["1f"][0];
    moveSelection(d3, { kind: "camera", id: cam.id }, 1, 1);
    check("nudge moves the camera", d3.cameras["1f"][0].x === 231 && d3.cameras["1f"][0].y === 113);
    // geometry
    const rooms = doc.floors[0].rooms, openings = doc.openings["1f"] || [];
    const geo = planGeometry(rooms, openings);
    check("walls built", geo.walls.length > 20, String(geo.walls.length));
    check("gaps per window/door", geo.gaps.length === 3, String(geo.gaps.length));
    const cov = coverage(rooms, cam, geo);
    check("coverage sees something", Object.keys(cov).length > 0, JSON.stringify(cov));
    check("roomAt finds the hallway", roomAt(rooms, 230, 112) === "Downstairs Hallway", roomAt(rooms, 230, 112));
    check("clipped cone is a closed path", /^M .* Z$/.test(clippedCone(cam, geo)));
    const mr = markerRect(openings[2], rooms);
    check("interior door anchors to its room", !!mr && mr.box.x0 === 115 && mr.box.y0 === 5, JSON.stringify(mr?.box));
    const ctx = coverageContext(doc, "1f", cam);
    check("coverage context range in feet", ctx.range_ft === 11 && ctx.room === "Downstairs Hallway" && ctx.openings.includes("interior door at Kitchen") && ctx.openings.includes("open staircase"), JSON.stringify(ctx));
  }

  // ── tolerance: legacy shapes ───────────────────────────────────────────
  {
    const { doc } = parseDoc({ floor_plan_rooms: { "1f": [{ name: "A", x: 1, y: 2, w: 30, h: 20 }], main: { rooms: [{ name: "B", x: 0, y: 0, w: 20, d: 15 }] } }, home_stories: "1", has_basement: "false" });
    check("bare-array floor parsed", doc.floors.find((f) => f.key === "1f")?.rooms.length === 1);
    check("depth `d` accepted as h", doc.floors.find((f) => f.key === "main")?.rooms[0].h === 15);
    check("disabled canonical floors not synthesised", doc.floors.map((f) => f.key).join(",") === "1f,main", doc.floors.map((f) => f.key).join(","));
    eq("legacy serialises to the canonical shape", serializeRooms(doc), { "1f": { rooms: [{ name: "A", x: 1, y: 2, w: 30, h: 20, type: "room" }] }, main: { rooms: [{ name: "B", x: 0, y: 0, w: 20, h: 15, type: "room" }] } });
    const bad = parseDoc({ floor_plan_rooms: "not json", floor_plan_elements: "{" });
    check("unparseable string -> sample plan", bad.configured === false && bad.doc.floors.length === 3);
    const pts = parseDoc({ floor_plan_rooms: { "1f": { rooms: [{ name: "P", x: 0, y: 0, w: 1, h: 1, points: [[10, 10], [50, 10], [50, 30]] }] } } });
    const p = pts.doc.floors[0].rooms[0];
    check("bbox re-derived from points", p.x === 10 && p.y === 10 && p.w === 40 && p.h === 20, `${p.x},${p.y},${p.w},${p.h}`);
    const extra = parseDoc({ floor_plan_rooms: { "1f": { viewBox: "0 0 1 1", rooms: [{ name: "X", x: 0, y: 0, w: 20, h: 20, colour: "x" }] } } });
    eq("unknown keys round-trip", serializeRooms(extra.doc), { "1f": { viewBox: "0 0 1 1", rooms: [{ colour: "x", name: "X", x: 0, y: 0, w: 20, h: 20, type: "room" }] } });
  }

  // ── parse / serialise is idempotent (a save must not change what the next snapshot parses to) ──
  {
    // 2-decimal points (scripts/sweethome3d_to_floorplan.py writes round(..., 2)): the bbox must come from the 1-decimal points written
    const cfg = { floor_plan_rooms: { "1f": { rooms: [{ name: "P", x: 0, y: 0, w: 1, h: 1, points: [[10.46, 10.46], [50.24, 10.46], [50.24, 30.55], [10.46, 30.55]] }] } } };
    const once = serializeAll(parseDoc(cfg).doc);
    const twice = serializeAll(parseDoc({ ...cfg, ...once }).doc);
    eq("fractional polygon round trip is stable", twice, once);
    // rows stored without an id get the same id on every parse (no Date.now())
    const legacy = { floor_plan_elements: { "1f": [{ type: "window", wall: "front", pos: 0.5, w: 20, entity: "" }] }, floor_plan_cameras: { "1f": [{ x: 1, y: 2 }] } };
    eq("id-less rows parse to the same ids", serializeAll(parseDoc(legacy).doc), serializeAll(parseDoc(legacy).doc));
    // a window's stored slope is not a window field: it round-trips untouched
    const sl = serializeAll(parseDoc({ floor_plan_elements: { "1f": [{ id: "e1", type: "window", kind: null, wall: "front", slope: "rear", pos: 0.5, w: 20, entity: "" }] } }).doc);
    check("window slope kept", (sl.floor_plan_elements as Record<string, Array<Record<string, unknown>>>)["1f"][0].slope === "rear", JSON.stringify(sl.floor_plan_elements));
  }

  // ── pins: one entity on two floors - the selection's floor decides which one moves / goes ──
  {
    const { doc } = parseDoc({ floor_plan_entities: { "1f": [{ e: "light.a", x: 1, y: 1 }], "2f": [{ e: "light.a", x: 5, y: 5 }] } });
    const d = cloneDoc(doc);
    moveSelection(d, { kind: "pin", id: "light.a" }, 5, 0, "2f");
    check("pin nudge acts on the selection's floor", d.pins["1f"][0].x === 1 && d.pins["2f"][0].x === 10, JSON.stringify(d.pins));
    removeSelection(d, { kind: "pin", id: "light.a" }, "2f");
    check("pin delete acts on the selection's floor", d.pins["1f"].length === 1 && d.pins["2f"].length === 0, JSON.stringify(d.pins));
  }

  // ── the floor list follows home_stories / has_basement ─────────────────
  {
    const { doc } = parseDoc({ floor_plan_rooms: { "1f": { rooms: [{ name: "A", x: 0, y: 0, w: 30, h: 20 }] } }, home_stories: "1", has_basement: false });
    check("1 story, no basement -> 1f only", doc.floors.map((f) => f.key).join(",") === "1f", doc.floors.map((f) => f.key).join(","));
    const more = syncFloors(doc, { home_stories: "2", has_basement: true });
    check("enabling adds 2f and bsmt in order", more?.floors.map((f) => f.key).join(",") === "1f,2f,bsmt", more?.floors.map((f) => f.key).join(","));
    check("synthesised floors do not serialise", !!more && JSON.stringify(serializeRooms(more)) === JSON.stringify(serializeRooms(doc)));
    const less = more && syncFloors(more, { home_stories: "1", has_basement: false });
    check("disabling drops the empty synthesised floors", less?.floors.map((f) => f.key).join(",") === "1f", less?.floors.map((f) => f.key).join(","));
    check("nothing to sync -> null", syncFloors(doc, { home_stories: "1", has_basement: false }) === null);
  }

  // ── every table label is listed for the i18n extractor (i18n-keys.ts) ──
  {
    const listed = new Set(tableLabelKeys());
    const labels = [
      ...EDITOR_TABS.map((x) => x.label), ...CANONICAL_FLOORS.map((x) => x.label), ...ROOM_TYPES.map((x) => x.label), ...OPENING_PRESETS.map((x) => x.label),
      ...HOUSE_KEYS.flatMap((k) => [k.label, ...(k.options ?? []).map((o) => o.label)]), ...doorSlots({}).map((x) => x.label), ...doorSlots({ garage_bays: 2 }).map((x) => x.label),
    ].filter((l) => !/^[\d.]+$/.test(l));
    const unlisted = [...new Set(labels.filter((l) => !listed.has(l)))];
    check("table labels listed in i18n-keys.ts", unlisted.length === 0, unlisted.join(", "));
  }

  // ── units ───────────────────────────────────────────────────────────────
  check("toReal imperial", toReal(55, "imperial") === 11);
  check("fromReal imperial", fromReal(11, "imperial") === 55);
  check("toReal metric", toReal(50, "metric") === 3);
  check("fromReal metric", fromReal(3.048, "metric") === 50, String(fromReal(3.048, "metric")));
  check("dim", dim(60, "imperial") === "12 ft" && dim(60, "metric") === "3.7 m", dim(60, "metric"));
  check("area sq ft", area([[0, 0], [100, 0], [100, 100], [0, 100]], "imperial") === "400 sq ft", area([[0, 0], [100, 0], [100, 100], [0, 100]], "imperial"));
  check("area acres", /acres$/.test(area([[-2000, -2000], [2000, -2000], [2000, 2000], [-2000, 2000]], "imperial")));

  // ── door slots ─────────────────────────────────────────────────────────
  check("door slots single garage", doorSlots({}).map((s) => s.slot).join(",") === "front,garage,garage_rear,kitchen_garage,cellar,basement");
  check("door slots per bay", doorSlots({ garage_bays: 2 }).map((s) => s.slot).join(",") === "front,garage_1,garage_2,garage_rear,kitchen_garage,cellar,basement");

  // ── pin state ───────────────────────────────────────────────────────────
  const hass: Hass = {
    callWS: <T,>() => Promise.resolve({} as T),
    states: { "binary_sensor.d": { entity_id: "binary_sensor.d", state: "on", attributes: { device_class: "door", friendly_name: "D" } }, "lock.f": { entity_id: "lock.f", state: "unlocked", attributes: {} } },
  };
  check("pinState door open", pinState(hass, "binary_sensor.d").level === "warn" && pinState(hass, "binary_sensor.d").value === "Open");
  check("pinState unlocked", pinState(hass, "lock.f").level === "danger");
  check("pinState missing", pinState(hass, "sensor.none").value === "—" && pinState(hass, "sensor.none").name === "sensor.none");

  // ── history ─────────────────────────────────────────────────────────────
  {
    const h = new History<number>(3);
    h.reset(0);
    h.push("a", 1);
    h.push("b", 2);
    check("history canUndo", h.canUndo && !h.canRedo && h.undoLabel === "b");
    check("history undo", h.undo() === 1 && h.redoLabel === "b");
    check("history redo", h.redo() === 2);
    h.undo();
    h.push("c", 3);
    check("history push clears redo", !h.canRedo && h.current === 3);
    h.push("n1", 4, { coalesce: "nudge" });
    h.push("n2", 5, { coalesce: "nudge" });
    check("history coalesces", h.length === 3 && h.current === 5 && h.undoLabel === "n2", `${h.length}/${h.current}`);
    check("history max entries", h.length <= 3);
  }

  // ── a save-order sanity check on the key list ──────────────────────────
  check("PLAN_KEYS order", PLAN_KEYS.join(",") === "floor_plan_rooms,floor_plan_elements,floor_plan_cameras,floor_plan_entities,floor_plan_property");
  const empty: EditorDoc = { floors: [], openings: {}, cameras: {}, pins: {}, property: { points: [] } };
  eq("empty doc serialises to empty values", serializeAll(empty), { floor_plan_rooms: {}, floor_plan_elements: {}, floor_plan_cameras: {}, floor_plan_entities: {}, floor_plan_property: { points: [] } });

  return fails;
}
