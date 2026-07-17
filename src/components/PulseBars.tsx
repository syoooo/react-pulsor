import { useMemo } from "react"
import { linearSliceColors, resolveColors } from "../core/color"
import { CORE_KEYS, htmlAttrs, resolveCore, spread, useLoaderCore } from "../core/internal"
import type { ResolvedCore } from "../core/internal"
import { stripedO } from "../core/path"
import type { StripeSegment } from "../core/path"
import { linearPhases } from "../core/patterns"
import type { BarsPattern, PulseBarsProps, StretchOrigin } from "../types"

const BARS_KEYS = [
  ...CORE_KEYS,
  "pattern",
  "arrangement",
  "count",
  "orientation",
  "thickness",
  "length",
  "gap",
  "radius",
  "origin",
  "ringSize",
  "aspect",
  "squareness",
  "stroke",
]

export interface ResolvedBars extends ResolvedCore {
  pattern: BarsPattern
  glyph: boolean
  vertical: boolean
  count: number
  thickness: number
  length: number
  gap: number
  radius: number
  origin: StretchOrigin
  ringSize: number
  aspect: number
  squareness: number
  stroke: number
}

export function resolveBarsProps(p: PulseBarsProps): ResolvedBars {
  const glyph = (p.arrangement ?? "line") === "loop"
  const ringSize = p.ringSize ?? 28
  return {
    ...resolveCore(p, "stretch"),
    pattern: p.pattern ?? "wave",
    glyph,
    // Line bars stand upright by default; loop stripes lie flat.
    vertical: (p.orientation ?? (glyph ? "horizontal" : "vertical")) === "vertical",
    count: p.count ?? (glyph ? 8 : 5),
    thickness: p.thickness ?? (glyph ? 3 : 4),
    length: p.length ?? 18,
    gap: p.gap ?? 3,
    radius: p.radius ?? 2,
    origin: p.origin ?? "center",
    ringSize,
    aspect: p.aspect ?? 1,
    squareness: p.squareness ?? 2,
    stroke: p.stroke ?? ringSize * 0.3,
  }
}

export function barsSegments(c: ResolvedBars): StripeSegment[] {
  if (!c.glyph) return []
  return stripedO(
    c.count,
    c.ringSize * c.aspect,
    c.ringSize,
    c.squareness,
    c.stroke,
    c.thickness,
    !c.vertical,
  )
}

/** One background per rendered element: per segment in a loop, per bar in a line. */
export function barsColors(
  c: ResolvedBars,
  phases: number[],
  segments: StripeSegment[],
): string[] {
  if (c.glyph) {
    if (c.colorBy === "linear") {
      return linearSliceColors(
        c.palette,
        segments.map((s) => ({ cx: s.cx, cy: s.cy, w: s.w, h: s.h })),
        c.gradientAngle,
      )
    }
    const stripeColors = resolveColors(c.palette, c.colorBy === "phase" ? phases : spread(c.count))
    return segments.map((seg) => stripeColors[seg.stripe])
  }
  if (c.colorBy === "linear") {
    const pitch = c.thickness + c.gap
    return linearSliceColors(
      c.palette,
      phases.map((_, i) => ({
        cx: c.vertical ? (i - (c.count - 1) / 2) * pitch : 0,
        cy: c.vertical ? 0 : (i - (c.count - 1) / 2) * pitch,
        w: c.vertical ? c.thickness : c.length,
        h: c.vertical ? c.length : c.thickness,
      })),
      c.gradientAngle,
    )
  }
  return resolveColors(c.palette, c.colorBy === "phase" ? phases : spread(c.count))
}

export function barsTransformOrigin(c: ResolvedBars): string {
  if (c.origin === "center") return "center"
  if (c.vertical) return c.origin === "end" ? "bottom" : "top"
  return c.origin === "end" ? "right" : "left"
}

const round = (v: number) => Math.round(v * 100) / 100

/**
 * Bars in a line (equalizer, drafting strip) or stacked into a striped
 * closed loop — parallel pills traced along a superellipse outline whose
 * aspect, squareness and stroke depth are all tunable.
 */
export function PulseBars(props: PulseBarsProps) {
  const c = resolveBarsProps(props)

  const phases = useMemo(
    () => linearPhases(c.pattern, c.count, c.waves, c.seed),
    [c.pattern, c.count, c.waves, c.seed],
  )
  const order = useMemo(
    () => linearPhases(c.pattern, c.count, 1, c.seed),
    [c.pattern, c.count, c.seed],
  )
  const segments = useMemo(
    () => barsSegments(c),
    [c.glyph, c.count, c.ringSize, c.aspect, c.squareness, c.stroke, c.thickness, c.vertical],
  )
  const colors = useMemo(
    () => barsColors(c, phases, segments),
    [c.palette, c.colorBy, c.gradientAngle, c.glyph, c.vertical, c.thickness, c.length, c.gap, phases, segments],
  )

  const core = useLoaderCore({
    core: c,
    phases,
    order,
    fallbackAmplitude: c.length / 2,
    stretchAxis: c.vertical ? "y" : "x",
  })

  const rest = htmlAttrs(props, BARS_KEYS)

  if (c.glyph) {
    const boxW = c.ringSize * c.aspect
    const boxH = c.ringSize
    return (
      <span
        role="status"
        aria-label={c.label}
        className={core.containerClass(props.className)}
        style={{
          display: "inline-block",
          position: "relative",
          width: round(boxW),
          height: round(boxH),
          lineHeight: 0,
          verticalAlign: "middle",
          ...core.containerStyle,
          ...props.style,
        }}
        {...rest}
      >
        {segments.map((seg, i) => (
          <span
            key={i}
            className={core.cellClass(seg.stripe)}
            style={{
              position: "absolute",
              left: round(boxW / 2 + seg.cx - seg.w / 2),
              top: round(boxH / 2 + seg.cy - seg.h / 2),
              width: round(seg.w),
              height: round(seg.h),
              borderRadius: c.radius,
              background: colors[i],
              ...core.cellStyle(seg.stripe),
            }}
          />
        ))}
      </span>
    )
  }

  const barOrigin = barsTransformOrigin(c)

  return (
    <span
      role="status"
      aria-label={c.label}
      className={core.containerClass(props.className)}
      style={{
        display: "inline-flex",
        flexDirection: c.vertical ? "row" : "column",
        alignItems: "center",
        gap: c.gap,
        lineHeight: 0,
        verticalAlign: "middle",
        ...core.containerStyle,
        ...props.style,
      }}
      {...rest}
    >
      {phases.map((_, i) => (
        <span
          key={i}
          className={core.cellClass(i)}
          style={{
            display: "block",
            width: c.vertical ? c.thickness : c.length,
            height: c.vertical ? c.length : c.thickness,
            borderRadius: c.radius,
            background: colors[i],
            transformOrigin: barOrigin,
            ...core.cellStyle(i),
          }}
        />
      ))}
    </span>
  )
}
