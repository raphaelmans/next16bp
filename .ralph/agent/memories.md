# Memories

## Patterns

### mem-1773530565-48cd
> Objective closeout loops should check .ralph/events-*.jsonl before emitting terminal signals; if objective.done already exists for the current closure commit, preserve that record and only finish runtime-task cleanup instead of generating another duplicate completion event.
<!-- tags: ralph, events, objective, closeout | created: 2026-03-14 -->

### mem-1773529713-3297
> Coach bookings now reuse the shared reservation notification/chat seams: coach lifecycle events flow through coach_booking.* delivery handlers, and reservation chat thread metadata merges venue and coach reservations so players and coaches open the same reservation thread from their detail pages.
<!-- tags: coach, chat, notifications, reservation | created: 2026-03-14 -->

### mem-1773528270-272c
> Coach booking add-ons now reuse the shared player add-on selector in the booking page, but the durable source of truth after creation is reservation.pricingBreakdown: coach reservation creation snapshots base fee, add-on total, and per-addon lines so player reservation detail can render stable add-on totals even if coach pricing config changes later.
<!-- tags: coach, reservation, addons, pricing | created: 2026-03-14 -->

### mem-1773527461-9a94
> Public coach review mutations revalidate the concrete /coaches/[id-or-slug] detail path plus the shared discovery:coaches:list cache tag, which is enough to refresh both detail aggregates and discovery card metadata without a separate coach discovery helper.
<!-- tags: coach, reviews, cache, nextjs | created: 2026-03-14 -->

### mem-1773527461-8840
> Coach reviews now mirror the place-review module shape, but write eligibility is stricter: an author must already have an active review or at least one past CONFIRMED coach reservation tied to their player profile.
<!-- tags: coach, reviews, reservation, testing | created: 2026-03-14 -->

### mem-1773526581-23af
> Coach reservation detail payment-proof support reuses paymentProofRepository plus signed payment-proof URLs in CoachReservationService after coach ownership is verified, and exposes proof separately from the base reservation record so the existing reservation contract stays stable.
<!-- tags: coach, reservation, payment-proof, testing | created: 2026-03-14 -->

### mem-1773526031-f3e7
> Coach portal Step 6 keeps the new routes thin: /coach/profile reuses the wizard ProfileStep and SportsStep editors, while /coach/settings composes the shared WebPushSettingsCard and PortalPreferenceCard so portal completeness does not require new coach-specific backend settings APIs.
<!-- tags: coach, portal, routing | created: 2026-03-14 -->

### mem-1773525444-baaa
> Coach verification now uses explicit coach.verification_status; setup completion and public verified filtering both require VERIFIED rather than raw certification presence, while PENDING keeps the wizard on Step 7.
<!-- tags: coach, verification, discovery | created: 2026-03-14 -->

### mem-1773524258-9ec4
> Coach onboarding sport-selection tests must use real UUID-shaped sport ids because the coach feature schema validates sportIds with S.ids.sportId; placeholder ids like sport-1 keep the save path invalid even when a checkbox is selected.
<!-- tags: coach, testing, validation | created: 2026-03-14 -->

### mem-1773522406-0c74
> ReservationService test harnesses must inject coachPaymentMethodRepository between organizationPaymentMethodRepository and organizationRepository; otherwise payment-info and constructor-based tests drift when coach payment support is added.
<!-- tags: reservation, coach-payment, testing | created: 2026-03-14 -->

### mem-1773516434-5aa8
> Pattern: shared player reservation detail now uses targetType with nullable coach/court/place data; single coach reservations return null linked-detail instead of forcing venue group shape.
<!-- tags: reservation, coach, testing | created: 2026-03-14 -->

### mem-1772734527-3685
> shadcn CLI reset (npx shadcn@latest add --overwrite) preserves :root tokens in globals.css but re-injects a .dark sidebar block. Always check and remove after reset.
<!-- tags: shadcn, globals-css, ui-ux-cutover | created: 2026-03-05 -->

## Decisions

## Fixes

