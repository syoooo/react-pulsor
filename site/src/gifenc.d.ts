declare module "gifenc" {
  export function GIFEncoder(): {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts: { palette: number[][]; delay?: number; transparent?: boolean },
    ): void
    finish(): void
    bytes(): Uint8Array<ArrayBuffer>
  }
  export function quantize(
    data: Uint8ClampedArray,
    maxColors: number,
    opts?: { format?: "rgb565" | "rgb444" | "rgba4444" },
  ): number[][]
  export function applyPalette(
    data: Uint8ClampedArray,
    palette: number[][],
    format?: "rgb565" | "rgb444" | "rgba4444",
  ): Uint8Array
}
