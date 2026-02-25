## Context

Current reservation flows are single-court centric (`createForCourt` / `createForAnyCourt`) and downstream owner handling, listing, and status transitions assume one reservation row per checkout. The requested behavior requires a player to book multiple courts in one request, including different time ranges per court, and to let owners process the full set coherently. The existing data and API surface must remain backward compatible to avoid regressions.

## Goals / Non-Goals

**Goals:**
- Add grouped reservation creation with multiple item rows in one atomic transaction.
- Keep existing single-court APIs and UI behavior working unchanged.
- Add owner group actions (accept/reject/confirm) that apply atomically to grouped items.
- Expose grouped reads for player and owner views.
- Add regression-first tests across domain helpers, service layer, and router contracts.

**Non-Goals:**
- Redesign reservation chat/open play around group threads in this change.
- Support cross-place or cross-organization grouped bookings.
- Introduce per-item owner override semantics inside the same group.

## Decisions

1. **Bundle + items data model**
   - Decision: Add `reservation_group` table and optional `reservation.groupId`.
   - Rationale: Preserves current one-row-per-slot architecture and minimizes breakage in modules that expect reservation rows.
   - Alternative rejected: storing `courtIds` arrays in a single reservation row creates large compatibility and query complexity.

2. **Atomic transactional semantics**
   - Decision: Group creation and owner group actions run in a single transaction with in-tx rechecks/locks.
   - Rationale: Prevents partial success and state drift under race conditions.
   - Alternative rejected: best-effort per-item processing leads to mixed states and complicated recovery.

3. **Backward compatibility first**
   - Decision: Keep `createForCourt` and `createForAnyCourt` intact; add new grouped endpoint and DTOs.
   - Rationale: Existing clients and deep links continue to work while new grouped path is introduced incrementally.

4. **Pure shared domain helpers**
   - Decision: Add deterministic reservation group calculations and invariants in shared domain helper files.
   - Rationale: Aligns with core domain logic/testing guides and enables table-driven unit coverage.

## Risks / Trade-offs

- **[Risk] Concurrency conflicts during multi-item create** → Mitigation: pre-check + transactional recheck with court/time locking patterns already used in reservation flows.
- **[Risk] Owner action partial updates** → Mitigation: lock all child reservations first, validate all, then write all transitions in one transaction.
- **[Risk] Regression in legacy lists/details** → Mitigation: preserve existing DTO fields and include compatibility tests for `groupId = null`.
- **[Risk] Frontend complexity for mixed-time item UX** → Mitigation: keep first iteration focused on deterministic payload and summary rendering, without broad redesign.
