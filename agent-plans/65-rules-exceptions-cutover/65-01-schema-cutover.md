# Phase 1: Schema Cutover

**Dependencies:** None

---

## Objective

Remove slot materialization tables and shift reservations to a range-based model.

---

## Module 1A: Remove `time_slot` + `reservation_time_slot`

Update schema exports:

- Delete `src/shared/infra/db/schema/time-slot.ts`
- Delete `src/shared/infra/db/schema/reservation-time-slot.ts`
- Remove `timeSlotStatusEnum` from `src/shared/infra/db/schema/enums.ts`
- Update `src/shared/infra/db/schema/index.ts` exports accordingly

---

## Module 1B: Add range-based reservation + exception tables

### Reservation (range-based)

Update `src/shared/infra/db/schema/reservation.ts`:

- Remove `timeSlotId`
- Add:
  - `courtId: uuid -> court.id`
  - `startTime: timestamptz`
  - `endTime: timestamptz`
  - `totalPriceCents: int`
  - `currency: varchar(3)`

### Exception tables

Add:

- `src/shared/infra/db/schema/court-block.ts`
  - one-off court blocks: `courtId + startTime + endTime + reason?`
- `src/shared/infra/db/schema/court-price-override.ts`
  - one-off pricing overrides: `courtId + startTime + endTime + hourlyRateCents + currency`

Notes:

- Overlap constraints can be added later via raw SQL migrations (GiST + tstzrange exclusion) if needed.

---

## DB Apply Strategy (Dev)

Since this is development:

1. Reset DB (or drop affected tables)
2. Run `pnpm db:push`

---

## Testing Checklist

- [ ] TypeScript compiles after schema changes.
- [ ] `pnpm db:push` produces the expected DDL (drops old tables, creates new).
