import { useMemo } from "react"
import { linearSliceColors, resolveColors } from "../core/color"
import { stencilCells } from "../core/glyphs"
import type { ResolvedCore } from "../core/internal"
import {
  ariaProps,
  CORE_KEYS,
  htmlAttrs,
  resolveCore,
  spread,
  useLoaderCore,
} from "../core/internal"
import { gridPhases } from "../core/patterns"
import type { GridPattern, PulseGridProps } from "../types"

const GRID_KEYS = [...CORE_KEYS, "pattern", "rows", "cols", "cellSize", "gap", "radius"]

export interface ResolvedGrid extends ResolvedCore {
  pattern: GridPattern
  rows: number
  cols: number
  cellSize: number
  gap: number
  radius: number
}

export function resolveGridProps(p: PulseGridProps): ResolvedGrid {
  return {
    ...resolveCore(p, "fade"),
    pattern: p.pattern ?? "ripple",
    rows: p.rows ?? 4,
    cols: p.cols ?? 4,
    cellSize: p.cellSize ?? 6,
    gap: p.gap ?? 3,
    radius: p.radius ?? 1.5,
  }
}

export function gridColors(c: ResolvedGrid, phases: number[]): string[] {
  if (c.colorBy === "phase") return resolveColors(c.palette, phases)
  if (c.colorBy === "linear") {
    const pitch = c.cellSize + c.gap
    return linearSliceColors(
      c.palette,
      phases.map((_, i) => ({
        cx: ((i % c.cols) - (c.cols - 1) / 2) * pitch,
        cy: (Math.floor(i / c.cols) - (c.rows - 1) / 2) * pitch,
        w: c.cellSize,
        h: c.cellSize,
      })),
      c.gradientAngle,
    )
  }
  const rowTs = spread(c.rows)
  return resolveColors(
    c.palette,
    phases.map((_, i) => rowTs[Math.floor(i / c.cols)]),
  )
}

/** A rows × cols matrix of cells swept by the chosen phase field. */
export function PulseGrid(props: PulseGridProps) {
  const c = resolveGridProps(props)

  const phases = useMemo(
    () => gridPhases(c.pattern, c.rows, c.cols, c.waves, c.seed),
    [c.pattern, c.rows, c.cols, c.waves, c.seed],
  )
  const order = useMemo(
    () => gridPhases(c.pattern, c.rows, c.cols, 1, c.seed),
    [c.pattern, c.rows, c.cols, c.seed],
  )
  const colors = useMemo(
    () => gridColors(c, phases),
    [c.palette, c.colorBy, c.gradientAngle, c.cellSize, c.gap, c.rows, c.cols, phases],
  )
  const stencil = useMemo(
    () =>
      c.state === "loading"
        ? undefined
        : stencilCells(c.rows, c.cols, c.state === "success" ? "check" : "cross"),
    [c.state, c.rows, c.cols],
  )

  const core = useLoaderCore({
    core: c,
    phases,
    order,
    fallbackAmplitude: c.cellSize,
    stretchAxis: "y",
    stencil,
  })

  return (
    <span
      {...ariaProps(c.label)}
      className={core.containerClass(props.className)}
      style={{
        display: "inline-grid",
        gridTemplateColumns: `repeat(${c.cols}, ${c.cellSize}px)`,
        gap: c.gap,
        lineHeight: 0,
        verticalAlign: "middle",
        ...core.containerStyle,
        ...props.style,
      }}
      {...htmlAttrs(props, GRID_KEYS)}
    >
      {phases.map((_, i) => (
        <span
          key={i}
          className={core.cellClass(i)}
          style={{
            display: "block",
            width: c.cellSize,
            height: c.cellSize,
            borderRadius: c.radius,
            background: colors[i],
            ...core.cellStyle(i),
          }}
        />
      ))}
    </span>
  )
}
