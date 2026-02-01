# Notification State Machine - Level 0 Summary

## One-minute summary
- Domain events enqueue delivery jobs **inside the same DB transaction** as the state change.
- A cron dispatcher claims jobs and delivers **asynchronously** (no user flow blocking).
- Current MVP event: owner submits place verification request -> notify admins.
- Channels: Email (Resend) + SMS (Semaphore) when contact details exist.
- Job states: `PENDING -> SENDING -> SENT | FAILED | SKIPPED` with retries and backoff.
