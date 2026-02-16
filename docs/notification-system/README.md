# Notification System

## Documentation
- Start here (product + sales overview): `docs/notification-system/notification-overview-all-channels.md`
- State machine index: `docs/notification-system/notification-state-machine.md`
- Level 0 (summary): `docs/notification-system/notification-state-machine-level-0-summary.md`
- Level 1 (product): `docs/notification-system/notification-state-machine-level-1-product.md`
- Level 2 (engineering): `docs/notification-system/notification-state-machine-level-2-engineering.md`
- Level 3 (ops): `docs/notification-system/notification-state-machine-level-3-ops.md`
- ASCII diagram: `docs/notification-system/notification-state-machine-ascii.md`
- Changelog: `docs/notification-system/notification-state-machine-changelog.md`

## Integrations
- Email (Resend): `docs/notification-system/email-integration.md`
- SMS (Semaphore): `docs/notification-system/sms-integration.md`

## Current Contract (MVP)
- Events:
  - `place_verification.requested` -> notify admins
  - `reservation.created` -> notify court owner
  - `place_verification.approved|rejected` -> notify court owner
  - `claim_request.approved|rejected` -> notify court owner
- Recipients:
  - Admins (`user_roles.role = "admin"`)
  - Court owner (org contact or owner profile)
- Channels: email + SMS (when contact details exist) + browser notifications (WEB_PUSH) when a push subscription exists
- Delivery: async outbox jobs dispatched by cron
