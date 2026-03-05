# Reservation Lifecycle

## Purpose

A reservation is the central object that connects a player, a court, and payment verification. This document describes the persisted status model and the real transitions used in code.

## Reservation States (Source of Truth)

```
CREATED ──→ AWAITING_PAYMENT ──→ PAYMENT_MARKED_BY_USER ──→ CONFIRMED
   │              │                        │                      │
   │              │                        │                      └──→ (shown under Past when end time has passed)
   │              │                        │
   ├──────────────┴────────────────────────┴──→ CANCELLED
   │
   └──────────────────────────────────────────→ EXPIRED
```

| State | Meaning | Who Triggers It |
|-------|---------|----------------|
| **CREATED** | Booking request submitted. Waiting for owner action. | Player (or staff via guest booking/import) |
| **AWAITING_PAYMENT** | Owner accepted a paid booking. Waiting for player payment. | Owner |
| **PAYMENT_MARKED_BY_USER** | Player submitted payment proof/reference. Waiting for owner confirmation. | Player |
| **CONFIRMED** | Booking is confirmed and locked in. | Owner (accept free booking, confirm payment, or mark paid offline) |
| **CANCELLED** | Booking was cancelled by player or cancelled by owner rejection flow. | Player or Owner |
| **EXPIRED** | Booking timed out without required action. | System |

Notes:
- There is no persisted `COMPLETED` status in the database.
- There is no persisted `REJECTED` status; owner rejection is represented as `CANCELLED` plus rejection event/reason metadata.

## Happy Path (Paid Booking)

### Player Perspective

1. Player selects a slot (can span midnight/week boundary if contiguous hourly availability exists).
2. Player confirms booking → **CREATED**.
3. Owner accepts → **AWAITING_PAYMENT** (player notified).
4. Player pays externally and submits proof/reference → **PAYMENT_MARKED_BY_USER**.
5. Owner confirms payment → **CONFIRMED** (player notified).
6. After play date passes, the reservation still remains **CONFIRMED** but appears in "Past" UI views based on end time.

### Owner Perspective

1. Owner receives a new booking notification.
2. Owner reviews booking details and accepts.
3. Owner waits for player payment proof.
4. Owner confirms payment.

## Alternative Flows

### Free Booking (Total Price = 0)

If total price is zero, owner acceptance moves the booking directly:

1. **CREATED** → **CONFIRMED**
2. No payment hold or player proof step.

### Paid Offline (Owner Action)

Owner can use "Mark as Paid & Confirmed" for paid bookings in **CREATED** state:

1. Owner selects an active organization payment method.
2. Owner enters a payment reference.
3. Reservation moves directly to **CONFIRMED**.

## Negative Paths

### Owner Does Not Respond

If owner does not act before the acceptance expiry window:
- **CREATED** → **EXPIRED**
- Slot is released.
- Owner expiration notification is still a known gap.

### Player Does Not Pay in Time

If player does not pay before payment-hold expiry:
- **AWAITING_PAYMENT** (and timeout-eligible pre-confirmed payment states) → **EXPIRED**

### Player Cancels

Player can cancel before confirmation:
- Allowed from **CREATED**, **AWAITING_PAYMENT**, **PAYMENT_MARKED_BY_USER**
- Result: **CANCELLED**

### Owner Rejects

Owner rejection is available before confirmation:
- Allowed from **CREATED**, **AWAITING_PAYMENT**, **PAYMENT_MARKED_BY_USER**
- Result: **CANCELLED** (with owner-provided reason/event context)
- Player is notified via inbox/push.

## Reservation Groups

Players can book multiple courts in one group:
- One reservation group contains multiple reservation rows.
- Group lifecycle mirrors single lifecycle (`created`, `awaiting_payment`, `payment_marked`, `confirmed`, `rejected/cancelled` event families).
- Payment is consolidated at the group level.
- Owner actions can be applied to the whole group.

## Guest Bookings (Owner-Created)

Owners/managers can create bookings for walk-ins or phone bookings:
- Requires `reservation.guest_booking`.
- Reservation enters the same lifecycle as normal player bookings.

## Reservation Management (Owner UI)

Owner tabs:

| Tab | What It Shows |
|-----|--------------|
| **Inbox** | Pending items: `CREATED`, `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER` |
| **Upcoming** | `CONFIRMED` reservations whose end time is in the future |
| **Past** | `CONFIRMED` reservations whose end time is in the past |
| **Cancelled** | `CANCELLED` and `EXPIRED` |

## Key Business Rules

- One court cannot have overlapping active reservations.
- Slots are held at creation and released on cancellation/expiration.
- Paid booking acceptance requires payment method support at organization level.
- Venue must be verified and reservations-enabled for booking.
- Hourly booking ranges can cross midnight (including cross-week boundaries) when every intervening slot is available.
