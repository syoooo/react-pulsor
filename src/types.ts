import type { HTMLAttributes } from "react"

/** A color stop along a gradient. `position` is 0..1. */
export interface GradientStop {
  /** Any CSS color. */
  color: string
  /** Position along the gradient, 0..1. */
  position: number
}

/**
 * Palette input:
 * - a preset name (`"aurora"`, `"ember"`, …)
 * - a single CSS color (every element gets that color)
 * - an array of gradient stops (sampled in OKLab)
 */
export type PaletteInput = string | GradientStop[]

/**
 * How each element picks its color from the palette:
 * - `"position"` — by where the element sits in space (grid row, bar index,
 *   dot index / ring angle). The palette reads like a backdrop.
 * - `"phase"` — by when the element fires. The palette travels with the wave.
 * - `"linear"` — one linear gradient laid across the whole figure
 *   (direction set by `gradientAngle`); every element shows its exact local
 *   slice, so the gradient runs continuously through the gaps.
 */
export type ColorBy = "position" | "phase" | "linear"

/**
 * Which visual property the envelope drives. All modes are compositor-only.
 * `sway` rotates around the element's pivot (`origin` on line bars — bottom
 * pivot reads as grass in wind, center as a metronome); `flip` turns the
 * element around its own long axis in 3D, louver-style.
 */
export type AnimateMode = "fade" | "scale" | "fade-scale" | "stretch" | "bounce" | "sway" | "flip"

/** Named easing curves; any CSS `animation-timing-function` string also works. */
export type EasingPreset = "linear" | "smooth" | "snap" | "drift" | "spring"
export type Easing = EasingPreset | (string & {})

/** One point of a custom envelope: at phase `at` (0..1) the element is at `level` (0=rest, 1=peak). */
export interface EnvelopeFrame {
  at: number
  level: number
}

/**
 * ADSR-style envelope: fractions of one period spent rising (`attack`),
 * held at peak (`hold`) and falling back (`release`). Whatever remains of
 * the period is rest. All values 0..1.
 */
export interface EnvelopeShape {
  attack: number
  hold?: number
  release: number
}

export type EnvelopePreset = "pulse" | "breathe" | "flash" | "heartbeat"

/**
 * Envelope input: a preset name, an ADSR shape, or explicit frames. Frame
 * levels may leave [0,1]: slightly negative = below-rest anticipation,
 * above 1 = past-peak overshoot.
 */
export type Envelope = EnvelopePreset | EnvelopeShape | EnvelopeFrame[]

/**
 * Motion personality — one knob that sets envelope, easing and tempo
 * defaults together (explicit props always win):
 * - `"calm"` — premium: slow sinusoidal breathing.
 * - `"crisp"` — corporate: the standard pulse (same as no feel).
 * - `"lively"` — playful: a wind-up dip, an overshooting peak, springy rise.
 * - `"urgent"` — energetic: strobe envelope, snap easing, fast tempo.
 */
export type FeelPreset = "calm" | "crisp" | "lively" | "urgent"

/**
 * Loader lifecycle. `"success"` and `"error"` settle the figure: grids morph
 * into a ✓ / ✗ stencil, other geometries snap to the state color (errors
 * shake once). Default `"loading"`.
 */
export type LoaderState = "loading" | "success" | "error"

/** Props shared by every Pulsor component. */
export interface CoreProps {
  /** Palette preset name, CSS color, or gradient stops. Default `"aurora"`. */
  palette?: PaletteInput
  /** Color elements by spatial position or by animation phase. Default `"position"`. */
  colorBy?: ColorBy
  /** CSS-style direction for `colorBy="linear"`, degrees (0 = up, 90 = right). Default `45`. */
  gradientAngle?: number
  /** Which property animates. Component-specific default. */
  animate?: AnimateMode
  /** Motion personality: default source for envelope, easing and tempo. */
  feel?: FeelPreset
  /** Intensity curve of one beat. Default `"pulse"` (or the feel's envelope). */
  envelope?: Envelope
  /**
   * Easing between envelope frames. Default: automatic — each envelope
   * preset carries a curated rise/fall pair (rising segments decelerate
   * into the peak, falling ones decay fast-then-slow). Set explicitly to
   * use one curve for both directions.
   */
  easing?: Easing
  /** Milliseconds for one full sweep. Default `900`, scaled by `feel`. */
  period?: number
  /** Number of simultaneous wavefronts travelling the field. Default `1`. */
  waves?: number
  /** Resting opacity, 0..1. Defaults depend on `animate`. */
  dim?: number
  /** Resting scale for `scale` / `fade-scale` / `stretch` modes, 0..1. */
  restScale?: number
  /** Peak travel: px for `bounce`, degrees for `sway` (default 14) and `flip` (default 180). */
  amplitude?: number
  /** Seed for the `sparkle` pattern's deterministic shuffle. Default `7`. */
  seed?: number
  /** Loader lifecycle — settle into success / error. Default `"loading"`. */
  state?: LoaderState
  /**
   * 0..1 — when set (and `state` is `"loading"`), replaces the loop with a
   * determinate fill: elements light up in pattern order as progress grows.
   */
  progress?: number
  /** Color the figure settles to on success. Default `"#34D399"`. */
  successColor?: string
  /** Color the figure settles to on error. Default `"#F87171"`. */
  errorColor?: string
  /**
   * 0..1 — live activity level; the loader breathes with it (opacity and a
   * subtle scale, smoothly transitioned). Feed it from a token stream via
   * `useStreamIntensity`. Default `1`.
   */
  intensity?: number
  /** Gentle 200ms fade/scale entrance on mount. Default `true`. */
  appear?: boolean
  /**
   * Ms to stay invisible before entering — the "don't flash a spinner for
   * fast loads" pattern. Default `0`.
   */
  appearDelay?: number
  /** Accessible label. Default `"Loading"`. */
  label?: string
  /** Freeze to a static frame under `prefers-reduced-motion`. Default `true`. */
  respectReducedMotion?: boolean
}

