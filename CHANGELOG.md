# Changelog

## 0.2.2

Docs and guardrails for coding agents — no API changes.

- `@example` blocks on `PulseGrid` / `PulseBars` / `PulseDots`, `recipes`
  and `useStreamIntensity`, carried into `dist/index.d.ts` for editor
  hovers; missing doc comments on `rows` / `cols` and `GradientStop` filled.
- Dev-only console warning when loop-only props are passed with
  `arrangement="line"` (or line-only props on a loop) — the one mismatch
  the types can't catch. Stripped from production builds.
- `AGENTS.md` cheatsheet ships in the package; machine-readable docs at
  [/llms.txt](https://react-pulsor.vercel.app/llms.txt) and
  [/llms-full.txt](https://react-pulsor.vercel.app/llms-full.txt); READMEs
  gain generated recipe tables in all three languages.

## 0.2.1

Removes an accidental self-dependency (`react-pulsor` depending on
`react-pulsor@^0.1.0`) that shipped in 0.2.0's package metadata.

## 0.2.0

**Breaking:** `PulseRing` merges into `PulseDots` as `arrangement="loop"` —
every 1-D component now reads the same way: `line` or `loop`. Migrate
`<PulseRing …/>` to `<PulseDots arrangement="loop" …/>` (props unchanged);
`cssSnippet` / `svgSnippet` take `"dots"` instead of `"ring"`.

## 0.1.0

First release.

- Four components — `PulseGrid`, `PulseBars` (line / striped loop), `PulseDots`, `PulseRing` — driven by phase fields, ADSR-style motion envelopes and OKLab gradient palettes.
- Compositor-only animation: one shared keyframe, negative per-element delays; styles injected at runtime, zero dependencies.
- Motion quality defaults: per-envelope rise/fall easing pairs, follow-through lag in `fade-scale`, `feel` personality macro, mount entrances with anti-flash `appearDelay`, reduced-motion fallback that keeps breathing.
- Lifecycle: `state` (success ✓ / error ✗ stencils on grids), determinate `progress`, streaming `intensity` with `useStreamIntensity`.
- Exports for design tools: `cssSnippet` (framework-free HTML/CSS) and `svgSnippet` (static vector frame).
- 21 curated recipes, trilingual demo playground (EN / 日本語 / 简体中文).
