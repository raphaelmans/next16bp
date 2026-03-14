# Step 2: Coach Payment Methods Backend + Payment-Info Resolution

## Understanding

The `coach_payment_method` table exists in schema with the same shape as `organization_payment_method`.
Setup-status already queries it to check payment readiness. But there's no CRUD module.

The reservation service's `getPaymentInfo` currently returns empty `{ methods: [], defaultMethodId: null }` for coach reservations (line 2032-2033).

## Plan

1. Create `src/lib/modules/coach-payment/` module following org-payment pattern:
   - `errors/coach-payment.errors.ts` - NotFound, Conflict, Inactive errors
   - `dtos/coach-payment-method.dto.ts` - List/Create/Update/Delete/SetDefault schemas
   - `dtos/index.ts` - barrel export
   - `repositories/coach-payment-method.repository.ts` - CRUD with tx support
   - `services/coach-payment.service.ts` - business logic with authorization
   - `factories/coach-payment.factory.ts` - singleton factory
   - `coach-payment.router.ts` - tRPC router with 5 endpoints

2. Register `coachPaymentRouter` in tRPC root router.

3. Extend `ReservationService.getPaymentInfo()` to resolve coach payment methods when `reservation.coachId` is set.
   - Add `ICoachPaymentMethodRepository` as a new constructor dependency
   - Update factory to inject it

4. Run lint to validate.

## Key Decisions
- Follow exact same patterns as organization-payment module
- Coach authorization uses `requireOwnedCoach` helper from coach module
- `ReservationPaymentMethod` type is already compatible (same fields)
- The `type` field uses the same `OrganizationPaymentMethodRecord["type"]` reference - this is fine since it's the same DB enum

## Completed

All three tasks done in a single iteration:
1. Created full `coach-payment` module with 7 files (errors, DTOs, repository, service, factory, router)
2. Extended `ReservationService.getPaymentInfo()` to resolve coach payment methods for coach reservations
3. Registered `coachPayment` router in tRPC root
4. Lint passes on all touched files
5. Committed as `16d2324a6`

## 2026-03-14T21:00:56Z

Repo state check for the coach recovery loop:
- Step 1 is already marked complete in the implementation plan and shipped on `a4146ab57`.
- Step 2 backend code is also already on `HEAD` via `16d2324a6`, including `src/lib/modules/coach-payment/**`, root router registration, and coach-aware payment-info lookup in `ReservationService`.
- The recovery checklist still leaves Step 2 unchecked, and focused Step 2 tests required by the plan are missing from `src/__tests__/lib/modules/coach-payment/**` and reservation payment-info coverage.

Atomic task for this iteration:
- treat Step 2 as incomplete until its focused tests, validation, and checklist state are aligned with the implementation already present on `HEAD`
- do not start Step 3 until Step 2 is verifiably demoable and recorded as complete

## 2026-03-14T21:00:56Z Completion Notes

Step 2 is now aligned with the recovery plan without changing the already-landed backend implementation:
- added `src/__tests__/lib/modules/coach-payment/services/coach-payment.service.test.ts` to cover coach payment method list/create/update/delete/default behavior plus duplicate/inactive guards
- extended `src/__tests__/lib/modules/reservation/services/reservation.service.test.ts` to cover coach-vs-venue payment-info resolution and inactive coach payment filtering
- updated the implementation plan checklist to mark Step 2 complete and captured the verification snapshot

Focused validation:
- `pnpm exec vitest run src/__tests__/lib/modules/coach-payment/services/coach-payment.service.test.ts src/__tests__/lib/modules/reservation/services/reservation.service.test.ts`
- `pnpm exec biome check src/__tests__/lib/modules/coach-payment/services/coach-payment.service.test.ts src/__tests__/lib/modules/reservation/services/reservation.service.test.ts .agents/planning/2026-03-15-coach-feature-review/implementation/plan.md`

Next loop should start at Step 3 unless new review evidence shows a hidden Step 2 regression.

## 2026-03-14T21:20:00Z Step 3 Notes

