// Parse an easing record from the awwwards-taste skill into a real function,
// then sample it: into an SVG path (the drawn glyph) and into a CSS linear()
// timing function (the marker that rides it). One function feeds both, so the
// drawing and the motion cannot disagree — the defect the old exhibit had.
//
// Accepts the formats the records actually use (surveyed 2026-09-24):
// cubic-bezier(...), GSAP names (power0-4 / sine / expo / circ / back /
// elastic / bounce .in/.out/.inOut), Penner names (easeOutCubic, easeSinOut…),
// CSS keywords, and CustomEase-style SVG paths ("M0,0 C…").
// Arbitrary JS (`t => …`) is never evaluated: such a record yields null.

const clamp01 = (t) => Math.min(1, Math.max(0, t))

function cubicBezier(x1, y1, x2, y2) {
  const bx = (t) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
  const by = (t) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let lo = 0, hi = 1, t = x
    for (let i = 0; i < 40; i++) { t = (lo + hi) / 2; if (bx(t) < x) lo = t; else hi = t }
    return by(t)
  }
}

// GSAP's families: power1 = quad … power4 = quint.
const IN = {
  power0: (t) => t, linear: (t) => t, none: (t) => t,
  power1: (t) => t * t, quad: (t) => t * t,
  power2: (t) => t ** 3, cubic: (t) => t ** 3,
  power3: (t) => t ** 4, quart: (t) => t ** 4,
  power4: (t) => t ** 5, quint: (t) => t ** 5,
  sine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  expo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  circ: (t) => 1 - Math.sqrt(1 - t * t),
  back: (t) => t * t * (2.70158 * t - 1.70158),
  elastic: (t) => (t === 0 || t === 1 ? t : -Math.pow(2, 10 * (t - 1)) * Math.sin(((t - 1.075) * 2 * Math.PI) / 0.3)),
  bounce: (t) => 1 - bounceOut(1 - t),
}
function bounceOut(t) {
  const n = 7.5625, d = 2.75
  if (t < 1 / d) return n * t * t
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375
  return n * (t -= 2.625 / d) * t + 0.984375
}
const variant = (fin, kind) => kind === 'in' ? fin
  : kind === 'out' ? (t) => 1 - fin(1 - t)
  : (t) => (t < 0.5 ? fin(2 * t) / 2 : 1 - fin(2 * (1 - t)) / 2)

const CSS_KEYWORDS = {
  ease: [0.25, 0.1, 0.25, 1], 'ease-in': [0.42, 0, 1, 1], 'ease-out': [0, 0, 0.58, 1], 'ease-in-out': [0.42, 0, 0.58, 1],
}

function svgPathEase(d) {
  // "M0,0 C x1,y1 x2,y2 x,y [x1,y1 x2,y2 x,y …]" — a chain of cubic segments in 0..1.
  const nums = d.replace(/^M/, '').replace(/C/g, ' ').trim().split(/[\s,]+/).map(Number)
  if (nums.length < 8 || nums.some(Number.isNaN)) return null
  const segs = []
  let [px, py] = nums
  for (let i = 2; i + 5 < nums.length; i += 6) {
    const [x1, y1, x2, y2, x, y] = nums.slice(i, i + 6)
    segs.push({ p0: [px, py], p1: [x1, y1], p2: [x2, y2], p3: [x, y] });
    [px, py] = [x, y]
  }
  if (!segs.length) return null
  const at = (s, t, k) => (1 - t) ** 3 * s.p0[k] + 3 * (1 - t) ** 2 * t * s.p1[k] + 3 * (1 - t) * t * t * s.p2[k] + t ** 3 * s.p3[k]
  return (x) => {
    const s = segs.find((g) => x <= g.p3[0]) || segs.at(-1)
    let lo = 0, hi = 1, t = 0.5
    for (let i = 0; i < 40; i++) { t = (lo + hi) / 2; if (at(s, t, 0) < x) lo = t; else hi = t }
    return at(s, t, 1)
  }
}

// → { fn, label, kind } or null
export function parseEase(value) {
  const v = String(value || '')
  let m = v.match(/cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/)
  if (m) return { fn: cubicBezier(+m[1], +m[2], +m[3], +m[4]), label: m[0].replace(/\s+/g, ''), kind: 'bezier' }
  m = v.match(/\b(power[0-4]|expo|circ|sine|quad|cubic|quart|quint|back|elastic|bounce)\.(inOut|in|out)\b/)
  if (m) return { fn: variant(IN[m[1]], m[2]), label: `${m[1]}.${m[2]}`, kind: 'gsap' }
  m = v.match(/\bM0,0 C[\d.,\s-C]+/)
  if (m) { const fn = svgPathEase(m[0]); if (fn) return { fn, label: 'custom path', kind: 'path' } }
  m = v.match(/\bease(In|Out|InOut)?(Quad|Cubic|Quart|Quint|Sine|Expo|Circ|Back|Elastic|Bounce)\b|\bease(Sin|Quad|Cubic|Quart|Quint|Expo|Circ)(In|Out|InOut)\b/)
  if (m) {
    const fam = (m[2] || m[3]).toLowerCase().replace(/^sin$/, 'sine')
    const kind = (m[1] || m[4] || 'InOut').replace(/^./, (c) => c.toLowerCase())
    return { fn: variant(IN[fam], kind), label: m[0], kind: 'penner' }
  }
  m = v.match(/\b(ease-in-out|ease-out|ease-in|ease)\b/)
  if (m) return { fn: cubicBezier(...CSS_KEYWORDS[m[1]]), label: m[1], kind: 'keyword' }
  if (/\b(linear|none)\b/.test(v)) return { fn: (t) => t, label: 'linear', kind: 'linear' }
  return null
}

// Pick a family's glyph ease from its records: prefer a real curve over a
// keyword, and a keyword over linear. Records are in source order.
export function pickEase(records) {
  const rank = { bezier: 0, gsap: 1, path: 2, penner: 3, keyword: 4, linear: 5 }
  let best = null
  for (const r of records.filter((r) => r.role === 'easing')) {
    const e = parseEase(r.value)
    if (e && (!best || rank[e.kind] < rank[best.ease.kind])) best = { id: r.id, value: r.value, ease: e }
  }
  return best
}

export function samplePath(fn, { w = 64, h = 40, pad = 4, n = 48 } = {}) {
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    return [pad + (w - 2 * pad) * t, h - pad - (h - 2 * pad) * fn(t)]
  })
  return 'M' + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L')
}

export function cssLinear(fn, n = 32) {
  return `linear(${Array.from({ length: n + 1 }, (_, i) => +fn(i / n).toFixed(4)).join(', ')})`
}

export { clamp01 }
