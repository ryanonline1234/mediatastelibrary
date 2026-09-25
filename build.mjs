#!/usr/bin/env node
// Static generator for mediatastelibrary.page — two pages:
//
//   dist/index.html     the argument, in chapters (DESIGN-CHAPTERS.md)
//   dist/families.html  the archive: 43 families for lookup
//
//   node build.mjs
//
// Design family: swiss-grid-lab (awwwards-taste). Its Sequencing line is this
// structure: "long scroll pages as chapters; teaching pages flip the whole
// ground to #010101, not a section; spreads pair spec tables with numbered
// notes". Taken at the LOAD-BEARING pole of its axis: the drawn grid is the
// real CSS Grid the page is laid out on.
//
// Every CURRENT figure comes from data/ (provenance.json, families.json,
// evals.json), generated from the taste-library by bin/sync-data.mjs. Figures
// quoted from the project's dated decision log are shown with their date.

import fs from 'node:fs'
import path from 'node:path'
import { MOTION, label } from './src/motion-config.mjs'
import { parseEase, samplePath, cssLinear } from './src/ease.mjs'

const ROOT = path.resolve(import.meta.dirname)
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'))
const P = read('provenance.json')
const FAMS = read('families.json')
const EVALS = read('evals.json')
const fatal = m => { console.error(`FATAL: ${m}`); process.exit(1) }

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const n = x => Number(x).toLocaleString('en-US')
const pad2 = i => String(i).padStart(2, '0')

// A spec label, rendered from the SAME object the runtime animates from.
const spec = (text, cite) => `<p class="mlabel"${cite ? ` title="${esc(cite)}"` : ''}>${esc(text)}</p>`

// Scene ranges are MEASURED from the built page by bin/sync-spec.mjs.
const scenesOf = file => {
  const p = path.join(ROOT, file)
  if (!fs.existsSync(p)) return {}
  return Object.fromEntries(JSON.parse(fs.readFileSync(p, 'utf8')).scenes.map(s => [s.id, [s.range.from, s.range.to]]))
}

// ------------------------------------------------------------ derived data
const awardYear = a => Number((a.match(/^(?:SOTY|SOTM)-(\d{4})/) || [])[1])
const siteYear = m => Math.min(...m.award.map(awardYear).filter(Boolean))
const members = FAMS.flatMap(f => f.members.map(m => ({ ...m, family: f.name })))
const awardRows = members.flatMap(m => m.award.filter(a => /^(SOTY|SOTM)-/.test(a)).map(a => ({ site: m.site || m.slug, year: awardYear(a), live: m.status === 'alive' })))
  .sort((a, b) => a.year - b.year || a.site.localeCompare(b.site))
if (awardRows.length !== P.award_rows_studied) fatal(`${awardRows.length} award rows in families.json vs ${P.award_rows_studied} in provenance`)
if (members.length !== P.cards.total) fatal(`${members.length} members vs ${P.cards.total} cards`)

const years = [...new Set(members.map(siteYear))].sort()
const byYear = years.map(y => {
  const ms = members.filter(m => siteYear(m) === y).sort((a, b) => (a.status === 'alive') - (b.status === 'alive') || (a.site || a.slug).localeCompare(b.site || b.slug))
  return { y, ms, off: ms.filter(m => m.status !== 'alive').length }
})

const judgeTotals = v => EVALS.reduce((acc, e) => {
  const r = e.runs.find(r => r.variant === v)
  if (r) { acc.skill += r.skill_wins; acc.judges += r.judges }
  return acc
}, { skill: 0, judges: 0 })
const J1 = judgeTotals('v1'), J2 = judgeTotals('v2')

// A family's own easing record → glyph geometry + CSS linear() for the rider.
const G = { w: 56, h: 32, pad: 4 }
const glyphOf = f => {
  const e = f.ease && parseEase(f.ease.value)
  if (!e) return null
  return { path: samplePath(e.fn, { w: G.w, h: G.h, pad: G.pad, n: 40 }), lin: cssLinear(e.fn, 32), id: f.ease.id, label: f.ease.label }
}

const LEVEL = { none: 'NONE', low: 'LOW', medium: 'MEDIUM', high: 'HIGH', 'very-high': 'VERY HIGH' }

