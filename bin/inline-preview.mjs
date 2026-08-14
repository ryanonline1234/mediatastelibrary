#!/usr/bin/env node
// Build a single-file copy of the site with CSS and JS inlined.
// Used only for visual verification in preview surfaces that cannot fetch
// sibling assets; the shipped build keeps them as separate files, because
// this family's whole argument is that the page's construction stays
// inspectable.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const D = path.join(ROOT, 'dist')
const html = fs.readFileSync(path.join(D, 'index.html'), 'utf8')
const css = fs.readFileSync(path.join(D, 'styles.css'), 'utf8')
const js = fs.readFileSync(path.join(D, 'app.js'), 'utf8')

const out = html
  .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script src="app.js" defer></script>', `<script>\n${js}\n</script>`)

const target = path.join(ROOT, 'preview.html')
fs.writeFileSync(target, out)
console.log(`${target}  ${(out.length / 1024).toFixed(0)}KB`)
