# Phase 2-3: Backend API + Public Gating Enforcement

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-20-01, US-20-02, US-20-03

---

## Objective

1. Add an authenticated submission endpoint for curated court suggestions.
2. Add admin review endpoints (approve/reject) and admin list filtering.
3. Ensure unapproved places are fully hidden from public list and detail (server-enforced).

Out of scope (handled in a later session): notifying the submitter when their suggestion is approved/rejected.

---

## tRPC Endpoints

### User Submission

| Procedure | Type | Auth | Rate Limit | Input | Output |
|----------|------|------|------------|-------|--------|
| `courtSubmission.submitCurated` | Mutation | protected | yes | Suggest place payload | `{ placeId: string }` (or created record) |

Notes:
- Use `protectedRateLimitedProcedure("sensitive")`.
- Reject duplicates (name + city) with a conflict error.

### Admin Review

| Procedure | Type | Auth | Input | Output |
|----------|------|------|-------|--------|
| `admin.court.approveSubmission` | Mutation | admin | `{ placeId, reviewNotes? }` | updated place |
| `admin.court.rejectSubmission` | Mutation | admin | `{ placeId, reviewNotes }` | updated place |

### Admin List Filtering

- Extend `admin.court.list` input with `isApproved?: boolean`.

---

## Services / Repositories

### Create Submission

- Check for duplicates via existing admin repository `findByNameCity(name, city)`.
- Create `place` with:
  - `placeType=CURATED`, `claimStatus=UNCLAIMED`
  - `isActive=true`, `isApproved=false`
  - `submittedByUserId=userId`
  - `submittedByEmailSnapshot=session.email`
- Create placeholder `court` records for each selected sport.

### Approve Submission

- Update place:
  - `isApproved=true`
  - `reviewerUserId=adminUserId`
  - `reviewedAt=now`
  - `reviewNotes` optional

### Reject Submission

- Update place:
  - `isActive=false`
  - `isApproved=false`
  - reviewer fields

---

## Public Gating Enforcement

### Place list

- `PlaceRepository.list()` must include `isApproved=true` in its base conditions.

### Place detail

- `PlaceDiscoveryService.getPlaceById()` must treat `isApproved=false` (or `isActive=false`) as not found.

### Side-effect request hardening

- Claim/removal request services should not allow submissions for unapproved places.

---

## Error Mapping

- Duplicate suggestion -> domain conflict error (new) mapped to `TRPCError` code `CONFLICT`.
- Unapproved access -> `NOT_FOUND`.
