import {
  barsColors,
  barsSegments,
  barsTransformOrigin,
  resolveBarsProps,
} from "./components/PulseBars"
import { dotsColors, dotsPoints, resolveDotsProps } from "./components/PulseDots"
import { gridColors, resolveGridProps } from "./components/PulseGrid"
import { levelAt, resolveEnvelope } from "./core/engine"
import type { ResolvedCore } from "./core/internal"
import { motionDefaults, resolveMotionInputs } from "./core/internal"
import { gridPhases, linearPhases } from "./core/patterns"
import type { SnippetElement, SnippetProps } from "./cssSnippet"
import type { PulseBarsProps, PulseDotsProps, PulseGridProps } from "./types"

/**
 * A static vector snapshot of the loader — one frame of the loop, exact
 * geometry and colors, ready to paste into Figma or drop in an <img>.
 * `atMs` picks the moment (0 = the mid-flight state you see on mount).
 * Loading loop only; states, progress and intensity are runtime concerns.
 */

const r2 = (v: number) => Math.round(v * 100) / 100

interface Item {
  x: number
  y: number
  w: number
  h: number
  rx: number
  fill: string
  /** Phase of the shared loop this element sits at. */
  phase: number
  /** Outer rotation (ring elements), degrees. */
  baseRotate?: number
  /** Stretch/sway anchor within the item, 0..1 of its own box. */
  ox?: number
  oy?: number
}

function itemTransform(
  c: ResolvedCore,
  it: Item,
  level: number,
  rest: { dim: number; restScale: number; amplitude: number },
  stretchAxis: "x" | "y",
): { opacity: number; transform: string } {
  const cx = r2(it.x + it.w * (it.ox ?? 0.5))
  const cy = r2(it.y + it.h * (it.oy ?? 0.5))
  const parts: string[] = []
  if (it.baseRotate) parts.push(`rotate(${r2(it.baseRotate)} ${cx} ${cy})`)

  const around = (sx: number, sy: number) =>
    parts.push(`translate(${cx} ${cy}) scale(${r2(sx)} ${r2(sy)}) translate(${-cx} ${-cy})`)

  const s = Math.max(0, rest.restScale + (1 - rest.restScale) * level)
  switch (c.animate) {
    case "scale":
    case "fade-scale":
      around(s, s)
      break
    case "stretch":
      if (stretchAxis === "y") around(1, s)
      else around(s, 1)
      break
    case "bounce":
      parts.push(`translate(0 ${r2(-rest.amplitude * level)})`)
      break
    case "sway":
      parts.push(`rotate(${r2(rest.amplitude * level)} ${cx} ${cy})`)
      break
    case "flip": {
      const k = Math.abs(Math.cos((rest.amplitude * level * Math.PI) / 180))
      if (stretchAxis === "y") around(k, 1)
      else around(1, k)
      break
    }
    case "fade":
      break
  }
  const opacity = rest.dim < 1 ? rest.dim + (1 - rest.dim) * Math.min(1, Math.max(0, level)) : 1
  return { opacity: r2(opacity), transform: parts.join(" ") }
}

/** Solid fills pass through; our own linear-gradient strings become <defs>. */
function fillFor(css: string, i: number, defs: string[]): string {
  const m = css.match(/^linear-gradient\((-?[\d.]+)deg,\s*(.+?),\s*(.+?)\)$/)
  if (!m) return css
  const deg = Number(m[1])
  // CSS 0deg points up, 90deg right; convert to an SVG vector.
  const rad = ((deg - 90) * Math.PI) / 180
  const dx = Math.cos(rad) / 2
  const dy = Math.sin(rad) / 2
  const id = `pg${i}`
  defs.push(
    `<linearGradient id="${id}" x1="${r2(0.5 - dx)}" y1="${r2(0.5 - dy)}" x2="${r2(0.5 + dx)}" y2="${r2(0.5 + dy)}"><stop offset="0" stop-color="${m[2]}"/><stop offset="1" stop-color="${m[3]}"/></linearGradient>`,
  )
  return `url(#${id})`
}

