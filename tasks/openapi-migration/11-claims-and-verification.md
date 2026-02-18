# Claims + Verification (Owner)

## Claim requests

Endpoints (proposed):

- `POST /api/mobile/v1/owner/claims`
- `POST /api/mobile/v1/owner/removals`
- `POST /api/mobile/v1/owner/claims/{requestId}/cancel`
- `GET /api/mobile/v1/owner/claims`
- `GET /api/mobile/v1/owner/claims/{requestId}`

Maps to:

- `claimRequest.submitClaim`
- `claimRequest.submitRemoval`
- `claimRequest.cancel`
- `claimRequest.getMy`
- `claimRequest.getById`

## Place verification

Endpoints (proposed):

- `GET /api/mobile/v1/owner/venues/{venueId}/verification`
- `POST /api/mobile/v1/owner/venues/{venueId}/verification/submit` (multipart)
- `POST /api/mobile/v1/owner/venues/{venueId}/reservations:toggle`

Maps to:

- `placeVerification.getByPlace`
- `placeVerification.submit`
- `placeVerification.toggleReservations`
