# Phase 4: Commit Draft Rows To Court Blocks

**Dependencies:** Phase 3 complete (draft is editable + validated)  
**Parallelizable:** No  
**User Stories:** US-66-02

---

## Objective

Commit a validated import draft into the platform so that overlapping bookings are blocked.

---

## Commit Strategy

For MVP, commit rows as `MAINTENANCE` blocks via the existing court block module:

- Prevents double-booking
- Avoids pricing computation and walk-in semantics
- Keeps import "blocking" separate from revenue flows

---

## Endpoint (Planned)

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `bookingsImport.commit` | mutation | `{ jobId }` | `{ created, skipped, failed, failures[] }` |

Rules:

- Reject commit if any rows have blocking errors.
- Best-effort within the valid set is acceptable if conflicts with existing blocks occur.
- Use `bookings_import_row_commit` for idempotency:
  - If a row is already committed, skip it.
  - If the block exists, return it as skipped.

---

## Overlap Handling

Possible overlap sources:

- Existing `court_block`
- Existing reservations (if applicable in overlap checks)
- Other rows in the same job

Expected behavior:

- If an overlap is detected at commit time: mark row as failed with a clear reason, and continue committing others.

---

## Result UI

After commit:

- Show a results summary (created/skipped/failed)
- Keep a per-row failure list (row index + message)
- Mark job as `COMMITTED` if all rows are committed or skipped; otherwise keep `NORMALIZED` and allow retry after fixes.

---

## Implementation Steps

1. Add `bookingsImport.commit` DTO + router.
2. Implement service method:
   - Load job + rows
   - Validate no blocking errors
   - For each row, call court block creation and record mapping
3. Persist commit results and update job status.
4. Add UI action on review page.
