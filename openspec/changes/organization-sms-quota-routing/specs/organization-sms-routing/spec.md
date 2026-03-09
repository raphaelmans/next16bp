## ADDED Requirements

### Requirement: Organization-side SMS SHALL route to one resolved individual
The system SHALL resolve at most one individual recipient for each organization-side SMS event. The resolved recipient SHALL be the configured organization SMS assignee when that user is active in the organization, and SHALL fall back to the organization owner when no valid assignee is configured.

#### Scenario: Configured assignee receives organization SMS
- **WHEN** an organization has a valid SMS assignee and an organization-side SMS event is prepared
- **THEN** the system resolves that assignee as the SMS recipient

#### Scenario: Owner fallback is used when no assignee is configured
- **WHEN** an organization-side SMS event is prepared and the organization has no configured SMS assignee
- **THEN** the system resolves the organization owner as the SMS recipient

#### Scenario: Owner fallback is used when the assignee is no longer valid
- **WHEN** an organization-side SMS event is prepared and the configured SMS assignee is no longer an active organization member
- **THEN** the system resolves the organization owner as the SMS recipient

### Requirement: Organization-side SMS SHALL use the resolved individual profile phone only
The system SHALL send organization-side SMS only to the resolved individual recipient’s user profile phone number. The system SHALL NOT use a shared organization contact phone number for quota-governed organization SMS.

#### Scenario: SMS uses assignee profile phone
- **WHEN** the resolved SMS recipient has a phone number on their user profile
- **THEN** the SMS target is that profile phone number

#### Scenario: SMS is skipped when the resolved recipient has no phone
- **WHEN** the resolved SMS recipient does not have a phone number on their user profile
- **THEN** the system skips SMS delivery for that event

### Requirement: Organization-side SMS SHALL be limited to one SMS delivery per event
For organization-side events covered by this change, the system SHALL create or dispatch at most one SMS delivery per organization event regardless of how many users are enabled for non-SMS transports.

#### Scenario: Reservation fanout still produces one SMS
- **WHEN** a reservation-created event targets an organization with multiple enabled operational recipients
- **THEN** the system produces at most one organization-side SMS delivery for that event

#### Scenario: Non-SMS transports remain multi-recipient
- **WHEN** a reservation-created event targets an organization with multiple enabled operational recipients
- **THEN** inbox, email, web push, and mobile push routing continue to follow their existing recipient rules

### Requirement: Organizations SHALL be able to manage the explicit SMS assignee
The system SHALL allow authorized organization operators to set, change, and clear the explicit organization SMS assignee from the set of active organization members.

#### Scenario: Authorized operator assigns an active member
- **WHEN** an authorized operator selects an active organization member as the SMS assignee
- **THEN** the system persists that member as the configured SMS assignee

#### Scenario: Authorized operator clears the assignee
- **WHEN** an authorized operator clears the configured SMS assignee
- **THEN** the system removes the explicit assignee and future organization-side SMS uses owner fallback

#### Scenario: Invalid assignee is rejected
- **WHEN** an authorized operator attempts to assign a user who is not an active member of the organization
- **THEN** the system rejects the assignment
