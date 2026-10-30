/**
 * Settings tools: one import per plug-in module (each registers its field
 * editors / tool cards on import; see ../README.md). settings.ts imports this
 * module once in its "plug-ins" block: `import "./settings/tools";`.
 */
// group A
import "./models";
import "./lists";
import "./pairings";
import "./appliances";
import "./voice-confirm-list";
import "./biometrics-map";

// tools group B (runtime cards + governance)
import "./runtime";
import "./governance";
