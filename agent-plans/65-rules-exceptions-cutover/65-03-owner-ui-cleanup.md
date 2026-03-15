# Phase 3: Owner UI Cleanup

**Dependencies:** Phase 2 (timeSlot module removed)

---

## Objective

Remove the owner "Manage Slots" UX and guide owners to the new system:

- Schedule & Pricing defines availability.
- Reservations pages handle bookings.

---

## Module 3A: Remove/redirect owner slots pages

Targets:

- `src/app/(owner)/owner/courts/[id]/slots/page.tsx`
- `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/slots/page.tsx`
- `src/app/(owner)/owner/venues/[placeId]/courts/[courtId]/slots/page.tsx`

Replace with:

- redirect to `.../schedule` (or a short page that links to Schedule + Bookings)

Delete unused UI:

- `src/features/owner/components/bulk-slot-modal.tsx`
- `src/features/owner/components/slot-list.tsx`
- `src/features/owner/components/calendar-navigation.tsx`
- `src/features/owner/hooks/use-slots.ts`

---

## Module 3B: Update navigation

Update links referencing "slots":

- `src/features/owner/components/courts-table.tsx` dropdown
- `src/features/owner/components/owner-sidebar.tsx` nested court links
- `src/shared/lib/app-routes.ts` remove `owner.*.slots` route helpers

---

## Testing Checklist

- [ ] No owner UI routes render the removed slots components.
- [ ] Owner can still configure schedule and manage reservations.
