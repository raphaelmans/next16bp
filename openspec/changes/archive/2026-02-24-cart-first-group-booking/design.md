## Context

Grouped reservation creation and owner group actions already exist, but the end-to-end lifecycle still leaks per-item handling in key places:

- Player post-checkout routing returns to list-level item handling instead of a group-level surface.
- Player detail/payment UX is reservation-id centric rather than reservation-group centric.
- Chat thread identity is reservation-id based (`res-<reservationId>`), creating multiple threads for one grouped booking.
- Notification delivery payloads and idempotency keys are reservation-id based, causing per-item notification fan-out and fragmented links.
- Owner UI supports group actions but list/inbox mental model is still largely row-per-reservation.

This change aligns behavior with cart expectations: one grouped booking should be handled as one operational unit while preserving full backward compatibility for legacy single-reservation flows.

## Goals / Non-Goals

**Goals:**
- Make grouped bookings group-first after checkout for both players and owners.
- Provide group-level player detail and group-level payment handling semantics.
- Consolidate chat to one reservation-group thread for grouped bookings.
- Consolidate reservation lifecycle notifications to group-level events for grouped bookings.
- Preserve existing single-reservation APIs/routes and behavior.
- Make testing requirements explicit and enforceable against:
  - `guides/client/core/testing.md`
  - `guides/server/core/testing-service-layer.md`

**Non-Goals:**
- Cross-place or cross-organization grouped bookings.
- Broad redesign of unrelated reservation screens or support-chat domains.
- Removal of reservation-level chat or notification contracts used by single bookings.
- Re-architecting open play beyond compatibility with group-first reservation handling.

## Decisions

1. **Reservation group is the canonical lifecycle identity for grouped bookings**
   - Decision: Grouped flows use `reservationGroupId` as the primary UX and orchestration identity after creation.
   - Rationale: Matches cart expectations and removes post-checkout fragmentation.
   - Alternative rejected: Keeping grouped create but continuing per-item post-checkout handling preserves current confusion.

2. **Group payment is single action with atomic child transitions**
   - Decision: Add group payment submission contract that validates all payable children and updates atomically.
   - Rationale: Prevents mixed success states within one booking group.
   - Alternative rejected: Per-item payment for grouped bookings creates repeated user toil and inconsistent lifecycle semantics.

3. **Dual chat model for compatibility**
   - Decision: Add group chat endpoints/thread identity for grouped bookings while retaining reservation-level chat for legacy/single paths.
   - Rationale: Enables group-first UX without breaking existing surfaces and historical threads.
   - Alternative rejected: Full migration of all historical and single-booking chat to group identity increases risk and scope.

4. **Dual notification model for compatibility**
   - Decision: Add `reservation_group.*` lifecycle notification events and payload contracts, while keeping `reservation.*` for single bookings.
   - Rationale: Supports coherent grouped lifecycle messaging and safe rollout.
   - Alternative rejected: Reusing per-item `reservation.*` only keeps grouped bookings fragmented.

5. **Owner inbox representation is group-first**
   - Decision: Grouped bookings appear as a single actionable row/card with expandable child details in owner inbox surfaces.
   - Rationale: Mirrors owner operational intent (accept/reject/confirm as one decision).
   - Alternative rejected: Row-per-item with group metadata increases noise and accidental partial handling.

6. **Testing gates are first-class, not optional**
   - Decision: This change includes required task-level checks that enforce mirror-structured tests, AAA/TDD style, and layer-appropriate server tests per both testing guides.
   - Rationale: This change is cross-cutting and regression-prone; test rigor is part of acceptance criteria.
   - Alternative rejected: Ad-hoc or opportunistic tests would not protect compatibility guarantees.

## Risks / Trade-offs

- **[Risk] Incomplete transition to group identity leaves mixed UX paths** → Mitigation: define explicit entry/exit points where grouped flows MUST use group contracts and routes.
- **[Risk] Atomic group payment failures increase user-visible errors under race conditions** → Mitigation: reuse transaction boundaries and clear validation errors for single retry path.
- **[Risk] Notification event duplication during transition period** → Mitigation: strict routing rules: grouped bookings emit `reservation_group.*`; single bookings emit `reservation.*`.
- **[Risk] Chat migration confusion for old grouped reservations created pre-change** → Mitigation: maintain reservation-level chat compatibility and only apply group-thread semantics to group-aware entry points.
- **[Risk] Regression in single-reservation behavior** → Mitigation: mandatory compatibility tests and explicit unchanged-contract scenarios in specs.

## Migration Plan

1. Ship additive contracts and endpoints:
   - reservation group read/payment contracts
   - group chat contracts
   - group notification event contracts
2. Update player and owner grouped UX paths to prefer group-first routes/surfaces.
3. Update chat widget/inbox metadata flow to consume group-thread meta for grouped reservations.
4. Update notification dispatcher to handle new `reservation_group.*` payloads and links.
5. Validate via mandatory test matrix and parity smoke matrix before rollout.

Rollback strategy:
- Keep existing single-reservation routes/contracts intact throughout rollout.
- If grouped surfaces regress, disable group-first entry points and fall back to existing per-reservation handling without schema rollback.

## Open Questions

- Should owner history tabs display grouped bookings strictly as groups, or allow optional per-item expansion rows for historical analytics?
- For grouped bookings that include free + paid items, should group payment state expose one consolidated status label or itemized status chips in player summary by default?
