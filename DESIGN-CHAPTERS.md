# Chapters — direction 1, with the best of 2 and 3 (2026-09-24)

Ryan: "go ahead with quick fixes and set up for direction 1, but consider
working in some elements of the other directions because our site should be
impressive too." Source critique: DESIGN-CRITIQUE.md. Quick fixes shipped in
f3e4bf1. This is the design; the build follows it.

## Brief, in the skill's terms

- **Family:** swiss-grid-lab (unchanged). Motion budget **HIGH** — "Restraint =
  curve set, not volume". Sequencing: "long scroll pages as chapters; teaching
  pages flip the whole ground to #010101, not a section; spreads pair spec
  tables with 31px notes numbered inline (1)(2)(3)". Signature move: the Grid
  pill (kept).
- **Subject-native device:** this experiment has its own evidence — counts, a
  decaying archive, a validated easing record per family, and a blind test it
  first lost. The page shows the evidence drawn as apparatus, not described.
- **No third-party imagery.** The only pictures are pages this project built
  (the six blind-test pages). Screenshots of award winners wait on Ryan's
  rights decision (Awwwards terms prohibit reproducing site material).

## Two pages

`index.html` — the argument, read once, in the order the evidence happened:

| # | chapter | ground | what is drawn | scrubbed effect |
|---|---|---|---|---|
| 00 | hero | paper | 264px count; 131 award-row modules fill as it counts (dir 3: the page prints its own data); chapter index as a spec table of anchors, one number each | count departs |
| 01 | The sweep | paper | the walk now VISITS the six steps (held stops), each step carrying its yield (131 → 117 → 43 → 2,289 → 1,118 → 730); **the contact sheet** (dir 2, as data): 117 frames by award year, each tinted from the site's declared palette, offline frames struck through — the archive visibly disappears toward 2018 | walk; contact-sheet rows |
| 02 | What broke | **ink** | whole-document flip; the thesis sentence at the 86 rank, highlighted as read; 1,118 at 264px counting in view; three dated case files (1)(2)(3) | highlight |
| 03 | The test | paper | per brief a triptych — baseline · skill v1 · skill v2 — as stills of our own pages, each opening the real page; score bars drawn to scale; caveats in the same table (n=2, one build each, judge drift on the same baseline file) | score bars |
| 04 | The families | paper | the 43-row index; every row draws its family's validated easing curve (dir 3), with the record ID; a marker rides it at that family's real ease on hover/focus; rows link into the archive | — (index reveal) |
| 05 | This page | **ink** | the exhibit (the curve this page runs); the page audited against its own family: follows / deviates / DECISION | exhibit dot |

`families.html` — the archive, used for lookup: same index, then condensed
family blocks (signature move, motion budget, needs, curve glyph, swatches,
For / Not for, members as a ledger with filled/hollow markers and disputed
tags; the long Temperature / Type / Motion / Varies lines in a Full-spec
disclosure). Header shows the live position ("17/43 · slug").

## Signature moments (two, per awwwards-motion)

1. **Load:** the grid builds, the count ticks, and the 131 modules fill in
   step with it — the apparatus assembling its own subject.
2. **The flip into 02:** the ground cuts to ink full-bleed and the header
   follows (duration 0, swiss-grid-lab#11) as "What broke" reaches
   mid-viewport, and 1,118 counts at the 264 rank. (Built first as a
   whole-document token swap; that restyled every element, 50-220ms per flip,
   and failed the reduced-motion jank floor — so the neighbouring chapter now
   stays paper. Logged as a DECISION in the page's self-audit.)

Everything else is apparatus drawing itself (walk, contact sheet, bars,
glyphs) and stays quiet: stock-curve families, no pinning, no scroll-jacking.

## Type (DECISION)

Host Grotesk (text + display; its footed 1 reads like a spec numeral at 264px)
+ IBM Plex Mono for the apparatus (labels, spec tables, readouts). Chosen by
rendering the hero in Host / Hanken / Schibsted Grotesk; Hanken was cleaner
but generic. Google Fonts, display=swap.

## Constants (cited or DECISION)

- Flip: instant swap, `{"duration": 0}` — swiss-grid-lab#11; ground/ink
  `#F1F1F1 / #010101` — swiss-grid-lab#15; dark pages "swap the two wholesale".
- Rules 0.8px structural / 1px ornamental — swiss-grid-lab#3/#7; row box 24px — #14.
- Markers 8x8 (entry Vocabulary); overlay bands rgba(86,86,86,.1) — #2.
- Held stops for the walk: "delay = held first keyframe stop" (entry Motion
  line; #8's 86.36% is the exemplar's ratio — here DECISION: 60% travel /
  40% hold per step).
- Reveal ease power3.out, section 0.5s / stagger amount 0.4, scrub 0.6 —
  motion-priors §8 snappy/technical (unchanged).
- Family glyph eases: each family's own validated record (`<family>#N`),
  drawn by sampling the parsed function; hover marker uses CSS `linear()`
  sampled from the same function.
