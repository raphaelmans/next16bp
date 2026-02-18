# Venues (Places) - Owner Management

## Terminology

- Mobile uses `venue`.
- Web code uses `place`.
- REST paths should prefer `venues` for product clarity.

## Endpoints (proposed)

- `GET /api/mobile/v1/owner/organizations/{organizationId}/venues`
- `POST /api/mobile/v1/owner/organizations/{organizationId}/venues`
- `GET /api/mobile/v1/owner/venues/{venueId}`
- `PATCH /api/mobile/v1/owner/venues/{venueId}`
- `DELETE /api/mobile/v1/owner/venues/{venueId}`

Photos:

- `POST /api/mobile/v1/owner/venues/{venueId}/photos` (multipart)
- `DELETE /api/mobile/v1/owner/venues/{venueId}/photos/{photoId}`
- `POST /api/mobile/v1/owner/venues/{venueId}/photos:reorder`

## Maps to (tRPC)

- `placeManagement.list`
- `placeManagement.create`
- `placeManagement.getById`
- `placeManagement.update`
- `placeManagement.delete`
- `placeManagement.uploadPhoto`
- `placeManagement.removePhoto`
- `placeManagement.reorderPhotos`
