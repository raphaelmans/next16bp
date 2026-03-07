## ADDED Requirements

### Requirement: Realtime Availability Unit Tests SHALL Follow The Client Testing Standard
The realtime availability unit-test suite SHALL follow `guides/client/core/testing.md`, including mirrored `src/__tests__/` layout, AAA test structure, deterministic fake or stub boundaries, and no live infrastructure.

#### Scenario: Mirrored test layout
- **WHEN** a realtime availability unit test is added for a client boundary or feature hook
- **THEN** the test file MUST live under `src/__tests__/` in the mirrored source-tree location

#### Scenario: Deterministic offline tests
- **WHEN** realtime availability behavior is tested
- **THEN** the tests MUST use stubs, fakes, or spies at the injected boundary
- **AND** they MUST NOT depend on live database, websocket, or network infrastructure

### Requirement: Availability Realtime Client Boundary SHALL Be Unit Tested
The availability realtime client boundary SHALL have unit tests that verify payload acceptance, filter behavior, error handling, and unsubscribe semantics.

#### Scenario: Valid payload is forwarded
- **WHEN** a valid `availability_change_event` payload is received
- **THEN** the realtime client MUST forward the parsed payload to the subscription callback

#### Scenario: Invalid payload is rejected
- **WHEN** an invalid realtime payload is received
- **THEN** the realtime client MUST invoke the error callback
- **AND** it MUST NOT forward the payload to the insert callback

#### Scenario: Scope filter selection
- **WHEN** a subscription is created for a court-scoped or place-scoped availability stream
- **THEN** the realtime client MUST attach the correct realtime filter for that scope

### Requirement: Discovery Realtime Sync SHALL Be Unit Tested
The discovery realtime sync layer SHALL have unit tests that verify court-cache direct patching and aggregate invalidation fallback.

#### Scenario: Court cache patch
- **WHEN** a matching court-scoped availability event arrives
- **THEN** the client MUST patch the cached court availability option state directly

#### Scenario: Aggregate invalidation fallback
- **WHEN** a matching place-sport aggregate availability event arrives
- **THEN** the client MUST invalidate the aggregate cache instead of applying an unsafe direct patch

### Requirement: Query Key And Optimistic Helper Contracts SHALL Be Unit Tested
The availability query-key normalizers and owner-side optimistic availability helpers SHALL retain dedicated unit coverage.

#### Scenario: Stable availability scope identity
- **WHEN** equivalent availability query inputs differ only by ordering or defaultable optional values
- **THEN** the normalized query scope MUST remain stable

#### Scenario: Optimistic availability helper determinism
- **WHEN** optimistic block append, replace, remove, resize, or in-range reconciliation helpers are used
- **THEN** they MUST produce deterministic outputs for the same inputs
