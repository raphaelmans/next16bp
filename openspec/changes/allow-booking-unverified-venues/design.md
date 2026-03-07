## Context

Venue verification currently acts as both a trust signal and a hard booking gate. The backend blocks reservation creation unless a venue has a `place_verification` row with `status === "VERIFIED"` and `reservationsEnabled === true`, while player-facing booking surfaces use shared enablement helpers that hide booking UI for `UNVERIFIED`, `PENDING`, and `REJECTED` venues.

This change is cross-cutting because it touches reservation creation, owner verification controls, admin verification review flows, shared booking enablement logic, and multiple player booking entry surfaces. The desired behavior is to keep verification as a trust and warning concept while making reservation availability depend on reservable venue status, owner reservation toggle state, and payment-method readiness.

## Goals / Non-Goals

**Goals:**
- Remove verified status as a prerequisite for player booking.
- Preserve a single backend booking policy across web and mobile reservation creation paths.
- Allow owners to enable reservations for non-verified venues without weakening the active payment-method requirement.
- Preserve the current reservation toggle state when admin review moves a venue into `REJECTED`.
- Show non-verified warnings only on booking surfaces, not across all public venue browsing surfaces.

**Non-Goals:**
- Change the database schema or introduce new verification statuses.
- Remove verification workflows, badges, or admin review.
- Redesign public discovery listing cards or search result presentation.
- Introduce a mandatory player acknowledgement step before checkout.

## Decisions

### 1. Move booking eligibility from verification status to reservation readiness
Booking eligibility will be based on three conditions: the place is `RESERVABLE`, `reservationsEnabled` is true, and payment-method requirements remain satisfied where already enforced. Reservation creation will no longer require `status === "VERIFIED"`.

This keeps booking policy aligned with the owner's explicit reservation toggle instead of admin review state.

Alternatives considered:
- Keep verification as a hard requirement and only soften UI copy: rejected because backend would still block the requested behavior.
- Allow only some non-verified states such as `UNVERIFIED` and `PENDING`: rejected because the chosen product policy allows all non-verified states to remain bookable.

### 2. Treat missing verification rows as operationally unverified
Some owner-created places do not have a `place_verification` row until verification is submitted. The owner reservation toggle will therefore materialize a missing row as `UNVERIFIED` rather than failing on missing verification state.

This avoids adding a migration or forcing verification submission before reservations can be turned on.

Alternatives considered:
- Require every place to get a verification row through a data migration: rejected because it is unnecessary for the behavior change and adds rollout work.
- Keep missing rows as an error case: rejected because it would prevent owners from enabling reservations on newly created venues.

### 3. Preserve reservation toggle state on admin rejection
Admin rejection will update the verification status to `REJECTED` but preserve the existing `reservationsEnabled` and `reservationsEnabledAt` values. This matches the chosen product rule that rejected venues can still be bookable if the owner has kept reservations on.

Alternatives considered:
- Force reservations off on rejection: rejected because it conflicts with the selected behavior for all non-verified states.
- Force reservations on on rejection: rejected because admin review should not override an owner's explicit toggle choice.

### 4. Reuse shared enablement and verification-display helpers for UI rollout
The player surfaces already depend on `getReservationEnablement` and `getPlaceVerificationDisplay`. Those helpers will be updated so verification status controls warning copy and tone, while booking visibility is driven by reservation readiness. This lets place-detail booking, court-detail booking, and direct booking pages converge on one policy.

Alternatives considered:
- Patch each page locally and leave shared helpers inconsistent: rejected because it would create drift between booking surfaces.
- Show warnings on all public venue surfaces: rejected because the chosen scope is booking surfaces only.

## Risks / Trade-offs

- [A booking path keeps the old verified-only guard] → Route all reservation creation entrypoints through the same relaxed backend service rule and cover direct-court, any-court, and group booking tests.
- [Owner toggle behavior diverges when verification rows are missing] → Implement toggle writes with upsert semantics and test both create and update paths.
- [UI warnings appear on the wrong surfaces or disappear where needed] → Keep the warning decision in shared display helpers and verify place-detail, court-detail, and direct booking flows explicitly.
- [Existing copy still claims verification unlocks reservations] → Update owner and player copy in the same change so trust messaging matches the new behavior.

## Migration Plan

1. Update backend reservation eligibility and owner/admin verification service behavior.
2. Update shared reservation enablement and verification-display helpers.
3. Update booking surfaces and owner-facing copy to reflect warning-based behavior.
4. Add regression tests for backend eligibility, toggle upsert behavior, rejection preservation, and player warning visibility.

Rollback strategy:
- Revert the service and helper changes to restore verified-only booking behavior. No schema rollback is required because the change only reuses existing fields and states.

## Open Questions

None.
