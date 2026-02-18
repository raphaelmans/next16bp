# Owner Reservations (Inbox + Actions)

Source UX contract:
- `/Users/raphaelm/Documents/Coding/kudoscourts-expo/aidocs/owner/04-reservations-inbox.md`
- `/Users/raphaelm/Documents/Coding/kudoscourts-expo/aidocs/owner/05-reservation-detail-actions.md`
- `/Users/raphaelm/Documents/Coding/kudoscourts-expo/aidocs/shared/00-reservation-state-machine.md`

## Endpoints (proposed)

List + counts:

- `GET /api/mobile/v1/owner/organizations/{organizationId}/reservations`
- `GET /api/mobile/v1/owner/organizations/{organizationId}/reservations/pending-count`

Actions:

- `POST /api/mobile/v1/owner/reservations/{reservationId}/accept`
- `POST /api/mobile/v1/owner/reservations/{reservationId}/reject`
- `POST /api/mobile/v1/owner/reservations/{reservationId}/confirm-payment`
- `POST /api/mobile/v1/owner/reservations/{reservationId}/confirm-paid-offline`

Court-scoped:

- `GET /api/mobile/v1/owner/courts/{courtId}/reservations/pending`
- `GET /api/mobile/v1/owner/courts/{courtId}/reservations/active?startTime=...&endTime=...`

Maps to (tRPC)

- `reservationOwner.getForOrganization`
- `reservationOwner.getPendingCount`
- `reservationOwner.accept`
- `reservationOwner.reject`
- `reservationOwner.confirmPayment`
- `reservationOwner.confirmPaidOffline`
- `reservationOwner.getPendingForCourt`
- `reservationOwner.getActiveForCourtRange`
