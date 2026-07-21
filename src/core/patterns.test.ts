import { describe, expect, it } from "vitest"
import { gridPhases, linearPhases } from "./patterns"

const GRID = [
  "sweep-up",
  "sweep-down",
  "sweep-left",
  "sweep-right",
  "diagonal",
  "chevron",
  "snake",
  "ripple",
  "spiral",
  "sparkle",
  "pulse",
] as const

const SEQ = ["wave", "wave-reverse", "center", "edges", "alternate", "sparkle", "pulse"] as const

describe("gridPhases", () => {
  it("returns row-major rows*cols phases in [0, 1) for every pattern", () => {
    for (const pattern of GRID) {
      const phases = gridPhases(pattern, 4, 5, 1, 7)
      expect(phases).toHaveLength(20)
      for (const p of phases) {
        expect(p).toBeGreaterThanOrEqual(0)
        expect(p).toBeLessThan(1)
      }
    }
  })

  it("pulse fires everything together", () => {
    expect(new Set(gridPhases("pulse", 3, 3, 1, 7)).size).toBe(1)
  })

  it("sweep-down increases with the row", () => {
    const phases = gridPhases("sweep-down", 3, 2, 1, 7)
    expect(phases[0]).toBeLessThan(phases[2])
    expect(phases[2]).toBeLessThan(phases[4])
    // same row, same phase
    expect(phases[0]).toBe(phases[1])
  })

  it("ripple is symmetric around the center", () => {
    const phases = gridPhases("ripple", 3, 3, 1, 7)
    expect(phases[4]).toBe(0) // center fires first
    expect(phases[0]).toBe(phases[8]) // corners together
  })

  it("sparkle is deterministic per seed and differs across seeds", () => {
    const a = gridPhases("sparkle", 4, 4, 1, 7)
    const b = gridPhases("sparkle", 4, 4, 1, 7)
    const c = gridPhases("sparkle", 4, 4, 1, 8)
    expect(a).toEqual(b)
    expect(a).not.toEqual(c)
  })

  it("waves multiplies wavefronts but keeps phases in [0, 1)", () => {
    const phases = gridPhases("sweep-down", 6, 1, 2, 7)
    for (const p of phases) {
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThan(1)
    }
    // two wavefronts: first and midpoint rows share a phase
    expect(phases[0]).toBeCloseTo(phases[3] % 1, 5)
  })
})

describe("linearPhases", () => {
  it("returns count phases in [0, 1) for every pattern", () => {
    for (const pattern of SEQ) {
      const phases = linearPhases(pattern, 7, 1, 7)
      expect(phases).toHaveLength(7)
      for (const p of phases) {
        expect(p).toBeGreaterThanOrEqual(0)
        expect(p).toBeLessThan(1)
      }
    }
  })

  it("wave-reverse mirrors wave", () => {
    const wave = linearPhases("wave", 5, 1, 7)
    const rev = linearPhases("wave-reverse", 5, 1, 7)
    expect(rev).toEqual([...wave].reverse())
  })

  it("center is symmetric", () => {
    const phases = linearPhases("center", 5, 1, 7)
    expect(phases[0]).toBe(phases[4])
    expect(phases[1]).toBe(phases[3])
    expect(phases[2]).toBe(0)
  })

  it("alternate has exactly two phase groups", () => {
    expect(new Set(linearPhases("alternate", 6, 1, 7)).size).toBe(2)
  })
})
