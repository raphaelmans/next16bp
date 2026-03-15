# Phase 1: Data Model + Migration

**Dependencies:** None  
**Parallelizable:** No  
**User Stories:** US-20-01, US-20-02, US-20-03

---

## Objective

Add a lightweight approval workflow for user-submitted curated places.

Implementation is based on fields on `place` so that unapproved submissions can exist as real records but be fully hidden from public discovery.

Out of scope (handled in a later session): notifying the submitter when their suggestion is approved/rejected.

---

## Schema Changes

### Table: `place`

Add:

- `is_approved` (boolean, not null, default true)
- `submitted_by_user_id` (uuid, nullable, references auth users)
- `submitted_by_email_snapshot` (varchar 255, nullable)
- `reviewer_user_id` (uuid, nullable, references auth users)
- `reviewed_at` (timestamptz, nullable)
- `review_notes` (text, nullable)

Notes:
- Existing places default to `is_approved=true` and remain visible.
- User submissions will set `is_approved=false`.

### Index Recommendation

Consider adding an index for the common public list predicate:

- `(is_active, is_approved)`

---

## Migration Plan

1. Add columns with safe defaults (especially `is_approved default true`).
2. Backfill is not required (default covers existing rows).
3. Generate migration via drizzle scripts.
4. Apply migration.

---

## Rollout / Compatibility

- Public list and public detail must be updated in the same deployment to avoid leaking unapproved submissions via direct ID access.