### mem-1773530500-ffcd
> failure: cmd=rg -n -- '- \\[\\s\\S]' '.agents/planning/2026-03-15-coach-feature-review/implementation/plan.md', exit=1, error=the fallback regex was malformed and matched no checklist lines, next=use an anchored checklist regex like rg -n -- '^- \[ \]|^- \[x\]' for markdown task lists
<!-- tags: shell, error-handling, rg, planning | created: 2026-03-14 -->

### mem-1773530491-8ecc
> failure: cmd=rg -n "- \[ x\]\" '.agents/planning/2026-03-15-coach-feature-review/implementation/plan.md', exit=2, error=rg parsed the leading dash pattern as a flag, next=use rg -n -- '<pattern>' when searching checklist markers that begin with '-'
<!-- tags: shell, error-handling, rg, planning | created: 2026-03-14 -->

### mem-1773529795-8656
> failure: cmd=pnpm exec vitest run src/__tests__/lib/modules/reservation/services/reservation.service.test.ts, exit=1, error=the suite imports the real Drizzle container and aborts when DATABASE_URL is unset in the shell, next=export env from .env.local before running this reservation service suite or keep validation focused on isolated tests that mock infra
<!-- tags: testing, error-handling, reservation, database | created: 2026-03-14 -->

### mem-1773529713-7417
> failure: cmd=sed -n '1,140p' src/app/(auth)/layout.tsx, exit=2, error=zsh treated the unquoted route-group path as a glob and the read failed, next=quote Next.js route-group paths before reading auth/layout files
<!-- tags: nextjs, error-handling, shell | created: 2026-03-14 -->

### mem-1773529713-6b4b
> failure: cmd=rg -n "coaches|coach|get-started|reservation" tests/e2e tests/helpers tests/fixtures, exit=2, error=the repo's Playwright helpers live under tests/e2e/helpers and tests/helpers plus tests/fixtures do not exist, next=search tests/e2e and tests/e2e/helpers instead of assuming shared helper/fixture directories
<!-- tags: testing, error-handling, playwright, coach | created: 2026-03-14 -->

### mem-1773527471-a20c
> failure: cmd=pnpm exec biome check .agents/planning/2026-03-15-coach-feature-review/implementation/plan.md .ralph/agent/scratchpad.md, exit=1, error=Biome ignored those markdown paths in the current repo config and processed 0 files, next=record the artifact updates without claiming Biome coverage for ignored markdown files and keep validation on the touched TypeScript files instead
<!-- tags: biome, error-handling, docs, coach | created: 2026-03-14 -->

### mem-1773527388-7bf8
> failure: cmd=pnpm exec tsx -e "import { publicCaller } from './src/trpc/server'; void (async () => { const result = await publicCaller.coach.listSummary({ limit: 1, offset: 0 }); console.log(result.items[0]?.coach.slug ?? result.items[0]?.coach.id ?? ''); })().catch((error) => { console.error(error); process.exit(1); });", exit=1, error=tsx could not resolve the Next.js server-only shim when importing src/trpc/server outside the app runtime, next=use HTTP smoke against the running dev server instead of probing publicCaller through tsx for public-route validation
<!-- tags: tooling, error-handling, tsx, nextjs, coach | created: 2026-03-14 -->

### mem-1773527378-fb98
> failure: cmd=pnpm exec tsx -e "import { publicCaller } from './src/trpc/server'; const main = async () => { const result = await publicCaller.coach.listSummary({ limit: 1, offset: 0 }); console.log(result.items[0]?.coach.slug ?? result.items[0]?.coach.id ?? ''); }; await main();", exit=1, error=tsx eval ran in cjs mode and rejected top-level await, next=wrap the script body in an async IIFE when probing local app data with pnpm exec tsx -e
<!-- tags: tooling, error-handling, tsx, coach | created: 2026-03-14 -->

