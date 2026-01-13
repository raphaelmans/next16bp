# Developer 1 Checklist

**Focus Area:** Owner bulk slot publishing via court hours  
**Modules:** 1A, 1B, 1C

---

## Module 1A: Bulk Slot Modal UI

**Reference:** `18-01-bulk-slot-modal-hours.md`  
**Dependencies:** None

### Implementation

- [ ] Remove time inputs from `BulkSlotModal`
- [ ] Add `hoursWindows` prop
- [ ] Render hours summary by selected dates
- [ ] Update preview text + trimming notice
- [ ] Disable submit when 0 slots

---

## Module 1B: Slot Generator

**Reference:** `18-01-bulk-slot-modal-hours.md`

### Implementation

- [ ] Update `BulkSlotData` type
- [ ] Implement hours-based slot generation
- [ ] Apply deterministic trim to 100
- [ ] Return trim metadata from mutation

---

## Module 1C: Call-Site Wiring

**Reference:** `18-01-bulk-slot-modal-hours.md`

### Implementation

- [ ] Pass `hours` into `BulkSlotModal` callers
- [ ] Update success toast messaging
- [ ] Keep pricing error handling unchanged

---

## Testing

- [ ] Preview matches actual created slots
- [ ] Multi-window day generation works
- [ ] Recurring skip logic works

---

## Final Checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
