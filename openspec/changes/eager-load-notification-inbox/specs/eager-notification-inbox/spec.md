## ADDED Requirements

### Requirement: Notification inbox data SHALL be fetched eagerly
The notification inbox query SHALL begin fetching immediately when the `NotificationBell` component mounts, regardless of whether the popover is open.

#### Scenario: Inbox data available before popover opens
- **WHEN** an authenticated user is on any page with `NotificationBell` rendered
- **THEN** the inbox query SHALL start fetching notification items immediately on mount

#### Scenario: Popover opens with cached data
- **WHEN** the user opens the notification popover after data has been fetched
- **THEN** the notification list SHALL render immediately without a loading skeleton

### Requirement: Inbox query SHALL poll as fallback
The notification inbox query SHALL use a `refetchInterval` of 15 seconds as a fallback mechanism when realtime is unavailable.

#### Scenario: Inbox data refreshes periodically
- **WHEN** the `NotificationBell` component is mounted and 15 seconds have elapsed
- **THEN** the inbox query SHALL refetch in the background
