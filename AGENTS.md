# react-pulsor — guide for coding agents

This file is for agents *using* react-pulsor in an app. For working on the
library itself, see `CONTRIBUTING.md` in the repo.

> Composable React loading indicators — grids, bars and dots driven by phase fields, motion envelopes and OKLab gradients. Zero dependencies, compositor-only animation.

```sh
npm install react-pulsor
```

```tsx
import { PulseGrid, PulseBars, PulseDots, recipes, useStreamIntensity } from "react-pulsor"
```

## Guidance for coding agents

Mental model — every loader is four orthogonal dials:

1. **Geometry** — which component and its layout props (grid `rows`/`cols`, bars/dots `count` and `arrangement`).
2. **Pattern** — the phase field: who fires when (`pattern`, `waves`, `seed`).
3. **Envelope** — what one beat looks like (`animate`, `envelope`, `easing`, `period`, or the `feel` macro that sets all three).
4. **Color** — `palette` (preset name, any CSS color, or gradient stops) plus `colorBy` / `gradientAngle`.

Decision guide:

- "a spinner" → `<PulseDots arrangement="loop" />`, or `recipes.orbit` / `recipes.beacon`.
- "typing indicator" → `recipes.typing`.
- "determinate progress" → any component with `progress={0..1}`.
- "loader that reacts to an AI token stream" → `useStreamIntensity()` feeding the `intensity` prop.
- "match my brand" → `palette` takes any CSS color or `[{ color, position }]` stops; `colorBy="linear"` lays one gradient across the whole figure.
- success/failure endings → `state="success"` / `state="error"`.

Common mistakes:

- `arrangement` defaults to `"line"`. Loop-only props (`ringSize`, `aspect`, `squareness`, `stroke`, `align`, and `length`/`thickness` on PulseDots) are silently ignored on a line — set `arrangement="loop"` first.
- Line-only props (`size`, `gap`, and `length`/`origin` on PulseBars) are ignored on a loop.
- `dim`, `restScale`, `progress` and `intensity` are all 0..1.
- No CSS import and no provider: components inject their one keyframe themselves.
- Spread a recipe onto the component matching its `element`: `recipes.typing.element` is `"dots"`, so `<PulseDots {...recipes.typing.props} />`.

## Recipes

| Recipe | Component | Description |
| --- | --- | --- |
| `sonar` | `<PulseGrid />` | Square rings expanding from the center, slow and glassy. |
| `typing` | `<PulseDots />` | The classic three-dot bounce, tuned so the arc reads as a hop, not a wobble. |
| `comet` | `<PulseDots />` | One bright head and a long gradient tail — phase coloring does the trailing. |
| `equalizer` | `<PulseBars />` | Upright bars breathing through a travelling wave — audio-meter energy. |
| `galaxy` | `<PulseGrid />` | A spiral phase field — the wave coils out from the center. |
| `static` | `<PulseGrid />` | Seeded shuffle + strobe envelope: tuned-between-stations TV noise. |
| `glyph` | `<PulseDots />` | An O drawn in dashes. Tune aspect and squareness until it matches your wordmark. |
| `monogram` | `<PulseBars />` | A badge built from stripes — scanlines around a loop. Tune stroke and squareness to taste. |
| `heartbeat` | `<PulseDots />` | One dot, a double-beat envelope. Lub-dub. |
| `ticker` | `<PulseGrid />` | A wide, low strip of cells — the wave runs left to right like a marquee. |
| `stadium` | `<PulseDots />` | A squircle track — the wave does laps around rounded corners. |
| `kelp` | `<PulseBars />` | Bars pivoting at the root as the wave passes — wind through grass. |
| `sunburst` | `<PulseDots />` | Radial ticks flaring around a ring — a clock face running hot. |
| `drizzle` | `<PulseGrid />` | Random cells stretching and flickering — rain streaks on a window. |
| `metronome` | `<PulseDots />` | Two dots trading places on a hard snap. Minimal, mechanical. |
| `breather` | `<PulseGrid />` | The whole block inhales together — a calm idle state, not a busy one. |
| `manuscript` | `<PulseBars />` | Flat lines growing from the left margin, like text being drafted. |
| `ascent` | `<PulseGrid />` | A wide chevron fold climbing the strip — directional, insistent. |
| `louver` | `<PulseBars />` | Flat slats flipping around their own axis — venetian blinds in a draft. |
| `orbit` | `<PulseDots />` | A ring of dots the wave keeps lapping — spinner DNA, gradient body. |
| `beacon` | `<PulseDots />` | Twelve small lights flashing fast around a tight ring — familiar shape, live color. |

## Where the full details live

- Complete prop tables and examples: `README.md` in this package.
- Exact types, defaults and per-prop docs: `dist/index.d.ts` (fully JSDoc'd).
- Every recipe expanded to ready-to-paste JSX: https://react-pulsor.vercel.app/llms-full.txt
- Live playground with shareable config links: https://react-pulsor.vercel.app
