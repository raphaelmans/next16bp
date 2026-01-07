# US-03-03: Owner Confirms Payment

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **confirm player payments** so that **reservations are finalized and players can use the court**.

---

## Acceptance Criteria

### View Pending Reservations

- Given I am on `/owner/reservations`
- When I filter by "Pending Confirmation"
- Then I see reservations with status `PAYMENT_MARKED_BY_USER`

### View Reservation Details

- Given I have pending reservations
- When I click on a reservation
- Then I see: player info, court, slot details, payment proof (if provided)

### Confirm Payment

- Given I am viewing a pending reservation
- When I click "Confirm Payment"
- Then reservation status changes to `CONFIRMED`
- And slot status changes to `BOOKED`
- And I see a success toast

### Reject Payment

- Given I am viewing a pending reservation
- When I click "Reject" and provide a reason
- Then reservation status changes to `CANCELLED`
- And slot status changes to `AVAILABLE`
- And I see a confirmation toast

### Dashboard Badge

- Given I have pending confirmations
- When I view the owner dashboard
- Then I see a badge count on "Reservations" sidebar item
- And dashboard shows pending count in stats

### Quick Access from Dashboard

- Given I am on `/owner` dashboard
- When I see the "Pending Confirmations" stat
- Then I can click to navigate to filtered reservations list

---

## Edge Cases

- Reservation expired before owner reviews - Already handled by cron job, won't appear in pending
- Owner confirms wrong reservation - Audit trail logged, no undo (must cancel and rebook)
- Multiple pending from same player - Each handled independently
- No payment proof provided - Owner can still confirm based on external verification

---

## Owner Reservation Flow

```
/owner
    │
    ▼
[Pending: 3] badge on Reservations
    │
    ▼
/owner/reservations?status=pending
    │
    ▼
Click reservation row
    │
    ▼
View details modal/drawer
    │
    ├── [Confirm Payment] → CONFIRMED, slot BOOKED
    │
    └── [Reject] → CANCELLED, slot AVAILABLE
```

---

## Reservation Detail View

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Reservation #abc123                                        │
│  Status: [Awaiting Confirmation]                            │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Player Information:                                        │
│  Name: Juan Dela Cruz                                       │
│  Email: juan@email.com                                      │
│  Phone: 0917-123-4567                                       │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Booking Details:                                           │
│  Court: Court A                                             │
│  Date: January 8, 2025                                      │
│  Time: 2:00 PM - 3:00 PM                                    │
│  Amount: P200                                               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Payment Proof:                                             │
│  Reference: GC-12345678                                     │
│  Notes: "Paid via GCash"                                    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [Reject]                              [Confirm Payment]    │
│  Secondary                             Primary (Teal)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

| Endpoint | Method | Input |
|----------|--------|-------|
| `reservationOwner.getPendingForOrganization` | Query | `{ organizationId }` |
| `reservationOwner.confirmPayment` | Mutation | `{ reservationId }` |
| `reservationOwner.reject` | Mutation | `{ reservationId, reason? }` |

---

## References

- PRD: Section 7 Journey 4 (Owner Confirms Payment)
- PRD: Section 15 (Audit Trail)
- Design System: Section 5.1 (Buttons)
