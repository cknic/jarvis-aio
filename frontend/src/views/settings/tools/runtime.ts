/**
 * Settings tools group B (settings-tools.md §4.13–4.18 + the Wellbeing
 * pointer): the runtime tool cards. Importing this module defines the
 * elements and registers them with the Settings view's registry
 * (./README.md "Tool cards"); it is imported once from ./index.ts.
 */
import { registerToolCard } from "../registry";
import "./runtime-briefing";
import "./runtime-diagnostics";
import "./runtime-voice-confirm";
import "./runtime-energy";
import "./runtime-hazard";
import "./runtime-mutes";
import "./runtime-wellbeing";

// General
registerToolCard("core", {
  id: "briefing",
  title: "Briefings",
  element: "jarvis-tool-briefing",
  icon: "mdi:weather-sunset-up",
  keywords: ["brief me now", "morning", "evening", "announce"],
});
registerToolCard("core", {
  id: "diagnostics",
  title: "Diagnostics",
  element: "jarvis-tool-diagnostics",
  icon: "mdi:stethoscope",
  keywords: ["test", "tts", "notify", "observer", "routing", "doorbell", "analyze camera"],
});

// Voice & Audio
registerToolCard("voice", {
  id: "voice-confirm-test",
  title: "Voice Confirmation",
  element: "jarvis-tool-voice-confirm-test",
  icon: "mdi:microphone-question",
  keywords: ["satellite", "announce", "native", "gated", "test"],
});

// Safety & Energy
registerToolCard("safety", {
  id: "energy",
  title: "Energy Management",
  element: "jarvis-tool-energy",
  icon: "mdi:flash-outline",
  keywords: ["power", "watts", "agency", "peak", "meter"],
});
registerToolCard("safety", {
  id: "hazard",
  title: "Hazard Monitor",
  element: "jarvis-tool-hazard",
  icon: "mdi:earth",
  keywords: ["earthquake", "weather", "disaster", "scan", "usgs", "nws"],
});
registerToolCard("safety", {
  id: "mutes",
  title: "Muted Announcements",
  element: "jarvis-tool-mutes",
  icon: "mdi:volume-mute",
  keywords: ["shush", "mute", "unmute", "silence"],
});

// Home & Extras
registerToolCard("home", {
  id: "wellbeing",
  title: "Wellbeing Context",
  element: "jarvis-tool-wellbeing",
  icon: "mdi:heart-pulse",
  keywords: ["biometrics", "wearable", "people"],
});
