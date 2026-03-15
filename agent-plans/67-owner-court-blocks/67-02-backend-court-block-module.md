# Phase 2: Backend Court Block Module

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-05-03, US-05-04

---

## Objective

Expose owner-protected APIs to create/list/cancel blocks and enforce hard no-overlap rules.

---

## Modules

### Module 2A: `courtBlock` router

Directory:

```
src/modules/court-block/
├── court-block.router.ts
├── dtos/
├── errors/
├── repositories/
└── services/
```

Endpoints (tRPC)

| Procedure | Type | Input | Output |
|----------|------|-------|--------|
| `courtBlock.listForCourtRange` | Query | `{ courtId, startTime, endTime }` | `CourtBlock[]` |
| `courtBlock.createMaintenance` | Mutation | `{ courtId, startTime, endTime, reason? }` | `CourtBlock` |
| `courtBlock.createWalkIn` | Mutation | `{ courtId, startTime, endTime, note? }` | `CourtBlock` |
| `courtBlock.cancel` | Mutation | `{ blockId }` | `CourtBlock` |

Access
- `protectedProcedure`
- Verify court ownership (reuse pattern from `CourtHoursService.verifyCourtOwnership`)

### Module 2B: Overlap enforcement

In service layer, on create:
- Reject if overlaps any active reservation:
  - `reservationRepository.findOverlappingActiveByCourtIds([courtId], start, end)`
- Reject if overlaps any active block:
  - `courtBlockRepository.findOverlappingByCourtIds([courtId], start, end)` filtering `isActive`

### Walk-in price snapshot

Walk-in blocks must store price at creation time:
- Compute via schedule:
  - Load place time zone
  - Load hours windows + rate rules + price overrides
  - Use shared schedule pricing computation
- Reject if schedule does not price the requested range
- Reject if duration is not a multiple of 60 minutes

---

## Error Handling

Add domain errors:
- `CourtBlockOverlapError`
- `CourtBlockOverlapsReservationError`
- `CourtBlockPricingUnavailableError`
- `CourtBlockDurationInvalidError`

Map to user-safe messages (no internal SQL shown).

---

## Testing Checklist

- [ ] Owner can list blocks for a date range
- [ ] Owner can create maintenance block
- [ ] Owner can create walk-in block (price computed)
- [ ] Creating a block that overlaps a reservation fails
- [ ] Creating a block that overlaps a block fails
- [ ] Cancelling a block sets inactive fields and no longer blocks availability
