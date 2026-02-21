## Purpose

Defines the separation of concerns between chat unread state (chat surfaces) and notification delivery channel settings/status (notification surfaces), including NotificationBell role clarity.

## Requirements

### Requirement: Separation of Concerns

Chat unread state SHALL be presented in chat surfaces, while delivery channel settings/status SHALL be presented in notification surfaces.

#### Scenario: Chat unread indicators

- **GIVEN** unread chat messages exist
- **WHEN** user views the app shell
- **THEN** unread indicator is shown in chat widget/inbox trigger
- **AND** unread chat state is not sourced from delivery notification jobs

#### Scenario: NotificationBell role

- **GIVEN** user opens NotificationBell
- **WHEN** browser push is configured/toggled
- **THEN** bell reflects delivery settings/status and diagnostics
- **AND** does not represent chat thread inbox state
- **AND** includes copy that chat unread is tracked in chat inbox/widget

#### Scenario: NotificationBell remains delivery-only while chat unread changes

- **GIVEN** chat unread counts change due to new messages
- **WHEN** user opens NotificationBell
- **THEN** bell content remains delivery settings/diagnostics only
- **AND** chat unread indicators remain in chat widget/inbox surfaces
