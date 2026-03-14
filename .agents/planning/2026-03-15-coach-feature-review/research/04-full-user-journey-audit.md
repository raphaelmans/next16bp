# Coach Feature Full User Journey Audit

## Scope

This audit reviews the coach feature as an end-to-end product surface across all major personas:

- public visitor
- signed-in player
- coach
- shared realtime / notification / chat systems
- test coverage

It is based on route files, feature pages, hooks, tRPC routers, services, schema, and existing tests in the current repository snapshot.

## Executive Verdict

The coach feature is **usable as a narrow MVP**, but **not journey-complete**.

The highest-risk gap is the **player post-booking flow**: a player can create a coach reservation, but the app redirects into the shared reservation detail screen that still expects venue/court reservations.

## Journey Map

```mermaid
flowchart TD
  A[Public visitor] --> B[/coaches list/]
  B --> C[/coaches/[id] detail/]
  C --> D[/coaches/[id]/book/]

  D --> E[Create coach reservation]
  E --> F[/reservations/[id]/]

  F --> G{Coach-aware player flow?}
  G -->|No| H[Shared venue reservation assumptions]

  I[Coach] --> J[/coach/get-started/]
  I --> K[/coach/schedule/]
  I --> L[/coach/pricing/]
  I --> M[/coach/reservations/]
  M --> N[/coach/reservations/[id]/]

  J --> O[Partial placeholder wizard]
  K --> P[Live hours + blocks]
  L --> Q[Live rate rules + add-ons]
  N --> R[Actions work; proof/chat incomplete]
```

## Journey Status Matrix

| Persona | Journey | Status | Notes |
| --- | --- | --- | --- |
| Public | Discover coaches | Implemented | Real listing and location pages exist with server data prefetching. |
| Public | Open coach detail | Partial | Core detail sections render, but no real reviews surface. |
| Player | Start coach booking | Partial | Booking route exists and can create reservations, but add-ons are not surfaced in UI. |
| Player | After booking: reservation detail | Broken / high risk | Redirect lands on shared reservation detail that requires court/place data. |
| Player | Payment instructions/proof/chat for coach booking | Broken / missing | Shared payment flow is venue-oriented; coach-specific proof/chat support is absent. |
| Coach | Get started / onboarding | Partial | Wizard exists, but several steps are placeholders. |
| Coach | Manage schedule | Implemented | Hours and ad-hoc blocks are live. |
| Coach | Manage pricing | Implemented | Rate rules and add-ons are live. |
| Coach | Review reservation inbox/detail/actions | Partial | Inbox and actions exist; proof/chat pieces are incomplete. |
| Coach | Manage profile/payment/settings | Missing | No actual routes/pages found for these promised surfaces. |
| Shared | Reviews / reputation | Missing / backend-prepared | Schema and aggregates exist, but no end-user review flow. |
| Shared | Notifications / chat / realtime | Missing for coach journeys | Venue personas are wired; coach-specific support was not found. |
| Shared | Regression / e2e coverage | Partial | Unit coverage exists, but no coach e2e flow coverage was found. |

## Persona Audit

### 1. Public visitor: discover coaches

Status: **implemented**

Evidence:

- `/coaches` route exists in `src/app/(public)/coaches/page.tsx`
- location pages exist under `src/app/(public)/coaches/locations/**`
- server-side discovery prefetching and cache hydration exist in `src/features/coach-discovery/server/public-coaches-discovery.tsx`

What works:

- discovery list routes
- metadata generation
- cards, filters, location SEO surfaces

### 2. Public visitor: open coach detail

Status: **partial**

Evidence:

- detail route exists in `src/app/(public)/coaches/[id]/page.tsx`
- detail page sections are rendered by `src/features/coach-discovery/pages/coach-detail-page.tsx`

What works:

- hero
- about
- qualifications
- services
- contact / CTA

Gaps:

- no actual reviews section despite rating/review metadata support
- spec-level availability surface is not fully represented on the detail page

### 3. Signed-in player: book a coach session

Status: **partial**

Evidence:

- signed-in booking route exists in `src/app/(auth)/coaches/[id]/book/page.tsx`
- booking page uses `useMutCreateReservationForCoach` in `src/features/coach-discovery/pages/coach-booking-page.tsx`
- server mutation exists at `reservation.createForCoach` in `src/lib/modules/reservation/reservation.router.ts`
- creation writes a coach reservation with `courtId: null` in `src/lib/modules/reservation/services/reservation-coach.service.ts:319`

What works:

- coach load
- slot selection
- profile completeness check
- booking mutation

Gaps:

- add-ons are fetched but not meaningfully selectable in the booking UI
- success redirects into a shared player reservation screen that is not coach-aware

### 4. Player: post-booking journey

Status: **broken / highest risk**

Evidence:

- booking success redirects to `appRoutes.reservations.detail(data.id)` in `src/features/coach-discovery/pages/coach-booking-page.tsx:171`
- shared player reservation detail refuses to render without `reservation`, `courtRecord`, and `placeRecord` in `src/features/reservation/pages/reservation-detail-page.tsx:412`
- payment info for reservations is still fetched through court/place -> organization payment methods in `src/lib/modules/reservation/services/reservation.service.ts:2013`

