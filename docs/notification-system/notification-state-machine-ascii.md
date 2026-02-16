# Notification State Machine (ASCII)

This is an ASCII companion to:
- [notification-state-machine.md](./notification-state-machine.md)
- [notification-state-machine-level-1-product.md](./notification-state-machine-level-1-product.md)
- [notification-state-machine-level-2-engineering.md](./notification-state-machine-level-2-engineering.md)
- [notification-event-catalog.md](./notification-event-catalog.md)

## 0) Current contract

This system currently supports:

- Event types: see [notification-event-catalog.md](./notification-event-catalog.md)
- Channels: EMAIL (Resend) + SMS (Semaphore) + WEB_PUSH (browser notifications)
- Delivery: async outbox jobs (`notification_delivery_job`) dispatched by cron

Not in scope yet (intentionally deferred): in-app inbox, user notification preferences, multi-event templates.

## 1) Delivery pipeline (MVP)

```text
Example flow: owner submits verification
  |
  | (same DB transaction)
  v
place_verification_request + event
  |
  | enqueue outbox jobs
  v
notification_delivery_job (EMAIL/SMS/WEB_PUSH)
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
