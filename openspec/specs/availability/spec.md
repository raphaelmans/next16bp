# Availability Domain

> Generated manually from source code (Source of Truth)

## Purpose

The Availability domain is responsible for determining when a Court is bookable. Unlike a materialized "Time Slot" model, availability here is **computed dynamically** by intersecting "Court Hours" (recurrence rules) with "Reservations" and "Court Blocks" (exceptions). This domain also handles pricing calculation based on time-of-day rules.

## Data Model

Based on `src/lib/shared/infra/db/schema/`:

### `CourtHoursWindow`
- **Purpose**: Defines *recurring* opening hours.
- **Key Fields**: `courtId`, `dayOfWeek` (0-6), `startMinute` (0-1439), `endMinute` (1-1440).
- **Constraint**: `startMinute < endMinute`.

### `CourtRateRule`
- **Purpose**: Defines *recurring* hourly pricing.
- **Key Fields**: `courtId`, `dayOfWeek`, `startMinute`, `endMinute`, `hourlyRateCents`, `currency`.
- **Constraint**: Non-overlapping windows per day.

### `CourtBlock`
- **Purpose**: One-off unavailability (e.g., Maintenance, Walk-ins).
- **Key Fields**: `courtId`, `startTime`, `endTime`, `type` (`MAINTENANCE`, `WALK_IN`), `reason`.
- **Constraint**: Duration must be a multiple of 60 minutes.

### `CourtPriceOverride` (implied from context)
- **Purpose**: Specific price for a specific date/time range (override recurring rules).

## API & Actions

Based on `src/lib/modules/availability/availability.router.ts`:

### Queries
- **`getForCourt`**: Get availability for a specific court on a specific date range.
  - *Logic*: Generates candidate slots from `CourtHoursWindow`, subtracts `Reservation` and `CourtBlock` ranges, applies `CourtRateRule`.
- **`getForCourts`**: Batch retrieval for multiple courts.
- **`getForPlaceSport`**: Get availability for all courts of a specific sport at a place.
- **`getForCourtRange`**: Availability within a specific start/end timestamp range.

## Key Logic

- **Computed Availability**: Slots are NOT stored in the DB. They are generated in-memory during query time.
- **Minute-based Rules**: Recurrence is stored as minutes-from-midnight (0-1440), requiring careful time zone conversion relative to the Place's time zone.
- **Precedence**: `CourtBlock` > `Reservation` > `CourtHoursWindow`. If a time is blocked or reserved, it is removed from the available hours.
- **Granularity**: The system enforces 60-minute blocks (`court_block_duration_multiple_of_60`).
