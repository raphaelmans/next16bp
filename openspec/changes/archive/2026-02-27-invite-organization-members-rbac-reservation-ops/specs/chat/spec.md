## MODIFIED Requirements

### Requirement: Reservation chat owner-side access SHALL include authorized organization members
The reservation chat boundary SHALL allow owner-side participation by active organization members with chat permission.

#### Scenario: Manager joins reservation chat
- **WHEN** an active organization member with `reservation.chat` requests reservation chat session
- **THEN** chat session creation succeeds
- **AND** the member is included in reservation chat participants

#### Scenario: Member without chat permission blocked
- **WHEN** an active organization member lacks `reservation.chat`
- **THEN** reservation chat session/message operations return forbidden
