# Notification State Machine - Level 0 Summary

## One-minute summary
- Domain events enqueue delivery jobs **inside the same DB transaction** as the state change.
- A cron dispatcher claims jobs and delivers **asynchronously** (no user flow blocking).
- Current MVP events:
  - `place_verification.requested` -> notify admins
  - `reservation.created` -> notify court owner
  - `place_verification.approved|rejected` -> notify court owner
  - `claim_request.approved|rejected` -> notify court owner
- Channels: Email (Resend) + SMS (Semaphore) when contact details exist + Web Push (browser notifications) when a push subscription exists.
- Job states: `PENDING -> SENDING -> SENT | FAILED | SKIPPED` with retries and backoff.
