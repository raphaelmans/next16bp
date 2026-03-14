# Coach Feature Recovery Plan

## Checklist

- [x] Step 1: Make player coach reservation detail render correctly
- [x] Step 2: Add coach payment methods backend and player payment-info support
- [x] Step 3: Ship coach payment methods UI and connect get-started
- [ ] Step 4: Replace placeholder onboarding steps with real profile and sports editing
- [ ] Step 5: Add a real coach verification gate
- [ ] Step 6: Complete missing coach portal routes
- [ ] Step 7: Finish coach reservation detail with payment-proof support
- [ ] Step 8: Add coach reviews end to end
- [ ] Step 9: Surface coach booking add-ons in player UX
- [ ] Step 10: Add coach notifications, chat, and regression coverage

Convert the design into a series of implementation steps that will build each component in a test-driven manner following agile best practices. Each step must result in a working, demoable increment of functionality. Prioritize best practices, incremental progress, and early testing, ensuring no big jumps in complexity at any stage. Make sure that each step builds on the previous steps, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step.

## Step 1: Make player coach reservation detail render correctly

Objective: Fix the highest-risk broken journey so players who create coach bookings land on a valid reservation detail experience.

Implementation guidance:
- extend shared reservation detail DTO/service logic so coach reservations can resolve a coach-specific detail shape instead of requiring `court` and `place`
- adapt the player reservation detail page to branch safely between venue and coach reservation targets
- keep existing venue reservation behavior unchanged

Test requirements:
- add service tests for coach-target reservation detail retrieval
- add page/component tests for coach reservation detail rendering
- add regression coverage proving venue reservations still render the old path

Integrates with previous work:
- builds directly on the existing `reservation.createForCoach` mutation and coach reservation records already being created

Demo: Book a coach session, get redirected to `/reservations/[id]`, and see a coach-specific confirmation/detail screen instead of a not-found-style failure.

Verification snapshot:
- implementation landed in `a4146ab57` with coach-target detail branching in the shared reservation flow
- focused regression coverage exercises coach and venue detail rendering plus coach linked-detail null handling

## Step 2: Add coach payment methods backend and player payment-info support

Objective: Make paid coach reservations able to expose real coach payment instructions.

Implementation guidance:
- create the `coach-payment` repository/service/router layer around `coach_payment_method`
- extend reservation payment-info resolution so coach reservations return coach payment methods instead of organization methods
- preserve the existing organization payment path for venue reservations

Test requirements:
- add CRUD tests for coach payment methods
- add payment-info tests covering both venue and coach reservation targets
- add error cases for missing/disabled payment methods

Integrates with previous work:
- plugs into the repaired player reservation detail flow from Step 1

Demo: A paid coach reservation shows the coach's active payment methods and instructions in the player payment step.

Verification snapshot:
- existing backend module in `16d2324a6` remains wired through tRPC root registration and reservation payment-info resolution
- focused Vitest coverage now exercises coach payment CRUD service behavior plus venue-vs-coach payment-info resolution and inactive-method filtering

## Step 3: Ship coach payment methods UI and connect get-started

Objective: Remove the biggest coach-side product contradiction by giving coaches a real way to satisfy payment readiness.

Implementation guidance:
- add `/coach/payment-methods` route and page
- build coach payment-method CRUD UI following existing payment management patterns where appropriate
- replace the get-started payment placeholder with real navigation or embedded management
- refresh setup-status invalidation after mutations

Test requirements:
- add component tests for add/edit/delete/default flows
- add hook/query invalidation tests where practical
- add route/page smoke coverage for the payment methods page

Integrates with previous work:
- uses backend APIs from Step 2 and unlocks meaningful paid-coach onboarding

Demo: A coach adds a payment method, sees it on `/coach/payment-methods`, and the get-started flow updates payment readiness.

Verification snapshot:
- added coach feature API/query-adapter support for `coachPayment.*` CRUD plus setup-status invalidation
- shipped `CoachPaymentMethodsManager`, `/coach/payment-methods`, and live payment-step wiring in the get-started wizard
- updated coach portal navigation so payment methods is a real destination instead of a missing promised surface
- focused validation passed for coach payment manager/component/page/api/hooks coverage plus a local dev smoke showing `/coach/payment-methods` redirects unauthenticated users to `/login?redirect=%2Fcoach%2Fpayment-methods`

## Step 4: Replace placeholder onboarding steps with real profile and sports editing

Objective: Turn onboarding into a real workflow instead of a mostly status-only shell.

