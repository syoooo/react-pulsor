import type { BarsPattern, DotsPattern, GridPattern } from "../types"

/**
 * A pattern is a distance field over the elements: elements at equal
 * distance fire together, and distance maps linearly to animation phase.
 * Phases are normalized to [0, 1): phase = ((d / (max + 1)) * waves) % 1.
 */

function normalize(distances: number[], waves: number): number[] {
  const max = Math.max(...distances, 0)
  const div = max + 1
  const w = Math.max(0.0001, waves)
  return distances.map((d) => {
    const t = ((d / div) * w) % 1
    return t < 0 ? t + 1 : t
  })
}

/** Deterministic PRNG so `sparkle` renders identically on server and client. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffledIndices(n: number, seed: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i)
  const rand = mulberry32(seed)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const d = new Array<number>(n)
  order.forEach((el, rank) => (d[el] = rank))
  return d
}

/** Visit order walking a rectangular spiral outward from the center. */
function spiralOrder(rows: number, cols: number): number[] {
  const d = new Array<number>(rows * cols).fill(0)
  let r = Math.floor((rows - 1) / 2)
  let c = Math.floor((cols - 1) / 2)
  const dr = [0, 1, 0, -1] // right, down, left, up
  const dc = [1, 0, -1, 0]
  let dir = 0
  let stepLen = 1
  let visited = 0
  const total = rows * cols
  const visit = () => {
    if (r >= 0 && r < rows && c >= 0 && c < cols) d[r * cols + c] = visited++
  }
  visit()
  while (visited < total) {
    for (let leg = 0; leg < 2 && visited < total; leg++) {
      for (let s = 0; s < stepLen && visited < total; s++) {
        r += dr[dir]
        c += dc[dir]
        visit()
      }
      dir = (dir + 1) % 4
    }
    stepLen++
  }
  return d
}

/** Row-major phases for a grid pattern. */
export function gridPhases(
  pattern: GridPattern,
  rows: number,
  cols: number,
  waves: number,
  seed: number,
): number[] {
  const n = rows * cols
  const cr = (rows - 1) / 2
  const cc = (cols - 1) / 2
  let d: number[]
  switch (pattern) {
    case "sweep-up":
      d = mapGrid(rows, cols, (r) => rows - 1 - r)
      break
    case "sweep-down":
      d = mapGrid(rows, cols, (r) => r)
      break
    case "sweep-left":
      d = mapGrid(rows, cols, (_r, c) => cols - 1 - c)
      break
    case "sweep-right":
      d = mapGrid(rows, cols, (_r, c) => c)
      break
    case "diagonal":
      d = mapGrid(rows, cols, (r, c) => r + c)
      break
    case "chevron":
      d = mapGrid(rows, cols, (r, c) => rows - 1 - r + Math.abs(c - cc))
      break
    case "snake":
      d = mapGrid(rows, cols, (r, c) => r * cols + (r % 2 === 1 ? cols - 1 - c : c))
      break
    case "ripple":
      d = mapGrid(rows, cols, (r, c) => Math.max(Math.abs(r - cr), Math.abs(c - cc)))
      break
    case "spiral":
      d = spiralOrder(rows, cols)
      break
    case "sparkle":
      d = shuffledIndices(n, seed)
      break
    case "pulse":
      d = new Array(n).fill(0)
      break
  }
  return normalize(d, waves)
}

function mapGrid(rows: number, cols: number, fn: (r: number, c: number) => number): number[] {
  const d = new Array<number>(rows * cols)
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) d[r * cols + c] = fn(r, c)
  return d
}

/** Phases for a 1-D sequence (bars, dot rows, dot rings). */
export function linearPhases(
  pattern: BarsPattern | DotsPattern,
  count: number,
  waves: number,
  seed: number,
): number[] {
  const center = (count - 1) / 2
  let d: number[]
  switch (pattern) {
    case "wave":
      d = Array.from({ length: count }, (_, i) => i)
      break
    case "wave-reverse":
      d = Array.from({ length: count }, (_, i) => count - 1 - i)
      break
    case "center":
      d = Array.from({ length: count }, (_, i) => Math.abs(i - center))
      break
    case "edges":
      d = Array.from({ length: count }, (_, i) => center - Math.abs(i - center))
      break
    case "alternate":
      d = Array.from({ length: count }, (_, i) => i % 2)
      break
    case "sparkle":
      d = shuffledIndices(count, seed)
      break
    case "pulse":
      d = new Array(count).fill(0)
      break
  }
  return normalize(d, waves)
}
