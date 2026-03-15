# Phase 1: Draft Persistence + Resume

**Dependencies:** Upload flow in place (Plan 70)  
**Parallelizable:** Yes  
**User Stories:** US-66-01, US-66-02, US-66-03

---

## Objective

Persist import jobs and draft rows so the owner can:

- Resume a job after upload
- See AI usage state per venue
- Move from upload -> normalize -> review without losing state

---

## Data Model (Proposed)

Create new tables (names can be adjusted to match existing conventions):

### `bookings_import_job`

- `id` (uuid, PK)
- `place_id` (uuid, FK)
- `organization_id` (uuid, FK)
- `created_by_user_id` (uuid)
- `source_type` (text enum: ics/csv/xlsx/image)
- `file_bucket` (text)
- `file_path` (text)
- `file_name` (text)
- `file_size` (int)
- `status` (text enum: UPLOADED, NORMALIZED, COMMITTED, CANCELLED, FAILED)
- `ai_used_at` (timestamptz, nullable) (per-venue lock is derived; see below)
- `normalized_at` (timestamptz, nullable)
- `committed_at` (timestamptz, nullable)
- `created_at`, `updated_at`

Indexes:

- `(place_id, created_at desc)` for listing
- `(organization_id, created_at desc)` for admin/backoffice

### `bookings_import_row`

- `id` (uuid, PK)
- `job_id` (uuid, FK)
- `row_index` (int)
- `external_resource_id` (text, nullable) (from PoC `resourceId`)
- `external_resource_label` (text, nullable) (court name in export)
- `court_id` (uuid, nullable)
- `start_time` (timestamptz)
- `end_time` (timestamptz)
- `reason` (text, nullable)
- `raw` (jsonb) (original record/event slice)
- `errors` (jsonb) (array of error codes + messages)
- `created_at`, `updated_at`

Indexes:

- `(job_id, row_index)` unique
- `(job_id, court_id, start_time, end_time)` for duplicate detection

### `bookings_import_row_commit`

Maps row -> created `court_block` for idempotency.

- `row_id` (uuid, PK/FK)
- `court_block_id` (uuid, FK)
- `created_at`

---

## One-Time AI Usage (Per Venue)

Enforce the one-time AI rule by checking for the existence of any job for the venue where `ai_used_at is not null`.

This allows:

- Visibility: show when it was used (max(ai_used_at))
- Locking: all users share the same venue state

---

## Backend Endpoints (Planned)

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `bookingsImport.aiUsage` | query | `{ placeId }` | `{ usedAt: string | null }` |
| `bookingsImport.getJob` | query | `{ jobId }` | `{ job, counts }` |
| `bookingsImport.listJobsForPlace` | query | `{ placeId }` | `{ jobs[] }` |
| `bookingsImport.listRows` | query | `{ jobId }` | `{ rows[], counts }` |
| `bookingsImport.updateRow` | mutation | row patch | `{ row }` |
| `bookingsImport.deleteRow` | mutation | `{ rowId }` | `{ ok: true }` |
| `bookingsImport.discardJob` | mutation | `{ jobId }` | `{ ok: true }` |

Notes:

- `createDraft` already exists; evolve it to create a `bookings_import_job` record.
- Keep routers thin; move logic into `BookingsImportService` and repositories.

---

## Implementation Steps

1. Add Drizzle schema + migration for the 3 tables.
2. Add repositories (job/row/commit-map) following repo conventions.
3. Update `BookingsImportService.createDraft` to insert a job record after storage upload.
4. Implement `getJob`/`listRows`/`updateRow`/`deleteRow`/`discardJob` in service + router.
5. Update `aiUsage` to compute `usedAt` from DB (max(ai_used_at)).