// ---------------------------------------------------------- shared pieces
const head = ({ title, desc, canonical }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="color-scheme" content="light">
<link rel="canonical" href="https://mediatastelibrary.page/${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="https://mediatastelibrary.page/${canonical}">
<meta property="og:image" content="https://mediatastelibrary.page/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The Taste Library: the ${n(P.award_rows_studied)} count over its own 8-column grid.">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' fill='%23F1F1F1'/%3E%3Crect x='4' y='4' width='8' height='8' fill='%23010101'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap">
<!-- Hide load-animated elements until the motion layer starts, so they can't
     flash their finished state and then reset. Never gates content: skipped
     under reduced motion, and a 3s failsafe removes it if the CDN is slow. -->
<script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('mtl-wait');setTimeout(function(){document.documentElement.classList.remove('mtl-wait')},3000)}</script>
<link rel="stylesheet" href="styles.css">
</head>`

const chrome = (page) => `<a class="skip" href="#main">Skip to content</a>

<!-- The 8-column overlay is the family's signature move. Here it is the real
     CSS Grid the page is laid out on, not a picture of one. -->
<div class="grid-overlay" data-grid hidden aria-hidden="true">${Array.from({ length: 8 }, () => '<i></i>').join('')}</div>

<header class="top">
  <a class="top__mark" href="${page === 'index' ? '#main' : 'index.html'}">Taste&nbsp;Library</a>
  ${page === 'families'
    ? `<p class="top__pos"><a href="index.html">← The argument</a><span data-readout>00/${pad2(FAMS.length)} · index</span></p>`
    : `<p class="top__pos"><a href="families.html">The archive →</a></p>`}
  <button class="top__toggle" type="button" data-grid-toggle aria-pressed="false" aria-label="Grid overlay">
    <span class="lab" aria-hidden="true">Grid:</span>
    <span class="pill" aria-hidden="true"><span class="pill__lz"></span><span class="pill__tx">OFF</span></span>
  </button>
  ${page === 'families' ? '<div class="top__rail" data-motion="archive-rail" aria-hidden="true"><i></i></div>' : ''}
