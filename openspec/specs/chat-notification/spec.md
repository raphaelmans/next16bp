# Spec: Chat + Notification Parent Feature

## Purpose

Define unified behavior and architecture boundaries for chat inbox workflows and notification delivery surfaces, including domain-logic separation for testability.

## Requirements

### Requirement: Active Inbox List Only

The chat inbox SHALL show only actionable threads by default and SHALL not expose an inline archived bucket in the main list.

#### Scenario: Reservation threads default visibility

- **WHEN** a user opens reservation inbox with default fetch options
- **THEN** statuses `CREATED`, `AWAITING_PAYMENT`, and `PAYMENT_MARKED_BY_USER` are visible
- **AND** `CONFIRMED` is visible only when `end_time >= now`
- **AND** `EXPIRED`, `CANCELLED`, and past `CONFIRMED` are hidden
- **AND** user-archived threads are hidden by default

#### Scenario: Support threads default visibility

- **WHEN** support channels are listed in inbox
- **THEN** channels archived by that user are hidden
- **AND** no Archive collapsible bucket is shown in the main list

#### Scenario: Reservation unread badge mirrors active list visibility

- **GIVEN** unread messages exist on reservation channels
- **WHEN** some channels are hidden by reservation status/time rules or user archive rules
- **THEN** unread badge count includes only threads eligible for the default active inbox list
- **AND** hidden threads do not inflate the visible inbox unread badge

#### Scenario: Support unread badge mirrors active list visibility

- **GIVEN** unread messages exist on support channels
- **WHEN** some channels are archived by the current user
- **THEN** unread badge count includes only unarchived support threads shown in the active list

### Requirement: Per-User Force Archive

Users SHALL be able to force-archive threads for inbox cleanup without deleting messages or channels.

#### Scenario: Archive reservation thread

- **GIVEN** a visible reservation thread in inbox
- **WHEN** user selects Archive
- **THEN** an archive record is upserted for that user and thread
- **AND** the thread disappears from that user inbox immediately

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
- **AND** the thread becomes eligible to appear if it passes status visibility rules

### Requirement: Refresh Loading Correctness

Refresh controls SHALL reflect manual refresh operations only and SHALL not stay active due to passive/background sync.

#### Scenario: Manual refresh button behavior

- **WHEN** user clicks refresh
- **THEN** spinner shows during manual operation only
- **AND** spinner stops when manual operation settles

### Requirement: Shared Chat Canonical Rules

Chat channel and message identity rules that must behave consistently across client and server SHALL be implemented as pure module-owned shared functions.

#### Scenario: Canonical support channel parsing

- **GIVEN** channel ids prefixed with `cr-` or `vr-`
- **WHEN** shared chat parsing functions are called
- **THEN** kind and request id are derived consistently
- **AND** invalid prefixes are rejected deterministically

#### Scenario: Canonical reservation channel parsing

- **GIVEN** channel ids prefixed with `res-`
- **WHEN** shared chat parsing functions are called
- **THEN** reservation id derivation is consistent across call sites

### Requirement: Chat Feature View-Model Logic Is Pure

Chat feature view-model shaping SHALL be implemented in pure feature-local domain functions.

#### Scenario: Reservation read-only derivation

- **GIVEN** reservation chat meta and current time input
- **WHEN** read-only/archive status functions are evaluated
- **THEN** derived read-only states and reasons are deterministic

#### Scenario: Reservation inbox ordering derivation

- **GIVEN** reservation channels and metas
- **WHEN** sorting and partitioning functions run
- **THEN** output ordering and grouping are deterministic and testable without rendering

### Requirement: Notification Derived State Is Pure

Notification diagnostics and toggle eligibility logic SHALL be implemented as pure feature-local domain functions.

#### Scenario: Diagnostics derivation

- **GIVEN** notification support, secure-context, permission, configuration, and subscription inputs
- **WHEN** diagnostics derivation executes
- **THEN** diagnostics code and message are deterministic for the same inputs

#### Scenario: Toggle eligibility derivation

- **GIVEN** notification capability and busy-state inputs
- **WHEN** toggle eligibility derivation executes
- **THEN** disabled/enabled output is deterministic and independent from UI runtime concerns

### Requirement: Chat vs Notification Boundary

Chat unread/inbox domain logic SHALL remain in chat surfaces, while delivery-channel settings/status SHALL remain in notification surfaces.

#### Scenario: Chat unread indicators

- **GIVEN** unread chat messages exist
- **WHEN** user views app shell
- **THEN** unread indicator is shown in chat widget/inbox trigger
- **AND** unread chat state is not sourced from delivery notification jobs

#### Scenario: NotificationBell role

- **GIVEN** user opens NotificationBell
- **WHEN** browser push is configured or toggled
- **THEN** bell reflects delivery settings/status/diagnostics only
- **AND** does not represent chat thread inbox state

### Requirement: Testability Boundary Contract

Deterministic chat and notification rules SHALL be verifiable through pure unit tests; component tests SHALL focus on orchestration behavior.

#### Scenario: Pure rule verification

- **GIVEN** extracted shared and feature domain functions
- **WHEN** table-driven unit tests execute
- **THEN** invariants are validated without browser/network dependencies

#### Scenario: Unread aggregation verification

- **GIVEN** active inbox thread ids and unread-count mappings
- **WHEN** unread aggregation rules execute
- **THEN** only active thread ids contribute to badge totals
- **AND** missing/invalid unread values are handled deterministically

#### Scenario: Component test scope

- **GIVEN** chat and notification UI tests
- **WHEN** components are tested
- **THEN** assertions focus on rendering and interaction behavior
- **AND** deterministic branch rules are not redundantly re-tested in UI suites
