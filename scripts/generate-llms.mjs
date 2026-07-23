// Generates the agent-facing docs from the library's own exports:
//   site/public/llms.txt       — llmstxt.org index
//   site/public/llms-full.txt  — full reference: README + agent guidance + every recipe as JSX
//   AGENTS.md                  — cheatsheet shipped in the npm tarball
//   recipe tables between <!-- recipes-table:start/end --> in the three READMEs
// Deterministic (no timestamps) so CI can diff the committed outputs.
import { readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { recipes } = require("../dist/index.cjs")
const pkg = require("../package.json")

const REPO = "https://github.com/syoooo/react-pulsor"
const SITE = pkg.homepage
const COMPONENT = { grid: "PulseGrid", bars: "PulseBars", dots: "PulseDots" }

// ---- recipe JSX (mirrors the site's emitter mechanics, standalone) ----

const js = (v) => {
  if (Array.isArray(v)) return `[${v.map(js).join(", ")}]`
  if (typeof v === "object" && v !== null)
    return `{ ${Object.entries(v)
      .map(([k, x]) => `${k}: ${js(x)}`)
      .join(", ")} }`
  return JSON.stringify(v)
}

const attr = ([k, v]) => (typeof v === "string" ? `${k}=${JSON.stringify(v)}` : `${k}={${js(v)}}`)

const recipeJsx = (r) => `<${COMPONENT[r.element]} ${Object.entries(r.props).map(attr).join(" ")} />`

// ---- localized blurbs, extracted from the site's i18n source ----

function localizedBlurbs(lang) {
  const src = readFileSync("site/src/i18n.ts", "utf8").match(/RECIPE_BLURBS[\s\S]*/)[0]
  const block = src.match(new RegExp(`\\n  ${lang}: \\{([\\s\\S]*?)\\n  \\}`))[1]
  const out = {}
  for (const [, name, text] of block.matchAll(/(\w+): "([^"]*)"/g)) out[name] = text
  return out
}

// ---- recipe tables ----

const HEADERS = {
  en: ["Recipe", "Component", "Description"],
  zh: ["配方", "组件", "说明"],
  ja: ["レシピ", "コンポーネント", "説明"],
}

function recipeTable(lang) {
  const blurbs = lang === "en" ? null : localizedBlurbs(lang)
  const rows = Object.entries(recipes).map(([name, r]) => {
    const blurb = (blurbs ? blurbs[name] : r.blurb).replaceAll("|", "\\|")
    return `| \`${name}\` | \`<${COMPONENT[r.element]} />\` | ${blurb} |`
  })
  const [a, b, c] = HEADERS[lang]
  return [`| ${a} | ${b} | ${c} |`, "| --- | --- | --- |", ...rows].join("\n")
}

function insertTable(path, lang) {
  const md = readFileSync(path, "utf8")
  const re = /(<!-- recipes-table:start -->)[\s\S]*?(<!-- recipes-table:end -->)/
  if (!re.test(md)) throw new Error(`${path}: recipes-table markers missing`)
  const next = md.replace(re, `$1\n${recipeTable(lang)}\n$2`)
  if (next !== md) writeFileSync(path, next)
  return next
}

// ---- shared agent guidance ----

const GUIDANCE = `## Guidance for coding agents

Mental model — every loader is four orthogonal dials:

1. **Geometry** — which component and its layout props (grid \`rows\`/\`cols\`, bars/dots \`count\` and \`arrangement\`).
2. **Pattern** — the phase field: who fires when (\`pattern\`, \`waves\`, \`seed\`).
3. **Envelope** — what one beat looks like (\`animate\`, \`envelope\`, \`easing\`, \`period\`, or the \`feel\` macro that sets all three).
4. **Color** — \`palette\` (preset name, any CSS color, or gradient stops) plus \`colorBy\` / \`gradientAngle\`.

Decision guide:

- "a spinner" → \`<PulseDots arrangement="loop" />\`, or \`recipes.orbit\` / \`recipes.beacon\`.
- "typing indicator" → \`recipes.typing\`.
- "determinate progress" → any component with \`progress={0..1}\`.
- "loader that reacts to an AI token stream" → \`useStreamIntensity()\` feeding the \`intensity\` prop.
- "match my brand" → \`palette\` takes any CSS color or \`[{ color, position }]\` stops; \`colorBy="linear"\` lays one gradient across the whole figure.
- success/failure endings → \`state="success"\` / \`state="error"\`.

Common mistakes:

- \`arrangement\` defaults to \`"line"\`. Loop-only props (\`ringSize\`, \`aspect\`, \`squareness\`, \`stroke\`, \`align\`, and \`length\`/\`thickness\` on PulseDots) are silently ignored on a line — set \`arrangement="loop"\` first.
- Line-only props (\`size\`, \`gap\`, and \`length\`/\`origin\` on PulseBars) are ignored on a loop.
- \`dim\`, \`restScale\`, \`progress\` and \`intensity\` are all 0..1.
- No CSS import and no provider: components inject their one keyframe themselves.
- Spread a recipe onto the component matching its \`element\`: \`recipes.typing.element\` is \`"dots"\`, so \`<PulseDots {...recipes.typing.props} />\`.`

// ---- AGENTS.md ----

const agentsMd = `# react-pulsor — guide for coding agents

This file is for agents *using* react-pulsor in an app. For working on the
library itself, see \`CONTRIBUTING.md\` in the repo.

> ${pkg.description}

\`\`\`sh
npm install react-pulsor
\`\`\`

\`\`\`tsx
import { PulseGrid, PulseBars, PulseDots, recipes, useStreamIntensity } from "react-pulsor"
\`\`\`

${GUIDANCE}

## Recipes

${recipeTable("en")}

## Where the full details live

- Complete prop tables and examples: \`README.md\` in this package.
- Exact types, defaults and per-prop docs: \`dist/index.d.ts\` (fully JSDoc'd).
- Every recipe expanded to ready-to-paste JSX: ${SITE}/llms-full.txt
- Live playground with shareable config links: ${SITE}
`

// ---- llms.txt ----

const recipeCount = Object.keys(recipes).length

const llmsTxt = `# react-pulsor

> ${pkg.description}

Key facts:

- Zero dependencies. The animation is one compositor-only CSS keyframe (opacity/transform) that components inject themselves — no CSS import, no provider.
- Three components: \`<PulseGrid>\` (rows × cols matrix), \`<PulseBars>\` (line or striped loop), \`<PulseDots>\` (line or loop). Bars and dots take \`arrangement="line" | "loop"\`.
- ${recipeCount} curated configurations ship as the \`recipes\` export; spread \`recipes.x.props\` onto the component matching \`recipes.x.element\`.
- \`cssSnippet()\` / \`svgSnippet()\` emit standalone, framework-free CSS or SVG for any config.
- \`useStreamIntensity()\` drives a loader's \`intensity\` from an AI token stream.
- Extras: \`state\` (success/error endings), \`progress\` (determinate fill), \`feel\` (motion personality macro), reduced-motion respected by default.

## Docs

- [Full reference](${SITE}/llms-full.txt): complete README, guidance for agents, and every recipe expanded to JSX
- [README](${REPO}/blob/main/README.md)
- [npm](https://www.npmjs.com/package/react-pulsor)
- [Live playground](${SITE})
`

// ---- llms-full.txt ----

function transformReadme(md) {
  const lines = md.split("\n").filter((l) => {
    if (l.startsWith("**English** ·")) return false
    if (l.startsWith("<img ")) return false
    if (l.startsWith("[![npm]")) return false
    if (l.includes("recipes-table:")) return false
    return true
  })
  // the AI-assistants section points at this very file — drop it here
  const out = []
  let skipping = false
  for (const l of lines) {
    if (l.startsWith("## ")) skipping = l === "## For AI assistants"
    if (!skipping) out.push(l)
  }
  return out
    .join("\n")
    .replaceAll("](./", `](${REPO}/blob/main/`)
    .replace(/\n{3,}/g, "\n\n")
}

function recipeCatalog() {
  return Object.entries(recipes)
    .map(
      ([name, r]) =>
        `### ${name} — ${r.title}\n\n${r.blurb}\n\n\`\`\`jsx\n${recipeJsx(r)}\n\`\`\``,
    )
    .join("\n\n")
}

// READMEs first, so the en table rides into llms-full via the fresh file
const readmeEn = insertTable("README.md", "en")
insertTable("README.zh-CN.md", "zh")
insertTable("README.ja.md", "ja")

const llmsFull = `${transformReadme(readmeEn)}

---

${GUIDANCE}

## Recipe catalog (ready-to-paste JSX)

${recipeCatalog()}
`

writeFileSync("site/public/llms.txt", llmsTxt)
writeFileSync("site/public/llms-full.txt", llmsFull)
writeFileSync("AGENTS.md", agentsMd)
console.log(
  `llms.txt ${llmsTxt.length} B · llms-full.txt ${llmsFull.length} B · AGENTS.md ${agentsMd.length} B · ${recipeCount} recipes`,
)
