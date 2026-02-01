# Notification System

## Documentation
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
- Event: owner submits a venue verification request
- Recipients: admins (`user_roles.role = "admin"`)
- Channels: email + SMS (when contact details exist)
- Delivery: async outbox jobs dispatched by cron
