## MODIFIED Requirements

### Requirement: Membership administration SHALL be permission-gated
Only organization owner or members with `organization.member.manage` permission SHALL administer members and invitations. The `reservation.update_status` permission scope includes cancellation of confirmed reservations in addition to existing accept/reject/confirm-payment operations.

#### Scenario: Manager with permission updates member permissions
- **WHEN** a manager with `organization.member.manage` updates a member's permissions
- **THEN** the membership record is updated and persisted

#### Scenario: Viewer cannot administer memberships
- **WHEN** a viewer without `organization.member.manage` calls member admin mutation
- **THEN** the system returns a forbidden error

#### Scenario: reservation.update_status permission covers cancel confirmed
- **WHEN** a member with `reservation.update_status` permission attempts to cancel a confirmed reservation
- **THEN** the operation is authorized
- **AND** no additional permission is required beyond `reservation.update_status`
