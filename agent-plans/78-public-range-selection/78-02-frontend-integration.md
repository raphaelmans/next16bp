# Phase 2: Frontend Integration

Status: draft

## Objective

Replace single-slot selection in public month/day booking surfaces with a studio-like day timeline drag-range picker, while keeping the backend unchanged.

## References

- Month view wrapper: `src/shared/components/kudos/availability-month-view.tsx`
- Slot grid picker: `src/shared/components/kudos/time-slot-picker.tsx`
- Public schedule page: `src/app/(public)/courts/[id]/schedule/page.tsx`
- Public nested court page: `src/app/(public)/places/[placeId]/courts/[courtId]/court-detail-client.tsx`
- Motion docs: https://motion.dev/docs/react/motion-component

## Workstreams

### Shared / Contract

- [ ] Confirm which surfaces adopt drag-range selection in v1:
  - Option A (recommended): Month/day schedule surfaces only.
  - Option B: Also update the venue detail booking card.

### Server / Backend

- [ ] N/A.

### Client / Frontend

#### A) New Component

- [ ] Add `src/shared/components/kudos/time-range-picker.tsx`:
  - Render a vertical day grid with 60-minute rows.
  - Accept `slots: TimeSlot[]` and treat blocked slots as non-selectable.
  - Implement pointer drag selection with 60-minute snapping.
  - Use `motion` for selection preview (subtle opacity/scale) and respect `useReducedMotion()`.

#### B) Availability Data Shape

- [ ] Ensure availability queries used for the timeline are **60-minute** slots.
  - For pages that currently query with arbitrary `durationMinutes`, introduce a dedicated query for `durationMinutes=60` to populate the timeline.
  - Continue using the selected range to derive the booking payload duration.

#### C) Integrate Into Month/Day View

- [ ] Update `src/shared/components/kudos/availability-month-view.tsx` to:
  - Keep the month grid for selecting a day.
  - Render the selected day’s timeline on the right.
  - Replace per-day `TimeSlotPicker` lists with the timeline component.
  - Continue to expose `onSelectSlot` (or introduce `onSelectRange`) depending on how the API is revised.

#### D) Wire Consumers

- [ ] Update call sites to keep URL-driven state:
  - When range changes, set:
    - `startTime` = range start
    - `duration` = range duration
  - Clear selection when date changes.

Targets:

- `src/app/(public)/courts/[id]/schedule/page.tsx`
- `src/app/(public)/places/[placeId]/courts/[courtId]/court-detail-client.tsx`

## Acceptance Criteria

- Dragging a range on a selected day updates `startTime` + `duration` and enables CTA.
- Blocked slots prevent selection per Phase 1 decision.
- Month/day navigation remains stable and time zone correct.
