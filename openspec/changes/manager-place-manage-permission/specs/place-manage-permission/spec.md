## ADDED Requirements

### Requirement: Users with place.manage permission SHALL access venue and court management operations

The system SHALL allow any organization member with the `place.manage` permission to perform venue listing, venue detail viewing, venue updates, court CRUD, court hours configuration, court rate rule configuration, court addon configuration, court block management, and place addon configuration. Owners SHALL implicitly hold this permission via `OWNER_IMPLICIT_PERMISSIONS`.

#### Scenario: Manager with place.manage lists venues

- **WHEN** a manager with `place.manage` permission calls `placeManagement.list` for their organization
- **THEN** the system returns all places belonging to that organization

#### Scenario: Manager with place.manage views venue details

- **WHEN** a manager with `place.manage` permission calls `placeManagement.getById` for a place in their organization
- **THEN** the system returns the place details with contact info and amenities

#### Scenario: Manager with place.manage updates a venue

- **WHEN** a manager with `place.manage` permission calls `placeManagement.update` for a place in their organization
- **THEN** the system persists the updated place data

#### Scenario: Manager with place.manage creates a court

- **WHEN** a manager with `place.manage` permission calls `courtManagement.create` for a place in their organization
- **THEN** the system creates the court and returns the court record

#### Scenario: Manager with place.manage configures court hours

- **WHEN** a manager with `place.manage` permission calls `courtHours.set` for a court in their organization
- **THEN** the system persists the court hours windows

#### Scenario: Manager with place.manage configures court rate rules

- **WHEN** a manager with `place.manage` permission calls `courtRateRule.set` for a court in their organization
- **THEN** the system persists the rate rules

#### Scenario: Manager with place.manage configures court addons

- **WHEN** a manager with `place.manage` permission calls `courtAddon.set` for a court in their organization
- **THEN** the system persists the addon configuration

#### Scenario: Manager with place.manage creates and cancels court blocks

- **WHEN** a manager with `place.manage` permission calls `courtBlock.createMaintenance` or `courtBlock.cancelBlock` for a court in their organization
- **THEN** the system creates or cancels the block respectively

#### Scenario: Manager with place.manage configures place addons

- **WHEN** a manager with `place.manage` permission calls `placeAddon.set` for a place in their organization
- **THEN** the system persists the place addon configuration

### Requirement: Place creation SHALL remain owner-only

The system SHALL restrict place creation to the organization owner. Members with `place.manage` but without owner role SHALL NOT create new places.

#### Scenario: Manager cannot create a place

- **WHEN** a manager with `place.manage` permission calls `placeManagement.create`
- **THEN** the system returns FORBIDDEN

### Requirement: Place deletion SHALL remain owner-only

The system SHALL restrict place deletion to the organization owner.

#### Scenario: Manager cannot delete a place

- **WHEN** a manager with `place.manage` permission calls `placeManagement.delete`
- **THEN** the system returns FORBIDDEN

### Requirement: Place photo management SHALL remain owner-only

The system SHALL restrict place photo upload, removal, and reordering to the organization owner.

#### Scenario: Manager cannot upload place photos

- **WHEN** a manager with `place.manage` permission calls `placeManagement.uploadPhoto`
- **THEN** the system returns FORBIDDEN

### Requirement: Users without place.manage permission SHALL be denied court and place management access

The system SHALL return FORBIDDEN when a user without `place.manage` permission (and who is not the owner) attempts any court or place management operation.

#### Scenario: Viewer denied court management

- **WHEN** a viewer without `place.manage` permission calls any court management endpoint
- **THEN** the system returns FORBIDDEN

### Requirement: Frontend page guards SHALL use place.manage permission

Court and place management pages SHALL use `PermissionGate` with `{ type: "permission", permission: "place.manage" }` instead of `{ type: "owner-only" }`. Place creation and verification pages SHALL remain `owner-only`.

#### Scenario: Manager sees court setup page

- **WHEN** a manager with `place.manage` navigates to the court setup page
- **THEN** the `PermissionGate` renders the page content

#### Scenario: Manager sees "no access" on place creation page

- **WHEN** a manager navigates to the place creation page
- **THEN** the `PermissionGate` renders the `NoAccessView` fallback

### Requirement: Permissions sheet SHALL display place.manage in a Venues group

The team member permissions sheet SHALL include `place.manage` under a "Venues" permission group labeled "Manage venues and courts", allowing owners to grant or revoke this permission per member.

#### Scenario: Owner toggles place.manage for a manager

- **WHEN** the owner opens the permissions sheet for a manager and toggles `place.manage`
- **THEN** the permission is added to or removed from the member's stored permissions
