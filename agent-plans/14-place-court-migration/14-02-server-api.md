# Phase 2: Server APIs + Booking Logic

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-14-01 through US-14-11

---

## Objective

Add server-side support for:
- Place discovery/filtering by sport
- Place detail with courts list
- Owner CRUD for place/court/hours/pricing
- Availability queries that support duration multiples of 60
- Reservation creation that locks and holds **N consecutive 60-min slots**
- “Any available court” selection by lowest total price

All reservation transitions must follow `docs/reservation-state-machine-level-2-engineering.md`.

---

## API Surface (tRPC)

### Public

#### `place.list`
- Input: `{ city?: string; lat?: number; lng?: number; sportId?: string }`
- Output: list of places with sport badges summary (derived from courts)

#### `place.getById`
- Input: `{ placeId: string }`
- Output: place detail + courts list:
  - court id, label, sport, tierLabel, active

#### `availability.getForCourt`
- Input: `{ courtId: string; date: string; durationMinutes: 60 | 120 | 180 | ... }`
- Output:
  - valid start times (aligned to 60-min grid)
  - total price for each start time
  - underlying slots (optional for UI)

#### `availability.getForPlaceSport`
- Input: `{ placeId: string; sportId: string; date: string; durationMinutes: number }`
- Output:
  - valid start times (60-min grid)
  - min total price per start time (computed across courts)

### Reservations

#### `reservation.createForCourt`
- Input: `{ courtId: string; startTime: string; durationMinutes: number }`
- Output: `{ reservationId: string; assignedCourtId: string; assignedCourtLabel: string; status: ... }`

#### `reservation.createForAnyCourt`
- Input: `{ placeId: string; sportId: string; startTime: string; durationMinutes: number }`
- Output: same shape, includes assigned court

### Owner

#### `placeManagement.create/update/list/getById`

#### `courtManagement.create/update/listByPlace/getById`

#### `courtHours.set/get`

#### `courtRateRule.set/get`

#### `timeSlot.createBulk60Min`
- Input: `{ courtId: string; date: string; startHour: number; endHour: number }` (exact fields TBD)
- Output: created slots count + ids

---

## Booking Logic Notes

### Duration strategy
- `durationMinutes` must be multiple of 60.
- Compute `slotCount = durationMinutes / 60`.

### Consecutive slot requirement
- A start time is valid iff there exist `slotCount` AVAILABLE slots:
  - same court
  - contiguous, each next slot starts exactly at previous end

### Price calculation
- Total = sum of `priceCents` for the chosen slots.
- For availability endpoints, compute total price similarly.

### “Any available court” selection
- For a given place + sport + startTime + duration:
  - find all courts that have `slotCount` consecutive AVAILABLE slots
  - compute total price for each
  - choose the lowest total price

### Concurrency
- Reservation creation must lock relevant slot rows in a transaction.
- If any slot is no longer AVAILABLE, fail fast with “not available”.

---

## Error Handling

- Invalid duration (not multiple of 60) → BAD_REQUEST
- No availability (specific court) → NOT_FOUND or BAD_REQUEST (choose consistently)
- No availability (any available) → NOT_FOUND with clear message
- Race conflict → CONFLICT or BAD_REQUEST (choose consistently)

---

## Testing Checklist

- [ ] place.list filter by sport
- [ ] place.getById returns courts
- [ ] availability endpoints only return valid starts
- [ ] createForCourt holds all slots and creates join records
- [ ] createForAnyCourt assigns court by lowest total price
- [ ] reservation expiry releases all held slots
