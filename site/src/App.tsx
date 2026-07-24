import { useEffect, useMemo, useRef, useState } from "react"
import type {
  AnimateMode,
  GradientStop,
  PulseBarsProps,
  PulseDotsProps,
  PulseGridProps,
  Recipe,
  RecipeName,
  SnippetProps,
} from "react-pulsor"
import {
  cssSnippet,
  PulseBars,
  PulseDots,
  PulseGrid,
  palettes,
  recipes,
  svgSnippet,
} from "react-pulsor"
import {
  ANIMATE_MODES,
  ampFallback,
  COMPONENT_NAMES,
  type Config,
  decodeShare,
  defaultConfig,
  EASINGS,
  type ElementKind,
  ENVELOPE_OPTIONS,
  encodeShare,
  GRID_PATTERNS,
  generateCode,
  LINEAR_PATTERNS,
  modeDefaults,
  propsFor,
  recipeToConfig,
} from "./defaults"
import { exportGif } from "./exportGif"
import { Gallery, RECIPE_SCALE, RecipeView } from "./Gallery"
import { type Lang, useI18n } from "./i18n"
import { Check, Code, Copy, Css, GifIcon, Link, Vector } from "./icons"
import { PropsSection } from "./PropsRef"
import { highlightJsx, Section, Segmented, SegRow, Select, Slider, Swatches } from "./ui"

function LoaderView({ element, props }: { element: ElementKind; props: Record<string, unknown> }) {
  if (element === "grid") return <PulseGrid {...(props as PulseGridProps)} />
  if (element === "bars") return <PulseBars {...(props as PulseBarsProps)} />
  return <PulseDots {...(props as PulseDotsProps)} />
}

/** Amber hairline under the top edge tracking scroll — a quiet level meter. */
function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      el.style.transform = `scaleX(${max > 0 ? doc.scrollTop / max : 0})`
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return <div ref={ref} className="scroll-progress" aria-hidden />
}

function Eyebrow({ title }: { title: string }) {
  return (
    <div className="eyebrow-block">
      <h2 className="eyebrow">{title}</h2>
    </div>
  )
}

const SPECIMENS: RecipeName[] = ["ascent", "kelp", "glyph", "typing", "monogram"]

const ms = (v: number) => `${v}ms`
const px = (v: number) => `${v}px`
const x100 = (v: number) => `${Math.round(v * 100)}%`

