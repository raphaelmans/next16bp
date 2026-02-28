## ADDED Requirements

### Requirement: Organization RBAC services SHALL enforce permission checks consistently
Organization member services SHALL enforce required permissions for reservation and team-management operations.

#### Scenario: member lacks required permission
- **WHEN** a non-owner member requests an action requiring a missing permission
- **THEN** service denies the action with permission-denied semantics

#### Scenario: owner has implicit permissions
- **WHEN** organization owner performs a permission-gated action
- **THEN** service allows the action without requiring explicit membership permission records

### Requirement: Owner client RBAC helpers SHALL deterministically gate page and nav access
Owner feature helper functions SHALL deterministically evaluate access rules based on permission context.

#### Scenario: permission-gated nav filtering
- **WHEN** nav items include mixed owner-only and permission-based access rules
- **THEN** helper filtering returns only items accessible to the provided permission context

### Requirement: RBAC transport layer SHALL map permission denials to stable contracts
Organization-member router SHALL map permission-denied domain errors to TRPC `FORBIDDEN` consistently.

#### Scenario: list members without manage permission
- **WHEN** list members is requested by unauthorized caller
- **THEN** router returns `FORBIDDEN`