export type GridPattern =
  | "sweep-up"
  | "sweep-down"
  | "sweep-left"
  | "sweep-right"
  | "diagonal"
  | "chevron"
  | "snake"
  | "ripple"
  | "spiral"
  | "sparkle"
  | "pulse"

export interface PulseGridProps extends CoreProps, HTMLAttributes<HTMLSpanElement> {
  /** Phase field over the grid. Default `"ripple"`. */
  pattern?: GridPattern
  /** Grid rows. Default `4`. */
  rows?: number
  /** Grid columns. Default `4`. */
  cols?: number
  /** Cell edge length in px. Default `6`. */
  cellSize?: number
  /** Gap between cells in px. Default `3`. */
  gap?: number
  /** Cell corner radius in px. Default `1.5`. */
  radius?: number
}

/** Phase field over a 1-D sequence of elements. */
export type SequencePattern =
  | "wave"
  | "wave-reverse"
  | "center"
  | "edges"
  | "alternate"
  | "sparkle"
  | "pulse"

export type BarsPattern = SequencePattern
export type DotsPattern = SequencePattern
export type RingPattern = SequencePattern

export type BarsOrientation = "vertical" | "horizontal"

/** Which end of a bar stays fixed while it stretches. */
export type StretchOrigin = "center" | "start" | "end"

/**
 * `"line"` — bars in a straight line (equalizer, drafting strip).
 * `"loop"` — bars stacked into a striped closed loop: parallel pills traced
 * along the outline, the middle rows split in two around the opening.
 */
export type BarsArrangement = "line" | "loop"

export interface PulseBarsProps extends CoreProps, HTMLAttributes<HTMLSpanElement> {
  /** Phase field over the bars (per stripe in the `"loop"` arrangement). Default `"wave"`. */
  pattern?: BarsPattern
  /** Bars in a line or stacked into a striped loop. Default `"line"`. */
  arrangement?: BarsArrangement
  /** Number of bars (stripes in a loop). Default `5` in a line, `8` in a loop. */
  count?: number
  /**
   * Stripe direction. Line: `"vertical"` = upright bars side by side,
   * `"horizontal"` = stacked flat bars. Defaults to `"vertical"` in a line
   * and `"horizontal"` in a loop.
   */
  orientation?: BarsOrientation
  /** Bar thickness in px. Default `4` in a line, `3` in a loop. */
  thickness?: number
  /** Bar length in px (line only). Default `18`. */
  length?: number
  /** Gap between bars in px (line only). Default `3`. */
  gap?: number
  /** Bar corner radius in px. Default `2`. */
  radius?: number
  /** Fixed end for `stretch` (line only). Default `"center"`. */
  origin?: StretchOrigin
  /** Loop height in px (loop only). Default `28`. */
  ringSize?: number
  /** Loop width ÷ height (loop only): `1` round, `<1` narrower. Default `1`. */
  aspect?: number
  /** Superellipse exponent (loop only): `2` oval, `4` squarish, `1` diamond. Default `2`. */
  squareness?: number
  /** How far each pill reaches inward from the outline, px (loop only). Default `ringSize * 0.3`. */
  stroke?: number
}

/**
 * `"line"` — a row of dots (the typing indicator and its relatives).
 * `"loop"` — elements spaced (uniformly by arc length) around a closed
 * superellipse: dots when `length` equals `thickness`, ticks when elongated.
 */
export type DotsArrangement = "line" | "loop"

/**
 * How loop elements sit on the path: `"tangent"` traces the outline (a
 * dashed "O"), `"radial"` points at the center (clock-tick spinner).
 * Irrelevant for round dots (`length === thickness`).
 */
export type RingAlign = "tangent" | "radial"

export interface PulseDotsProps extends CoreProps, HTMLAttributes<HTMLSpanElement> {
  /** Phase field over the sequence. Default `"wave"`. */
  pattern?: DotsPattern
  /** Dots in a line or around a closed loop. Default `"line"`. */
  arrangement?: DotsArrangement
  /** Number of elements. Default `3` in a line, `8` on a loop. */
  count?: number
  /** Dot diameter in px (line only). Default `7`. */
  size?: number
  /** Gap between dots in px (line only). Default `4`. */
  gap?: number
  /** Loop height in px through element centers (loop only). Default `28`. */
  ringSize?: number
  /** Loop width ÷ height (loop only): `1` circle, `<1` narrower. Default `1`. */
  aspect?: number
  /** Superellipse exponent (loop only): `2` ellipse, `4` squircle, `1` diamond. Default `2`. */
  squareness?: number
  /** Element alignment on the path (loop only). Default `"tangent"`. */
  align?: RingAlign
  /** Element length along its alignment in px (loop only). Default `6`. */
  length?: number
  /** Element thickness in px (loop only). Default `6` (equal to `length` = a dot). */
  thickness?: number
  /** Corner radius in px. Defaults to a half-circle of the element. */
  radius?: number
}
