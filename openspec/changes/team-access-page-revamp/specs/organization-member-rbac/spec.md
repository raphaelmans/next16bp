## ADDED Requirements

### Requirement: Team management SHALL be accessible via dedicated navigation
The system SHALL provide a dedicated Team & Access page at `/owner/team` with its own sidebar navigation entry, separate from the settings page.

#### Scenario: Owner navigates to team page via sidebar
- **WHEN** an owner clicks "Team" in the sidebar navigation
- **THEN** the system renders the Team & Access page at `/owner/team`
- **AND** the "Team" sidebar item is highlighted as active

#### Scenario: Team section removed from settings page
- **WHEN** an owner navigates to `/owner/settings`
- **THEN** the Team & Access card section SHALL NOT be rendered on the settings page

### Requirement: Member list SHALL support search and role filtering
The team page SHALL allow administrators to search members by name or email and filter by role.

#### Scenario: Search filters members by name
- **WHEN** an administrator types a search query in the member search input
- **THEN** the member list filters to show only members whose display name or email contains the query (case-insensitive)

#### Scenario: Role filter shows only matching members
- **WHEN** an administrator selects a specific role from the role filter dropdown
- **THEN** the member list shows only members with the selected role

### Requirement: Member permissions SHALL be editable via slide-out panel
The system SHALL present permission editing in a slide-out sheet panel with permissions grouped by domain.

#### Scenario: Admin opens permission editor
- **WHEN** an administrator clicks "Edit permissions" from a member's overflow menu
- **THEN** a sheet panel slides in from the right showing the member's name, role selector, and permissions grouped into "Reservations" and "Administration" sections

#### Scenario: Permission changes persist on save
- **WHEN** an administrator modifies permissions in the sheet and clicks "Save"
- **THEN** the system persists the updated permissions via the existing update mutation
- **AND** displays a success toast notification

### Requirement: Destructive actions SHALL require confirmation
Revoking a member or canceling an invitation SHALL require explicit confirmation via an alert dialog.

#### Scenario: Revoke member requires confirmation
- **WHEN** an administrator clicks "Revoke access" from a member's overflow menu
- **THEN** the system displays an AlertDialog asking for confirmation before executing the revocation

#### Scenario: Cancel invitation requires confirmation
- **WHEN** an administrator clicks "Cancel" on a pending invitation
- **THEN** the system displays an AlertDialog asking for confirmation before canceling the invitation

### Requirement: Member invitation SHALL use a dialog modal
The system SHALL present the invite member form in a dialog modal triggered by an "Invite" button in the page header.

#### Scenario: Invite dialog opens from page header
- **WHEN** an administrator clicks the "Invite" button in the Team & Access page header
- **THEN** a dialog modal opens with fields for email, role selection, and grouped permission checkboxes

#### Scenario: Role change in invite dialog resets permissions to defaults
- **WHEN** an administrator changes the role selection in the invite dialog
- **THEN** the permission checkboxes reset to the default permissions for the selected role
