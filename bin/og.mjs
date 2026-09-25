#!/usr/bin/env node
// Capture the share image from the BUILT page: the hero at 1200x630 with the
// grid overlay on and the count at its final value (reduced-motion context, so
// nothing is mid-animation). Writes dist/og.png, referenced by og:image.
//
//   node bin/og.mjs [url]      (run by verify.sh after the final build)

import path from 'node:path'
import { chromium } from '/Users/ryantseng/.claude/skills/awwwards-motion/scripts/node_modules/playwright/index.mjs'

const URL = process.argv[2] || 'http://127.0.0.1:8811/'
const OUT = path.resolve(import.meta.dirname, '..', 'dist', 'og.png')
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' })).newPage()
await page.goto(URL, { waitUntil: 'networkidle' })
await page.click('[data-grid-toggle]')
await page.evaluate(() => { try { localStorage.removeItem('mtl:grid') } catch (e) {} })
await page.waitForTimeout(300)
await page.screenshot({ path: OUT })
await browser.close()
console.log(`og image -> ${OUT}`)
