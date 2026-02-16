# Notification State Machine - Level 0 Summary

## One-minute summary
- Domain events enqueue delivery jobs and dispatch happens asynchronously (user flows are not blocked).
- A cron dispatcher claims jobs and delivers **asynchronously** (no user flow blocking).
- Current business event list: [notification-event-catalog.md](./notification-event-catalog.md)
- Recipients vary by event type (admins, owners, and players).
- Channels: Email (Resend) + SMS (Semaphore) when contact details exist + Web Push (browser notifications) when a push subscription exists.
- Job states: `PENDING -> SENDING -> SENT | FAILED | SKIPPED` with retries and backoff.
- Enqueue behavior differs by event path: many are transaction-coupled, while some reservation lifecycle notifications use best-effort enqueue with warning logs.
