# Contributing

Thanks for looking into Pulsor. This is a small, focused library — issues
and PRs are welcome, and the playground share URL is the best bug report
there is.

## Setup

```sh
npm install     # installs the library and the demo site (npm workspaces)
npm run site    # playground with the library aliased to src/ — hot reload
```

## Scripts

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run site`      | demo/playground at http://localhost:3030      |
| `npm test`          | vitest — core unit tests + snippet snapshots  |
| `npm run lint`      | Biome check (lint + format)                   |
| `npm run format`    | Biome with auto-fix                           |
| `npm run typecheck` | library `tsc --noEmit`                        |
| `npm run build`     | tsup → dist (ESM + CJS + d.ts)                |

CI runs lint, typecheck (library + site), tests and both builds on every
push and PR.

## Conventions

- Formatting and lint rules live in `biome.json` — run `npm run format`
  before committing and don't hand-fight the formatter.
- `site/src/defaults.ts` mirrors the library's component defaults so the
  playground can generate minimal code — keep them in sync when changing
  library defaults, and update the props tables in `site/src/PropsRef.tsx`
  and the three readmes.
- User-facing site copy is trilingual (`site/src/i18n.ts`): English,
  简体中文, 日本語. New strings need all three.
- React 18 is declared as the minimum peer; development happens on 19.
  Reports from React 18 apps are appreciated.

## Releasing (maintainers)

```sh
npm version patch   # or minor / major
```

`preversion` runs lint + typecheck + tests; `postversion` pushes the
commit and tag. The `v*` tag triggers `.github/workflows/release.yml`,
which publishes with provenance — it needs either npm **trusted
publishing** configured for this repo (npmjs.com → package → Settings →
Trusted publishers; recommended, no token) or an `NPM_TOKEN` repo secret.
Then update `CHANGELOG.md` and create a GitHub release for the tag.
