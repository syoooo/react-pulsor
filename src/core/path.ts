/**
 * Ring geometry. Rings are superellipses — |x/a|^n + |y/b|^n = 1 — which
 * covers the whole family of "O" shapes: n = 2 is a true ellipse, higher n
 * squares the corners off (squircle), n = 1 collapses to a diamond. Together
 * with an aspect ratio this can match the counter of most typefaces' O.
 */

export interface RingPoint {
  x: number
  y: number
  /** Direction of travel along the path, radians (screen coords, y down). */
  tangent: number
  /** Direction from the center to the point, radians. */
  radial: number
}

/** One bar segment of a striped glyph, in coordinates centered on the glyph. */
export interface StripeSegment {
  cx: number
  cy: number
  w: number
  h: number
  /** Index of the stripe this segment belongs to (segments split by the counter share one). */
  stripe: number
}

/**
 * A closed loop built from parallel stripes. Each stripe is a pill anchored
 * to the loop's outline, reaching `stroke` px inward; where the two sides
 * would collide (top and bottom rows) they merge into one full bar. The
 * outline is a superellipse, so `aspect`, `squareness` and `stroke` together
 * can match anything from a round badge to a typeface's O.
 */
export function stripedO(
  stripes: number,
  width: number,
  height: number,
  squareness: number,
  stroke: number,
  thickness: number,
  horizontal: boolean,
): StripeSegment[] {
  // Compute in "horizontal stripe" space; transpose at the end if vertical.
  const W = horizontal ? width : height
  const H = horizontal ? height : width
  const A = W / 2
  const B = H / 2
  const n = Math.max(0.5, squareness)
  const s = Math.max(1, Math.min(stroke, A * 2))

  const halfWidth = (y: number): number => {
    if (B <= 0 || A <= 0) return 0
    const t = 1 - Math.pow(Math.abs(y) / B, n)
    return t <= 0 ? 0 : A * Math.pow(t, 1 / n)
  }

  const segments: StripeSegment[] = []
  for (let k = 0; k < stripes; k++) {
    const cy = stripes === 1 ? 0 : -B + thickness / 2 + k * ((H - thickness) / (stripes - 1))
    const xo = halfWidth(cy)
    if (xo < 0.25) continue
    const xi = xo - s
    // Merge into one bar when the pills would meet in the middle.
    if (xi * 2 < thickness) {
      segments.push({ cx: 0, cy, w: xo * 2, h: thickness, stripe: k })
    } else {
      segments.push({ cx: -(xo + xi) / 2, cy, w: s, h: thickness, stripe: k })
      segments.push({ cx: (xo + xi) / 2, cy, w: s, h: thickness, stripe: k })
    }
  }
  if (horizontal) return segments
  return segments.map((seg) => ({ cx: seg.cy, cy: seg.cx, w: seg.h, h: seg.w, stripe: seg.stripe }))
}

const SAMPLES = 1024

/**
 * `count` points spaced uniformly *by arc length* around a superellipse of
 * the given width/height. Equal-angle sampling bunches points at the corners
 * of squarer shapes; arc-length spacing keeps the rhythm even.
 */
export function superellipsePoints(
  count: number,
  width: number,
  height: number,
  squareness: number,
  startAngle: number = -Math.PI / 2,
): RingPoint[] {
  const n = Math.max(0.5, squareness)
  const a = width / 2
  const b = height / 2
  const e = 2 / n

  const raw: { x: number; y: number }[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const th = startAngle + (i / SAMPLES) * Math.PI * 2
    const c = Math.cos(th)
    const s = Math.sin(th)
    raw.push({
      x: a * Math.sign(c) * Math.pow(Math.abs(c), e),
      y: b * Math.sign(s) * Math.pow(Math.abs(s), e),
    })
  }

  const cum = new Array<number>(SAMPLES + 1)
  cum[0] = 0
  for (let i = 1; i <= SAMPLES; i++) {
    const p = raw[i - 1]
    const q = raw[i % SAMPLES]
    cum[i] = cum[i - 1] + Math.hypot(q.x - p.x, q.y - p.y)
  }
  const total = cum[SAMPLES]

  const points: RingPoint[] = []
  let j = 0
  for (let k = 0; k < count; k++) {
    const target = (k / count) * total
    while (j < SAMPLES - 1 && cum[j + 1] < target) j++
    const p = raw[j]
    const q = raw[(j + 1) % SAMPLES]
    const span = cum[j + 1] - cum[j] || 1
    const t = (target - cum[j]) / span
    const x = p.x + (q.x - p.x) * t
    const y = p.y + (q.y - p.y) * t
    points.push({
      x,
      y,
      tangent: Math.atan2(q.y - p.y, q.x - p.x),
      radial: Math.atan2(y, x),
    })
  }
  return points
}
