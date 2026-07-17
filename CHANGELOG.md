# Changelog

## 0.1.0

First release.

- Four components — `PulseGrid`, `PulseBars` (line / striped loop), `PulseDots`, `PulseRing` — driven by phase fields, ADSR-style motion envelopes and OKLab gradient palettes.
- Compositor-only animation: one shared keyframe, negative per-element delays; styles injected at runtime, zero dependencies.
- Motion quality defaults: per-envelope rise/fall easing pairs, follow-through lag in `fade-scale`, `feel` personality macro, mount entrances with anti-flash `appearDelay`, reduced-motion fallback that keeps breathing.
- Lifecycle: `state` (success ✓ / error ✗ stencils on grids), determinate `progress`, streaming `intensity` with `useStreamIntensity`.
- Exports for design tools: `cssSnippet` (framework-free HTML/CSS) and `svgSnippet` (static vector frame).
- 21 curated recipes, trilingual demo playground (EN / 日本語 / 简体中文).
