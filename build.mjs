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

const ROOT = path.resolve(import.meta.dirname)
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'))
const P = read('provenance.json')
const FAMS = read('families.json')

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
  ['Years', P.years_covered],
  ['Families', n(P.aesthetic_families)],
  ['Cards', n(P.cards.total)],
  ['Still live', n(P.cards.alive)],
  ['Offline', n(P.cards.dead)],
  ['Code priors', n(P.semantic_validation.citable_priors)],
]

const FINDINGS = [
  ['Entries reviewed', n(P.semantic_validation.entries_reviewed)],
  ['Defects found', n(P.semantic_validation.findings)],
  ['Excluded constants', n(P.semantic_validation.excluded_ledger)],
  ['Citable priors', n(P.semantic_validation.citable_priors)],
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
<title>The Taste Library — ${n(P.award_rows_studied)} Awwwards winners, read as a system</title>
<meta name="description" content="An experiment: AI agents studied ${n(P.award_rows_studied)} Awwwards award rows from ${P.years_covered}, clustered them into ${n(P.aesthetic_families)} aesthetic families, verified every code constant, and compiled the result into a design skill.">
<meta name="color-scheme" content="light">
<meta property="og:title" content="The Taste Library">
<meta property="og:description" content="${n(P.award_rows_studied)} Awwwards winners, ${n(P.aesthetic_families)} aesthetic families, ${n(P.semantic_validation.findings)} defects found in the process.">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<!-- The 8-column overlay is the family's signature move. Here it is a real
     CSS Grid the page is laid out on, not a picture of one. -->
<div class="grid-overlay" data-grid hidden aria-hidden="true">${Array.from({ length: 8 }, () => '<i></i>').join('')}</div>

<header class="top">
  <p class="top__mark">Taste&nbsp;Library</p>
  <div class="top__toggle">
    <span class="lab" id="gridlab">Grid:</span>
    <button class="pill" type="button" data-grid-toggle aria-pressed="false" aria-labelledby="gridlab">
      <span class="pill__lz" aria-hidden="true"></span><span class="pill__tx">OFF</span>
    </button>
  </div>
</header>

<main id="main">

<section class="hero">
  <h1 class="hero__h">
    <span class="s1">${n(P.award_rows_studied)} award-winning</span>
    <span class="s2">websites, read</span>
    <span class="s3">as one system</span>
    <span class="s4">of ${n(P.aesthetic_families)} families.</span>
  </h1>
  <div class="hero__lede">
    <p>Agents swept every Awwwards Site&nbsp;of&nbsp;the&nbsp;Year and Site&nbsp;of&nbsp;the&nbsp;Month winner from ${P.years_covered}, opened each one, and wrote down what it actually does. Not a gallery — a taxonomy, with the working shown.</p>
    <p class="hero__sub">Every figure on this page is generated from the dataset. None is typed by hand.</p>
  </div>
  <dl class="spec spec--hero">
    ${SPEC.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n    ')}
  </dl>
</section>

<section class="band" id="method" aria-labelledby="h-method">
  <h2 id="h-method">The method</h2>
  <ol class="steps">
    <li><b>Harvest</b><span>Crawl the archives. ${n(P.award_rows_studied)} rows kept at 2018+, each with its award, date and live URL.</span></li>
    <li><b>Card</b><span>One study card per site, written from the case page and the live build, then attacked by a second agent that had to disprove it.</span></li>
    <li><b>Cluster</b><span>Two independent agents proposed taxonomies; a third reconciled them. ${n(P.aesthetic_families)} families survived.</span></li>
    <li><b>Dissect</b><span>Per family, a deep dive: prose reference plus original re-implementations of the signature techniques.</span></li>
    <li><b>Validate</b><span>Every constant re-checked for whether it <i>takes effect</i> — not just whether it was copied correctly.</span></li>
    <li><b>Compile</b><span>The survivors became a skill an agent can use to design from, citing sources.</span></li>
  </ol>
</section>

<section class="band band--find" id="findings" aria-labelledby="h-find">
  <h2 id="h-find">What the checking found</h2>
  <div class="find">
    <div class="find__txt">
      <p>The interesting part is not the taxonomy. It is that <b>the code we wrote about other people's code was the least reliable thing in the library</b>.</p>
      <p>A late pass re-read every extracted constant asking a question the earlier passes never had: does this value actually do anything? ${n(P.semantic_validation.findings)} defects came back. ${n(P.cards.dead)} of the sites studied are themselves already offline — the awarded design gone, even where the domain still answers.</p>
      <p>Nothing was deleted. Defects are annotated where they sit, because a record of what was wrong is worth more than a clean file that lies.</p>
    </div>
    <dl class="spec spec--find">
      ${FINDINGS.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n      ')}
    </dl>
  </div>
</section>

<section class="band" id="families" aria-labelledby="h-fams">
  <h2 id="h-fams">${n(FAMS.length)} families</h2>
  <p class="band__note">Ordered by member count. Each is a visual system, not a template — the <b>Not for</b> line is the part that keeps it honest.</p>
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
    <p class="end__gen">Generated ${esc(P.generated)} from ${esc(P.generated_by)}.</p>
  </div>
</section>

</main>
<script src="app.js" defer></script>
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