Why this matters:

- coach bookings intentionally have `courtId: null`
- the player follow-up journey still expects venue reservation shape

Likely result:

- booking creation may succeed
- the player may then land on a not-found or structurally incomplete reservation detail experience

### 5. Coach: onboarding / get started

Status: **partial**

Evidence:

- wizard shell exists in `src/features/coach/components/get-started/wizard/coach-setup-wizard.tsx`
- setup status use case exists and is tested in `src/lib/modules/coach-setup/**` and `src/__tests__/lib/modules/coach-setup/**`
- placeholder steps include `profile-step.tsx`, `sports-step.tsx`, `payment-step.tsx`, and `verify-step.tsx`

What works:

- status progression
- schedule step with live editors
- pricing step with live editors

What is still placeholder-only:

- profile editing in wizard
- sports editing in wizard
- payment method management in wizard
- verification gate in wizard

### 6. Coach: schedule and pricing management

Status: **implemented**

Evidence:

- schedule editor in `src/features/coach/components/coach-schedule-editor.tsx`
- block manager in `src/features/coach/components/coach-block-manager.tsx`
- pricing editor in `src/features/coach/components/coach-pricing-editor.tsx`
- add-on editor in `src/features/coach/components/coach-addon-editor.tsx`
- router and service coverage in `src/__tests__/lib/modules/coach-schedule-pricing/**`

This is the most complete coach journey today.

### 7. Coach: reservation inbox, detail, and actions

Status: **partial**

Evidence:

- route files exist under `src/app/(coach)/coach/reservations/**`
- coach reservation detail page exists in `src/features/coach/pages/coach-reservation-detail-page.tsx`
- coach-side reservation router/actions exist in `src/lib/modules/reservation/reservation-coach.router.ts`

What works:

- list reservations
- open detail
- accept / reject
- cancel
- confirm payment

Gaps:

- payment proof is explicitly deferred in the detail page
- no coach-specific chat widget flow was found
- coach notification delivery for these transitions was not found

### 8. Coach: profile, payment methods, settings

Status: **missing**

Evidence:

- route constants exist in `src/common/app-routes.ts`
- actual route files were not found under `src/app/(coach)/coach/profile`, `src/app/(coach)/coach/payment-methods`, or `src/app/(coach)/coach/settings`
- backend profile methods exist in `src/lib/modules/coach/coach.router.ts`

Mismatch:

- backend/profile contracts exist
- promised portal surfaces do not

### 9. Reviews and reputation

Status: **missing / backend-prepared only**

Evidence:

- `coach_review` schema exists in `src/lib/shared/infra/db/schema/coach-review.ts`
- rating aggregation support exists in `src/lib/modules/coach/repositories/coach.repository.ts`

Missing:

- no review router/module
- no review submission flow
- no review moderation surface
- no public review list UI on coach detail page

### 10. Realtime, chat, and notifications

Status: **missing for coach persona**

Evidence:

- reservation chat widget supports `player | organization` only in `src/features/chat/components/chat-widget/reservation-inbox-widget.tsx:64`
- player reservation detail opens chat with `kind: "player"` in `src/features/reservation/pages/reservation-detail-page.tsx:251`
- coach reservation service only logs lifecycle events such as `coach_reservation.created`, `coach_reservation.accepted`, etc. in `src/lib/modules/reservation/services/reservation-coach.service.ts`

Not found:

- `coach_booking.*` notification implementation
- coach reservation chat channel creation
- coach-specific inbox/chat UI

## Contradictions and Misleading UX Signals

- Setup status can require coach payment methods, but the UI still says payment CRUD arrives later.
- Discovery/detail metadata can show ratings and review counts, but there is no actual review journey.
- Coach booking is live, but player post-booking detail/payment still appears venue-specific.
- Route constants advertise coach profile/payment/settings, but those routes/pages do not exist.

## Test Coverage Audit

### Present

- router/service tests for discovery and setup
- router/service tests for coach schedule/pricing
- component tests for coach schedule/pricing pages and wizard live steps

### Missing

- no coach Playwright specs found under `tests/e2e/**/*coach*.spec.ts`
- no focused tests found for player coach booking success path
- no focused tests found for coach reservation inbox/detail action path
- no focused tests found for coach profile/payment/settings/review journeys

## Highest-Risk Missing Journeys

1. Player post-booking coach reservation detail and payment flow
2. Coach payment method management end to end
3. Coach profile management end to end
4. Coach notification and chat coordination
5. Review and reputation journey

## Practical Verdict

If judged as a full journey experience, the coach feature is:

- **strongest** in discovery plus coach schedule/pricing management
- **usable but incomplete** in coach reservation operations
- **currently unsafe/incomplete** in player post-booking follow-through for coach reservations

The next safe product priority should be to fix the player post-booking coach reservation journey before expanding lower-priority polish features.
