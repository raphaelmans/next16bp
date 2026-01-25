# 6) Import External Bookings (Populate Court Availability)

Goal: import already-booked times from external systems so KudosCourts availability reflects reality and prevents double-booking.

## Current owner experience (as built today)

```text
/owner/import/bookings
   |
   | Step 1 UI:
   | - select venue
   | - select source type (ics/csv/xlsx/image)
   | - upload 1 file
   v
trpc.bookingsImport.createDraft
   |
   | uploads file to storage + creates bookings_import_job(status=DRAFT)
   v
/owner/import/bookings/:jobId
   |
   | Step 2: normalize (deterministic or AI one-time)
   | trpc.bookingsImport.normalize
   v
   | Step 3: review + fix rows
   | - rows table + filters
   | - edit row / delete row
   v
   | Step 4: commit
   | trpc.bookingsImport.commit (creates court blocks)
   v
(availability is blocked only after commit)
```

Notes:
- Deterministic parsing is implemented for `ics`, `csv`, and `xlsx`.
- `image` source currently returns 0 rows (AI extraction not implemented yet).
- AI normalization is enforced as a one-time action per venue (requires explicit confirmation).

Deferred items (current):
- List/resume in-progress jobs per venue on the upload page.
- True screenshot/image extraction for `sourceType=image`.

## User stories + plans (reference)

User stories:
- `agent-plans/user-stories/66-bookings-import/66-01-owner-imports-existing-bookings-with-one-time-ai-normalization.md`
- `agent-plans/user-stories/66-bookings-import/66-02-owner-reviews-and-commits-imported-bookings.md`
- `agent-plans/user-stories/66-bookings-import/66-03-owner-understands-one-time-ai-import-limits.md`
- `agent-plans/user-stories/66-bookings-import/66-05-owner-uploads-bookings-via-venue-import-landing-page.md`

Technical plans:
- Upload landing page (done): `agent-plans/70-bookings-import-owner-ui/70-00-overview.md`
- Review/normalize/commit MVP (done): `agent-plans/71-bookings-import-review-commit/71-00-overview.md`

Completion log:
- `agent-contexts/01-12-bookings-import-mvp-complete.md`

Deferred list (tracked):
- `agent-plans/71-bookings-import-review-commit/71-99-deferred.md`

## Routes (UI)

- Upload landing page: `src/app/(owner)/owner/import/bookings/page.tsx`
- Review/edit page: `src/app/(owner)/owner/import/bookings/[jobId]/page.tsx`

## APIs (tRPC)

Implemented today:
- `bookingsImport.createDraft` (FormData upload)
- `bookingsImport.getJob`
- `bookingsImport.listJobs`
- `bookingsImport.listRows`
- `bookingsImport.normalize` (deterministic + AI modes)
- `bookingsImport.updateRow` (only if job.status === NORMALIZED)
- `bookingsImport.deleteRow` (only if job.status === NORMALIZED)
- `bookingsImport.commit`
- `bookingsImport.discardJob` (deletes uploaded file best-effort)
- `bookingsImport.aiUsage`

Router/service:
- `src/modules/bookings-import/bookings-import.router.ts`
- `src/modules/bookings-import/services/bookings-import.service.ts`

## Data model (DB)

Jobs:
- `bookings_import_job` (`src/shared/infra/db/schema/bookings-import-job.ts`)
- Status enum: `DRAFT | NORMALIZING | NORMALIZED | COMMITTING | COMMITTED | FAILED | DISCARDED`

Rows:
- `bookings_import_row` (`src/shared/infra/db/schema/bookings-import-row.ts`)
- Status enum: `PENDING | VALID | ERROR | WARNING | COMMITTED | SKIPPED`

Commit target:
- `court_block` (`src/shared/infra/db/schema/court-block.ts`)

## How imported bookings affect availability

Availability treats active `court_block` rows as “booked” time ranges.
So committing an import ultimately needs to create blocks that overlap-check and then remove availability.

See:
- `src/modules/availability/services/availability.service.ts` (checks overlaps with court blocks)

## One-time AI rule (current)

- Normalization mode `ai` requires explicit confirmation (`confirmAiOnce=true`).
- On success, job `ai_used_at` is set and subsequent AI attempts for the same venue are rejected.

Important limitation:
- AI mode currently does not implement image/screenshot extraction.