</header>`

const tail = (scenes) => `<script type="application/json" id="motion-config">${JSON.stringify({ ...MOTION, scenes, exhibit: EX })}</script>
<script src="app.js" type="module"></script>
</body>
</html>
`

// ------------------------------------------------------------ the exhibit
// Draws the ease the page RUNS: GSAP power3.out = 1-(1-t)^4 (quartic).
const EASE = t => 1 - Math.pow(1 - t, 4)
const EX = { x0: 40, x1: 360, y0: 200, y1: 40 }
const exPt = t => [EX.x0 + (EX.x1 - EX.x0) * t, EX.y0 - (EX.y0 - EX.y1) * EASE(t)]
const exPath = 'M' + Array.from({ length: 65 }, (_, i) => exPt(i / 64).map(v => v.toFixed(2)).join(' ')).join(' L')
const exMarks = [0, 0.25, 0.5, 0.75, 1].map(exPt)

// ------------------------------------------------------- family components
const glyphSvg = (g, cls = 'gl') => g
  ? `<span class="${cls}" style="--ease:${g.lin}"><svg viewBox="0 0 ${G.w} ${G.h}" width="${G.w}" height="${G.h}" focusable="false" aria-hidden="true"><path class="gl__axis" d="M${G.pad} ${G.h - G.pad} H${G.w - G.pad} M${G.pad} ${G.h - G.pad} V${G.pad}"/><path class="gl__curve" pathLength="1" d="${g.path}"/></svg><i class="gl__x"><i class="gl__y"></i></i></span>`
  : `<span class="${cls} ${cls.split(' ')[0]}--none" aria-hidden="true"><svg viewBox="0 0 ${G.w} ${G.h}" width="${G.w}" height="${G.h}" focusable="false"><path class="gl__axis" d="M${G.pad} ${G.h - G.pad} H${G.w - G.pad} M${G.pad} ${G.h - G.pad} V${G.pad}"/><path class="gl__nil" d="M${G.pad} ${G.h - G.pad} L${G.w - G.pad} ${G.pad}"/></svg></span>`

const indexRows = (hrefOf) => FAMS.map((f, i) => {
  const g = glyphOf(f)
  const alive = f.members.filter(m => m.status === 'alive').length
  return `<li style="--i:${i}"><a href="${hrefOf(f)}">
    <span class="ix__n">${pad2(i + 1)}</span>
    <span class="ix__slug">${esc(f.name)}</span>
    <span class="ix__meta">${g ? esc(g.label) : 'no easing record'} · motion ${esc(LEVEL[f.motion_budget.level].toLowerCase())} · ${f.members.length} site${f.members.length > 1 ? 's' : ''}, ${alive} live</span>
    ${glyphSvg(g)}
  </a></li>`
}).join('\n')

const indexBlock = (hrefOf, motion) => `<ol class="ix"${motion ? ` data-motion="${motion}"` : ''}>
${indexRows(hrefOf)}
</ol>`

const awardLabel = a => a
  .replace(/^SOTY-(\d{4})-winner$/, 'Site of the Year $1')
  .replace(/^SOTY-(\d{4})-(\w+)-winner$/, (_, y, c) => `${c[0].toUpperCase() + c.slice(1)} of the Year ${y}`)
  .replace(/^SOTM-(\d{4})-(\d{2})$/, 'Site of the Month $1.$2')

const familyBlock = (f, i) => {
  const alive = f.members.filter(m => m.status === 'alive').length
  const g = glyphOf(f)
  const ledger = f.members.map(m => {
    const awards = (m.award || []).filter(a => !a.startsWith('SOTD')).map(awardLabel).join(' · ')
    const dead = m.status !== 'alive'
    // Attribution is load-bearing (DECISIONS 2026-08-04): every member links
    // to its source site and its Awwwards page, and says if it is offline.
    return `<li class="m${dead ? ' m--dead' : ''}">
      <i class="m__mk" aria-hidden="true"></i>
      <a class="m__site" href="${esc(m.live)}" rel="noopener noreferrer nofollow" target="_blank">${esc(m.site || m.slug)}</a>
      <span class="m__award">${esc(awards)}${m.disputed ? ' <b class="m__tag">disputed</b>' : ''}</span>
      <a class="m__src" href="${esc(m.awwwards)}" rel="noopener noreferrer nofollow" target="_blank">awwwards<span class="u-sr">&nbsp;entry for ${esc(m.site || m.slug)}</span></a>
      <span class="m__state">${dead ? 'offline' : 'live'}</span>
    </li>`
  }).join('\n')
  const swatches = f.members.flatMap(m => m.palette || []).map(p => (p.match(/#[0-9a-fA-F]{6}/) || [])[0]).filter(Boolean).slice(0, 8)
    .map(h => `<i class="sw" style="--sw:${h}" title="${h}"></i>`).join('')
  return `<section class="fam" id="f-${esc(f.name)}" data-fam="${pad2(i + 1)} · ${esc(f.name)}" aria-labelledby="h-${esc(f.name)}">
  <div class="fam__rule" aria-hidden="true"></div>
  <p class="fam__idx">${pad2(i + 1)}</p>
  <h2 class="fam__name" id="h-${esc(f.name)}">${esc(f.name)}</h2>
  <p class="fam__thesis">${esc(f.thesis)}</p>
  <p class="fam__sig"><b>Signature move</b> ${esc(f.signature_move)}</p>
  <div class="fam__side">
    <figure class="fam__gl">${glyphSvg(g, 'gl gl--lg')}<figcaption>${g ? `${esc(g.label)} · <code>${esc(g.id)}</code>` : 'No easing record in the validated set'}</figcaption></figure>
    <dl class="spec spec--fam">
      <div><dt>Motion budget</dt><dd>${esc(LEVEL[f.motion_budget.level])}</dd></div>
      <div><dt>Needs</dt><dd>${esc(f.requires.asset)}</dd></div>
      <div><dt>Sites</dt><dd>${f.members.length} · ${alive} live</dd></div>
      <div><dt>Records</dt><dd>${f.records} validated constants</dd></div>
      ${f.nearest ? `<div><dt>Nearest</dt><dd>${esc(f.nearest)}</dd></div>` : ''}
    </dl>
  </div>
  ${swatches ? `<p class="fam__sw" aria-hidden="true">${swatches}</p>` : ''}
  <div class="fam__use">
    <p><b>For</b> ${esc(f.for)}</p>
    <p><b>Not for</b> ${esc(f.not_for)}</p>
  </div>
  <details class="fam__full">
    <summary>Full spec</summary>
    <dl>
      <div><dt>Motion budget</dt><dd>${esc(f.motion_budget.text)}</dd></div>
      <div><dt>Temperature</dt><dd>${esc(f.temperature)}</dd></div>
      <div><dt>Type</dt><dd>${esc(f.type)}</dd></div>
      <div><dt>Motion</dt><dd>${esc(f.motion)}</dd></div>
      <div><dt>Sequencing</dt><dd>${esc(f.sequencing)}</dd></div>
      <div><dt>Varies by</dt><dd>${esc(f.axis)}</dd></div>
    </dl>
  </details>
  <ul class="fam__mem">${ledger}</ul>
