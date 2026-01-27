**Dependencies:** Phase 2 (normalization pipeline) shipped
**Parallelizable:** Partial
**User Stories:** US-66-01, US-66-03, US-66-05

---

## Objective

Add end-to-end screenshot (`sourceType=image`) normalization in the Web UI bookings import flow so owners can upload a calendar screenshot and produce draft rows for review/edit/commit.

This should reuse the vision extraction approach proven in `scripts/normalize-data.ts`.

---

## Scope

- Inputs: `image/jpeg`, `image/png` (already supported by upload UI + validation).
- AI required: screenshots must be normalized via AI (vision extraction). Deterministic mode should be blocked/disabled for images.
- Output: persisted `bookings_import_row` records (same shape as CSV/XLSX/ICS imports) + job counts.
- One-time AI per venue remains enforced; do not consume AI usage on failures.

Non-goals (this iteration):

- Extracting end times/durations from screenshots (assume 60-minute blocks per extracted start time).
- Multi-court screenshot parsing beyond an optional `resourceLabel` (owners can manually map rows to courts).

---

## Shared / Contract

- **Extraction schema**: use a Zod schema equivalent to the CLI PoC:
  - `calendarTitle?: string`
  - `month: 1..12`, `year: 2000..2100`
  - `timeZone?: string` (optional; place time zone is canonical)
  - `events[]`: `{ day: 1..31, startTime: string, title?: string, resourceLabel?: string }`
- **Persistence contract**:
  - `bookings_import_row.start_time/end_time` come from `place.timeZone` (canonical)
  - `bookings_import_row.reason` = extracted `title ?? null`
  - `bookings_import_row.court_label` = extracted `resourceLabel ?? null` (do NOT auto-fill with calendarTitle)
  - `bookings_import_row.source_data` stores the raw extracted event (and any helpful extraction metadata)
  - `bookings_import_job.metadata` optionally stores extraction summary (month/year/title/eventCount/model)

Decision points:

- Adjacent-month days in calendar grids (Recommended: ignore). When the screenshot shows trailing days from previous/next month, the extractor should omit those events to avoid wrong dates.
- Time granularity (Recommended: fixed 60 minutes). Keep consistent with current validation rules (hour-aligned, duration multiple of 60).

---

## Server / Backend

- Add an image extraction helper under `src/modules/bookings-import/lib/` (e.g. `screenshot-extractor.ts`).
  - Implementation: `generateObject` + `openai(model)` with an image+text message (same prompt as `scripts/normalize-data.ts`).
  - Use `providerOptions: { openai: { imageDetail: "low" } }`.
  - Enforce presence of `OPENAI_API_KEY` at runtime (user-safe error message if missing).
- Update `BookingsImportService.normalize` / `parseFile` (`src/modules/bookings-import/services/bookings-import.service.ts`):
  - If `sourceType === "image"` and `mode !== "ai"`: throw a domain validation error (actionable).
  - For `sourceType === "image"` and `mode === "ai"`:
    - Download image buffer from storage (already happens).
    - Call the extractor to get structured events.
    - Map events to rows using `TZDate` in `place.timeZone`, `end = start + 60min`.
    - Persist rows + validation errors via existing row pipeline.
    - Only set `ai_used_at` after successful normalization.
- Logging (Pino):
  - `bookings_import.image_extract_started` (jobId/placeId/model)
  - `bookings_import.image_extract_completed` (jobId/eventCount)
  - `bookings_import.image_extract_failed` (jobId/error)

---

## Client / Frontend

- Review page (`src/app/(owner)/owner/import/bookings/[jobId]/page.tsx`):
  - If `job.sourceType === "image"`:
    - disable/hide the deterministic "Parse File" action
    - show copy: "Screenshots require AI normalization" + keep the one-time confirmation flow
- Optional: show extraction summary from `job.metadata` (if implemented).

---

## QA

- Local manual test:
  - `pnpm dev`
  - Upload `scripts/fixtures/normalize-data/calendar-screenshot.jpeg` as source type "Calendar screenshot"
  - Run AI normalize
  - Verify: `rowCount > 0`, rows visible in table, errors flagged for non-hour-aligned times
- Failure-mode tests:
  - Missing `OPENAI_API_KEY` -> user-safe error; `ai_used_at` must remain unset and retry should be possible after fixing env
  - AI extraction throws -> job status `FAILED`, error message persisted, retry behavior defined
