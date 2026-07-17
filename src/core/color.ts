import type { GradientStop, PaletteInput } from "../types"

/**
 * Gradient sampling happens in OKLab: interpolating in sRGB drags mid-tones
 * through gray, while OKLab keeps hue and perceived lightness on course.
 */

interface Lab {
  L: number
  a: number
  b: number
}

function hexToRgb(color: string): [number, number, number] | null {
  const m = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return null
  let hex = m[1]
  if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c)
  const n = parseInt(hex, 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

function srgbToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, c)) * 255)
}

function rgbToOklab([r, g, b]: [number, number, number]): Lab {
  const lr = srgbToLinear(r)
  const lg = srgbToLinear(g)
  const lb = srgbToLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

function oklabToHex({ L, a, b }: Lab): string {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3)
  const r = linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2307590544 * s)
  const g = linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const bb = linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  const to2 = (n: number) => n.toString(16).padStart(2, "0")
  return `#${to2(r)}${to2(g)}${to2(bb)}`
}

/**
 * Sample a multi-stop gradient at `t` (0..1), interpolating in OKLab.
 * Returns a hex color. Stops whose colors fail to parse fall back to the
 * raw color string of the nearest stop.
 */
export function sampleGradient(stops: GradientStop[], t: number): string {
  if (stops.length === 0) return "#000000"
  const sorted = [...stops].sort((a, b) => a.position - b.position)
  const x = Math.min(1, Math.max(0, t))
  if (x <= sorted[0].position) return sorted[0].color
  const last = sorted[sorted.length - 1]
  if (x >= last.position) return last.color
  let i = 0
  while (x > sorted[i + 1].position) i++
  const from = sorted[i]
  const to = sorted[i + 1]
  const span = to.position - from.position || 1
  const local = (x - from.position) / span
  const rgbA = hexToRgb(from.color)
  const rgbB = hexToRgb(to.color)
  if (!rgbA || !rgbB) return local < 0.5 ? from.color : to.color
  const a = rgbToOklab(rgbA)
  const b = rgbToOklab(rgbB)
  return oklabToHex({
    L: a.L + (b.L - a.L) * local,
    a: a.a + (b.a - a.a) * local,
    b: a.b + (b.b - a.b) * local,
  })
}

/** Built-in palettes. Each is a set of gradient stops sampled in OKLab. */
export const palettes = {
  aurora: [
    { color: "#5EE7DF", position: 0 },
    { color: "#8A7DFF", position: 0.55 },
    { color: "#F98BD9", position: 1 },
  ],
  ember: [
    { color: "#FFC46B", position: 0 },
    { color: "#FF6B4A", position: 0.5 },
    { color: "#D63B6C", position: 1 },
  ],
  lagoon: [
    { color: "#7FF0D4", position: 0 },
    { color: "#38B6D9", position: 0.5 },
    { color: "#2E5EAA", position: 1 },
  ],
  ultraviolet: [
    { color: "#C4B5FD", position: 0 },
    { color: "#7C5CFC", position: 0.55 },
    { color: "#4C1D95", position: 1 },
  ],
  sherbet: [
    { color: "#FFE29F", position: 0 },
    { color: "#FFA99F", position: 0.5 },
    { color: "#FF719A", position: 1 },
  ],
  glacier: [
    { color: "#EAF6FF", position: 0 },
    { color: "#9BD1FF", position: 0.45 },
    { color: "#4C9EEB", position: 1 },
  ],
  moss: [
    { color: "#E3F79B", position: 0 },
    { color: "#6FD37E", position: 0.5 },
    { color: "#1F8A5D", position: 1 },
  ],
  nocturne: [
    { color: "#2E2A6E", position: 0 },
    { color: "#6D6AE8", position: 0.55 },
    { color: "#C7D2FE", position: 1 },
  ],
  mono: [
    { color: "#F5F7FA", position: 0 },
    { color: "#8B94A3", position: 1 },
  ],
} satisfies Record<string, GradientStop[]>

export type PaletteName = keyof typeof palettes

/**
 * Resolve a palette input to per-element colors.
 * `ts` are the sampling positions (0..1), one per element.
 */
export function resolveColors(palette: PaletteInput, ts: number[]): string[] {
  if (typeof palette === "string") {
    const preset = (palettes as Record<string, GradientStop[]>)[palette]
    if (preset) return ts.map((t) => sampleGradient(preset, t))
    // Any other string is treated as a single CSS color.
    return ts.map(() => palette)
  }
  return ts.map((t) => sampleGradient(palette, t))
}

function resolveStops(palette: PaletteInput): GradientStop[] | null {
  if (typeof palette === "string") {
    return (palettes as Record<string, GradientStop[]>)[palette] ?? null
  }
  return palette
}

/** An element's footprint, centered coordinates; `rotation` in radians. */
export interface GradientRect {
  cx: number
  cy: number
  w: number
  h: number
  rotation?: number
}

/**
 * One linear gradient laid across the whole figure: each element gets a CSS
 * `linear-gradient(...)` that is its exact local slice, so gradients run
 * continuously through every element (the wrapped-logo look). Rotated
 * elements get the angle compensated so the global direction stays true.
 */
export function linearSliceColors(
  palette: PaletteInput,
  rects: GradientRect[],
  angleDeg: number = 45,
): string[] {
  const stops = resolveStops(palette)
  if (!stops) return rects.map(() => palette as string)
  const rad = (angleDeg * Math.PI) / 180
  // CSS gradient direction: 0deg points up, 90deg right (screen y is down).
  const ux = Math.sin(rad)
  const uy = -Math.cos(rad)
  const spans = rects.map((rc) => {
    const r = rc.rotation ?? 0
    const ax = Math.cos(r)
    const ay = Math.sin(r)
    const half =
      Math.abs((rc.w / 2) * (ax * ux + ay * uy)) + Math.abs((rc.h / 2) * (-ay * ux + ax * uy))
    return { p: rc.cx * ux + rc.cy * uy, half }
  })
  let min = Infinity
  let max = -Infinity
  for (const s of spans) {
    min = Math.min(min, s.p - s.half)
    max = Math.max(max, s.p + s.half)
  }
  const range = max - min || 1
  return rects.map((rc, i) => {
    const { p, half } = spans[i]
    const t0 = (p - half - min) / range
    const t1 = (p + half - min) / range
    const eff = Math.round((angleDeg - ((rc.rotation ?? 0) * 180) / Math.PI) * 10) / 10
    return `linear-gradient(${eff}deg, ${sampleGradient(stops, t0)}, ${sampleGradient(stops, t1)})`
  })
}
