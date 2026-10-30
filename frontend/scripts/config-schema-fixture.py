#!/usr/bin/env python3
"""Regenerate dev/fixtures/config_schema.json from the backend catalogue.

The harness and the smoke test answer `jarvis/config_schema` from that file,
so the Settings view in the harness shows exactly the fields the real backend
would send. Values are the catalogue defaults (a fresh install), except the
few keys in DEMO_VALUES below: the harness and the smoke test exercise the
model picker, the voice-confirm entity list, the biometrics map and the
appliance editor against them, so they are set here (never by hand in the
JSON) and survive regeneration.

`config_apply` imports Home Assistant, so run this with a Python that has it
installed (the integration-test environment), from the repo root:

    python frontend/scripts/config-schema-fixture.py
"""
from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from custom_components.jarvis import config_apply, websocket  # noqa: E402

# Non-default demo values (key -> value). Each key must be panel-writable.
DEMO_VALUES = {
    "model": "llama3-70b-8192",
    "voice_confirm_entities": ["light.living_room", "!camera.front_door"],
    "biometric_entities": {"heart_rate": "sensor.watch_heart_rate"},
    "appliance_profile": [
        {"name": "Washer", "type": "washer", "entity": "sensor.washer_power", "watts": 500},
        {"name": "Dryer", "type": "dryer", "entity": "", "watts": 2400},
    ],
}

schema = config_apply.build_schema(
    websocket.PANEL_WRITABLE_KEYS, lambda key, kind, default: default)
unknown = sorted(set(DEMO_VALUES) - set(schema["values"]))
if unknown:
    sys.exit(f"DEMO_VALUES keys not in the catalogue: {unknown}")
schema["values"].update(DEMO_VALUES)
out = ROOT / "frontend" / "dev" / "fixtures" / "config_schema.json"
out.write_text(json.dumps(schema, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"wrote {out.relative_to(ROOT)}: {len(schema['fields'])} fields, "
      f"categories {schema['categories']}")
