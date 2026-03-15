# Phase 2A - Backend Upload and Sources

## Goal

Allow `createDraft` to accept up to 3 files and store them as sources; expose sources to the UI.

---

## Shared / Contract

### createDraft (form-data)

Input fields:
- `placeId: string` (required)
- `selectedCourtId?: string` (optional)
- `files: File[]` (required, 1..3)

Validation:
- `1 <= files.length <= 3`
- `each file.size <= MAX_IMPORT_FILE_SIZE`
- `each file.type/extension is supported`
- optional: `sum(file.size) <= MAX_IMPORT_TOTAL_SIZE`

### listSources

New query:
- `bookingsImport.listSources({ jobId }) -> { sources: Array<{ id, sourceType, fileName, fileSize, sortOrder, createdAt }> }`

---

## Server / Backend

### DTO updates

- Update: `src/modules/bookings-import/dtos/create-bookings-import.dto.ts`
  - `files: zfd.repeatableOfType(importFileSchema)`
  - add `.refine((files) => files.length >= 1 && files.length <= 3, ...)`
  - remove/ignore `sourceType` field

### Router updates

- Update: `src/modules/bookings-import/bookings-import.router.ts`
  - `createDraft` still uses `protectedRateLimitedProcedure("mutation")`, but now accepts multi-file DTO.
  - Add `listSources` query.

### Service updates

- Update: `src/modules/bookings-import/services/bookings-import.service.ts`

createDraft:
- Upload each file to storage (bucket: `organization-assets`).
- Suggested path convention:
  - `imports/<placeId>/<jobId>/<sortOrder><ext>`
- Create job in DB as today.
- Create N `bookings_import_source` rows.

Compatibility (keep old columns working):
- Populate `bookings_import_job.fileName/fileSize/filePath/sourceType` using the first uploaded file.
- Job should rely on `sources` for all subsequent operations.

discardJob:
- Delete all files for the job by iterating sources.
- Keep best-effort delete behavior (warn on failure, still discard).

### New repository

- New: `src/modules/bookings-import/repositories/bookings-import-source.repository.ts`
- Wire it in `src/modules/bookings-import/factories/bookings-import.factory.ts`.

---

## Client / Frontend

- [ ] N/A (handled in Phase 4)
