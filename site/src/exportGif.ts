import { applyPalette, GIFEncoder, quantize } from "gifenc"
import { svgSnippet } from "react-pulsor"
import type { SnippetElement, SnippetProps } from "react-pulsor"

/**
 * Render one loop of the loader to an animated GIF over a solid stage
 * color (GIF's 1-bit alpha cannot carry the loader's partial-opacity
 * fades — for a true-alpha asset, copy the SVG instead).
 */
export async function exportGif(
  element: SnippetElement,
  props: SnippetProps,
  opts: { fps?: number; scale?: number; background?: string } = {},
): Promise<void> {
  const fps = opts.fps ?? 30
  const scale = opts.scale ?? 2
  const background = opts.background ?? "#0f0f09"
  const period = (props as { period?: number }).period ?? 900
  const frames = Math.min(90, Math.max(8, Math.round((period / 1000) * fps)))
  const delay = Math.round(period / frames)

  const probe = svgSnippet(element, props)
  const size = probe.match(/width="([\d.]+)" height="([\d.]+)"/)
  if (!size) throw new Error("could not measure snapshot")
  const w = Math.round(Number(size[1]) * scale)
  const h = Math.round(Number(size[2]) * scale)

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("no 2d context")

  const gif = GIFEncoder()

  for (let f = 0; f < frames; f++) {
    const svg = svgSnippet(element, props, { atMs: (f / frames) * period })
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }))
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      ctx.fillStyle = background
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
    } finally {
      URL.revokeObjectURL(url)
    }
    const { data } = ctx.getImageData(0, 0, w, h)
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, w, h, { palette, delay })
  }

  gif.finish()
  const blob = new Blob([gif.bytes()], { type: "image/gif" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = "pulsor.gif"
  a.click()
  URL.revokeObjectURL(a.href)
}
