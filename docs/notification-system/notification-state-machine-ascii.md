# Notification State Machine (ASCII)

This is an ASCII companion to:
- `docs/notification-system/notification-state-machine.md`
- `docs/notification-system/notification-state-machine-level-1-product.md`
- `docs/notification-system/notification-state-machine-level-2-engineering.md`

## 0) Current contract (MVP)

This system currently supports:

- Event types:
  - `place_verification.requested` -> admins
  - `reservation.created` -> court owner
  - `place_verification.approved|rejected` -> court owner
  - `claim_request.approved|rejected` -> court owner
- Channels: EMAIL (Resend) + SMS (Semaphore) when contact details exist
- Delivery: async outbox jobs (`notification_delivery_job`) dispatched by cron

Not in scope yet (intentionally deferred): in-app inbox, user notification preferences, multi-event templates.

## 1) Delivery pipeline (MVP)

```text
Owner submits verification
  |
  | (same DB transaction)
  v
place_verification_request + event
  |
  | enqueue outbox jobs
  v
notification_delivery_job (EMAIL/SMS)
  |
  | cron dispatcher
  v
Resend (email)    Semaphore (sms)
```

## 2) Outbox job state machine

```text
          +---------+
          | PENDING |
          +----+----+
               |
               | cron claims
               v
          +---------+
          | SENDING |
          +----+----+
            |     |
            |     | delivery error
            |     v
            |  +---------+
            |  | FAILED  |
            |  +----+----+
            |       |
            |       | retry after backoff (attemptCount < max)
            |       v
            |   (SENDING)
            |
            | delivery success
            v
        +--------+
        |  SENT  |
        +--------+

Invalid payload/target:
  PENDING -> SKIPPED
```
