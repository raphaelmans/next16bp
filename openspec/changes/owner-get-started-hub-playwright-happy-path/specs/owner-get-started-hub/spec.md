## ADDED Requirements

### Requirement: Owner setup hub SHALL orchestrate setup steps through in-hub actions
The owner setup hub SHALL present setup cards whose actions are executed from the hub surface, with prerequisites enforced by setup status.

#### Scenario: Organization step can be completed in-hub
- **WHEN** an owner without an organization opens `/owner/get-started`
- **THEN** the hub shows a "Create organization" action that opens an organization dialog
- **AND** successful submission updates the hub status without requiring a full route transition

#### Scenario: Venue and court setup actions run from hub overlays
- **WHEN** the owner has prerequisite status for venue and courts actions
- **THEN** "Add venue" and "Set up courts" actions open in-hub sheets
- **AND** successful submission closes the sheet and refreshes setup status indicators

#### Scenario: Verification action is accessible from the hub
- **WHEN** the owner has a venue on the setup hub
- **THEN** a verification action is available from the verification card state
- **AND** selecting the action opens the in-hub verification sheet

### Requirement: Setup smoke documentation SHALL match implemented hub behavior
Manual smoke checklists for owner setup SHALL describe the in-hub overlay flow for venue, courts, and verification steps.

#### Scenario: Manual smoke docs reflect overlay actions
- **WHEN** a contributor reads setup-hub smoke docs
- **THEN** venue, courts, and verification steps are documented as in-hub overlays/sheets
- **AND** outdated route-hop expectations for those steps are removed or replaced