export function svgSnippet(
  element: SnippetElement,
  props: SnippetProps,
  opts: { atMs?: number } = {},
): string {
  let core: ResolvedCore
  let stretchAxis: "x" | "y" = "y"
  let fallbackAmp = 6
  let boxW = 0
  let boxH = 0
  const items: Item[] = []

  if (element === "grid") {
    const c = resolveGridProps(props as PulseGridProps)
    core = c
    fallbackAmp = c.cellSize
    const phases = gridPhases(c.pattern, c.rows, c.cols, c.waves, c.seed)
    const colors = gridColors(c, phases)
    const pitch = c.cellSize + c.gap
    boxW = c.cols * c.cellSize + (c.cols - 1) * c.gap
    boxH = c.rows * c.cellSize + (c.rows - 1) * c.gap
    phases.forEach((phase, i) => {
      items.push({
        x: (i % c.cols) * pitch,
        y: Math.floor(i / c.cols) * pitch,
        w: c.cellSize,
        h: c.cellSize,
        rx: c.radius,
        fill: colors[i],
        phase,
      })
    })
  } else if (element === "bars") {
    const c = resolveBarsProps(props as PulseBarsProps)
    core = c
    fallbackAmp = c.length / 2
    stretchAxis = c.vertical ? "y" : "x"
    const phases = linearPhases(c.pattern, c.count, c.waves, c.seed)
    const segments = barsSegments(c)
    const colors = barsColors(c, phases, segments)
    if (c.glyph) {
      boxW = c.ringSize * c.aspect
      boxH = c.ringSize
      segments.forEach((seg, i) => {
        items.push({
          x: boxW / 2 + seg.cx - seg.w / 2,
          y: boxH / 2 + seg.cy - seg.h / 2,
          w: seg.w,
          h: seg.h,
          rx: c.radius,
          fill: colors[i],
          phase: phases[seg.stripe],
        })
      })
    } else {
      const origin = barsTransformOrigin(c)
      const ox = origin === "left" ? 0 : origin === "right" ? 1 : 0.5
      const oy = origin === "top" ? 0 : origin === "bottom" ? 1 : 0.5
      const w = c.vertical ? c.thickness : c.length
      const h = c.vertical ? c.length : c.thickness
      const pitch = c.thickness + c.gap
      boxW = c.vertical ? c.count * pitch - c.gap : c.length
      boxH = c.vertical ? c.length : c.count * pitch - c.gap
      phases.forEach((phase, i) => {
        items.push({
          x: c.vertical ? i * pitch : 0,
          y: c.vertical ? 0 : i * pitch,
          w,
          h,
          rx: c.radius,
          fill: colors[i],
          phase,
          ox,
          oy,
        })
      })
    }
  } else {
    const c = resolveDotsProps(props as PulseDotsProps)
    core = c
    const phases = linearPhases(c.pattern, c.count, c.waves, c.seed)
    const points = dotsPoints(c)
    const colors = dotsColors(c, phases, points)
    if (c.loop) {
      fallbackAmp = c.length * 0.9
      stretchAxis = "x"
      const pad = Math.max(c.length, c.thickness)
      boxW = c.ringSize * c.aspect + pad * 2
      boxH = c.ringSize + pad * 2
      points.forEach((p, i) => {
        items.push({
          x: boxW / 2 + p.x - c.length / 2,
          y: boxH / 2 + p.y - c.thickness / 2,
          w: c.length,
          h: c.thickness,
          rx: c.radius,
          fill: colors[i],
          phase: phases[i],
          baseRotate: ((c.align === "tangent" ? p.tangent : p.radial) * 180) / Math.PI,
        })
      })
    } else {
      fallbackAmp = c.size * 0.9
      const pitch = c.size + c.gap
      boxW = c.count * pitch - c.gap
      boxH = c.size
      phases.forEach((phase, i) => {
        items.push({
          x: i * pitch,
          y: 0,
          w: c.size,
          h: c.size,
          rx: c.radius,
          fill: colors[i],
          phase,
        })
      })
    }
  }

  const rest = motionDefaults(
    core.animate,
    { dim: core.dim, restScale: core.restScale, amplitude: core.amplitude },
    fallbackAmp,
  )
  const inputs = resolveMotionInputs(core)
  const frames = resolveEnvelope(inputs.envelope)
  const t = (opts.atMs ?? 0) / inputs.period

  // Motion can overshoot the boxes; give the canvas a little air.
  const pad = Math.ceil(Math.max(4, rest.amplitude * 0.5))
  const defs: string[] = []
  const shapes = items.map((raw, i) => {
    const it = { ...raw, x: raw.x + pad, y: raw.y + pad }
    const level = levelAt(frames, it.phase + t)
    const { opacity, transform } = itemTransform(core, it, level, rest, stretchAxis)
    const fill = fillFor(it.fill, i, defs)
    const tr = transform ? ` transform="${transform}"` : ""
    const op = opacity < 1 ? ` opacity="${opacity}"` : ""
    return `  <rect x="${r2(it.x)}" y="${r2(it.y)}" width="${r2(it.w)}" height="${r2(it.h)}" rx="${r2(it.rx)}" fill="${fill}"${op}${tr}/>`
  })

  const W = r2(boxW + pad * 2)
  const H = r2(boxH + pad * 2)
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${core.label}">`,
    defs.length ? `  <defs>${defs.join("")}</defs>` : "",
    ...shapes,
    "</svg>",
  ]
    .filter(Boolean)
    .join("\n")
}
