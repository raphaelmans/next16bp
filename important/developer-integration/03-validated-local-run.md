# Validated Local Run

## Environment

- App target: `http://localhost:3000`
- Validation date: March 10, 2026 UTC
- Result: successful owner dashboard setup plus successful public write/read/cleanup cycle

## Owner Artifacts

- Organization ID: `e47fd0d3-ca5e-46c2-aab4-86b9d80e3548`
- Integration name: `Codex Smoke 20260310183830`
- Integration ID: `2980bea0-f0d8-4e5a-b258-902a42616320`
- Key name: `Codex Smoke Key 20260310183830`
- Key ID: `6ec46f23-e740-4812-a32f-50814c653bbc`
- Key prefix: `kudos_live_77f46e996db4`
- Full secret: intentionally omitted from this doc
- Mapping ID: `b19c4e35-1fa5-49e4-a7d7-d3a1d5f2439d`
- Internal court ID: `049f3eba-8720-4da5-8247-9d9d46d275a2`
- External court ID: `codex-ext-20260310183830`

## Dashboard Validation

- Precheck result: `PASS`
- Precheck summary: `5 pass / 0 warn / 0 fail`
- Guided console request id: `066d5930-a0b3-41a5-9b71-43385d5c0b95`
- Guided console date: `2026-03-12T01:00:00.000Z`
- Guided console duration: `60`
- Guided console outcome: live availability read succeeded and returned available options for `Court 1`

## Public API Validation

### Write

- Route:
  - `PUT /api/developer/v1/courts/codex-ext-20260310183830/unavailability/codex-window-20260310183830`
- Request id: `abeb2bf2-f897-48b1-a879-da3464f265a9`
- Result:
  - `200 OK`
  - `status: "ACTIVE"`
  - `courtBlockId: b9e22a98-d53b-48d1-a65e-28f5a0acdae7`

### Read after write

- Route:
  - `GET /api/developer/v1/courts/codex-ext-20260310183830/availability?date=2026-03-12T01:00:00.000Z&durationMinutes=60&includeUnavailable=true`
- Request id: `311c223f-9a4d-41bb-baa8-a243ed816ebf`
- Result:
  - `200 OK`
  - slot `2026-03-12T01:00:00.000Z` to `2026-03-12T02:00:00.000Z`
  - `status: "BOOKED"`
  - `unavailableReason: "MAINTENANCE"`

### Cleanup delete

- Route:
  - `DELETE /api/developer/v1/courts/codex-ext-20260310183830/unavailability/codex-window-20260310183830`
- Request id: `9aef2c40-cbac-490a-a23b-379f5496c149`
- Result:
  - `200 OK`
  - `success: true`
  - `status: "CANCELED"`

### Read after cleanup

- Request id: `edce0034-74dc-4aeb-8948-24152a6ba85b`
- Result:
  - `200 OK`
  - the same `01:00-02:00` slot returned to `AVAILABLE`

## Practical Takeaways

- The owner dashboard configuration and the public developer API are aligned.
- The guided console is enough to prove the safe read path internally.
- A real external write can be validated without changing dashboard behavior, as long as the smoke write is cleaned up immediately.
