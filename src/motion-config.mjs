// SINGLE SOURCE OF TRUTH for every motion constant on the page.
//
// build.mjs renders these into (a) the on-screen spec labels and (b) a JSON
// block the runtime parses. The label and the tween therefore cannot drift —
// which matters more here than anywhere, because this page's entire claim is
// that its displayed constants are real. A label that could go stale is the
// exact defect class the library exists to kill.
//
// Every value is CITED from the awwwards-taste / awwwards-motion priors, or
// marked DECISION. Nothing is remembered.
//
// Feel row: SNAPPY / TECHNICAL (motion-priors §8) — chosen because its
// signature move is literally "monospace counters, steps() reveals, hard-cut
// section joins", which is swiss-grid-lab's apparatus in motion terms.

export const MOTION = {
  scroll: {
    lerp: 0.15,
    cite: 'motion-priors §8 snappy/technical — Lenis lerp 0.15 (λ 9)',
    // §2.2: lerp and duration are mutually exclusive. lerp mode = constant
    // weight, which is what nearly every award site ships. NO duration key.
  },

  ease: {
    reveal: 'power3.out',
    cite: 'motion-priors §8 snappy/technical reveal ease',
    scrub: 'none',
    scrubCite: '§8 cross-cutting — scrubbed tweens are ALWAYS ease:"none"',
  },

  heroLines: {
    yPercent: 110,
    duration: 0.8,
    stagger: 0.08,
    ease: 'power3.out',
    cite: 'Osmo/Codrops masked-line recipe (yPercent 110→0 under overflow:clip, 0.8s, 0.08 stagger); ease from the snappy row, one ease family per site',
  },

  count: {
    duration: 2.0,
    ease: 'power3.inOut',
    cite: 'Trionn odometer — code/kinetic-type-studio: duration 2, power3.inOut. §4.2: the number IS the content',
  },

  gridBuild: {
    stagger: 0.06,
    duration: 0.4,
    ease: 'none',
    cite: 'DECISION — no prior carries a grid-construction timing. Linear because the grid is a measuring instrument drawing itself, not an object arriving.',
  },

  section: {
    duration: 0.5,
    staggerAmount: 0.4,
    ease: 'power3.out',
    cite: 'motion-priors §8 snappy — sections 0.5s, stagger amount 0.4 clamp (§6.4: budget the cascade, not the item)',
  },

  scrub: {
    value: 0.6,
    cite: 'scroll-architecture §6.1 sticky stage — scrub 0.6',
  },

  hover: {
    durationMs: 120,
    ease: 'ease-out',
    cite: 'swiss-grid-lab measured motion: 510 linear + 101 ease-out, ZERO cubic-bezier in CSS',
  },
}

// Rendered next to the thing it drives. Short enough for a 10px chrome label.
export const label = {
  heroLines: `LINES · Y110→0 · ${MOTION.heroLines.ease.toUpperCase()} · ${MOTION.heroLines.duration}S · STAGGER ${MOTION.heroLines.stagger}`,
  count: `COUNT 0→131 · ${MOTION.count.ease.toUpperCase()} · ${MOTION.count.duration}S`,
  gridBuild: `GRID BUILD · SCALEY · LINEAR · STAGGER ${MOTION.gridBuild.stagger}`,
  walk: `OFFSET-PATH · SCRUB ${MOTION.scrub.value} · EASE NONE`,
  findings: `SCRUB ${MOTION.scrub.value} · EASE NONE · WIDTH-STABLE NUMERALS`,
  exhibit: `SCRUB ${MOTION.scrub.value} · DOT LINEAR IN SCROLL · CURVE = ${MOTION.ease.reveal.toUpperCase()}`,
  section: `SECTION · ${MOTION.section.ease.toUpperCase()} · ${MOTION.section.duration}S · STAGGER AMOUNT ${MOTION.section.staggerAmount}`,
  scroll: `LENIS LERP ${MOTION.scroll.lerp} · NO DURATION KEY`,
}