</section>`
}

// ============================================================ index.html
const IDX_SCENES = scenesOf('scroll-spec.json')

const modules = `<svg class="mods" data-motion="modules" viewBox="0 0 ${20 * 14} ${Math.ceil(awardRows.length / 20) * 14}" focusable="false" role="img" aria-label="${awardRows.length} squares, one per award row in date order from ${years[0]} to ${years.at(-1)}: filled where the awarded site is still live (${awardRows.filter(r => r.live).length}), hollow where it is offline (${awardRows.filter(r => !r.live).length}).">
  ${awardRows.map((r, i) => `<rect x="${(i % 20) * 14 + 1}" y="${Math.floor(i / 20) * 14 + 1}" width="10" height="10" style="--i:${i}"${r.live ? '' : ' class="off"'}><title>${esc(r.site)} · ${r.year}</title></rect>`).join('')}
</svg>`

const chapters = [
  ['01', 'The sweep', `${n(P.cards.total)} sites`, '#ch-sweep'],
  ['02', 'What broke', `${n(P.semantic_validation.findings)} defects`, '#ch-broke'],
  ['03', 'The test', `judges ${J1.skill}/${J1.judges} → ${J2.skill}/${J2.judges}`, '#ch-test'],
  ['04', 'The families', `${n(FAMS.length)} systems`, '#ch-fams'],
  ['05', 'This page', 'audited', '#ch-self'],
]

const yields = [
  ['Harvest', `${n(P.award_rows_studied)} award rows`, `Crawl the archives. Rows kept at 2018+, each with its award, date and live URL.`],
  ['Card', `${n(P.cards.total)} sites`, `One study card per site, written from the case page and the live build, then attacked by a second agent that had to disprove it.`],
  ['Cluster', `${n(P.taxonomy_families)} families`, `Two independent agents proposed taxonomies; a third reconciled them.`],
  ['Dissect', `${n(P.deep_dive_references)} deep dives`, `Per family, a prose reference plus original re-implementations of the signature techniques.`],
  ['Validate', `${n(P.semantic_validation.entries_reviewed)} → ${n(P.semantic_validation.findings)} defects`, `Every constant re-checked for whether it takes effect — not just whether it was copied correctly.`],
  ['Compile', `${n(P.semantic_validation.citable_priors)} constants`, `The survivors became a skill an agent designs from, citing each value by record ID.`],
]

const sheet = `<div class="sheet" data-motion="sheet">
  ${byYear.map(({ y, ms, off }, r) => `<div class="sheet__row" style="--r:${r}">
    <span class="sheet__y">${y}</span>
    <span class="sheet__cells">${ms.map(m => {
      const hex = (m.palette || []).map(p => (p.match(/#[0-9a-fA-F]{6}/) || [])[0]).filter(Boolean).slice(0, 3)
      const bands = hex.map(h => `<i style="background:${h}"></i>`).join('')
      return `<span class="fr${m.status === 'alive' ? '' : ' fr--off'}" title="${esc(m.site || m.slug)} · ${y} · ${m.status === 'alive' ? 'live' : 'offline'}">${bands}</span>`
    }).join('')}</span>
    <span class="sheet__n">${off}/${ms.length} offline</span>
  </div>`).join('\n  ')}
</div>`

const DR = P.dead_rate_by_award_era
const casefiles = [
  ['2026-08-14', 'The acceptance gate checked that every citation <i>existed</i>, not that it was useful. Both test briefs passed while citing a priors file in which 1% of lines carried a usable constant.', 'A gate that checks existence and not substance will pass a hollow artifact.'],
  ['2026-08-14', `The first version of this page read its family's "stock easings only" as "no motion" and shipped a static document. Rejected: "no hint of awwwards at all."`, 'The skill now carries a motion budget per family: a strict curve set is never a small budget.'],
  ['2026-09-24', `A hand-typed line said 32% of 2018–19 winners were offline. That was the archive-wide rate. Counted from the cards, it is ${esc(DR['2018-2019'])}.`, 'Every current figure on this page is generated; this one was not, and it was wrong.'],
]