Step 3 is now implemented as a coach-frontend slice on top of the landed Step 2 backend:
- added coach feature transport/query support for `coachPayment.listMethods/createMethod/updateMethod/deleteMethod/setDefault`
- created `src/features/coach/components/coach-payment-methods-manager.tsx` by mirroring the owner payment manager pattern without refactoring shared code
- replaced the get-started payment placeholder with a live manager/prerequisite/completed-state branch
- added the dedicated `/coach/payment-methods` page and route export
- updated coach portal navigation so payment methods is now a real active destination

Focused validation completed:
- `pnpm exec vitest run src/__tests__/features/coach/api.test.ts src/__tests__/features/coach/hooks.test.ts src/__tests__/features/coach/components/coach-payment-methods-manager.test.tsx src/__tests__/features/coach/components/get-started/wizard/coach-step-live-editors.test.tsx src/__tests__/features/coach/pages/coach-pages.test.tsx`
- `pnpm exec biome check src/features/coach/api.ts src/features/coach/hooks.ts src/features/coach/schemas.ts src/features/coach/components/coach-payment-methods-manager.tsx src/features/coach/components/get-started/wizard/coach-setup-wizard.tsx src/features/coach/components/get-started/wizard/steps/payment-step.tsx src/features/coach/components/coach-portal-shell.tsx src/features/coach/pages/coach-payment-methods-page.tsx 'src/app/(coach)/coach/payment-methods/page.tsx' src/__tests__/features/coach/api.test.ts src/__tests__/features/coach/hooks.test.ts src/__tests__/features/coach/components/coach-payment-methods-manager.test.tsx src/__tests__/features/coach/components/get-started/wizard/coach-step-live-editors.test.tsx src/__tests__/features/coach/pages/coach-pages.test.tsx`
- manual dev smoke: `pnpm dev` + `curl -I -s http://localhost:3000/coach/payment-methods` returned `307` to `/login?redirect=%2Fcoach%2Fpayment-methods`; same guard held for `/coach/get-started`

Useful test-harness note:
- the manager tests need mocked `Dialog`/`AlertDialog` wrappers in this repo's Vitest environment; otherwise Radix portal/observer behavior obscures the form interactions and produces `ResizeObserver is not defined`

## 2026-03-15T06:22:00Z Step 4 Notes

Current Step 4 target is feature-side, not backend-side:
- `coach.updateProfile` already persists the profile basics plus `sportIds`, `specialties`, `skillLevels`, `ageGroups`, `sessionTypes`, and `sessionDurations`
- `coach.getMyProfile` already returns the detailed coach record or `null` before a coach exists
- the get-started wizard still renders placeholders for `ProfileStep` and `SportsStep`

Chosen implementation boundary:
- keep Step 4 inside the existing get-started wizard and do not jump ahead to `/coach/profile` route work that belongs to Step 6
- add coach feature query/mutation support for `coach.getMyProfile`, `coach.updateProfile`, and `sport.list`
- replace the placeholder profile step with a live form for the required completion fields: `name`, `tagline`, and `bio`
- replace the placeholder sports step with a live sport-selection editor using the real sports catalog and saved `sportIds`
- invalidate setup status and current profile after successful saves so the wizard completion state updates immediately

Focused validation plan:
- extend coach feature API and hook tests for the new profile/sport calls and invalidation
- replace/extend the coach wizard live-step tests to cover profile save, sports save, required validation, and prerequisite/empty states
- run focused Vitest plus targeted Biome on touched coach feature files and the Step 4 plan artifact

## 2026-03-15T05:38:00Z Step 4 Completion Notes

Step 4 is now complete on top of the Step 3 onboarding shell:
- replaced `ProfileStep` placeholder copy with a live required-fields form backed by `coach.getMyProfile` + `coach.updateProfile`
- replaced `SportsStep` placeholder copy with a live sport-selection editor backed by `sport.list` + `coach.updateProfile`, including prerequisite and empty-state handling
- extended the coach feature query-adapter layer so profile reads and writes invalidate setup status immediately, allowing the wizard to advance on saved data instead of static placeholders
- updated the recovery implementation plan to mark Step 4 complete and captured the focused verification snapshot

