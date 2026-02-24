## ADDED Requirements

### Requirement: Booking page SHALL show profile-completion prompts when profile is incomplete
When profile completeness rules are not met, the page SHALL display a non-blocking banner and a booking-summary overlay prompt.

#### Scenario: Banner shown when profile incomplete
- **WHEN** booking page renders with incomplete profile
- **THEN** a banner appears above booking details with a "Complete Profile" CTA

#### Scenario: Summary overlay shown when profile incomplete
- **WHEN** booking page renders with incomplete profile
- **THEN** booking summary shows a visual overlay with a "Set up your profile to confirm" CTA
- **AND** confirm action remains disabled until profile becomes complete

### Requirement: Profile setup modal SHALL open inline from booking prompts
Profile completion SHALL be handled in a modal dialog opened from booking-page CTAs.

#### Scenario: Modal opens from banner or overlay CTA
- **WHEN** user clicks "Complete Profile" or "Set up your profile to confirm"
- **THEN** `ProfileSetupModal` opens as a dialog and focus moves into the modal

### Requirement: Profile setup modal SHALL validate and submit required profile fields
Modal form SHALL include required and optional fields and enforce client validation before submit.

#### Scenario: Modal fields and validation
- **WHEN** `ProfileSetupModal` is open
- **THEN** it contains `displayName` (required), `phoneNumber` (optional), and `email` (optional)
- **AND** empty `displayName` is rejected by validation

#### Scenario: Successful submit refreshes booking page state
- **WHEN** profile update mutation succeeds
- **THEN** profile query is invalidated
- **AND** modal closes
- **AND** profile completeness recomputes to true
- **AND** banner/overlay are removed and booking summary becomes interactive

### Requirement: Modal dismissal SHALL not navigate away or mutate profile
Closing the modal without submit SHALL preserve booking page state and avoid unwanted mutations/navigation.

#### Scenario: Modal dismissed without submit
- **WHEN** user dismisses modal via Escape or outside click
- **THEN** modal closes without profile mutation
- **AND** booking state stays unchanged

#### Scenario: No navigation on profile save
- **WHEN** profile is saved from modal
- **THEN** router does not navigate away from booking page
- **AND** booking params are preserved
