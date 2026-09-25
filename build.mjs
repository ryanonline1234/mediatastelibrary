#!/usr/bin/env node
// Static generator for mediatastelibrary.page.
//
//   node build.mjs        -> dist/
//
// Design family: swiss-grid-lab (see CREDITS.md). Chosen because its own
// "For" line is this brief — documentation where the method is the content —
// and taken at the LOAD-BEARING pole of its axis of variation: the drawn grid
// is real CSS Grid, not a depiction. A page arguing for verification should
// not fake its own apparatus.
//
// Every number on the page comes from data/provenance.json, which is
// generated from the dataset by taste-library/bin/build-provenance.mjs.
// Nothing here is hand-typed.

import fs from 'node:fs'
import path from 'node:path'
import { MOTION, label } from './src/motion-config.mjs'

const ROOT = path.resolve(import.meta.dirname)
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'))
const P = read('provenance.json')
const FAMS = read('families.json')

// A spec label. Rendered from the SAME object the runtime animates from, so
// the printed constant and the executed constant are one value.
const spec = (text, cite) => `<p class="mlabel"${cite ? ` title="${esc(cite)}"` : ''}>${esc(text)}</p>`

// The scroll spec is not documentation — it is the source of the scene ranges
// the runtime actually maps against. Reading it here means the assertion file
// and the implementation cannot disagree about where a scene begins, which is
// exactly the class of bug the first capture caught.
const SPEC_FILE = JSON.parse(fs.readFileSync(path.join(ROOT, 'scroll-spec.json'), 'utf8'))
const SCENES = Object.fromEntries(SPEC_FILE.scenes.map(s => [s.id, [s.range.from, s.range.to]]))

// The exhibit draws the ease the page RUNS. power3.out in GSAP is quartic.
// One function feeds the drawn path here and (via motion-config) the runtime
// readout, so the drawing, the label and the dot cannot disagree again.
const EASE = t => 1 - Math.pow(1 - t, 4)
const EX = { x0: 40, x1: 360, y0: 200, y1: 40 }
const exPt = t => [EX.x0 + (EX.x1 - EX.x0) * t, EX.y0 - (EX.y0 - EX.y1) * EASE(t)]
const exPath = 'M' + Array.from({ length: 65 }, (_, i) => exPt(i / 64).map(v => v.toFixed(2)).join(' ')).join(' L')
const exMarks = [0, 0.25, 0.5, 0.75, 1].map(exPt)

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const n = x => Number(x).toLocaleString('en-US')

// ---------------------------------------------------------------- spec rows
// swiss-grid-lab vocabulary: "10px spec-table rows as ornament
// (`Grid | 12 Columns`)". Here the ornament is load-bearing — these are the
// real generated figures.
const SPEC = [
  ['Award rows', n(P.award_rows_studied)],
  ['Site of the Year', n(P.sites_of_the_year_winners)],
  ['Category winners', n(P.soty_sibling_category_winners)],
  ['Site of the Month', n(P.sites_of_the_month)],
  ['Not yet carded', n(P.known_uncarded_winners.length)],
  ['Years', P.years_covered],
  ['Families', n(P.taxonomy_families)],
  ['Cards', n(P.cards.total)],
  ['Still live', n(P.cards.alive)],
  ['Offline', n(P.cards.dead)],
  ['Code priors', n(P.semantic_validation.citable_priors)],
]

// Defects last, so the number the section is about lands last.
const FINDINGS = [
  ['Entries reviewed', n(P.semantic_validation.entries_reviewed)],
  ['Excluded constants', n(P.semantic_validation.excluded_ledger)],
  ['Citable priors', n(P.semantic_validation.citable_priors)],
  ['Defects found', n(P.semantic_validation.findings)],
]

const awardLabel = a => a
  .replace(/^SOTY-(\d{4})-winner$/, 'Site of the Year $1')
  .replace(/^SOTY-(\d{4})-(\w+)-winner$/, (_, y, c) => `${c[0].toUpperCase() + c.slice(1)} of the Year ${y}`)
  .replace(/^SOTM-(\d{4})-(\d{2})$/, 'Site of the Month $1.$2')
  .replace(/^SOTD-([\d-]+)$/, 'Site of the Day $1')

