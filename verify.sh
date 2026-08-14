#!/bin/bash
# Full motion QA gate. Run from the repo root with the dev server up.
#
#   ./verify.sh [url]
#
# ORDER IS LOAD-BEARING and was itself a bug once: build.mjs EMBEDS the scene
# ranges that sync-spec.mjs measures, so a sync must be followed by a rebuild
# or the page runs the previous ranges while the assertions use the new ones.
#   build → sync (measure) → REBUILD (embed) → capture → assert → jank
set -e
URL="${1:-http://127.0.0.1:8811/}"
S=~/.claude/skills/awwwards-motion/scripts

echo "── build ────────────────────────────────────────────"
node build.mjs

echo; echo "── sync spec from the built page ────────────────────"
node bin/sync-spec.mjs "$URL"

echo; echo "── rebuild so the page runs the measured ranges ─────"
node build.mjs >/dev/null

echo; echo "── capture ──────────────────────────────────────────"
node "$S/capture_motion.mjs" sample "$URL" --spec scroll-spec.json --out samples.json 2>&1 | grep -vE 'hint' | tail -3

echo; echo "── assert (measured vs intended) ────────────────────"
node "$S/assert_scroll_spec.mjs" scroll-spec.json samples.json | tail -3

echo; echo "── jank ─────────────────────────────────────────────"
node "$S/capture_motion.mjs" jank "$URL" 2>&1 | grep -E 'budget|dropped|PASS|FAIL'

echo; echo "── reduced-motion floor (must PASS and load no libs) ─"
node "$S/capture_motion.mjs" jank "$URL" --reduced-motion 2>&1 | grep -E 'dropped|PASS|FAIL'
