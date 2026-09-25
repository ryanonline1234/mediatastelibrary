# Design critique — 2026-09-24

Six-lens critique (Awwwards juror, own-family fidelity via the rebuilt awwwards-taste skill, motion, narrative/IA, type/mobile/a11y, media), each followed by a skeptic that re-rendered and re-measured every claim; items whose evidence did not hold were dropped. Not yet acted on.

## Recommendation

Do the quick fixes first, starting with QF1-QF3. They are small (S to S-M), and until they ship the page contradicts its own thesis. The exhibit captioned 'the easing this page uses' draws power2.out and labels it power3.out. Every scrubbed scene plays off screen (2.2% of scroll moves a visible scrubbed element). The headline counters read 0 beside prose saying 1,118. A reader who checks one number finds it wrong. Then build Direction 1, 'Chapters'. Its spine is upgrades 1-3 (the ink flip, the decay grid, the families index), which are worth shipping on the current single page anyway, so nothing is wasted if the two-page split is deferred.

Why Direction 1 over the others:
- It is the only one that adds a real story: the skill lost a blind test and then won after the rebuild, told honestly with the judge-drift caveat.
- Its imagery is owned outright (the six eval builds).
- It follows the family's Sequencing line literally.
- It cuts the story page to about 5-7k px (SOFT).

Direction 2 answers 'no hint of awwwards' most directly, but it is blocked on a rights decision and 117 captures. Treat it as phase 2 on families.html. Direction 3 is the fallback if imagery of any kind is ruled out.

