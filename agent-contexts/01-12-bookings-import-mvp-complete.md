# [01-12] Bookings Import MVP Complete

> Date: 2026-01-26
> Previous: 01-11-bookings-import-plan-update.md

## Summary

Completed the end-to-end owner bookings import MVP: upload a file, normalize into draft rows, manually review/edit, then commit into court blocks with overlap checks and idempotent retries. Builds pass, including `TZ=UTC`.

## Changes Made

### Backend

| File | Change |
|------|--------|
| `src/modules/bookings-import/dtos/commit-job.dto.ts` | Commit DTOs and schemas. |
| `src/modules/bookings-import/services/bookings-import.service.ts` | Implemented normalize + commit flows, overlap checks (blocks + reservations), idempotent retry behavior, and discard cleanup (delete storage object). |
| `src/modules/bookings-import/factories/bookings-import.factory.ts` | Wired additional dependencies needed for commit overlap checks. |
| `src/modules/bookings-import/bookings-import.router.ts` | Added normalize + commit endpoints and discard wiring. |

### Frontend

| File | Change |
|------|--------|
| `src/app/(owner)/owner/import/bookings/page.tsx` | Redirect to review page after draft creation. |
| `src/app/(owner)/owner/import/bookings/[jobId]/page.tsx` | Review/edit UI (filters, edit/delete/discard/commit dialogs) and normalization UI/actions. |

### Validation

| Command | Result |
|---------|--------|
| `pnpm build` | Pass |
| `TZ=UTC pnpm build` | Pass |

## Key Decisions

- Committed imported bookings as `MAINTENANCE` court blocks for MVP to block availability without introducing walk-in pricing semantics.
- Commit is best-effort and idempotent: already-committed rows are skipped safely on retry.

## Remaining / Deferred

- List/resume in-progress jobs per venue on the upload page.
- Screenshot (`image`) normalization pipeline (OCR/vision extraction).
