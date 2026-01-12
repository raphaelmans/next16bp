# Place/Court Migration - Server/DB Dev Checklist

**Focus Area:** Database schema + APIs + booking logic  
**Modules:** 1A, 1B, 2A, 2B, 2C

---

## Phase 1: DB

- [ ] Add `sport` table and seed pickleball
- [ ] Add `place` tables (base + details/policy)
- [ ] Add `court` table (unit) + constraints
- [ ] Add `court_hours_window`
- [ ] Add `court_rate_rule`
- [ ] Update `time_slot` to reference court units
- [ ] Add `reservation_time_slot` join table

## Phase 2: APIs

### Place + Court
- [ ] Public: `place.list` supports sport filtering
- [ ] Public: `place.getById` returns courts + sports
- [ ] Owner: `placeManagement.*`
- [ ] Owner: `courtManagement.*`

### Availability
- [ ] `availability.getForCourt` returns valid start times for duration
- [ ] `availability.getForPlaceSport` returns valid starts + min price

### Reservations
- [ ] `reservation.createForCourt` locks N consecutive slots
- [ ] `reservation.createForAnyCourt` selects cheapest court then locks
- [ ] Slot status updates apply to all linked slots
- [ ] Expiration releases all linked slots

## Validation

- [ ] Run `pnpm lint`
- [ ] Run `pnpm build`
