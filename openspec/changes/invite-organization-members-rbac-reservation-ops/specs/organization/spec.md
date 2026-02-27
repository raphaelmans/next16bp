## MODIFIED Requirements

### Requirement: `organization.my` SHALL return organizations accessible to current user
The system SHALL return organizations where the current user is either canonical owner or active invited member.

#### Scenario: Manager sees assigned organization
- **WHEN** a user is not `organization.ownerUserId` but has active `organization_member` row for that organization
- **THEN** `organization.my` includes that organization in response

#### Scenario: Revoked member not included
- **WHEN** a membership status is `REVOKED`
- **THEN** `organization.my` excludes that organization for the revoked user
