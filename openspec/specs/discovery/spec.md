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