### mem-1773526742-cf2a
> failure: cmd=rg --files src/__tests__ | rg 'place-review|coach-detail-page|coach-discovery.*page|place-detail.*review', exit=1, error=no matching review test paths were found under src/__tests__, next=list the surrounding __tests__ directories and add new review coverage in the mirrored structure rather than assuming prior files exist
<!-- tags: testing, error-handling, coach, place-review | created: 2026-03-14 -->

### mem-1773526732-03bb
> failure: cmd=sed -n '1,260p' 'src/__tests__/features/coach-discovery/pages/coach-detail-page.test.tsx', exit=2, error=sed: can't read src/__tests__/features/coach-discovery/pages/coach-detail-page.test.tsx: No such file or directory, next=search the mirrored __tests__ tree for the actual coach-discovery page test path before extending coach detail coverage
<!-- tags: testing, error-handling, coach, coach-discovery | created: 2026-03-14 -->

### mem-1773526732-0fa1
> failure: cmd=sed -n '1,280p' 'src/__tests__/lib/modules/place-review/place-review.router.test.ts', exit=2, error=sed: can't read src/__tests__/lib/modules/place-review/place-review.router.test.ts: No such file or directory, next=search the mirrored __tests__ tree for the actual place-review router/service test paths before reading review coverage
<!-- tags: testing, error-handling, place-review | created: 2026-03-14 -->

### mem-1773526581-2494
> failure: cmd=pnpm exec biome check src/lib/modules/reservation/services/reservation-coach.service.ts src/lib/modules/reservation/factories/reservation.factory.ts src/features/coach/pages/coach-reservation-detail-page.tsx src/__tests__/lib/modules/reservation/services/reservation-coach.service.test.ts src/__tests__/features/coach/pages/coach-reservation-detail-page.test.tsx .agents/planning/2026-03-15-coach-feature-review/implementation/plan.md .ralph/agent/scratchpad.md, exit=1, error=Biome format fixed line wrapping but left import-order diagnostics in new Step 7 files, next=run pnpm exec biome check --write on the specific files because biome format --write does not organize imports
<!-- tags: biome, error-handling, coach, reservation | created: 2026-03-14 -->

### mem-1773525637-7e35
> failure: cmd=sed -n '1,240p' src/app/(coach)/coach/layout.tsx, exit=2, error=zsh treated the unquoted route-group path as a glob and the read failed, next=quote Next.js route-group paths before reading coach portal files
<!-- tags: nextjs, error-handling, shell, coach | created: 2026-03-14 -->

### mem-1773525538-f241
> failure: cmd=npx @next/codemod agents-md --output AGENTS.md, exit=1, error=codemod refused to run on a dirty worktree and requested stash/commit, next=rerun with --force on this recovery branch before reading local Next.js docs
<!-- tags: nextjs, error-handling, docs | created: 2026-03-14 -->

### mem-1773525368-f1d7
> failure: cmd=source .env.local && psql "" -c "DO 925508 ...", exit=1, error=zsh expanded 925508 inside the SQL string before psql execution, next=escape dollar quotes as \$\$ when running DO blocks through the shell
<!-- tags: database, psql, error-handling | created: 2026-03-14 -->

### mem-1773525311-dc20
> failure: cmd=pnpm db:migrate, exit=1, error=Drizzle attempted to recreate existing enum claim_request_status in the local dev database before reaching the new coach verification columns, next=use pnpm db:push as the local/dev fallback when smoke-testing schema changes against a drifted dev database
<!-- tags: database, drizzle, error-handling | created: 2026-03-14 -->

### mem-1773523602-57c8
> failure: cmd=/home/raphaelm/.config/nvm/versions/node/v24.11.1/lib/node_modules/@ralph-orchestrator/ralph-cli/node_modules/.bin_real/ralph tools interact progress "Implementing Step 4: wiring real coach profile and sport-selection editors into the get-started wizard, plus focused coach feature tests and checklist update.", exit=1, error=No bot token. Run ralph bot onboard or set RALPH_TELEGRAM_BOT_TOKEN, next=skip robot progress updates unless bot configuration is available in the loop environment
<!-- tags: ralph, robot, error-handling | created: 2026-03-14 -->

