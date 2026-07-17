/**
 * Stencils for settled states: which grid cells form a ✓ or ✗. The glyph is
 * rasterized from normalized polylines into the central square of the grid,
 * so wide or tall grids keep the mark in proportion.
 */

type Pt = [number, number]

const CHECK: Pt[][] = [
  [
    [0.2, 0.56],
    [0.43, 0.76],
    [0.8, 0.27],
  ],
]

const CROSS: Pt[][] = [
  [
    [0.27, 0.27],
    [0.73, 0.73],
  ],
  [
    [0.73, 0.27],
    [0.27, 0.73],
  ],
]

function segDist(px: number, py: number, [ax, ay]: Pt, [bx, by]: Pt): number {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t))
}

/** Row-major booleans: true where the cell belongs to the glyph stroke. */
export function stencilCells(rows: number, cols: number, kind: "check" | "cross"): boolean[] {
  const polys = kind === "check" ? CHECK : CROSS
  const side = Math.min(rows, cols)
  const threshold = 0.55 / side
  const out = new Array<boolean>(rows * cols).fill(false)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5 - (cols - side) / 2) / side
      const py = (r + 0.5 - (rows - side) / 2) / side
      if (px < -0.01 || px > 1.01 || py < -0.01 || py > 1.01) continue
      let on = false
      for (const poly of polys) {
        for (let s = 0; s < poly.length - 1 && !on; s++) {
          on = segDist(px, py, poly[s], poly[s + 1]) < threshold
        }
        if (on) break
      }
      out[r * cols + c] = on
    }
  }
  return out
}
