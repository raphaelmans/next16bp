# Phase 1: Telemetry Baseline (Log-Only)

**Dependencies:** None  
**Parallelizable:** Yes

---

## Objective

Add minimal, structured funnel events so we can compare conversion before/after UX changes without adopting an analytics vendor.

---

## Event Schema

Events are structured logs (server where possible). No PII.

Minimum event list:
- `funnel.landing_search_submitted` (client)
- `funnel.discovery_place_clicked` (client)
- `funnel.schedule_slot_selected` (client)
- `funnel.reserve_clicked` (client)
- `funnel.login_started` (client)
- `funnel.login_succeeded` (server already logs `user.logged_in`)
- `reservation.created` (server already logs)

Properties (examples):
- `requestId` (prefer server context when available)
- `placeId`, `courtId`
- `mode`, `durationMinutes`
- `dayKey` or `startTime`

---

## Implementation Options

### Option A (Recommended): Public route handler

- Add `POST /api/public/track` that logs the payload.
- Validate payload with Zod.
- Use existing logger (`src/shared/infra/logger/index.ts`).

### Option B: Client-only logs

- Use `console.info` only in dev.
- Not recommended for real funnel analysis.

---

## Success Criteria

- [ ] Event payload is validated.
- [ ] No emails/phones in payload.
- [ ] Logs are queryable by `event`.