Validation that passed on the final code:
- `pnpm exec vitest run src/__tests__/features/coach/api.test.ts src/__tests__/features/coach/hooks.test.ts src/__tests__/features/coach/components/get-started/wizard/coach-step-live-editors.test.tsx`
- `pnpm exec biome check src/features/coach/api.ts src/features/coach/hooks.ts src/features/coach/schemas.ts src/features/coach/components/get-started/wizard/coach-setup-wizard.tsx src/features/coach/components/get-started/wizard/steps/profile-step.tsx src/features/coach/components/get-started/wizard/steps/sports-step.tsx src/__tests__/features/coach/api.test.ts src/__tests__/features/coach/hooks.test.ts src/__tests__/features/coach/components/get-started/wizard/coach-step-live-editors.test.tsx`
- manual dev smoke: `pnpm dev`, `curl -I -s http://localhost:3000/coach/get-started`, and `curl -I -s 'http://localhost:3000/coach/get-started?step=sports'` both returned `307` redirects to login

Commit created for this step:
- `cba9b965c` `coach onboarding profile and sports editors`

## 2026-03-15T05:25:00Z Step 5 Plan

Step 5 needs to make verification truthful without jumping ahead to the Step 6 portal-route work:
- add explicit coach verification status storage so setup can distinguish blocked, pending, and approved
- keep the minimum verification contract small: all prior setup steps complete plus at least one saved certification with issuing body
- expose a protected submit action that moves an eligible coach to `PENDING`
- treat only `VERIFIED` as setup-complete so the wizard stays on Verify while review is pending
- replace the placeholder verify step with a live certification + submission UI backed by `coach.getMyProfile`, `coach.updateProfile`, and the new submit mutation
- align public coach `verified` metadata/filtering with the new verification status instead of treating any certification as verified

Focused validation target for this step:
- coach setup use-case and router tests for unverified/pending/verified states plus submit mutation
- coach feature api/hooks tests for the new verification mutation
- verify-step UI tests covering blocked, pending, and approved states
- targeted Biome on touched setup/coach feature files

## 2026-03-14T21:56:45Z Step 5 Completion Notes

Step 5 is now implemented as a real coach verification gate:
- added `coach.verificationStatus`, `verificationSubmittedAt`, and `verifiedAt` to schema with generated Drizzle migration `0052_cynical_monster_badoon.sql`
- setup status now carries `verificationStatus`, treats only `VERIFIED` as complete, and keeps `nextStep` on `verify` while review is pending
- added `submitCoachVerification` use case plus `coach.submitVerification` tRPC mutation that blocks submission until prior setup steps are complete and at least one certification with issuing body is saved
- replaced the verify placeholder with a live certification editor/submission surface showing blocked, pending, rejected, and approved states
- aligned public coach `verified` filtering/meta with approved verification status instead of raw certification presence

Focused validation that passed:
- `pnpm exec vitest run src/__tests__/lib/modules/coach-setup/use-cases/get-coach-setup-status.use-case.test.ts src/__tests__/lib/modules/coach-setup/use-cases/submit-coach-verification.use-case.test.ts src/__tests__/lib/modules/coach/coach.router.test.ts src/__tests__/features/coach/api.test.ts src/__tests__/features/coach/hooks.test.ts src/__tests__/features/coach/components/get-started/wizard/coach-step-live-editors.test.tsx`
- `pnpm exec biome check .agents/planning/2026-03-15-coach-feature-review/implementation/plan.md src/lib/shared/infra/db/schema/enums.ts src/lib/shared/infra/db/schema/coach.ts src/lib/modules/coach-setup/shared/types.ts src/lib/modules/coach-setup/shared/domain.ts src/lib/modules/coach-setup/repositories/coach-setup.repository.ts src/lib/modules/coach-setup/use-cases/get-coach-setup-status.use-case.ts src/lib/modules/coach-setup/use-cases/submit-coach-verification.use-case.ts src/lib/modules/coach-setup/factories/coach-setup.factory.ts src/lib/modules/coach/coach.router.ts src/lib/modules/coach/repositories/coach.repository.ts src/features/coach/api.ts src/features/coach/hooks.ts src/features/coach/schemas.ts src/features/coach/components/get-started/wizard/wizard-types.ts src/features/coach/components/get-started/wizard/coach-setup-wizard.tsx src/features/coach/components/get-started/wizard/steps/verify-step.tsx src/__tests__/lib/modules/coach-setup/use-cases/get-coach-setup-status.use-case.test.ts src/__tests__/lib/modules/coach-setup/use-cases/submit-coach-verification.use-case.test.ts src/__tests__/lib/modules/coach/coach.router.test.ts src/__tests__/features/coach/api.test.ts src/__tests__/features/coach/hooks.test.ts src/__tests__/features/coach/components/get-started/wizard/coach-step-live-editors.test.tsx src/__tests__/lib/modules/coach/services/coach.service.test.ts src/__tests__/lib/modules/coach/services/coach-discovery.service.test.ts src/__tests__/lib/modules/coach-payment/services/coach-payment.service.test.ts src/__tests__/lib/modules/coach-schedule-pricing/coach-schedule-pricing.services.test.ts src/__tests__/lib/modules/coach-availability/coach-availability.service.test.ts drizzle/0052_cynical_monster_badoon.sql`
- manual smoke:
  - `pnpm dev`
  - `curl -I -s 'http://localhost:3000/coach/get-started?step=verify'` -> `307` redirect to login
  - `curl --max-time 5 -I -s 'http://localhost:3000/coaches?verified=true'` -> `200 OK`

