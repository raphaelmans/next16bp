## MODIFIED Requirements

### Requirement: Separation of Concerns

Chat unread state SHALL be presented in chat surfaces, while notification delivery settings and notification inbox state SHALL be presented in notification surfaces.

#### Scenario: Chat unread indicators

- **GIVEN** unread chat messages exist
- **WHEN** user views the app shell
- **THEN** unread indicator is shown in chat widget/inbox trigger
- **AND** unread chat state is not sourced from delivery notification jobs

#### Scenario: NotificationBell role

- **GIVEN** user opens NotificationBell
- **WHEN** browser push is configured/toggled and notification inbox data is available
- **THEN** bell reflects notification delivery settings/status and recent notification inbox items
- **AND** bell does not represent chat thread inbox state

#### Scenario: NotificationBell behavior while chat unread changes

- **GIVEN** chat unread counts change due to new messages
- **WHEN** user opens NotificationBell
- **THEN** bell content remains scoped to notification delivery settings and notification inbox rows
- **AND** chat unread indicators remain in chat widget/inbox surfaces