// ------------------------------------------------------------------ markup
const familySection = (f, i) => {
  const idx = String(i + 1).padStart(2, '0')
  const alive = f.members.filter(m => m.status === 'alive').length
  const members = f.members.map(m => {
    const awards = (m.award || []).filter(a => !a.startsWith('SOTD')).map(awardLabel).join(' · ')
    const dead = m.status !== 'alive'
    // Attribution is load-bearing (DECISIONS 2026-08-04): every member links
    // to its source site and its Awwwards page, and says if it is offline.
    return `<li class="m${dead ? ' m--dead' : ''}">
      <a class="m__site" href="${esc(m.live)}" rel="noopener noreferrer nofollow" target="_blank">${esc(m.site || m.slug)}</a>
      <span class="m__award">${esc(awards)}</span>
      <a class="m__src" href="${esc(m.awwwards)}" rel="noopener noreferrer nofollow" target="_blank">awwwards<span class="u-sr">&nbsp;entry for ${esc(m.site || m.slug)}</span></a>
      <span class="m__state" aria-label="${dead ? 'awarded design offline' : 'awarded design still live'}">${dead ? 'offline' : 'live'}</span>
    </li>`
  }).join('\n')

  const swatches = (f.members.flatMap(m => m.palette || [])
    .map(p => (p.match(/#[0-9a-fA-F]{6}/) || [])[0]).filter(Boolean).slice(0, 8))
    .map(h => `<i class="sw" style="--sw:${h}" title="${h}"></i>`).join('')

  return `<section class="fam" id="f-${esc(f.name)}" aria-labelledby="h-${esc(f.name)}">
  <div class="fam__rule" aria-hidden="true"></div>
  <p class="fam__idx">${idx}</p>
  <h3 class="fam__name" id="h-${esc(f.name)}">${esc(f.name)}</h3>
  <p class="fam__thesis">${esc(f.thesis)}</p>
  <dl class="spec spec--fam">
    <div><dt>Members</dt><dd>${f.members.length}</dd></div>
    <div><dt>Live</dt><dd>${alive}</dd></div>
    <div><dt>Temperature</dt><dd>${esc(f.temperature)}</dd></div>
    <div><dt>Type</dt><dd>${esc(f.type)}</dd></div>
    <div><dt>Motion</dt><dd>${esc(f.motion)}</dd></div>
    <div><dt>Varies by</dt><dd>${esc(f.axis)}</dd></div>
  </dl>
  ${swatches ? `<p class="fam__sw" aria-hidden="true">${swatches}</p>` : ''}
  <div class="fam__use">
    <p><b>For</b> ${esc(f.for)}</p>
    <p><b>Not for</b> ${esc(f.not_for)}</p>
  </div>
  <ul class="fam__mem">${members}</ul>
</section>`
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Taste Library — ${n(P.award_rows_studied)} Awwwards award rows across ${n(P.cards.total)} sites, read as a system</title>
<meta name="description" content="An experiment: AI agents studied ${n(P.award_rows_studied)} Awwwards award rows (${n(P.cards.total)} sites) from ${P.years_covered}, clustered them into ${n(P.taxonomy_families)} aesthetic families, verified every code constant, and compiled the result into a design skill.">
<meta name="color-scheme" content="light">
<meta property="og:title" content="The Taste Library">
<meta property="og:description" content="${n(P.award_rows_studied)} Awwwards award rows across ${n(P.cards.total)} sites, ${n(P.taxonomy_families)} aesthetic families, ${n(P.semantic_validation.findings)} defects found in the process.">
<meta property="og:url" content="https://mediatastelibrary.page/">
<meta property="og:image" content="https://mediatastelibrary.page/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The Taste Library: the ${n(P.award_rows_studied)} count over its own 8-column grid.">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' fill='%23F1F1F1'/%3E%3Crect x='4' y='4' width='8' height='8' fill='%23010101'/%3E%3C/svg%3E">
<!-- Hide the load-animated hero until the motion layer starts, so it can't
     flash its finished state and then reset. Never gates content: skipped
     under reduced motion, and a 3s failsafe removes it if the CDN is slow. -->
<script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('mtl-wait');setTimeout(function(){document.documentElement.classList.remove('mtl-wait')},3000)}</script>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<!-- The 8-column overlay is the family's signature move. Here it is a real
     CSS Grid the page is laid out on, not a picture of one. -->
<div class="grid-overlay" data-grid hidden aria-hidden="true">${Array.from({ length: 8 }, () => '<i></i>').join('')}</div>

<header class="top">
  <p class="top__mark">Taste&nbsp;Library</p>
  <button class="top__toggle" type="button" data-grid-toggle aria-pressed="false" aria-label="Grid overlay">
    <span class="lab" aria-hidden="true">Grid:</span>
    <span class="pill" aria-hidden="true"><span class="pill__lz"></span><span class="pill__tx">OFF</span></span>
  </button>
</header>

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
  <div class="hero__lede">
    <p>Agents swept the Awwwards Site&nbsp;of&nbsp;the&nbsp;Year and Site&nbsp;of&nbsp;the&nbsp;Month winners from ${P.years_covered}, opened each one, and wrote down what it actually does. Not a gallery — a taxonomy, with the working shown.</p>
    <p class="hero__sub">Every figure on this page is generated from the dataset. None is typed by hand — and so is every motion constant printed beside the thing it drives.</p>
  </div>
  <dl class="spec spec--hero">
    ${SPEC.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n    ')}
  </dl>
  ${spec(label.scroll, MOTION.scroll.cite)}
</section>

<section class="band" id="method" data-scene="method" aria-labelledby="h-method">
  <h2 id="h-method">The method</h2>
  ${spec(label.walk, 'swiss-grid-lab motion line: travel via offset-path not transform')}
  <div class="walk" data-motion="method-walk" aria-hidden="true">
    <svg class="walk__svg" viewBox="0 0 960 40" preserveAspectRatio="none" focusable="false">
      <path class="walk__path" d="M4 20 H956" fill="none" />
    </svg>
    <i class="walk__dot"></i>
  </div>
  <ol class="steps">
    <li><b>Harvest</b><span>Crawl the archives. ${n(P.award_rows_studied)} rows kept at 2018+, each with its award, date and live URL.</span></li>
    <li><b>Card</b><span>One study card per site, written from the case page and the live build, then attacked by a second agent that had to disprove it.</span></li>
    <li><b>Cluster</b><span>Two independent agents proposed taxonomies; a third reconciled them. ${n(P.taxonomy_families)} families survived.</span></li>
    <li><b>Dissect</b><span>Per family, a deep dive: prose reference plus original re-implementations of the signature techniques.</span></li>
    <li><b>Validate</b><span>Every constant re-checked for whether it <i>takes effect</i> — not just whether it was copied correctly.</span></li>
    <li><b>Compile</b><span>The survivors became a skill an agent can use to design from, citing sources.</span></li>
  </ol>
</section>

<section class="band band--find" id="findings" data-scene="findings" aria-labelledby="h-find">
  <h2 id="h-find">What the checking found</h2>
  <div class="find">
    <div class="find__txt" data-motion="findings-mark">
      <p>The interesting part is not the taxonomy. It is that <b>the code we wrote about other people's code was the least reliable thing in the library</b>.</p>
      <p>A late pass re-read every extracted constant asking a question the earlier passes never had: does this value actually do anything? ${n(P.semantic_validation.findings)} defects came back. ${n(P.cards.dead)} of the sites studied are themselves already offline — the awarded design gone, even where the domain still answers.</p>
      <p>Nothing was deleted. Defects are annotated where they sit, because a record of what was wrong is worth more than a clean file that lies.</p>
    </div>
    <div class="find__side">
      <dl class="spec spec--find" data-motion="findings-counter">
        ${FINDINGS.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd><span data-count-once="${String(v).replace(/,/g, '')}" data-count-pad="${String(v).length}">${esc(v)}</span></dd></div>`).join('\n        ')}
      </dl>
      ${spec(label.findings, MOTION.findings.cite)}
    </div>
  </div>
</section>

<section class="band band--exhibit" id="exhibit" data-scene="exhibit" aria-labelledby="h-exhibit">
  <h2 id="h-exhibit">The easing this page uses, drawn</h2>
  <p class="band__note">Every reveal on this page rides this curve. The dot moves across linearly as you scroll; its height is the ease — which is the whole difference between a scrubbed tween that was given an ease and one that was not.</p>
  ${spec(label.exhibit, MOTION.ease.cite)}
  <figure class="ex" data-motion="exhibit-dot">
    <svg class="ex__svg" viewBox="0 0 400 240" focusable="false" role="img" aria-label="The ${esc(MOTION.ease.reveal)} easing curve this page runs, 1 minus (1 minus t) to the fourth, sampled at 65 points, with markers at t 0, 0.25, 0.5, 0.75 and 1.">
      <g class="ex__grid">
        <path d="M${EX.x0} ${EX.y0} H${EX.x1} M${EX.x0} ${EX.y0} V${EX.y1}" />
        <path class="ex__guide" d="M${EX.x0} ${EX.y1} H${EX.x1}" />
      </g>
      <path class="ex__curve" d="${exPath}" fill="none" />
      <g class="ex__marks">
        ${exMarks.map(([x, y]) => `<rect x="${(x - 4).toFixed(2)}" y="${(y - 4).toFixed(2)}" width="8" height="8" />`).join('')}
      </g>
      <circle class="ex__dot" r="5" cx="${EX.x0}" cy="${EX.y0}" data-ex-dot />
    </svg>
    <figcaption class="ex__cap">
      <span>${esc(MOTION.ease.reveal)}</span>
      <span>p = ${esc(MOTION.ease.revealFormula.replace('T', 't'))}</span>
      <span data-ex-readout>t 0.00 · p 0.00</span>
    </figcaption>
  </figure>
</section>

<section class="band" id="families" data-scene="families" aria-labelledby="h-fams">
  <div class="rail" data-motion="families-rail" aria-hidden="true"><i></i></div>
  <h2 id="h-fams">${n(FAMS.length)} families</h2>
  <p class="band__note">Ordered by member count. Each is a visual system, not a template — the <b>Not for</b> line is the part that keeps it honest. The skill carries ${n(P.skill_families)}; ${esc(P.families_without_sweep_cards.join(', '))} is a hand-picked anchor with no sweep cards, so ${n(FAMS.length)} appear here.</p>
  ${spec(label.section, MOTION.section.cite)}
  ${FAMS.map(familySection).join('\n')}
</section>

<section class="band band--end" id="about" aria-labelledby="h-about">
  <h2 id="h-about">Credits &amp; method notes</h2>
  <div class="end">
    <p>Every site named here belongs to its authors; links go to the original work and its Awwwards entry. This page studies them, and claims none of them.</p>
    <p>This page was designed by an AI agent using the skill the experiment produced — the same skill, on itself. Its family is <code>swiss-grid-lab</code>, chosen because that family is for documentation "where the method is the content". The grid you can toggle above is the grid the page is built on.</p>
    <p class="end__links">
      <a href="https://github.com/ryanonline1234/mediatastelibrary" rel="noopener">Source of this site</a>
      <a href="https://www.awwwards.com/" rel="noopener noreferrer nofollow" target="_blank">Awwwards</a>
    </p>
    <p class="end__gen">Figures generated by ${esc(P.generated_by)}. Coverage: ${esc(P.coverage)} (${esc(P.known_uncarded_winners.join(", "))}).</p>
  </div>
</section>

</main>
<!-- The constants the runtime animates from. Identical object to the one that
     printed the spec labels above, so a label cannot describe a value the
     page does not actually use. -->
<script type="application/json" id="motion-config">${JSON.stringify({ ...MOTION, scenes: SCENES, exhibit: EX })}</script>
<script src="app.js" type="module"></script>
</body>
</html>
`

const outDir = path.join(ROOT, 'dist')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'index.html'), html)
for (const f of ['styles.css', 'app.js']) fs.copyFileSync(path.join(ROOT, 'src', f), path.join(outDir, f))

const members = FAMS.reduce((a, f) => a + f.members.length, 0)
console.log(`dist/index.html  ${(fs.statSync(path.join(outDir, 'index.html')).size / 1024).toFixed(0)}KB`)
console.log(`${FAMS.length} families · ${members} members · ${SPEC.length} generated spec rows`)
const noLink = FAMS.flatMap(f => f.members).filter(m => !m.live || !m.awwwards)
if (noLink.length) { console.error(`FATAL: ${noLink.length} members missing attribution links: ${noLink.slice(0, 5).map(m => m.slug)}`); process.exit(1) }
console.log('attribution: every member has both a source link and an awwwards link')
