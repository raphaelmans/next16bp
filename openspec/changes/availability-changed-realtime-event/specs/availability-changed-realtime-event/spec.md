## ADDED Requirements

### Requirement: Server SHALL Emit Scope-Rich Availability Change Events
The system SHALL emit a dedicated `availability.changed` realtime event whenever reservation or court-block mutations change public bookability for a court time range.

#### Scenario: Reservation creation books a public slot
- **WHEN** a reservation is created in a status that occupies bookable inventory
- **THEN** the server MUST emit an availability change event containing the affected court scope and slot/bookability state

#### Scenario: Reservation release frees a public slot
- **WHEN** a reservation transitions from an availability-blocking state to a non-blocking state
- **THEN** the server MUST emit an availability change event describing the released slot scope

#### Scenario: Court block create, cancel, or reschedule affects public availability
- **WHEN** a maintenance or walk-in court block is created, cancelled, or rescheduled
- **THEN** the server MUST emit one or more availability change events that describe the released and newly blocked slot scopes as needed

### Requirement: Event Payload SHALL Carry Patchable Court-Slot State
The availability change event payload SHALL carry enough court-scoped data for the client to patch matching court availability caches directly.

#### Scenario: Court range cache can patch exact slot
- **WHEN** the client has a court-day or court-range cache entry whose slot matches the event payload
- **THEN** the client MUST be able to update the cached option status and unavailable reason directly from the event payload

#### Scenario: Aggregate cache cannot patch exactly
- **WHEN** the client has a place-sport aggregate cache that cannot be updated exactly from a single-court event
- **THEN** the client MUST invalidate or refetch the affected aggregate scope instead of applying an unsafe direct patch

### Requirement: Discovery Consumers SHALL Recover From Missed Events
The client SHALL continue using focus/reconnect authoritative refetch as a safety net for missed availability events.

#### Scenario: Missed websocket event
- **WHEN** the client misses one or more availability change events
- **THEN** discovery availability queries MUST recover via focus or reconnect refetch
- **AND** the recovered state MUST overwrite any stale local slot state
