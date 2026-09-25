#!/usr/bin/env node
// Stills of the blind-test pages for chapter 03. Every page was built by this
// project (evals/ in the taste-library), so there is no third-party imagery.
// Captured at 1440x1080 (4:3) after the load animation settles, written as
// 960x720 JPEG to media-src/stills/. Re-run when data/evals.json changes.
//
//   node bin/eval-stills.mjs

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { chromium } from '/Users/ryantseng/.claude/skills/awwwards-motion/scripts/node_modules/playwright/index.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'media-src/evals'), OUT = path.join(ROOT, 'media-src/stills')
fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
for (const f of fs.readdirSync(SRC).filter(f => f.endsWith('.html'))) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1080 } })).newPage()
  await page.goto('file://' + path.join(SRC, f), { waitUntil: 'networkidle' })
  await page.waitForTimeout(3500)
  const png = path.join(OUT, f.replace('.html', '.png')), jpg = png.replace('.png', '.jpg')
  await page.screenshot({ path: png })
  execFileSync('sips', ['-Z', '960', '-s', 'format', 'jpeg', '-s', 'formatOptions', '78', png, '--out', jpg], { stdio: 'ignore' })
  fs.unlinkSync(png)
  console.log(`${path.basename(jpg)}  ${(fs.statSync(jpg).size / 1024).toFixed(0)}KB`)
  await page.close()
}
await browser.close()
