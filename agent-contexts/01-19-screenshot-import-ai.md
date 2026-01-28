# [01-19] Screenshot Import AI

> Date: 2026-01-28
> Previous: 01-18-owner-setup-hub-stepper-v2.md

## Summary

Implemented screenshot (image) normalization in the bookings import pipeline using AI vision extraction, wired server parsing + logging, and updated the review UI to require AI for screenshots.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/modules/bookings-import/lib/screenshot-extractor.ts` | Added AI vision extraction helper + Zod schema for calendar screenshots. |
| `src/modules/bookings-import/lib/index.ts` | Exported screenshot extractor utilities. |
| `src/modules/bookings-import/services/bookings-import.service.ts` | Added AI-required guard for images, integrated extraction into parsing, persisted metadata, added logging, and mapped events to rows. |
| `src/modules/bookings-import/errors/bookings-import.errors.ts` | Added AI-required and AI-not-configured domain errors. |
| `src/app/(owner)/owner/import/bookings/[jobId]/page.tsx` | Disabled deterministic parsing for image sources and added UI copy for AI-required screenshots. |
| `src/lib/env/index.ts` | Added optional `OPENAI_API_KEY` to server env schema. |

### Planning

| File | Change |
|------|--------|
| `agent-plans/71-bookings-import-review-commit/71-06-screenshot-normalization.md` | Added plan for screenshot normalization (AI extraction + UI behavior). |
| `agent-plans/71-bookings-import-review-commit/71-00-overview.md` | Linked screenshot normalization add-on. |
| `agent-plans/71-bookings-import-review-commit/71-02-normalization-pipeline.md` | Updated screenshot support note. |
| `agent-plans/71-bookings-import-review-commit/71-99-deferred.md` | Noted screenshot extraction plan instead of deferred. |
| `agent-plans/71-bookings-import-review-commit/bookings-import-review-commit-dev1-checklist.md` | Added screenshot normalization checklist items. |
| `agent-plans/context.md` | Logged new screenshot normalization requirement. |

## Key Decisions

- Require AI normalization for `sourceType=image` and block deterministic parsing to avoid zero-row results.
- Ignore leading/trailing adjacent-month days in screenshot extraction to reduce wrong-date imports.
- Use 60-minute blocks per extracted start time to match current validation rules.

## Next Steps

- [ ] Run `pnpm dev` and validate a screenshot upload (expect non-zero rows + validation errors for non-hour-aligned times).
- [ ] (Optional) Add UI surface for extraction summary stored in job metadata.

## Commands to Continue

```bash
pnpm dev
```
