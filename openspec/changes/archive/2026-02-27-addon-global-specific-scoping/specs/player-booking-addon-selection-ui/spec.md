## MODIFIED Requirements

### Requirement: Player booking surfaces SHALL expose selectable optional add-ons
Discovery and booking surfaces SHALL display applicable add-ons for the selected court context. This includes both GLOBAL add-ons (from the place) and SPECIFIC add-ons (from the court). OPTIONAL add-ons from both scopes SHALL be selectable by the player. GLOBAL OPTIONAL add-ons SHALL be visually distinguished with a "(venue-wide)" badge. AUTO add-ons from both scopes SHALL be applied automatically and SHALL NOT be shown in the selector.

#### Scenario: Player sees both GLOBAL and SPECIFIC add-ons
- **WHEN** a player opens the add-on selection for a court that has one GLOBAL OPTIONAL add-on and one SPECIFIC OPTIONAL add-on
- **THEN** both add-ons appear in the selection list, with the GLOBAL one labeled "(venue-wide)"

#### Scenario: Player selects optional add-ons before checkout
- **WHEN** the player chooses one or more optional add-ons (from either scope) in the booking selection flow
- **THEN** selected add-on IDs are persisted in booking state and reflected in booking summary UI

### Requirement: Booking flow SHALL thread selected add-on IDs through availability and reservation calls
The frontend SHALL pass `selectedAddonIds` (which may include IDs from both GLOBAL and SPECIFIC scopes) through availability recalculation and reservation submission payloads. The backend SHALL validate selected IDs against the merged set of active add-ons for the court's place and court.

#### Scenario: Player confirms reservation with add-ons from both scopes
- **WHEN** the player submits booking confirmation with a GLOBAL add-on and a SPECIFIC add-on selected
- **THEN** the reservation request includes both IDs in `selectedAddonIds` and the review total reflects add-on-aware pricing from both scopes

## ADDED Requirements

### Requirement: Booking flow SHALL fetch and merge GLOBAL and SPECIFIC add-ons
The booking flow client SHALL fetch both `placeAddon.get(placeId)` and `courtAddon.get(courtId)` and merge the results before rendering the add-on selection UI. GLOBAL add-ons SHALL be listed first, followed by SPECIFIC add-ons, sorted by `display_order` within each group.

#### Scenario: Merged add-on list order
- **WHEN** a place has two GLOBAL add-ons (display_order 0, 1) and the court has one SPECIFIC add-on (display_order 0)
- **THEN** the player sees the two GLOBAL add-ons first, then the SPECIFIC add-on
