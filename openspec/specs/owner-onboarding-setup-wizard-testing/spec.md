# owner-onboarding-setup-wizard-testing Specification

## Purpose
TBD - created by archiving change tdd-owner-onboarding-setup-wizard-testing. Update Purpose after archive.
## Requirements
### Requirement: Owner setup status use-case SHALL derive deterministic onboarding status
The owner setup status use-case SHALL deterministically derive readiness and next-step outputs from organization, venue, court, verification, and payment inputs.

#### Scenario: no organization present
- **WHEN** no owner organization exists
- **THEN** status indicates setup is incomplete
- **AND** `nextStep` is `create_organization`

#### Scenario: verified venue with ready court and payment method
- **WHEN** organization exists and primary venue is verified with at least one ready active court and active payment method
- **THEN** status indicates setup complete
- **AND** `nextStep` is `complete`

### Requirement: Owner setup router SHALL expose stable status contract
The owner setup router SHALL return use-case output without modifying semantic fields.

#### Scenario: getStatus delegates to use-case for current user
- **WHEN** `ownerSetup.getStatus` is called by an authenticated owner
- **THEN** router calls use-case with caller user id
- **AND** returns the use-case payload

### Requirement: Wizard flow logic SHALL enforce step guard behavior
Wizard helper and hook logic SHALL prevent invalid progression into completion before prerequisites are met.

#### Scenario: direct access to complete step without prerequisites
- **WHEN** current step is `complete` and required setup states are not satisfied
- **THEN** wizard logic redirects to first incomplete step