Local schema note:
- `pnpm db:migrate` failed on the drifted local dev database before reaching the new Step 5 migration because earlier enums already existed
- for this smoke only, I applied the new coach verification enum/columns directly with `psql` after `pnpm db:push` stalled during schema pull; the repo migration artifacts are still generated and committed for the real migration path

## 2026-03-15T01:30:00Z Step 6 Notes

Step 6 is strictly portal-surface work:
- current gaps are concrete: `/coach/profile` and `/coach/settings` route files are missing, the shell still says remaining portal surfaces land later, and there is no route-level smoke around the coach portal tree
- `/coach/payment-methods` already exists from Step 3, so this step is mostly about making the rest of the navigation truthful and test-backed

Chosen implementation boundary:
- reuse the live Step 4 profile and sports editors on a dedicated `/coach/profile` page instead of creating another edit flow
- keep `/coach/settings` small and real by composing existing shared settings controls that already work in this repo: browser push notifications and default portal preference
- update `CoachPortalShell` so every nav item is an active destination, including settings, with no upcoming/deferred copy left behind
- add route-page smoke tests for the coach portal destinations and a shell navigation test that proves the links are real

Focused validation target:
- feature page tests for the new profile/settings surfaces and coach portal shell nav expectations
- app route smoke tests covering the coach portal page exports and base redirect
- targeted Biome on touched coach feature/app test files plus the implementation plan artifact

## 2026-03-15T01:55:00Z Step 6 Completion Notes

Step 6 is now complete as a truthful portal-routing increment:
- added `/coach/profile` and `/coach/settings` route files plus new feature pages
- `/coach/profile` reuses the live Step 4 profile and sports editors so coaches can manage the same saved profile data outside the wizard
- `/coach/settings` stays small and real by exposing existing browser notification controls and default portal preference, plus an account-profile handoff for shared profile fields
- updated `CoachPortalShell` to add settings, make profile fully active, and remove the stale upcoming/deferred copy
- added feature page coverage, coach portal shell navigation coverage, and app route smoke tests for the coach portal destinations

Validation that passed on the final code:
- `pnpm exec vitest run src/__tests__/features/coach/pages/coach-pages.test.tsx src/__tests__/features/coach/components/coach-portal-shell.test.tsx src/__tests__/app/coach/portal-route-pages.test.tsx`
- `pnpm exec biome check src/features/coach/components/coach-portal-shell.tsx src/features/coach/pages/coach-profile-page.tsx src/features/coach/pages/coach-settings-page.tsx 'src/app/(coach)/coach/profile/page.tsx' 'src/app/(coach)/coach/settings/page.tsx' src/__tests__/features/coach/pages/coach-pages.test.tsx src/__tests__/features/coach/components/coach-portal-shell.test.tsx src/__tests__/app/coach/portal-route-pages.test.tsx .ralph/agent/decisions.md .ralph/agent/scratchpad.md`
- manual dev smoke:
  - `pnpm dev`
  - `curl -I -s http://localhost:3000/coach/profile` -> `307` redirect to `/login?redirect=%2Fcoach%2Fprofile`
  - `curl -I -s http://localhost:3000/coach/settings` -> `307` redirect to `/login?redirect=%2Fcoach%2Fsettings`
  - adversarial check: `curl -I -s http://localhost:3000/coach/does-not-exist` also stayed behind the protected coach layout and redirected to login before route resolution