const testChapter = EVALS.map(e => {
  const [name, restRaw] = e.brief.replace(/^"([^"]+)":\s*/, '$1||').split('||')
  const rest = restRaw.charAt(0).toUpperCase() + restRaw.slice(1)
  const cell = (file, cap, sub) => `<figure class="tri__cell">
      <a href="evals/${file}.html" target="_blank" rel="noopener"><img src="media/${file}.jpg" width="960" height="720" loading="lazy" decoding="async" alt="${esc(`${name}, ${cap}: the page as built.`)}"><span class="tri__open">Open the page ↗</span></a>
      <figcaption><b>${esc(cap)}</b>${sub ? ` · ${esc(sub)}` : ''}</figcaption>
    </figure>`
  const bars = e.runs.map(r => `<div class="bars__row">
      <span class="bars__k">${esc(r.variant.toUpperCase())} · ${esc(r.run)}</span>
      <span class="bars__b"><i class="bars__s" style="--v:${(r.score_skill / 60).toFixed(4)}"></i><i class="bars__o" style="--v:${(r.score_baseline / 60).toFixed(4)}"></i></span>
      <span class="bars__v">skill ${r.score_skill} · base ${r.score_baseline}</span>
      <span class="bars__j">won ${r.skill_wins} of ${r.judges} judge${r.judges > 1 ? 's' : ''}</span>
    </div>`).join('')
  return `<article class="tri" aria-labelledby="t-${e.id}">
    <h3 id="t-${e.id}">${esc(name)}</h3>
    <p class="tri__brief">${esc(rest)}</p>
    <div class="tri__row">
      ${cell(e.baseline, 'Baseline', 'no skill')}
      ${e.runs.map(r => cell(r.page, `Skill ${r.variant}`, `${r.run} · ${r.family}`)).join('\n      ')}
    </div>
    <div class="bars" role="group" aria-label="Scores out of 60, skill versus baseline">${bars}</div>
  </article>`
}).join('\n')

const baseDrift = EVALS.map(e => `${e.id}: ${e.runs.map(r => r.score_baseline).join(' → ')}`).join('; ')

const selfAudit = [
  ['Grid overlay, load-bearing', 'Signature move: 8-band overlay (swiss-grid-lab#1, #2)', 'The real 8-column CSS Grid, toggled by the Grid button', 'follows'],
  ['Grid control', '41px hit height (swiss-grid-lab#6)', 'The whole "Grid:" control is a 41px button', 'follows'],
  ['Chapters, ground flips', 'Sequencing: teaching pages flip the whole ground to #010101, not a section', '02 and 05 paint the ground full-bleed and the header follows, instantly (#11) — but the neighbouring chapter stays paper: a whole-document swap cost 50-220ms per flip', 'DECISION'],
  ['Motion budget', 'HIGH: curve set strict, volume high', 'Grid build, count, 131 modules, walk, contact sheet, drawn curves, flips', 'follows'],
  ['Curves', 'Stock curves only', `GSAP ${MOTION.ease.reveal} / ${MOTION.count.ease}; CSS ease-out ${MOTION.hover.durationMs}ms; family curves drawn from their own records`, 'follows'],
  ['Rules', '0.8px structural, 1px ornamental (#3, #7)', 'Same two weights', 'follows'],
  ['Accent #FAFF00', "Costume: replace with the brief's own", 'Kept, as the highlighter only', 'DECISION'],
  ['Type', 'Swiss 721 + splices are costume', 'Host Grotesk + IBM Plex Mono, chosen by rendering three candidates', 'DECISION'],
  ['Imagery', 'Measured exhibits only', 'Only pages this project built; no award winner is reproduced', 'follows'],
]

