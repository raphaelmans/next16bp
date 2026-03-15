# Phase 3: Client Updates

**Dependencies:** Phase 2 complete  
**Parallelizable:** Yes  
**User Stories:** 05-availability-management

---

## Objective

Update the bulk slot hook and owner UI messaging to reflect best-effort insert results and skipped counts.

---

## Module 3A: Slot hook + toast messaging

**Reference:** `62-00-overview.md`

### Directory Structure

```
src/features/owner/hooks/use-slots.ts
src/app/(owner)/owner/courts/[id]/slots/page.tsx
```

### Flow Diagram

```
BulkSlotModal
  │ submit
  ▼
useCreateBulkSlots
  │
  ▼
toast: created + skipped counts
```

### Implementation Steps

1. Extend `BulkSlotResult` to include skip counts.
2. Map the new server response in `useCreateBulkSlots`.
3. Update success toast to show created + skipped details.
4. Keep modal open if zero slots were created.

### Testing Checklist

- [ ] Toast includes skipped pricing/conflict counts.
- [ ] Modal closes only when slotsCreated > 0.

---

## Phase Completion Checklist

- [ ] Hook updated
- [ ] UI messaging updated
