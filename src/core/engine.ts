import { useEffect, useInsertionEffect } from "react"
import type {
  AnimateMode,
  Easing,
  Envelope,
  EnvelopeFrame,
  EnvelopePreset,
  EnvelopeShape,
} from "../types"

/**
 * The engine turns (animate mode + envelope + easing) into a single shared
 * @keyframes rule. Every element runs that one animation; per-element
 * negative delays (from the pattern's phase field) place each element at a
 * different point of the loop, so the whole figure is animated by one
 * compositor-only keyframe and keeps ticking while the main thread is busy.
 */

export const easingPresets: Record<string, string> = {
  linear: "linear",
  smooth: "cubic-bezier(0.45, 0, 0.55, 1)",
  snap: "cubic-bezier(0.85, 0, 0.15, 1)",
  drift: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
}

export function resolveEasing(easing: Easing): string {
  return easingPresets[easing] ?? easing
}

/** Directional easing: rising segments decelerate into the peak, falling ones decay. */
export interface EasingPair {
  rise: string
  fall: string
}

// Curated per-envelope pairs. A pulse of light arrives fast and lands soft
// (ease-out), then decays like an exponential — a quick drop easing into a
// long tail. A breath is sinusoidal both ways. A strobe is near-step up,
// hard drop down.
const envelopeEasingPairs: Record<EnvelopePreset, EasingPair> = {
  pulse: {
    rise: "cubic-bezier(0.22, 0.9, 0.38, 1)",
    fall: "cubic-bezier(0.32, 0.35, 0.6, 1)",
  },
  breathe: {
    rise: "cubic-bezier(0.37, 0, 0.63, 1)",
    fall: "cubic-bezier(0.37, 0, 0.63, 1)",
  },
  flash: {
    rise: "cubic-bezier(0.1, 0.9, 0.3, 1)",
    fall: "cubic-bezier(0.45, 0.1, 0.7, 0.8)",
  },
  heartbeat: {
    rise: "cubic-bezier(0.7, 0, 0.3, 1)",
    fall: "cubic-bezier(0.33, 0.3, 0.55, 1)",
  },
}

/**
 * An explicit `easing` applies to both directions; without one, the
 * envelope's curated rise/fall pair takes over (custom envelopes borrow
 * the `pulse` pair).
 */
export function resolveEasingPair(easing: Easing | undefined, envelope: Envelope): EasingPair {
  if (easing !== undefined) {
    const e = resolveEasing(easing)
    return { rise: e, fall: e }
  }
  if (typeof envelope === "string" && envelope in envelopeEasingPairs) {
    return envelopeEasingPairs[envelope as EnvelopePreset]
  }
  return envelopeEasingPairs.pulse
}

