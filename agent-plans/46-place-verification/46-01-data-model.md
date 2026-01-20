# Phase 1: Data Model + Storage

**Dependencies:** None  
**Parallelizable:** Partial  
**User Stories:** US-19-01, US-19-02, US-19-03, US-19-04

---

## Objective

Introduce per-place verification state, verification request tables (with audit trail), and a document storage model to support admin review.

---

## Modules

### Module 1A: Place Verification Gate Table

**User Stories:** `US-19-03`, `US-19-04`

Add a new 1:1 table: `place_verification`.

Fields:

- `place_id` (PK, FK -> place.id)
- `status` (enum)
- `verified_at` (timestamptz, nullable)
- `verified_by_user_id` (uuid -> auth.users, nullable)
- `reservations_enabled` (boolean)
- `reservations_enabled_at` (timestamptz, nullable)

Recommended constraint:

- `CHECK (reservations_enabled = false OR status = 'VERIFIED')`

Data migration guidance (no grandfathering):

- Create a `place_verification` row for every existing place with:
  - `status = UNVERIFIED`
  - `reservations_enabled = false`

This ensures existing reservable places must go through verification + enable again to become bookable.


---

### Module 1B: Verification Request Tables + Audit Trail

**User Stories:** `US-19-01`, `US-19-02`

Create tables:

- `place_verification_request`
- `place_verification_request_event`
- `place_verification_request_document`

Core constraints:

- Only one pending request per place:
  - `UNIQUE (place_id) WHERE status = 'PENDING'`

Indexing:

- Index `place_id`
- Index `organization_id`
- Index `status` (and/or partial pending index)

---

### Module 1C: Storage Bucket + Upload Constraints

**User Stories:** `US-19-01`

Add a dedicated bucket for verification docs (recommended name):

- `place-verification-docs`

Notes:

- MVP supports images (JPEG/PNG/WebP) and PDF (application/pdf).
- Consider making the bucket private and serving signed URLs to admins/owners. If that adds too much complexity for v1, keep bucket public but do not expose URLs publicly in the UI.

---

## Testing Checklist

- [ ] Migration applies cleanly.
- [ ] All existing places receive an UNVERIFIED place_verification row.
- [ ] Unique pending constraint prevents duplicates.
