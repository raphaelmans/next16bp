## ADDED Requirements

### Requirement: System SHALL support venue-level (GLOBAL) add-on definitions
The system SHALL store place-scoped add-ons in a `place_addon` table with `place_id`, `label`, `is_active`, `mode` (OPTIONAL|AUTO), `pricing_type` (HOURLY|FLAT), `flat_fee_cents`, `flat_fee_currency`, and `display_order`. HOURLY place add-ons SHALL store their rate windows in a `place_addon_rate_rule` table mirroring the structure of `court_addon_rate_rule`.

#### Scenario: Owner creates a GLOBAL FLAT add-on
- **WHEN** an owner saves a place add-on with `pricing_type=FLAT`, `flat_fee_cents=15000`, `flat_fee_currency=PHP`
- **THEN** a `place_addon` row is persisted with those values and zero rate rules

#### Scenario: Owner creates a GLOBAL HOURLY add-on
- **WHEN** an owner saves a place add-on with `pricing_type=HOURLY` and at least one rate rule
- **THEN** a `place_addon` row and corresponding `place_addon_rate_rule` rows are persisted

### Requirement: GLOBAL add-ons are always inherited by all courts at the place
The system SHALL apply all active GLOBAL add-ons to every court at a place; courts SHALL NOT be able to opt out of GLOBAL add-ons.

#### Scenario: New court at a place with existing GLOBAL add-ons
- **WHEN** a new court is created at a place that already has GLOBAL add-ons
- **THEN** the new court's booking flow automatically includes all active GLOBAL add-ons without any court-level configuration

#### Scenario: Deactivating a GLOBAL add-on
- **WHEN** an owner sets a place add-on `is_active=false`
- **THEN** that add-on is excluded from all courts' pricing and player selection immediately

### Requirement: Owner SHALL manage GLOBAL add-ons via `placeAddon.get` / `placeAddon.set` tRPC endpoints
The `placeAddon` router SHALL expose a `get` query and a `set` mutation. `set` SHALL use a delete-and-reinsert pattern identical to `courtAddon.set`. Only the venue owner (via organization ownership chain) SHALL be authorized to call `set`.

#### Scenario: Unauthorized user attempts to set place add-ons
- **WHEN** a user who is not the venue owner calls `placeAddon.set`
- **THEN** the system returns a FORBIDDEN error and no rows are modified

#### Scenario: Owner replaces all place add-ons
- **WHEN** the owner calls `placeAddon.set` with a new list of add-ons
- **THEN** all prior `place_addon` rows for that place are deleted and replaced with the new list

### Requirement: FLAT place add-ons SHALL NOT require rate rule rows
FLAT place add-ons SHALL be valid with zero `place_addon_rate_rule` rows. The system SHALL reject a request to set an HOURLY place add-on with zero rules.

#### Scenario: FLAT place add-on with no rules saves successfully
- **WHEN** an owner saves a FLAT place add-on with an empty rules array
- **THEN** the system persists the add-on without error

#### Scenario: HOURLY place add-on with no rules is rejected
- **WHEN** an owner saves an HOURLY place add-on with an empty rules array
- **THEN** the system returns a validation error requiring at least one rule

### Requirement: Owner UI SHALL provide a venue-level add-on editor (`PlaceAddonEditor`)
A new `PlaceAddonEditor` component SHALL allow owners to create, edit, and delete GLOBAL add-ons. FLAT add-ons SHALL hide the schedule rules section. HOURLY add-ons SHALL show the schedule rules section. The editor SHALL use `placeAddon.get` to load and `placeAddon.set` to save.

#### Scenario: Owner adds a FLAT venue add-on in the editor
- **WHEN** an owner opens the venue add-on editor and creates a FLAT add-on with label "Paddle Rental" and flat fee ₱150
- **THEN** the schedule rules section is hidden and saving persists the add-on as a GLOBAL FLAT add-on
