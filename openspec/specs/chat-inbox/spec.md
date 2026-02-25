## Purpose

Defines inbox scoping, per-user force archive, manual unarchive, and refresh loading correctness requirements for the chat inbox.

## Requirements

### Requirement: Active Inbox List Only

The chat inbox SHALL show only actionable threads by default and SHALL not expose a separate archived section in the main list.

#### Scenario: Reservation threads default visibility

- **WHEN** a user opens the reservation inbox with default fetch options
- **THEN** statuses `CREATED`, `AWAITING_PAYMENT`, and `PAYMENT_MARKED_BY_USER` are visible
- **AND** `CONFIRMED` is visible only when `end_time >= now`
- **AND** `EXPIRED`, `CANCELLED`, and past `CONFIRMED` are hidden
- **AND** user-archived threads are hidden by default

#### Scenario: Support threads default visibility

- **WHEN** support channels are listed in inbox
- **THEN** channels archived by that user are hidden
- **AND** no Archive collapsible bucket is shown in the main list

#### Scenario: Reservation includeArchived override

- **GIVEN** reservation threads include rows archived by the current user
- **WHEN** thread metas are fetched with `includeArchived: true`
- **THEN** archived rows are returned for compatibility paths

### Requirement: Per-User Force Archive

Users SHALL be able to force-archive threads for inbox cleanup without deleting messages or channels.

#### Scenario: Archive reservation thread

- **GIVEN** a visible reservation thread in inbox
- **WHEN** user selects Archive
- **THEN** an archive record is upserted for that user and thread
- **AND** the thread disappears from that user inbox immediately
- **AND** other participants still see the thread unless they archive it themselves

#### Scenario: Archive support thread

- **GIVEN** a visible support thread in inbox
- **WHEN** user selects Archive
- **THEN** an archive record is upserted for that user and thread
- **AND** the thread disappears from that user inbox immediately

#### Scenario: Per-user archive isolation

- **GIVEN** user A archives a thread
- **WHEN** user B opens inbox with the same thread access
- **THEN** user B still sees the thread unless they archive it themselves

### Requirement: Manual Unarchive Only

Archived threads SHALL return to inbox only when manually unarchived.

#### Scenario: New message arrives on archived thread

- **GIVEN** a thread is archived by a user
- **WHEN** a new message is posted
- **THEN** the thread remains hidden from that user inbox
- **AND** no auto-unarchive occurs

#### Scenario: User unarchives thread

- **GIVEN** a thread is in the user archived list
- **WHEN** user selects Unarchive
- **THEN** the archive record is removed
- **AND** the thread becomes eligible to appear in inbox if it otherwise passes status rules

#### Scenario: Unarchive is idempotent

- **GIVEN** a thread is already not archived for the user
- **WHEN** user calls Unarchive again
- **THEN** operation succeeds without side effects or errors

### Requirement: Refresh Loading Correctness

Refresh controls SHALL not appear perpetually loading due to passive/background sync.

#### Scenario: Manual refresh button behavior

- **WHEN** user clicks refresh
- **THEN** spinner shows during manual operation only
- **AND** spinner stops when manual operation settles
- **AND** passive/background sync does not lock the spinner

#### Scenario: Background sync and manual spinner are decoupled

- **GIVEN** passive stream events trigger background syncing
- **WHEN** user does not click refresh
- **THEN** manual refresh spinner remains inactive