Next loop should start at Step 7 unless a review finds a portal regression in the new routes or shell coverage.

## 2026-03-15T05:18:00Z Step 7 Plan

Step 7 is a coach-reservation-detail vertical slice, not a broader payment-module rewrite:
- keep the existing coach reservation detail route and reservation record shape intact
- extend the coach detail response with a separate `paymentProof` field so the page can render proof metadata without disturbing shared reservation DTOs
- reuse the existing payment-proof repository plus signed-URL behavior from owner flows so private proof assets stay access-controlled for coach viewers
- treat permission safety in the service layer by verifying coach ownership before loading proof data
- replace the coach detail page's deferred proof note with live payment-state messaging for awaiting-payment, proof-submitted, and confirmed states

Focused validation target for this step:
- new coach reservation service tests covering proof-present, proof-missing, and wrong-coach access cases
- new coach reservation detail page tests covering proof-present and proof-missing rendering
- targeted Biome on touched reservation/coach files plus the implementation plan and scratchpad

## 2026-03-15T06:16:00Z Step 7 Completion Notes

Step 7 is now implemented as a real coach-side payment-proof detail increment:
- extended `CoachReservationService.getReservationDetail()` with a permission-checked `paymentProof` field and signed private proof URLs using the existing payment-proof repository plus object storage service
- updated the coach reservation detail page to replace the old deferred-proof note with live payment-state copy and proof rendering for awaiting-payment, proof-submitted, and confirmed states
- added focused regression coverage for coach proof-present, proof-missing, and wrong-coach-access cases
- updated the recovery implementation plan to mark Step 7 complete and capture the verification snapshot

Validation that passed on the final code:
- `pnpm exec vitest run src/__tests__/lib/modules/reservation/services/reservation-coach.service.test.ts src/__tests__/features/coach/pages/coach-reservation-detail-page.test.tsx`
- `pnpm exec biome check src/lib/modules/reservation/services/reservation-coach.service.ts src/lib/modules/reservation/factories/reservation.factory.ts src/features/coach/pages/coach-reservation-detail-page.tsx src/__tests__/lib/modules/reservation/services/reservation-coach.service.test.ts src/__tests__/features/coach/pages/coach-reservation-detail-page.test.tsx .agents/planning/2026-03-15-coach-feature-review/implementation/plan.md .ralph/agent/scratchpad.md`
- manual dev smoke:
  - `pnpm dev`
  - `curl -I -s http://localhost:3000/coach/reservations/reservation-1` -> `307` redirect to `/login?redirect=%2Fcoach%2Freservations%2Freservation-1`
  - adversarial check: `curl -I -s http://localhost:3000/coach/reservations/not-a-uuid` -> `307` redirect to `/login?redirect=%2Fcoach%2Freservations%2Fnot-a-uuid`

Next loop should start at Step 8 unless review finds a regression in coach reservation detail proof rendering or access control.

## 2026-03-15T06:05:00Z Step 8 Plan

Step 8 should stay a narrow trust/discovery slice rather than turning into a wider portal/admin project:
- mirror the existing `place-review` module shape for coach reviews so public list/aggregate and protected write/remove flows sit on familiar tRPC/service/repository seams
- make eligibility explicit instead of schema-only by requiring either an existing active review or at least one past `CONFIRMED` coach reservation for the current player profile before upsert
- wire reviews directly into the public coach detail page with a client review section that can render server-provided initial aggregate/list data, then hydrate viewer review and eligibility state on the client
- keep cache invalidation minimal and truthful: revalidate the public coach detail path plus the shared coach-discovery list tag after review mutations

Focused validation target for this step:
- coach-review service tests for eligible create/update, ineligible attempts, remove, and list delegation
- coach-review router tests for list/upsert/remove/error mapping
- coach-detail reviews component tests for populated and empty/ineligible states
- targeted Biome on touched review, reservation, coach-discovery, and decision-journal files

