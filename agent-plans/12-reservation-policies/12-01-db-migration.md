# Phase 1: Database + Defaults

**Dependencies:** -  
**Parallelizable:** No  
**User Stories:** US-12-01

---

## Objective

Persist per-court reservation policies so courts can have different booking/cancellation rules.

---

## Module 1A: Extend `reservable_court_detail`

### Add Columns (MVP)

- `requires_owner_confirmation` (boolean)
- `payment_hold_minutes` (int)
- `owner_review_minutes` (int)
- `cancellation_cutoff_minutes` (int)

### Default/Backfill Strategy

- Existing courts should retain current behavior by default:
  - `payment_hold_minutes = 15`
  - `requires_owner_confirmation = true` for paid courts (or default per decision)
  - `owner_review_minutes` defaults to a safe value (e.g., 60) if confirmation is enabled
  - `cancellation_cutoff_minutes` defaults to product decision (0 or 30)

### Migration Notes

- Add non-null defaults where safe.
- Avoid breaking existing read paths that assume reservable detail fields may be nullable.

### Testing Checklist

- [ ] Existing court creation/edit continues to work
- [ ] Existing court detail reads do not error
