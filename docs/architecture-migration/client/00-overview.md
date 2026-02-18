# Frontend Architecture Migration - Overview

## Goal

Overhaul the frontend architecture across `src/app`, `src/features`, `src/components`, `src/common`, and `src/trpc` while preserving:

- tRPC as transport and cache utility foundation
- strict UX/behavior parity
- Next.js 16 App Router boundary discipline

This migration is architecture-first, not product redesign.

## Scope

### In Scope

- Route boundary cleanup and extraction of route-local components from `src/app`
- Feature module standardization (`api.ts`, `hooks.ts`, `schemas.ts`, feature components)
- Query adapter and invalidation standardization
- Error normalization standardization for UI-safe branching
- Big-bang release planning and execution

### Out of Scope

- Backend router/service/repository redesign
- Product/UX redesign
- Replacing tRPC with another transport

## Hard Constraints

- Rollout strategy is big-bang cutover (single release).
- Strict behavior parity is required.
- Validation gate is `pnpm lint` + `pnpm lint:arch` + manual smoke matrix.
- `pnpm build` is only run when explicitly requested.
- No new non-route component modules under `src/app/**`.

## Success Criteria

The migration is complete when all criteria below are true:

1. `src/app/**` new code is route-boundary-only (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`, metadata files).
2. Pages and presentation components do not directly call `trpc.*.useQuery/useMutation`.
3. Feature modules define and use standardized boundaries:
- query adapters in feature hooks
- `I<Feature>Api` + `<Feature>Api` + `create<Feature>Api` pattern
4. Error handling is normalized to a client-safe, transport-agnostic shape.
5. Manual parity matrix passes with no unresolved P0/P1 regressions.
6. `pnpm lint` passes on the cutover branch.
7. `pnpm lint:arch` passes on the cutover branch.

## Migration Glossary

- Route boundary: Next.js page/layout layer responsible for params/searchParams parsing and composition.
- Feature API: typed feature boundary (`I<Feature>Api`) that owns endpoint-scoped mapping/normalization concerns.
- Query adapter: feature hook layer that owns query/mutation/cache behavior.
- Presentation component: render-only component with no transport calls.
- Compatibility mode: temporary migration-only state; disallowed at cutover in this strict pass.

## Big-Bang Cutover Definition

Big-bang cutover means all architecture changes merge to one integration branch and ship in one production release event, with rollback prepared as one release rollback.

## Execution Sequence (Authoritative)

1. Baseline freeze and branch setup.
2. Introduce feature API contracts and factories without behavior change.
3. Move all direct tRPC calls out of pages/presentation components into feature hooks/adapters.
4. Extract route-local components out of `src/app` into feature/shared paths.
5. Split oversized hooks/files by SRP and naming contract.
6. Standardize error normalization and mutation invalidation helpers.
7. Complete parity validation matrix.
8. Execute big-bang cutover.
9. Perform post-cutover cleanup and conformance audit.

## Reconciled Status Ledger (Pass 3)

Last reconciled: `2026-02-18`.

| Sequence Step | Status | Evidence |
| --- | --- | --- |
| 1. Baseline freeze and branch setup | `DONE` | Integration branch and baseline docs exist (`alignment-baseline-final.md`) |
| 2. Introduce feature API contracts and factories | `DONE` | `13` `api.ts` + `13` `api.runtime.ts` with strict method facades; pass-through proxy pattern removed |
| 3. Move direct tRPC calls out of pages/presentation | `DONE` (for direct transport-hook usage) | `.trpc.` usage in `src/features` is `0`; route transport calls removed from targeted pages |
| 4. Extract route-local components from `src/app` | `DONE` | non-route scan is clean |
| 5. Split oversized hooks/files by SRP | `DONE` | owner/admin/discovery hook implementations are now domainized and `hooks/_legacy.ts` files are removed |
| 6. Standardize error normalization and invalidation helpers | `DONE` | invalidation ownership checks pass and transport-specific `error.data` parsing is removed from target files |
| 7. Complete parity validation matrix | `DONE` | parity evidence rerun captured in `parity-evidence-2026-02-18.md` (`08:36:36 UTC`) |
| 8. Execute big-bang cutover | `DONE` | runbook checklist and rerun evidence complete on integration branch |
| 9. Post-cutover cleanup and conformance audit | `DONE` | final conformance report updated to final sign-off status |

## Current Gate Snapshot

### Passing numeric checks

- `rg -n 'from "@/trpc/client"' src/features/*/api.ts` => `0`
- `rg -n 'useUtils|useQueries' src/features/*/api.ts` => `0`
- `rg -n '\\.[A-Za-z0-9_]+\\.use(Query|Mutation)\\(' . -g 'src/features/*/hooks.ts' -g 'src/features/*/hooks/**/*.ts'` => `0`
- `rg -n 'createServerCaller' src/app -g '**/page.tsx' -g '**/layout.tsx'` => `0`
- `rg -n 'from "@/components/' src/app -g '**/page.tsx' -g '**/layout.tsx'` => `0`
- `rg -n '\\.trpc\\.' src/features` => `0`
- `rg -n -F '["invalidate"](' src/features src/components src/app` => `0`
- `rg -n -F '.invalidate(' src/features/*/components src/features/*/pages` => `0`
- `find src/features -type f -path '*/server/*'` => empty

### Release gate status

- `pnpm lint:arch` => `PASS`
- `pnpm lint` => `PASS` (`0` warnings)

## Residual Follow-Ups (Non-Blocking)

- [x] Optional hardening: remove warning-only lint debt (`noExplicitAny` + `noUnusedImports`) in migrated hooks/modules without behavior changes (`2026-02-18 09:30:46 UTC` rerun).

## Task Tracker (Authoritative)

### P0 Release-Blocking

- [x] Strengthen `scripts/architecture/check-client-conformance.sh` with strict checks (hook glob fix + pass-through API + namespace query/mutation checks).
- [x] Keep `src/features/*/api.ts` free of direct `@/trpc/client` imports (`0` matches).
- [x] Keep `src/features/*/api.ts` free of `useUtils/useQueries` exposure (`0` matches).
- [x] Keep route pages/layouts free of `createServerCaller` usage (`0` matches).
- [x] Enforce all-pages-strict direct-import boundary (`from "@/components/"` in app pages/layouts is `0`).
- [x] Remove route-page transport calls from:
- [x] `src/app/(public)/org/[slug]/page.tsx`
- [x] `src/app/(public)/places/[placeId]/courts/[courtId]/page.tsx`
- [x] `src/app/(owner)/owner/courts/[id]/availability/page.tsx`
- [x] Rewrite all `13` feature APIs to endpoint-scoped method facades (remove `createTrpcFeatureApi`/`extends TrpcFeatureApi` pass-through pattern).
- [x] Rewrite feature hooks to call `I<Feature>Api` methods (remove namespace `.query/.mutation/.queries` usage).
- [x] Remove compatibility aliases/deprecated hook exports at cutover (`auth`, `home`, `contact`, `owner` aliases removed).
- [x] Restore green release gates:
- [x] `pnpm lint` passes (`0` exit; warnings tracked separately)
- [x] `pnpm lint:arch` passes under strict checks

### P1 Must-Finish Before Cutover Sign-off

- [x] Enforce all-pages-strict route composition for:
- [x] `src/app/(public)/about/page.tsx`
- [x] `src/app/(public)/blog/page.tsx`
- [x] `src/app/(public)/cookies/page.tsx`
- [x] `src/app/(public)/contact-us/page.tsx`
- [x] `src/app/(admin)/admin/courts/page.tsx`
- [x] Complete hook decomposition:
- [x] `src/features/owner/hooks/{places,courts,court-hours,court-pricing,reservations,bookings-import,place-verification,organization,index}.ts`
- [x] `src/features/admin/hooks/{courts,claims,place-verification,organization,notifications,index}.ts`
- [x] `src/features/discovery/hooks/{search,filters,place-detail,availability,index}.ts`
- [x] Move implementation bodies from `src/features/{owner,admin,discovery}/hooks/_legacy.ts` into domain files and remove `_legacy.ts`.
- [x] Complete high-risk modularization:
- [x] Move owner availability studio implementation to `src/features/owner/components/availability-studio/availability-studio-coordinator.tsx` with thin page wrapper.
- [x] Move owner place court availability implementation to `src/features/owner/components/place-court-availability/place-court-availability-coordinator.tsx` with thin page wrapper.
- [x] Move owner bookings import review implementation to `src/features/owner/components/bookings-import/bookings-import-review-coordinator.tsx` with compatibility wrapper.
- [x] Move admin courts batch implementation to `src/features/admin/components/courts-batch/courts-batch-coordinator.tsx` with compatibility wrapper.
- [x] Move admin places list implementation to `src/features/admin/components/places-list/places-list-coordinator.tsx` with compatibility wrapper.
- [x] Split coordinator internals into stateless subcomponents (toolbar/grid/dialog/sidebar sections) and remove remaining monolith files.
- [x] Remove transport-specific error parsing outside adapters in:
- [x] `src/common/toast/errors.ts`
- [x] `src/features/discovery/helpers.ts`
- [x] `src/features/discovery/place-detail/components/court-detail-client.tsx`

### P1 Documentation Alignment

- [x] Update `05-feature-wave-plan.md` to strict no-exception invalidation ownership wording and strict FeatureApi endpoint scope.
- [x] Update `07-validation-and-parity-matrix.md` to include `pnpm lint:arch` and strict numeric conformance gate.
- [x] Update `08-big-bang-cutover-runbook.md` pre-cutover checklist to require strict conformance pass.
- [x] Update `09-post-cutover-cleanup.md` checklist to include pass-through FeatureApi and namespace hook-call removals.

## Deliverables in This Folder

- `00-overview.md`
- `01-current-state-audit.md`
- `02-target-architecture-contract.md`
- `03-trpc-retained-adapter-pattern.md`
- `04-route-layer-extraction-plan.md`
- `05-feature-wave-plan.md`
- `06-high-risk-playbooks.md`
- `07-validation-and-parity-matrix.md`
- `08-big-bang-cutover-runbook.md`
- `09-post-cutover-cleanup.md`
