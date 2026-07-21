import type { CSSProperties, ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import type { GradientStop } from "react-pulsor"

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ctl-section">
      <h3 className="ctl-title">{title}</h3>
      {children}
    </section>
  )
}

/**
 * The value readout doubles as a text field: hover hints it, focus switches
 * to the raw number, and commits clamp to [min, max] and snap to the step.
 * Enter commits, Escape reverts; junk input falls back to the old value.
 */
function ValueInput({
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  const [draft, setDraftState] = useState<string | null>(null)
  const draftRef = useRef<string | null>(null)
  const setDraft = (v: string | null) => {
    draftRef.current = v
    setDraftState(v)
  }

  const commit = () => {
    const d = draftRef.current
    if (d === null) return
    let n = Number(d.replace(/[^\d.eE+-]/g, ""))
    if (!Number.isFinite(n)) {
      setDraft(null)
      return
    }
    // "65" typed into a 0..1 slider almost certainly means 65%.
    if (max <= 1 && n > 1 && n <= 100) n = n / 100
    const clamped = Math.min(max, Math.max(min, n))
    const snapped = Math.round((clamped - min) / step) * step + min
    onChange(Math.min(max, Math.round(snapped * 1000) / 1000))
    setDraft(null)
  }

  return (
    <input
      className="ctl-value"
      type="text"
      inputMode="decimal"
      value={draft ?? format(value)}
      onFocus={(e) => {
        const el = e.currentTarget
        setDraft(String(value))
        requestAnimationFrame(() => el.select())
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur()
        else if (e.key === "Escape") {
          setDraft(null)
          e.currentTarget.blur()
        }
      }}
    />
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v: number) => String(v),
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  const fill = ((value - min) / (max - min)) * 100
  return (
    <div className="ctl-row">
      <span className="ctl-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        style={{ "--fill": `${fill}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <ValueInput
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        format={format}
      />
    </div>
  )
}

export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (v: string) => void
}) {
  return (
    <label className="ctl-row">
      <span className="ctl-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  /** May be a value outside `options` (e.g. "") to render with no selection. */
  value: string
  options: readonly T[]
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          type="button"
          key={o}
          role="tab"
          aria-selected={o === value}
          className={o === value ? "seg-btn active" : "seg-btn"}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export function SegRow<T extends string>(props: {
  label: string
  value: string
  options: readonly T[]
  onChange: (v: T) => void
}) {
  return (
    <div className="ctl-row">
      <span className="ctl-label">{props.label}</span>
      <Segmented value={props.value} options={props.options} onChange={props.onChange} />
    </div>
  )
}

function gradientCss(stops: GradientStop[]): string {
  const parts = stops.map((s) => `${s.color} ${Math.round(s.position * 100)}%`).join(", ")
  return `linear-gradient(90deg, ${parts})`
}

export function Swatches({
  entries,
  selected,
  onSelect,
}: {
  entries: [string, GradientStop[]][]
  selected: string | null
  onSelect: (name: string) => void
}) {
  return (
    <div className="swatches">
      {entries.map(([name, stops]) => (
        <button
          type="button"
          key={name}
          title={name}
          aria-label={`Palette ${name}`}
          className={name === selected ? "swatch active" : "swatch"}
          style={{ background: gradientCss(stops) }}
          onClick={() => onSelect(name)}
        />
      ))}
    </div>
  )
}

/** Fade-up once the element scrolls into view. */
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!("IntersectionObserver" in window)) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={shown ? "reveal in" : "reveal"}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/** Minimal JSX tokenizer for the usage snippet — no dependencies. */
export function highlightJsx(code: string): ReactNode[] {
  const re =
    /("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|(\bimport\b|\bfrom\b)|(<\/?[A-Z][\w]*|\/>|<\/|>)|([a-zA-Z][\w-]*)(?==)|([{}[\],:])/g
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  // biome-ignore lint/suspicious/noAssignInExpressions: idiomatic exec loop
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) out.push(code.slice(last, m.index))
    const [text] = m
    const cls = m[1]
      ? "tok-str"
      : m[2]
        ? "tok-num"
        : m[3]
          ? "tok-kw"
          : m[4]
            ? "tok-tag"
            : m[5]
              ? "tok-attr"
              : "tok-punct"
    out.push(
      <span key={key++} className={cls}>
        {text}
      </span>,
    )
    last = m.index + text.length
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}
