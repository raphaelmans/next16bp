## Purpose

Defines requirements for player-facing add-on selection in the booking flow, including optional add-on exposure, payload threading through availability and reservation calls, and deterministic state persistence across route transitions.

## Requirements

### Requirement: Player booking surfaces SHALL expose selectable optional add-ons

Discovery and booking surfaces SHALL display applicable add-ons for the selected court context and SHALL allow player selection for `OPTIONAL` add-ons.

#### Scenario: Player selects optional add-ons before checkout

- **WHEN** the player chooses one or more optional add-ons in booking selection flow
- **THEN** selected add-on IDs are persisted in booking state and reflected in booking summary UI

### Requirement: Booking flow SHALL thread selected add-on IDs through availability and reservation calls

The frontend SHALL pass `selectedAddonIds` through availability recalculation and reservation submission payloads.

#### Scenario: Player confirms reservation with selected add-ons

- **WHEN** the player submits booking confirmation
- **THEN** the reservation request includes `selectedAddonIds` and the review total reflects add-on-aware pricing

### Requirement: Add-on selection state SHALL remain deterministic across route transitions

The booking flow SHALL preserve and validate selected add-on IDs across navigation and route state transitions.

#### Scenario: Player navigates from place detail to booking review

- **WHEN** the player proceeds from slot selection to booking review
- **THEN** valid selected add-ons remain selected and invalid/unavailable IDs are safely dropped with user-visible guidance
