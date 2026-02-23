## MODIFIED Requirements

### Requirement: Owner forms SHALL support mode and pricing-type specific fields
The add-on management UI SHALL support `OPTIONAL` and `AUTO` modes, and SHALL support `HOURLY` and `FLAT` pricing types with type-specific field entry. When `pricingType` is `FLAT`, the schedule rules section SHALL be hidden entirely. When `pricingType` is `HOURLY`, the schedule rules section SHALL remain visible. Flat fee and hourly rate inputs SHALL accept values in currency units (e.g. ₱) and convert to cents on store; stored cent values SHALL be divided by 100 for display.

#### Scenario: Owner configures a FLAT add-on
- **WHEN** the owner selects `FLAT` pricing type
- **THEN** the UI requires flat fee amount and currency fields, hides the schedule rules section, and persists them through save

#### Scenario: Owner enters 150 in flat fee input
- **WHEN** an owner types `150` in the flat fee input
- **THEN** the system stores `15000` cents (₱150.00) and displays `150` in the input

#### Scenario: Owner enters 150 in hourly rate input
- **WHEN** an owner types `150` in the hourly rate input for a rule group
- **THEN** the system stores `15000` cents and displays `150` in the input

## ADDED Requirements

### Requirement: Court addon editor SHALL display inherited GLOBAL add-ons in a read-only section
The `CourtAddonEditor` SHALL fetch and display all active GLOBAL add-ons for the court's place in a read-only section labeled "Inherited from venue". No edit controls SHALL appear for inherited add-ons.

#### Scenario: Court has inherited GLOBAL add-ons
- **WHEN** an owner opens the court add-on editor for a court whose place has active GLOBAL add-ons
- **THEN** the inherited add-ons are displayed in a read-only section above the court-specific add-on list with no edit affordances

#### Scenario: Court has no inherited GLOBAL add-ons
- **WHEN** the place has no active GLOBAL add-ons
- **THEN** the inherited section is hidden
