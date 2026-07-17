import { applyPalette, GIFEncoder, quantize } from "gifenc"
import { svgSnippet } from "react-pulsor"
import type { SnippetElement, SnippetProps } from "react-pulsor"

/**
 * Render one loop of the loader to an animated GIF with a transparent
 * background. GIF alpha is 1-bit, so partial opacity (fades, dims) is
 * carried by ordered dithering — pixel coverage matches the original
 * opacity on any background, and the texture suits the pixel identity.
 */

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

export async function exportGif(
  element: SnippetElement,
  props: SnippetProps,
  opts: { fps?: number; scale?: number } = {},
): Promise<void> {
  const fps = opts.fps ?? 30
  const scale = opts.scale ?? 2
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
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
    } finally {
      URL.revokeObjectURL(url)
    }
    const { data } = ctx.getImageData(0, 0, w, h)
    // Alpha → dithered 1-bit coverage.
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4 + 3
        const threshold = ((BAYER[y & 3][x & 3] + 0.5) / 16) * 255
        data[i] = data[i] > threshold ? 255 : 0
      }
    }
    const palette = quantize(data, 256, { format: "rgba4444" })
    const index = applyPalette(data, palette, "rgba4444")
    // dispose:2 clears to transparent between frames — without it, opaque
    // pixels accumulate across the loop and the wave freezes all-bright
    gif.writeFrame(index, w, h, { palette, delay, transparent: true, dispose: 2 })
  }

  gif.finish()
  const blob = new Blob([gif.bytes()], { type: "image/gif" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = "pulsor.gif"
  a.click()
  URL.revokeObjectURL(a.href)
}
