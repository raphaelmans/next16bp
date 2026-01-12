# Phase 1: DB Schema + Seeds

**Dependencies:** None  
**Parallelizable:** Partial  
**User Stories:** US-14-01, US-14-02, US-14-04, US-14-06, US-14-07, US-14-08, US-14-09

---

## Objective

Introduce the v1.2 schema to support:
- Place listings (curated/reservable)
- Court units per place (1 court = 1 sport)
- Day-specific hours (overnight supported via split windows)
- Hourly pricing rules
- 60-minute slot inventory
- Multi-slot reservations for duration (N consecutive 60-min slots)

Assumption: **dev reset**, so we can apply schema without backfilling legacy data.

---

## Tables (Target)

### New

- `sport`
- `place` (replaces legacy “court as location” concept)
- `curated_place_detail` (optional; mirrors curated details)
- `reservable_place_policy` (place-wide payment + policy)
- `place_photo` (optional; can reuse existing court_photo pattern at place-level)
- `place_amenity` (optional; can reuse existing court_amenity pattern at place-level)

- `court` (unit)
- `court_hours_window`
- `court_rate_rule`

- `reservation_time_slot` (join table)

### Modified

- `time_slot`
  - `court_id` now references `court.id` (unit)
  - Unique constraint remains per court unit per start

- `claim_request`
  - references `place_id` instead of `court_id`

---

## Constraints & Defaults

- `place.time_zone` default: `Asia/Manila`
- `sport` seed includes at minimum: `pickleball`
- `court` constraint: `UNIQUE(place_id, label)`
- `court_hours_window` constraint: (dayOfWeek 0–6) and `startMinute < endMinute`
- `court_rate_rule` constraint: same window constraints; overlaps should be rejected in service
- Slot duration constraint: multiples of 60 minutes (enforced in service)

---

## Reservation Multi-Slot Model (Strategy A)

### `reservation_time_slot`

Purpose: link a single reservation to multiple consecutive 60-minute slots.

Columns:
- `reservation_id` FK → `reservation.id`
- `time_slot_id` FK → `time_slot.id`
- `sequence` INT (0..N-1)

Constraints:
- `UNIQUE(reservation_id, sequence)`
- `UNIQUE(reservation_id, time_slot_id)`

Behavior:
- Reservation remains the primary entity for status/TTL.
- The join records define which slots are held/booked together.
- Slot status transitions happen for **all** linked slots.

---

## Seeds

Minimum seed data:
- `sport`: insert `pickleball` (and optionally others)

Optional seed:
- basic `place` + `court` for local testing

---

## Migration Order (DDL)

1. Create new reference tables: `sport`, `place`
2. Create place detail tables: `curated_place_detail`, `reservable_place_policy`
3. Create unit tables: `court`, `court_hours_window`, `court_rate_rule`
4. Update `time_slot` FK target + indexes
5. Create `reservation_time_slot`
6. Update claim/ownership tables to reference `place` if needed

---

## Testing Checklist

- [ ] Can create a place with `time_zone`
- [ ] Can create courts with unique labels per place
- [ ] Can insert valid/invalid court hours windows (constraints work)
- [ ] Can insert pricing rules and query by day/time
- [ ] Can create a 60-min slot linked to a court
- [ ] Can create a reservation linking 2+ slots via join table
