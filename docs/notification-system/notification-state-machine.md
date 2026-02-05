# Notification State Machine (Delivery)

This documentation is split into multiple levels of detail so you can share the right depth with product, stakeholders, and engineering.

## Levels of detail
- Level 0 (one-minute summary): `docs/notification-system/notification-state-machine-level-0-summary.md`
- Level 1 (product narrative): `docs/notification-system/notification-state-machine-level-1-product.md`
- Level 2 (engineering states & diagrams): `docs/notification-system/notification-state-machine-level-2-engineering.md`
- Level 3 (automation & ops): `docs/notification-system/notification-state-machine-level-3-ops.md`
- ASCII diagram (quick reference): `docs/notification-system/notification-state-machine-ascii.md`

## Changelog
- `docs/notification-system/notification-state-machine-changelog.md`

## Current contract (MVP)
- Events:
  - `place_verification.requested` -> notify admins
  - `reservation.created` -> notify court owner
  - `place_verification.approved|rejected` -> notify court owner
  - `claim_request.approved|rejected` -> notify court owner
- Delivery is asynchronous via outbox jobs and a cron dispatcher.
- Channels: Email (Resend), SMS (Semaphore) when contact details exist, and Web Push (browser notifications) when a push subscription exists.
