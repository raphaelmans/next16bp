# Coach Feature Surface Map

## Scope

This research pass checks whether the `coach` feature shipped end to end or only partially, using repository evidence only.

## Sources Reviewed

- Spec baseline: `specs/coach-feature/PROMPT.md`
- Public routes: `src/app/(public)/coaches/page.tsx`, `src/app/(public)/coaches/[id]/page.tsx`, `src/app/(auth)/coaches/[id]/book/page.tsx`
- Coach portal routes: `src/app/(coach)/coach/page.tsx`, `src/app/(coach)/coach/dashboard/page.tsx`, `src/app/(coach)/coach/get-started/page.tsx`, `src/app/(coach)/coach/schedule/page.tsx`, `src/app/(coach)/coach/pricing/page.tsx`, `src/app/(coach)/coach/reservations/page.tsx`, `src/app/(coach)/coach/reservations/[id]/page.tsx`
- Public feature UI: `src/features/coach-discovery/**`
- Coach portal UI: `src/features/coach/**`
- Backend routers/services: `src/lib/modules/coach/**`, `src/lib/modules/coach-addon/**`, `src/lib/modules/coach-availability/**`, `src/lib/modules/coach-block/**`, `src/lib/modules/coach-hours/**`, `src/lib/modules/coach-rate-rule/**`, `src/lib/modules/coach-setup/**`, `src/lib/modules/coach-venue/**`, `src/lib/modules/reservation/reservation-coach.router.ts`, `src/lib/modules/reservation/services/reservation-coach.service.ts`
- Schema evidence: `src/lib/shared/infra/db/schema/coach.ts`, `src/lib/shared/infra/db/schema/coach-payment-method.ts`, `src/lib/shared/infra/db/schema/coach-review.ts`, `src/lib/shared/infra/db/schema/reservation.ts`
- Router wiring: `src/lib/shared/infra/trpc/root.ts`
- Test evidence: `src/__tests__/features/coach/pages/coach-pages.test.tsx`, `src/__tests__/features/coach/components/get-started/wizard/coach-step-live-editors.test.tsx`, `src/__tests__/lib/modules/coach/**`, `src/__tests__/lib/modules/coach-availability/**`, `src/__tests__/lib/modules/coach-schedule-pricing/**`

## High-Level Shape

```mermaid
graph TD
  Spec[coach-feature spec] --> Public[Public coach discovery]
  Spec --> Booking[Player booking flow]
  Spec --> Portal[Coach portal]
  Spec --> Backend[Coach backend modules]
  Spec --> Schema[Coach schema]

  Public --> Explore[/coaches and location routes/]
  Public --> Detail[/coaches/[id]/]

  Booking --> Book[/coaches/[id]/book/]
  Booking --> PlayerReservation[reservation.createForCoach]

  Portal --> Wizard[Get started wizard]
  Portal --> Schedule[Schedule page]
  Portal --> Pricing[Pricing page]
  Portal --> Reservations[Reservations pages]
  Portal --> MissingPortal[Profile/payment/settings missing]

  Backend --> CoachRouter[coach router]
  Backend --> Availability[coachAvailability router]
  Backend --> ScheduleModules[coachHours/coachBlock/coachRateRule/coachAddon]
  Backend --> Venue[coachVenue router]
  Backend --> ResCoach[reservationCoach router]
  Backend --> MissingModules[coach-payment and coach-review modules missing]

  Schema --> ReservationXor[reservation coachId XOR courtId]
  Schema --> CoachTables[coach-related tables exist]
```

## Implemented Surfaces Confirmed

### Data and transport

- Coach-related schema files exist, including `coach_payment_method` and `coach_review` tables in `src/lib/shared/infra/db/schema/coach-payment-method.ts` and `src/lib/shared/infra/db/schema/coach-review.ts`.
- Reservation schema supports coach bookings through `coachId`, supporting indexes, and the XOR target check in `src/lib/shared/infra/db/schema/reservation.ts`.
- tRPC root wiring includes `coach`, `coachAvailability`, `coachAddon`, `coachBlock`, `coachHours`, `coachRateRule`, `coachVenue`, and `reservationCoach` in `src/lib/shared/infra/trpc/root.ts`.

### Public coach experience

- Explore/listing routes exist for `/coaches` plus province/city/sport location routes.
- Detail route exists and renders hero/about/qualifications/services/contact sections in `src/features/coach-discovery/pages/coach-detail-page.tsx`.
- Booking route exists and uses dedicated coach availability and booking hooks in `src/features/coach-discovery/pages/coach-booking-page.tsx`.
- Discovery data is prefetched and cached server-side in `src/features/coach-discovery/server/public-coaches-discovery.tsx`.

### Coach portal

- Protected coach layout and portal shell exist in `src/app/(coach)/layout.tsx` and `src/features/coach/components/coach-portal-shell.tsx`.
- Setup wizard exists in `src/features/coach/components/get-started/wizard/coach-setup-wizard.tsx`.
- Live schedule and pricing editors are mounted from both wizard steps and dedicated pages.
- Dashboard, reservation list, and reservation detail pages exist.

### Booking lifecycle backend

- Player-side coach booking entrypoint exists at `reservation.createForCoach` in `src/lib/modules/reservation/reservation.router.ts`.
- Coach-side reservation actions exist in `src/lib/modules/reservation/reservation-coach.router.ts`.
- Reservation coach service implements create, accept, reject, confirm payment, cancel, list, detail, and pending count in `src/lib/modules/reservation/services/reservation-coach.service.ts`.

### Test coverage present

- Public coach router/service behavior is unit tested.
- Coach setup status is unit tested.
- Schedule/pricing services and routers are unit tested.
- Coach schedule/pricing pages and wizard live editors are component tested.

## Early Signals Of Missing Or Deferred Work

- The coach portal shell explicitly says profile editing is upcoming and remaining portal surfaces land later: `src/features/coach/components/coach-portal-shell.tsx`.
- The setup wizard payment step explicitly says payment CRUD arrives later: `src/features/coach/components/get-started/wizard/steps/payment-step.tsx`.
- The verify step is a placeholder satisfied by default: `src/features/coach/components/get-started/wizard/steps/verify-step.tsx`.
- Coach reservation detail explicitly says payment proof is deferred: `src/features/coach/pages/coach-reservation-detail-page.tsx`.

## Working Conclusion From Surface Mapping

The coach feature is not missing entirely. Core schema, public discovery, booking creation, coach-side reservation actions, and partial portal tooling are implemented. The strongest risk is not absence of the feature, but that it shipped as a partial vertical slice while the original spec expected a fuller portal and richer booking experience.
