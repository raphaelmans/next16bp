# Place & Court Domain

> Generated manually from source code (Source of Truth)

## Purpose

The Place & Court domain manages the physical inventory of the platform. A "Place" represents a venue (e.g., a sports complex), and a "Court" represents a specific bookable unit within that venue (e.g., "Court 1", "Badminton Court A"). This domain handles the creation, updating, and retrieval of these entities, including their metadata, location, and hierarchy.

## Data Model

Based on `src/lib/shared/infra/db/schema/place.ts` and `src/lib/shared/infra/db/schema/court.ts`:

### `Place`
- **Identity**: `id`, `slug` (Unique, URL-friendly)
- **Organization**: `organizationId` (Optional - can be unclaimed)
- **Location**: `address`, `city`, `province`, `country`, `latitude`, `longitude`, `timeZone`
- **Metadata**: `name`, `placeType` (Enum), `claimStatus` (Enum), `featuredRank`, `provinceRank`
- **External**: `extGPlaceId` (Google Place ID)
- **Status**: `isActive`

### `PlaceContactDetail`
- **Identity**: `id`, `placeId` (Unique)
- **Channels**: `facebookUrl`, `instagramUrl`, `websiteUrl`, `phoneNumber`, `viberInfo`, `otherContactInfo`

### `Court`
- **Identity**: `id`
- **Parent**: `placeId` -> Place
- **Sport**: `sportId` -> Sport
- **Metadata**: `label` (e.g., "Court 1"), `tierLabel` (e.g., "Premium")
- **Status**: `isActive`

## API & Actions

Based on `src/lib/modules/place` and `src/lib/modules/court` routers:

### Place Management
- **`create`**: Create a new place (typically via claiming or admin).
- **`update`**: Update place details (name, address, etc.).
- **`delete`**: Soft delete or deactivate.
- **`contact`**: Manage external contact links (for curated places).

### Court Management
- **`create`**: Add a court to a place.
- **`update`**: Rename or reconfigure a court.
- **`archive`**: Deactivate a court.

## Key Logic

- **Slug Uniqueness**: Places must have a unique slug for SEO-friendly URLs.
- **Hierarchy**: A Place can exist without Courts (curated view-only), but a Court must belong to a Place.
- **Claim Status**: Tracks whether a place is `UNCLAIMED`, `CLAIM_PENDING`, or `CLAIMED` (owned by an organization).
- **Geospatial Indexing**: Places are indexed by lat/long for discovery.
- **Time Zone**: Each place has a definitive `timeZone` which dictates how availability and booking times are calculated.