I dropped these because the evidence failed or a skeptic judged them not worth it:
- 43 specimens synthesized from palette statistics (noisy, and misrepresents the WebGL families)
- a 'Specimen:' costume toggle (the skill lists that as costume)
- the grid-as-taxonomy-axes plot (breaks the family's Not-for)
- the data-derived accent (#2779a7 at 8 of 602 uses is noise)
- every pin or scroll-jack (fix the ranges instead)
- 43 uniform held-stop draws
- the 23,500px travelling marker
- strikethrough on offline names
- a 'g' key shortcut (WCAG 2.1.4)
- standalone 0.8px hairline work (fold it into rewritten selectors)

My own verification: I spot-checked the load-bearing source lines (app.js:177/225/279/316, motion-config.mjs:74, build.mjs:121-122/204/208/212/222/240, styles.css:138-287 grid-column 1/9 and :142, sync-spec.mjs:38) and confirmed the key screenshots exist. I did not re-render. All measurements come from the six lenses and their skeptics.

Open decisions for Ryan:
1. Flip scope: findings+exhibit only, or method+findings+exhibit?
2. Two pages (story + families) or one?
3. Publish the eval builds and scores, including the 0–2 loss and the 46→40.8 baseline drift?
4. Can your v1 rejection quote appear on the page?
5. Image source: our own dated captures plus Wayback only, or Awwwards submission stills despite their terms?
6. Keep #FAFF00 only on the ink chapter?
7. Typeface: self-host a grotesk plus a mono (pick from rendered options), or keep the Helvetica-first stack?

## Quick fixes (defects, any direction)

- **The easing exhibit draws, labels and reads out three different curves, none of them the ease the page runs** [S; juror, family, motion, craft, media]
  - Evidence: HARD, found by all 4 lenses and reproduced by their skeptics. In the page, gsap.parseEase('power3.out')(0.5) = 0.9375. The printed cubic-bezier(0.215,0.61,0.355,1) (build.mjs:208, :222) gives 0.875, which is power2.out. The drawn path 'C 108.8 78.8 …' (build.mjs:212) decodes to CP1 y=0.7575 and gives 0.908. The readout uses 1-(1-t)^3 (app.js:316), which is 0.875 again. The dot rides offset-distance, which measures arc length, so at readout t .25/.50/.75 it sits at x .166/.407/.700. The caption 'Every reveal above rides this curve' (build.mjs:204) is wrong too: only the 4 hero lines above the exhibit use power3.out, and the 289 family reveals sit below it. In reduced motion the dot is parked at the end while the readout prints 't 0.00 · p 0.00'. 'COUNT 0→131' is typed by hand (motion-config.mjs:74, confirmed), on a page whose copy says 'None is typed by hand'. The labels also call .toUpperCase() on their constants, so they print as 'POWER3.OUT'.
  - Fix: Derive the curve, dot, readout and caption from one function. (1) At runtime, sample gsap.parseEase(M.ease.reveal) into a 64-point path. For no-JS and reduced motion, build a fallback from the closed form 1-(1-t)^4. (2) Position the dot with a transform at (40+320t, 200-160·ease(t)) and drop offset-path. (3) Compute the readout from the same parsed ease. (4) Replace the fake bezier handles with 8x8 markers at t=0/.25/.5/.75/1, each labelled with its (t,p). If a bezier caption stays, print 'CSS twin ≈ cubic-bezier(.25,1,.5,1), max error ≈0.005'. (5) Generate the 'rides this curve' sentence from the list of tweens that actually use M.ease.reveal. (6) Build label.count from P.award_rows_studied and stop upper-casing constants. (7) In reduced motion, park the dot at t=.5 and print 't 0.50 · p 0.94'. (8) Add a verify.sh check that the drawn path and the dot centre match parseEase at t=.25/.5/.75, within 0.01 and 1px.
- **Every scrubbed scene plays while its section is leaving the screen, at every width, and SCRUB 0.6 does nothing** [S-M; juror, family, motion, narrative, craft, media]
  - Evidence: HARD, found by all six lenses. bin/sync-spec.mjs:38 stores each range as [top/max, (top+h)/max], measured once at 1440x900 and baked into build.mjs:33-34/253. app.js:141 maps progress against those ranges, so progress 0 means the section top is at the viewport top. At 1440, --walk reads 0.000 while the walk sits at viewport y 855→225. The exhibit reads 't 0.00' with its figure centred and reaches 1.00 only once off screen. The families rail is visible for 22 of its 23,568 moving px. Across the page, 2.2% of scroll moves a scrubbed element that is fully visible. At 390 all four scenes play with 0 visible px, and the exhibit finishes 1,700px into the families list. The global trigger has no animation attached (app.js:201-207), so a 346px jump reaches its target in one frame, and 'SCRUB 0.6' is printed on 3 labels for a value that does nothing. verify.sh passes 42/42 because the spec and the runtime share the same ranges. See motion/A-method-walk-centred.png and motion/D-exhibit-centred.png.
  - Fix: Delete the SCENES fractions. Give the walk and the exhibit each their own ScrollTrigger that scrubs a real tween, with function-based start/end, invalidateOnRefresh and scrub: M.scrub.value. That makes the 0.6 real. Use .steps 'top 85%'→'top 30%' and the exhibit figure 'top 80%'→'top 15%'. Keep it to 4 triggers or fewer; the old 327ms jank came from 43. Remove the scrubbed rail (the header readout in the upgrades replaces it). Have sync-spec record trigger strings, not fractions. Add assertions against the DOM at 390, 1280 and 1440: each scrubbed variable is in 0.3–0.7 when its element is centred, and a jump probe expects roughly 600ms of catch-up. The current build fails all of them, which gives a free positive control. Optionally add a mutation test: scale each MOTION constant and require a measured behaviour to change.
- **The findings counters read 0 next to the sentence that says 1,118, in the accessibility tree too** [S; juror, family, motion, narrative, craft, media]
  - Evidence: HARD. At 1440 the table is fully visible from scrollY 1324 to 1824 and reads 0|0|0|0 (motion/B-findings-readable.png, family/shots/d-01510-findings-fully-visible.png). With the heading at the top of the viewport it reads 4/2/2/1. The final 2,289/1,118/1,096/730 appears only once the table is at −359px. At 390 and 768 it reads 0 at every visible position. If the reader stops mid-range it shows numbers that are not in the dataset (244|119|117|78 at y=1975, fully on screen). build.mjs:195 writes the true value, app.js:211 applyAll(0) overwrites it at boot, and the accessibility tree announces 'Defects found: 0'.
  - Fix: Stop scrubbing the evidence numbers. Run a one-shot count on enter instead: once:true, start 'top 75%', 2s power3.inOut (M.count), stagger 0.1. It ends on the true value and stays there. Move the Defects row last in FINDINGS (build.mjs:57-62) so it lands last in reading order too. Keep the real figure in a visually-hidden span and animate only an aria-hidden twin. Never write 0 into the DOM. Remove 'findings' from the scene map. Reduced motion: final values, as it does today.
- **On phones the load-bearing grid is false: 4 phantom tracks take 64px** [S; juror, craft, family]
  - Evidence: HARD, reproduced. At 390, .hero, .band and #families compute to '61.5px ×4 0px ×4'. Content stops at x=310 while the Grid overlay's bands reach 374, and the findings side table is squeezed to 103px (juror/m-020-grid-on.png). The cause is grid-column: 1 / 9 at styles.css:138,152,166,197,202,216,230,272,285,287 (confirmed). The skeptic patched it by interception: 4 real 77.5px tracks, content runs 16→374, no overflow, 1440 unchanged, and the 390 page gets 11% shorter (41,785→37,045px).
  - Fix: Replace every `grid-column: 1 / 9` with `1 / -1`, and anchor right-hand spans with negative lines (.top__toggle 3/-1 on phone; .find__side, .ex and .spec--hero 1/-1 at ≤720). Add a harness check at 390: no 0px track, and the right edges of .fam__rule, .find__side and .pill are equal. Re-run sync-spec.
- **The scroll reveal drops keyboard focus to <body>, and the sticky header hides focused links** [S; motion, craft]
  - Evidence: HARD. autoAlpha:0 at app.js:279 (confirmed) sets visibility:hidden on a link that has just received focus. That caused 3 drops to BODY in 70 Tabs at 1440, skipping the first member link of families 1 and 3; there are 0 drops with reduced motion. On Shift+Tab, focused links sit at top 15-16px under the 52px header (craft/shots/1440-14-focus-under-header.png). The skeptic verified both fixes by interception: drops 3→0, header hits 2→0.
  - Fix: At app.js:279 change `autoAlpha: 0` to `opacity: 0`. Add `html { scroll-padding-top: 64px }`. Add a Tab-walk assertion that activeElement never becomes body.
- **Readers who wait more than 4s see each family blink out and back in** [S; motion]
  - Evidence: HARD. After 6s idle, family #6's name reads opacity 1, then 0 at the 85% trigger, then back to 1 about 430-600ms later. The 4s failsafe (app.js:295-301) clears data-rv, but the batch onEnter (app.js:275-285) still runs gsap.from({autoAlpha:0}).
  - Fix: Add `if (!section.hasAttribute('data-rv')) return` before the from() at app.js:276 and keep the timer failsafe. The whole batch goes away if the copy fade-ups are removed (upgrade 11).
- **An unused :root custom property costs about 94% of style-recalc time during scroll** [S; motion]
  - Evidence: HARD. app.js:177 writes --scroll-progress to <html> roughly every 26px (confirmed), and nothing in src/ or dist reads it. In an A/B over a 6,000px scroll, RecalcStyleDuration was about 1,230ms with the write and about 74ms without (2 runs each). SOFT: at 4× CPU throttle that is about 10ms per frame.
  - Fix: Delete app.js:177 and :78 and the spec assertion that checks them. Re-run the 4× jank pass; the budget this frees is what the flip and the live labels need.
- **The load moment flashes the finished hero, never holds the built grid, and clips a descender** [S-M; juror, family, motion]
  - Evidence: HARD. First paint (64-112ms) shows '131' and the finished headline. At about 200-260ms, when the CDN modules resolve, the count snaps to '  0' and the lines jump to translateY 88.9px. The overlay shows from about 206 to 1,000ms and is hidden in the build's own onComplete (app.js:225, confirmed), so the full grid is never on screen at rest. juror/d-000-load-300ms.png, the grid building over the count, is the page's most award-like frame. The 'g' of 'award-winning' is sliced by .ln overflow:clip with an 80.8px line box for 86px type (motion/I-hero-line1-clip.png).
  - Fix: Take the load off the CDN. build.mjs generates CSS @keyframes from MOTION for the line rise and the grid build, with per-item delays as held first keyframe stops and easing as CSS linear() sampled from power3.out. The count becomes a ~10-line inline rAF placed right after the element. This fails open by construction, and the existing reduced-motion media query already turns it off. Hold the built grid about 0.9s (a DECISION, printed on its label) before the instant hide. On .ln add padding-bottom .12em and margin-bottom −.12em, and raise the start offset so frame 0 is still masked (110% = 88.9px is less than the 91.1px padded box). Re-probe frame 0.
- **The first words of the H1 fail large-text contrast** [S; juror, family, craft]
  - Evidence: HARD. .hero__h .s1 is #B2B2B2 on #F1F1F1 = 1.88:1 at 86px (38px on phone), under the 3:1 minimum. styles.css:162-174 already records the ramp as a deliberate deviation.
  - Fix: Change the lightest stop to #8A8A8A (3.06:1), giving #8A8A8A→#606060→#2C2C2C→#010101, and mark it DECISION. Put the literal #B2B2B2 in the hero diagram (upgrade 4) instead.
- **The yellow label rule is invisible** [S; juror, family, craft]
  - Evidence: HARD. The .mlabel border-left is 1px #FAFF00 on #F1F1F1 = 1.04:1 (styles.css:142, confirmed).
  - Fix: Delete it; the ▸ already marks the label. Or make it a 0.8px #B2B2B2 hairline.
- **The same Mac shows two different faces depending on the browser** [S; juror, family, craft]
  - Evidence: HARD for Chromium: CDP getPlatformFontsForNode returns HelveticaNeue / HelveticaNeue-Bold (isCustomFont false), because Chrome skips ui-sans-serif (styles.css:51). .mlabel falls back across ArialMT and .SFNS for the ▸/→ glyphs. SOFT, not rendered: Safari and iOS would show SF Pro, and Windows would show Arial.
  - Fix: Stopgap in one line: `font-family: "Helvetica Neue", Helvetica, Arial, sans-serif`. The deliberate choice is in upgrade 5.
- **The biggest number on the page reads as '131 websites' when it counts 131 award rows over 117 sites** [S; family]
  - Evidence: HARD. hero__count (award_rows_studied) sits directly above 'award-winning websites, read as one system of 43 families' (build.mjs:145-154). provenance: 131 = 8 SOTY + 21 category + 102 SOTM rows over 117 sites. The og:description (build.mjs:122, confirmed) and <title> say '131 Awwwards winners'.
  - Fix: Print a generated 10px line under the number, '131 AWARD ROWS · 117 SITES', and fix <title> and og:description to match. Upgrade 4 then draws the distinction.
- **No share image and no favicon on a page meant to be passed around** [S; juror, media]
  - Evidence: HARD. build.mjs:121-122 emits only og:title and og:description (confirmed). There is no og:image, no twitter:card and no <link rel=icon>, so the link unfurls as plain text.
  - Fix: Add a verify.sh Playwright step that captures a 1200x630 hero with the grid overlay on and the count at 131 to dist/og.png. Emit og:image with width, height and alt, plus twitter:card=summary_large_image. Use an inline SVG favicon: one 8x8 #010101 square on #F1F1F1. There are no third-party rights issues.
- **The page can't link to itself, and hides 43-vs-44 and a doubled hedge** [S; narrative]
  - Evidence: HARD. The credits render `<code>swiss-grid-lab</code>` with no href (build.mjs:240, confirmed). The only in-page hash link is '#main', and none of the 43 #f-* ids is linked. provenance.families_without_sweep_cards = ['kinetic-type-studio'], but the page never says 43 here versus 44 in the skill. 6 of the 11 singleton axes print '(predicted, n=1) Predicted…'; that text comes from p4/merged-families.json.
  - Fix: Link to #f-swiss-grid-lab. Add a generated line under the families heading: '44 in the skill; kinetic-type-studio has no sweep cards, so 43 here'. Dedupe the hedge upstream in ~/taste-library's merge so the skill and the page stay one source.
- **The signature Grid control is under its own cited hit size** [S; family, craft]
  - Evidence: HARD. The pill is 61-62x27 at 1440 and 57x24 at 390. Prior swiss-grid-lab#6 says min-height 41px. The header is 51.6px, so enlarging only the pill would push it to about 65px.
  - Fix: Make the whole .top__toggle (the 'Grid:' label plus the pill) the <button>, with min-block-size 41px, and trim .top padding-block to about 5px so the header height doesn't change. Do not add a single-key shortcut (WCAG 2.1.4).
- **'Every motion constant printed beside the thing it drives' is not true yet** [S; craft]
  - Evidence: HARD. The 7 label citations exist only in title= attributes (build.mjs:27), which touch, keyboard and screenshots never show. label.gridBuild is defined (motion-config.mjs:75) but never rendered.
  - Fix: Render the gridBuild label beside the pill. Replace title= with inline numbered notes (1)(2)(3), the family's own Sequencing device, linking to a notes list. Label decisions as DECISION, not as priors.

## Upgrades within the current design

- **1. Flip the whole document to #010101 for the teaching chapter** [M; juror, family, motion, narrative, craft, media]
  - What: When the chapter's first heading crosses 50% of the viewport, toggle html[data-ground='ink'] instantly (duration 0, prior #11/#15) using one IntersectionObserver with about 40-120px of hysteresis. Swap back when #families crosses. Do not pin. Invert the whole token set, not just two tokens: --paper↔--ink, body copy --r3 → #B2B2B2 (9.84:1), chrome --r2 → #B2B2B2, rules → #F1F1F1 at 0.8px, grid bands get their own dark value (DECISION). The sticky header swaps with the tokens; mix-blend doesn't fit its opaque background. Set the thesis sentence at the 86 rank in 3 lines, #F1F1F1→#B2B2B2→#606060, stopping at 3.32:1 and recording the missing #2C2C2C step as a DECISION. Set '1,118' at 264. Allow #FAFF00 only on this ground. Behaviour is the same under reduced motion, because a colour swap is not motion. Add a harness assertion that every text node is ≥4.5:1 while flipped. Scope is an open decision: findings+exhibit (1,219px) or method+findings+exhibit (1,910px, cover → lesson → catalogue).
  - Why: This is the family's own Sequencing rule, and the page never uses it (every surface is #F1F1F1). It is the one frame a visitor would describe afterwards: the page goes black when it admits its own mistakes. It also puts the yellow where the skill says it belongs, which retires the Obys costume on paper.
- **2. 'The web forgets its winners': a static decay grid of all 117** [S; juror, narrative, media, family]
  - What: In #findings, next to the '41 … offline' clause, draw 117 8x8 cells in 9 award-year rows (2018→2026), from families.json only. Live cells are filled; offline cells are a 0.8px outline with a diagonal. Each row has a right-aligned 'x of y' label: 2018 10/14 · 2019 9/13 · 2020 5/15 · 2021 7/15 · 2022 5/13 · 2023 2/14 · 2024 2/14 · 2025 1/13 · 2026 0/6 (year in progress). Add a build-time check against provenance.dead_rate_by_award_era (70/40/11%). Each cell links to #f-<family> and has an aria-label, and there is a hidden table of the counts. The caption says 'awarded design no longer live (rebuilds count)', never 'sites dead'. Fully drawn at first paint; any motion is a one-off on entry.
  - Why: This is the dataset's most repeatable fact (seven in ten 2018-19 winners are gone), reproduced independently by 3 lenses. It is drawn in the family's own vocabulary (markers, hairlines, spec labels) and needs no third-party imagery. S effort for the page's most quotable image.
- **3. A families index plus a live position readout in the header** [S-M; juror, family, motion, narrative, craft, media]
  - What: Open #families with a 43-row spec-table index at the 24px row box, set two-up at ≥1024 (about 600px). Columns: idx | slug | n (live) | budget | years. Every row is an <a href='#f-…'>, and a 'Skip families' link follows the index. Group the index and the blocks into three evidence bands with 10px subheads: 'n≥3 · 18', 'n=2 · 14', 'n=1 · predicted · 11'. Mark the swiss-grid-lab row '← this page'. In the header chrome, replace the aria-hidden rail with a 10px readout, '17/43 · prop-occluded-grotesk', written only when the family changes (one IntersectionObserver). Wrap Credits in <footer>.
  - Why: 86.3% of the page at 1440 (91.4% at 390) is 43 blocks with no way in: 238 tab stops and one hash link. Usability carries 30% of a jury score. The readout also puts the 'constants speak' idea in the one place that is always on screen.
- **4. Draw the 131 in the hero's empty right half** [S-M; family, craft]
  - What: In columns 6-8 (empty from x≈840 to 1170 above the spec table), add an aria-hidden SVG with a text equivalent: 131 square modules, one per award row, clustered by site so the 14 repeat winners visibly share a cluster (117 clusters). Ink = live, #606060 = offline. Add 5 separate outline modules labelled 'not carded'. Each module appears at its i/131 point of the 2.0s count, so number and drawing land together. No per-module links.
  - Why: It fills the half-built 'sentence and diagram share one ramp' move. It draws the rows-vs-sites distinction instead of footnoting it, and puts a second family move into a settled still. The row data exists: members' award arrays sum to exactly 131.
- **5. A type pass: face on purpose, mono for the apparatus, names at their rank** [S; juror, family, craft, motion]
  - What: (a) Self-host one tabular mono with ▸/→ coverage (e.g. IBM Plex Mono or DM Mono from the library's own substitute list) for .mlabel, .spec, .ex__cap and the counters. DESIGN-MOTION.md:24,69 already specified a '10px mono label'. (b) Choose the grotesk from 2-3 rendered options and log it as a DECISION ('this page wears its own recommendation'). Preload it, add size-adjust fallback metrics, and refresh after fonts.ready. (c) Remove text-transform:uppercase and positive tracking from chrome, following the family's type line and the exemplar's title-case spec rows, so tokens print as written. (d) .fam__name at the 31px rank spanning 2/-1 above the spec table; the longest name is 27 characters. Keep h2 at 31, the family's 'one mid rank, two jobs'. (e) Set For/Not-for at copy size with only the labels in 10px caps.
  - Why: Today there is no chosen typeface (a slop tell), family names are body size (17/17px against the thesis), and the Not-for line the page calls 'the part that keeps it honest' is at 10-12px chrome size. This is the cheapest route to an identity a reader remembers.
- **6. Make the constants visibly live** [S-M; juror, family, craft]
  - What: Give each scrubbed label a live field fed through the existing change guards: walk 'OFFSET-PATH 43.1% · STEP 3/6', exhibit t/p, and the header family readout. Add live rows to the hero spec table from getComputedStyle/ResizeObserver: Columns 8 (4 below 720) · Measure 960 · Gutter <px> · Viewport <w>. These sit in ink, not #606060.
  - Why: The page's single original idea (every animation shows its own constants while it runs) is currently built for one readout and set at footnote volume. The layout rows are literally the family's Requires line ('spec tables rendered from the page's own layout values').
- **7. Mark disputed placements** [S; narrative]
  - What: Carry each member's 'disputed' flag from the skill's Evidence line into families.json (bin/sync-data.mjs). Render a 10px 'disputed' tag on member rows and a column in the index, and add one generated sentence: 'In 22 of 43 families the two clustering passes disagreed about at least one member.'
  - Why: The page presents the taxonomy as settled, yet both of swiss-grid-lab's own members are disputed. grep 'disputed' in dist/index.html returns 0. It is cheap, honest uncertainty the data already holds.
- **8. Condense each family block to lead with its most vivid fields** [M; narrative, craft]
  - What: Merge requires, motion_budget, signature_move and nearest from ~/taste-library/p4/family-additions/*.json in sync-data.mjs; vocabulary is already synced but never rendered. Default block: idx + slug at 31, thesis, a 'Signature move' line, Budget and Needs spec rows, For/Not-for, and members. Move Temperature, Type, Motion, Varies-by and Vocabulary into a <details>, set in 14px sentence case, with hex/px/ms/cubic-bezier/power tokens wrapped in <code>. Render Nearest as an anchor to the neighbour. Target about 400px per block (SOFT, the skeptic's estimate).
  - Why: The right half of every block is 12px uppercase prose averaging 87-181 characters per field (172 values over 40 characters, 24,085 uppercase characters). The skill's rebuild made Signature move and Motion budget its lead fields, but the page shows neither.
- **9. Member rows as one ledger on the real columns** [M; craft, family]
  - What: Use fixed tracks or subgrid so columns stop jogging between live and offline rows (award starts at x=545 on live rows vs 529 on offline). Replace the yellow OFFLINE chip with an 8x8 marker: filled = live, hollow = offline, plus 'offline' in #606060. No strikethrough, because 'Nothing was deleted'. On phones, put the site name alone on line 1 (it is currently squeezed to 51px and wraps to 3 lines), then award · awwwards · state on line 2, in a row at least 24px tall.
  - Why: With Grid ON, every cell then lands on a band edge, so the toggle proves the claim. The 41 yellow chips are the loudest marks across 86% of the page, which goes against the family's accent rule. At 390, 146 of 194 targets fail WCAG 2.5.8 spacing.
- **10. A method walk that visits the steps** [M; juror, motion, craft, family]
  - What: Set .steps to 3+3 at ≥720px to remove the 4+2 orphan row. Build the offset-path through the six marker centres: row 1 left to right, a carriage return through the gutter drawn as a 0.8px hairline, then row 2 left to right. Use held stops (60% travel, 40% hold) and set li[data-passed] so each marker fills as the dot passes. Below 720px, a vertical spine. Rebuild in the existing ResizeObserver (app.js:28-35).
  - Why: DESIGN-MOTION §2 specified this and it never shipped. Today the square walks a flat rule above only 4 of the 6 steps, mostly off screen. Travel along a real route is the family's measured motion mechanism.
- **11. Each family draws its own house curve** [M; motion, juror, family]
  - What: At build time, generate a 64x40 glyph per family from its validated easing prior in the skill (27 of 44 family files carry one), printing the prior ID and verdict. Families without one get an explicit 'NO EASING PRIOR' flat line. As each family crosses 85%→35% of the viewport, an 8x8 marker rides (t, ease(t)) using QF1's honest placement. Delete the 289 identical y:12 fade-ups, which also removes QF6. Resync families.json with the skill (43 vs 44) first.
  - Why: It replaces the most template-like reveal on the page with motion that is the subject itself. The 43 blocks then differ because of their own data, which meets the family's HIGH budget without animating copy.
- **12. Keep the 1024 ratios above 1024 (last)** [S; craft]
  - What: In styles.css:33-39, scale chrome, copy, rank, display, mega, measure and gutter together from 1024 up to a 1440 cap (e.g. --t-chrome clamp(10px,.98vw,14px), --measure clamp(960px,93.75vw,1350px)), and scale .grid-overlay with them.
  - Why: At 1440 the page is a 900px column with 240px margins, and the 10-12px chrome that carries most of the data would render about 14px, as in the exemplar. Do it after upgrades 3 and 9: the 1440 page grows about 9% (SOFT estimate) and every range must be re-measured.

## Directions

### 1. Chapters: the argument and the archive [L]

Do what the family's Sequencing line literally says ('long scroll pages as chapters'). Split the page into a story read once (index.html, about 5-7k px, SOFT estimate) and a reference used for lookup (families.html, index plus condensed blocks, attribution unchanged). The story runs in the order the evidence happened, failure first: what was studied, what broke, whether the skill works, and this page as its own evidence. The imagery is the experiment's own blind-test builds, so there are no rights questions. Every figure is still generated.

Moves:
- 00 Hero: keep the 131 and the ramp. Replace the 11-row spec table with a 10px chapter index, each row an anchor carrying one number, e.g. '02 What broke | 1,118 defects' and '03 The test | 0–2, then 1 clear + 1 toss-up'. The hero spec rows move to the top of families.html.
- 01 The sweep: the method becomes a yield funnel along the walk (131 rows → 117 cards → 43 families → 2,289 entries → 1,118 findings → 730 priors), plus the static decay grid (upgrade 2).
- 02 What broke, on a whole-document #010101 flip (upgrade 1). The thesis sentence is at the 86 rank and 1,118 at 264, counting in view. Three dated case files from ~/taste-library/DECISIONS.md follow as (1)(2)(3) notes with 10px spec tables: 262 constants DEAD and 'completely inert'; the gate checked that a citation existed, and 1% of 356 lines were usable; the zentry 'fix' was rejected.
- 03 The test: a triptych per brief (Kiln & Quire, Gale), with OFF · V1 · V2 4:3 stills side by side. Each still has a spec table: date, judges, score vs baseline, margin. Include the row 'baseline, same file both days: 46 → 40.8'. Use the Skill: pill only below 768. The six eval HTMLs are published under /evals/ in a 'test build · fictional brief' frame. Scores come from evals/*/results.json through sync-data and are never typed.
- 05 This page: the v1 rejection and the Motion-budget field it produced; the corrected exhibit (QF1); and the current swiss-grid-lab entry rendered from the skill with a follows/deviates/DECISION column. Today that column would honestly show #FAFF00-on-paper and the missing flip.

Signature moment: The ground cuts to black at 'What broke' and the 264px '1,118' counts up in view. Then chapter 03 shows the skill losing its first blind test 0–2 before the rebuild wins one clearly and ties one.

Risks: The result is n=2 briefs with one builder run each, and judge drift equals about half the Gale 'win' (5.2 of 10.7 points). Unless that caveat sits in the same table as the scores, it reads as marketing. The Kiln v2 'win' is a 47.67 vs 47.5 toss-up and must be labelled that way. Quoting Ryan's own words ('no hint of awwwards at all') needs his OK. Two pages split the attribution/SEO surface and need shared header nav (a spec-table nav, not an Obys slash nav). The eval pages carry the judges' known mobile bugs and must be framed as test builds. The 5-7k px estimate is SOFT.

### 2. The winners, measured [L]

Answer 'no hint of awwwards' with the 117 winners themselves, shown the way this family allows: as dated, measured exhibits, not a gallery. Use our own Playwright captures of the 76 live winners (headless WebGL verified on igloo.inc under ANGLE Metal) and Wayback renders of the 41 offline ones. Where nothing survives, show an empty hairline frame. Each palette is then tested against the image it came from.

Moves:
- Media contract before any image: a media object on catalog rows (key, sha256, w, h, source, captured) and credit.{studio, source}, backfilled from existing card prose. Extend the FATAL gate at build.mjs:267 to require credit, source_url and captured. Publish only captures, never the harvested .drc/.ktx2/.ogg/textures, whose MANIFESTs say private. Set immutable Cache-Control on R2.
- Families become index rows: a 4:3 thumbnail in cols 2-3, name, thesis and Not-for in cols 4-7, members·live in col 8. The spec table, For and the member list sit behind hidden=until-found, and a hash handler opens #f-* on load. Measured mock: #families about 12.9k px at 1440, vs 23,830.
- Offline winners resolve in order: a Wayback render at the award timestamp (id_ URL), classified RENDERED, RENDERED-FONT-SUBSTITUTED or NO CAPTURE; otherwise an empty 597:448 frame with a 0.8px diagonal. Never a stand-in image.
- Measured palette markers on the expanded exhibit: place a hex only where it covers ≥1% of the frame at Δ≤6, and print the share ('#6A6F7D · 5.2% of frame'). Everything else is 'DECLARED · App3D-f554a111.js' or 'NOT IN THIS FRAME'. Print the null baseline once (a random family's palette covers <0.3%). The naive nearest-pixel test is not discriminating: 133 of 297 foreign hexes 'matched'.
- Optional: click-to-play 4s captures for 3-4 motion-defined families (slat-reel-strip, scrubbed-product-cinema, carved-ice-mono), recorded with CDP screencast at 60fps rather than recordVideo (measured 25fps), each dated.

Signature moment: A contact sheet opens the families chapter: 117 frames in award order, where the 2018-19 columns are mostly empty struck frames and 2025-26 are nearly all full. The archive visibly disappears from left to right, and every frame is a real, credited row.

Risks: The Awwwards terms prohibit reproducing site material (text HARD, legal effect SOFT), so this uses our own captures only unless Ryan rules otherwise. A live capture shows today's build, not the awarded one, so every caption needs a date, and captures go stale. Wayback renders of WebGL builds are often blank (umami-land rendered dark), so many offline rows will be NO CAPTURE. It takes 117 captures plus a human check. About 5MB of lazy weight (SOFT). The Internet Archive's reuse terms are unverified.

### 3. The self-drawing instrument [M-L]

Stay one page and add no third-party imagery. Make the apparatus do all the showing: every constant the page prints is live and provably true, the page prints its own layout values, and each of the 43 families draws its own house easing curve as you pass it. The page becomes a working instrument for reading motion.

Moves:
- Upgrade 11: a per-family curve glyph from the skill's validated easing priors, with prior ID and verdict, or an explicit 'NO EASING PRIOR' line. The marker rides (t, ease(t)). The 289 copy fade-ups are deleted.
- The exhibit becomes the page's own curve census: power3.out ×293, power3.inOut ×1, none × the scrubs, CSS ease-out 120ms hovers. Beside it goes the family census, which the family lens cites as 'linear 510 · ease-out 101 · cubic-bezier 0', plus a DECISION: 'this page runs power3; the family runs stock CSS curves'.
- Live labels in a self-hosted mono (upgrades 5 and 6), the header readout '17/43 · slug', and live layout rows in the hero.
- The hero's 131-module diagram (upgrade 4) and the method walk through held stops (upgrade 10).
- The whole-document ink flip for the teaching chapter (upgrade 1).

Signature moment: Scrolling the families, each block draws its own curve and a square rides it at that family's real ease, with the prior ID printed beside it. 43 blocks differ because of their own data.

Risks: It still shows no picture of any winner, so it may not answer Ryan's 'no hint of awwwards' rejection. Motion drawn on top of more apparatus can read as engineering dataviz rather than award design. Only about 27 of 44 family files carry an easing prior, so many blocks show 'NO EASING PRIOR'. Needs the 4× CPU jank re-run and a families.json resync (43 vs 44) first.

## Keep

- The load-bearing 8-column CSS Grid behind a real <button aria-pressed> Grid toggle with an instant (duration 0) swap and remembered state. On desktop the overlay matches content edges exactly (family lens measured cols [270-356]…[1084-1170]). Fix phones (QF4), but keep the move. (juror, family, craft, media)
- The 264px '131' opener and the four-line ramp headline as ideas. Change only line 1's value (QF9) and label rows vs sites (QF12). (all lenses)
- The load construction: grid bands building over the ticking count (juror/d-000-load-300ms.png), with masked line rises at 0.8s power3.out and the 2s power3.inOut count. Remove the flash and hold the grid; do not cut it. (juror, motion)
- The rule that every figure is generated from provenance.json and labels come from the same MOTION object the runtime uses, plus the build-time FATAL on missing attribution (build.mjs:267). Extend it to the exhibit, the eval scores and any media. (all lenses)
- Per-member attribution rows: site link, awwwards link, live/offline state. The public-media decision rests on them. (juror, narrative, media)
- The findings sentence 'the code we wrote about other people's code was the least reliable thing in the library', the 'Nothing was deleted' ethic, and the For / Not for lines. (juror, narrative, family)
- The reduced-motion path that returns before any library import and sets final values, and the static page as a complete fallback if the CDN fails. Fix the exhibit readout in that branch (QF1). (all lenses)
- The performance architecture: one Lenis on the GSAP ticker with lagSmoothing(0), change-guarded DOM writes, cached element refs. Delete the unused :root write (QF7) and cap new triggers at about 4. (motion, juror)
- The flat #F1F1F1/#010101 ground, 0.8px structural rules, 8x8 square markers, spec tables as ornament carrying real figures, and kebab-case slugs as headings (they are the skill's citation IDs). (family, narrative, juror)
- Width-stable padded tabular numerals, offset-path travel with offset-rotate 0deg, and walkFit() resizing. (motion, family, craft)
