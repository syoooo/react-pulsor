import { describe, expect, it } from "vitest"
import { linearSliceColors, palettes, resolveColors, sampleGradient } from "./color"

const HEX = /^#[0-9a-f]{6}$/i

describe("sampleGradient", () => {
  const stops = [
    { color: "#000000", position: 0 },
    { color: "#ffffff", position: 1 },
  ]

  it("returns exact stop colors at and beyond the endpoints", () => {
    expect(sampleGradient(stops, 0)).toBe("#000000")
    expect(sampleGradient(stops, 1)).toBe("#ffffff")
    expect(sampleGradient(stops, -1)).toBe("#000000")
    expect(sampleGradient(stops, 2)).toBe("#ffffff")
  })

  it("interpolates through OKLab, not straight sRGB", () => {
    const mid = sampleGradient(stops, 0.5)
    expect(mid).toMatch(HEX)
    // OKLab's perceptual midpoint sits below the naive sRGB average #808080
    const v = parseInt(mid.slice(1, 3), 16)
    expect(v).toBeGreaterThan(0x40)
    expect(v).toBeLessThan(0x80)
  })

  it("keeps every preset sample a valid hex", () => {
    for (const stops of Object.values(palettes)) {
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        expect(sampleGradient(stops, t)).toMatch(HEX)
      }
    }
  })
})

describe("resolveColors", () => {
  it("resolves preset names", () => {
    const colors = resolveColors("aurora", [0, 0.5, 1])
    expect(colors).toHaveLength(3)
    expect(new Set(colors).size).toBe(3)
  })

  it("treats unknown strings as a single CSS color", () => {
    expect(resolveColors("rebeccapurple", [0, 1])).toEqual(["rebeccapurple", "rebeccapurple"])
  })
})

describe("linearSliceColors", () => {
  it("emits one linear-gradient slice per rect", () => {
    const out = linearSliceColors(
      "aurora",
      [
        { cx: -10, cy: 0, w: 10, h: 10 },
        { cx: 10, cy: 0, w: 10, h: 10 },
      ],
      90,
    )
    expect(out).toHaveLength(2)
    for (const g of out) {
      expect(g).toMatch(/^linear-gradient\(-?[\d.]+deg, #[0-9a-f]{6}, #[0-9a-f]{6}\)$/i)
    }
    // slices differ along the gradient direction
    expect(out[0]).not.toBe(out[1])
  })

  it("compensates rotated rects so the global angle stays true", () => {
    const [flat] = linearSliceColors("ember", [{ cx: 0, cy: 0, w: 10, h: 4 }], 90)
    const [rot] = linearSliceColors(
      "ember",
      [{ cx: 0, cy: 0, w: 10, h: 4, rotation: Math.PI / 2 }],
      90,
    )
    expect(flat.startsWith("linear-gradient(90deg")).toBe(true)
    expect(rot.startsWith("linear-gradient(0deg")).toBe(true)
  })
})
