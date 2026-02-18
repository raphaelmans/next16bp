# Guest Bookings + Walk-ins

## Endpoints (proposed)

- `POST /api/mobile/v1/owner/reservations/guest-booking`
- `POST /api/mobile/v1/owner/blocks/{blockId}/convert-to-guest`

Maps to (tRPC)

- `reservationOwner.createGuestBooking`
- `reservationOwner.convertWalkInBlockToGuest`
