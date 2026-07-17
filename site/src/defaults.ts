import { motionDefaults, palettes } from "react-pulsor"
import type { AnimateMode, GradientStop, Recipe } from "react-pulsor"

export type ElementKind = "grid" | "bars" | "dots"

export const COMPONENT_NAMES: Record<ElementKind, string> = {
  grid: "PulseGrid",
  bars: "PulseBars",
  dots: "PulseDots",
}

export const GRID_PATTERNS = [
  "ripple",
  "sweep-up",
  "sweep-down",
  "sweep-left",
  "sweep-right",
  "diagonal",
  "chevron",
  "snake",
  "spiral",
  "sparkle",
  "pulse",
]

export const LINEAR_PATTERNS = [
  "wave",
  "wave-reverse",
  "center",
  "edges",
  "alternate",
  "sparkle",
  "pulse",
]

export const ANIMATE_MODES: AnimateMode[] = [
  "fade",
  "scale",
  "fade-scale",
  "stretch",
  "bounce",
  "sway",
  "flip",
]
export const EASINGS = ["auto", "smooth", "linear", "snap", "drift", "spring"]
export const ENVELOPE_OPTIONS = ["pulse", "breathe", "flash", "heartbeat", "custom"]

export interface Config {
  pattern: string
  rows: number
  cols: number
  cellSize: number
  count: number
  orientation: "vertical" | "horizontal"
  thickness: number
  length: number
  origin: "center" | "start" | "end"
  barsArrangement: "line" | "loop"
  dotsArrangement: "line" | "loop"
  stroke: number
  align: "tangent" | "radial"
  aspect: number
  squareness: number
  ringSize: number
  size: number
  gap: number
  radius: number
  paletteMode: "preset" | "custom"
  palettePreset: string
  customStops: string[]
  colorBy: "position" | "phase" | "linear"
  gradientAngle: number
  animate: AnimateMode
  feelSel: "" | "calm" | "crisp" | "lively" | "urgent"
  state: "loading" | "success" | "error"
  progressMode: boolean
  progress: number
  intensity: number
  envelopePreset: string
  attack: number
  hold: number
  release: number
  easing: string
  period: number
  waves: number
  dim: number
  restScale: number
  amplitude: number
  seed: number
  appearDelay: number
}

/** The library's per-mode resting defaults (single source: react-pulsor). */
export function modeDefaults(mode: AnimateMode, fallbackAmplitude: number) {
  return motionDefaults(mode, {}, fallbackAmplitude)
}

export function ampFallback(
  element: ElementKind,
  c: Pick<Config, "cellSize" | "length" | "size">,
) {
  if (element === "grid") return c.cellSize
  if (element === "bars") return c.length / 2
  return c.size * 0.9
}

export function defaultConfig(element: ElementKind): Config {
  const base: Config = {
    pattern: element === "grid" ? "ripple" : "wave",
    rows: 4,
    cols: 4,
    cellSize: 6,
    count: element === "bars" ? 5 : 3,
    orientation: "vertical",
    thickness: element === "bars" ? 4 : 6,
    length: element === "bars" ? 18 : 6,
    origin: "center",
    barsArrangement: "line",
    dotsArrangement: "line",
    stroke: 8.4,
    align: "tangent",
    aspect: 1,
    squareness: 2,
    ringSize: 28,
    size: 7,
    gap: element === "dots" ? 4 : 3,
    radius: element === "grid" ? 1.5 : element === "dots" ? 3.5 : 2,
    paletteMode: "preset",
    palettePreset: "aurora",
    customStops: ["#5EE7DF", "#F98BD9"],
    colorBy: "position",
    gradientAngle: 45,
    animate: element === "bars" ? "stretch" : element === "dots" ? "scale" : "fade",
    feelSel: "",
    state: "loading",
    progressMode: false,
    progress: 0.65,
    intensity: 1,
    envelopePreset: "pulse",
    attack: 0.1,
    hold: 0.06,
    release: 0.42,
    easing: "auto",
    period: 900,
    waves: 1,
    dim: 0,
    restScale: 0,
    amplitude: 0,
    seed: 7,
    appearDelay: 0,
  }
  return { ...base, ...modeDefaults(base.animate, ampFallback(element, base)) }
}

function paletteValue(c: Config): string | GradientStop[] {
  if (c.paletteMode === "preset") return c.palettePreset
  const n = c.customStops.length
  return c.customStops.map((color, i) => ({
    color,
    position: n <= 1 ? 0 : i / (n - 1),
  }))
}

