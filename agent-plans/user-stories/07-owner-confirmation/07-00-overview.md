# Owner Confirmation - User Stories

## Overview

The Owner Confirmation domain enables organization owners to review and action pending reservations. When a player books a paid court and marks payment as complete, the owner must confirm (or reject) the reservation to finalize the booking.

This domain implements a **simplified confirmation flow**:
1. Owner views list of pending reservations with enriched data
2. Owner confirms payment → reservation CONFIRMED, slot BOOKED
3. Owner rejects → reservation CANCELLED, slot AVAILABLE

**Simplified scope:** This version focuses on basic confirm/reject without payment proof display. See `08-p2p-reservation-confirmation` for full P2P verification flow.

---

## References

| Document | Location |
|----------|----------|
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` Section 7 Journey 4 |
| Original Story | `agent-plans/user-stories/03-court-reservation/03-03-owner-confirms-payment.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Server Context | `agent-contexts/00-01-kudoscourts-server.md` |

---

## Story Index

| ID | Story | Status | Description |
|----|-------|--------|-------------|
| US-07-01 | Owner Views Pending Reservations | Active | List with enriched data (court, slot, player info) |
| US-07-02 | Owner Confirms or Rejects Reservation | Active | Confirm → CONFIRMED, Reject → CANCELLED |
| US-07-03 | Owner Sees Accurate Slot Reservation Status | Active | Slot list reflects reservation state + actions |
| US-07-04 | Owner Manages Active Reservations with TTL | Active | Dedicated active list with countdowns |
| US-07-05 | Owner Reservation Alerts Panel | Active | Floating draggable alerts panel |
| US-07-06 | Owner Filters Reservation Ops by Court | Active | Filter alerts/active/list by court |

---

## Historical Reference

This domain supersedes part of `03-court-reservation`:

| Original | This Version | Notes |
|----------|--------------|-------|
| US-03-03 | US-07-01 + US-07-02 | Split into view and action stories |

**Reference:** Original story in `03-court-reservation/03-03-owner-confirms-payment.md` retained for historical context.

---

## Dependencies

| Depends On | Reason |
|------------|--------|
| US-06-02 (Player Books Paid Court) | Pending reservation must exist |
| US-05-01 (Owner Creates Time Slots) | Slot must exist |

---

## Simplified Flow

```
[06] Player books paid court
        │
        ▼
┌───────────────────────────┐
│ PAYMENT_MARKED_BY_USER    │
│ Slot: HELD                │
└───────────────────────────┘
        │
        ▼
[07] Owner views pending reservations
        │
        ├── Player name, email, phone
        ├── Court name
        ├── Slot date/time
        ├── Amount
        │
        ▼
┌─────────────────────────────────────────┐
│ Owner Action                            │
│                                         │
│ [Confirm Payment]    [Reject]           │
└─────────────────────────────────────────┘
        │                    │
        │                    │
        ▼                    ▼
┌─────────────────┐   ┌─────────────────┐
│ CONFIRMED       │   │ CANCELLED       │
│ Slot: BOOKED    │   │ Slot: AVAILABLE │
└─────────────────┘   └─────────────────┘
```

---

## Backend Requirements

### `reservationOwner.getForOrganization` (Enriched)

The owner reservations list is backed by an enriched query that includes court + slot details and supports optional filters.

**Includes:**
- Court: `courtId`, `courtName`
- Slot: `slotStartTime`, `slotEndTime`
- Amount: `amountCents`, `currency`
- TTL: `expiresAt`

**Supports filters:**
- `courtId` (multi-court owners)
- `reservationId` (detail deep links)

### Existing Endpoints (Already Complete)

| Endpoint | Status |
|----------|--------|
| `reservationOwner.confirmPayment` | Complete |
| `reservationOwner.reject` | Complete |
| `reservationOwner.getPendingCount` | Complete |
| `reservationOwner.getPendingForCourt` | Complete |

---

## Current Implementation State

| Layer | Status | Notes |
|-------|--------|-------|
| Database | Complete | Reservation, audit trail tables exist |
| Backend Service | Complete | ReservationOwnerService implemented |
| Backend Router | Complete | All endpoints exist |
| Frontend Hooks | Connected | `useConfirmReservation`, `useRejectReservation` work |
| Frontend Page | Exists | `/owner/reservations` uses enriched backend data |

---

## Audit Trail

Per PRD Section 15.1, all status transitions are logged:

| Field | Value |
|-------|-------|
| Reservation ID | The reservation being actioned |
| From status | PAYMENT_MARKED_BY_USER |
| To status | CONFIRMED or CANCELLED |
| Triggered by | Owner's user ID |
| Role | OWNER |
| Timestamp | When action occurred |
| Notes | Optional (for reject reason) |

---

## What's Deferred

See `07-99-deferred.md` and `08-p2p-reservation-confirmation`:

- Payment proof display
- P2P verification flow
- Owner-initiated cancellation (different from reject)
- Email/SMS notifications

---

## Summary

- **Total Stories:** 6
- **Active:** 6
- **Key Deliverable:** Accurate reservation states across slot list, active TTL workflow, and alerts panel visibility
