# Phase 1A - Data Model and Migration

## Goal

Represent multiple uploaded files per import job and preserve provenance for each normalized row.

---

## Shared / Contract

- [ ] Define how provenance is exposed to the client (row fields + source list).
- [ ] Decide compatibility strategy for existing single-file jobs:
- [ ] Keep `bookings_import_job.filePath/fileName/fileSize/sourceType` as-is (legacy)
- [ ] Add new sources table and backfill from legacy columns

---

## Server / Backend

### Schema changes

Add a new table:
- New: `src/shared/infra/db/schema/bookings-import-source.ts`

Suggested columns:
- `id uuid pk`
- `jobId uuid not null` -> `bookings_import_job.id` (cascade)
- `sourceType enum (ics|csv|xlsx|image) not null`
- `fileName varchar(255) not null`
- `fileSize int not null`
- `filePath text not null`
- `sortOrder int not null` (1..3)
- `metadata jsonb` (optional; store AI mapping spec + extraction meta)
- `createdAt/updatedAt`

Update rows for provenance:
- Update: `src/shared/infra/db/schema/bookings-import-row.ts`
  - Add `sourceId uuid` -> `bookings_import_source.id`
  - Add `sourceLineNumber int` (nullable)

### Migration strategy

Create a Drizzle migration that:
- Creates `bookings_import_source` table.
- Adds `source_id` and `source_line_number` columns to `bookings_import_row`.

Backfill existing data:
- For each existing `bookings_import_job`:
  - Create a `bookings_import_source` row using the job’s legacy fields.
  - For each `bookings_import_row` in that job:
    - Set `source_id` to the created source id
    - Set `source_line_number = line_number`

Constraints/indexes:
- Add index on `(job_id, sort_order)` and `(job_id)`
- Add index on `(source_id)`

### Critical file list

- `src/shared/infra/db/schema/bookings-import-job.ts`
- `src/shared/infra/db/schema/bookings-import-row.ts`
- `src/shared/infra/db/schema/enums.ts`
- `src/shared/infra/db/schema/index.ts` (if schema barrel exports)
- Drizzle migration under `drizzle/` (or repo’s migrations dir)

---

## Client / Frontend

- [ ] N/A (no direct changes; client work starts in Phase 4)
