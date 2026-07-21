import type { CSSProperties } from "react"
import { useMemo } from "react"
import type {
  AnimateMode,
  ColorBy,
  CoreProps,
  Easing,
  Envelope,
  FeelPreset,
  LoaderState,
  PaletteInput,
} from "../types"
import {
  APPEAR_CSS,
  APPEAR_ID,
  compileAnimation,
  resolveEasingPair,
  resolveEnvelope,
  STATE_CSS,
  STATE_ID,
  useInjectStyles,
} from "./engine"

/** Per-mode resting defaults, applied when the caller doesn't pin them. */
export function motionDefaults(
  mode: AnimateMode,
  props: Pick<CoreProps, "dim" | "restScale" | "amplitude">,
  fallbackAmplitude: number,
): { dim: number; restScale: number; amplitude: number } {
  const dim = props.dim ?? (mode === "fade" ? 0.12 : mode === "fade-scale" ? 0.25 : 1)
  const restScale =
    props.restScale ??
    (mode === "scale" ? 0.45 : mode === "fade-scale" ? 0.6 : mode === "stretch" ? 0.3 : 1)
  const amplitude =
    props.amplitude ?? (mode === "sway" ? 14 : mode === "flip" ? 180 : fallbackAmplitude)
  return { dim, restScale, amplitude }
}

interface FeelDefaults {
  envelope: Envelope
  easing?: Easing
  periodScale: number
}

const feelPresets: Record<FeelPreset, FeelDefaults> = {
  calm: { envelope: "breathe", periodScale: 1.6 },
  crisp: { envelope: "pulse", periodScale: 1 },
  lively: {
    envelope: [
      { at: 0, level: 0 },
      { at: 0.05, level: -0.1 },
      { at: 0.16, level: 1.08 },
      { at: 0.24, level: 1 },
      { at: 0.6, level: 0 },
      { at: 1, level: 0 },
    ],
    easing: "spring",
    periodScale: 0.85,
  },
  urgent: { envelope: "flash", easing: "snap", periodScale: 0.7 },
}

/** The envelope/easing/period defaults a `feel` personality provides. */
export function resolveFeel(feel: FeelPreset | undefined): FeelDefaults | null {
  return feel ? feelPresets[feel] : null
}

/** Merge explicit motion props with the feel's defaults (explicit wins). */
export function resolveMotionInputs(props: {
  feel?: FeelPreset
  envelope?: Envelope
  easing?: Easing
  period?: number
}): { envelope: Envelope; easing: Easing | undefined; period: number } {
  const feel = resolveFeel(props.feel)
  return {
    envelope: props.envelope ?? feel?.envelope ?? "pulse",
    easing: props.easing ?? feel?.easing,
    period: props.period ?? Math.round(900 * (feel?.periodScale ?? 1)),
  }
}

export interface MotionConfig {
  mode: AnimateMode
  envelope: Envelope
  easing: Easing | undefined
  period: number
  dim: number
  restScale: number
  amplitude: number
  stretchAxis: "x" | "y"
  respectReducedMotion: boolean
}

export interface Motion {
  /** Class applying the reduced-motion freeze (may be empty). */
  className: string
  /** Inline animation longhands for the element at the given phase (0..1). */
  cellStyle: (phase: number) => CSSProperties
}

/** Compile + inject the shared keyframe rule, return per-element style factory. */
export function useMotion(config: MotionConfig): Motion {
  const compiled = useMemo(
    () =>
      compileAnimation({
        animate: config.mode,
        frames: resolveEnvelope(config.envelope),
        easing: resolveEasingPair(config.easing, config.envelope),
        dim: config.dim,
        restScale: config.restScale,
        amplitude: config.amplitude,
        stretchAxis: config.stretchAxis,
        respectReducedMotion: config.respectReducedMotion,
      }),
    [
      config.mode,
      JSON.stringify(config.envelope),
      config.easing,
      config.dim,
      config.restScale,
      config.amplitude,
      config.stretchAxis,
      config.respectReducedMotion,
    ],
  )
  useInjectStyles(compiled.id, compiled.css)
  const period = config.period
  return {
    className: compiled.className,
    cellStyle: (phase: number) => ({
      animationName: compiled.keyframesName,
      animationDuration: `${period}ms`,
      animationTimingFunction: "linear",
      animationIterationCount: "infinite",
      animationDelay: `${Math.round(-phase * period)}ms`,
    }),
  }
}

