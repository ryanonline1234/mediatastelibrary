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

// GSAP's configurable eases, with their parameters kept (the first version
// dropped them, drawing elastic.out(2, 0.5) as the default elastic).
function elasticOut(a = 1, p = 0.3) {
  const p1 = Math.max(a, 1), p2 = p / Math.min(a, 1), p3 = (p2 / (2 * Math.PI)) * (Math.asin(1 / p1) || 0)
  return (t) => (t === 0 || t === 1 ? t : p1 * Math.pow(2, -10 * t) * Math.sin((t - p3) * (2 * Math.PI) / p2) + 1)
}
const backIn = (o = 1.70158) => (t) => t * t * ((o + 1) * t - o)

// → { fn, label, kind } or null
export function parseEase(value) {
  const v = String(value || '')
  // ease: "none" / ease: 'linear' — a GSAP option, not the CSS keyword `ease`.
  // The first version matched the property NAME here and drew three linear
  // records as CSS ease (caught by the pre-deploy honesty review).
  if (/\bease\s*:\s*["'`]?(none|linear)\b/.test(v)) return { fn: (t) => t, label: 'linear', kind: 'linear' }
  let m = v.match(/cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/)
  if (m) return { fn: cubicBezier(+m[1], +m[2], +m[3], +m[4]), label: m[0].replace(/\s+/g, ''), kind: 'bezier' }
  m = v.match(/\belastic\.(inOut|in|out)\(\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/)
  if (m) {
    const out = elasticOut(+m[2], m[3] ? +m[3] : 0.3)
    return { fn: variant((t) => 1 - out(1 - t), m[1]), label: m[0].replace(/\s+/g, ''), kind: 'gsap' }
  }
  m = v.match(/\bback\.(inOut|in|out)\(\s*([\d.]+)\s*\)/)
  if (m) return { fn: variant(backIn(+m[2]), m[1]), label: m[0].replace(/\s+/g, ''), kind: 'gsap' }
  m = v.match(/\b(power[0-4]|expo|circ|sine|quad|cubic|quart|quint|back|elastic|bounce)\.(inOut|in|out)\b/)
  if (m) return { fn: variant(IN[m[1]], m[2]), label: `${m[1]}.${m[2]}`, kind: 'gsap' }
  // power curves written as code: 1-(1-t)^N, 1 - Math.pow(1 - t, N), t^N, Math.pow(t, N)
  m = v.match(/1\s*-\s*\(\s*1\s*-\s*t\s*\)\s*(?:\^|\*\*)\s*(\d+(?:\.\d+)?)|1\s*-\s*Math\.pow\(\s*1\s*-\s*t\s*,\s*(\d+(?:\.\d+)?)\s*\)/)
  if (m) { const k = +(m[1] || m[2]); return { fn: (t) => 1 - Math.pow(1 - t, k), label: `1-(1-t)^${k}`, kind: 'code' } }
  m = v.match(/(?:^|[^\w.])t\s*(?:\^|\*\*)\s*(\d+(?:\.\d+)?)|Math\.pow\(\s*t\s*,\s*(\d+(?:\.\d+)?)\s*\)/)
  if (m) { const k = +(m[1] || m[2]); return { fn: (t) => Math.pow(t, k), label: `t^${k}`, kind: 'code' } }
  m = v.match(/\bM0,0 C[\d.,\s-C]+/)
  if (m) { const fn = svgPathEase(m[0]); if (fn) return { fn, label: 'custom path', kind: 'path' } }
  m = v.match(/\bease(In|Out|InOut)?(Quad|Cubic|Quart|Quint|Sine|Expo|Circ|Back|Elastic|Bounce)\b|\bease(Sin|Quad|Cubic|Quart|Quint|Expo|Circ)(In|Out|InOut)\b/)
  if (m) {
    const fam = (m[2] || m[3]).toLowerCase().replace(/^sin$/, 'sine')
    const kind = (m[1] || m[4] || 'InOut').replace(/^./, (c) => c.toLowerCase())
    return { fn: variant(IN[fam], kind), label: m[0], kind: 'penner' }
  }
  m = v.match(/\b(ease-in-out|ease-out|ease-in|ease)\b(?!\s*[:=])/)
  if (m) return { fn: cubicBezier(...CSS_KEYWORDS[m[1]]), label: m[1], kind: 'keyword' }
  if (/\b(linear|none)\b/.test(v)) return { fn: (t) => t, label: 'linear', kind: 'linear' }
  return null
}

// Pick a family's glyph ease from its records: prefer a real curve over a
// keyword, and a keyword over linear. Records are in source order.
export function pickEase(records) {
  const rank = { bezier: 0, gsap: 1, path: 2, penner: 3, code: 4, keyword: 5, linear: 6 }
  let best = null
  for (const r of records.filter((r) => r.role === 'easing')) {
    const e = parseEase(r.value)
    if (e && (!best || rank[e.kind] < rank[best.ease.kind])) best = { id: r.id, value: r.value, ease: e }
  }
  return best
}

// The value range a curve covers: [0, 1] unless it overshoots (elastic, back).
export function rangeOf(fn, n = 400) {
  let lo = 0, hi = 1
  for (let i = 0; i <= n; i++) { const y = fn(i / n); if (y < lo) lo = y; if (y > hi) hi = y }
  return { lo, hi }
}

// y is mapped over [lo, hi] so an overshooting curve stays inside its plot
// (elastic.out(2,0.5) peaks at 1.73 and drew far outside it — render check).
export function samplePath(fn, { w = 64, h = 40, pad = 4, n = 48, lo = 0, hi = 1 } = {}) {
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    return [pad + (w - 2 * pad) * t, h - pad - (h - 2 * pad) * (fn(t) - lo) / (hi - lo)]
  })
  return 'M' + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L')
}

export function cssLinear(fn, n = 32) {
  return `linear(${Array.from({ length: n + 1 }, (_, i) => +fn(i / n).toFixed(4)).join(', ')})`
}

export { clamp01 }
