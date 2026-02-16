# Notification State Machine (Delivery)

This documentation is split into multiple levels of detail so you can share the right depth with product, stakeholders, and engineering.

If you need a single cross-channel visual (including chat notifications), start with [notification-overview-all-channels.md](./notification-overview-all-channels.md).
If you need the complete business event list, use [notification-event-catalog.md](./notification-event-catalog.md).

## Levels of detail
- Level 0 (one-minute summary): [notification-state-machine-level-0-summary.md](./notification-state-machine-level-0-summary.md)
- Level 1 (product narrative): [notification-state-machine-level-1-product.md](./notification-state-machine-level-1-product.md)
- Level 2 (engineering states and diagrams): [notification-state-machine-level-2-engineering.md](./notification-state-machine-level-2-engineering.md)
- Level 3 (automation and ops): [notification-state-machine-level-3-ops.md](./notification-state-machine-level-3-ops.md)
- ASCII diagram (quick reference): [notification-state-machine-ascii.md](./notification-state-machine-ascii.md)

## Changelog
- [notification-state-machine-changelog.md](./notification-state-machine-changelog.md)

## Current contract

- Event coverage: [notification-event-catalog.md](./notification-event-catalog.md)
- Delivery is asynchronous via outbox jobs and a cron dispatcher
- Channels: Email (Resend), SMS (Semaphore), and Browser Push (WEB_PUSH)
