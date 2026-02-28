# Reservation Lifecycle

## Purpose

A reservation is the central object that connects a player, a court, and a payment. This document describes every state a reservation passes through, from creation to completion or cancellation.

## Reservation States

```
CREATED ──→ AWAITING_PAYMENT ──→ PAYMENT_MARKED ──→ CONFIRMED ──→ COMPLETED
   │              │                     │                │
   │              │                     │                └──→ (auto after play date)
   │              │                     │
   ├──→ REJECTED  ├──→ EXPIRED          ├──→ REJECTED
   │              │                     │
   └──→ CANCELLED └──→ CANCELLED        └──→ CANCELLED
```

| State | Meaning | Who Triggers It |
|-------|---------|----------------|
| **CREATED** | Player submitted a booking request. Waiting for owner to review. | Player (by booking) |
| **AWAITING_PAYMENT** | Owner accepted the booking. Waiting for player to pay. | Owner (by accepting) |
| **PAYMENT_MARKED** | Player says they sent payment (uploaded proof). Waiting for owner to confirm. | Player (by marking paid) |
| **CONFIRMED** | Owner confirmed payment received. Reservation is locked in. | Owner (by confirming) |
| **COMPLETED** | The play date has passed. Reservation is archived. | System (automatic) |
| **REJECTED** | Owner declined the booking. | Owner (at any pre-confirmed state) |
| **CANCELLED** | Player cancelled their booking. | Player (at any pre-confirmed state) |
| **EXPIRED** | Neither party acted within the allowed time window. | System (automatic timeout) |

## Happy Path (Full Flow)

### Player's Perspective

1. Player finds a court and selects a time slot.
2. Player confirms the booking → status becomes **CREATED**.
3. Player waits for the owner to accept.
4. Owner accepts → status becomes **AWAITING_PAYMENT**. Player receives a notification.
5. Player sees payment instructions (bank account details, mobile wallet info).
6. Player transfers payment and uploads proof (screenshot, reference number) → status becomes **PAYMENT_MARKED**.
7. Owner verifies payment and confirms → status becomes **CONFIRMED**. Player receives confirmation notification.
8. Player shows up and plays. After the date passes → status becomes **COMPLETED**.

### Owner's Perspective

1. Owner receives a notification: "New booking from [Player Name] for [Court] on [Date]."
2. Owner reviews the booking details (player info, court, time, amount).
3. Owner accepts the reservation → status becomes **AWAITING_PAYMENT**.
4. Player pays and uploads proof → Owner receives a notification: "Payment marked."
5. Owner checks the proof (reference number, screenshot) and confirms → status becomes **CONFIRMED**.
6. On the play date, the player arrives and uses the court.

### Alternative: Free Bookings

If the court has no pricing (free courts), the flow skips the payment steps:

1. Player books → **CREATED**
2. Owner accepts → **CONFIRMED** (payment steps skipped)
3. Player plays → **COMPLETED**

### Alternative: Offline Payment

The owner can mark a reservation as "Paid Offline" for walk-in or cash payments:

1. Owner receives a booking.
2. Owner selects "Mark as Paid Offline."
3. Owner chooses the payment method used and enters a reference number.
4. Reservation moves directly to **CONFIRMED**.

## Negative Paths

### Owner Does Not Respond (Expiration)

If the owner does not accept or reject a booking within the allowed time window, the reservation automatically expires.

- The player's time is not held indefinitely.
- Currently there is **no notification sent to the owner** when a reservation expires — this is a gap. The booking silently disappears from the pending list.
- The player receives no email about the expiration, only a push/inbox notification.

### Player Cancels

The player can cancel at any state before **CONFIRMED**:

- If the booking was just created (not yet accepted), cancellation is free.
- The owner is notified via push and inbox.
- No email notification is sent to the owner for cancellations — this is a gap.

### Owner Rejects

The owner can reject at any state before **CONFIRMED**:

- The player is notified via push and inbox.
- The player sees the rejection in their reservation detail.
- No email notification is sent to the player — this is a gap.

### Payment Timeout

If the player does not pay within the allowed window (typically a countdown timer shown on the payment page), the reservation expires:

- Payment page shows a countdown timer (configurable, often 15 minutes to 24 hours).
- On timeout, status moves to **EXPIRED**.

## Reservation Groups

Players can book multiple courts in a single session — for example, booking Court A and Court B for the same time to accommodate a larger group.

**How it works:**
- During the booking flow, the player adds multiple courts to a "group."
- A single reservation group is created containing multiple individual reservations.
- Payment is consolidated — one payment for the entire group.
- The owner confirms or rejects the group as a whole.
- Each individual reservation within the group can also be viewed separately.

## Guest Bookings (Owner-Created)

Owners and managers can create bookings on behalf of players:

- Use case: A customer calls or walks in and the staff books for them.
- The owner enters the player's name, email, and phone.
- The reservation is created in the system and appears in the reservation list.
- This requires the "Create guest bookings" permission.

## Reservation Management (Owner UI)

The owner's reservation list is organized into tabs:

| Tab | What It Shows |
|-----|--------------|
| **Inbox (Pending)** | Reservations needing action — sub-filtered by: Needs acceptance, Awaiting payment, Payment marked |
| **Upcoming** | Confirmed future reservations |
| **Past** | Completed and past reservations |
| **Cancelled** | Rejected, expired, and cancelled reservations |

Owners can filter by venue, court, date range, and player name/phone. Each reservation row shows the player, court, date/time, status badge (color-coded), amount, and available actions.

## Key Business Rules

- A court can only have one active reservation per time slot. Double-booking is prevented at the system level.
- Reservations hold the slot from the moment of creation. If the reservation expires or is cancelled, the slot becomes available again.
- The owner must have at least one payment method configured for paid bookings to work.
- The venue must be verified for online reservations to be possible.
