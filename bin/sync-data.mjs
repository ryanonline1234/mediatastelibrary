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
import { pickEase } from '../src/ease.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const LIB = path.resolve(process.argv[2] || path.join(os.homedir(), 'taste-library'))
const fatal = m => { console.error(`FATAL: ${m}`); process.exit(1) }
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'))

const prov = readJSON(path.join(LIB, 'skill/data/provenance.json'))
const additions = (name) => readJSON(path.join(LIB, 'p4/family-additions', `${name}.json`))
const records = (name) => readJSON(path.join(LIB, 'p4/prior-records', `${name}.json`)).records
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
  const a = additions(f.name)
  const disputed = new Set(tax.families.find(t => t.name === f.name)?.disputed || [])
  const ease = pickEase(records(f.name))
  const next = {
    ...f,
    thesis: m.thesis, temperature: m.temperature, type: m.type, motion: m.motion,
    for: m.for, not_for: m.not_for, axis: m.axis, vocabulary: m.vocabulary,
    // 2026-09-24 sidecar fields (verified pass in the library)
    signature_move: a.signature_move, sequencing: a.sequencing, nearest: a.nearest || '',
    requires: a.requires, motion_budget: a.motion_budget,
    records: records(f.name).length,
    // how many easing records exist at all — "no easing record" is only true when 0
    easeRecords: records(f.name).filter(r => r.role === 'easing').length,
    // the one drawn: the best-ranked parseable easing record (not "the house
    // ease" — most records are single uses), with what it drove and its provenance
    ease: ease ? (() => { const r = records(f.name).find(x => x.id === ease.id); return { id: ease.id, value: ease.value, label: ease.ease.label, kind: ease.ease.kind, applies_to: r.applies_to, provenance: r.provenance } })() : null,
    members: f.members.map(mem => ({ ...mem, status: cardStatus(mem.slug), disputed: disputed.has(mem.slug) })),
  }
  for (const k of ['thesis', 'temperature', 'type', 'motion', 'for', 'not_for', 'axis']) if (f[k] !== next[k]) changes.push(`${f.name}.${k}`)
  for (const [a, b] of f.members.map((x, i) => [x, next.members[i]])) if (a.status !== b.status) changes.push(`${f.name}: ${a.slug} ${a.status} -> ${b.status}`)
  return next
})
const total = out.reduce((n, f) => n + f.members.length, 0)
const dead = out.reduce((n, f) => n + f.members.filter(m => m.status !== 'alive').length, 0)
if (total !== prov.cards.total || dead !== prov.cards.dead) fatal(`members ${total} / offline ${dead} disagree with provenance ${prov.cards.total} / ${prov.cards.dead}`)

// ------------------------------------------------ the blind test (chapter 03)
// Generated from the library's own eval record, never typed: evals/subjects.json
// carries each subject's baseline file and a dated history of runs. The pages
// themselves (all built by this project) are copied so the chapter can show
// them and open them.
const subjects = readJSON(path.join(LIB, 'evals/subjects.json')).subjects.filter(s => s.kind === 'comparative')
const EVAL_DIR = path.join(ROOT, 'media-src/evals')
fs.mkdirSync(EVAL_DIR, { recursive: true })
const evals = subjects.map(s => {
  const copy = (rel, as) => { fs.copyFileSync(path.join(LIB, rel), path.join(EVAL_DIR, `${as}.html`)); return `${as}` }
  const runs = s.history.map((h, i) => {
    const v = `v${i + 1}`
    const judges = h.judges || 1
    const skill = h.mean_with_skill ?? h.score_with_skill, base = h.mean_baseline ?? h.score_baseline
    const winsSkill = h.skill_wins ?? (h.winner === 'with-skill' ? 1 : 0)
    const winsBase = h.baseline_wins ?? (h.winner === 'baseline' ? 1 : 0)
    return { run: h.run, variant: v, page: copy(h.with_skill, `${s.id}-${v}`), family: h.family || null,
      judges, score_skill: skill, score_baseline: base, skill_wins: winsSkill, baseline_wins: winsBase,
      margin: h.margin || h.note || '' }
  })
  return { id: s.id, brief: s.brief, baseline: copy(s.baseline, `${s.id}-baseline`), runs }
})
fs.writeFileSync(path.join(ROOT, 'data/evals.json'), JSON.stringify(evals, null, 1) + '\n')

fs.writeFileSync(path.join(ROOT, 'data/provenance.json'), JSON.stringify(prov, null, 1) + '\n')
fs.writeFileSync(path.join(ROOT, 'data/families.json'), JSON.stringify(out, null, 1) + '\n')
console.log(`synced from ${LIB}: ${out.length} families, ${total} members (${dead} offline), ${changes.length} changes`)
for (const c of changes) console.log('  ' + c)
