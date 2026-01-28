# Phase 3: Drag To Move / Resize Existing Blocks (Gated)

**Dependencies:** Phase 2 complete  
**Parallelizable:** No (backend contract required)  
**User Stories:** 05-03, 05-04

---

## Objective

Enable “true editor” interactions:

- Drag an existing block to a new time.
- Resize a block via top/bottom handles.

This phase requires a backend endpoint to update time ranges safely.

---

## Endpoint (Planned)

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `courtBlock.updateRange` | mutation | `{ blockId, startTime, endTime }` | `CourtBlockRecord` |

Rules:

- Verify court ownership.
- Validate range (end > start, duration multiple-of-60 for v1).
- Overlap checks must exclude the block being updated.
- Preserve `type`, `totalPriceCents`, `currency` semantics:
  - For `WALK_IN`, decide whether price re-computes or stays snapshot (recommend: keep snapshot for now).

---

## UI Behavior

- Move:
  - Block body is draggable.
  - Drop on a timeline cell -> new start = cell start, end = start + duration.
- Resize:
  - Top handle adjusts start.
  - Bottom handle adjusts end.
  - Drop on a timeline cell snaps to hour.

Error handling:

- If update fails (conflict), revert UI and show toast.

---

## Workstreams

### Shared / Contract

- [ ] Define `UpdateCourtBlockRangeSchema` (Zod) and error mapping.

### Server / Backend

- [ ] Add `courtBlock.updateRange` DTO + router.
- [ ] Implement service method with overlap checks excluding current block.

### Client / Frontend

- [ ] Make existing blocks draggable.
- [ ] Add resize handles and separate draggable ids for handles.
- [ ] Wire drop -> updateRange -> invalidate.
