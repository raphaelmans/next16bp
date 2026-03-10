# Public API Read And Write Smoke Flow

## Purpose

After the dashboard is green, validate the public developer API from outside the browser:

1. Write one temporary unavailability window
2. Read it back through the public availability endpoint
3. Delete it immediately
4. Read again to confirm cleanup

This proves that the public contract works with the same integration, key, and mapping the operator configured in the dashboard.

## Required Inputs

- `API_KEY`: the one-time secret from key creation
- `EXTERNAL_COURT_ID`: the mapped external court id
- `EXTERNAL_WINDOW_ID`: a unique id for the temporary sync window
- `DATE`: the day to inspect with the public availability read
- `START_TIME` and `END_TIME`: the unavailability window for the write smoke

## Public Routes

- Read:
  - `GET /api/developer/v1/courts/:externalCourtId/availability`
- Write:
  - `PUT /api/developer/v1/courts/:externalCourtId/unavailability/:externalWindowId`
- Cleanup:
  - `DELETE /api/developer/v1/courts/:externalCourtId/unavailability/:externalWindowId`

## Scope Requirements

- Read requires `availability.read`
- Write and cleanup require `availability.write`

## Command Templates

### 1. Create the temporary unavailability window

```bash
curl -sS -i -X PUT \
  "http://localhost:3000/api/developer/v1/courts/$EXTERNAL_COURT_ID/unavailability/$EXTERNAL_WINDOW_ID" \
  -H "X-API-Key: $API_KEY" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  --data "{
    \"startTime\": \"$START_TIME\",
    \"endTime\": \"$END_TIME\",
    \"reason\": \"Smoke test\"
  }"
```

Expected result:

- `200 OK`
- wrapped JSON payload
- `status: "ACTIVE"`
- `courtBlockId` present
- `x-request-id` header present

### 2. Read availability through the public API

```bash
curl -sS -i \
  "http://localhost:3000/api/developer/v1/courts/$EXTERNAL_COURT_ID/availability?date=$DATE&durationMinutes=60&includeUnavailable=true" \
  -H "X-API-Key: $API_KEY" \
  -H "Accept: application/json"
```

Expected result:

- `200 OK`
- wrapped JSON payload
- the written slot appears in `options`
- the slot reflects the temporary block

In the validated local run, the written slot came back as:

- `status: "BOOKED"`
- `unavailableReason: "MAINTENANCE"`

### 3. Delete the temporary window

```bash
curl -sS -i -X DELETE \
  "http://localhost:3000/api/developer/v1/courts/$EXTERNAL_COURT_ID/unavailability/$EXTERNAL_WINDOW_ID" \
  -H "X-API-Key: $API_KEY" \
  -H "Accept: application/json"
```

Expected result:

- `200 OK`
- wrapped JSON payload
- `success: true`
- `status: "CANCELED"`

### 4. Read again to confirm cleanup

Run the same public read once more. The temporary slot should return to its normal availability state.

## Safety Rules

- Always use a unique `EXTERNAL_WINDOW_ID` for smoke validation.
- Always run the matching `DELETE` after a successful `PUT`.
- Do not rely on the dashboard for write execution; the current product intentionally keeps browser-side validation read-only.
- If a public read without `X-API-Key` returns `401 DEVELOPER_API_KEY_INVALID`, that is expected.
