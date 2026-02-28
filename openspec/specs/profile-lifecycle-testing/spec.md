# profile-lifecycle-testing Specification

## Purpose
TBD - created by archiving change tdd-profile-lifecycle-testing. Update Purpose after archive.
## Requirements
### Requirement: Profile service SHALL enforce profile lifecycle contracts
The profile service SHALL provide deterministic behavior for profile read, create-or-read, update, and avatar upload operations.

#### Scenario: get-or-create returns existing profile without duplicate create
- **WHEN** a user already has a profile
- **THEN** `getOrCreateProfile` returns the existing profile
- **AND** no additional profile record is created

#### Scenario: update profile auto-creates when missing
- **WHEN** `updateProfile` is called for a user with no profile record
- **THEN** a profile is created and updated in the same logical operation
- **AND** the returned profile contains updated fields

### Requirement: Profile router SHALL map domain errors to transport errors
Profile router endpoints SHALL translate profile domain errors into stable TRPC error contracts.

#### Scenario: get-by-id for missing profile returns NOT_FOUND
- **WHEN** `getById` is called with a non-existent profile id
- **THEN** router returns TRPC `NOT_FOUND`
- **AND** no internal error details are leaked

### Requirement: Avatar upload SHALL persist URL and return transport payload
Avatar upload SHALL return a URL payload and persist the same URL to the profile record.

#### Scenario: upload avatar success
- **WHEN** a valid image file is uploaded
- **THEN** router returns `{ url }`
- **AND** profile repository is updated with the uploaded avatar URL

