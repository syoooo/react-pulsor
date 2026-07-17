import { applyPalette, GIFEncoder, quantize } from "gifenc"
import { svgSnippet } from "react-pulsor"
import type { SnippetElement, SnippetProps } from "react-pulsor"

/**
 * Render one loop of the loader to a transparent animated GIF.
 *
 * GIF alpha is 1-bit, so partial opacity (dims, fades) cannot survive as-is.
 * The industry answer is matting: every α>0 pixel is pre-composited against
 * a matte color (here: the current stage color) and becomes fully opaque;
 * only α=0 pixels stay truly transparent. Zero noise, crisp edges —
 * pixel-perfect on backgrounds near the matte, a mild classic halo on very
 * different ones. Flip the stage to light before exporting for light
 * destinations.
 */

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

export async function exportGif(
  element: SnippetElement,
  props: SnippetProps,
  opts: { fps?: number; scale?: number; background?: string } = {},
): Promise<void> {
  const fps = opts.fps ?? 30
  const scale = opts.scale ?? 2
  const [mr, mg, mb] = hexToRgb(opts.background ?? "#0f0f09")
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
    // Matte composite: α>0 → opaque blend with the matte, α=0 stays clear.
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a === 0) continue
      const k = a / 255
      data[i] = Math.round(data[i] * k + mr * (1 - k))
      data[i + 1] = Math.round(data[i + 1] * k + mg * (1 - k))
      data[i + 2] = Math.round(data[i + 2] * k + mb * (1 - k))
      data[i + 3] = 255
    }
    const palette = quantize(data, 256, { format: "rgba4444" })
    const index = applyPalette(data, palette, "rgba4444")
    // The transparent slot moves between frames; find it each time.
    const ti = palette.findIndex((p) => p[3] === 0)
    gif.writeFrame(index, w, h, {
      palette,
      delay,
      transparent: ti >= 0,
      transparentIndex: Math.max(ti, 0),
      dispose: 2,
    })
  }

  gif.finish()
  const blob = new Blob([gif.bytes()], { type: "image/gif" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = "pulsor.gif"
  a.click()
  URL.revokeObjectURL(a.href)
}
