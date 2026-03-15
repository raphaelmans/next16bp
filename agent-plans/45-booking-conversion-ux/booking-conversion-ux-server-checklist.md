# Server Checklist - Booking Conversion UX

**Scope:** Backend-only changes for telemetry and logging.

---

## Setup

- [ ] Review `agent-plans/45-booking-conversion-ux/45-02-telemetry.md` requirements.
- [ ] Confirm no PII is included in tracking payloads.

## Implementation

- [ ] Create `POST /api/public/track` route (`src/app/api/public/track/route.ts`).
- [ ] Add Zod schema for payload validation (event name + properties).
- [ ] Use `handleError` + `wrapResponse` patterns for responses.
- [ ] Log events with `logger.info({ event: "funnel.*", ... })` and include `requestId`.
- [ ] Ensure `requestId` sourced from header or `crypto.randomUUID()`.

## Validation

- [ ] Send sample request via curl/Postman and confirm 200 + `data` payload.
- [ ] Confirm invalid payload returns `VALIDATION_ERROR`.
- [ ] Verify logs include `event` and `requestId` fields.
