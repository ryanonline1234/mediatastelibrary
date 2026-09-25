/* mediatastelibrary.page — motion layer (both pages)
 *
 * Architecture is awwwards-motion/references/scroll-architecture.md §1.1
 * verbatim: ONE Lenis, autoRaf false, driven by the GSAP ticker, lagSmoothing(0).
 * Every scrubbed effect derives from ONE scrubbed proxy tween mapped against
 * scene ranges MEASURED from the built page (bin/sync-spec.mjs): a scene runs
 * from when its section enters at 85% of the viewport to when the next one does.
 *
 * Every constant comes from the MOTION block the generator emits (#motion-config)
 * — the same object that printed the visible spec labels.
 *
 * PROGRESSIVE ENHANCEMENT: the static build is complete on its own. If the CDN
 * fails, the module throws, or JS is off, the page is still whole. Motion is
 * added to a working page, never required by it.
 */

const cfgEl = document.getElementById('motion-config')
const M = cfgEl ? JSON.parse(cfgEl.textContent) : null
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ------------------------------------------------------------------ */
/* grid toggle — plain DOM, no dependency, runs even if GSAP never loads */
/* ------------------------------------------------------------------ */
;(function gridToggle() {
  var KEY = 'mtl:grid'
  var btn = document.querySelector('[data-grid-toggle]')
  var overlay = document.querySelector('[data-grid]')
  if (!btn || !overlay) return
  function paint(on) {
    overlay.hidden = !on
    btn.setAttribute('aria-pressed', String(on))
    btn.querySelector('.pill__tx').textContent = on ? 'ON' : 'OFF'
  }
  var stored = null
  try { stored = localStorage.getItem(KEY) } catch (e) {}
  paint(stored === '1')
  btn.addEventListener('click', function () {
    var on = btn.getAttribute('aria-pressed') !== 'true'
    paint(on)
    try { localStorage.setItem(KEY, on ? '1' : '0') } catch (e) {}
  })
  window.__mtlGrid = paint
})()

/* ------------------------------------------------------------------ */
/* the ground flip — swiss-grid-lab Sequencing: teaching pages flip the */
/* ground to #010101. Ink chapters paint it full-bleed themselves (with */
/* or without JS); this flags html[data-flip] so the header and grid   */
/* overlay follow, instantly ({"duration": 0}, swiss-grid-lab#11). A   */
/* state swap, not motion, so it runs under reduced motion too.        */
/* ------------------------------------------------------------------ */
;(function groundFlip() {
  const inks = [...document.querySelectorAll('[data-ground="ink"]')]
  if (!inks.length || !('IntersectionObserver' in window)) return
  const on = new Set()
  // a one-pixel line across the middle of the viewport: no flicker, no hysteresis needed
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? on.add(e.target) : on.delete(e.target)
    const want = on.size ? 'ink' : null
    if ((document.documentElement.dataset.flip || null) !== want) {
      if (want) document.documentElement.dataset.flip = want
      else delete document.documentElement.dataset.flip
    }
  }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 })
  inks.forEach((el) => io.observe(el))
})()

