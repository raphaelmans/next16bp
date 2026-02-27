# notification-bell-inbox Specification

## Purpose
TBD - created by archiving change add-notification-bell-inbox. Update Purpose after archive.
## Requirements
### Requirement: Notification inbox records SHALL be persisted per user
The system SHALL persist user-facing notification inbox records independently from delivery job execution state.

#### Scenario: Enqueue creates inbox record
- **WHEN** a notification event is enqueued for a concrete recipient user
- **THEN** a `user_notification` row is inserted with user id, event type, title, body, href, payload, and idempotency key

#### Scenario: Duplicate enqueue does not duplicate inbox row
- **WHEN** enqueue is retried with the same idempotency key
- **THEN** the system keeps a single inbox row for that idempotency key

### Requirement: Authenticated users SHALL query and update their inbox state
The system SHALL expose authenticated APIs to list inbox items, count unread items, mark one item as read, and mark all items as read.

#### Scenario: User lists own inbox
- **WHEN** an authenticated user queries inbox list
- **THEN** the system returns only rows owned by that user, ordered newest-first

#### Scenario: User marks a single item as read
- **WHEN** an authenticated user marks one owned notification as read
- **THEN** the notification read timestamp is set and unread count decreases by one

#### Scenario: User marks all items as read
- **WHEN** an authenticated user triggers mark-all-as-read
- **THEN** all unread inbox rows for that user are marked read

### Requirement: NotificationBell SHALL expose unread badge and recent inbox list
The bell UI SHALL display unread count badge and recent notification items in the popover, with item-level and bulk read actions.

#### Scenario: Unread badge visibility
- **WHEN** unread count is greater than zero
- **THEN** the bell trigger displays an unread badge count (capped for large values)

#### Scenario: Opening bell shows recent notifications
- **WHEN** the user opens the bell popover
- **THEN** the popover renders recent notification items with read/unread affordances and preserves browser-notification toggle controls

#### Scenario: Notification click behavior
- **WHEN** the user clicks a notification item
- **THEN** the item is marked read and navigation proceeds to the notification href when available

