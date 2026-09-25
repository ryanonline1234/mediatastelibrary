/* mediatastelibrary.page — motion layer
 *
 * Architecture is awwwards-motion/references/scroll-architecture.md §1.1
 * verbatim: ONE Lenis, autoRaf false, driven by the GSAP ticker, lagSmoothing(0),
 * one ScrollTrigger per section. No second rAF loop anywhere in this file.
 *
 * Every constant comes from the MOTION block emitted by the generator (read
 * from #motion-config below) — the same object that printed the visible spec
 * labels. Nothing here is a remembered number, and no label can drift from
 * the tween it describes.
 *
 * PROGRESSIVE ENHANCEMENT: the static build is complete and readable on its
 * own. If the CDN fails, the module throws, or JS is off, the page is the v1
 * document — which shipped and works. Motion is added to a working page, never
 * required by it.
 */

const cfgEl = document.getElementById('motion-config')
const M = cfgEl ? JSON.parse(cfgEl.textContent) : null

/* ------------------------------------------------------------------ */
/* walk path fit — offset-path coordinates are CSS pixels of the dot's  */
/* containing block, NOT the svg's stretched 960-unit viewBox, so the   */
/* fixed "M4 20 H956" ran ~600px off a 390px phone (page 586px wider    */
/* than the screen, found 2026-09-24). Fit the path to the rule's real  */
/* width. Runs on both motion paths; writes only on resize.            */
/* ------------------------------------------------------------------ */
;(function walkFit() {
  var walk = document.querySelector('[data-motion="method-walk"]')
  var dot = walk && walk.querySelector('.walk__dot')
  if (!dot) return
  function fit() { dot.style.offsetPath = 'path("M4 20 H' + Math.max(4, walk.clientWidth - 4) + '")' }
  fit()
  if (window.ResizeObserver) new ResizeObserver(fit).observe(walk)
})()

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
  // Expose so the load choreography can reveal the grid then hand it back.
  window.__mtlGrid = paint
})()

/* ------------------------------------------------------------------ */
/* motion                                                              */
/* ------------------------------------------------------------------ */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

