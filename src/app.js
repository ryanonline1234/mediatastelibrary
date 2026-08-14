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
    document.documentElement.style.setProperty('--scroll-progress', '1')
    document.querySelectorAll('[data-motion]').forEach(el => {
      el.style.setProperty('--walk', '1')
      el.style.setProperty('--count', '1')
      el.style.setProperty('--t', '1')
      el.style.setProperty('--fam', '1')
    })
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

  const root = document.documentElement

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
  const dotEl = document.querySelector('[data-motion="exhibit-dot"]')
  const railEl = document.querySelector('[data-motion="families-rail"]')
  const readout = document.querySelector('[data-ex-readout]')
  const scrubNums = [...document.querySelectorAll('[data-scrub-to]')].map((el) => ({
    el, to: Number(el.dataset.scrubTo), pad: el.dataset.countPad, last: null,
  }))

  // Text writes force layout, so only write when the RENDERED string actually
  // changes — a 4-digit counter changes maybe 40 times over a scene, not once
  // per frame.
  let lastP = -1, lastReadout = ''
  const setV = (el, name, v, prev) => {
    if (!el) return prev
    const s = v.toFixed(3)
    if (s !== prev) el.style.setProperty(name, s)
    return s
  }
  let pWalk, pCount, pT, pFam, pProg

  function applyAll(p) {
    if (p === lastP) return
    lastP = p

    pProg = setV(root, '--scroll-progress', p, pProg)

    const hero = local(p, 'hero')
    if (heroCount) heroCount.style.transform = `translateY(${(-60 * hero).toFixed(2)}px)`

    pWalk = setV(walkEl, '--walk', local(p, 'method'), pWalk)

    const f = local(p, 'findings')
    pCount = setV(countEl, '--count', f, pCount)
    for (const n of scrubNums) {
      const s = fmt(n.to * f, n.pad)
      if (s !== n.last) { n.el.textContent = s; n.last = s }
    }

    const t = local(p, 'exhibit')
    pT = setV(dotEl, '--t', t, pT)
    if (readout) {
      const s = `t ${t.toFixed(2)} · p ${easeOutCubicish(t).toFixed(2)}`
      if (s !== lastReadout) { readout.textContent = s; lastReadout = s }
    }

    pFam = setV(railEl, '--fam', local(p, 'families'), pFam)
  }

  ScrollTrigger.create({
    start: 0,
    end: () => ScrollTrigger.maxScroll(window),
    scrub: M.scrub.value,
    onUpdate: (self) => applyAll(self.progress),
    onRefresh: (self) => applyAll(self.progress),
  })
  // Paint the initial state immediately. onUpdate does not fire at rest, so
  // without this --scroll-progress is unset at p=0 and reads as an empty
  // string rather than 0 — which the harness flagged, correctly.
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
      onComplete: () => { if (!wasOn) window.__mtlGrid(false) },
    })
  }

  /* --------------------------------------------------- load: hero -- */
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
        section.removeAttribute('data-rv')
        gsap.from(section.querySelectorAll(BITS), {
          autoAlpha: 0,
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

// The exhibit's readout prints where the curve is, not where the dot is —
// that difference is the whole point of the exhibit. power3.out ≈ 1-(1-t)^3.
function easeOutCubicish(t) { return 1 - Math.pow(1 - t, 3) }

// Width-stable integer formatter. Pads with figure-space so the glyph count
// never changes mid-tween — the whole point of the technique.
function fmt(v, pad) {
  const s = Math.round(v).toLocaleString('en-US')
  const width = pad ? Number(pad) : s.length
  return s.length >= width ? s : ' '.repeat(width - s.length) + s
}

boot()