const index = `${head({
  title: `The Taste Library — ${n(P.award_rows_studied)} Awwwards award rows across ${n(P.cards.total)} sites, read as a system`,
  desc: `An experiment: AI agents studied ${n(P.award_rows_studied)} Awwwards award rows (${n(P.cards.total)} sites) from ${P.years_covered}, clustered them into ${n(P.taxonomy_families)} aesthetic families, validated every code constant, compiled a design skill — and then tested whether it works.`,
  canonical: '',
})}
<body>
${chrome('index')}

<main id="main">

<section class="hero" data-scene="hero">
  <p class="hero__count" data-motion="hero-count">
    <span data-count-to="${P.award_rows_studied}" data-count-pad="${n(P.award_rows_studied).length}">${n(P.award_rows_studied)}</span>
  </p>
  <p class="hero__unit">${n(P.award_rows_studied)} award rows · ${n(P.cards.total)} sites · ${esc(P.years_covered)}</p>
  ${spec(label.count(P.award_rows_studied), MOTION.count.cite)}
  ${spec(label.gridBuild, MOTION.gridBuild.cite)}
  <h1 class="hero__h" data-motion="hero-line">
    <span class="ln"><span class="ln__i s1">award-winning</span></span>
    <span class="ln"><span class="ln__i s2">websites, read</span></span>
    <span class="ln"><span class="ln__i s3">as one system</span></span>
    <span class="ln"><span class="ln__i s4">of ${n(P.taxonomy_families)} families.</span></span>
  </h1>
  ${spec(label.heroLines, MOTION.heroLines.cite)}
  <div class="hero__side">
    ${modules}
    <p class="mods__key"><i class="k k--on"></i>live <i class="k"></i>offline · one per award row</p>
    <nav class="chix" aria-label="Chapters">
      <ol>${chapters.map(([no, t, fig, href]) => `<li><a href="${href}"><span>${no}</span><span>${esc(t)}</span><span>${esc(fig)}</span></a></li>`).join('')}</ol>
    </nav>
  </div>
  <div class="hero__lede">
    <p>Agents swept the Awwwards Site&nbsp;of&nbsp;the&nbsp;Year and Site&nbsp;of&nbsp;the&nbsp;Month winners from ${P.years_covered}, opened each one, and wrote down what it actually does. Then they compiled it into a skill — and tested whether the skill makes better pages. It did not, at first.</p>
    <p class="hero__sub">Every current figure here is generated from the dataset. Figures quoted from the project's dated decision log carry their date.</p>
  </div>
  ${spec(label.scroll, MOTION.scroll.cite)}
</section>

<section class="band ch" id="ch-sweep" data-scene="sweep" aria-labelledby="h-sweep">
  <p class="ch__no">01</p>
  <h2 id="h-sweep">The sweep</h2>
  ${spec(label.walk, 'swiss-grid-lab motion line: travel via offset-path not transform; delay = held first keyframe stop')}
  <div class="walk" data-motion="method-walk">
    <svg class="walk__svg" aria-hidden="true" focusable="false"><path class="walk__path" d="" fill="none"/></svg>
    <i class="walk__dot" aria-hidden="true"></i>
    <ol class="steps">
      ${yields.map(([k, y, t]) => `<li><b>${esc(k)}</b><span class="steps__y">${esc(y)}</span><span>${esc(t)}</span></li>`).join('\n      ')}
    </ol>
  </div>
  <div class="ch__spread" data-scene="sheet">
    <h3 class="ch__h3">The web forgets its winners</h3>
    <p class="band__note">Every studied site, by the year it first won, tinted with its own declared palette. A struck frame is a site whose awarded design is gone — even where the domain still answers. ${esc(DR['2018-2019'])} of 2018–19 winners are offline; ${esc(DR['2023+'])} of 2023 onward.</p>
    ${spec(label.sheet, 'DECISION — rows appear in award order as the sheet is read; frames are data (declared palettes), not screenshots')}
    ${sheet}
  </div>
</section>

<section class="band ch ch--ink" id="ch-broke" data-scene="broke" data-ground="ink" aria-labelledby="h-broke">
  <p class="ch__no">02</p>
  <h2 id="h-broke">What broke</h2>
  <p class="thesis" data-motion="findings-mark">The interesting part is not the taxonomy. It is that <span class="thesis__big"><b>the code we wrote about other people's code was the least reliable thing in the library.</b></span></p>
  <div class="broke">
    <p class="broke__big" data-motion="findings-counter"><span data-count-once="${P.semantic_validation.findings}" data-count-pad="${n(P.semantic_validation.findings).length}">${n(P.semantic_validation.findings)}</span></p>
    <p class="hero__unit">defects found · ${n(P.semantic_validation.entries_reviewed)} entries reviewed · nothing deleted, every one annotated where it sits</p>
    ${spec(label.findings, MOTION.findings.cite)}
    <dl class="spec spec--find">
      <div><dt>Entries reviewed</dt><dd><span data-count-once="${P.semantic_validation.entries_reviewed}" data-count-pad="${n(P.semantic_validation.entries_reviewed).length}">${n(P.semantic_validation.entries_reviewed)}</span></dd></div>
      <div><dt>Excluded constants</dt><dd><span data-count-once="${P.semantic_validation.excluded_ledger}" data-count-pad="${n(P.semantic_validation.excluded_ledger).length}">${n(P.semantic_validation.excluded_ledger)}</span></dd></div>
      <div><dt>Validated constants</dt><dd><span data-count-once="${P.semantic_validation.citable_priors}" data-count-pad="${n(P.semantic_validation.citable_priors).length}">${n(P.semantic_validation.citable_priors)}</span></dd></div>
      <div><dt>Sites offline</dt><dd>${n(P.cards.dead)} of ${n(P.cards.total)}</dd></div>
    </dl>
  </div>
  <ol class="cases" aria-label="Case files">
    ${casefiles.map(([d, what, lesson], i) => `<li><span class="cases__n">(${i + 1})</span><span class="cases__d">${d}</span><p>${what}</p><p class="cases__l">${lesson}</p></li>`).join('\n    ')}
  </ol>
</section>

<section class="band ch" id="ch-test" data-scene="test" aria-labelledby="h-test">
  <p class="ch__no">03</p>
  <h2 id="h-test">The test</h2>
  <p class="band__note">Two briefs, each built by an agent with the skill and by one without it, judged blind. The skill lost both: judges preferred it ${J1.skill} time${J1.skill === 1 ? '' : 's'} in ${J1.judges}. After the rebuild it won ${J2.skill} of ${J2.judges} verdicts against the same baseline pages — one clearly, one a tie on the means. Every page below opens as built.</p>
  ${spec(label.bars, 'DECISION — bars drawn to scale (score out of 60) as the chapter is read')}
  <div class="tests" data-motion="test-bars">
${testChapter}
  </div>
  <p class="caveat"><b>Read with care.</b> Two briefs, one build each; judges differ between runs, and the same baseline file scored differently (${esc(baseDrift)}). This is evidence the rebuild helped, not proof.</p>
</section>

<section class="band ch" id="ch-fams" data-scene="fams" aria-labelledby="h-fams">
  <p class="ch__no">04</p>
  <h2 id="h-fams">The families</h2>
  <p class="band__note">${n(FAMS.length)} visual systems. Each draws its own house ease — the curve from its validated record, not a guess — and a marker rides it at that family's real timing when you point at it. ${FAMS.filter(f => !f.ease).length} have no easing record in the validated set, and say so. <a class="inl" href="families.html">Open the archive →</a></p>
  ${spec(label.glyphs, 'Each glyph is sampled from the parsed record; the marker uses CSS linear() sampled from the same function')}
  ${indexBlock(f => `families.html#f-${esc(f.name)}`, 'glyphs')}
