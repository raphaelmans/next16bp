# Coach Feature Implementation Backlog

This backlog translates the review findings in `research/01-surface-map.md`, `research/02-gap-analysis.md`, and `research/03-acceptance-audit.md` into prioritized follow-up work for the missing coach feature scope.

## Prioritization Rules

- `P0`: broken or misleading end-to-end gaps that undermine a usable coach booking flow or setup completion.
- `P1`: missing spec commitments that expand the coach product from MVP to the promised portal and public experience.
- `P2`: polish, trust, and coverage improvements that strengthen adoption after the core missing surfaces land.

## P0

### P0-1. Ship coach payment methods end to end

- Problem: setup status checks for active payment methods, but coaches cannot manage payment methods anywhere in the product.
- Evidence: `research/02-gap-analysis.md` marks the backend module and `/coach/payment-methods` route as missing; `research/03-acceptance-audit.md` calls this a critical mismatch because payment readiness is required for setup completion.
- Scope:
  - add a `coach-payment` module with repository/service/router CRUD for `coach_payment_method`
  - add protected UI for `/coach/payment-methods`
  - replace the payment-step placeholder with real payment-method management
  - ensure setup completion reflects real payment readiness
- Done when: a coach can add, edit, activate, and remove payment methods and the get-started flow no longer blocks on a feature that does not exist.

### P0-2. Fix player reservation detail and payment flows for coach bookings

- Problem: coach reservations can be created, but player reservation detail and payment info still appear court/place oriented.
- Evidence: `research/02-gap-analysis.md` marks player reservation detail adaptation as likely missing; `research/03-acceptance-audit.md` notes `reservation-detail-page.tsx` and reservation services still assume `courtRecord` and `placeRecord`.
- Scope:
  - adapt reservation detail DTOs, service logic, and UI to support coach reservations without court/place assumptions
  - add coach-specific payment instructions rendering once coach payment methods exist
  - test both happy path and invalid target-shape regressions
- Done when: a player can open a coach reservation detail page and see correct coach-specific summary, payment information, and status handling.

### P0-3. Replace wizard verify placeholder with a real completion gate

- Problem: the setup wizard presents verification as complete even though no verification workflow exists.
- Evidence: `research/01-surface-map.md` says verify is a placeholder satisfied by default; `research/03-acceptance-audit.md` notes `hasVerification` is effectively auto-satisfied.
- Scope:
  - define the minimum verification requirement for coach launch readiness
  - implement the data model, service logic, and UI state needed for that requirement
  - stop auto-completing verification in setup status and tests
- Done when: the verify step reflects real data and setup completion cannot be reached through a placeholder default.

## P1

### P1-1. Complete missing coach portal routes

- Problem: the portal advertises a fuller product than it actually ships.
- Evidence: `research/02-gap-analysis.md` and `research/03-acceptance-audit.md` both list `/coach/profile`, `/coach/payment-methods`, and `/coach/settings` as missing; portal copy still labels profile as upcoming.
- Scope:
  - add route files and feature pages for profile, payment methods, and settings
  - wire portal navigation to real destinations and remove "upcoming" messaging
  - keep data flow aligned with existing feature API and tRPC adapter conventions
- Done when: every coach portal destination in navigation resolves to a functional page.

### P1-2. Deliver coach profile editing and public-detail parity

- Problem: the public detail experience omits availability and reviews, and there is no coach-owned profile management surface.
- Evidence: `research/02-gap-analysis.md` marks the public detail page as partial; `research/03-acceptance-audit.md` notes missing availability and reviews sections.
- Scope:
  - add coach profile editing for bio, qualifications, services, contact, and public-facing metadata
  - expose public availability summary on `/coaches/[id]`
  - connect detail-page content to the canonical coach profile source
- Done when: coaches can manage their public profile and the detail page reflects the promised availability-aware profile surface.

### P1-3. Implement coach reviews backend and public experience

- Problem: review schema exists, but no review product surface ships.
- Evidence: both `research/02-gap-analysis.md` and `research/03-acceptance-audit.md` describe reviews as schema-only with no module, no public section, and no submission flow.
- Scope:
  - add a `coach-review` module with review CRUD and aggregate queries
  - render public reviews on coach detail pages
  - define and implement the protected submission/removal flow allowed by product rules
- Done when: coach review counts and ratings are backed by a real review system instead of latent schema support only.

### P1-4. Surface add-on selection in player coach booking

- Problem: booking fetches add-ons but does not give the player a real selection flow.
- Evidence: `research/03-acceptance-audit.md` notes add-ons are fetched and not surfaced as an actual user choice flow.
- Scope:
  - add add-on selection UI and validation to the booking page
  - persist selected add-ons through reservation creation and detail views
  - cover empty, invalid, and mixed pricing scenarios
- Done when: players can choose coach add-ons during booking and see them reflected in totals and reservation data.

## P2

### P2-1. Add coach booking notifications

- Problem: lifecycle events exist, but no coach-specific notification delivery was found.
- Evidence: `research/02-gap-analysis.md` and `research/03-acceptance-audit.md` both report missing `coach_booking.*` notification implementation.
- Scope:
  - define notification templates and triggers for create, accept, reject, payment confirmation, and cancel events
  - connect them to existing notification-delivery infrastructure
  - verify delivery behavior for both player and coach roles
- Done when: coach reservation lifecycle changes notify the right actor with product-specific messaging.

### P2-2. Add coach reservation chat

- Problem: the spec expected coach booking chat, but no channel creation flow was found.
- Evidence: `research/02-gap-analysis.md` and `research/03-acceptance-audit.md` both report missing chat wiring such as `createCoachReservationChannel`.
- Scope:
  - create coach reservation chat-channel provisioning and participant rules
  - link the channel from coach and player reservation detail surfaces
  - validate channel lifecycle for cancelled and rejected reservations
- Done when: accepted coach reservations expose a working coach-player conversation channel.

### P2-3. Expand regression coverage around coach-specific paths

- Problem: current tests cover schedule, pricing, and core router logic well, but not the most incomplete coach-specific end-to-end surfaces.
- Evidence: `research/01-surface-map.md` highlights strong coverage for schedule/pricing, while the missing areas above have no matching implementation evidence.
- Scope:
  - add targeted tests for payment methods, verification gating, player coach reservation detail, reviews, notifications, and chat
  - add at least one end-to-end flow that exercises coach discovery to booking to coach action handling
  - include adversarial cases for missing payment methods, invalid reservation targets, and unpublished coach data
- Done when: the highest-risk coach gaps are guarded by regression coverage before future rollout work.

## Suggested Delivery Order

1. `P0-1` coach payment methods
2. `P0-2` player reservation detail and payment compatibility
3. `P0-3` real verification gate
4. `P1-1` missing portal routes
5. `P1-2` profile editing and detail-page parity
6. `P1-3` reviews
7. `P1-4` booking add-ons UX
8. `P2-1` notifications
9. `P2-2` chat
10. `P2-3` regression coverage sweep

## Recommended Review Framing

Use this backlog if the team agrees with the audit conclusion that the coach feature shipped as an MVP slice, not as the full spec. `P0` restores broken or misleading product promises, `P1` closes explicit spec commitments, and `P2` strengthens the launch with communication, collaboration, and regression safety.
