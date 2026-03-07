## ADDED Requirements

### Requirement: Availability Reads SHALL Use Scoped Projection Queries
The system SHALL expose availability as scoped projection queries rather than as broad reservation-derived client recomposition. At minimum, the availability domain SHALL support court-day, court-range, and place-sport-range query scopes.

#### Scenario: Court day query is independently cacheable
- **WHEN** a surface requests availability for one court on one day
- **THEN** the system MUST serve that request through a scoped court-day availability query key
- **AND** that query MUST be independently invalidatable from broader range queries

#### Scenario: Court range and place-sport range remain separate concerns
- **WHEN** a surface requests week or multi-day availability
- **THEN** court-range and place-sport-range availability MUST use separate scoped query identities
- **AND** invalidation MUST target only the affected scope family

### Requirement: Availability Realtime Sync SHALL Use Event-Carried State Transfer
The system SHALL support availability synchronization through `event-carried state transfer` where realtime events carry the new visible slot state needed to patch simple availability caches directly, while authoritative court and place-sport projections still converge through scoped refetch.

#### Scenario: Cheap visible summary patch
- **WHEN** an availability change event precisely identifies an affected visible slot summary
- **THEN** the client MUST patch that visible summary immediately from the event payload
- **AND** the patching implementation MAY use `immer` to update the cached slot state in place
- **AND** the corresponding authoritative availability query MUST still be eligible for scoped refetch if required for correctness

#### Scenario: Range projection converges authoritatively
- **WHEN** a reservation, block, or other bookability change affects a visible availability range
- **THEN** the affected court-day, court-range, or place-sport-range projection query MUST refetch from the server
- **AND** the final visible state MUST match the authoritative server projection

#### Scenario: Missed event recovers on focus or reconnect
- **WHEN** a client misses one or more availability patch events because the tab was backgrounded or disconnected
- **THEN** the affected availability queries MUST recover through automatic authoritative refetch on window focus or reconnect
- **AND** the recovered state MUST overwrite any drifted client cache state

### Requirement: Availability Sync SHALL Follow Bookability Scope
The system SHALL derive availability synchronization from bookability-affecting domain changes rather than from full slot payload streaming.

#### Scenario: Reservation lifecycle affects availability
- **WHEN** a reservation lifecycle change alters whether a time range is bookable
- **THEN** the system MUST emit or derive an availability change scope for the affected court or place-sport range
- **AND** only availability queries overlapping that scope may be patched or invalidated

#### Scenario: Non-reservation bookability change affects availability
- **WHEN** a court block, court hours, pricing override, addon compatibility, or venue state change alters bookability
- **THEN** the system MUST synchronize affected availability projection queries using scoped availability change handling
- **AND** it MUST not rely solely on reservation lifecycle events to detect the change

### Requirement: Public Availability Events SHALL Carry Patchable Scope
The system SHALL expose a dedicated availability change event contract for public/discovery availability consumers when direct event-carried cache patching is required beyond owner-local optimistic updates.

#### Scenario: Public discovery cache receives scope-rich availability event
- **WHEN** a reservation or other bookability change affects public discovery availability
- **THEN** the server MUST emit an availability change event that includes enough scope to identify the affected court or place-sport range
- **AND** the event MUST carry enough slot or bookability state for the client to patch the visible discovery availability cache directly

#### Scenario: Reservation lifecycle event alone is insufficient
- **WHEN** the realtime payload only contains `reservationId` and lifecycle status
- **THEN** the client MUST NOT attempt broad public discovery availability patching from that payload alone
- **AND** the system MUST rely on a richer availability event or authoritative refetch instead
