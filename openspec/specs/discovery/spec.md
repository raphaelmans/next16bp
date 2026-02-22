# Discovery Domain

> Generated manually from source code (Source of Truth)

## Purpose

The Discovery domain enables users to search, filter, and view details of sports venues ("Places"). It serves as the entry point for the player journey, aggregating data from the `Place`, `Court`, and `Availability` domains to provide a rich search experience.

## Data Model

The Discovery domain primarily *consumes* data from other domains rather than owning its own localized schema. It relies on:

- **Place**: `id`, `name`, `slug`, `location`, `images`, `amenities`, `sports`
- **Court**: `id`, `label`, `sportId`
- **Availability**: Computed slot availability

## API & Actions

Based on `src/lib/modules/place/place.router.ts` and `src/features/discovery/api.ts`:

### Queries
- **`place.list`**: Search for places with filters (location, sport, amenities).
  - *Input*: `ListPlacesSchema` (includes lat/lng, radius, sportId)
  - *Logic*: Geospatial search + relation filtering.
- **`place.listSummary`**: Lightweight list for map pins/clusters.
- **`place.getByIdOrSlug`**: Retrieve full place details (SEO friendly).
- **`place.cardMediaByIds`**: Batch retrieval of media for place cards.
- **`place.cardMetaByIds`**: Batch retrieval of metadata (min price, available sports) for place cards.
- **`availability.getForPlaceSport`**: (Referenced in discovery features) Get availability overview for a place's sport.

## Key Logic

- **Geospatial Search**: Uses PostGIS or similar logic (via `listPlaces` service) to find venues within a radius.
- **Aggregated Metadata**: The `cardMetaByIds` endpoint aggregates "lowest price" and "available sports" to show on the search result card without fetching full details for every item.
- **SEO Support**: `getByIdOrSlug` supports slug-based routing for public indexing.
- **Performance**: Split between `list` (full data) and `listSummary` (map data) to optimize rendering of large result sets.

## Requirements

### Requirement: Player booking flow supports multi-court cart submission
The discovery-to-booking flow SHALL allow users to proceed with multiple selected reservation items and submit them through a grouped booking checkout.

#### Scenario: Multiple items in booking checkout
- **WHEN** a player reaches booking checkout with two or more selected items
- **THEN** the checkout submits grouped reservation creation with item-level court/time data

#### Scenario: Different-time item summary
- **WHEN** selected items have different time ranges
- **THEN** the checkout renders itemized schedule and pricing summary before confirmation

### Requirement: Booking flow remains backward compatible for single selection
The system SHALL keep single-selection booking behavior functional for existing users and deep links.

#### Scenario: Single item route params
- **WHEN** a booking URL contains one selected slot in the legacy format
- **THEN** checkout continues using compatible single-item booking behavior
