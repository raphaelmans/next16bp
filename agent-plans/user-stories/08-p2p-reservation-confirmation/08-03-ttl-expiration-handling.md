# US-08-03: TTL Expiration Handling

**Status:** Active  
**Domain:** 08-p2p-reservation-confirmation  
**PRD Reference:** Section 8.4 (TTL Rules)

---

## Story

As the **system**, I need to **handle expired reservations correctly** so that **slots are released for other players and users see appropriate messaging**.

---

## Context

The backend cron job already exists to expire stale reservations. This parent story ensures the full expiration flow works end-to-end, including UI states for expired reservations.

**TTL Rules (Per PRD Section 8.4):**
- Payment window: 15 minutes
- Expiration statuses: `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`
- On expire: Slot released (`AVAILABLE`), reservation `EXPIRED`
- Triggered by: SYSTEM (cron job)

---

## Sub-Stories

| ID | Story | Focus | Priority |
|----|-------|-------|----------|
| US-08-03-01 | Verify Cron Job E2E | Test cron endpoint, configure Vercel | High |
| US-08-03-02 | Expired Reservation UI States | Frontend messaging for expired reservations | High |

---

## Current Implementation State

### Already Implemented

| Component | Status | Location |
|-----------|--------|----------|
| Cron endpoint | Complete | `/api/cron/expire-reservations` |
| Expiration logic | Complete | Finds expired, updates status, releases slot |
| Audit trail | Complete | Creates `reservation_event` with `triggeredByRole: SYSTEM` |
| `expiresAt` field | Complete | Set on paid reservation create |

### Not Yet Implemented

| Component | Status | Notes |
|-----------|--------|-------|
| Vercel cron config | Missing | Need `vercel.json` configuration |
| E2E verification | Missing | Need to test full flow |
| Frontend expired states | Missing | UI for expired reservations |

---

## Cron Job Details

**Endpoint:** `GET /api/cron/expire-reservations`

**Logic:**
1. Find reservations where `expiresAt < NOW()` and status is `AWAITING_PAYMENT` or `PAYMENT_MARKED_BY_USER`
2. For each expired reservation:
   - Update reservation status to `EXPIRED`
   - Release time slot (status → `AVAILABLE`)
   - Create audit event with `triggeredByRole: SYSTEM`

**Security:**
- Protected by `CRON_SECRET` environment variable
- Unauthorized requests return 401

**Source:** `src/app/api/cron/expire-reservations/route.ts`

---

## Implementation Order

1. **US-08-03-01** - Verify cron job works, add Vercel config
2. **US-08-03-02** - Frontend expired states

---

## Acceptance Criteria (Parent Story)

### Expired Reservations Handled

- Given a reservation has expired (`expiresAt` in past)
- When the cron job runs
- Then the reservation status becomes `EXPIRED`
- And the time slot becomes `AVAILABLE`
- And an audit event is created

### UI Reflects Expiration

- Given my reservation has expired
- When I view the payment page or reservation detail
- Then I see clear "Expired" messaging
- And I understand the slot is no longer held

---

## Testing Checklist (Integration)

After all sub-stories complete:

- [ ] Cron job runs successfully on schedule
- [ ] Expired reservations transition to `EXPIRED` status
- [ ] Time slots released to `AVAILABLE`
- [ ] Audit events created with `SYSTEM` role
- [ ] Payment page shows expired state
- [ ] Reservation detail shows expired state
- [ ] "My Reservations" shows expired badge
- [ ] Player can book again after expiration

---

## References

- PRD: Section 8.4 (TTL Rules)
- Cron endpoint: `src/app/api/cron/expire-reservations/route.ts`
- Reservation schema: `src/shared/infra/db/schema/reservation.ts`
