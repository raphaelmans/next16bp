# Notification State Machine (ASCII)

This is an ASCII companion to:
- `docs/notification-system/notification-state-machine.md`
- `docs/notification-system/notification-state-machine-level-1-product.md`
- `docs/notification-system/notification-state-machine-level-2-engineering.md`

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
