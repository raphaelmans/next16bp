## ADDED Requirements

### Requirement: Organization owner or authorized manager SHALL invite members by email
The system SHALL allow an authorized membership administrator to create email invitations with role and explicit permissions for reservation operations.

#### Scenario: Owner invites manager
- **WHEN** the organization owner sends an invite to `staff@example.com` with role `MANAGER`
- **THEN** the system stores a pending invitation with role and permissions snapshot
- **AND** sends an email containing an acceptance link with secure token

#### Scenario: Duplicate pending invite prevented
- **WHEN** an invitation already exists in `PENDING` state for the same organization and email
- **THEN** the system rejects duplicate invite creation

### Requirement: Invitation acceptance SHALL require authenticated existing user
Invitation acceptance SHALL require a logged-in user and the authenticated email MUST match the invited email.

#### Scenario: Matching authenticated email accepts invite
- **WHEN** an authenticated user with matching email opens a valid pending invite token before expiry
- **THEN** the invitation transitions to `ACCEPTED`
- **AND** an active organization membership is created or reactivated with role and permissions

#### Scenario: Mismatched email cannot accept
- **WHEN** a logged-in user attempts to accept an invite sent to a different email
- **THEN** the system rejects the action with authorization error

### Requirement: Membership administration SHALL be permission-gated
Only organization owner or members with `organization.member.manage` permission SHALL administer members and invitations.

#### Scenario: Manager with permission updates member permissions
- **WHEN** a manager with `organization.member.manage` updates a member's permissions
- **THEN** the membership record is updated and persisted

#### Scenario: Viewer cannot administer memberships
- **WHEN** a viewer without `organization.member.manage` calls member admin mutation
- **THEN** the system returns forbidden
