# Phase 1: DB Overlap Protection

**Dependencies:** None  
**Parallelizable:** No  
**User Stories:** 05-availability-management

---

## Objective

Add a Postgres exclusion constraint to prevent overlapping time slots per court.

---

## Module 1A: time_slot exclusion constraint

**Reference:** `62-00-overview.md`

### Directory Structure

```
drizzle/
└── 0008_time_slot_no_overlap.sql
```

### Implementation Steps

1. Add SQL migration creating `btree_gist` extension if needed.
2. Add exclusion constraint using `tstzrange(start_time, end_time, '[)')`.
3. Ensure migration is ordered after existing time slot migrations.

### Code Example

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE time_slot
ADD CONSTRAINT time_slot_no_overlap
EXCLUDE USING gist (
  court_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
);
```

### Testing Checklist

- [ ] Migration applies cleanly on a DB with no overlaps.
- [ ] Attempting overlapping inserts results in conflict error.

---

## Phase Completion Checklist

- [ ] Migration added
- [ ] SQL reviewed for correctness
