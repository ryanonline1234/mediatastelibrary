# Motion redo — direction and choreography score

_Fable-level design work, 2026-08-14. Implementation is a separate (Opus)
phase and MUST load the `awwwards-motion` skill before writing any motion
code — this document says WHAT moves and WHY; that skill owns HOW._

## What v1 got wrong

v1 passed every honesty gate and failed the experience bar. It read
swiss-grid-lab's "stock easings only" as "no motion," shipped zero
choreography, and became a printed poster of a lab rather than a lab.
The family's own exemplar (grids.fm) animates its apparatus: curves draw,
keyframe markers travel, the grid constructs. Family fit was right;
the reading of the family was cowardly.

## The concept: the page performs its own spec

Keep swiss-grid-lab, but take its axis of variation at BOTH poles at once:
the grid is load-bearing (v1's win — keep it) AND the apparatus is alive
(the grids-exemplar pole v1 ignored). The one-line concept:

> **Every animation on this page displays its own constants while it runs.**

When the hero lines rise, a 10px mono label beside them reads the actual
transform and ease. When a rule draws across a section boundary, its length
ticks up in design-px. When the bezier ornament eases, its handles and the
easing name are drawn beside it. The page is a motion spec sheet that
demonstrates itself — which is the only kind of showmanship this subject
can wear honestly, and no template site can imitate it without becoming us.

This also answers the "AI can't do feel" critique IN the page: the motion
constants shown are the cited priors, with their family names. The
choreography is an exhibit of the dataset.

## Constraints carried from the family (unchanged)

- Palette #F1F1F1/#010101, accent #FAFF00, ramp #B2B2B2→#606060→#2C2C2C.
- CSS transitions stay linear/ease-out only (the family ships zero
  cubic-bezier in CSS). GSAP work uses named stock eases — scrubbed tweens
  are `ease:'none'` per the validated rule (a scrubbed tween with no ease is
  NOT linear; this is a stage-4 confirmed trap).
- Two rule weights: structural 0.8px, ornamental 1px. 8×8px square markers.
- Type scale 10/14/31/86/264 design-px on a 1024 artboard. v1 never used the
  264 rank — the redo does (see Score §1).

## The score

Section by section. Every constant is either CITED (family — source) or
marked DECISION. Implementation copies these values, not its memory.

### 0. Global scroll
- Lenis smooth scroll, TIME-BASED mode: `duration` present, NO `lerp` key
  in the same config (lerp+duration is the documented dead-key hazard from
  the library's kinetic-type-studio correction; a config carrying both
  teaches nothing). Duration DECISION: 1.0s with the default easing —
  awwwards-motion owns the final value.
- All scroll choreography via ScrollTrigger scrub against transforms only
  (translate/scale/clip-path — compositable properties).
- **Reduced-motion gate, the real kind:** `prefers-reduced-motion` destroys
  Lenis, kills every ScrollTrigger, and shows the v1 static layout — which
  we know is complete, because it shipped. v1 becomes the reduced-motion
  build. Nothing keeps drawing.

### 1. Hero: the count and the construction
- Open on the 264px rank v1 never used: the number **131** alone at
  `--t-mega`, tabular, ink on paper. It counts 0→131 in ~1.2s using the
  count-up technique from acid-scrawl-telemetry's corrected block —
  width-stable numerals (the pad-preserving fix; the buggy toLocaleString
  version is a DO-NOT-COPY in the library). Beside it, 10px mono spec label:
  `COUNT 0→131 · POWER2.OUT · 1.2S` (label content = actual tween config,
  generated, not typed).
- The 86px ramp headline lines rise under clip with
  `translateY(150%)` + per-line delay ladder — CITED:
  overscale-grotesk-whiteout, verified `translateY(150%)` + `-delay1..15`.
  Ease power2.out (GSAP stock). Spec label beside line 1 shows it.
- The 8-column grid overlay CONSTRUCTS on load: columns scaleY from top,
  60ms stagger, linear, ~400ms total, then the ON/OFF pill flips itself to
  ON and the label pulses accent once. The page opens by building its own
  grid, then hands the toggle to the reader. DECISION (no prior carries a
  grid-construction timing; say so on the label).
- Spec table rows: structural rules draw scaleX left→right, 40ms stagger on
  enter; numbers settle with the same width-stable count-up.

### 2. Method band: the offset-path walk
- The family's measured motion line says travel-via-offset-path. The six
  method steps connect with a drawn 0.8px path; an 8×8 ink square TRAVELS
  the path, scrubbed by scroll (ease:'none'), pausing at each step as it
  enters. CITED mechanism: swiss-grid-lab motion line ("travel via
  offset-path not transform; delay = held first keyframe stop").
- Each step's square marker fills accent #FAFF00 as the traveler passes.

### 3. Findings band: the honest numbers
- The four finding stats scrub-count as the band crosses the viewport
  center. The 1,112-defects figure lands last, and its spec label reads the
  library's own verdict format: `provenance: verbatim · effect: effective`.
- The accent-highlighted phrases get the clip-inset reveal chased by an
  accent bar (CITED: acid-scrawl-telemetry, the half-overlap bar-chase
  reveal, its corrected version).

### 4. Families index: 43 sections
- Per section on enter: index numeral rises (same clip ladder), the 0.8px
  family rule draws scaleX, swatches stagger-in scale 0→1 (30ms), members
  list rules draw. All ≤500ms, power2.out, ONE time per section (no
  re-trigger on reverse — restraint is the family).
- Hover on a family name paints the accent behind it (CSS, ease-out 120ms,
  with :focus-visible twin — v1's rule, kept).
- DECISION: no per-family motion quoting (43 different motions = a zoo;
  the family register is uniform apparatus).

### 5. The bezier exhibit (one signature moment)
- Between findings and families: a full-measure drawn curve with grabbable-
  looking handles and 8×8 markers (CITED ornament: swiss-grid-lab's sibling
  drafting kit — bezier handles, keyframe diamonds #c5dbff). A dot travels
  the curve on scrub; beside it, live labels print position/progress. The
  exhibit's caption states plainly: "the easing this page uses, drawn."
- This is the one WebGL-free 'wow' and it is entirely on-subject.

### 6. What stays out — and why
- No WebGL, no shaders, no particles: the subject carries no scene, and
  faking one is the pastiche the skill's Not-for warns about. The
  archival-particle swarm remains blocked on real imagery (R2 uploads).
- No page transitions (single page), no custom cursor (nothing to grab —
  cursor tricks without a manipulable object are costume; the one drag
  candidate, the bezier handles, may earn a cursor AFTER the harness pass
  if implementation makes them actually draggable — deferred, not decided).

## QA gates (the sensory feedback loop)

Implementation is not done when it compiles. It is done when:
1. `awwwards-motion`'s capture harness runs its shape probes on the hero
   rise, the count-up, and the traveler — and the measured curves match the
   cited eases (the harness catches a wrong ease; endpoint checks cannot).
2. A LoAF/jank pass at 4x CPU throttle shows no long frames during scrub.
3. The reduced-motion run is pixel-identical to v1's static build and
   registers ZERO rAF ticks after load (the stage-4 fake-guard detector).
4. Keyboard walk: every interactive element reachable, :focus-visible
   visible, no scroll-jack without keyboard path.
5. Spec labels are GENERATED from the tween configs at build/runtime —
   a label that could drift from the real constant is the exact defect
   class this library exists to kill.

## Handoff

Opus phase: load `awwwards-motion`, implement this score over the existing
v1 markup (the DOM mostly survives; this is a layer, not a rewrite), run
the harness, iterate until the gates pass, redeploy. Do not invent
constants: anything not cited here and not in the skill's priors gets a
DECISION mark and a spec label that says so.
