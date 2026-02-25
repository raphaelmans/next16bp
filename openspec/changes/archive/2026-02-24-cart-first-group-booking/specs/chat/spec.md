## ADDED Requirements

### Requirement: Grouped reservations use group chat thread contracts
The chat domain SHALL support reservation-group thread/session/message contracts so grouped bookings can be handled in one shared conversation.

#### Scenario: Group session is issued for grouped booking
- **WHEN** a player or owner opens chat from a grouped reservation flow
- **THEN** the system issues chat session metadata for a reservation-group thread keyed by `reservationGroupId`
- **AND** the session includes only participants authorized for that grouped booking context

#### Scenario: Group message uses group thread identity
- **WHEN** a participant sends a message from a grouped reservation chat surface
- **THEN** the message is posted to the reservation-group thread identity
- **AND** the message is not fan-out duplicated across separate per-item reservation threads

### Requirement: Single-reservation chat compatibility is preserved
The chat domain SHALL keep existing reservation-level session and messaging contracts functional for non-grouped reservations and legacy entry points.

#### Scenario: Single reservation chat remains unchanged
- **WHEN** a user opens chat for a non-grouped reservation
- **THEN** the system continues using reservation-level chat contracts and identity semantics

#### Scenario: Historical reservation thread remains accessible
- **WHEN** a user accesses existing reservation-level chat history created before group-thread handling
- **THEN** the thread remains accessible under existing authorization and read-only rules
