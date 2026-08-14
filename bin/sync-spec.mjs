#!/usr/bin/env node
// Re-derive the scroll spec's scene ranges and document height from the BUILT
// page, then rewrite scroll-spec.json.
//
//   node bin/sync-spec.mjs [url]
//
// WHY THIS EXISTS. The first spec was written with estimated ranges, and the
// runtime mapped scene-local progress against those same estimates — so the
// assertions passed while the bezier exhibit actually fired two sections
// early. Spec and code agreed with each other and both disagreed with the
// page. A contact-sheet still caught it; nothing else would have.
//
// The ranges must therefore be MEASURED, never typed. Run order is:
//   node build.mjs && node bin/sync-spec.mjs && <capture> && <assert>
// Any content or layout change shifts the ranges; this keeps the assertion
// file honest instead of quietly wrong.

import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '/Users/ryantseng/.claude/skills/awwwards-motion/scripts/node_modules/playwright/index.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const URL = process.argv[2] || 'http://127.0.0.1:8811/'
const SPEC = path.join(ROOT, 'scroll-spec.json')

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)   // let fonts settle and ScrollTrigger.refresh land

const measured = await page.evaluate(() => {
  const docH = document.documentElement.scrollHeight
  const max = docH - window.innerHeight
  const scenes = {}
  document.querySelectorAll('[data-scene]').forEach((s) => {
    const r = s.getBoundingClientRect()
    const top = r.top + window.scrollY
    scenes[s.dataset.scene] = [top / max, (top + r.height) / max]
  })
  return { docH, max, scenes }
})
await browser.close()

const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'))
const ids = spec.scenes.map((s) => s.id)
const missing = ids.filter((id) => !measured.scenes[id])
if (missing.length) { console.error(`FATAL: no [data-scene] on the page for: ${missing.join(', ')}`); process.exit(1) }

// Snap to a contiguous tiling: each scene starts where the previous ended, so
// the spec's full-coverage requirement holds and no gap can hide an effect.
const ordered = ids.map((id) => ({ id, r: measured.scenes[id] })).sort((a, b) => a.r[0] - b.r[0])
let cursor = 0
const ranges = {}
ordered.forEach((s, i) => {
  const to = i === ordered.length - 1 ? 1 : Math.min(1, Number(s.r[1].toFixed(4)))
  ranges[s.id] = [Number(cursor.toFixed(4)), to]
  cursor = to
})

for (const sc of spec.scenes) sc.range = { from: ranges[sc.id][0], to: ranges[sc.id][1] }
spec.scroll.totalHeightPx = measured.docH
spec.scroll.totalHeightTolerancePx = 400

// positions must contain every keyed point, or a key is silently checked
// against its nearest neighbour and the tolerance absorbs the error.
const keys = new Set([0, 0.3, 0.5, 0.7, 0.9, 1])
for (const [, [a, b]] of Object.entries(ranges)) {
  keys.add(Number(a.toFixed(4)))
  keys.add(Number(b.toFixed(4)))
  keys.add(Number((a + (b - a) / 2).toFixed(4)))
}
spec.positions = [...keys].sort((x, y) => x - y)

fs.writeFileSync(SPEC, JSON.stringify(spec, null, 2))
console.log(`doc ${measured.docH}px · maxScroll ${Math.round(measured.max)}px`)
for (const [id, r] of Object.entries(ranges)) console.log(`  ${id.padEnd(10)} ${r[0]} → ${r[1]}`)
console.log(`positions: ${spec.positions.length}`)
