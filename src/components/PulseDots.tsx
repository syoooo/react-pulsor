import { useMemo } from "react"
import { linearSliceColors, resolveColors } from "../core/color"
import { CORE_KEYS, htmlAttrs, resolveCore, spread, useLoaderCore } from "../core/internal"
import type { ResolvedCore } from "../core/internal"
import { linearPhases } from "../core/patterns"
import type { DotsPattern, PulseDotsProps } from "../types"

const DOTS_KEYS = [...CORE_KEYS, "pattern", "count", "size", "gap", "radius"]

export interface ResolvedDots extends ResolvedCore {
  pattern: DotsPattern
  count: number
  size: number
  gap: number
  radius: number
}

export function resolveDotsProps(p: PulseDotsProps): ResolvedDots {
  const size = p.size ?? 7
  return {
    ...resolveCore(p, "scale"),
    pattern: p.pattern ?? "wave",
    count: p.count ?? 3,
    size,
    gap: p.gap ?? 4,
    radius: p.radius ?? size / 2,
  }
}

export function dotsColors(c: ResolvedDots, phases: number[]): string[] {
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

/** A row of dots — the typing indicator and its relatives. */
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
  const colors = useMemo(
    () => dotsColors(c, phases),
    [c.palette, c.colorBy, c.gradientAngle, c.size, c.gap, phases, c.count],
  )

  const core = useLoaderCore({
    core: c,
    phases,
    order,
    fallbackAmplitude: c.size * 0.9,
    stretchAxis: "y",
  })

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
