# [00-80] Admin Photo Upload Consistency

> Date: 2026-01-21
> Previous: 00-79-owner-place-deletion.md

## Summary

Aligned admin court create and batch flows to use file-based photo uploads instead of URL inputs, and ensured new court creation routes to the detail page with photos uploaded after creation.

## Changes Made

### Admin UI

| File | Change |
| --- | --- |
| `src/app/(admin)/admin/courts/new/page.tsx` | Replaced photo URL inputs with file selection, staged uploads after create, and redirected to court detail. |
| `src/app/(admin)/admin/courts/batch/page.tsx` | Replaced photo URL textarea with per-row file selection, uploaded photos for created items, and handled max photo limits. |

### Validation

| File | Change |
| --- | --- |
| `src/features/admin/schemas/curated-court-batch.schema.ts` | Removed `photoUrls` validation since batch photos now use file uploads. |

## Key Decisions

- Upload photos only after create/batch submission since the upload API requires a place ID.
- Redirect new court creation to `/admin/courts/:id` to keep photo management consistent with the detail view.

## Next Steps

- [ ] Verify batch photo uploads for created rows and confirm skipped rows do not upload.
- [ ] Re-run admin create flow to confirm staged photo uploads and redirection.

## Commands to Continue

```bash
pnpm dev
```