Implementation guidance:
- implement editing UX for profile basics and sports selection inside get-started and/or `/coach/profile`
- reuse existing coach profile backend contracts where available
- ensure wizard step completion reflects saved data immediately

Test requirements:
- add tests for profile save, sports save, and step completion transitions
- cover required-field validation and empty-state behavior

Integrates with previous work:
- builds on the now-functional portal and setup status chain without introducing a separate data model

Demo: A new coach can complete profile and sports steps directly from the onboarding flow and see progress update live.

## Step 5: Add a real coach verification gate

Objective: Replace the fake verification step with actual launch-readiness logic.

Implementation guidance:
- define the minimum verification contract for coach launch readiness
- implement storage/state plus setup-status evaluation for that contract
- update UI copy and wizard logic so verification is no longer auto-satisfied

Test requirements:
- add use-case tests for verified vs unverified setup snapshots
- add UI tests for pending, approved, and blocked verification states

Integrates with previous work:
- completes onboarding truthfulness after payment, profile, and sports are real

Demo: A coach who has not completed verification cannot finish setup; once verified, the final step unlocks.

## Step 6: Complete missing coach portal routes

Objective: Make the coach portal navigation truthful and fully navigable.

Implementation guidance:
- add `/coach/profile`, `/coach/payment-methods`, and `/coach/settings` route files
- connect them to the implemented feature pages from earlier steps
- remove upcoming/deferred copy from the portal shell where work is complete

Test requirements:
- add route-level smoke tests for all coach portal destinations
- add navigation tests to ensure links land on real pages

Integrates with previous work:
- consolidates the onboarding/payment/profile work into the canonical coach portal structure

Demo: Every item in coach portal navigation opens a working page with no placeholders.

## Step 7: Finish coach reservation detail with payment-proof support

Objective: Let coaches review the full paid-booking state instead of just status transitions.

Implementation guidance:
- include payment-proof data in coach reservation detail contracts
- render proof metadata and proof assets safely in coach detail UI
- clarify action states for awaiting payment vs proof submitted vs confirmed

Test requirements:
- add detail DTO/service tests for proof data
- add component tests for proof-present and proof-missing states
- add permission tests for coach access to their own reservation proof only

Integrates with previous work:
- builds on Steps 1-3 so both player and coach sides now understand the same paid booking lifecycle

Demo: A coach opens a paid reservation, sees uploaded proof and payment metadata, and confirms payment from a complete detail page.

## Step 8: Add coach reviews end to end

Objective: Turn latent review schema support into a real discovery and trust journey.

Implementation guidance:
- implement a `coach-review` module with read/write/moderation-safe flows
- render reviews on public coach detail pages
- define player eligibility rules for leaving a review

Test requirements:
- add router/service tests for create/list/remove flows
- add page/component tests for public review rendering and empty states
- add validation tests for duplicate or ineligible review attempts

Integrates with previous work:
- strengthens public detail pages and coach reputation after core booking journeys are stable

Demo: A player can read coach reviews on the public detail page and, when eligible, submit a review that affects displayed aggregates.

## Step 9: Surface coach booking add-ons in player UX

Objective: Finish pricing parity by letting players select and understand coach add-ons during booking.

Implementation guidance:
- render add-on selection UI in the booking page
- pass selected add-ons through create-for-coach mutation payloads
- show chosen add-ons in reservation detail and totals

Test requirements:
- add booking-page tests for add-on selection and total updates
- add mutation/service validation tests for invalid add-on selections
- add reservation detail tests showing selected add-ons

Integrates with previous work:
- depends on the repaired player detail and payment flows already being coach-aware

Demo: A player selects optional coach add-ons during booking, sees the total change, and later sees those add-ons reflected in reservation detail.

## Step 10: Add coach notifications, chat, and regression coverage

Objective: Close collaboration and trust gaps around coach bookings while protecting the end-to-end experience.

Implementation guidance:
- add `coach_booking.*` notification templates and event triggers
- provision coach reservation chat channels and expose chat entry points for player and coach reservation detail pages
- add high-value regression coverage, including at least one coach e2e happy path

Test requirements:
- add notification trigger coverage for the core lifecycle transitions
- add chat provisioning and access tests
- add e2e coverage from public discovery -> player booking -> coach action handling

Integrates with previous work:
- intentionally comes last so communication features sit on top of stable booking, payment, and portal foundations

Demo: A player books a coach, the coach receives the right notification, both parties can access the reservation conversation when appropriate, and the full happy path is covered by automated regression tests.