function envelopeValue(c: Config): string | { attack: number; hold: number; release: number } {
  if (c.envelopePreset !== "custom") return c.envelopePreset
  return { attack: c.attack, hold: c.hold, release: c.release }
}

/** The props object actually handed to the component. */
export function propsFor(element: ElementKind, c: Config): Record<string, unknown> {
  const shared: Record<string, unknown> = {
    palette: paletteValue(c),
    colorBy: c.colorBy,
    animate: c.animate,
    envelope: envelopeValue(c),
    period: c.period,
    waves: c.waves,
    dim: c.dim,
    restScale: c.restScale,
    amplitude: c.amplitude,
    seed: c.seed,
  }
  if (c.easing !== "auto") shared.easing = c.easing
  if (c.appearDelay > 0) shared.appearDelay = c.appearDelay
  if (c.colorBy === "linear") shared.gradientAngle = c.gradientAngle
  if (c.state !== "loading") shared.state = c.state
  if (c.state === "loading" && c.progressMode) shared.progress = c.progress
  if (c.intensity !== 1) shared.intensity = c.intensity
  if (element === "grid") {
    return {
      pattern: c.pattern,
      rows: c.rows,
      cols: c.cols,
      cellSize: c.cellSize,
      gap: c.gap,
      radius: c.radius,
      ...shared,
    }
  }
  if (element === "bars") {
    if (c.barsArrangement === "loop") {
      return {
        pattern: c.pattern,
        arrangement: "loop",
        count: c.count,
        orientation: c.orientation,
        thickness: c.thickness,
        ringSize: c.ringSize,
        aspect: c.aspect,
        squareness: c.squareness,
        stroke: c.stroke,
        radius: c.radius,
        ...shared,
      }
    }
    return {
      pattern: c.pattern,
      count: c.count,
      orientation: c.orientation,
      thickness: c.thickness,
      length: c.length,
      gap: c.gap,
      radius: c.radius,
      origin: c.origin,
      ...shared,
    }
  }
  if (c.dotsArrangement === "loop") {
    return {
      pattern: c.pattern,
      arrangement: "loop",
      count: c.count,
      ringSize: c.ringSize,
      aspect: c.aspect,
      squareness: c.squareness,
      align: c.align,
      length: c.length,
      thickness: c.thickness,
      radius: c.radius,
      ...shared,
    }
  }
  return {
    pattern: c.pattern,
    count: c.count,
    size: c.size,
    gap: c.gap,
    radius: c.radius,
    ...shared,
  }
}

/** Library defaults, used to omit redundant props from generated code. */
function libDefaults(element: ElementKind, c: Config): Record<string, unknown> {
  const shared = {
    palette: "aurora",
    colorBy: "position",
    gradientAngle: 45,
    animate:
      element === "bars"
        ? "stretch"
        : element === "dots"
          ? c.dotsArrangement === "loop"
            ? "fade"
            : "scale"
          : "fade",
    envelope: "pulse",
    period: 900,
    waves: 1,
    seed: 7,
    ...modeDefaults(c.animate, ampFallback(element, c)),
  }
  if (element === "grid") {
    return { pattern: "ripple", rows: 4, cols: 4, cellSize: 6, gap: 3, radius: 1.5, ...shared }
  }
  if (element === "bars") {
    const glyph = c.barsArrangement === "loop"
    return {
      pattern: "wave",
      arrangement: "line",
      count: glyph ? 8 : 5,
      orientation: glyph ? "horizontal" : "vertical",
      thickness: glyph ? 3 : 4,
      length: 18,
      gap: 3,
      radius: 2,
      origin: "center",
      ringSize: 28,
      aspect: 1,
      squareness: 2,
      stroke: Math.round(c.ringSize * 0.3 * 100) / 100,
      ...shared,
    }
  }
  const loop = c.dotsArrangement === "loop"
  return {
    pattern: "wave",
    arrangement: "line",
    count: loop ? 8 : 3,
    size: 7,
    gap: 4,
    ringSize: 28,
    aspect: 1,
    squareness: 2,
    align: "tangent",
    length: 6,
    thickness: 6,
    radius: loop ? Math.min(c.length, c.thickness) / 2 : c.size / 2,
    ...shared,
  }
}

function fmtValue(v: unknown): string {
  if (typeof v === "string") return `"${v}"`
  if (typeof v === "number") return `{${Math.round(v * 1000) / 1000}}`
  if (Array.isArray(v)) {
    const items = v
      .map((s) => `{ color: "${(s as GradientStop).color}", position: ${(s as GradientStop).position} },`)
      .join("\n    ")
    return `{[\n    ${items}\n  ]}`
  }
  if (typeof v === "object" && v !== null) {
    const inner = Object.entries(v)
      .map(([k, val]) => `${k}: ${Math.round((val as number) * 1000) / 1000}`)
      .join(", ")
    return `{{ ${inner} }}`
  }
  return `{${String(v)}}`
}

