# Developer 1 Checklist

**Focus Area:** Bookings import review/edit + commit MVP

---

## Phase 1: Draft Persistence + Resume

- [x] Add Drizzle migration + schema for `bookings_import_job`, `bookings_import_row`, `bookings_import_row_commit`
- [x] Add repositories for job/row/commit map
- [x] Update `BookingsImportService.createDraft` to persist job metadata
- [x] Implement `getJob`, `listRows`, `updateRow`, `deleteRow`, `discardJob`
- [x] Update `aiUsage` to compute `usedAt` from DB

## Phase 2: Normalization Pipeline

- [x] Add `bookingsImport.normalize` mutation with DTOs and router wiring
- [x] Implement storage download + parsing by `sourceType`
- [x] Implement AI mode guard + set `ai_used_at`
- [x] Persist normalized rows and validation errors
- [x] Implement hour-alignment validation (start/end minute=0; duration divisible by 60)
- [x] Implement duplicate detection within job (flag duplicates and surface in row errors)
- [ ] Add screenshot (`image`) normalization via AI vision extraction (plan: `71-06-screenshot-normalization.md`)

## Phase 3: Review/Edit UI

- [x] Add route `src/app/(owner)/owner/import/bookings/[jobId]/page.tsx`
- [x] Implement queries and loading states
- [x] Build rows table + filters
- [x] Add edit dialog + update mutation wiring
- [x] Add delete row flow
- [x] Update upload page to redirect to `/owner/import/bookings/[jobId]` after `createDraft`
- [x] Add AI normalize action with one-time confirmation dialog

## Phase 4: Commit

- [x] Add `bookingsImport.commit` mutation and service method
- [x] Create maintenance blocks and write row->block mapping
- [x] Prevent commit when blocking errors remain (server-side validation + actionable error response)
- [x] Update job status after commit (COMMITTED / still NORMALIZED when failures remain)
- [x] Show results summary and per-row failures

## Phase 5: Validation

- [x] `pnpm lint`
- [x] `pnpm build`
- [x] `TZ=UTC pnpm build`

## Phase 6: Screenshot Normalization (Add-on)

- [ ] Server: implement `sourceType=image` extraction + row persistence
- [ ] Server: require AI mode for images; do not consume `ai_used_at` on failures
- [ ] Client: disable/hide deterministic normalize action for images
- [ ] QA: upload a screenshot and confirm non-zero rows + logs
