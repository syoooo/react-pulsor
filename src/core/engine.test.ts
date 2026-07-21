import { describe, expect, it } from "vitest"
import { compileAnimation, levelAt, resolveEasingPair, resolveEnvelope } from "./engine"

describe("resolveEnvelope", () => {
  it("normalizes presets to sorted frames covering 0..1", () => {
    for (const preset of ["pulse", "breathe", "flash", "heartbeat"] as const) {
      const frames = resolveEnvelope(preset)
      expect(frames[0].at).toBe(0)
      expect(frames[frames.length - 1].at).toBe(1)
      for (let i = 1; i < frames.length; i++) {
        expect(frames[i].at).toBeGreaterThanOrEqual(frames[i - 1].at)
      }
    }
  })

  it("allows anticipation and overshoot but clamps to [-0.5, 1.5]", () => {
    const frames = resolveEnvelope([
      { at: 0, level: -2 },
      { at: 0.5, level: 3 },
      { at: 1, level: 0 },
    ])
    expect(frames[0].level).toBe(-0.5)
    expect(frames[1].level).toBe(1.5)
  })
})

describe("levelAt", () => {
  const frames = resolveEnvelope("pulse")

  it("wraps outside [0, 1]", () => {
    expect(levelAt(frames, 1.2)).toBeCloseTo(levelAt(frames, 0.2), 10)
    expect(levelAt(frames, -0.8)).toBeCloseTo(levelAt(frames, 0.2), 10)
  })

  it("hits the envelope peak", () => {
    expect(levelAt(frames, 0.1)).toBe(1)
  })
})

describe("resolveEasingPair", () => {
  it("uses one explicit curve for both directions", () => {
    const pair = resolveEasingPair("snap", "pulse")
    expect(pair.rise).toBe(pair.fall)
  })

  it("gives envelope presets curated directional pairs", () => {
    const pair = resolveEasingPair(undefined, "pulse")
    expect(pair.rise).not.toBe(pair.fall)
  })

  it("falls back to the pulse pair for custom envelopes", () => {
    const custom = resolveEasingPair(undefined, { attack: 0.2, release: 0.3 })
    expect(custom).toEqual(resolveEasingPair(undefined, "pulse"))
  })
})

describe("compileAnimation", () => {
  const base = {
    frames: resolveEnvelope("pulse"),
    easing: resolveEasingPair(undefined, "pulse"),
    dim: 0.12,
    restScale: 0.45,
    amplitude: 6,
    stretchAxis: "y" as const,
  }

  it("emits a keyframes rule and a reduced-motion fallback", () => {
    const out = compileAnimation({ ...base, animate: "fade", respectReducedMotion: true })
    expect(out.css).toContain(`@keyframes ${out.keyframesName}`)
    expect(out.css).toContain("prefers-reduced-motion")
    expect(out.className).toBe(out.id)
  })

  it("omits the fallback when respectReducedMotion is off", () => {
    const out = compileAnimation({ ...base, animate: "fade", respectReducedMotion: false })
    expect(out.css).not.toContain("prefers-reduced-motion")
    expect(out.className).toBe("")
  })

  it("dedupes ids by config", () => {
    const a = compileAnimation({ ...base, animate: "fade", respectReducedMotion: true })
    const b = compileAnimation({ ...base, animate: "fade", respectReducedMotion: true })
    const c = compileAnimation({ ...base, animate: "scale", respectReducedMotion: true })
    expect(a.id).toBe(b.id)
    expect(a.id).not.toBe(c.id)
  })

  it("adds follow-through lag stops for fade-scale", () => {
    const fade = compileAnimation({ ...base, animate: "fade", respectReducedMotion: false })
    const lagged = compileAnimation({ ...base, animate: "fade-scale", respectReducedMotion: false })
    const stops = (css: string) => (css.match(/%\{/g) ?? []).length
    expect(stops(lagged.css)).toBeGreaterThan(stops(fade.css))
  })
})
