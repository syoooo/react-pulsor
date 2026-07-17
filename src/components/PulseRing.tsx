import { useMemo } from "react"
import { linearSliceColors, resolveColors } from "../core/color"
import { CORE_KEYS, htmlAttrs, resolveCore, useLoaderCore } from "../core/internal"
import type { ResolvedCore } from "../core/internal"
import { superellipsePoints } from "../core/path"
import type { RingPoint } from "../core/path"
import { linearPhases } from "../core/patterns"
import type { PulseRingProps, RingAlign, RingPattern } from "../types"

const RING_KEYS = [
  ...CORE_KEYS,
  "pattern",
  "count",
  "ringSize",
  "aspect",
  "squareness",
  "align",
  "length",
  "thickness",
  "radius",
]

export interface ResolvedRing extends ResolvedCore {
  pattern: RingPattern
  count: number
  ringSize: number
  aspect: number
  squareness: number
  align: RingAlign
  length: number
  thickness: number
  radius: number
}

export function resolveRingProps(p: PulseRingProps): ResolvedRing {
  const length = p.length ?? 6
  const thickness = p.thickness ?? 6
  return {
    ...resolveCore(p, "fade"),
    pattern: p.pattern ?? "wave",
    count: p.count ?? 8,
    ringSize: p.ringSize ?? 28,
    aspect: p.aspect ?? 1,
    squareness: p.squareness ?? 2,
    align: p.align ?? "tangent",
    length,
    thickness,
    radius: p.radius ?? Math.min(length, thickness) / 2,
  }
}

export function ringPoints(c: ResolvedRing): RingPoint[] {
  return superellipsePoints(c.count, c.ringSize * c.aspect, c.ringSize, c.squareness)
}

export function ringColors(c: ResolvedRing, phases: number[], points: RingPoint[]): string[] {
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
  // "position" samples by path fraction so the gradient wraps the ring.
  const ts = c.colorBy === "phase" ? phases : phases.map((_, i) => i / c.count)
  return resolveColors(c.palette, ts)
}

const round = (v: number) => Math.round(v * 100) / 100

/**
 * Elements spaced around a superellipse ring — dots when `length` equals
 * `thickness`, ticks when elongated. Tune `aspect` and `squareness` to match
 * the "O" of a typeface; `align` chooses between tracing the outline
 * (tangent, a dashed O) and pointing at the center (radial, clock ticks).
 */
export function PulseRing(props: PulseRingProps) {
  const c = resolveRingProps(props)

  const phases = useMemo(
    () => linearPhases(c.pattern, c.count, c.waves, c.seed),
    [c.pattern, c.count, c.waves, c.seed],
  )
  const order = useMemo(
    () => linearPhases(c.pattern, c.count, 1, c.seed),
    [c.pattern, c.count, c.seed],
  )
  const points = useMemo(
    () => ringPoints(c),
    [c.count, c.ringSize, c.aspect, c.squareness],
  )
  const colors = useMemo(
    () => ringColors(c, phases, points),
    [c.palette, c.colorBy, c.gradientAngle, c.length, c.thickness, c.align, phases, points, c.count],
  )

  const core = useLoaderCore({
    core: c,
    phases,
    order,
    fallbackAmplitude: c.length * 0.9,
    stretchAxis: "x",
  })

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
      {...htmlAttrs(props, RING_KEYS)}
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