</section>

<section class="band ch ch--ink" id="ch-self" data-scene="self" data-ground="ink" aria-labelledby="h-self">
  <p class="ch__no">05</p>
  <h2 id="h-self">This page</h2>
  <p class="band__note">Built by an agent using the skill, in the family <code>swiss-grid-lab</code>. Below: the curve every reveal on this page rides, and the page checked against its own family.</p>
  ${spec(label.exhibit, MOTION.ease.cite)}
  <figure class="ex" data-motion="exhibit-dot">
    <svg class="ex__svg" viewBox="0 0 400 240" focusable="false" role="img" aria-label="The ${esc(MOTION.ease.reveal)} easing curve this page runs, 1 minus (1 minus t) to the fourth, sampled at 65 points, with markers at t 0, 0.25, 0.5, 0.75 and 1.">
      <g class="ex__grid"><path d="M${EX.x0} ${EX.y0} H${EX.x1} M${EX.x0} ${EX.y0} V${EX.y1}" /><path class="ex__guide" d="M${EX.x0} ${EX.y1} H${EX.x1}" /></g>
      <path class="ex__curve" d="${exPath}" fill="none" />
      <g class="ex__marks">${exMarks.map(([x, y]) => `<rect x="${(x - 4).toFixed(2)}" y="${(y - 4).toFixed(2)}" width="8" height="8" />`).join('')}</g>
      <circle class="ex__dot" r="5" cx="${EX.x0}" cy="${EX.y0}" data-ex-dot />
    </svg>
    <figcaption class="ex__cap"><span>${esc(MOTION.ease.reveal)}</span><span>p = ${esc(MOTION.ease.revealFormula.replace('T', 't'))}</span><span data-ex-readout>t 0.00 · p 0.00</span></figcaption>
  </figure>
  <table class="audit">
    <caption>The page against its own family</caption>
    <thead><tr><th scope="col">Move</th><th scope="col">Family says</th><th scope="col">This page</th><th scope="col">Status</th></tr></thead>
    <tbody>${selfAudit.map(([m, f, p, s]) => `<tr><th scope="row">${esc(m)}</th><td>${esc(f)}</td><td>${esc(p)}</td><td class="st st--${s === 'follows' ? 'ok' : 'dec'}">${esc(s)}</td></tr>`).join('')}</tbody>
  </table>
</section>

