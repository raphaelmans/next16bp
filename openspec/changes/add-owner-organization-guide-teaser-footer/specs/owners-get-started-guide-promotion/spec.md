## ADDED Requirements

### Requirement: Owners get-started page promotes the organization guide near the bottom of the page
The public owners get-started page SHALL include a dedicated organization-guide teaser section after the FAQ block and before the existing final CTA block.

#### Scenario: Guide teaser appears in the expected page order
- **WHEN** a visitor scrolls through `/owners/get-started`
- **THEN** the guide teaser appears after the FAQ section and before the final account-conversion CTA

### Requirement: Guide teaser provides guide and account entry actions
The organization-guide teaser SHALL offer a primary action to read the new organization guide and a secondary action that preserves the current owner-account creation flow.

#### Scenario: Guide teaser actions route to the correct destinations
- **WHEN** a visitor uses the guide teaser actions on `/owners/get-started`
- **THEN** the primary action opens the organization guide
- **AND** the secondary action routes through the existing owner registration flow

### Requirement: Owners get-started page ends with the shared public footer
The public owners get-started page SHALL render the shared public footer after the existing final CTA.

#### Scenario: Shared footer is appended after the final CTA
- **WHEN** a visitor reaches the bottom of `/owners/get-started`
- **THEN** the existing final CTA is followed by the shared public footer navigation