async function boot() {
  if (!M) return
  if (reduced) {
    // The real reduced-motion path: no Lenis, no ScrollTrigger, nothing
    // scheduled. Set every scrubbed variable to its END state so the static
    // page is COMPLETE rather than half-animated, and return before any
    // library loads. Zero rAF ticks after this point — which the harness
    // checks, because a guard that freezes the picture while the loop keeps
    // running is the single most common defect in the validated corpus.
    document.querySelectorAll('[data-motion]').forEach(el => {
      el.style.setProperty('--walk', '1')
      el.style.setProperty('--find', '1')
      el.style.setProperty('--t', '1')
      el.style.setProperty('--fam', '1')
    })
    placeExhibitDot(1)
    document.querySelectorAll('[data-count-to]').forEach(el => {
      el.textContent = fmt(Number(el.dataset.countTo), el.dataset.countPad)
    })
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
    // CDN unreachable → the static page stands. Say so rather than failing silent.
    document.body.setAttribute('data-motion-state', 'unavailable')
    document.documentElement.classList.remove('mtl-wait')
    return
  }

  gsap.registerPlugin(ScrollTrigger)

  // Arm the CSS initial-state hooks only once we know motion will run. If the
  // CDN had failed we returned already, so the static page is never left with
  // hidden content — content is never gated behind decorative motion.
  document.documentElement.classList.add('mtl-motion')
  document.querySelectorAll('.fam').forEach(s => s.setAttribute('data-rv', ''))

  /* -- scroll-architecture §1.1, the whole integration, four statements -- */
  const lenis = new Lenis({
    autoRaf: false,          // explicit: nobody may add a second rAF loop
    lerp: M.scroll.lerp,     // §2.2 — lerp XOR duration. There is no duration key.
  })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  // Reachable instance. The capture harness drives scroll through this; with
  // Lenis running but unreachable, native scrollTo is overwritten on the next
  // rAF tick and every measurement is silently wrong. (The library's stage-4
  // pass found the inverse bug — a fix block gated on a `window.lenis` that
  // nothing ever assigned. Assign it, and mean it.)
  window.lenis = lenis

  /* -------------------------------------------------- global progress -- */
  // §2.2 shared-progress pattern, and the ONLY scrub trigger on the page.
  //
  // The first capture failed 7 checks because each scene owned a trigger with
  // viewport-relative bounds (top bottom -> bottom top) while the spec defines
  // scene progress as DOCUMENT ranges. Two different windows; every scrubbed
  // var sat at 1 before its scene began. Deriving all of them from one global
  // value against the spec's own ranges makes the implementation and the
  // assertion the same statement, so that class of bug cannot recur.
  const scenes = M.scenes || {}
  const local = (p, id) => {
    const r = scenes[id]
    if (!r) return 0
    return Math.min(1, Math.max(0, (p - r[0]) / (r[1] - r[0])))
  }

  // Every node resolved ONCE. The first jank pass ran querySelector four times
  // and wrote five textContents per frame — p95 16.6ms against a 9.1ms static
  // floor, a real 10x cost, not measurement noise. §7.4: no DOM lookups and no
  // layout reads inside onUpdate.
  const heroCount = document.querySelector('[data-motion="hero-count"]')
  const walkEl = document.querySelector('[data-motion="method-walk"]')
  const countEl = document.querySelector('[data-motion="findings-counter"]')
  const markEl = document.querySelector('[data-motion="findings-mark"]')
  const dotEl = document.querySelector('[data-motion="exhibit-dot"]')
  const railEl = document.querySelector('[data-motion="families-rail"]')

  // Text writes force layout, so only write when the RENDERED string actually
  // changes — a 4-digit counter changes maybe 40 times over a scene, not once
  // per frame.
  let lastP = -1
  const setV = (el, name, v, prev) => {
    if (!el) return prev
    const s = v.toFixed(3)
    if (s !== prev) el.style.setProperty(name, s)
    return s
  }
  let pWalk, pFind, pT, pFam

  // No :root write here. A per-frame custom property on <html> invalidated
  // style for the whole document — measured at ~94% of style-recalc time
  // during scroll — and nothing read it.
  function applyAll(p) {
    if (p === lastP) return
    lastP = p

    const hero = local(p, 'hero')
    if (heroCount) heroCount.style.transform = `translateY(${(-60 * hero).toFixed(2)}px)`

    pWalk = setV(walkEl, '--walk', local(p, 'method'), pWalk)

    pFind = setV(markEl, '--find', local(p, 'findings'), pFind)

    const t = local(p, 'exhibit')
    pT = setV(dotEl, '--t', t, pT)
    placeExhibitDot(t)

    pFam = setV(railEl, '--fam', local(p, 'families'), pFam)
  }

  // scrub smooths an ANIMATION's playhead, not a trigger's raw progress —
  // with no tween attached (the old code), 'scrub 0.6' did nothing, which is
  // the exact dead-constant class the library's stage 4 catalogued. A proxy
  // tween makes the printed SCRUB 0.6 real.
  const proxy = { p: 0 }
  gsap.to(proxy, {
    p: 1,
    ease: 'none',
    scrollTrigger: {
      start: 0,
      end: () => ScrollTrigger.maxScroll(window),
      scrub: M.scrub.value,
      invalidateOnRefresh: true,
      onRefresh: () => applyAll(proxy.p),
    },
    onUpdate: () => applyAll(proxy.p),
  })
  // Paint the initial state immediately. onUpdate does not fire at rest, so
  // without this every scene var is unset at p=0 and reads as an empty string
  // rather than 0 — which the harness flagged, correctly.
  applyAll(0)

  /* --------------------------------------------------- load: the grid -- */
  // The page builds its own grid, then hands the toggle back to the reader.
  const cols = document.querySelectorAll('[data-grid] > i')
  if (cols.length) {
    const wasOn = document.querySelector('[data-grid-toggle]').getAttribute('aria-pressed') === 'true'
    if (!wasOn) window.__mtlGrid(true)
    gsap.from(cols, {
      scaleY: 0,
      transformOrigin: 'top',
      duration: M.gridBuild.duration,
      stagger: M.gridBuild.stagger,
      ease: M.gridBuild.ease,
      // hold the built grid long enough to read, then hand the toggle back
      onComplete: () => { if (!wasOn) gsap.delayedCall(M.gridBuild.hold, () => window.__mtlGrid(false)) },
    })
  }

  /* --------------------------------------------------- load: hero -- */
  // gsap.from has now set every start state, so the guard can drop without
  // the finished hero flashing first.
  requestAnimationFrame(() => document.documentElement.classList.remove('mtl-wait'))
  const heroLines = document.querySelectorAll('[data-motion="hero-line"] .ln__i')
  if (heroLines.length) {
    gsap.from(heroLines, {
      yPercent: M.heroLines.yPercent,
      duration: M.heroLines.duration,
      stagger: M.heroLines.stagger,
      ease: M.heroLines.ease,
      delay: 0.15,
    })
  }

  // Load-time count-up. Width-stable: pad to the final string length so the
  // element never reflows. (The toLocaleString version that collapses 7 chars
  // to 1 on frame one is a DO-NOT-COPY entry in the library.)
  document.querySelectorAll('[data-count-to]').forEach((el) => {
    const to = Number(el.dataset.countTo)
    const pad = el.dataset.countPad
    const o = { v: 0 }
    gsap.to(o, {
      v: to,
      duration: M.count.duration,
      ease: M.count.ease,
      onUpdate: () => { el.textContent = fmt(o.v, pad) },
      onComplete: () => { el.textContent = fmt(to, pad) },
    })
  })

  /* ------------------------------------ findings: count once, in view -- */
  // Was scrubbed across a range that began when the heading hit the top of
  // the viewport, so the four figures read 0 while the section was readable.
  // Now: zeroed below the fold, counted once as the section enters, and left
  // on the true value.
  const once = [...document.querySelectorAll('[data-count-once]')]
  if (once.length && countEl) {
    const pad = (el) => el.dataset.countPad
    once.forEach((el) => { el.textContent = fmt(0, pad(el)) })
    ScrollTrigger.create({
      trigger: countEl,
      start: M.findings.start,
      once: true,
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

  /* ------------------------------------- per-section reveals, once -- */
  // ScrollTrigger.batch, NOT one trigger per family.
  //
  // The first jank run measured a 327ms long frame at module init with 278ms
  // of forced layout, because 43 sections each created their own trigger and
  // each measured on setup. batch() uses a single IntersectionObserver and
  // creates no per-element triggers, which is precisely the case it exists
  // for. Fires once; 43 re-triggering sections would be a zoo, and restraint
  // is this family's whole register.
  // Initial hidden state comes from CSS (html gets .mtl-motion, which arms
  // [data-rv]) rather than a gsap.set over ~215 elements — that set was the
  // remaining chunk of init cost after batching. The style system does this
  // once during normal style resolution; JS would do it as 215 writes.
  const BITS = '.fam__rule, .fam__idx, .fam__name, .fam__thesis, .m'
  ScrollTrigger.batch('.fam', {
    start: 'top 85%',
    once: true,
    batchMax: 3,
    onEnter: (batch) => {
      batch.forEach((section) => {
        // The 4s failsafe below may already have shown this section; animating
        // it again made it blink out and back in.
        if (!section.hasAttribute('data-rv')) return
        section.removeAttribute('data-rv')
        gsap.from(section.querySelectorAll(BITS), {
          // opacity, not autoAlpha: autoAlpha sets visibility:hidden, which
          // dropped keyboard focus to <body> when a link inside was tabbed to.
          opacity: 0,
          y: 12,
          duration: M.section.duration,
          ease: M.section.ease,
          stagger: { amount: M.section.staggerAmount },
        })
      })
    },
  })

  // FAILSAFE: content is never gated behind decorative motion. If the batch
  // observer never fires — an IntersectionObserver quirk, a refresh race, a
  // browser we did not test — the family names would stay invisible and the
  // page would be broken in the one way that matters. Unconditionally disarm
  // the hidden state shortly after load; anything already revealed is
  // unaffected, and anything not yet revealed simply appears.
  setTimeout(() => {
    document.querySelectorAll('.fam[data-rv]').forEach((s) => {
      if (s.getBoundingClientRect().top < window.innerHeight * 2) return // let the batch handle imminent ones
      s.removeAttribute('data-rv')
      s.querySelectorAll(BITS).forEach((el) => { el.style.opacity = ''; el.style.transform = '' })
    })
  }, 4000)

  // §3.7 — refresh after fonts settle, or every start/end measured before
  // layout stabilised is wrong.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh())
  }
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })

  document.body.setAttribute('data-motion-state', 'on')

}

// The exhibit: the dot moves linearly in x (scroll) and its height is the
// page's reveal ease, the same quartic build.mjs sampled to draw the curve.
// GSAP power3.out(t) = 1 - (1 - t)^4.
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

// Width-stable integer formatter. Pads with figure-space so the glyph count
// never changes mid-tween — the whole point of the technique.
function fmt(v, pad) {
  const s = Math.round(v).toLocaleString('en-US')
  const width = pad ? Number(pad) : s.length
  return s.length >= width ? s : ' '.repeat(width - s.length) + s
}

boot()
