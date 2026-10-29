#!/usr/bin/env bash
# Bump the JARVIS version everywhere it appears (HACS integration layout).
# Usage: ./scripts/bump_version.sh 6.3.3
set -euo pipefail

NEW="${1:-}"
if [[ -z "$NEW" ]]; then
  echo "Usage: $0 <new-version>   e.g. $0 6.3.3" >&2
  exit 1
fi
if ! [[ "$NEW" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Version must look like X.Y.Z (got '$NEW')" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMP="$ROOT/custom_components/jarvis"

# Current version from the integration manifest (source of truth).
OLD="$(python3 -c "import json;print(json.load(open('$COMP/manifest.json'))['version'])")"
if [[ "$OLD" == "$NEW" ]]; then
  echo "Already at $NEW — nothing to do."
  exit 0
fi
echo "Bumping $OLD → $NEW"

# Plain X.Y.Z in the manifest. The panel shows the version it gets from the
# jarvis/get_panel_data snapshot (panel_data.py reads manifest.json), so the
# manifest is the only place it lives. Never edit
# custom_components/jarvis/frontend/jarvis-panel.js by hand: it is the esbuild
# output of frontend/ (`cd frontend && npm run build`) and CI fails on a diff.
sed -i "s/\b${OLD//./\\.}\b/${NEW}/g" "$COMP/manifest.json"

echo "Updated:"
echo "  manifest.json   -> $(python3 -c "import json;print(json.load(open('$COMP/manifest.json'))['version'])")"
echo
echo "Next: review CHANGELOG.md, then  git commit -am 'Release v$NEW' && git tag $NEW && git push --tags"
echo "(Tags are X.Y.Z with no 'v' prefix. HACS publishes from the git tag/release — no add-on build.)"
