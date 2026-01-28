# Phase 3A - Normalization + AI Mapping

## Goal

Normalize a job by merging all sources into a single row set, with:
- per-row provenance
- cross-file duplicate detection
- deterministic parsing mode
- AI parsing mode (one-time per venue) for ALL formats

---

## Shared / Contract

### Normalize modes

Existing input:
- `NormalizeJobSchema`: `{ jobId, mode: "deterministic" | "ai", confirmAiOnce? }`

Rules:
- If **any** source is `image`, then `mode=ai` is required.
- AI mode requires `confirmAiOnce=true` and the venue AI gate must be unused.

### Provenance display rules

Row provenance fields:
- `sourceId`
- `sourceLineNumber`

Client should resolve `sourceId -> fileName` via `listSources`.

---

## Server / Backend

### Service normalize refactor

- Update: `src/modules/bookings-import/services/bookings-import.service.ts`

High-level algorithm:
1) Load job + sources.
2) Enforce job status `DRAFT`.
3) Determine `hasImages`.
4) Enforce mode rules and AI gate:
   - `hasImages && mode !== "ai"` -> error
   - `mode === "ai"` -> require `confirmAiOnce` and enforce venue AI lock
5) Download each source file and parse into `ParsedImportRow[]` with provenance.
6) Merge all parsed rows into one list; assign job-global `lineNumber`.
7) Validate rows (`validateRow`) and detect duplicates across merged rows.
8) Insert rows; update job counts and status; set `aiUsedAt` only when AI mode succeeds.

### Deterministic parsing (baseline)

Use existing logic, but per source:
- `ics`: `parseIcs(content, now, now+365d)` with current mapping.
- `csv/xlsx`: current heuristic column selection.
- `image`: N/A (AI required).

### AI parsing for CSV/XLSX

Implement a small AI mapping layer in `src/modules/bookings-import/lib/` modeled after `scripts/normalize-data.ts`:

- New: `src/modules/bookings-import/lib/ai-tabular-mapping.ts`
  - Zod schemas: mapping hint + mapping spec
  - `buildTabularMappingPrompt({ headers, sampleRows, timeZoneFallback })`
  - `generateObject` -> mapping hint
  - deterministic conversion hint -> spec
  - deterministic parse of dataset to `ParsedImportRow[]` using:
    - `buildHeaderLookup/resolveHeader` from `csv-parser.ts`
    - `parseDateTimeValue/buildLocalDateTime` from `datetime-parser.ts`

Store mapping in metadata:
- `bookings_import_source.metadata.tabularMappingSpec` (or job metadata keyed by source id).

### AI parsing for ICS

- New: `src/modules/bookings-import/lib/ai-ics-mapping.ts`
  - Provide sample events (summary/location/description/start/end/status)
  - AI selects:
    - resource source: location|summary|description|constant|none
    - reason source: summary|description|none
    - ignoreCancelled/ignoreAllDay
  - Deterministically apply that spec to occurrences.

### AI parsing for Images

- Reuse existing:
  - `src/modules/bookings-import/lib/screenshot-extractor.ts` (`extractScreenshotBookings`)
  - `parseImageTime` from `datetime-parser.ts`

Optional enhancement (not required for MVP): batch up to 3 images in a single AI call.

### Duplicate detection update

- Update: `src/modules/bookings-import/lib/row-validator.ts` duplicate keying to work better when `courtId` is null:
  - key = `(courtId ?? normalizedCourtLabel) + start + end` when start/end exist.

---

## Client / Frontend

- [ ] N/A (handled in Phase 4)
