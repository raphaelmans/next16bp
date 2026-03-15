# Phase 2: Normalization Pipeline (Server)

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-66-01, US-66-03, US-66-04

---

## Objective

Turn an uploaded import job into draft rows that match the platform structure:

- Parse the file according to `sourceType`
- Optionally run AI mapping (one-time per venue)
- Persist normalized rows + per-row errors for review

Screenshot support:

- `sourceType=image` normalization requires AI vision extraction. See `71-06-screenshot-normalization.md`.

---

## Proposed Endpoint

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `bookingsImport.normalize` | mutation | `{ jobId, mode, confirmAiOnce? }` | `{ counts, preview? }` |

Where:

- `mode`: `"ai" | "deterministic"`
- `confirmAiOnce`: required when `mode === "ai"` and AI is still available

---

## One-Time AI Guard

When `mode === "ai"`:

- Server must check venue AI state.
- If unused: require `confirmAiOnce === true`.
- If already used: reject with a domain error mapped to `CONFLICT`.
- On success: set `job.ai_used_at = now()`.

---

## Validation Rules (Row-Level)

Each row should be flagged with errors until fixed:

- Missing `courtId` (until owner maps/selects)
- Invalid time range (`end <= start`)
- Not hour-aligned (minute != 0)
- Duration not multiple of 60
- Overlaps another row in the same job (duplicate/conflict)
- (Optional) Overlaps an existing court block/reservation (surface as conflict)

---

## Implementation Notes

- Start by lifting the parsing + normalization code from `scripts/normalize-data.ts` into importable modules under `src/modules/bookings-import/lib/`.
- Keep AI interaction isolated (single call that outputs a mapping spec).
- Persist enough `raw` data for debugging and re-normalization.
- Use the place time zone as canonical for interpreting date-only values.

---

## Implementation Steps

1. Add `bookingsImport.normalize` router + DTOs.
2. Implement `BookingsImportService.normalize(jobId, mode, confirm)`.
3. Download the uploaded file from storage (server-side) and parse it.
4. Generate rows and upsert into `bookings_import_row`.
5. Compute `errors` for each row and persist.
6. Update job status to `NORMALIZED` when rows are persisted.
