# Phase 4: Client + Docs (State Machine Levels + ASCII)

**Dependencies:** none (docs can be written immediately)
**Parallelizable:** Yes

## Objective

Bring `docs/notification-system/` up to the same standard as reservation TTL docs:
- multi-level docs (0-3) + ASCII quick reference
- clear operational contract for outbox state machine

Client work in MVP is intentionally minimal (delivery happens server-side).

## Module 4A: Notification State Machine Docs

Create these files:

- `docs/notification-system/notification-state-machine.md`
- `docs/notification-system/notification-state-machine-level-0-summary.md`
- `docs/notification-system/notification-state-machine-level-1-product.md`
- `docs/notification-system/notification-state-machine-level-2-engineering.md`
- `docs/notification-system/notification-state-machine-level-3-ops.md`
- `docs/notification-system/notification-state-machine-ascii.md`
- `docs/notification-system/notification-state-machine-changelog.md`

Update existing `docs/notification-system/README.md` to either:
- become the index (like reservation), or
- clearly link to the new index file above.

Include:
- Outbox job states: `PENDING -> SENDING -> SENT|FAILED|SKIPPED`
- Retry behavior (attemptCount + nextAttemptAt)
- Vendor constraints:
  - Resend idempotency header
  - Semaphore rate limits + `TEST` prefix ignored
- Event coverage:
  - MVP: `place_verification.requested` (admin notification)

## Module 4B: Client polish

Optional copy update:
- On owner verification submit success UI, show: "We notified admins."
- Ensure admin review UI deep links remain stable.

No notification inbox UI in MVP.