const envelopePresets: Record<string, EnvelopeShape | EnvelopeFrame[]> = {
  pulse: { attack: 0.1, hold: 0.06, release: 0.42 },
  breathe: { attack: 0.45, hold: 0.08, release: 0.47 },
  flash: { attack: 0.02, hold: 0.1, release: 0.16 },
  heartbeat: [
    { at: 0, level: 0 },
    { at: 0.07, level: 1 },
    { at: 0.14, level: 0.2 },
    { at: 0.21, level: 0.75 },
    { at: 0.38, level: 0 },
    { at: 1, level: 0 },
  ],
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
// Levels may deliberately leave [0,1]: below-rest anticipation, past-peak overshoot.
const clampLevel = (v: number) => Math.min(1.5, Math.max(-0.5, v))

function shapeToFrames({ attack, hold = 0, release }: EnvelopeShape): EnvelopeFrame[] {
  const a = clamp01(attack)
  const h = clamp01(hold)
  const r = clamp01(release)
  const peakEnd = Math.min(1, a + h)
  const restAt = Math.min(1, a + h + r)
  const frames: EnvelopeFrame[] = [{ at: 0, level: 0 }, { at: a, level: 1 }]
  if (peakEnd > a) frames.push({ at: peakEnd, level: 1 })
  if (restAt > peakEnd) frames.push({ at: restAt, level: 0 })
  if (restAt < 1) frames.push({ at: 1, level: 0 })
  return frames
}

/** Normalize any envelope input to sorted frames covering 0..1. */
export function resolveEnvelope(envelope: Envelope): EnvelopeFrame[] {
  let frames: EnvelopeFrame[]
  if (typeof envelope === "string") {
    const preset = envelopePresets[envelope] ?? envelopePresets.pulse
    frames = Array.isArray(preset) ? preset : shapeToFrames(preset)
  } else if (Array.isArray(envelope)) {
    frames = [...envelope]
      .map((f) => ({ at: clamp01(f.at), level: clampLevel(f.level) }))
      .sort((a, b) => a.at - b.at)
    if (frames.length === 0) frames = shapeToFrames(envelopePresets.pulse as EnvelopeShape)
    if (frames[0].at > 0) frames.unshift({ at: 0, level: frames[0].level })
    if (frames[frames.length - 1].at < 1)
      frames.push({ at: 1, level: frames[frames.length - 1].level })
  } else {
    frames = shapeToFrames(envelope)
  }
  return frames
}

/** Piecewise-linear envelope value at phase `t`, wrapping outside [0,1]. */
export function levelAt(frames: EnvelopeFrame[], t: number): number {
  const x = ((t % 1) + 1) % 1
  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i]
    const b = frames[i + 1]
    if (x <= b.at) {
      const span = b.at - a.at
      if (span <= 0) return b.level
      return a.level + ((b.level - a.level) * (x - a.at)) / span
    }
  }
  return frames[frames.length - 1].level
}

export interface KeyframeSpec {
  animate: AnimateMode
  frames: EnvelopeFrame[]
  easing: EasingPair
  dim: number
  restScale: number
  amplitude: number
  /** Stretch axis: "y" for upright bars, "x" for flat bars. */
  stretchAxis: "x" | "y"
  respectReducedMotion: boolean
}

const round = (v: number) => Math.round(v * 1000) / 1000

// Follow-through: in fade-scale the transform trails the opacity by a
// fraction of the period, so elements light up a beat before they swell —
// overlapping action instead of lockstep.
const SECONDARY_LAG = 0.06

function frameDecls(spec: KeyframeSpec, opacityLevel: number, transformLevel: number): string {
  const decls: string[] = []
  if (spec.dim < 1) decls.push(`opacity:${round(clamp01(spec.dim + (1 - spec.dim) * opacityLevel))}`)
  const scaleOf = (level: number) =>
    round(Math.max(0, spec.restScale + (1 - spec.restScale) * level))
  switch (spec.animate) {
    case "scale":
    case "fade-scale":
      decls.push(`transform:scale(${scaleOf(transformLevel)})`)
      break
    case "stretch": {
      const fn = spec.stretchAxis === "y" ? "scaleY" : "scaleX"
      decls.push(`transform:${fn}(${scaleOf(transformLevel)})`)
      break
    }
    case "bounce":
      decls.push(`transform:translateY(${round(-spec.amplitude * transformLevel)}px)`)
      break
    case "sway":
      decls.push(`transform:rotate(${round(spec.amplitude * transformLevel)}deg)`)
      break
    case "flip": {
      // Rotate around the element's long axis; perspective inline so no
      // container setup is needed.
      const fn = spec.stretchAxis === "y" ? "rotateY" : "rotateX"
      decls.push(`transform:perspective(140px) ${fn}(${round(spec.amplitude * transformLevel)}deg)`)
      break
    }
    case "fade":
      break
  }
  return decls.join(";")
}

