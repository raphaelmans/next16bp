# Player Booking & Reservation Tracking

## Purpose

This doc picks up where discovery ends: the player has chosen a slot and needs a clear path from selection to a tracked reservation.

## Current Guide Narrative

The latest booking guide centers a simple player story:

1. Browse as a guest and choose a slot.
2. Sign in or create an account without losing booking context.
3. Review the booking and complete any missing profile fields.
4. Submit a reservation request.
5. Track the reservation in My Reservations while the owner reviews it.
6. Watch the status update into an upcoming booking after the owner confirms it.

This is the narrative layer users see. The persisted state model below is the implementation layer that makes the narrative real.

## Reservation States

```text
CREATED -> AWAITING_PAYMENT -> PAYMENT_MARKED_BY_USER -> CONFIRMED
   |              |                        |
   |              |                        +-> CANCELLED
   |              +------------------------+
   +--------------------------------------------> EXPIRED
```

| State | Meaning | Who Triggers It |
|-------|---------|-----------------|
| `CREATED` | Reservation request submitted and waiting for owner action | Player or owner/staff guest-booking flow |
| `AWAITING_PAYMENT` | Owner accepted a paid booking and is waiting for external payment | Owner |
| `PAYMENT_MARKED_BY_USER` | Player submitted payment proof/reference | Player |
| `CONFIRMED` | Reservation is accepted and active | Owner |
| `CANCELLED` | Reservation was cancelled or rejected before confirmation | Player or owner |
| `EXPIRED` | Reservation timed out without the required next action | System |

Notes:

- There is no persisted `COMPLETED` database status.
- There is no separate persisted `REJECTED` status; owner rejection resolves to `CANCELLED` plus event/reason context.

## Player Booking Flow

### 1. Slot Selection

The player starts on a venue or court booking surface, chooses an available time, and can extend the booking across midnight when contiguous hourly slots are available.

### 2. Auth Handoff

Guests can explore availability first, but the reservation cannot be submitted until the player signs in or creates an account. The flow keeps booking context so the user does not start over after authentication.

### 3. Booking Review And Profile Completion

Before confirmation, the player reviews:

- court and venue
- date and time
- pricing and add-ons
- terms acceptance

If the player profile is incomplete, the flow blocks confirmation until the required profile fields are filled in.

### 4. Submit Reservation Request

Submitting creates a reservation in `CREATED`. In the common owner-reviewed flow, this means the request was recorded successfully, not that it is already confirmed.

### 5. Track It In My Reservations

After submission, the player can return to:

- reservation detail
- My Reservations pending state buckets
- follow-up payment surfaces when applicable

### 6. Wait For The Owner Decision

If the owner accepts a paid booking, the reservation moves into the payment path. If the owner accepts a free booking, it can move directly to `CONFIRMED`.

## Payment And Confirmation Branches

### Paid Booking

1. `CREATED`
2. owner accepts -> `AWAITING_PAYMENT`
3. player pays externally and submits proof -> `PAYMENT_MARKED_BY_USER`
4. owner verifies payment -> `CONFIRMED`

### Free Booking

1. `CREATED`
2. owner accepts -> `CONFIRMED`

### Owner-Collected Offline Payment

Owners can also confirm a paid booking directly from `CREATED` by selecting a payment method and recording the payment reference in the owner workflow.

## Negative Paths

- Owner does not respond in time -> `EXPIRED`
- Player does not pay within the hold window -> `EXPIRED`
- Player cancels before confirmation -> `CANCELLED`
- Owner rejects before confirmation -> `CANCELLED`

## Reservation Groups And Related Flows

- Multi-court bookings share the same lifecycle pattern at the reservation-group level.
- Guest bookings created by owners/managers enter the same reservation system, with a different creation path.
- Chat, payment proof, and open-play creation all hang off this reservation lifecycle rather than replacing it.

## Related Docs

- [09-payments.md](./09-payments.md) for the manual payment branch
- [08-chat-and-messaging.md](./08-chat-and-messaging.md) for reservation chat
- [07-open-play.md](./07-open-play.md) for social booking after reservation creation
- [99-source-files.md](./99-source-files.md) for the source map
