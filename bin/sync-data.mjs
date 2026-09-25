#!/usr/bin/env node
// Refresh data/ from the taste-library, so no figure or family line on the
// page is a stale hand-made copy.
//
//   node bin/sync-data.mjs [path/to/taste-library]     (default ~/taste-library)
//
// - data/provenance.json  <- taste-library/skill/data/provenance.json (verbatim)
// - data/families.json    <- the existing member lists (slug, award, links,
//   palette) with each member's status re-read from its card, and every family
//   text field replaced from taste-library/p4/merged-families.json — the same
//   merged data the awwwards-taste skill is compiled from.
// Run it after every `bin/build-skill.sh` in the library, then `node build.mjs`.

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const ROOT = path.resolve(import.meta.dirname, '..')
const LIB = path.resolve(process.argv[2] || path.join(os.homedir(), 'taste-library'))
const fatal = m => { console.error(`FATAL: ${m}`); process.exit(1) }
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'))

const prov = readJSON(path.join(LIB, 'skill/data/provenance.json'))
const merged = Object.fromEntries(readJSON(path.join(LIB, 'p4/merged-families.json')).map(f => [f.name, f]))
const tax = readJSON(path.join(LIB, 'p2/taxonomy-final.json'))
const current = readJSON(path.join(ROOT, 'data/families.json'))

const cardStatus = slug => {
  const p = path.join(LIB, 'cards', `${slug}.md`)
  if (!fs.existsSync(p)) fatal(`no card for member ${slug}`)
  const fm = fs.readFileSync(p, 'utf8').split('---', 3)[1] || ''
  const ls = (fm.match(/^live_status:\s*(\w+)/m) || [])[1]
  if (!ls) fatal(`card ${slug} has no live_status`)
  return ls === 'alive' ? 'alive' : 'dead'
}

// the page shows the taxonomy's families (the sweep), not the hand-picked anchor
const names = new Set(tax.families.map(f => f.name))
const byName = Object.fromEntries(current.map(f => [f.name, f]))
const missing = [...names].filter(n => !byName[n] || !merged[n])
if (missing.length) fatal(`families missing from data/families.json or the library export: ${missing.join(', ')}`)

const changes = []
const out = current.filter(f => names.has(f.name)).map(f => {
  const m = merged[f.name]
  const next = {
    ...f,
    thesis: m.thesis, temperature: m.temperature, type: m.type, motion: m.motion,
    for: m.for, not_for: m.not_for, axis: m.axis, vocabulary: m.vocabulary,
    members: f.members.map(mem => ({ ...mem, status: cardStatus(mem.slug) })),
  }
  for (const k of ['thesis', 'temperature', 'type', 'motion', 'for', 'not_for', 'axis']) if (f[k] !== next[k]) changes.push(`${f.name}.${k}`)
  for (const [a, b] of f.members.map((x, i) => [x, next.members[i]])) if (a.status !== b.status) changes.push(`${f.name}: ${a.slug} ${a.status} -> ${b.status}`)
  return next
})
const total = out.reduce((n, f) => n + f.members.length, 0)
const dead = out.reduce((n, f) => n + f.members.filter(m => m.status !== 'alive').length, 0)
if (total !== prov.cards.total || dead !== prov.cards.dead) fatal(`members ${total} / offline ${dead} disagree with provenance ${prov.cards.total} / ${prov.cards.dead}`)

fs.writeFileSync(path.join(ROOT, 'data/provenance.json'), JSON.stringify(prov, null, 1) + '\n')
fs.writeFileSync(path.join(ROOT, 'data/families.json'), JSON.stringify(out, null, 1) + '\n')
console.log(`synced from ${LIB}: ${out.length} families, ${total} members (${dead} offline), ${changes.length} changes`)
for (const c of changes) console.log('  ' + c)
