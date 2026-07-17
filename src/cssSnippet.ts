import { barsColors, barsSegments, barsTransformOrigin, resolveBarsProps } from "./components/PulseBars"
import { dotsColors, resolveDotsProps } from "./components/PulseDots"
import { gridColors, resolveGridProps } from "./components/PulseGrid"
import { resolveRingProps, ringColors, ringPoints } from "./components/PulseRing"
import { compileAnimation, resolveEasingPair, resolveEnvelope } from "./core/engine"
import { motionDefaults, resolveMotionInputs } from "./core/internal"
import type { ResolvedCore } from "./core/internal"
import { gridPhases, linearPhases } from "./core/patterns"
import type {
  PulseBarsProps,
  PulseDotsProps,
  PulseGridProps,
  PulseRingProps,
} from "./types"

/**
 * Export a loader as a framework-free HTML + CSS snippet. The engine is
 * plain CSS keyframes plus negative per-element delays, so the export is
 * exact — no React required on the consuming side. Renders the loading
 * loop; states, progress and intensity are runtime concerns.
 */

export type SnippetElement = "grid" | "bars" | "dots" | "ring"
export type SnippetProps = PulseGridProps | PulseBarsProps | PulseDotsProps | PulseRingProps

const r2 = (v: number) => Math.round(v * 100) / 100

function compile(c: ResolvedCore, fallbackAmplitude: number, stretchAxis: "x" | "y") {
  const rest = motionDefaults(
    c.animate,
    { dim: c.dim, restScale: c.restScale, amplitude: c.amplitude },
    fallbackAmplitude,
  )
  const inputs = resolveMotionInputs(c)
  const anim = compileAnimation({
    animate: c.animate,
    frames: resolveEnvelope(inputs.envelope),
    easing: resolveEasingPair(inputs.easing, inputs.envelope),
    ...rest,
    stretchAxis,
    respectReducedMotion: c.respectReducedMotion,
  })
  const cellCls = anim.className ? `c ${anim.className}` : "c"
  return {
    css: anim.css,
    cellCls,
    animDecl: `animation:${anim.keyframesName} ${inputs.period}ms linear infinite`,
    delay: (phase: number) => `animation-delay:${Math.round(-phase * inputs.period)}ms`,
  }
}

function assemble(animCss: string, layout: string, cells: string[], label: string): string {
  return [
    "<!-- Pulsor loader — framework-free export -->",
    "<style>",
    animCss,
    layout,
    "</style>",
    `<span class="pulsor" role="status" aria-label="${label}">`,
    cells.join("\n"),
    "</span>",
  ].join("\n")
}

export function cssSnippet(element: SnippetElement, props: SnippetProps): string {
  if (element === "grid") {
    const c = resolveGridProps(props as PulseGridProps)
    const phases = gridPhases(c.pattern, c.rows, c.cols, c.waves, c.seed)
    const colors = gridColors(c, phases)
    const { css, cellCls, animDecl, delay } = compile(c, c.cellSize, "y")
    const layout = [
      `.pulsor{display:inline-grid;grid-template-columns:repeat(${c.cols}, ${c.cellSize}px);gap:${c.gap}px;line-height:0}`,
      `.pulsor .c{display:block;width:${c.cellSize}px;height:${c.cellSize}px;border-radius:${c.radius}px;${animDecl}}`,
    ].join("\n")
    const cells = phases.map(
      (p, i) => `  <span class="${cellCls}" style="background:${colors[i]};${delay(p)}"></span>`,
    )
    return assemble(css, layout, cells, c.label)
  }

  if (element === "bars") {
    const c = resolveBarsProps(props as PulseBarsProps)
    const phases = linearPhases(c.pattern, c.count, c.waves, c.seed)
    const segments = barsSegments(c)
    const colors = barsColors(c, phases, segments)
    const { css, cellCls, animDecl, delay } = compile(c, c.length / 2, c.vertical ? "y" : "x")
    if (c.glyph) {
      const boxW = r2(c.ringSize * c.aspect)
      const boxH = c.ringSize
      const layout = [
        `.pulsor{position:relative;display:inline-block;width:${boxW}px;height:${boxH}px;line-height:0}`,
        `.pulsor .c{position:absolute;display:block;border-radius:${c.radius}px;${animDecl}}`,
      ].join("\n")
      const cells = segments.map(
        (seg, i) =>
          `  <span class="${cellCls}" style="left:${r2(boxW / 2 + seg.cx - seg.w / 2)}px;top:${r2(boxH / 2 + seg.cy - seg.h / 2)}px;width:${r2(seg.w)}px;height:${r2(seg.h)}px;background:${colors[i]};${delay(phases[seg.stripe])}"></span>`,
      )
      return assemble(css, layout, cells, c.label)
    }
    const layout = [
      `.pulsor{display:inline-flex;flex-direction:${c.vertical ? "row" : "column"};align-items:center;gap:${c.gap}px;line-height:0}`,
      `.pulsor .c{display:block;width:${c.vertical ? c.thickness : c.length}px;height:${c.vertical ? c.length : c.thickness}px;border-radius:${c.radius}px;transform-origin:${barsTransformOrigin(c)};${animDecl}}`,
    ].join("\n")
    const cells = phases.map(
      (p, i) => `  <span class="${cellCls}" style="background:${colors[i]};${delay(p)}"></span>`,
    )
    return assemble(css, layout, cells, c.label)
  }

  if (element === "ring") {
    const c = resolveRingProps(props as PulseRingProps)
    const phases = linearPhases(c.pattern, c.count, c.waves, c.seed)
    const points = ringPoints(c)
    const colors = ringColors(c, phases, points)
    const { css, cellCls, animDecl, delay } = compile(c, c.length * 0.9, "x")
    const pad = Math.max(c.length, c.thickness)
    const boxW = r2(c.ringSize * c.aspect + pad * 2)
    const boxH = r2(c.ringSize + pad * 2)
    const layout = [
      `.pulsor{position:relative;display:inline-block;width:${boxW}px;height:${boxH}px;line-height:0}`,
      `.pulsor .w{position:absolute;width:${c.length}px;height:${c.thickness}px}`,
      `.pulsor .c{display:block;width:100%;height:100%;border-radius:${c.radius}px;${animDecl}}`,
    ].join("\n")
    const cells = points.map((p, i) => {
      const angle = c.align === "tangent" ? p.tangent : p.radial
      return `  <span class="w" style="left:${r2(boxW / 2 + p.x - c.length / 2)}px;top:${r2(boxH / 2 + p.y - c.thickness / 2)}px;transform:rotate(${r2((angle * 180) / Math.PI)}deg)"><span class="${cellCls}" style="background:${colors[i]};${delay(phases[i])}"></span></span>`
    })
    return assemble(css, layout, cells, c.label)
  }

  const c = resolveDotsProps(props as PulseDotsProps)
  const phases = linearPhases(c.pattern, c.count, c.waves, c.seed)
  const colors = dotsColors(c, phases)
  const { css, cellCls, animDecl, delay } = compile(c, c.size * 0.9, "y")
  const layout = [
    `.pulsor{display:inline-flex;align-items:center;gap:${c.gap}px;line-height:0}`,
    `.pulsor .c{display:block;width:${c.size}px;height:${c.size}px;border-radius:${c.radius}px;${animDecl}}`,
  ].join("\n")
  const cells = phases.map(
    (p, i) => `  <span class="${cellCls}" style="background:${colors[i]};${delay(p)}"></span>`,
  )
  return assemble(css, layout, cells, c.label)
}
