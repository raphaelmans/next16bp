# Reservation State Machine — Level 2 Engineering States

## Reservation statuses
- `AWAITING_PAYMENT`: paid reservation created; `expiresAt` is set.
- `PAYMENT_MARKED_BY_USER`: player marked payment; owner must confirm.
- `CONFIRMED`: free booking or owner-confirmed paid booking.
- `CANCELLED`: player cancelled or owner rejected before confirmation.
- `EXPIRED`: TTL expired via cron.
- `CREATED`: enum value defined but not used in current flow.

## Key transitions
- `AWAITING_PAYMENT` → `PAYMENT_MARKED_BY_USER` (player marks payment).
- `AWAITING_PAYMENT` → `CANCELLED` (player cancel or owner reject).
- `AWAITING_PAYMENT` → `EXPIRED` (TTL cron).
- `PAYMENT_MARKED_BY_USER` → `CONFIRMED` (owner confirms).
- `PAYMENT_MARKED_BY_USER` → `CANCELLED` (player cancel or owner reject).
- `PAYMENT_MARKED_BY_USER` → `EXPIRED` (TTL cron).

## Reservation state diagram
```mermaid
stateDiagram-v2
  [*] --> AWAITING_PAYMENT: create paid reservation
  [*] --> CONFIRMED: create free reservation

  AWAITING_PAYMENT --> PAYMENT_MARKED_BY_USER: player marks payment
  PAYMENT_MARKED_BY_USER --> CONFIRMED: owner confirms

  AWAITING_PAYMENT --> CANCELLED: owner rejects OR player cancels
  PAYMENT_MARKED_BY_USER --> CANCELLED: owner rejects OR player cancels

  AWAITING_PAYMENT --> EXPIRED: TTL cron (expiresAt < now)
  PAYMENT_MARKED_BY_USER --> EXPIRED: TTL cron (expiresAt < now)

  CONFIRMED --> [*]
  CANCELLED --> [*]
  EXPIRED --> [*]
```

## Time slot state diagram
```mermaid
stateDiagram-v2
  [*] --> AVAILABLE
  AVAILABLE --> HELD: paid reservation created
  AVAILABLE --> BOOKED: free reservation confirmed
  AVAILABLE --> BLOCKED: owner blocks
  BLOCKED --> AVAILABLE: owner unblocks
  HELD --> BOOKED: owner confirms
  HELD --> AVAILABLE: cancelled or expired
```

## TTL rules
- Paid reservations set `expiresAt = now + 15 minutes` and start at `AWAITING_PAYMENT`.
- TTL window is fixed from creation; marking payment does not extend `expiresAt`.
- Marking payment is allowed only for `AWAITING_PAYMENT` and only before `expiresAt`.
- Owner confirmation transitions `PAYMENT_MARKED_BY_USER` → `CONFIRMED`.
- Owner rejection is allowed for `AWAITING_PAYMENT` or `PAYMENT_MARKED_BY_USER`.
- Player cancellation is allowed before `CONFIRMED` and moves to `CANCELLED`.

## Time slot coupling
- `AVAILABLE` → `HELD` when paid reservation created.
- `HELD` → `BOOKED` on owner confirmation.
- `HELD` → `AVAILABLE` on expiration or cancellation.
- `AVAILABLE` → `BOOKED` when free reservation confirmed.
- `AVAILABLE` ↔ `BLOCKED` when owner blocks/unblocks slots.
- `BOOKED` has no automated release in current flow.