## 2026-03-15T06:31:00Z Step 8 Completion Notes

Step 8 is now implemented as a real coach-review trust surface:
- added a new `coach-review` backend module with DTOs, errors, repository, service, router, and factory wiring
- defined protected review eligibility as an authenticated player with either an existing active review or at least one past `CONFIRMED` coach reservation tied to their player profile
- extended the reservation repository with a focused eligibility lookup instead of adding review-specific reservation logic elsewhere
- added a public coach detail reviews section with aggregate/empty states, recent review rendering, sign-in prompts, and eligible player write/edit/remove flows
- wired coach review mutations to revalidate the public coach detail path plus the shared coach discovery list tag
- updated the recovery plan checklist to mark Step 8 complete and recorded the focused verification snapshot

Validation that passed on the final code:
- `pnpm exec vitest run src/__tests__/lib/modules/coach-review/services/coach-review.service.test.ts src/__tests__/lib/modules/coach-review/coach-review.router.test.ts src/__tests__/features/coach-discovery/components/coach-detail/coach-detail-reviews.test.tsx`
- `pnpm exec biome check src/lib/modules/coach-review/coach-review.router.ts src/lib/modules/coach-review/dtos/coach-review.dto.ts src/lib/modules/coach-review/errors/coach-review.errors.ts src/lib/modules/coach-review/factories/coach-review.factory.ts src/lib/modules/coach-review/repositories/coach-review.repository.ts src/lib/modules/coach-review/services/coach-review.service.ts src/lib/modules/reservation/repositories/reservation.repository.ts src/lib/shared/infra/cache/revalidate-public-coach-detail.ts src/lib/shared/infra/trpc/root.ts src/features/coach-discovery/server/coach-detail-section-data.ts src/features/coach-discovery/hooks/use-coach-detail-reviews.ts src/features/coach-discovery/components/coach-detail/coach-detail-reviews.tsx src/features/coach-discovery/pages/coach-detail-page.tsx src/__tests__/lib/modules/coach-review/services/coach-review.service.test.ts src/__tests__/lib/modules/coach-review/coach-review.router.test.ts src/__tests__/features/coach-discovery/components/coach-detail/coach-detail-reviews.test.tsx .ralph/agent/decisions.md`
- manual dev smoke:
  - `pnpm dev`
  - `curl -I -s http://localhost:3000/coaches` -> `200 OK`
  - adversarial `curl -s http://localhost:3000/coaches/not-a-real-coach | rg -o 'Coach Not Found|404|Page not found|not found'` returned not-found markers while the dev server logged the underlying query as `NOT_FOUND`

Runtime-note:
- probing `publicCaller` through `pnpm exec tsx -e` is not reliable in this repo because `src/trpc/server` imports the Next.js `server-only` shim outside the app runtime; public-route smoke is the safer validation path here

## 2026-03-14T22:35:55Z Step 9 Plan

Step 9 needs a truthful player-side pricing slice, not a coach-pricing refactor:
- the booking page already fetches coach availability and add-ons, and the mutation already accepts `selectedAddons`; the missing work is selection state, pricing feedback, and passing the payload through
- coach reservation creation currently prices selected add-ons but discards the breakdown, so reservation detail has no durable way to show which extras were chosen after booking
- the smallest stable persistence fix is a nullable reservation `pricingBreakdown` snapshot that stores base price, add-on total, and per-addon lines at booking time

Chosen implementation boundary:
- reuse the existing court add-on player selector helpers/components for coach booking, with a small wording override instead of inventing a parallel selector
- keep selection state local to the coach booking page, sanitize it against current coach add-ons, auto-include `AUTO` add-ons, and feed it into the coach availability query so totals update live
- pass selected add-ons into `reservation.createForCoach` and store the computed pricing breakdown snapshot on the reservation record
- render coach reservation detail/payment totals from that stored breakdown so chosen add-ons remain visible even if coach pricing config changes later

Focused validation target:
- booking-page tests for optional add-on selection, total updates, and mutation payload forwarding
- coach reservation service tests for invalid add-on rejection plus stored pricing-breakdown persistence
- player reservation detail page tests covering coach add-on line rendering from the stored breakdown
- targeted Biome on touched reservation/coach-discovery/shared schema files

