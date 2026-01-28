# [01-27] Bookings Import Multi-File

> Date: 2026-01-29
> Previous: 01-26-bookings-playground-dnd.md

## Summary

Implemented multi-file bookings import with per-source tracking, AI mapping support for tabular/ICS files, and updated UI to handle multiple uploads with source display.

## Changes Made

### Database

| File | Change |
| --- | --- |
| `src/shared/infra/db/schema/bookings-import-source.ts` | Added source entity schema. |
| `src/shared/infra/db/schema/bookings-import-row.ts` | Added sourceId/sourceLineNumber columns. |
| `src/shared/infra/db/schema/index.ts` | Exported new schema. |
| `drizzle/0011_bookings_import_sources.sql` | Created sources table and backfilled data. |

### Backend

| File | Change |
| --- | --- |
| `src/modules/bookings-import/repositories/bookings-import-source.repository.ts` | Added repository for sources. |
| `src/modules/bookings-import/repositories/index.ts` | Re-exported sources repository. |
| `src/modules/bookings-import/factories/bookings-import.factory.ts` | Wired sources repository. |
| `src/modules/bookings-import/dtos/create-bookings-import.dto.ts` | Switched to multi-file input. |
| `src/modules/bookings-import/dtos/list-sources.dto.ts` | Added list sources DTO. |
| `src/modules/bookings-import/dtos/index.ts` | Exported new DTO. |
| `src/modules/bookings-import/bookings-import.router.ts` | Added listSources procedure. |
| `src/modules/bookings-import/services/bookings-import.service.ts` | Created sources, parsed per-source, updated cleanup/normalize logic. |
| `src/modules/bookings-import/lib/ai-tabular-mapping.ts` | AI mapping for CSV/XLSX. |
| `src/modules/bookings-import/lib/ai-ics-mapping.ts` | AI mapping for ICS. |
| `src/modules/bookings-import/lib/index.ts` | Exported AI mapping helpers. |
| `src/modules/bookings-import/lib/row-validator.ts` | Duplicate logic uses court label fallback. |

### Frontend

| File | Change |
| --- | --- |
| `src/app/(owner)/owner/import/bookings/page.tsx` | Multi-file upload UI and copy updates. |
| `src/app/(owner)/owner/import/bookings/[jobId]/page.tsx` | Source list + per-row source display. |

## Key Decisions

- Keep AI normalization gated to once per venue, but allow AI mapping for CSV/XLSX/ICS when enabled.
- Preserve legacy job fields using the first source for backward compatibility.

## Next Steps (if applicable)

- [ ] Manual QA: upload 1-3 mixed files and verify source list + row labels.
- [ ] Confirm AI flow behavior for screenshots vs non-image files.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
