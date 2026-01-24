# Phase 1: Schema and Constraints

**Dependencies:** None  
**Parallelizable:** No  
**User Stories:** US-05-03, US-05-04

---

## Objective

Extend `court_block` to support maintenance + walk-in blocks, revenue snapshots, and overlap prevention.

---

## Schema Changes

### 1) Add block type

Add a Postgres enum `court_block_type`:
- `MAINTENANCE`
- `WALK_IN`

### 2) Add analytics-safe fields

Add columns to `court_block`:
- `type` (enum, not null)
- `total_price_cents` (int, not null, default 0)
- `currency` (varchar(3), not null, default "PHP")

Notes:
- `MAINTENANCE` blocks should have `total_price_cents = 0`.
- `WALK_IN` blocks must have a computed snapshot.

### 3) Soft-cancel instead of delete

Add columns:
- `is_active` (bool, not null, default true)
- `cancelled_at` (timestamptz, nullable)

### 4) Constraints

- Keep `end_time > start_time`.
- Duration multiple of 60 minutes:
  - check `extract(epoch from (end_time - start_time)) % 3600 = 0`
- No overlap with other active blocks for same court:
  - Exclusion constraint on `(court_id WITH =, tstzrange(start_time, end_time, '[)') WITH &&)`
  - Partial/conditional: only enforce when `is_active = true`

### 5) Indexes

- Ensure queries can filter by `court_id` + `start_time` + `is_active`.

---

## Migration Notes

- Data backfill defaults:
  - Existing rows: `type = 'MAINTENANCE'`, `is_active = true`, `total_price_cents = 0`, `currency = 'PHP'`.

---

## Testing Checklist

- [ ] Can insert maintenance block
- [ ] Cannot insert overlapping active blocks for same court
- [ ] Can insert same range after previous block is cancelled (`is_active=false`)
- [ ] Cannot insert non-60-minute duration
