# [01-44] Notification System Test Tools

> Date: 2026-02-01
> Previous: 01-43-reservation-enablement.md

## Summary

Implemented an async notification delivery outbox (email + SMS) with a cron dispatcher, expanded it to notify court owners on reservation + admin decision events, and added an admin test page to enqueue/dispatch notifications without running full product flows.

## Changes Made

### Notification Outbox + Dispatcher

| File | Change |
|------|--------|
| `src/lib/shared/infra/db/schema/notification-delivery-job.ts` | Added outbox table schema for notification delivery jobs. |
| `src/lib/shared/infra/db/schema/enums.ts` | Added notification delivery enums (channel/status). |
| `src/lib/modules/notification-delivery/repositories/notification-delivery-job.repository.ts` | Added create/claim/update queries for outbox jobs. |
| `src/app/api/cron/dispatch-notification-delivery/route.ts` | Cron dispatcher: claims jobs, validates payload, sends via Resend/Semaphore, retries/backoff, updates job status. |
| `vercel.json` | Schedules cron route to run every minute. |

### New Notification Event Support

| File | Change |
|------|--------|
| `src/lib/modules/reservation/services/reservation.service.ts` | Enqueues `reservation.created` owner notification jobs inside reservation create transactions. |
| `src/lib/modules/place-verification/services/place-verification-admin.service.ts` | Enqueues `place_verification.approved|rejected` owner notification jobs on admin decisions. |
| `src/lib/modules/claim-request/use-cases/approve-claim-request.use-case.ts` | Enqueues `claim_request.approved` owner notification jobs. |
| `src/lib/modules/claim-request/services/claim-admin.service.ts` | Enqueues `claim_request.rejected` owner notification jobs. |
| `src/lib/modules/notification-delivery/repositories/notification-recipient.repository.ts` | Added owner recipient resolution (org contact preferred, fallback to org owner profile). |
| `src/lib/modules/notification-delivery/services/notification-delivery.service.ts` | Added enqueue APIs for owner reservation/verification/claim events. |
| `src/lib/shared/infra/trpc/root.ts` | Mounted admin notification tools router under `trpc.admin.notificationDelivery`. |

### Admin Connectivity Test Tools

| File | Change |
|------|--------|
| `src/lib/modules/notification-delivery/admin/notification-delivery-admin.router.ts` | Admin-only procedures to enqueue test jobs (email/phone) and dispatch immediately; avoids DB FKs by omitting FK columns in test inserts. |
| `src/app/(admin)/admin/tools/notification-test/page.tsx` | Admin page `/admin/tools/notification-test` for enqueuing and dispatching real messages. |

### SMS Provider Reliability

| File | Change |
|------|--------|
| `src/lib/shared/infra/sms/semaphore-sms.service.ts` | Added one-time retry without `sendername` when Semaphore rejects an unapproved/invalid sender name; logs `sms.semaphore.retry_without_sendername`. |

### Documentation

| File | Change |
|------|--------|
| `docs/notification-system/README.md` | Updated current contract and event types. |
| `docs/notification-system/notification-state-machine*.md` | Expanded state machine docs to include owner notifications + idempotency formats. |

## Key Decisions

- Use outbox + cron dispatcher to keep user-facing flows fast and make delivery retriable.
- Extend delivery support by event type (validated payloads) rather than adding new tables per notification kind.
- Add an admin test page that can enqueue + dispatch real notifications for quick provider connectivity testing.
- Retry Semaphore failures only for sender-name invalid cases, and log the fallback without leaking sensitive data.

## Next Steps

- [ ] Consider adding optional inputs on the admin test page to attach real DB entity IDs to FK columns when you want tighter end-to-end realism.
- [ ] Decide whether to add an Admin sidebar link for the Tools page.
- [ ] Ensure environments set `CRON_SECRET` to protect `/api/cron/dispatch-notification-delivery`.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build

# manual smoke
pnpm dev
# open /admin/tools/notification-test
```
