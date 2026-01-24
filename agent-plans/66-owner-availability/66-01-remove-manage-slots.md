# Phase 1: Remove Manage Slots + Redirects

**Dependencies:** none
**Parallelizable:** Yes

## Objective

Remove all UI that depends on `time_slot` materialization and replace it with an owner availability entry point.

## Scope

### Remove legacy owner slot UI

- Delete/retire slot components/hooks that call `trpc.timeSlot.*`:
  - `src/features/owner/hooks/use-slots.ts`
  - `src/features/owner/components/bulk-slot-modal.tsx`
  - `src/features/owner/components/calendar-navigation.tsx`
  - `src/features/owner/components/slot-list.tsx`
  - `src/features/owner/components/slot-item.tsx`
- Remove exports so nothing can import them:
  - `src/features/owner/hooks/index.ts`
  - `src/features/owner/components/index.ts`

### Replace Manage Slots routes with redirects

- `src/app/(owner)/owner/courts/[id]/slots/page.tsx` → redirect to `/owner/courts/[id]/availability`
- `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/slots/page.tsx` → redirect to `/owner/venues/[placeId]/courts/[courtId]/availability`
- `src/app/(owner)/owner/venues/[placeId]/courts/[courtId]/slots/page.tsx` → redirect to `/owner/venues/[placeId]/courts/[courtId]/availability`

### Update navigation entry points

- Replace "Manage Slots" with "Availability" and update hrefs:
  - `src/features/owner/components/courts-table.tsx`
  - `src/features/owner/components/owner-sidebar.tsx`
  - `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx`
  - `src/shared/lib/app-routes.ts`

## Testing Checklist

- [ ] Owner courts dropdown has "Availability" instead of "Manage Slots".
- [ ] Owner sidebar court links land on the Availability page.
- [ ] Visiting any old `/slots` route redirects.
