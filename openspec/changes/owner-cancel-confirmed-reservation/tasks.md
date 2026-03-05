## 1. Backend DTOs

- [x] 1.1 Add `CancelReservationOwnerSchema` and `CancelReservationGroupOwnerSchema` to `src/lib/modules/reservation/dtos/reservation-owner.dto.ts`

## 2. Backend Service

- [x] 2.1 Add `cancelReservation` and `cancelReservationGroup` to `IReservationOwnerService` interface in `src/lib/modules/reservation/services/reservation-owner.service.ts`
- [x] 2.2 Implement `cancelReservation` method (CONFIRMED-only gate, audit event, notification, logging)
- [x] 2.3 Implement `cancelReservationGroup` method (group loading, per-reservation validation, batch audit events)

## 3. Backend Router

- [x] 3.1 Add `cancel` and `cancelGroup` tRPC routes to `src/lib/modules/reservation/reservation-owner.router.ts`

## 4. Frontend API Hooks

- [x] 4.1 Add `mutReservationOwnerCancel` and `mutReservationOwnerCancelGroup` to `src/features/owner/api.ts` + `useMutCancelReservation` hook in `src/features/owner/hooks/reservations.ts`

## 5. Booking Studio Store + Types

- [x] 5.1 Add `groupId` to `ReservationItem` type in `src/features/owner/components/booking-studio/types.ts`
- [x] 5.2 Add `selectedReservation` state to booking studio store in `src/features/owner/stores/booking-studio-store.ts`
- [x] 5.3 Provider already exposes all store state via `useBookingStudio` selector — no changes needed

## 6. Timeline Click Handler

- [x] 6.1 Add `onSelectReservation` prop to `OwnerAvailabilityWeekGrid` in `src/features/owner/components/booking-studio/owner-availability-week-grid.tsx`
- [x] 6.2 Pass `onClick` to `TimelineReservationItem` for each reservation

## 7. Cancel Reservation Dialog

- [x] 7.1 Create `src/features/owner/components/booking-studio/cancel-reservation-dialog.tsx` with reservation details, required reason textarea, single cancel, and group cancel actions

## 8. Availability Studio Wiring

- [x] 8.1 Wire `onSelectReservation` handler and render `CancelReservationDialog` in `src/features/owner/components/availability-studio/availability-studio-coordinator.tsx`

## 9. Ensure groupId in Query Response

- [x] 9.1 Verified `groupId` is in `ReservationRecord` (Drizzle schema) and returned from `getActiveForCourtRange` — cast as `ReservationItem[]` picks it up

## 10. Validation

- [x] 10.1 Run `pnpm lint` — no new errors from changed files (35 pre-existing errors unrelated to this change)