## 2026-03-14T22:44:00Z Step 9 Completion Notes

Step 9 is now complete as a pricing-truthfulness slice for coach bookings:
- coach booking now renders live session add-on selection using the existing player add-on selector/helpers, including selection sanitizing and automatic inclusion of `AUTO` coach add-ons
- selected add-ons now feed the coach availability query and `reservation.createForCoach`, so slot totals update before confirmation and the final mutation carries the chosen extras
- added nullable `reservation.pricingBreakdown` storage plus generated migration `0053_busy_spectrum.sql`, and coach reservation creation now snapshots base fee/add-on totals/per-addon lines at booking time
- the shared player reservation detail summary now renders coach add-on lines and totals from that stored pricing snapshot

Validation that passed on the final code:
- `pnpm exec vitest run src/__tests__/features/coach-discovery/pages/coach-booking-page.test.tsx src/__tests__/features/reservation/pages/reservation-detail-page.test.tsx src/__tests__/lib/modules/reservation/services/reservation-coach.service.test.ts`
- `pnpm exec biome check src/features/court-addons/components/player-addon-selector.tsx src/features/coach-discovery/pages/coach-booking-page.tsx src/features/reservation/pages/reservation-detail-page.tsx src/lib/shared/infra/db/schema/reservation.ts src/lib/modules/reservation/services/reservation-coach.service.ts src/__tests__/features/coach-discovery/pages/coach-booking-page.test.tsx src/__tests__/features/reservation/pages/reservation-detail-page.test.tsx src/__tests__/lib/modules/reservation/services/reservation-coach.service.test.ts`
- `pnpm db:generate` -> `drizzle/0053_busy_spectrum.sql`
- manual dev smoke:
  - `pnpm dev`
  - `curl -I -s http://localhost:3000/coaches/coach-carla/book` -> `307` redirect to `/login?redirect=%2Fcoaches%2Fcoach-carla%2Fbook`
  - adversarial `curl -I -s 'http://localhost:3000/coaches/not-a-real-coach/book?addonIds=addon-1%3A2'` -> `307` redirect to login with the original query preserved inside `redirect`
  - `curl -I -s http://localhost:3000/reservations/reservation-1` -> `307` redirect to `/login?redirect=%2Freservations%2Freservation-1`

Next loop should start at Step 10 unless review finds a regression in coach booking pricing snapshots or the player reservation summary rendering.

## 2026-03-15T05:22:00Z Step 10 Plan

Step 10 should finish the collaboration surface by extending existing reservation communication seams instead of introducing new parallel systems:
- use the shared notification-delivery module for coach-booking lifecycle events so inbox/push/email behavior stays consistent with venue reservations
- keep the notification scope to the core coach lifecycle already exercised in the product today: creation, acceptance -> awaiting payment, payment marked, confirmation, rejection, and coach cancellation
- adapt the shared reservation chat service to understand either venue-owner or coach participants, then expose coach chat from both reservation detail pages and the protected coach portal shell
- focus regression coverage on service-level notification/chat wiring plus user-facing detail-page chat affordances, then add one coach e2e happy path if the existing seeded auth/test harness supports it cleanly

Focused validation target for this step:
- notification-delivery service tests for coach booking enqueue flows
- reservation chat service tests for coach reservation sessions/meta access and non-participant rejection
- player and coach reservation detail page tests covering coach chat entry points
- one coach e2e happy path covering booking creation and coach-side handling if the seeded environment supports it without inventing new test infrastructure

## 2026-03-15T07:08:00Z Step 10 Completion Notes

Step 10 is now implemented as the coach collaboration finish:
- added `coach_booking.*` notification contracts, builders, recipient lookup, and delivery-service enqueue flows for coach creation, awaiting-payment, payment-marked, confirmed, rejected, and cancelled lifecycle events
- extended the shared reservation chat service/factory to support coach reservations with the same reservation thread model used by venue bookings, including direct coach-owner authorization and thread metadata for player inbox/event-driven open flows
- enabled coach chat entry points on the player reservation detail page and added a dedicated coach-side reservation chat sheet on the coach reservation detail page instead of introducing a separate inbox system late in recovery
- added focused regression coverage for notification delivery, coach reservation chat metadata access, coach/player reservation detail chat affordances, and a coach booking Playwright happy-path spec scaffold
- updated the recovery implementation plan to mark Step 10 complete with the validation snapshot

