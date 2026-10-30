/**
 * The sub-tab elements of the floor-plan editor. Each Build agent adds ONE
 * import here so its element lands in the bundle (editor.ts imports this
 * barrel and renders the element by tag name, see ../README.md):
 *
 *   import "./rooms";      // <jarvis-editor-rooms>     Rooms (+ property line, house keys)
 *   import "./openings";   // <jarvis-editor-openings>  Openings
 *   import "./doors";      // <jarvis-editor-doors>     Doors (door_mapping)
 *   import "./pins";       // <jarvis-editor-pins>      Cameras & pins
 *   import "./import";     // <jarvis-editor-import>    Import / background / export
 *
 * Until a module exists the editor shows a placeholder for that tab.
 */
import "./rooms";
import "./openings";
import "./doors";
import "./pins";
import "./import";
export {};