/**
 * Live-region semantics for a labeled loader; an empty label marks the
 * figure as decorative instead of announcing an anonymous "status".
 */
export function ariaProps(label: string): Record<string, unknown> {
  return label ? { role: "status", "aria-label": label } : { "aria-hidden": true }
}

/** Spatial color-sampling positions: 0..1 across `count` slots. */
export function spread(count: number): number[] {
  if (count <= 1) return [0.5]
  return Array.from({ length: count }, (_, i) => i / (count - 1))
}

/** Props every component handles itself (everything else spreads onto the DOM node). */
export const CORE_KEYS = [
  "palette",
  "colorBy",
  "gradientAngle",
  "animate",
  "feel",
  "envelope",
  "easing",
  "period",
  "waves",
  "dim",
  "restScale",
  "amplitude",
  "seed",
  "state",
  "progress",
  "successColor",
  "errorColor",
  "intensity",
  "appear",
  "appearDelay",
  "label",
  "respectReducedMotion",
  "className",
  "style",
] as const

/** The HTML attributes left over after removing the component's own props. */
export function htmlAttrs<P extends object>(
  props: P,
  ownKeys: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key in props) {
    if (!ownKeys.includes(key)) out[key] = (props as Record<string, unknown>)[key]
  }
  return out
}

/** Shared props with defaults applied — the single source for components and `cssSnippet`. */
export interface ResolvedCore {
  palette: PaletteInput
  colorBy: ColorBy
  gradientAngle: number
  animate: AnimateMode
  feel?: FeelPreset
  envelope?: Envelope
  easing?: Easing
  period?: number
  waves: number
  dim?: number
  restScale?: number
  amplitude?: number
  seed: number
  state: LoaderState
  progress?: number
  successColor: string
  errorColor: string
  intensity: number
  appear: boolean
  appearDelay: number
  label: string
  respectReducedMotion: boolean
}

export function resolveCore(p: CoreProps, defaultAnimate: AnimateMode): ResolvedCore {
  return {
    palette: p.palette ?? "aurora",
    colorBy: p.colorBy ?? "position",
    gradientAngle: p.gradientAngle ?? 45,
    animate: p.animate ?? defaultAnimate,
    feel: p.feel,
    envelope: p.envelope,
    easing: p.easing,
    period: p.period,
    waves: p.waves ?? 1,
    dim: p.dim,
    restScale: p.restScale,
    amplitude: p.amplitude,
    seed: p.seed ?? 7,
    state: p.state ?? "loading",
    progress: p.progress,
    successColor: p.successColor ?? "#34D399",
    errorColor: p.errorColor ?? "#F87171",
    intensity: p.intensity ?? 1,
    appear: p.appear ?? true,
    appearDelay: p.appearDelay ?? 0,
    label: p.label ?? "Loading",
    respectReducedMotion: p.respectReducedMotion ?? true,
  }
}

export interface LoaderCore {
  containerClass: (userClassName?: string) => string | undefined
  containerStyle: CSSProperties
  cellClass: (i: number) => string | undefined
  cellStyle: (i: number) => CSSProperties
}

/**
 * Everything the four components share: motion compilation, settled states,
 * progress fill, intensity and entrance. `i` indexes logical elements (a
 * loop stripe's two segments share one index).
 */
