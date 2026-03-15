# Developer Checklist (Dev1)

**Focus Area:** Player My Reservations tabs correctness + accessibility

---

## Backend

- [ ] Add `reservation.getMyWithDetails` endpoint
- [ ] Add repository method for JOINed slot + court + place fields
- [ ] Ensure `slotStartTime`/`slotEndTime` are ISO strings

## Frontend

- [ ] Update `useMyReservations` + `useReservationCounts` to use the enriched endpoint
- [ ] Remove placeholder `timeSlot.startTime/endTime = createdAt`
- [ ] Render list inside `TabsContent` panels to satisfy Radix ARIA
- [ ] Confirm Upcoming/Past/Cancelled filtering definitions

## Validation

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
