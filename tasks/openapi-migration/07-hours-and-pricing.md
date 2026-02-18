# Court Hours + Rate Rules

## Court hours

- `GET /api/mobile/v1/owner/courts/{courtId}/hours`
- `PUT /api/mobile/v1/owner/courts/{courtId}/hours`
- `POST /api/mobile/v1/owner/courts/{courtId}/hours:copy-from`

Maps to:
- `courtHours.get`
- `courtHours.set`
- `courtHours.copyFromCourt`

## Rate rules

- `GET /api/mobile/v1/owner/courts/{courtId}/rate-rules`
- `PUT /api/mobile/v1/owner/courts/{courtId}/rate-rules`
- `POST /api/mobile/v1/owner/courts/{courtId}/rate-rules:copy-from`

Maps to:
- `courtRateRule.get`
- `courtRateRule.set`
- `courtRateRule.copyFromCourt`
