# Court Reservation - User Stories

## Overview

The Court Reservation domain enables players to discover and book pickleball courts through the KudosCourts platform. This is the core player-facing booking flow that connects court discovery to confirmed reservations.

This domain implements a **simplified reservation flow** focused on the essential end-to-end journey:
1. Player discovers court with available slots
2. Player selects a slot and creates reservation
3. For paid courts: player marks payment as complete
4. Owner confirms (handled in 07-owner-confirmation)

**Simplified Scope:** This version defers TTL timers, payment proof uploads, and expiration handling to `08-p2p-reservation-confirmation`.

---

## Supersedes

This domain supersedes `03-court-reservation` with aligned, end-to-end context:

| Original | This Version | Changes |
|----------|--------------|---------|
| US-03-01 | US-06-01 | Rewritten with full context |
| US-03-02 | US-06-02 | Simplified (no TTL/proof) |
| US-03-03 | Moved to 07-owner-confirmation | Separate domain |

**Reference:** Original stories in `03-court-reservation/` retained for historical context.

---

## References

| Document | Location |
|----------|----------|
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` Section 7 (Journeys 2-3), Section 8 |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Original Stories | `agent-plans/user-stories/03-court-reservation/` |
| Server Context | `agent-contexts/00-01-kudoscourts-server.md` |

---

## Story Index

| ID | Story | Status | Description |
|----|-------|--------|-------------|
| US-06-01 | Player Books Free Court | Active | Select slot → immediate CONFIRMED |
| US-06-02 | Player Books Paid Court | Active | Select slot → mark paid → await confirmation |
| US-06-03 | Player Sees Correct Pricing During Booking | Active | Default + custom price fallback across booking |

---

## Dependencies

| Depends On | Reason |
|------------|--------|
| US-05-01 (Owner Creates Time Slots) | Slots must exist to book |
| US-00-01 (User Authentication) | Player must be authenticated to book |

---

## Enables

| Story | Domain |
|-------|--------|
| US-07-01 (Owner Views Pending) | 07-owner-confirmation |
| US-07-02 (Owner Confirms/Rejects) | 07-owner-confirmation |

---

## Simplified Flow

### Free Court Booking

```
Player selects AVAILABLE slot
        │
        ▼
reservation.create({ timeSlotId })
        │
        ▼
┌───────────────────────────────┐
│ Reservation: CONFIRMED        │
│ Slot: BOOKED                  │
└───────────────────────────────┘
        │
        ▼
Success! Player sees confirmation
```

### Paid Court Booking (Simplified)

```
Player selects AVAILABLE slot (priceCents > 0)
        │
        ▼
reservation.create({ timeSlotId })
        │
        ▼
┌───────────────────────────────┐
│ Reservation: AWAITING_PAYMENT │
│ Slot: HELD                    │
└───────────────────────────────┘
        │
        ▼
Player pays externally (GCash, bank, cash)
        │
        ▼
Player clicks "I Have Paid" button
        │
        ▼
reservation.markPayment({ reservationId, termsAccepted: true })
        │
        ▼
┌───────────────────────────────────┐
│ Reservation: PAYMENT_MARKED_BY_USER│
│ Slot: HELD (still)                │
└───────────────────────────────────┘
        │
        ▼
Awaiting owner confirmation...
(See 07-owner-confirmation)
```

---

## Reservation Status Reference

Per PRD Section 8.1:

| Status | Description | Slot State | Used In |
|--------|-------------|------------|---------|
| CREATED | Initial (transitional) | - | Internal |
| AWAITING_PAYMENT | Paid court, waiting for player | HELD | US-06-02 |
| PAYMENT_MARKED_BY_USER | Player clicked "I Have Paid" | HELD | US-06-02 |
| CONFIRMED | Reservation complete | BOOKED | US-06-01, US-07-02 |
| CANCELLED | Cancelled by player or owner | AVAILABLE | US-07-02 |
| EXPIRED | TTL expired | AVAILABLE | Deferred to 08 |

---

## Backend Requirements

### Existing Endpoints (Verify E2E)

| Endpoint | Status | Action |
|----------|--------|--------|
| `reservation.create` | Complete | Verify works with real slots |
| `reservation.markPayment` | Complete | Verify status transition |
| `reservation.getById` | Complete | For confirmation page |
| `reservation.getMy` | Complete | For "My Reservations" list |

### Frontend Hooks Status

| Hook | File | Status |
|------|------|--------|
| `useCreateReservation` | `src/features/reservation/hooks/use-create-reservation.ts` | Connected |
| `useMyReservations` | `src/features/reservation/hooks/use-my-reservations.ts` | Verify |
| `useMarkPayment` | - | **May need creation** |

---

## Current Implementation State

| Layer | Status | Notes |
|-------|--------|-------|
| Database | Complete | `reservation` table, `reservation_event` for audit |
| Backend | Complete | Full reservation lifecycle |
| Frontend Hooks | Partial | `useCreateReservation` connected, verify others |
| Frontend Pages | Exist | `/courts/[id]`, `/reservations/[id]`, `/reservations/[id]/payment` |

---

## What's Deferred

See `06-99-deferred.md` and `08-p2p-reservation-confirmation`:

- 15-minute TTL countdown timer
- Payment proof upload (reference number, notes, image)
- Payment instructions display (GCash/bank details)
- Expiration handling (cron job, auto-release)
- T&C acknowledgement UI (simplified to just `termsAccepted: true`)

---

## Summary

- **Total Stories:** 3
- **Active:** 3
- **Key Focus:** Verify end-to-end flow works with real data
- **Simplified:** No TTL, no proof upload, basic "I Have Paid" button
