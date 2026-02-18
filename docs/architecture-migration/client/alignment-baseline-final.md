# Full Alignment Baseline Snapshot

- Captured at: `2026-02-18 10:41:55 PST`
- Branch: `codex/frontend-architecture-overhaul`
- Repo: `/Users/raphaelm/Documents/Coding/boilerplates/next16bp`

## Scope

- `src/app`
- `src/features`
- `src/components`
- `src/common`
- `src/trpc`

## Metrics (Before This Implementation Pass)

| Metric | Value |
| --- | ---: |
| Feature modules | 13 |
| Direct `.trpc.` usage in `src/features` | 210 |
| Direct `.trpc.` usage in `src/app` | 0 |
| Direct `sonner` imports in `src` | 62 |
| `.invalidate(` calls in `src/features/*/(components|pages)` | 47 |
| Non-route modules in `src/app` | 0 |
| Non-canonical exported hooks | 125 |

## Feature Modules Included

`admin`, `auth`, `chat`, `contact`, `discovery`, `health`, `home`, `notifications`, `open-play`, `organization`, `owner`, `reservation`, `support-chat`

## Target Thresholds

1. `src/features` direct `.trpc.` usage: `0`
2. Direct `sonner` imports: adapter/UI-only exceptions
3. `.invalidate(` in feature components/pages: `0`
4. Non-canonical exported hooks: `0`
5. Non-route `src/app` files: `0`