export function useLoaderCore(args: {
  core: ResolvedCore
  phases: number[]
  order: number[]
  fallbackAmplitude: number
  stretchAxis: "x" | "y"
  stencil?: boolean[]
}): LoaderCore {
  const { core, phases } = args
  const rest = motionDefaults(
    core.animate,
    { dim: core.dim, restScale: core.restScale, amplitude: core.amplitude },
    args.fallbackAmplitude,
  )
  const inputs = resolveMotionInputs(core)
  const motion = useMotion({
    mode: core.animate,
    ...inputs,
    ...rest,
    stretchAxis: args.stretchAxis,
    respectReducedMotion: core.respectReducedMotion,
  })
  const sr = useLoaderState({
    state: core.state,
    progress: core.progress,
    intensity: core.intensity,
    order: args.order,
    stencil: args.stencil,
    successColor: core.successColor,
    errorColor: core.errorColor,
    dim: rest.dim,
    appear: core.appear,
    appearDelay: core.appearDelay,
  })
  return {
    containerClass: (userClassName) =>
      [userClassName, sr.containerClass].filter(Boolean).join(" ") || undefined,
    containerStyle: sr.containerStyle,
    cellClass: (i) => (sr.active ? sr.cellClass(i) : motion.className) || undefined,
    cellStyle: (i) => (sr.active ? sr.cellStyle(i) : motion.cellStyle(phases[i])),
  }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export interface LoaderStateOpts {
  state: LoaderState
  progress: number | undefined
  intensity: number
  /** Normalized fill order per element (pattern distance with waves = 1). */
  order: number[]
  /** Grid-only glyph stencil; other geometries settle whole. */
  stencil?: boolean[]
  successColor: string
  errorColor: string
  dim: number
  appear: boolean
  appearDelay: number
}

export interface LoaderStateRender {
  /** True when state/progress rendering replaces the loop animation. */
  active: boolean
  containerClass?: string
  containerStyle: CSSProperties
  cellClass: (i: number) => string | undefined
  cellStyle: (i: number) => CSSProperties
}

/** Settled-state, determinate-progress and intensity rendering, shared by all geometries. */
export function useLoaderState(o: LoaderStateOpts): LoaderStateRender {
  const settled = o.state !== "loading"
  const progressing = !settled && o.progress !== undefined
  useInjectStyles(STATE_ID, STATE_CSS, settled)
  useInjectStyles(APPEAR_ID, APPEAR_CSS, o.appear)

  const i = clamp01(o.intensity)
  const containerStyle: CSSProperties =
    i < 1
      ? {
          opacity: 0.35 + 0.65 * i,
          transform: `scale(${round3(0.94 + 0.06 * i)})`,
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }
      : {}
  // The delay only matters while entering; drop it once settled so it can't
  // postpone the state animations (shake shares the container).
  if (o.appear && !settled && o.appearDelay > 0) {
    containerStyle.animationDelay = `${o.appearDelay}ms`
  }

  const containerClasses = [o.appear ? "pulsor-in" : "", o.state === "error" ? "pulsor-shake" : ""]
    .filter(Boolean)
    .join(" ")

  const unlit = o.dim < 1 ? o.dim : 0.25

  return {
    active: settled || progressing,
    containerClass: containerClasses || undefined,
    containerStyle,
    cellClass: (idx) =>
      settled && (o.stencil ? o.stencil[idx] : true) ? "pulsor-pop-c" : undefined,
    cellStyle: (idx) => {
      if (progressing) {
        const lit = o.order[idx] <= (o.progress ?? 0) + 1e-6
        return { opacity: lit ? 1 : unlit, transition: "opacity 0.3s ease" }
      }
      if (!settled) return {}
      const on = o.stencil ? o.stencil[idx] : true
      if (!on) return { opacity: 0.07, transition: "opacity 0.3s ease" }
      return {
        background: o.state === "success" ? o.successColor : o.errorColor,
        animationDelay: `${Math.round(o.order[idx] * 260)}ms`,
      }
    },
  }
}

const round3 = (v: number) => Math.round(v * 1000) / 1000
