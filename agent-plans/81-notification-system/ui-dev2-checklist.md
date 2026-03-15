# Developer 2 Checklist (Client/Docs) - Notification System

**Focus Area:** Docs under `docs/notification-system/` + small UI copy polish

## Module 4A: State machine docs (levels + ASCII)

- [ ] Add `notification-state-machine.md` index (levels 0-3 + ASCII + changelog)
- [ ] Write Level 0 summary (one-minute)
- [ ] Write Level 1 product narrative (what admins/owners experience)
- [ ] Write Level 2 engineering contract (states, idempotency, enqueue points)
- [ ] Write Level 3 ops (cron, retries, rate limits)
- [ ] Write ASCII diagram companion
- [ ] Update existing `docs/notification-system/README.md` to point to new docs

## Module 4B: Optional UI copy

- [ ] Owner verify submit success message: mention admins are notified
- [ ] Confirm deep link for admins: `/admin/verification/[requestId]`