### mem-1773523428-b335
> failure: cmd=sed -n '1,260p' src/features/coach/components/get-started-hooks.ts, exit=2, error=sed: can't read src/features/coach/components/get-started-hooks.ts: No such file or directory, next=coach get-started hooks live under src/features/coach/components/get-started/get-started-hooks.ts
<!-- tags: error-handling, coach, shell | created: 2026-03-14 -->

### mem-1773523417-85ca
> failure: cmd=sed -n '1,260p' src/features/coach/get-started-hooks.ts, exit=2, error=sed: can't read src/features/coach/get-started-hooks.ts: No such file or directory, next=search the feature tree for the actual hook filename before reading coach get-started helpers
<!-- tags: error-handling, coach, shell | created: 2026-03-14 -->

### mem-1773523416-f22a
> failure: cmd=sed -n '1,260p' src/lib/modules/coach/dtos/update-coach.dto.ts, exit=2, error=sed: can't read src/lib/modules/coach/dtos/update-coach.dto.ts: No such file or directory, next=use rg --files within the module before reading DTO filenames instead of assuming split dto files
<!-- tags: error-handling, coach, shell | created: 2026-03-14 -->

### mem-1773523364-8673
> failure: cmd=rg --files src/features/coach src/lib/modules/coach src/lib/modules/coach-setup src/app/(coach)/coach guides/client/core guides/client/frameworks/reactjs guides/client/frameworks/reactjs/metaframeworks/nextjs guides/server/core .next-docs | rg 'coach-setup-wizard|profile-step|sports-step|coach-profile|coach\.router|coach\.service|coach-setup|coach/pages|forms-react-hook-form|conventions\.md|overview\.md|folder-structure\.md|trpc\.md|query-keys\.md|routing-ssr-params\.md|page\.md$', exit=1, error=zsh:1: no matches found: src/app/(coach)/coach, next=quote shell paths containing parentheses before running rg on Next.js route groups
<!-- tags: shell, error-handling, nextjs | created: 2026-03-14 -->

### mem-1773523251-2a13
> failure: cmd=pnpm exec vitest run src/__tests__/features/coach/components/coach-payment-methods-manager.test.tsx, exit=1, error=repo lacks @testing-library/user-event and Radix dialog tests hit ResizeObserver/portal issues, next=use fireEvent plus mock Dialog/AlertDialog wrappers for focused form interaction tests
<!-- tags: testing, coach-payment, error-handling, vitest | created: 2026-03-14 -->

### mem-1773522347-9e31
> failure: cmd=pnpm exec biome check src/__tests__/lib/modules/coach-payment/services/coach-payment.service.test.ts src/__tests__/lib/modules/reservation/services/reservation.service.test.ts .agents/planning/2026-03-15-coach-feature-review/implementation/plan.md, exit=1, error=Biome reported formatting-only differences in the new Step 2 test files, next=run Biome format on the touched test files and rerun the focused check
<!-- tags: lint, error-handling, biome, coach-payment, reservation | created: 2026-03-14 -->

### mem-1773522120-6710
> failure: cmd=rg -n 'getPaymentInfo|AWAITING_PAYMENT|PAYMENT_MARKED_BY_USER' src/__tests__/lib/modules/reservation/services/reservation.service.test.ts, exit=1, error=no matching coverage existed in reservation service tests, next=add dedicated payment-info tests instead of assuming existing coverage
<!-- tags: testing, error-handling, reservation, coach-payment | created: 2026-03-14 -->

### mem-1773522106-6cb6
> failure: cmd=sed -n '1,260p' src/__tests__/lib/modules/organization-payment/organization-payment.router.test.ts && sed -n '1,320p' src/__tests__/lib/modules/organization-payment/services/organization-payment.service.test.ts, exit=2, error=expected organization-payment test files were not present at those paths, next=search existing lib module tests first and mirror reservation service/router test patterns instead of assuming sibling module coverage exists
<!-- tags: testing, error-handling, coach-payment | created: 2026-03-14 -->

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
