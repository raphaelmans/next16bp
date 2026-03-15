# Phase 1: Bulk Slot Derivation

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** `US-05-01`, `US-14-09`

---

## Objective

Remove manual time inputs in the bulk slot modal and derive 60-minute slots from court hours windows. Skip dates without windows and auto-trim bulk creation to 100 slots.

---

## Modules

### Module 1A: Bulk Slot Modal UI

**User Story:** `US-05-01`  
**Reference:** `18-01-bulk-slot-modal-hours.md`

#### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Date | date | Yes | Must be selected |
| Start Date | date | Recurring | <= End Date |
| End Date | date | Recurring | >= Start Date |
| Days of Week | multi-select | Recurring | At least 1 day |

#### UI Layout

```
┌─────────────────────────────────────────────┐
│  Create Time Slots                          │
│  Create one or more 60-minute slots...      │
│                                             │
│  Slot Type: (Single | Recurring)            │
│  Date / Start Date + End Date               │
│  Days of Week (if recurring)                │
│                                             │
│  Using court hours                          │
│  Mon 08:00–12:00, 14:00–18:00               │
│  Wed — no hours                             │
│                                             │
│  Preview                                    │
│  Total: 100 slots (trimmed from 140)        │
│                                             │
│  [Cancel]                      [Create]     │
└─────────────────────────────────────────────┘
```

#### Implementation Steps

1. Remove `Start Time` and `End Time` inputs from `BulkSlotModal`.
2. Add `hoursWindows` prop with `{ dayOfWeek, startMinute, endMinute }`.
3. Render a read-only hours summary for the selected date(s).
4. Update preview to use hours-derived slot counts, with auto-trim messaging.
5. Disable submit when preview total is 0.

---

### Module 1B: Bulk Slot Generator

**User Story:** `US-05-01`

#### Flow Diagram

```
Select date(s)
   │
   ▼
Match court_hours_window by weekday
   │
   ├─ No windows → skip day
   ▼
Generate 60-min slots per window
   │
   ▼
Sort chronologically
   │
   ▼
Trim to 100 if needed
   │
   ▼
Submit timeSlot.createBulk
```

#### Implementation Steps

1. Update `BulkSlotData` to remove time fields and include `hoursWindows`.
2. Implement `generateSlotsFromCourtHours(...)` in `use-slots.ts`.
3. Ensure chronological ordering and deterministic auto-trim.
4. Return `totalGenerated` + `wasTrimmed` from mutation for toast handling.

---

### Module 1C: Call-site Wiring + Toasts

**User Story:** `US-14-09`

#### Implementation Steps

1. Pass `hours` from `useCourtHours` into `BulkSlotModal`.
2. Update success toast to mention trim when applicable.
3. Keep error handling for `SLOT_PRICING_UNAVAILABLE` unchanged.

---

## Testing Checklist

- [ ] Single-day slot generation uses hours windows
- [ ] Recurring days skip missing windows
- [ ] Auto-trim caps to 100 slots with toast messaging
- [ ] Create button disabled when no hours

---

## Handoff Notes

- Ensure `BulkSlotModal` preview matches mutation generation output.
- Confirm no changes to `timeSlot.createBulk` API schema.
