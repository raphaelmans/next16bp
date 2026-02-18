# Courts - Owner Management

## Endpoints (proposed)

- `GET /api/mobile/v1/owner/venues/{venueId}/courts`
- `POST /api/mobile/v1/owner/venues/{venueId}/courts`
- `GET /api/mobile/v1/owner/courts/{courtId}`
- `PATCH /api/mobile/v1/owner/courts/{courtId}`

## Maps to (tRPC)

- `courtManagement.listByPlace`
- `courtManagement.create`
- `courtManagement.getById`
- `courtManagement.update`
