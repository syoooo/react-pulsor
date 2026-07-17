import { useMemo } from "react"
import { linearSliceColors, resolveColors } from "../core/color"
import { CORE_KEYS, htmlAttrs, resolveCore, spread, useLoaderCore } from "../core/internal"
import type { ResolvedCore } from "../core/internal"
import { superellipsePoints } from "../core/path"
import type { RingPoint } from "../core/path"
import { linearPhases } from "../core/patterns"
import type { DotsPattern, PulseDotsProps, RingAlign } from "../types"

const DOTS_KEYS = [
  ...CORE_KEYS,
  "pattern",
  "arrangement",
  "count",
  "size",
  "gap",
  "ringSize",
  "aspect",
  "squareness",
  "align",
  "length",
  "thickness",
  "radius",
]

export interface ResolvedDots extends ResolvedCore {
  pattern: DotsPattern
  loop: boolean
  count: number
  size: number
  gap: number
  ringSize: number
  aspect: number
  squareness: number
  align: RingAlign
  length: number
  thickness: number
  radius: number
}

export function resolveDotsProps(p: PulseDotsProps): ResolvedDots {
  const loop = (p.arrangement ?? "line") === "loop"
  const size = p.size ?? 7
  const length = p.length ?? 6
  const thickness = p.thickness ?? 6
  return {
    ...resolveCore(p, loop ? "fade" : "scale"),
    pattern: p.pattern ?? "wave",
    loop,
    count: p.count ?? (loop ? 8 : 3),
    size,
    gap: p.gap ?? 4,
    ringSize: p.ringSize ?? 28,
    aspect: p.aspect ?? 1,
    squareness: p.squareness ?? 2,
    align: p.align ?? "tangent",
    length,
    thickness,
    radius: p.radius ?? (loop ? Math.min(length, thickness) / 2 : size / 2),
  }
}

export function dotsPoints(c: ResolvedDots): RingPoint[] {
  if (!c.loop) return []
  return superellipsePoints(c.count, c.ringSize * c.aspect, c.ringSize, c.squareness)
}

export function dotsColors(c: ResolvedDots, phases: number[], points: RingPoint[]): string[] {
  if (c.loop) {
    if (c.colorBy === "linear") {
      return linearSliceColors(
        c.palette,
        points.map((p) => ({
          cx: p.x,
          cy: p.y,
          w: c.length,
          h: c.thickness,
          rotation: c.align === "tangent" ? p.tangent : p.radial,
        })),
        c.gradientAngle,
      )
    }
    // "position" samples by path fraction so the gradient wraps the loop.
    const ts = c.colorBy === "phase" ? phases : phases.map((_, i) => i / c.count)
    return resolveColors(c.palette, ts)
  }
  if (c.colorBy === "linear") {
    const pitch = c.size + c.gap
    return linearSliceColors(
      c.palette,
      phases.map((_, i) => ({ cx: (i - (c.count - 1) / 2) * pitch, cy: 0, w: c.size, h: c.size })),
      c.gradientAngle,
    )
  }
  return resolveColors(c.palette, c.colorBy === "phase" ? phases : spread(c.count))
}

const round = (v: number) => Math.round(v * 100) / 100

/**
 * A row of dots (the typing indicator and its relatives), or elements spaced
 * uniformly by arc length around a superellipse loop — dots when `length`
 * equals `thickness`, ticks when elongated. On a loop, `align` chooses
 * between tracing the outline (tangent, a dashed O) and pointing at the
 * center (radial, clock ticks).
 */
export function PulseDots(props: PulseDotsProps) {
  const c = resolveDotsProps(props)

  const phases = useMemo(
    () => linearPhases(c.pattern, c.count, c.waves, c.seed),
    [c.pattern, c.count, c.waves, c.seed],
  )
  const order = useMemo(
    () => linearPhases(c.pattern, c.count, 1, c.seed),
    [c.pattern, c.count, c.seed],
  )
  const points = useMemo(
    () => dotsPoints(c),
    [c.loop, c.count, c.ringSize, c.aspect, c.squareness],
  )
  const colors = useMemo(
    () => dotsColors(c, phases, points),
    [c.palette, c.colorBy, c.gradientAngle, c.loop, c.size, c.gap, c.length, c.thickness, c.align, phases, points, c.count],
  )

  const core = useLoaderCore({
    core: c,
    phases,
    order,
    fallbackAmplitude: (c.loop ? c.length : c.size) * 0.9,
    stretchAxis: c.loop ? "x" : "y",
  })

  if (c.loop) {
    const pad = Math.max(c.length, c.thickness)
    const boxW = c.ringSize * c.aspect + pad * 2
    const boxH = c.ringSize + pad * 2
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
        {...htmlAttrs(props, DOTS_KEYS)}
      >
        {points.map((p, i) => {
          const angle = c.align === "tangent" ? p.tangent : p.radial
          return (
            <span
              key={i}
              style={{
                position: "absolute",
                left: round(boxW / 2 + p.x - c.length / 2),
                top: round(boxH / 2 + p.y - c.thickness / 2),
                width: c.length,
                height: c.thickness,
                transform: `rotate(${round((angle * 180) / Math.PI)}deg)`,
              }}
            >
              <span
                className={core.cellClass(i)}
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  borderRadius: c.radius,
                  background: colors[i],
                  ...core.cellStyle(i),
                }}
              />
            </span>
          )
        })}
      </span>
    )
  }

  return (
    <span
      role="status"
      aria-label={c.label}
      className={core.containerClass(props.className)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: c.gap,
        lineHeight: 0,
        verticalAlign: "middle",
        ...core.containerStyle,
        ...props.style,
      }}
      {...htmlAttrs(props, DOTS_KEYS)}
    >
      {phases.map((_, i) => (
        <span
          key={i}
          className={core.cellClass(i)}
          style={{
            display: "block",
            width: c.size,
            height: c.size,
            borderRadius: c.radius,
            background: colors[i],
            ...core.cellStyle(i),
          }}
        />
      ))}
    </span>
  )
}
