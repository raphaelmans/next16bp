## ADDED Requirements

### Requirement: Realtime client SHALL subscribe to user_notification INSERTs
A notification realtime client SHALL subscribe to `postgres_changes` INSERT events on the `user_notification` table via Supabase realtime.

#### Scenario: Client subscribes on mount
- **WHEN** the notification realtime hook mounts for an authenticated user
- **THEN** it SHALL create a Supabase realtime channel subscribed to INSERT events on `user_notification`

#### Scenario: Client unsubscribes on unmount
- **WHEN** the notification realtime hook unmounts
- **THEN** it SHALL remove the Supabase realtime channel

### Requirement: Realtime events SHALL invalidate notification queries
When a realtime INSERT event is received, both the unread count and inbox list queries SHALL be invalidated to trigger a refetch.

#### Scenario: New notification arrives via realtime
- **WHEN** a new row is inserted into `user_notification` for the current user
- **THEN** the `userNotification.unreadCount` and `userNotification.listMy` queries SHALL be invalidated

### Requirement: RLS SHALL restrict realtime events to the authenticated user
Row-level security on `user_notification` SHALL ensure that each client only receives INSERT events for rows matching their `auth.uid()`.

#### Scenario: User receives only their own notifications
- **WHEN** a notification is inserted for user A
- **THEN** only user A's realtime subscription SHALL receive the event

### Requirement: user_notification table SHALL be added to supabase_realtime publication
A setup script SHALL add the `user_notification` table to the `supabase_realtime` publication if not already present.

#### Scenario: Script enables realtime
- **WHEN** the enable-realtime script is run
- **THEN** `user_notification` SHALL be added to the `supabase_realtime` publication
