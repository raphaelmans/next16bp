# Coach Feature Gap Analysis

## Preliminary Verdict

The `coach` feature looks **partially successful, but incomplete against the original spec**.

- Successful: the core entity, public discovery routes, coach booking creation, coach-side reservation workflow, schedule tools, pricing tools, and setup-status plumbing all exist.
- Missing or clearly deferred: coach profile page, coach payment-method page, coach settings page, coach payment-method CRUD module, coach review module, public reviews section, detail-page availability section, coach reservation chat, coach notification templates, and parts of the player reservation detail adaptation.

## Spec-vs-Implementation Matrix

| Area | Expected by spec | Current evidence | Status |
| --- | --- | --- | --- |
| Schema foundation | Coach tables plus `reservation.coachId` | Present in schema files, including XOR check in `src/lib/shared/infra/db/schema/reservation.ts` | Implemented |
| Public explore | `/coaches` with filters and location routes | Present in `src/app/(public)/coaches/**` and `src/features/coach-discovery/**` | Implemented |
| Public detail | Profile, qualifications, availability, reviews, contact | Current page renders hero/about/qualifications/services/contact; no availability or reviews sections wired | Partial |
| Player booking | `/coaches/{slug}/book` creates coach reservation | Implemented via `src/features/coach-discovery/pages/coach-booking-page.tsx` and `reservation.createForCoach` | Implemented |
| Coach schedule/pricing | Weekly hours, blocks, rate rules, add-ons | Implemented with routes, editors, hooks, services, and tests | Implemented |
| Coach dashboard | Overview and pending/upcoming work queue | Implemented in `src/features/coach/pages/coach-dashboard-page.tsx` | Implemented |
| Coach reservations inbox/detail | List and action flow | Implemented, but detail page notes payment proof is deferred | Partial |
| Coach get-started wizard | 8-step setup flow | Present, but payment and verify steps are placeholders/deferred | Partial |
| Coach profile page | `/coach/profile` fully functional | Route constant exists, route file absent, portal marks it upcoming | Missing |
| Coach payment methods page | `/coach/payment-methods` fully functional | Route constant exists, route file absent, payment step says CRUD arrives later | Missing |
| Coach settings page | `/coach/settings` fully functional | Route constant exists, route file absent | Missing |
| Coach payment backend module | CRUD and reservation payment info support | Table exists, but no `src/lib/modules/coach-payment/**` files found | Missing |
| Coach review backend module | Review CRUD and aggregates | Table exists, but no `src/lib/modules/coach-review/**` files found | Missing |
| Coach booking notifications | `coach_booking.*` notifications | No implementation evidence found in repo search | Missing |
| Coach booking chat | GetStream coach reservation channel | No implementation evidence found in repo search | Missing |
| Player reservation detail coach adaptation | Coach-specific reservation detail handling | Existing player reservation page still reads as court/place oriented | Likely missing |

## Most Important Evidence

### Strong evidence the feature succeeded in part

1. `src/lib/shared/infra/db/schema/reservation.ts` supports coach reservations with `coachId` and `chk_reservation_target`.
2. `src/lib/modules/reservation/services/reservation-coach.service.ts` implements the core coach reservation lifecycle.
3. `src/features/coach-discovery/pages/coach-booking-page.tsx` provides a real player booking flow, not a placeholder.
4. `src/features/coach/pages/coach-schedule-page.tsx` and `src/features/coach/pages/coach-pricing-page.tsx` expose live tooling, and those flows have tests.
5. `src/features/coach/pages/coach-dashboard-page.tsx` and `src/features/coach/pages/coach-reservations-page.tsx` show the portal is beyond mockups.

### Strong evidence the feature is still incomplete

1. `src/features/coach/components/coach-portal-shell.tsx` explicitly labels profile as "upcoming" and says remaining portal surfaces land later.
2. `src/features/coach/components/get-started/wizard/steps/payment-step.tsx` explicitly says coach payment method CRUD arrives later.
3. `src/features/coach/components/get-started/wizard/steps/verify-step.tsx` is a placeholder with no real verification flow.
4. No files exist under `src/lib/modules/coach-payment*/**` or `src/lib/modules/coach-review*/**`.
5. No route files exist under `src/app/(coach)/coach/profile/**`, `src/app/(coach)/coach/payment-methods/**`, or `src/app/(coach)/coach/settings/**`.
6. `src/features/coach/pages/coach-reservation-detail-page.tsx` contains an inline note that payment proof is deferred.
7. Repo search did not find implementation evidence for `coach_booking.*` notifications or `createCoachReservationChannel` chat wiring.

## Risk Assessment

### If success means "is there a usable coach MVP?"

Likely yes. A player can discover coaches, open a detail page, request a booking, and a coach can review and manage reservations. Coaches can also configure schedule and pricing.

### If success means "did the full spec ship?"

No. The delivered surface is narrower than the spec and includes acknowledged placeholders and missing portal modules.

## Recommended Review Framing

Use this wording unless later research changes it:

> The coach feature shipped as a meaningful MVP, not as the complete spec. Core booking and schedule/pricing flows are present, but several promised portal, payment, review, notification, chat, and detail-page capabilities are still missing or explicitly deferred.

## Follow-up Research Targets

- Confirm whether any hidden implementation exists for coach payment methods or reviews outside the expected module paths.
- Verify whether player reservation detail already handles coach reservations indirectly through shared DTOs.
- Check whether notification/chat support was intentionally descoped or simply not implemented.
- Compare current implementation against `.agents/planning/2026-03-14-coach-feature/` if a tighter acceptance audit is needed.
