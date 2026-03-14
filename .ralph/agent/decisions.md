# Decision Journal

Use this file to capture consequential decisions and their confidence scores.

## Template

- Decision: <short description>
- Chosen Option: <what we picked>
- Confidence: <0-100>
- Alternatives Considered: <comma-separated list>
- Reasoning: <why this is the safest/pragmatic choice>
- Reversibility: <easy|medium|hard>
- Timestamp (UTC ISO 8601): <YYYY-MM-DDTHH:MM:SSZ>

## Entries

### DEC-001

- Decision: Shape the shared player reservation detail response for coach targets in Step 1
- Chosen Option: Keep the existing venue fields in `ReservationDetail`, add `targetType` plus nullable `coach`, and allow `getReservationLinkedDetail()` to return `null` for single coach reservations
- Confidence: 72
- Alternatives Considered: introduce a brand new coach-only player detail route, replace the response with a strict union type, fake venue placeholders for coach reservations
- Reasoning: This keeps the shared route working with minimal API churn, avoids lying with fake court/place records, and lets the page branch cleanly while preserving current venue consumers
- Reversibility: medium
- Timestamp (UTC ISO 8601): 2026-03-14T19:16:09Z

### DEC-002

- Decision: Use focused validation evidence to finalize Step 1 instead of waiting on repo-wide `pnpm lint`
- Chosen Option: Treat targeted Biome checks, focused Vitest coverage, and TypeScript validation as the Step 1 gate while documenting that repo-wide lint is still red for unrelated tracked files
- Confidence: 76
- Alternatives Considered: block Step 1 finalization on unrelated repo lint debt, expand this iteration to fix unrelated Biome issues outside the coach reservation scope
- Reasoning: The implementation itself is already shipped on `HEAD`; the cleanest atomic follow-up is to verify the touched reservation paths again, update the recovery artifact, and avoid mixing unrelated lint cleanup into this objective
- Reversibility: easy
- Timestamp (UTC ISO 8601): 2026-03-15T03:17:00Z

### DEC-003

- Decision: Treat Step 2 as the current task even though its backend commit is already present on `HEAD`
- Chosen Option: Finish Step 2 by adding the missing focused tests and syncing the recovery checklist before allowing Step 3 work to begin
- Confidence: 79
- Alternatives Considered: mark Step 2 complete immediately from existing code, skip directly to Step 3 because the backend implementation already exists
- Reasoning: The recovery plan requires each step to be demoable with focused validation, and current repo evidence shows the code landed without the plan-required Step 2 test coverage or checklist update. Closing that gap keeps the sequential contract intact and avoids hiding incomplete acceptance work under later UI changes.
- Reversibility: easy
- Timestamp (UTC ISO 8601): 2026-03-14T21:00:56Z

### DEC-004

- Decision: Scope Step 4 to live onboarding editors inside the existing get-started wizard
- Chosen Option: Implement real profile-basics and sport-selection forms in the wizard, reuse the existing `coach.updateProfile` backend contract, and defer `/coach/profile` route work to Step 6
- Confidence: 78
- Alternatives Considered: add `/coach/profile` now and reuse it from the wizard, create a new wizard-specific backend contract, keep the placeholders and only update setup-status copy
- Reasoning: Step 4 specifically targets onboarding truthfulness, while Step 6 is already reserved for missing portal routes. Reusing `coach.updateProfile` keeps data flow consistent, avoids duplicating contracts, and delivers a demoable increment without jumping ahead in the recovery sequence.
- Reversibility: easy
- Timestamp (UTC ISO 8601): 2026-03-15T06:22:00Z

### DEC-005

- Decision: Define the Step 5 coach verification gate around explicit status plus certification-backed submission
- Chosen Option: Add a coach verification status on the `coach` record, gate setup completion on `VERIFIED`, let coaches save certifications inline from the wizard, and add a `submitVerification` action that moves eligible coaches to `PENDING`
- Confidence: 77
- Alternatives Considered: keep verification derived only from certification presence, create a full standalone `coach_verification_request` module now, postpone verification until the missing profile/settings routes exist
- Reasoning: Step 5 needs real blocked and pending states without jumping ahead to a full admin review product. Storing explicit status keeps the public `verified` flag and onboarding gate truthful, while reusing existing coach certification/profile contracts avoids a wider refactor before Step 6.
- Reversibility: medium
- Timestamp (UTC ISO 8601): 2026-03-15T05:25:00Z

### DEC-006

- Decision: Scope Step 6 coach portal completion around existing live feature slices instead of new backend work
- Chosen Option: Build `/coach/profile` by reusing the Step 4 onboarding profile and sports editors, build `/coach/settings` from existing browser-notification and portal-preference controls, and make the portal shell/navigation truthful around those routes
- Confidence: 75
- Alternatives Considered: create new coach-specific backend contracts for profile/settings, leave settings out of the coach shell until notifications/chat work lands in Step 10, expose placeholder pages with deferred copy
- Reasoning: Step 6 is about making the portal routes real and navigable, not expanding the backend scope. Reusing already-shipped editors and shared settings controls keeps the increment demoable, avoids inventing unfinished APIs, and removes the existing misleading "later task" messaging.
- Reversibility: easy
- Timestamp (UTC ISO 8601): 2026-03-15T01:30:00Z

### DEC-007

- Decision: Define coach-review eligibility for Step 8
- Chosen Option: Allow create/update/remove review flows only for authenticated users who either already have an active review or have at least one past `CONFIRMED` reservation for that coach
- Confidence: 75
- Alternatives Considered: allow any authenticated user to review a coach, require only any confirmed reservation regardless of whether the session has ended, defer eligibility and ship schema-backed reviews without a booking gate
- Reasoning: Step 8 explicitly calls for eligibility rules, and the safest trust-preserving boundary is completed-session proof. Reusing reservation history keeps the rule auditable, avoids inventing a new entitlement model, and still permits authors to edit/remove an existing review.
- Reversibility: easy
- Timestamp (UTC ISO 8601): 2026-03-15T01:10:00Z

### DEC-008

- Decision: Persist coach booking add-on detail for Step 9 reservation-detail rendering
- Chosen Option: Add a nullable `pricingBreakdown` JSON snapshot column on `reservation`, populate it during coach reservation creation, and render coach detail/add-on totals from that stored snapshot
- Confidence: 74
- Alternatives Considered: add a new relational reservation-addon table, recompute add-on lines on the fly from current coach addon config, pass detail-only add-on state through client navigation without persistence
- Reasoning: Step 9 needs post-booking truth, not just pre-submit pricing. Recomputing from mutable coach addon config would make old reservations drift, while a new table is too large for this narrow increment. A stored pricing snapshot matches the existing `PricingBreakdown` shape, keeps venue behavior untouched, and gives the player detail page stable add-on lines immediately.
- Reversibility: medium
- Timestamp (UTC ISO 8601): 2026-03-14T22:35:55Z
