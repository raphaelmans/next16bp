# Notification System

## Workshop reading order

1. [Notification overview (all channels)](./notification-overview-all-channels.md)
2. [Notification event catalog (all business types)](./notification-event-catalog.md)
3. [Level 1 product narrative](./notification-state-machine-level-1-product.md)
4. [Level 2 engineering states](./notification-state-machine-level-2-engineering.md)
5. [Level 3 automation and ops](./notification-state-machine-level-3-ops.md)

## Documentation
- Start here (product + sales overview): [notification-overview-all-channels.md](./notification-overview-all-channels.md)
- All business event types: [notification-event-catalog.md](./notification-event-catalog.md)
- State machine index: [notification-state-machine.md](./notification-state-machine.md)
- Level 0 (summary): [notification-state-machine-level-0-summary.md](./notification-state-machine-level-0-summary.md)
- Level 1 (product): [notification-state-machine-level-1-product.md](./notification-state-machine-level-1-product.md)
- Level 2 (engineering): [notification-state-machine-level-2-engineering.md](./notification-state-machine-level-2-engineering.md)
- Level 3 (ops): [notification-state-machine-level-3-ops.md](./notification-state-machine-level-3-ops.md)
- ASCII diagram: [notification-state-machine-ascii.md](./notification-state-machine-ascii.md)
- Changelog: [notification-state-machine-changelog.md](./notification-state-machine-changelog.md)

## Integrations
- Email (Resend): [email-integration.md](./email-integration.md)
- SMS (Semaphore): [sms-integration.md](./sms-integration.md)

## Current contract

- Canonical event list: [notification-event-catalog.md](./notification-event-catalog.md)
- Recipients include admins, owners, and players depending on event type
- Channels: Email, SMS, Browser Push (`WEB_PUSH`), and Mobile Push (`MOBILE_PUSH` via Expo)
- Delivery: async outbox jobs dispatched by cron
