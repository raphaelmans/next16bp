## 1. OpenSpec Artifacts

- [ ] 1.1 Finalize proposal/design/spec deltas for canonical owner grouped-detail routing
- [ ] 1.2 Validate change status shows proposal, design, specs, and tasks as complete

## 2. Owner Routing Canonicalization

- [ ] 2.1 Update owner grouped lifecycle notification links to use `reservationDetail(representativeReservationId)`
- [ ] 2.2 Remove owner UI links that intentionally navigate to `reservationGroupDetail`
- [ ] 2.3 Implement compatibility redirect from `/organization/reservations/group/:groupId` to `/organization/reservations/:representativeReservationId`

## 3. Verification

- [ ] 3.1 Add or update unit tests for grouped owner notification deep-link outputs
- [ ] 3.2 Add or update route behavior coverage for legacy group URL redirect
- [ ] 3.3 Run `pnpm lint` and execute manual smoke checks for tables, alerts, notifications, and direct legacy URLs