export default function App() {
  const { lang, setLang, t } = useI18n()
  const shared = useMemo(() => decodeShare(window.location.hash), [])
  const [element, setElement] = useState<ElementKind>(shared?.element ?? "grid")
  const [configs, setConfigs] = useState<Record<ElementKind, Config>>(() => {
    const base = {
      grid: defaultConfig("grid"),
      bars: defaultConfig("bars"),
      dots: defaultConfig("dots"),
    }
    if (shared) base[shared.element] = shared.config
    return base
  })
  const [bg, setBg] = useState<"dark" | "light">("dark")
  const [zoom, setZoom] = useState(1)
  const [feelFlash, setFeelFlash] = useState(0)
  const [copied, setCopied] = useState<"code" | "install" | "css" | "link" | "svg" | null>(null)
  const [gifBusy, setGifBusy] = useState(false)

  const config = configs[element]

  useEffect(() => {
    const encoded = encodeShare(element, config)
    const base = window.location.pathname + window.location.search
    window.history.replaceState(
      null,
      "",
      encoded ? `${base}#p=${encodeURIComponent(encoded)}` : base,
    )
  }, [element, config])

  const set = (patch: Partial<Config>) =>
    setConfigs((cs) => ({ ...cs, [element]: { ...cs[element], ...patch } }))

  const setAnimate = (mode: AnimateMode) =>
    set({ animate: mode, ...modeDefaults(mode, ampFallback(element, config)) })

  const props = useMemo(() => propsFor(element, config), [element, config])
  const code = useMemo(() => generateCode(element, config), [element, config])

  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1600)
  }

  // The check-icon swap on the button is the confirmation; no toast on top.
  const copy = (text: string, which: "code" | "install" | "css" | "link" | "svg") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which)
      window.setTimeout(() => setCopied((c) => (c === which ? null : c)), 1500)
    })
  }

  const applyRecipe = (name: RecipeName) => {
    const recipe = recipes[name] as Recipe
    const el = recipe.element as ElementKind
    setConfigs((cs) => ({ ...cs, [el]: recipeToConfig(recipe) }))
    setElement(el)
    document.getElementById("playground")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    })
  }

  const patterns = element === "grid" ? GRID_PATTERNS : LINEAR_PATTERNS
  const usesRestScale = ["scale", "fade-scale", "stretch"].includes(config.animate)

  const setStop = (i: number, color: string) => {
    const customStops = config.customStops.slice()
    customStops[i] = color
    set({ customStops })
  }

  // Personality macro: stamps the archetype's envelope/easing/tempo onto the
  // explicit controls (the library's `feel` prop does this via defaults).
  // Stays highlighted until one of the governed controls is touched.
  const applyFeel = (f: "calm" | "crisp" | "lively" | "urgent") => {
    if (f === "calm") set({ feelSel: f, envelopePreset: "breathe", easing: "auto", period: 1450 })
    else if (f === "crisp")
      set({ feelSel: f, envelopePreset: "pulse", easing: "auto", period: 900 })
    else if (f === "lively")
      set({
        feelSel: f,
        envelopePreset: "custom",
        attack: 0.12,
        hold: 0.04,
        release: 0.4,
        easing: "spring",
        period: 750,
      })
    else set({ feelSel: f, envelopePreset: "flash", easing: "snap", period: 650 })
    setFeelFlash((n) => n + 1)
  }

  return (
    <div className="page">
      <ScrollProgress />
      <nav className="nav">
        <a className="nav-brand" href="#top">
          <PulseGrid
            rows={3}
            cols={3}
            cellSize={3.5}
            gap={1.5}
            radius={0.75}
            pattern="sparkle"
            seed={11}
            waves={2}
            period={1400}
            label="Pulsor"
          />
          <span>Pulsor</span>
        </a>
        <div className="nav-links">
          <a href="#playground">Playground</a>
          <a href="#recipes">Recipes</a>
          <a href="https://www.npmjs.com/package/react-pulsor" target="_blank" rel="noreferrer">
            npm ↗
          </a>
          <fieldset className="lang-switch" aria-label="Language">
            {(["en", "ja", "zh"] as Lang[]).map((l) => (
              <button
                type="button"
                key={l}
                aria-pressed={lang === l}
                className={lang === l ? "lang-btn active" : "lang-btn"}
                onClick={() => setLang(l)}
              >
                {l === "en" ? "EN" : l === "zh" ? "中" : "日"}
              </button>
            ))}
          </fieldset>
        </div>
      </nav>

      <header className="hero" id="top">
        <p className="hero-eyebrow">React · TypeScript · Zero dependencies · MIT</p>
        <h1 className="hero-title">
          {t.heroTitle[0]}
          <em>{t.heroTitle[1]}</em>
          {t.heroTitle[2]}
        </h1>
        <p className="tagline">{t.tagline}</p>
        <div className="install">
          <code>npm i react-pulsor</code>
          <button
            type="button"
            className="icon-btn"
            title={t.copy}
            aria-label={t.copy}
            onClick={() => copy("npm i react-pulsor", "install")}
          >
            {copied === "install" ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>

        <div className="specimens">
          {SPECIMENS.map((name) => (
            <button type="button" className="specimen" key={name} onClick={() => applyRecipe(name)}>
              <span className="specimen-stage aperture">
                <span
                  style={
                    RECIPE_SCALE[name] ? { transform: `scale(${RECIPE_SCALE[name]})` } : undefined
                  }
                >
                  <RecipeView recipe={recipes[name] as Recipe} />
                </span>
              </span>
              <span className="specimen-name">{recipes[name].title}</span>
            </button>
          ))}
        </div>
      </header>

      <Eyebrow title="Playground" />

      <section className="playground" id="playground">
        <div className={`preview aperture ${bg}`}>
          <div className="stage">
            <div style={zoom > 1 ? { transform: `scale(${zoom})` } : undefined}>
              <LoaderView element={element} props={props} />
            </div>
          </div>
          <div className="hud hud-tl">
            <Segmented value={bg} options={["dark", "light"] as const} onChange={setBg} />
          </div>
          <div className="hud hud-tr">
            <Segmented
              value={`${zoom}×`}
              options={["1×", "2×", "4×"] as const}
              onChange={(v) => setZoom(Number(v[0]))}
            />
          </div>
          <div className="hud hud-bl">
            <code className="preview-name">{`<${COMPONENT_NAMES[element]} />`}</code>
          </div>
          <div className="hud hud-br">
            <button
              type="button"
              className="label-btn"
              title={t.copySvg}
              onClick={() => copy(svgSnippet(element, props as SnippetProps), "svg")}
            >
              {copied === "svg" ? <Check size={13} /> : <Vector size={13} />}
              svg
            </button>
            <button
              type="button"
              className="label-btn"
              title={t.exportGif}
              disabled={gifBusy}
              onClick={async () => {
                setGifBusy(true)
                try {
                  await exportGif(element, props as SnippetProps, {
                    background: bg === "light" ? "#faf9f4" : "#0f0f09",
                  })
                  showToast(t.gifDone)
                } catch {
                  showToast(t.exportFailed)
                } finally {
                  setGifBusy(false)
                }
              }}
            >
              <GifIcon size={13} />
              {gifBusy ? "…" : "gif"}
            </button>
            <button
              type="button"
              className="label-btn"
              title={t.copyLink}
              onClick={() => copy(window.location.href, "link")}
            >
              {copied === "link" ? <Check size={13} /> : <Link size={13} />}
              link
            </button>
          </div>
        </div>

        <aside className="controls">
          <Section title="Element">
            <Segmented
              value={element}
              options={["grid", "bars", "dots"] as const}
              onChange={setElement}
            />
          </Section>

          <Section title="Shape">
            {element === "grid" && (
              <>
                <Slider
                  label="rows"
                  value={config.rows}
                  min={1}
                  max={12}
                  onChange={(v) => set({ rows: v })}
                />
                <Slider
                  label="cols"
                  value={config.cols}
                  min={1}
                  max={12}
                  onChange={(v) => set({ cols: v })}
                />
                <Slider
                  label="cell size"
                  value={config.cellSize}
                  min={2}
                  max={20}
                  onChange={(v) => set({ cellSize: v })}
                  format={px}
                />
                <Slider
                  label="gap"
                  value={config.gap}
                  min={0}
                  max={12}
                  onChange={(v) => set({ gap: v })}
                  format={px}
                />
                <Slider
                  label="radius"
                  value={config.radius}
                  min={0}
                  max={10}
                  step={0.5}
                  onChange={(v) => set({ radius: v })}
                  format={px}
                />
              </>
            )}
            {element === "bars" && (
              <>
                <SegRow
                  label="arrangement"
                  value={config.barsArrangement}
                  options={["line", "loop"] as const}
                  onChange={(v) =>
                    set(
                      v === "loop"
                        ? {
                            barsArrangement: v,
                            count: 8,
                            thickness: 3,
                            orientation: "horizontal",
                            stroke: Math.round(config.ringSize * 0.3 * 100) / 100,
                          }
                        : {
                            barsArrangement: v,
                            count: 5,
                            thickness: 4,
                            length: 18,
                            orientation: "vertical",
                          },
                    )
                  }
                />
                {config.barsArrangement === "line" ? (
                  <>
                    <Slider
                      label="count"
                      value={config.count}
                      min={2}
                      max={16}
                      onChange={(v) => set({ count: v })}
                    />
                    <Slider
                      label="thickness"
                      value={config.thickness}
                      min={2}
                      max={16}
                      onChange={(v) => set({ thickness: v })}
                      format={px}
                    />
                    <Slider
                      label="length"
                      value={config.length}
                      min={6}
                      max={48}
                      onChange={(v) => set({ length: v })}
                      format={px}
                    />
                    <Slider
                      label="gap"
                      value={config.gap}
                      min={0}
                      max={12}
                      onChange={(v) => set({ gap: v })}
                      format={px}
                    />
                    <SegRow
                      label="orientation"
                      value={config.orientation}
                      options={["vertical", "horizontal"] as const}
                      onChange={(v) => set({ orientation: v })}
                    />
                    {config.animate === "stretch" && (
                      <SegRow
                        label="origin"
                        value={config.origin}
                        options={["center", "start", "end"] as const}
                        onChange={(v) => set({ origin: v })}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <Slider
                      label="stripes"
                      value={config.count}
                      min={3}
                      max={16}
                      onChange={(v) => set({ count: v })}
                    />
                    <Slider
                      label="loop size"
                      value={config.ringSize}
                      min={16}
                      max={64}
                      onChange={(v) => set({ ringSize: v })}
                      format={px}
                    />
                    <Slider
                      label="aspect"
                      value={config.aspect}
                      min={0.6}
                      max={1.4}
                      step={0.02}
                      onChange={(v) => set({ aspect: v })}
                    />
                    <Slider
                      label="squareness"
                      value={config.squareness}
                      min={1}
                      max={6}
                      step={0.1}
                      onChange={(v) => set({ squareness: v })}
                    />
                    <Slider
                      label="stroke"
                      value={config.stroke}
                      min={2}
                      max={24}
                      step={0.5}
                      onChange={(v) => set({ stroke: v })}
                      format={px}
                    />
                    <Slider
                      label="thickness"
                      value={config.thickness}
                      min={1}
                      max={8}
                      step={0.5}
                      onChange={(v) => set({ thickness: v })}
                      format={px}
                    />
                    <SegRow
                      label="stripes run"
                      value={config.orientation}
                      options={["horizontal", "vertical"] as const}
                      onChange={(v) => set({ orientation: v })}
                    />
                  </>
                )}
                <Slider
                  label="radius"
                  value={config.radius}
                  min={0}
                  max={8}
                  step={0.5}
                  onChange={(v) => set({ radius: v })}
                  format={px}
                />
              </>
            )}
            {element === "dots" && (
              <>
                <SegRow
                  label="arrangement"
                  value={config.dotsArrangement}
                  options={["line", "loop"] as const}
                  onChange={(v) =>
                    set(
                      v === "loop"
                        ? {
                            dotsArrangement: v,
                            count: 8,
                            radius: Math.min(config.length, config.thickness) / 2,
                          }
                        : { dotsArrangement: v, count: 3, radius: config.size / 2 },
                    )
                  }
                />
                <Slider
                  label="count"
                  value={config.count}
                  min={1}
                  max={24}
                  onChange={(v) => set({ count: v })}
                />
                {config.dotsArrangement === "line" ? (
                  <>
                    <Slider
                      label="size"
                      value={config.size}
                      min={2}
                      max={20}
                      onChange={(v) => set({ size: v, radius: v / 2 })}
                      format={px}
                    />
                    <Slider
                      label="gap"
                      value={config.gap}
                      min={0}
                      max={16}
                      onChange={(v) => set({ gap: v })}
                      format={px}
                    />
                  </>
                ) : (
                  <>
                    <Slider
                      label="ring size"
                      value={config.ringSize}
                      min={12}
                      max={64}
                      onChange={(v) => set({ ringSize: v })}
                      format={px}
                    />
                    <Slider
                      label="aspect"
                      value={config.aspect}
                      min={0.6}
                      max={1.4}
                      step={0.02}
                      onChange={(v) => set({ aspect: v })}
                    />
                    <Slider
                      label="squareness"
                      value={config.squareness}
                      min={1}
                      max={6}
                      step={0.1}
                      onChange={(v) => set({ squareness: v })}
                    />
                    <Slider
                      label="length"
                      value={config.length}
                      min={2}
                      max={16}
                      onChange={(v) =>
                        set({ length: v, radius: Math.min(v, config.thickness) / 2 })
                      }
                      format={px}
                    />
                    <Slider
                      label="thickness"
                      value={config.thickness}
                      min={2}
                      max={12}
                      onChange={(v) =>
                        set({ thickness: v, radius: Math.min(config.length, v) / 2 })
                      }
                      format={px}
                    />
                    <SegRow
                      label="align"
                      value={config.align}
                      options={["tangent", "radial"] as const}
                      onChange={(v) => set({ align: v })}
                    />
                  </>
                )}
                <Slider
                  label="radius"
                  value={config.radius}
                  min={0}
                  max={
                    config.dotsArrangement === "loop"
                      ? Math.min(config.length, config.thickness) / 2
                      : config.size / 2
                  }
                  step={0.5}
                  onChange={(v) => set({ radius: v })}
                  format={px}
                />
              </>
            )}
          </Section>

          <Section title="Motion">
            <SegRow
              label="feel"
              value={config.feelSel}
              options={["calm", "crisp", "lively", "urgent"] as const}
              onChange={applyFeel}
            />
            <p className="ctl-caption">{t.feelHint}</p>
            <Select
              label="pattern"
              value={config.pattern}
              options={patterns}
              onChange={(v) => set({ pattern: v })}
            />
            <Select
              label="animate"
              value={config.animate}
              options={ANIMATE_MODES}
              onChange={(v) => setAnimate(v as AnimateMode)}
            />
            <div className={feelFlash ? "feel-targets flash" : "feel-targets"} key={feelFlash}>
              <Select
                label="envelope"
                value={config.envelopePreset}
                options={ENVELOPE_OPTIONS}
                onChange={(v) => set({ envelopePreset: v, feelSel: "" })}
              />
              {config.envelopePreset === "custom" && (
                <>
                  <Slider
                    label="attack"
                    value={config.attack}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(v) => set({ attack: v, feelSel: "" })}
                    format={x100}
                  />
                  <Slider
                    label="hold"
                    value={config.hold}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(v) => set({ hold: v, feelSel: "" })}
                    format={x100}
                  />
                  <Slider
                    label="release"
                    value={config.release}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(v) => set({ release: v, feelSel: "" })}
                    format={x100}
                  />
                </>
              )}
              <Slider
                label="period"
                value={config.period}
                min={200}
                max={3000}
                step={50}
                onChange={(v) => set({ period: v, feelSel: "" })}
                format={ms}
              />
            </div>
            <Slider
              label="waves"
              value={config.waves}
              min={1}
              max={4}
              step={0.5}
              onChange={(v) => set({ waves: v })}
            />
          </Section>

          <Section title="Color">
            <Swatches
              entries={Object.entries(palettes) as [string, GradientStop[]][]}
              selected={config.paletteMode === "preset" ? config.palettePreset : null}
              onSelect={(name) => set({ paletteMode: "preset", palettePreset: name })}
            />
            <button
              type="button"
              className={config.paletteMode === "custom" ? "custom-toggle active" : "custom-toggle"}
              onClick={() => set({ paletteMode: "custom" })}
            >
              {t.customGradient}
            </button>
            {config.paletteMode === "custom" && (
              <div className="custom-stops">
                {config.customStops.map((color, i) => (
                  <span className="stop" key={i}>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setStop(i, e.target.value)}
                    />
                    {config.customStops.length > 2 && (
                      <button
                        type="button"
                        className="stop-remove"
                        aria-label="Remove stop"
                        onClick={() =>
                          set({ customStops: config.customStops.filter((_, j) => j !== i) })
                        }
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {config.customStops.length < 4 && (
                  <button
                    type="button"
                    className="stop-add"
                    onClick={() => set({ customStops: [...config.customStops, "#8A7DFF"] })}
                  >
                    {t.addStop}
                  </button>
                )}
              </div>
            )}
          </Section>

          <details className="finetune">
            <summary>State</summary>
            <div className="finetune-body">
              <SegRow
                label="state"
                value={config.state}
                options={["loading", "success", "error"] as const}
                onChange={(v) => set({ state: v })}
              />
              {config.state === "loading" && (
                <>
                  <SegRow
                    label="mode"
                    value={config.progressMode ? "progress" : "flow"}
                    options={["flow", "progress"] as const}
                    onChange={(v) => set({ progressMode: v === "progress" })}
                  />
                  {config.progressMode && (
                    <Slider
                      label="progress"
                      value={config.progress}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(v) => set({ progress: v })}
                      format={x100}
                    />
                  )}
                </>
              )}
              <Slider
                label="intensity"
                value={config.intensity}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => set({ intensity: v })}
                format={x100}
              />
              <Slider
                label="appear delay"
                value={config.appearDelay}
                min={0}
                max={1000}
                step={50}
                onChange={(v) => set({ appearDelay: v })}
                format={ms}
              />
            </div>
          </details>

          <details className="finetune">
            <summary>Advanced</summary>
            <div className="finetune-body">
              <Select
                label="easing"
                value={config.easing}
                options={EASINGS}
                onChange={(v) => set({ easing: v, feelSel: "" })}
              />
              <Slider
                label="dim"
                value={config.dim}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => set({ dim: v })}
                format={x100}
              />
              {usesRestScale && (
                <Slider
                  label="rest scale"
                  value={config.restScale}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => set({ restScale: v })}
                  format={x100}
                />
              )}
              {config.animate === "bounce" && (
                <Slider
                  label="amplitude"
                  value={config.amplitude}
                  min={0}
                  max={24}
                  step={0.5}
                  onChange={(v) => set({ amplitude: v })}
                  format={px}
                />
              )}
              {config.animate === "sway" && (
                <Slider
                  label="amplitude"
                  value={config.amplitude}
                  min={0}
                  max={45}
                  step={1}
                  onChange={(v) => set({ amplitude: v })}
                  format={(v) => `${v}°`}
                />
              )}
              {config.animate === "flip" && (
                <Slider
                  label="amplitude"
                  value={config.amplitude}
                  min={0}
                  max={360}
                  step={5}
                  onChange={(v) => set({ amplitude: v })}
                  format={(v) => `${v}°`}
                />
              )}
              <Select
                label="color by"
                value={config.colorBy}
                options={["position", "phase", "linear"]}
                onChange={(v) => set({ colorBy: v as Config["colorBy"] })}
              />
              {config.colorBy === "linear" && (
                <Slider
                  label="grad angle"
                  value={config.gradientAngle}
                  min={0}
                  max={360}
                  step={5}
                  onChange={(v) => set({ gradientAngle: v })}
                  format={(v) => `${v}°`}
                />
              )}
              {config.pattern === "sparkle" && (
                <Slider
                  label="seed"
                  value={config.seed}
                  min={1}
                  max={64}
                  onChange={(v) => set({ seed: v })}
                />
              )}
            </div>
          </details>
        </aside>
      </section>

      <Eyebrow title="Usage" />

      <section className="codeblock">
        <div className="code-head">
          <span className="code-file">App.tsx</span>
          <span className="code-actions">
            <button type="button" className="label-btn" onClick={() => copy(code, "code")}>
              {copied === "code" ? <Check size={14} /> : <Code size={14} />}
              {t.copyJsx}
            </button>
            <button
              type="button"
              className="label-btn"
              onClick={() => copy(cssSnippet(element, props as SnippetProps), "css")}
            >
              {copied === "css" ? <Check size={14} /> : <Css size={14} />}
              {t.copyCss}
            </button>
          </span>
        </div>
        <pre>
          <code>{highlightJsx(code)}</code>
        </pre>
      </section>

      <div id="recipes">
        <Eyebrow title="Recipes" />
      </div>

      <section className="gallery">
        <Gallery onLoad={applyRecipe} lang={lang} t={t} />
      </section>

      <Eyebrow title="Props" />
      <PropsSection lang={lang} t={t} />

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      <footer className="footer">
        <div className="footer-brand">
          <PulseDots count={3} size={5} gap={3} period={1000} label="" aria-hidden />
          <span>Pulsor</span>
        </div>
        <span className="footer-meta">
          MIT · react-pulsor · zero dependencies · compositor-only animation
        </span>
      </footer>
    </div>
  )
}
