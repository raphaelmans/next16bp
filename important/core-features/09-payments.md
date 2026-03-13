# Payments (Operational Reference)

_Supporting operational reference. Read after the primary reservation and owner docs in [00-overview.md](./00-overview.md)._

## Purpose

KudosCourts still uses a manual/offline payment model that fits common Philippine booking behavior: the player pays externally, then the platform tracks the payment state and owner confirmation workflow.

## Standard Paid Booking Flow

1. Player submits a reservation request.
2. Owner accepts the paid booking.
3. Reservation moves to `AWAITING_PAYMENT`.
4. Player sees the owner's payment instructions and pays outside the platform.
5. Player marks the reservation as paid and can submit payment proof on the individual reservation flow.
6. Owner reviews the payment state and confirms the reservation.

## Owner Payment Methods

Owners can manage organization payment methods for:

- mobile wallets such as GCash and Maya
- bank-transfer style methods

Current owner-side UI supports:

- add
- edit
- activate/deactivate
- set default
- delete

The data model stores display order, but the current manager UI does not expose a manual reorder control.

## Player Payment Experience

The individual reservation payment flow can show:

- countdown/expiry timing
- active owner payment methods and instructions
- copy actions for account numbers
- reference number entry
- notes
- optional screenshot upload
- terms acceptance

## Group Payment Reality

Reservation-group payment handling is currently lighter than the single-reservation proof flow:

- the group payment action does not expose a separate proof-upload form
- the group submission path marks payable reservations as payment-marked through the group workflow

## Owner Confirmation Actions

Owners can currently:

- confirm payment
- reject/cancel before confirmation
- mark a paid booking as paid offline and confirm it directly from the owner workflow

## What The Platform Does Not Handle

- no in-platform payment processing
- no automated payment verification
- no built-in refund processing
- no platform commission logic in this flow
- no invoice/receipt generation