<section class="band band--end" id="about" aria-labelledby="h-about">
  <h2 id="h-about">Credits</h2>
  <div class="end">
    <p>Every site named here belongs to its authors; the archive links each one to its original work and its Awwwards entry. This page studies them and claims none of them. No award winner is reproduced here: the only pictures are pages this project built.</p>
    <p class="end__links">
      <a href="families.html">The archive — ${n(FAMS.length)} families</a>
      <a href="https://github.com/ryanonline1234/mediatastelibrary" rel="noopener">Source of this site</a>
      <a href="https://www.awwwards.com/" rel="noopener noreferrer nofollow" target="_blank">Awwwards</a>
    </p>
    <p class="end__gen">Figures generated by ${esc(P.generated_by)}. Coverage: ${esc(P.coverage)} (${esc(P.known_uncarded_winners.join(', '))}).</p>
  </div>
</section>

</main>
${tail(IDX_SCENES)}`

// ========================================================= families.html
const FAM_SCENES = scenesOf('scroll-spec.families.json')
const families = `${head({
  title: `The archive — ${n(FAMS.length)} aesthetic families · The Taste Library`,
  desc: `${n(FAMS.length)} visual systems drawn from ${n(P.cards.total)} Awwwards-winning sites, each with its signature move, motion budget, its own validated easing curve, and every member credited.`,
  canonical: 'families.html',
})}
<body class="pg-fam">
${chrome('families')}

<main id="main">
<section class="band band--first" data-scene="archive" aria-labelledby="h-arch">
  <h1 id="h-arch" class="arch__h">The archive</h1>
  <p class="band__note">${n(FAMS.length)} families, ordered by how many award-winning sites share the system. The skill carries ${n(P.skill_families)}; ${esc(P.families_without_sweep_cards.join(', '))} is a hand-picked anchor with no sweep cards, so ${n(FAMS.length)} appear here. Each family's <b>Not for</b> line is the part that keeps it honest.</p>
  ${indexBlock(f => `#f-${esc(f.name)}`, null)}
  <p class="skipfam"><a href="#end">Skip past the families</a></p>
  ${FAMS.map(familyBlock).join('\n')}
</section>

<section class="band band--end" id="end" aria-labelledby="h-end">
  <h2 id="h-end">Credits</h2>
  <div class="end">
    <p>Every site named here belongs to its authors; each links to the original work and its Awwwards entry, and says whether the awarded design is still live. A rebuilt site counts as offline.</p>
    <p class="end__links"><a href="index.html">← The argument</a><a href="https://github.com/ryanonline1234/mediatastelibrary" rel="noopener">Source of this site</a></p>
    <p class="end__gen">Figures generated by ${esc(P.generated_by)}. Coverage: ${esc(P.coverage)}.</p>
  </div>
</section>
</main>
${tail(FAM_SCENES)}`

// ------------------------------------------------------------------ write
const outDir = path.join(ROOT, 'dist')
fs.mkdirSync(path.join(outDir, 'media'), { recursive: true })
fs.mkdirSync(path.join(outDir, 'evals'), { recursive: true })
fs.writeFileSync(path.join(outDir, 'index.html'), index)
fs.writeFileSync(path.join(outDir, 'families.html'), families)
for (const f of ['styles.css', 'app.js']) fs.copyFileSync(path.join(ROOT, 'src', f), path.join(outDir, f))
for (const e of EVALS) for (const file of [e.baseline, ...e.runs.map(r => r.page)]) {
  const still = path.join(ROOT, 'media-src/stills', `${file}.jpg`)
  if (!fs.existsSync(still)) fatal(`missing still ${still} — run node bin/eval-stills.mjs`)
  fs.copyFileSync(still, path.join(outDir, 'media', `${file}.jpg`))
  fs.copyFileSync(path.join(ROOT, 'media-src/evals', `${file}.html`), path.join(outDir, 'evals', `${file}.html`))
}

const kb = f => (fs.statSync(path.join(outDir, f)).size / 1024).toFixed(0)
console.log(`dist/index.html ${kb('index.html')}KB · dist/families.html ${kb('families.html')}KB`)
console.log(`${FAMS.length} families (${FAMS.filter(f => f.ease).length} with an easing record) · ${members.length} sites · ${awardRows.length} award rows · ${EVALS.length} test briefs`)
const noLink = members.filter(m => !m.live || !m.awwwards)
if (noLink.length) fatal(`${noLink.length} members missing attribution links: ${noLink.slice(0, 5).map(m => m.slug)}`)
console.log('attribution: every member has both a source link and an awwwards link')