Validation that passed on the final code:
- `pnpm exec vitest run src/__tests__/lib/modules/chat/services/reservation-chat.service.test.ts src/__tests__/modules/notification-delivery/notification-delivery.service.test.ts src/__tests__/lib/modules/reservation/services/reservation-coach.service.test.ts src/__tests__/features/reservation/pages/reservation-detail-page.test.tsx src/__tests__/features/coach/pages/coach-reservation-detail-page.test.tsx`
- `pnpm exec biome check src/lib/modules/chat/services/reservation-chat.service.ts src/lib/modules/chat/factories/reservation-chat.factory.ts src/features/coach/components/coach-reservation-chat-sheet.tsx src/features/coach/pages/coach-reservation-detail-page.tsx src/features/reservation/pages/reservation-detail-page.tsx src/__tests__/lib/modules/chat/services/reservation-chat.service.test.ts src/__tests__/modules/notification-delivery/notification-delivery.service.test.ts src/__tests__/lib/modules/reservation/services/reservation-coach.service.test.ts src/__tests__/features/reservation/pages/reservation-detail-page.test.tsx src/__tests__/features/coach/pages/coach-reservation-detail-page.test.tsx`
- `pnpm exec playwright test tests/e2e/coach-booking.happy-path.spec.ts --list`
- manual dev smoke:
  - `pnpm dev`
  - `curl -I -s http://localhost:3000/reservations/reservation-1` -> `307` redirect to `/login?redirect=%2Freservations%2Freservation-1`
  - `curl -I -s http://localhost:3000/coach/reservations/reservation-1` -> `307` redirect to `/login?redirect=%2Fcoach%2Freservations%2Freservation-1`
  - adversarial `curl -I -s http://localhost:3000/coach/reservations/not-a-real-reservation` also stayed behind the coach auth guard and preserved the original path inside `redirect`

Next loop should verify the final commit/task closure state and emit completion for the coach recovery objective unless review finds a regression in coach notification fan-out or shared reservation chat access.

## 2026-03-14T23:12:15Z Objective Closure Notes

Coach recovery is now complete through Step 10 with the implementation plan fully checked off and the final product-facing increment already landed in `286044404`.

Objective-level completion snapshot:
- completed steps: 1 through 10 in sequence, with the plan checklist fully marked done in `.agents/planning/2026-03-15-coach-feature-review/implementation/plan.md`
- final step commits on the recovery line: `a4146ab57`, `a480d90bd`, `16d2324a6`, `17a3fb14e`, `dfc6a836c`, `cba9b965c`, `f9b7d9caa`, `03b6cb41b`, `55bd8571e`, `b9f23e69e`, `aa8b86f5d`, `286044404`
- latest validation already recorded in the step notes:
  - Step 10: focused Vitest suite, focused Biome check, Playwright spec listing, and protected-route smoke/adversarial curls all passed
  - earlier step notes capture the prior focused validation for Steps 1 through 9, including migration generation for Step 9
- known gaps/follow-up: none within the recovery objective itself; remaining repo-wide lint/tooling noise stays outside this scoped coach recovery effort and was intentionally handled with focused validation at each step

This closure iteration only needs to verify runtime task state, preserve the completion record in scratchpad history, and emit the completion event for the loop.

## 2026-03-14T23:14:38Z Objective Closure Verification

Final closure verification is scoped to orchestration state, not feature code:
- re-read the coach recovery plan, gap analysis, acceptance audit, journey audit, and spec prompt to confirm the delivered scope still matches the stated objective
- verified the implementation checklist remains fully checked in `.agents/planning/2026-03-15-coach-feature-review/implementation/plan.md`
- verified the closure commit already exists at `7ef4fd1c7` (`docs(coach): finalize recovery objective`) on top of the Step 10 product commit `286044404`

Remaining actions in this loop:
- close the runtime task after confirming no other objective tasks remain open
- emit `objective.done` with a brief completion payload referencing the closure commit
- leave the objective in a terminal state with no remaining coach recovery follow-up inside this scoped plan