export function generateCode(element: ElementKind, c: Config): string {
  const props = propsFor(element, c)
  const defs = libDefaults(element, c)
  const name = COMPONENT_NAMES[element]
  const entries = Object.entries(props).filter(
    ([k, v]) => JSON.stringify(v) !== JSON.stringify(defs[k]),
  )
  const importLine = `import { ${name} } from "react-pulsor"`
  if (entries.length === 0) return `${importLine}\n\n<${name} />`
  const lines = entries.map(([k, v]) => `  ${k}=${fmtValue(v)}`)
  return `${importLine}\n\n<${name}\n${lines.join("\n")}\n/>`
}

/** Serialize the current playground into a URL-hash payload (diff vs defaults). */
export function encodeShare(element: ElementKind, c: Config): string | null {
  const def = defaultConfig(element)
  const diff: Record<string, unknown> = {}
  for (const key of Object.keys(c) as (keyof Config)[]) {
    if (JSON.stringify(c[key]) !== JSON.stringify(def[key])) diff[key] = c[key]
  }
  if (element === "grid" && Object.keys(diff).length === 0) return null
  try {
    return btoa(JSON.stringify({ e: element, c: diff }))
  } catch {
    return null
  }
}

export function decodeShare(hash: string): { element: ElementKind; config: Config } | null {
  const m = hash.match(/#p=(.+)$/)
  if (!m) return null
  try {
    const payload = JSON.parse(atob(decodeURIComponent(m[1]))) as {
      e: ElementKind
      c: Partial<Config>
    }
    if (!(payload.e in COMPONENT_NAMES)) return null
    return { element: payload.e, config: { ...defaultConfig(payload.e), ...payload.c } }
  } catch {
    return null
  }
}

/** Load a recipe into a full playground config. */
export function recipeToConfig(recipe: Recipe): Config {
  const element = recipe.element as ElementKind
  const c = defaultConfig(element)
  const p = recipe.props as Record<string, unknown>

  const directKeys = [
    "appearDelay",
    "pattern",
    "rows",
    "cols",
    "cellSize",
    "count",
    "orientation",
    "thickness",
    "length",
    "origin",
    "stroke",
    "align",
    "aspect",
    "squareness",
    "ringSize",
    "size",
    "gap",
    "radius",
    "colorBy",
    "gradientAngle",
    "easing",
    "period",
    "waves",
    "seed",
  ] as const
  for (const key of directKeys) {
    if (p[key] !== undefined) (c as unknown as Record<string, unknown>)[key] = p[key]
  }

  if (element === "bars" && p.arrangement === "loop") {
    c.barsArrangement = "loop"
    if (p.count === undefined) c.count = 8
    if (p.thickness === undefined) c.thickness = 3
    if (p.orientation === undefined) c.orientation = "horizontal"
    if (p.stroke === undefined) c.stroke = Math.round(c.ringSize * 0.3 * 100) / 100
  }
  if (element === "dots" && p.arrangement === "loop") {
    c.dotsArrangement = "loop"
    if (p.count === undefined) c.count = 8
    if (p.radius === undefined) c.radius = Math.min(c.length, c.thickness) / 2
  }
  if (element === "dots" && p.arrangement !== "loop" && p.radius === undefined && p.size !== undefined) {
    c.radius = (p.size as number) / 2
  }

  if (typeof p.palette === "string" && p.palette in palettes) {
    c.paletteMode = "preset"
    c.palettePreset = p.palette
  } else if (Array.isArray(p.palette)) {
    c.paletteMode = "custom"
    c.customStops = (p.palette as GradientStop[]).slice(0, 4).map((s) => s.color)
  }

  if (p.animate !== undefined) c.animate = p.animate as AnimateMode
  Object.assign(c, modeDefaults(c.animate, ampFallback(element, c)))
  for (const key of ["dim", "restScale", "amplitude"] as const) {
    if (p[key] !== undefined) c[key] = p[key] as number
  }

  const env = p.envelope
  if (typeof env === "string") {
    c.envelopePreset = env
  } else if (env && typeof env === "object" && !Array.isArray(env)) {
    const shape = env as { attack: number; hold?: number; release: number }
    c.envelopePreset = "custom"
    c.attack = shape.attack
    c.hold = shape.hold ?? 0
    c.release = shape.release
  }
  return c
}
