# Owner Court Blocks - Dev 1 Checklist

**Focus Area:** Backend + schema + owner UI wiring  
**Plan:** `agent-plans/67-owner-court-blocks/67-00-overview.md`

---

## Phase 1: Schema

- [ ] Add `court_block_type` enum
- [ ] Extend `court_block` with type, revenue snapshot, and soft-cancel fields
- [ ] Add duration multiple-of-60 constraint
- [ ] Add no-overlap exclusion constraint (active blocks only)
- [ ] Backfill defaults for existing rows

## Phase 2: Backend

- [ ] Add `courtBlock` DTOs + errors
- [ ] Implement `CourtBlockService` with ownership + overlap checks
- [ ] Implement `courtBlock` tRPC router and register it
- [ ] Ensure walk-in creation computes price from schedule and rejects if unavailable

## Phase 3: Owner UI

- [ ] Add blocks query + list UI on owner availability page
- [ ] Add "Add maintenance block" modal
- [ ] Add "Add walk-in booking" modal
- [ ] Add "Mark as booked (walk-in)" action from selected availability option
- [ ] Invalidate availability + blocks queries after mutations

## Verification

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