/* ------------------------------------------------------------------ */
/* the walk: an offset-path routed THROUGH the six step markers, with  */
/* held stops (entry Motion line: "delay = held first keyframe stop"). */
/* Geometry is measured, because offset-path is in CSS px of the       */
/* containing block — a fixed 960-unit path overflowed phones by 586px.*/
/* ------------------------------------------------------------------ */
const walk = (function walkGeometry() {
  const box = document.querySelector('[data-motion="method-walk"]')
  if (!box) return null
  const dot = box.querySelector('.walk__dot')
  const path = box.querySelector('.walk__path')
  const steps = [...box.querySelectorAll('.steps li')]
  const state = { L: [0], reached: -1 }
  function measure() {
    const o = box.getBoundingClientRect()
    // each marker sits on its step's top rule (li::before), so the square
    // rides the rules and never crosses the text
    const pts = steps.map((li) => {
      const r = li.getBoundingClientRect()
      return [r.left - o.left + 4, r.top - o.top]
    })
    const gap = parseFloat(getComputedStyle(box.querySelector('.steps')).columnGap) || 24
    // a new row: step back into the gutter, go down it, then along the next
    // row's rule — never through a column of text
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
    const L = [0]
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i]
      let len
      if (Math.abs(ay - by) < 4 || Math.abs(ax - bx) < 4) { d += ` L${bx.toFixed(1)} ${by.toFixed(1)}`; len = Math.hypot(bx - ax, by - ay) }
      else {
        const gx = ax - 4 - gap / 2
        d += ` L${gx.toFixed(1)} ${ay.toFixed(1)} L${gx.toFixed(1)} ${by.toFixed(1)} L${bx.toFixed(1)} ${by.toFixed(1)}`
        len = Math.abs(ax - gx) + Math.abs(by - ay) + Math.abs(bx - gx)
      }
      L.push(L[i - 1] + len)
    }
    path.setAttribute('d', d)
    dot.style.offsetPath = `path("${d}")`
    state.L = L
    place(state.p ?? 0, true)
  }
  function place(p, force) {
    state.p = p
    const legs = state.L.length - 1
    if (legs < 1) return
    const u = Math.min(p, 0.99999) * legs
    const leg = Math.floor(u), f = u - leg
    const travel = M ? M.walk.travel : 0.6
    const k = f < travel ? f / travel : 1
    const dist = p >= 1 ? state.L[legs] : state.L[leg] + (state.L[leg + 1] - state.L[leg]) * k
    dot.style.offsetDistance = `${dist.toFixed(1)}px`
    const reached = p >= 1 ? legs : leg + (k >= 1 ? 1 : 0)
    if (reached !== state.reached || force) {
      steps.forEach((li, i) => li.classList.toggle('is-on', i <= reached))
      state.reached = reached
    }
  }
  measure()
  if (window.ResizeObserver) new ResizeObserver(() => measure()).observe(box)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure)
  return { place }
})()

/* ------------------------------------------------------------------ */
/* the archive: live position readout in the header                    */
/* ------------------------------------------------------------------ */
;(function readout() {
  const out = document.querySelector('[data-readout]')
  const fams = [...document.querySelectorAll('.fam[data-fam]')]
  if (!out || !fams.length || !('IntersectionObserver' in window)) return
  const total = String(fams.length).padStart(2, '0')
  let last = ''
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      const s = `${e.target.dataset.fam.replace(' · ', '/' + total + ' · ')}`
      if (s !== last) { out.textContent = s; last = s }
    }
  }, { rootMargin: '-35% 0px -60% 0px', threshold: 0 })
  fams.forEach((f) => io.observe(f))
})()

