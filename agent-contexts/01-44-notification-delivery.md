# [01-44] Notification Delivery Updates

> Date: 2026-02-01
> Previous: 01-43-reservation-enablement.md

## Summary

Extended the notification outbox system to notify court owners on reservation creation and on admin verification decisions (place verification + claim requests). Added per-channel enable/disable toggles (email/SMS) and removed all URLs from SMS templates to reduce phishing risk.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/lib/modules/notification-delivery/services/notification-delivery.service.ts` | Enqueue owner notifications for `reservation.created`, `place_verification.approved|rejected`, `claim_request.approved|rejected`; respect channel toggles |
| `src/lib/modules/notification-delivery/repositories/notification-recipient.repository.ts` | Resolve owner recipient via org contact (preferred) or owner profile (fallback) |
| `src/app/api/cron/dispatch-notification-delivery/route.ts` | Dispatch new event types; per-channel dispatch gating; SMS templates contain no URLs |
| `src/lib/modules/reservation/services/reservation.service.ts` | Enqueue owner notification inside reservation creation transaction |
| `src/lib/modules/place-verification/services/place-verification-admin.service.ts` | Enqueue owner notification on approve/reject |
| `src/lib/modules/claim-request/use-cases/approve-claim-request.use-case.ts` | Enqueue owner notification on approve |
| `src/lib/modules/claim-request/services/claim-admin.service.ts` | Enqueue owner notification on reject |
| `src/lib/env/index.ts` | Add `NOTIFICATION_EMAIL_ENABLED` / `NOTIFICATION_SMS_ENABLED`; make Semaphore vars tolerant of empty strings; make `SEMAPHORE_API_KEY` optional |
| `src/lib/shared/infra/sms/semaphore-sms.service.ts` | Clearer error message if SMS is attempted without `SEMAPHORE_API_KEY` |
| `src/lib/modules/*/factories/*.ts` | Wire notification delivery service into reservation/claim/place-verification services |

### Documentation

| File | Change |
|------|--------|
| `docs/notification-system/README.md` | Document expanded MVP event types + owner recipients |
| `docs/notification-system/notification-state-machine*.md` | Update state machine docs for new events, payloads, idempotency keys |
| `docs/notification-system/notification-state-machine-level-3-ops.md` | Document `NOTIFICATION_EMAIL_ENABLED` / `NOTIFICATION_SMS_ENABLED` |
| `.env.example` | Add Semaphore vars, cron secret, and notification channel toggles |

## Key Decisions

- No links in SMS: SMS templates must never include URLs; emails can include deep links.
- Channel toggles: `NOTIFICATION_EMAIL_ENABLED` / `NOTIFICATION_SMS_ENABLED` control enqueue + dispatch; disabled channel jobs are permanently marked `SKIPPED` with `DISABLED_CHANNEL:*`.
- Owner recipient resolution: prefer `organization_profile.contactEmail/contactPhone`, fallback to `profile` for `organization.ownerUserId`.

## Next Steps (if applicable)

- [ ] Add DB migrations if `notification_delivery_job` / enums are not deployed yet.
- [ ] Set production env vars: `NOTIFICATION_*_ENABLED`, `CRON_SECRET`, `RESEND_API_KEY`, `SEMAPHORE_*` as needed.
- [ ] Optionally add a per-event allowlist if you want finer control than per-channel.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build

# Optional: check what will be committed
git status -sb
git diff --stat
```
