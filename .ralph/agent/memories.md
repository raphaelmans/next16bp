# Memories

## Patterns

### mem-1773516434-5aa8
> Pattern: shared player reservation detail now uses targetType with nullable coach/court/place data; single coach reservations return null linked-detail instead of forcing venue group shape.
<!-- tags: reservation, coach, testing | created: 2026-03-14 -->

### mem-1772734527-3685
> shadcn CLI reset (npx shadcn@latest add --overwrite) preserves :root tokens in globals.css but re-injects a .dark sidebar block. Always check and remove after reset.
<!-- tags: shadcn, globals-css, ui-ux-cutover | created: 2026-03-05 -->

## Decisions

## Fixes

### mem-1773516748-12a6
> failure: cmd=sed -n '1,220p' tsconfig.test.json, exit=2, error=sed: can't read tsconfig.test.json: No such file or directory, next=inspect the root tsconfig and create a temporary focused tsconfig instead of assuming a test-specific config exists
<!-- tags: typecheck, error-handling, tooling | created: 2026-03-14 -->

### mem-1773516748-1071
> failure: cmd=pnpm exec tsc --noEmit, exit=2, error=repo-wide TypeScript check fails across unrelated coach/reservation files plus reservation nullability surfaces, next=use a focused tsconfig for the Step 1 reservation-detail surface and keep a separate backlog item for broader type debt
<!-- tags: typecheck, error-handling, reservation | created: 2026-03-14 -->

### mem-1773516407-7e2d
> failure: cmd=pnpm lint, exit=1, error=Biome reported pre-existing issues in unrelated files (.ralph/loops.json, drizzle/meta snapshots, curated-facebook-page-discovery.service.ts, file-upload img warning), next=use targeted Biome checks to validate touched files and avoid claiming repo-wide lint is green until unrelated issues are fixed
<!-- tags: lint, error-handling, biome | created: 2026-03-14 -->

### mem-1773515776-7415
> failure: cmd=sed -n '1,220p' .ralph/agent/decisions.md, exit=2, error=sed: can't read .ralph/agent/decisions.md: No such file or directory, next=create the decisions journal file before recording medium-confidence decisions
<!-- tags: ralph, error-handling | created: 2026-03-14 -->

### mem-1773515728-c204
> failure: cmd=sed -n '1,220p' src/app/api/mobile/v1/player/reservations/[reservationId]/route.ts, exit=1, error=zsh:1: no matches found: src/app/api/mobile/v1/player/reservations/[reservationId]/route.ts, next=quote shell paths containing brackets when reading Next.js dynamic route files
<!-- tags: shell, error-handling, nextjs | created: 2026-03-14 -->

### mem-1773515641-f793
> failure: cmd=ls src/__tests__/features/reservation/pages, exit=2, error=ls: cannot access 'src/__tests__/features/reservation/pages': No such file or directory, next=create mirrored feature page tests under src/__tests__/features/reservation/pages if needed
<!-- tags: testing, error-handling, reservation | created: 2026-03-14 -->

### mem-1773515592-1e04
> failure: cmd=sed -n '1,220p' .ralph/agent/scratchpad.md, exit=2, error=sed: can't read .ralph/agent/scratchpad.md: No such file or directory, next=create the scratchpad file before continuing the loop
<!-- tags: ralph, error-handling | created: 2026-03-14 -->

### mem-1773512414-9708
> failure: cmd=pnpm lint, exit=1, error=Biome reported pre-existing lint/format issues in unrelated files (.ralph/loops.json, drizzle/meta snapshots, curated-facebook-page-discovery.service.ts, no-img-element warning in file-upload), next=Treat repo lint as currently red outside this doc-only task and avoid claiming green lint until those unrelated files are fixed.
<!-- tags: lint, error-handling, biome | created: 2026-03-14 -->

### mem-1773511479-387d
> failure: cmd=/home/raphaelm/.config/nvm/versions/node/v24.11.1/lib/node_modules/@ralph-orchestrator/ralph-cli/node_modules/.bin_real/ralph tools interact progress "Created prioritized coach backlog draft from review research; verifying and preparing atomic commit.", exit=1, error=No bot token. Run ralph bot onboard or set RALPH_TELEGRAM_BOT_TOKEN, next=Skip progress updates unless bot is configured in this repo/loop environment.
<!-- tags: ralph, robot, error-handling | created: 2026-03-14 -->

## Context
