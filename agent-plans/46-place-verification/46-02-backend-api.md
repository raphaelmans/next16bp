# Phase 2: Backend API + Booking Enforcement

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-19-01, US-19-02, US-19-03, US-19-04

---

## Objective

Implement a verification request module (owner + admin operations), upload handling for verification documents, and server-side enforcement that blocks booking when a place is unverified or reservation support is disabled.

---

## Modules

### Module 2A: Owner API (Submit Verification Request + Upload Docs)

**User Story:** `US-19-01`

Create a new module (suggested): `src/modules/place-verification/`.

Endpoints (tRPC):

| Endpoint | Procedure | Input | Output |
|----------|-----------|-------|--------|
| `placeVerification.submit` | protected + rateLimited(sensitive) | `{ placeId, notes?, documents[] }` | `{ request }` |
| `placeVerification.getByPlace` | protected | `{ placeId }` | `{ request, documents, events }` |

Rules:

- User must own the place via organization ownership.
- Create request in `PENDING`.
- Create initial event row (`toStatus = PENDING`).
- Upsert `place_verification` row and set `place_verification.status = PENDING`.
- Upload documents to storage and persist `place_verification_request_document` rows.

Implementation note:

- If multi-file upload via a single tRPC call is too brittle, split into:
  - `placeVerification.createRequest` (creates PENDING) then
  - `placeVerification.uploadDocument` (repeatable)
  - and block admin approval unless docs exist.
- If `placeVerification.submit` stays as a single call, implement it as `zod-form-data` input (similar to `UploadPlacePhotoSchema`) to reliably carry `File` objects.

---

### Module 2B: Admin API (Queue + Review)

**User Story:** `US-19-02`

Admin endpoints:

| Endpoint | Procedure | Input | Output |
|----------|-----------|-------|--------|
| `admin.placeVerification.getPending` | protected(admin) | `{ limit, offset }` | `{ items, total }` |
| `admin.placeVerification.getById` | protected(admin) | `{ id }` | `{ request, place, documents, events }` |
| `admin.placeVerification.approve` | protected(admin) | `{ id, reviewNotes? }` | `{ request }` |
| `admin.placeVerification.reject` | protected(admin) | `{ id, reviewNotes }` | `{ request }` |

Approval behavior:

- Update request status -> `APPROVED`
- Insert event row
- Update `place_verification`:
  - `status = VERIFIED`
  - `verified_at = now()`
  - `verified_by_user_id = adminUserId`
  - Note: do not auto-enable reservations; owner must explicitly set `place_verification.reservations_enabled = true` via a separate action.

Rejection behavior:

- Update request status -> `REJECTED`
- Insert event row with notes
- Update `place_verification`: `status = REJECTED`
- Ensure `place_verification.reservations_enabled = false` (defense-in-depth)

---

### Module 2C: Booking/Availability Enforcement

**User Stories:** `US-19-03`, `US-19-04`

Enforce server-side gating in all booking entry points:

- Availability:
  - Block/return empty for places where `place_verification.status != VERIFIED` OR `place_verification.reservations_enabled = false`.
- Reservation creation:
  - Validate place is bookable even for `reservation.create(timeSlotId)` and `reservation.createForCourt`.

Recommended new domain error:

- `PlaceNotBookableError` (maps to `BAD_REQUEST` or `FORBIDDEN` depending on policy).

Also update place detail responses to include:

- `verificationStatus`
- `reservationsEnabled`

---

## Testing Checklist

- [ ] Owner cannot submit verification request for a place they do not own.
- [ ] Duplicate pending requests are blocked.
- [ ] Admin approve/reject updates place state correctly.
- [ ] Reservation creation is blocked when place is unverified or reservations are disabled.
