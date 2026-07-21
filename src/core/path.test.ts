import { describe, expect, it } from "vitest"
import { stripedO, superellipsePoints } from "./path"

describe("superellipsePoints", () => {
  it("places count points on the superellipse", () => {
    const pts = superellipsePoints(12, 40, 40, 2)
    expect(pts).toHaveLength(12)
    for (const p of pts) {
      // |x/a|^n + |y/b|^n ≈ 1
      const v = (Math.abs(p.x) / 20) ** 2 + (Math.abs(p.y) / 20) ** 2
      expect(v).toBeCloseTo(1, 1)
    }
  })

  it("spaces points uniformly by arc length on a circle", () => {
    const pts = superellipsePoints(8, 40, 40, 2)
    const gaps = pts.map((p, i) => {
      const q = pts[(i + 1) % pts.length]
      return Math.hypot(q.x - p.x, q.y - p.y)
    })
    const min = Math.min(...gaps)
    const max = Math.max(...gaps)
    expect(max / min).toBeLessThan(1.05)
  })

  it("starts at the top", () => {
    const [first] = superellipsePoints(8, 40, 40, 2)
    expect(first.x).toBeCloseTo(0, 3)
    expect(first.y).toBeCloseTo(-20, 3)
  })
})

describe("stripedO", () => {
  it("splits middle rows around the opening and keeps caps whole", () => {
    const segs = stripedO(6, 40, 40, 2, 10, 4, true)
    const byStripe = new Map<number, number>()
    for (const s of segs) byStripe.set(s.stripe, (byStripe.get(s.stripe) ?? 0) + 1)
    expect(byStripe.get(0)).toBe(1) // top cap merges
    expect(byStripe.get(5)).toBe(1) // bottom cap merges
    expect(byStripe.get(2)).toBe(2) // middle splits
    expect(byStripe.get(3)).toBe(2)
  })

  it("split pairs are mirrored around the center", () => {
    const segs = stripedO(6, 40, 40, 2, 10, 4, true)
    const mids = segs.filter((s) => s.stripe === 2)
    expect(mids[0].cx).toBeCloseTo(-mids[1].cx, 5)
    expect(mids[0].cy).toBe(mids[1].cy)
    expect(mids[0].w).toBeCloseTo(10, 5) // pills reach inward by stroke
  })

  it("transposes for vertical stripes", () => {
    const h = stripedO(5, 40, 40, 2, 10, 4, true)
    const v = stripedO(5, 40, 40, 2, 10, 4, false)
    expect(v).toHaveLength(h.length)
    expect(v[0].w).toBe(h[0].h)
    expect(v[0].h).toBe(h[0].w)
  })
})
