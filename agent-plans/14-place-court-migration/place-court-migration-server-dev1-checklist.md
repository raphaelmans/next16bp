# Place/Court Migration - Server/DB Dev Checklist

**Focus Area:** Database schema + APIs + booking logic  
**Modules:** 1A, 1B, 2A, 2B, 2C

---

## Phase 1: DB

- [x] Add `sport` table and seed pickleball
- [x] Add `place` tables (base + details/policy)
- [x] Add `court` table (unit) + constraints
- [x] Add `court_hours_window`
- [x] Add `court_rate_rule`
- [x] Update `time_slot` to reference court units
- [x] Add `reservation_time_slot` join table

## Phase 2: APIs

### Place + Court
- [x] Public: `place.list` supports sport filtering
- [x] Public: `place.getById` returns courts + sports
- [x] Owner: `placeManagement.*`
- [x] Owner: `courtManagement.*`

### Availability
- [x] `availability.getForCourt` returns valid start times for duration
- [x] `availability.getForPlaceSport` returns valid starts + min price

### Reservations
- [x] `reservation.createForCourt` locks N consecutive slots
- [x] `reservation.createForAnyCourt` selects cheapest court then locks
- [x] Slot status updates apply to all linked slots
- [x] Expiration releases all linked slots

## Validation

- [x] Run `pnpm lint`
- [x] Run `pnpm build`
