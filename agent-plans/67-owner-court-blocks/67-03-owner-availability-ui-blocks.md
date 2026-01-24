# Phase 3: Owner Availability UI - Blocks

**Dependencies:** Phase 2 contracts complete  
**Parallelizable:** Yes  
**User Stories:** US-05-03, US-05-04

---

## Objective

Give owners a UI to create/list/cancel maintenance and walk-in blocks directly from the availability month view.

---

## Page Location

Add to existing owner availability page:
- `/owner/places/[placeId]/courts/[courtId]/availability`

---

## UI Additions

### Actions

- "Add maintenance block" (custom start/end + reason)
- "Add walk-in booking" (custom start/end + note)
- "Mark as booked (walk-in)" on a selected availability option (uses option start/end)

### Blocks Panel

- List blocks for the selected day (or visible range)
- Show:
  - Start/end (place time zone)
  - Type badge (Maintenance / Walk-in)
  - Reason/note
  - Walk-in price snapshot (gross revenue)
- Provide "Cancel" action

---

## UX Notes

- Walk-in creation should be optimized for fast front-desk use (few clicks).
- After create/cancel, invalidate and refetch:
  - `availability.getForCourtRange`
  - `courtBlock.listForCourtRange`

---

## Validation

- Enforce owner-side form validation (basic) but rely on server for final overlap validation.
- Duration for walk-in must be multiples of 60 minutes.

---

## Testing Checklist

- [ ] Create maintenance block and see availability update
- [ ] Create walk-in block and see availability update
- [ ] Cancel block and see availability restored
- [ ] Overlap errors display clearly
