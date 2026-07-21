// Generates docs/hero.svg — an animated SVG banner for the readmes.
// SVG + CSS keyframes animate inside GitHub's <img> sandbox, with real
// alpha, so this beats a GIF for the repo front page. Deterministic:
// parses the library's own cssSnippet output for one recipe per element.
import { mkdirSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { cssSnippet, recipes } = require("../dist/index.cjs")

const PICKS = ["ascent", "kelp", "glyph", "typing", "monogram"] // the specimen rack
const GAP = 46

function parseSnippet(element, props) {
  const out = cssSnippet(element, props)
  const [, style, markup] = out.match(/<style>\n([\s\S]*?)\n<\/style>\n([\s\S]*)$/) ?? []
  const lines = style.split("\n")
  const anim = lines[0]
  const layout = lines.slice(1).join("\n")
  const box = layout.match(/\.pulsor\{[^}]*?width:([\d.]+)px;height:([\d.]+)px/)
  const cellRule = layout.match(/\.pulsor \.c\{([^}]*)\}/)[1]
  const radius = Number(cellRule.match(/border-radius:([\d.]+)px/)[1])
  const animDecl = cellRule.match(/animation:[^;]+/)[0]
  // sway bars pivot at an edge — carry the origin through, per group
  const origin = cellRule.match(/transform-origin:([a-z]+)/)?.[1]

  const cells = []
  if (box) {
    // absolutely positioned variants (loops)
    const wrap = layout.match(/\.pulsor \.w\{[^}]*?width:([\d.]+)px;height:([\d.]+)px/)
    const re = wrap
      ? /left:([\d.-]+)px;top:([\d.-]+)px;transform:rotate\(([\d.-]+)deg\)"><span class="c[^"]*" style="background:([^;]+);animation-delay:(-?\d+)ms/g
      : /left:([\d.-]+)px;top:([\d.-]+)px;width:([\d.]+)px;height:([\d.]+)px;background:([^;]+);animation-delay:(-?\d+)ms/g
    for (const m of markup.matchAll(re)) {
      if (wrap) {
        const [, x, y, deg, fill, delay] = m
        cells.push({ x: +x, y: +y, w: +wrap[1], h: +wrap[2], deg: +deg, fill, delay })
      } else {
        const [, x, y, w, h, fill, delay] = m
        cells.push({ x: +x, y: +y, w: +w, h: +h, deg: 0, fill, delay })
      }
    }
    return { w: +box[1], h: +box[2], anim, animDecl, origin, radius, cells }
  }

  // flow layouts (grid / line): reconstruct coordinates from the rule
  const grid = layout.match(/repeat\((\d+), ([\d.]+)px\);gap:([\d.]+)px/)
  const size = cellRule.match(/width:([\d.]+)px;height:([\d.]+)px/)
  const flow = [...markup.matchAll(/background:([^;]+);animation-delay:(-?\d+)ms/g)]
  const [cw, ch] = [+size[1], +size[2]]
  if (grid) {
    const cols = +grid[1]
    const gap = +grid[3]
    flow.forEach(([, fill, delay], i) => {
      cells.push({
        x: (i % cols) * (cw + gap),
        y: Math.floor(i / cols) * (ch + gap),
        w: cw,
        h: ch,
        deg: 0,
        fill,
        delay,
      })
    })
    const rows = Math.ceil(flow.length / cols)
    return {
      w: cols * cw + (cols - 1) * gap,
      h: rows * ch + (rows - 1) * gap,
      anim,
      animDecl,
      origin,
      radius,
      cells,
    }
  }
  const gap = Number(layout.match(/gap:([\d.]+)px/)[1])
  flow.forEach(([, fill, delay], i) => {
    cells.push({ x: i * (cw + gap), y: 0, w: cw, h: ch, deg: 0, fill, delay })
  })
  return { w: flow.length * (cw + gap) - gap, h: ch, anim, animDecl, origin, radius, cells }
}

const parts = PICKS.map((name) => parseSnippet(recipes[name].element, recipes[name].props))
const H = Math.max(...parts.map((p) => p.h)) + 8
const W = parts.reduce((acc, p) => acc + p.w, 0) + GAP * (parts.length - 1) + 8

let x = 4
const groups = []
const styles = []
for (const [i, p] of parts.entries()) {
  styles.push(p.anim, `.g${i} .c{${p.animDecl}${p.origin ? `;transform-origin:${p.origin}` : ""}}`)
  const rects = p.cells
    .map((c) => {
      const rect = `<rect class="c" x="${c.deg ? -c.w / 2 : c.x}" y="${c.deg ? -c.h / 2 : c.y}" width="${c.w}" height="${c.h}" rx="${p.radius}" fill="${c.fill}" style="animation-delay:${c.delay}ms"/>`
      if (!c.deg) return rect
      // placement lives on a wrapper so CSS transform animations (and the
      // reduced-motion transform:none) never fight the positioning
      return `<g transform="translate(${c.x + c.w / 2} ${c.y + c.h / 2}) rotate(${c.deg})">${rect}</g>`
    })
    .join("")
  groups.push(`<g class="g${i}" transform="translate(${x} ${4 + (H - 8 - p.h) / 2})">${rects}</g>`)
  x += p.w + GAP
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pulsor loaders">
<style>.c{transform-box:fill-box;transform-origin:center}\n${styles.join("\n")}</style>
${groups.join("\n")}
</svg>
`
mkdirSync("docs", { recursive: true })
writeFileSync("docs/hero.svg", svg)
console.log(`docs/hero.svg: ${W}x${H}, ${svg.length} bytes, ${parts.length} loaders`)
