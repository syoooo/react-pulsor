# react-pulsor

**English** · [简体中文](https://github.com/syoooo/react-pulsor/blob/main/README.zh-CN.md) · [日本語](https://github.com/syoooo/react-pulsor/blob/main/README.ja.md)

**Live demo → [react-pulsor.vercel.app](https://react-pulsor.vercel.app)**

Composable React loading indicators. Grids, bars, dots and rings driven by
**phase fields**, **motion envelopes** and **OKLab gradients** — one
compositor-only keyframe, zero dependencies, no CSS import.

Most loaders are one baked-in animation with a size knob. Pulsor instead
gives you four orthogonal dials, and every combination is a different loader:

- **Geometry** — a cell grid (`PulseGrid`), bars in a line or stacked into a
  striped letter O (`PulseBars`), a row of dots (`PulseDots`), or elements
  around a superellipse ring (`PulseRing`).
- **Pattern** — the *phase field*: how the wave travels the figure. Sweeps,
  diagonals, ripples, spirals, chevrons, boustrophedon snakes, seeded
  sparkle, or everything in sync.
- **Envelope** — the intensity curve of one beat, ADSR-style
  (`attack` / `hold` / `release`), with presets from a soft `breathe` to a
  strobe `flash` to a double-thump `heartbeat`.
- **Color** — multi-stop gradients sampled in OKLab (sRGB interpolation
  detours through gray; OKLab doesn't), mapped by spatial position or by
  animation phase.

## Why it stays smooth

Every element shares a **single opacity/transform keyframe**; the pattern
only assigns each element a negative `animation-delay` (its phase in the
loop). The browser composites the whole thing off the main thread, so the
loader keeps ticking while your app is busy doing the work the user is
waiting for — exactly when a loader matters. Negative delays also mean the
animation mounts mid-flight: no awkward fill-in ramp on first paint.

Styles are injected once at runtime (`useInsertionEffect`, deduped by
config), so there is nothing to import and nothing to configure.

## Install

```sh
npm i react-pulsor
```

## Usage

```tsx
import { PulseGrid, PulseBars, PulseDots, PulseRing } from "react-pulsor"

// A 4×4 ripple, aurora palette — the default grid.
<PulseGrid />

// An equalizer: five upright bars breathing through a travelling wave.
<PulseBars envelope="breathe" waves={1.5} palette="lagoon" />

// A striped loop — pill scanlines tracing a closed outline.
<PulseBars arrangement="loop" ringSize={32} stroke={10} squareness={2.2} animate="fade" />

// The classic typing indicator, with a springy hop.
<PulseDots animate="bounce" easing="spring" period={800} />

// A dashed-O spinner around a superellipse.
<PulseRing count={12} length={7} thickness={3} aspect={0.88} squareness={2.6} />

// Custom gradient stops (sampled in OKLab).
<PulseGrid
  palette={[
    { color: "#B6D3EF", position: 0 },
    { color: "#F888A0", position: 1 },
  ]}
  pattern="spiral"
  rows={5}
  cols={5}
/>
```

Or start from a curated recipe:

```tsx
import { PulseGrid, recipes } from "react-pulsor"

<PulseGrid {...recipes.sonar.props} />
```

## Shared props

Every component accepts these, plus any `HTMLAttributes<HTMLSpanElement>`
(`className`, `style`, …).

| Prop                   | Type                                              | Default      |
| ---------------------- | ------------------------------------------------- | ------------ |
| `palette`              | preset name \| CSS color \| `GradientStop[]`      | `"aurora"`   |
| `colorBy`              | `"position" \| "phase" \| "linear"`               | `"position"` |
| `gradientAngle`        | `number` degrees — direction for `colorBy="linear"` | `45`       |
| `animate`              | `"fade" \| "scale" \| "fade-scale" \| "stretch" \| "bounce" \| "sway" \| "flip"` | per component |
| `feel`                 | `"calm" \| "crisp" \| "lively" \| "urgent"` — personality macro | —      |
| `envelope`             | preset \| `{ attack, hold?, release }` \| frames  | `"pulse"`    |
| `easing`               | `"linear" \| "smooth" \| "snap" \| "drift" \| "spring"` \| any CSS timing fn | auto (per envelope) |
| `period`               | `number` — ms per sweep                           | `900` × feel |
| `waves`                | `number` — simultaneous wavefronts                | `1`          |
| `dim`                  | `number` 0..1 — resting opacity                   | per mode     |
| `restScale`            | `number` 0..1 — resting scale (scale/stretch)     | per mode     |
| `amplitude`            | `number` — px for `bounce`; degrees for `sway` / `flip` | per mode |
| `seed`                 | `number` — deterministic `sparkle` shuffle        | `7`          |
| `state`                | `"loading" \| "success" \| "error"`               | `"loading"`  |
| `progress`             | `number` 0..1 — determinate fill in pattern order | —            |
| `successColor`         | `string`                                          | `"#34D399"`  |
| `errorColor`           | `string`                                          | `"#F87171"`  |
| `intensity`            | `number` 0..1 — live activity level               | `1`          |
| `appear`               | `boolean` — 200ms fade/scale entrance on mount    | `true`       |
| `appearDelay`          | `number` ms — stay invisible before entering (anti-flash) | `0`  |
| `label`                | `string` — aria-label                             | `"Loading"`  |
| `respectReducedMotion` | `boolean` — freeze under `prefers-reduced-motion` | `true`       |

**Palettes:** `aurora` · `ember` · `lagoon` · `ultraviolet` · `sherbet` ·
`glacier` · `moss` · `nocturne` · `mono`. Exported as `palettes`; the OKLab
sampler is exported as `sampleGradient(stops, t)`.

**Bar-native motion:** `sway` rotates each bar around its pivot (`origin` —
a bottom pivot reads as wind through grass, center as a metronome), and
`flip` turns elements around their own long axis in 3D, louver-style; on a
grid it becomes a tile-flip wave. Both are plain transforms, compositor-only.

**Envelopes:** `pulse` (sharp rise, long tail) · `breathe` (continuous
sine-like swell) · `flash` (strobe) · `heartbeat` (double thump). Custom
shapes are `{ attack, hold, release }` as fractions of one period — the
remainder is rest — or an explicit `[{ at, level }, …]` frame list.

## `<PulseGrid />`

A rows × cols matrix of cells swept by the pattern.

| Prop       | Type     | Default    |
| ---------- | -------- | ---------- |
| `pattern`  | `"ripple" \| "sweep-up" \| "sweep-down" \| "sweep-left" \| "sweep-right" \| "diagonal" \| "chevron" \| "snake" \| "spiral" \| "sparkle" \| "pulse"` | `"ripple"` |
| `rows`     | `number` | `4`        |
| `cols`     | `number` | `4`        |
| `cellSize` | `number` px | `6`     |
| `gap`      | `number` px | `3`     |
| `radius`   | `number` px | `1.5`   |

## `<PulseBars />`

Bars in a line (equalizer, drafting strip) or stacked into a **striped
loop** — parallel pills traced along a closed superellipse outline, each
reaching `stroke` px inward; the middle rows split in two around the
opening. `aspect`, `squareness` and `stroke` shape the silhouette — it can
match anything from a round badge to a typeface's O. Pair with
`colorBy="linear"` for one gradient flowing through every pill.

| Prop          | Type     | Default      |
| ------------- | -------- | ------------ |
| `pattern`     | `"wave" \| "wave-reverse" \| "center" \| "edges" \| "alternate" \| "sparkle" \| "pulse"` | `"wave"` |
| `arrangement` | `"line" \| "loop"` | `"line"` |
| `count`       | `number` — bars (stripes in a loop) | `5` line, `8` loop |
| `orientation` | `"vertical" \| "horizontal"` — stripe direction | `"vertical"` line, `"horizontal"` loop |
| `thickness`   | `number` px | `4` line, `3` loop |
| `length`      | `number` px (line only) | `18` |
| `gap`         | `number` px (line only) | `3`  |
| `radius`      | `number` px | `2`       |
| `origin`      | `"center" \| "start" \| "end"` — fixed end for `stretch` (line only) | `"center"` |
| `ringSize`    | `number` px — loop height (loop only) | `28` |
| `aspect`      | `number` — loop width ÷ height (loop only) | `1` |
| `squareness`  | `number` — superellipse exponent (loop only) | `2` |
| `stroke`      | `number` px — pill reach inward from the outline (loop only) | `ringSize * 0.3` |

## `<PulseDots />`

A row of dots — the typing indicator and its relatives.

| Prop     | Type     | Default    |
| -------- | -------- | ---------- |
| `pattern`| same as bars | `"wave"` |
| `count`  | `number` | `3`        |
| `size`   | `number` px — dot diameter | `7` |
| `gap`    | `number` px | `4`     |
| `radius` | `number` px | `size / 2` |

## `<PulseRing />`

Elements spaced (uniformly by arc length) around a superellipse ring — dots
when `length === thickness`, ticks when elongated. `align="tangent"` traces
the outline like a dashed O; `align="radial"` points every tick at the
center, clock-style.

| Prop         | Type     | Default     |
| ------------ | -------- | ----------- |
| `pattern`    | same as bars | `"wave"` |
| `count`      | `number` | `8`         |
| `ringSize`   | `number` px — ring height | `28` |
| `aspect`     | `number` — width ÷ height | `1` |
| `squareness` | `number` — `2` ellipse, `4` squircle, `1` diamond | `2` |
| `align`      | `"tangent" \| "radial"` | `"tangent"` |
| `length`     | `number` px | `6`      |
| `thickness`  | `number` px | `6`      |
| `radius`     | `number` px | `min(length, thickness) / 2` |

## How patterns work

A pattern is a distance field `d` over the elements — cells at equal
distance fire together. Each element's delay is `-(d / (max + 1)) × period`,
and `waves` multiplies how many wavefronts travel the field at once. A few
of the fields:

- **ripple** — Chebyshev distance from the grid center (expanding rings)
- **spiral** — visit order of an outward rectangular spiral
- **chevron** — `(rows − 1 − row) + |col − center|`, a fold climbing the grid
- **snake** — boustrophedon path, row by row
- **sparkle** — a seeded Fisher–Yates shuffle (deterministic across SSR)

The ring/letter geometry is exported too: `superellipsePoints(count, w, h,
squareness)` returns arc-length-uniform points with tangent/radial angles,
and `stripedO(...)` returns the scanline segments of a striped letter O.

## Motion quality defaults

Some of the craft is built in — nothing to configure:

- **Directional easing.** Without an explicit `easing`, every envelope
  carries a curated rise/fall pair: rising segments decelerate into the
  peak, falling segments decay fast-then-slow like a light dying. One
  `easing` value still overrides both directions.
- **Follow-through.** In `fade-scale` the scale trails the opacity by a
  beat (~6% of the period) — elements light up, then swell, instead of
  moving in lockstep.
- **Feel.** `feel` sets envelope, easing and tempo together:
  `calm` (slow sinusoidal breathing), `crisp` (the standard pulse),
  `lively` (wind-up dip, overshooting springy peak), `urgent` (strobe +
  snap at speed). Explicit props always win.
- **Entrances.** Loaders fade/scale in over 200ms on mount (`appear`);
  set `appearDelay={300}` to skip showing a loader at all for fast loads.
- **Reduced motion.** Under `prefers-reduced-motion` the loop becomes a
  very slow opacity breath — vestibular-safe, but still visibly alive —
  instead of a frozen frame.

Envelope frame levels may leave `[0, 1]`: slightly negative for
anticipation wind-ups, above 1 for overshoot.

## States & progress

Loaders need an exit. Set `state="success"` and a grid **morphs into a ✓**
(the stencil is rasterized for any rows × cols); `state="error"` settles
into a ✗ and shakes once. Bars, dots and rings settle whole into the state
color, staggered along the pattern's order. Both one-shot animations respect
`prefers-reduced-motion`.

```tsx
<PulseGrid rows={5} cols={5} state={done ? "success" : "loading"} />
```

Pass `progress` (0..1) for a determinate loader: elements light up in
pattern order — a spiral grid fills by coiling, a ring fills like an arc,
bars fill like a meter.

```tsx
<PulseBars count={12} progress={uploaded / total} />
```

## Streaming intensity

Made for AI products: feed `intensity` from a token stream and the loader
breathes with it — bright and full while chunks arrive, dimming toward idle
in the gaps. `useStreamIntensity` handles the decay:

```tsx
const { intensity, ping } = useStreamIntensity({ decay: 900, floor: 0.35 })
// call ping() on every streamed chunk
<PulseDots intensity={intensity} />
```

## Accessibility

Each loader renders `role="status"` with a configurable `label`. Under
`prefers-reduced-motion: reduce` the animation freezes to a readable
mid-state (opt out with `respectReducedMotion={false}`).

## Recipes

A curated set of configurations ships as `recipes` — from the familiar
(`typing`, `equalizer`, `orbit`, `beacon`, `metronome`) through the
signature (`monogram`, `glyph`, `heartbeat`, `sonar`, `galaxy`,
`comet`, `sunburst`, `kelp`, `louver`) to the strange (`static`, `drizzle`,
`stadium`, `manuscript`, `ticker`, `ascent`, `breather`). Each is
`{ element, title, blurb, props }`; spread the props onto the matching
component. The demo site's gallery is rendered straight from this export.

## Development

```sh
npm install          # installs the library + demo site (npm workspaces)
npm run site         # demo/playground at http://localhost:3030
npm run build        # tsup → dist (ESM + CJS + d.ts)
npm run typecheck
```

## License

MIT
