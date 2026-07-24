import type { CSSProperties } from "react"
import { useMemo, useState } from "react"
import type { GradientStop, Recipe, RecipeName } from "react-pulsor"
import { PulseBars, PulseDots, PulseGrid, palettes, recipes } from "react-pulsor"
import type { ElementKind } from "./defaults"
import { type Lang, RECIPE_BLURBS, type Strings } from "./i18n"
import { Reveal } from "./ui"

/** Render a recipe; `periodScale` < 1 speeds the loop up (hover audition). */
export function RecipeView({ recipe, periodScale = 1 }: { recipe: Recipe; periodScale?: number }) {
  const period = Math.round((recipe.props.period ?? 900) * periodScale)
  switch (recipe.element) {
    case "grid":
      return <PulseGrid {...recipe.props} period={period} />
    case "bars":
      return <PulseBars {...recipe.props} period={period} />
    case "dots":
      return <PulseDots {...recipe.props} period={period} />
  }
}

/** Representative color of a recipe's palette, for the card's glow. */
function accentFor(recipe: Recipe): string {
  const p = recipe.props.palette ?? "aurora"
  if (typeof p === "string") {
    const preset = (palettes as Record<string, GradientStop[]>)[p]
    if (!preset) return p
    return preset[Math.floor(preset.length / 2)].color
  }
  return p[Math.floor(p.length / 2)]?.color ?? "#8A7DFF"
}

/** Oversized recipes get scaled down in preview stages (display only). */
export const RECIPE_SCALE: Partial<Record<RecipeName, number>> = {
  sonar: 0.8,
  galaxy: 0.8,
  manuscript: 0.8,
  monogram: 0.9,
  ticker: 0.9,
}

const FILTERS = ["all", "grid", "bars", "dots"] as const
type Filter = (typeof FILTERS)[number]

export function Gallery({
  onLoad,
  lang,
  t,
}: {
  onLoad: (name: RecipeName) => void
  lang: Lang
  t: Strings
}) {
  const [filter, setFilter] = useState<Filter>("all")
  const [hovered, setHovered] = useState<RecipeName | null>(null)

  const all = Object.entries(recipes) as [RecipeName, Recipe][]
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length }
    for (const [, r] of all) c[r.element] = (c[r.element] ?? 0) + 1
    return c
  }, [all])

  const shown = filter === "all" ? all : all.filter(([, r]) => r.element === filter)

  return (
    <>
      <fieldset className="gallery-filters" aria-label="Filter recipes">
        {FILTERS.map((f) => (
          <button
            type="button"
            key={f}
            aria-pressed={filter === f}
            className={filter === f ? "chip active" : "chip"}
            onClick={() => setFilter(f)}
          >
            {f}
            <span className="chip-count">{counts[f as ElementKind] ?? 0}</span>
          </button>
        ))}
      </fieldset>

      <div className="cards">
        {shown.map(([name, recipe], i) => (
          <Reveal key={name} delay={(i % 4) * 50}>
            <article
              className="card"
              style={{ "--accent-card": accentFor(recipe) } as CSSProperties}
              onMouseEnter={() => setHovered(name)}
              onMouseLeave={() => setHovered((h) => (h === name ? null : h))}
            >
              <button
                type="button"
                className="card-stage aperture"
                onClick={() => onLoad(name)}
                aria-label={`Load ${recipe.title} into the playground`}
              >
                <span
                  className="card-scale"
                  style={
                    RECIPE_SCALE[name] ? { transform: `scale(${RECIPE_SCALE[name]})` } : undefined
                  }
                >
                  <RecipeView recipe={recipe} periodScale={hovered === name ? 0.55 : 1} />
                </span>
                <span className="card-cta">{t.openInPlayground}</span>
              </button>
              <div className="card-meta">
                <span className="card-title">{recipe.title}</span>
                <span className="card-blurb">
                  {lang === "en" ? recipe.blurb : (RECIPE_BLURBS[lang][name] ?? recipe.blurb)}
                </span>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </>
  )
}