/* ------------------------------------------------------------------ */
/* motion                                                              */
/* ------------------------------------------------------------------ */
async function boot() {
  if (!M) return
  if (reduced) {
    // The real reduced-motion path: no Lenis, no ScrollTrigger, nothing
    // scheduled. Every scrubbed variable goes to its END state so the static
    // page is COMPLETE, and we return before any library loads.
    document.querySelectorAll('[data-motion]').forEach((el) => {
      for (const v of ['--walk', '--sheet', '--find', '--bars', '--draw', '--t', '--fam']) el.style.setProperty(v, '1')
    })
    if (walk) walk.place(1)
    placeExhibitDot(1)
    document.querySelectorAll('[data-count-to]').forEach((el) => { el.textContent = fmt(Number(el.dataset.countTo), el.dataset.countPad) })
    document.body.setAttribute('data-motion-state', 'reduced')
    return
  }

  let gsap, ScrollTrigger, Lenis
  try {
    ;[{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
      import('https://cdn.jsdelivr.net/npm/gsap@3.13.0/+esm'),
      import('https://cdn.jsdelivr.net/npm/gsap@3.13.0/ScrollTrigger.js/+esm'),
      import('https://cdn.jsdelivr.net/npm/lenis@1.3.11/+esm'),
    ])
  } catch (e) {
    document.body.setAttribute('data-motion-state', 'unavailable')
    document.documentElement.classList.remove('mtl-wait')
    if (walk) walk.place(1)
    return
  }

  gsap.registerPlugin(ScrollTrigger)
  document.documentElement.classList.add('mtl-motion')
  document.querySelectorAll('.fam').forEach((s) => s.setAttribute('data-rv', ''))

  /* -- scroll-architecture §1.1, the whole integration -- */
  const lenis = new Lenis({ autoRaf: false, lerp: M.scroll.lerp })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  window.lenis = lenis   // the capture harness drives scroll through this

  /* -------------------------------------------------- global progress -- */
  const scenes = M.scenes || {}
  const local = (p, id) => {
    const r = scenes[id]
    if (!r) return 0
    return Math.min(1, Math.max(0, (p - r[0]) / (r[1] - r[0])))
  }
  // Every node resolved ONCE (a jank pass once measured 10x cost from lookups
  // inside onUpdate).
  const q = (s) => document.querySelector(s)
  const heroCount = q('[data-motion="hero-count"]')
  const sheetEl = q('[data-motion="sheet"]')
  const markEl = q('[data-motion="findings-mark"]')
  const barsEl = q('[data-motion="test-bars"]')
  const drawEl = q('[data-motion="glyphs"]')
  const dotEl = q('[data-motion="exhibit-dot"]')
  const railEl = q('[data-motion="archive-rail"]')
  const walkEl = q('[data-motion="method-walk"]')

  let lastP = -1
  const setV = (el, name, v, prev) => {
    if (!el) return prev
    const s = v.toFixed(3)
    if (s !== prev) el.style.setProperty(name, s)
    return s
  }
  let pWalk, pSheet, pFind, pBars, pDraw, pT, pFam

  // No :root write: a per-frame custom property on <html> invalidated style
  // for the whole document (~94% of style-recalc time during scroll).
  function applyAll(p) {
    if (p === lastP) return
    lastP = p
    if (heroCount) heroCount.style.transform = `translateY(${(-60 * local(p, 'hero')).toFixed(2)}px)`
    const w = local(p, 'sweep')
    pWalk = setV(walkEl, '--walk', w, pWalk)
    if (walk) walk.place(w)
    pSheet = setV(sheetEl, '--sheet', local(p, 'sheet'), pSheet)
    pFind = setV(markEl, '--find', local(p, 'broke'), pFind)
    pBars = setV(barsEl, '--bars', local(p, 'test'), pBars)
    pDraw = setV(drawEl, '--draw', local(p, 'fams'), pDraw)
    const t = local(p, 'self')
    pT = setV(dotEl, '--t', t, pT)
    placeExhibitDot(t)
    pFam = setV(railEl, '--fam', local(p, 'archive'), pFam)
  }

  // scrub smooths an ANIMATION's playhead; a proxy tween makes SCRUB 0.6 real.
  const proxy = { p: 0 }
  gsap.to(proxy, {
    p: 1, ease: 'none',
    scrollTrigger: {
      start: 0, end: () => ScrollTrigger.maxScroll(window),
      scrub: M.scrub.value, invalidateOnRefresh: true,
      onRefresh: () => applyAll(proxy.p),
    },
    onUpdate: () => applyAll(proxy.p),
  })
  applyAll(0)

  /* --------------------------------------------------- load: the grid -- */
  const cols = document.querySelectorAll('[data-grid] > i')
  const heroPage = !!heroCount
  if (cols.length && heroPage) {
    const wasOn = q('[data-grid-toggle]').getAttribute('aria-pressed') === 'true'
    if (!wasOn) window.__mtlGrid(true)
    gsap.from(cols, {
      scaleY: 0, transformOrigin: 'top',
      duration: M.gridBuild.duration, stagger: M.gridBuild.stagger, ease: M.gridBuild.ease,
      onComplete: () => { if (!wasOn) gsap.delayedCall(M.gridBuild.hold, () => window.__mtlGrid(false)) },
    })
  }

  /* --------------------------------------------------- load: hero -- */
  const heroLines = document.querySelectorAll('[data-motion="hero-line"] .ln__i')
  if (heroLines.length) {
    gsap.from(heroLines, { yPercent: M.heroLines.yPercent, duration: M.heroLines.duration, stagger: M.heroLines.stagger, ease: M.heroLines.ease, delay: 0.15 })
  }
  requestAnimationFrame(() => document.documentElement.classList.remove('mtl-wait'))

  // The count, and the 131 modules filling in step with it (--n): the
  // apparatus assembling its own subject.
  const mods = q('[data-motion="modules"]')
  document.querySelectorAll('[data-count-to]').forEach((el) => {
    const to = Number(el.dataset.countTo), pad = el.dataset.countPad, o = { v: 0 }
    gsap.to(o, {
      v: to, duration: M.count.duration, ease: M.count.ease,
      onUpdate: () => { el.textContent = fmt(o.v, pad); if (mods) mods.style.setProperty('--n', o.v.toFixed(2)) },
      onComplete: () => { el.textContent = fmt(to, pad); if (mods) mods.style.setProperty('--n', String(to + 1)) },
    })
  })

  /* ---------------------------- evidence: counted once, in view -- */
  const once = [...document.querySelectorAll('[data-count-once]')]
  const countEl = q('[data-motion="findings-counter"]')
  if (once.length && countEl) {
    const pad = (el) => el.dataset.countPad
    once.forEach((el) => { el.textContent = fmt(0, pad(el)) })
    ScrollTrigger.create({
      trigger: countEl, start: M.findings.start, once: true,
      onEnter: () => once.forEach((el, i) => {
        const o = { v: 0 }, to = Number(el.dataset.countOnce)
        gsap.to(o, {
          v: to, duration: M.count.duration, ease: M.count.ease, delay: i * M.findings.stagger,
          onUpdate: () => { el.textContent = fmt(o.v, pad(el)) },
          onComplete: () => { el.textContent = fmt(to, pad(el)) },
        })
      }),
    })
  }

  /* ------------------------------ archive: per-family reveals, once -- */
  // ScrollTrigger.batch, not one trigger per family (43 triggers measured a
  // 327ms long frame at init). opacity, not autoAlpha: autoAlpha's
  // visibility:hidden dropped keyboard focus to <body>.
  const BITS = '.fam__rule, .fam__idx, .fam__name, .fam__thesis, .m'
  if (document.querySelector('.fam')) {
    ScrollTrigger.batch('.fam', {
      start: 'top 85%', once: true, batchMax: 3,
      onEnter: (batch) => batch.forEach((section) => {
        if (!section.hasAttribute('data-rv')) return   // the failsafe already showed it
        section.removeAttribute('data-rv')
        gsap.from(section.querySelectorAll(BITS), { opacity: 0, y: 12, duration: M.section.duration, ease: M.section.ease, stagger: { amount: M.section.staggerAmount } })
      }),
    })
    // FAILSAFE: content is never gated behind decorative motion.
    setTimeout(() => {
      document.querySelectorAll('.fam[data-rv]').forEach((s) => {
        if (s.getBoundingClientRect().top < window.innerHeight * 2) return
        s.removeAttribute('data-rv')
        s.querySelectorAll(BITS).forEach((el) => { el.style.opacity = ''; el.style.transform = '' })
      })
    }, 4000)
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh())
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
  document.body.setAttribute('data-motion-state', 'on')
}

// The exhibit: x linear in scroll, y = the page's reveal ease (GSAP power3.out
// = 1-(1-t)^4), the same quartic build.mjs sampled to draw the curve.
function revealEase(t) { return 1 - Math.pow(1 - t, 4) }
let exLast = ''
function placeExhibitDot(t) {
  const dot = document.querySelector('[data-ex-dot]')
  const readout = document.querySelector('[data-ex-readout]')
  const g = M && M.exhibit
  if (!dot || !g) return
  const dx = (g.x1 - g.x0) * t, dy = -(g.y0 - g.y1) * revealEase(t)
  const key = `${dx.toFixed(1)} ${dy.toFixed(1)}`
  if (key === exLast) return
  exLast = key
  dot.setAttribute('transform', `translate(${key})`)
  if (readout) readout.textContent = `t ${t.toFixed(2)} · p ${revealEase(t).toFixed(2)}`
}

// Width-stable integer formatter: pads with figure-space so the glyph count
// never changes mid-tween.
function fmt(v, pad) {
  const s = Math.round(v).toLocaleString('en-US')
  const width = pad ? Number(pad) : s.length
  return s.length >= width ? s : ' '.repeat(width - s.length) + s
}

boot()
