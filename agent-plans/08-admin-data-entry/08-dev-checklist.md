# Admin Data Entry - Developer Checklist

**Focus Area:** Admin data entry form and CSV import  
**User Stories:** US-02-03, US-02-04

---

## Phase 1: Admin Components

**Reference:** `08-01-admin-components.md`  
**Dependencies:** None

### Create Admin Form Components

- [ ] Create `src/features/admin/components/admin-input.tsx`
- [ ] Create `src/features/admin/components/admin-select.tsx`
- [ ] Create `src/features/admin/components/admin-textarea.tsx`
- [ ] Create `src/features/admin/components/admin-checkbox-group.tsx`

### Create Admin UI Components

- [ ] Create `src/features/admin/components/admin-form-actions.tsx`
- [ ] Create `src/features/admin/components/admin-success-state.tsx`

### Create Schema

- [ ] Create `src/features/admin/schemas/curated-court-data-entry.schema.ts`

### Update Exports

- [ ] Update `src/features/admin/components/index.ts` to export new components

### Verify

- [ ] All components render without errors
- [ ] TypeScript has no errors

---

## Phase 2: Data Entry Form

**Reference:** `08-02-data-entry-form.md`  
**Dependencies:** Phase 1 complete

### Wire API Hook

- [ ] Update `src/features/admin/hooks/use-admin-courts.ts`
  - [ ] Change `useCreateCuratedCourt` from mock to real tRPC
  - [ ] Use `trpc.admin.court.createCurated.useMutation`

### Create Data Entry Page

- [ ] Create `src/app/(admin)/admin/courts/data-entry/page.tsx`
  - [ ] Form with all fields
  - [ ] Submit handler with API transformation
  - [ ] Success state with Create Another flow
  - [ ] Navigation back to courts list

### Update Courts List

- [ ] Update `src/app/(admin)/admin/courts/page.tsx`
  - [ ] Add "Data Entry" button in header

### Verify

- [ ] Form renders correctly
- [ ] Validation works
- [ ] Submit creates court in database
- [ ] Success state shows
- [ ] "Create Another" clears form
- [ ] Navigation works
- [ ] TypeScript has no errors

---

## Phase 3: CSV Import Script

**Reference:** `08-03-csv-import-script.md`  
**Dependencies:** None (can run in parallel with Phase 2)

### Create Script

- [ ] Create `scripts/import-curated-courts.ts`
  - [ ] CLI argument parsing
  - [ ] CSV parsing with quote handling
  - [ ] Validation logic
  - [ ] Database transaction
  - [ ] Duplicate skipping
  - [ ] Summary output

### Verify Sample Template

- [ ] Verify `scripts/templates/curated-courts-template.csv` exists

### Test Script

- [ ] Run with sample template: `npx tsx scripts/import-curated-courts.ts --file scripts/templates/curated-courts-template.csv`
- [ ] Verify courts created in database
- [ ] Run again to verify duplicates skipped
- [ ] Test verbose mode

### Verify

- [ ] Script runs without errors
- [ ] Transaction commits correctly
- [ ] Duplicates are skipped
- [ ] Summary is accurate

---

## Phase 4: Batch Curated Courts

**Reference:** `08-04-batch-curated-courts.md`  
**Dependencies:** Phase 2 complete

### Backend

- [ ] Add `CreateCuratedCourtBatchSchema` DTO
- [ ] Add `admin.court.createCuratedBatch` tRPC mutation
- [ ] Add duplicate check by name + city

### Frontend

- [ ] Create batch form schema
- [ ] Create `/admin/courts/batch` page
- [ ] Add `useCreateCuratedCourtsBatch` hook
- [ ] Add "Batch Add" button in courts list

### Verify

- [ ] Submit multiple rows successfully
- [ ] Duplicates are skipped and reported

---

## Final Verification

- [ ] Run `npm run build` - no errors
- [ ] Run `npm run lint` - no errors  
- [ ] Test full flow:
  - [ ] Create court via web form
  - [ ] Create court via CSV import
  - [ ] Verify courts appear in admin list
  - [ ] Verify courts appear in discovery (player view)

---

## Files Summary

### New Files

| File | Phase |
|------|-------|
| `src/features/admin/components/admin-input.tsx` | 1 |
| `src/features/admin/components/admin-select.tsx` | 1 |
| `src/features/admin/components/admin-textarea.tsx` | 1 |
| `src/features/admin/components/admin-checkbox-group.tsx` | 1 |
| `src/features/admin/components/admin-form-actions.tsx` | 1 |
| `src/features/admin/components/admin-success-state.tsx` | 1 |
| `src/features/admin/schemas/curated-court-data-entry.schema.ts` | 1 |
| `src/app/(admin)/admin/courts/data-entry/page.tsx` | 2 |
| `scripts/import-curated-courts.ts` | 3 |

### Modified Files

| File | Phase | Change |
|------|-------|--------|
| `src/features/admin/components/index.ts` | 1 | Export new components |
| `src/features/admin/hooks/use-admin-courts.ts` | 2 | Wire to real tRPC |
| `src/app/(admin)/admin/courts/page.tsx` | 2 | Add Data Entry button |

---

## Parallelization

```
Phase 1 (Components) ─────────► Phase 2 (Form)
                                     │
                                     ▼
                               Final Verification
                                     ▲
Phase 3 (Script) ────────────────────┘
```

- Phase 1 must complete before Phase 2
- Phase 3 can run in parallel with Phases 1-2
- Final verification after all phases complete
