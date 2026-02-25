## MODIFIED Requirements

### Requirement: Chat vs Notification Boundary

Chat unread/inbox domain logic SHALL remain in chat surfaces, while notification delivery settings and notification inbox state SHALL remain in notification surfaces.

#### Scenario: Chat unread indicators

- **GIVEN** unread chat messages exist
- **WHEN** user views app shell
- **THEN** unread indicator is shown in chat widget/inbox trigger
- **AND** unread chat state is not sourced from delivery notification jobs

#### Scenario: NotificationBell role

- **GIVEN** user opens NotificationBell
- **WHEN** browser push is configured or toggled and notification inbox data is loaded
- **THEN** bell reflects notification delivery settings/status and recent notification inbox items
- **AND** does not represent chat thread inbox state
