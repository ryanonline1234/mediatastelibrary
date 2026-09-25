#!/bin/bash
# Full motion QA gate for both pages. Run from the repo root with dist/ served:
#   python3 -m http.server 8811 --bind 127.0.0.1 --directory dist
#
#   ./verify.sh [base-url]
#
# ORDER IS LOAD-BEARING: build.mjs EMBEDS the scene ranges that sync-spec.mjs
# measures, so both syncs must be followed by a rebuild, or the page runs the
# previous ranges while the assertions use the new ones.
#   build → sync (both pages) → REBUILD → share image → capture → assert → jank
set -e
BASE="${1:-http://127.0.0.1:8811/}"
S=~/.claude/skills/awwwards-motion/scripts

echo "── build ────────────────────────────────────────────"
node build.mjs

echo; echo "── sync specs from the built pages ──────────────────"
node bin/sync-spec.mjs "$BASE" scroll-spec.json
node bin/sync-spec.mjs "${BASE}families.html" scroll-spec.families.json

echo; echo "── rebuild so the pages run the measured ranges ─────"
node build.mjs >/dev/null

echo; echo "── share image ──────────────────────────────────────"
node bin/og.mjs "$BASE"

for pair in "index|$BASE|scroll-spec.json|samples.json" "families|${BASE}families.html|scroll-spec.families.json|samples.families.json"; do
  IFS='|' read -r name url spec out <<< "$pair"
  echo; echo "── $name: capture ─────────────────────────────────"
  node "$S/capture_motion.mjs" sample "$url" --spec "$spec" --out "$out" 2>&1 | grep -vE 'hint' | tail -2
  echo "── $name: assert (measured vs intended) ───────────"
  node "$S/assert_scroll_spec.mjs" "$spec" "$out" | tail -2
  echo "── $name: jank ────────────────────────────────────"
  node "$S/capture_motion.mjs" jank "$url" 2>&1 | grep -E 'budget|dropped|PASS|FAIL'
  echo "── $name: reduced-motion floor ────────────────────"
  node "$S/capture_motion.mjs" jank "$url" --reduced-motion 2>&1 | grep -E 'dropped|PASS|FAIL'
done