function hash(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

export interface CompiledAnimation {
  /** Injectable stylesheet id (dedupes identical configs). */
  id: string
  css: string
  keyframesName: string
  /** Class carrying the reduced-motion fallback (empty when disabled). */
  className: string
}

/** Compile one shared keyframe rule (plus the reduced-motion fallback) for a spec. */
export function compileAnimation(spec: KeyframeSpec): CompiledAnimation {
  const id = `pulsor-${hash(JSON.stringify(spec))}`
  const name = `${id}-kf`

  const hasLag = spec.animate === "fade-scale"
  const r4 = (v: number) => Math.round(v * 10000) / 10000
  const atSet = new Set<number>([0, 1])
  for (const f of spec.frames) {
    atSet.add(r4(f.at))
    if (hasLag) atSet.add(r4((f.at + SECONDARY_LAG) % 1))
  }
  const points = [...atSet]
    .sort((a, b) => a - b)
    .map((at) => ({
      at,
      o: levelAt(spec.frames, at),
      tr: hasLag ? levelAt(spec.frames, at - SECONDARY_LAG) : levelAt(spec.frames, at),
    }))

  const body = points
    .map((p, i) => {
      const next = points[i + 1]
      let timing = "linear"
      if (next) {
        const delta = next.o !== p.o ? next.o - p.o : next.tr - p.tr
        timing = delta > 0 ? spec.easing.rise : delta < 0 ? spec.easing.fall : "linear"
      }
      return `${round(p.at * 100)}%{${frameDecls(spec, p.o, p.tr)};animation-timing-function:${timing}}`
    })
    .join("")

  let css = `@keyframes ${name}{${body}}`
  let className = ""
  if (spec.respectReducedMotion) {
    className = id
    // Vestibular-safe fallback: no spatial motion, but still visibly alive —
    // a very slow opacity breath instead of a frozen frame.
    const base = spec.dim < 1 ? spec.dim : 0.6
    const peak = round(base + (1 - base) * 0.45)
    css +=
      `@keyframes ${name}-rm{from{opacity:${round(base)}}to{opacity:${peak}}}` +
      `@media (prefers-reduced-motion: reduce){.${id}{animation:${name}-rm 3200ms cubic-bezier(0.37, 0, 0.63, 1) infinite alternate !important;transform:none !important}}`
  }
  return { id, css, keyframesName: name, className }
}

/** One-shot animations for settled states, injected on demand. */
export const STATE_ID = "pulsor-state"
export const STATE_CSS = [
  "@keyframes pulsor-pop{0%{opacity:0;transform:scale(.55)}60%{opacity:1;transform:scale(1.12)}100%{opacity:1;transform:scale(1)}}",
  ".pulsor-pop-c{animation:pulsor-pop 420ms ease backwards}",
  "@keyframes pulsor-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}",
  ".pulsor-shake{animation:pulsor-shake 460ms cubic-bezier(.36,.07,.19,.97)}",
  "@media (prefers-reduced-motion: reduce){.pulsor-pop-c,.pulsor-shake{animation:none !important}}",
].join("")

/**
 * Mount entrance: a 200ms decelerating fade/scale-in. `backwards` fill keeps
 * the loader invisible through any `appearDelay` (the anti-flash pattern)
 * and releases control back to inline styles once done.
 */
export const APPEAR_ID = "pulsor-appear"
export const APPEAR_CSS = [
  "@keyframes pulsor-in{from{opacity:0;transform:scale(0.96)}}",
  ".pulsor-in{animation:pulsor-in 200ms cubic-bezier(0.22, 0.9, 0.36, 1) backwards}",
  "@media (prefers-reduced-motion: reduce){.pulsor-in{animation:none !important}}",
].join("")

const injected = new Set<string>()

// useInsertionEffect never runs during SSR; the animation simply starts on
// hydration. Fall back to useEffect for any renderer that lacks it.
const useIsomorphicInsertion =
  typeof useInsertionEffect === "function" ? useInsertionEffect : useEffect

/** Inject a compiled stylesheet once per id. Styles are tiny and never removed. */
export function useInjectStyles(id: string, css: string, enabled: boolean = true): void {
  useIsomorphicInsertion(() => {
    if (!enabled || injected.has(id)) return
    if (typeof document === "undefined") return
    if (document.getElementById(id)) {
      injected.add(id)
      return
    }
    const el = document.createElement("style")
    el.id = id
    el.setAttribute("data-pulsor", "")
    el.textContent = css
    document.head.appendChild(el)
    injected.add(id)
  }, [id, css, enabled])
}
