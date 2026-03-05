## MODIFIED Requirements

### Requirement: Membership administration SHALL be permission-gated
Only organization owner or members with `organization.member.manage` permission SHALL administer members and invitations. The permission set SHALL include `place.manage` for venue and court management delegation. Default manager permissions SHALL include `place.manage`.

#### Scenario: Manager with permission updates member permissions
- **WHEN** a manager with `organization.member.manage` updates a member's permissions
- **THEN** the membership record is updated and persisted

#### Scenario: Viewer cannot administer memberships
- **WHEN** a viewer without `organization.member.manage` calls member admin mutation
- **THEN** the system returns forbidden

#### Scenario: New manager receives place.manage by default
- **WHEN** a new member is invited with role `MANAGER` and no explicit permission override
- **THEN** the member's permissions include `place.manage` along with all other default manager permissions
