# [00-47] Admin Batch Curated Courts

> Date: 2026-01-15  
> Previous: 00-46-form-standardization-wrapup.md

## Summary

Implemented a batch admin portal for curated courts, added batch creation APIs with duplicate skipping, and aligned admin court hooks to real tRPC endpoints. Updated planning artifacts to capture the new batch user story and implementation phase.

## Changes Made

### Backend

| File | Change |
|------|--------|
| `src/modules/court/dtos/create-curated-court.dto.ts` | Allowed optional coordinates with shared parsing. |
| `src/modules/court/dtos/create-curated-court-batch.dto.ts` | Added batch DTO schema. |
| `src/modules/court/dtos/index.ts` | Exported batch DTO. |
| `src/modules/court/repositories/admin-court.repository.ts` | Added duplicate lookup by name + city. |
| `src/modules/court/services/admin-court.service.ts` | Added batch creation with per-row results and duplicate skipping. |
| `src/modules/court/admin/admin-court.router.ts` | Added `admin.court.createCuratedBatch` endpoint. |

### Frontend

| File | Change |
|------|--------|
| `src/features/admin/hooks/use-admin-courts.ts` | Wired admin courts hooks to tRPC and added batch hook. |
| `src/features/admin/hooks/index.ts` | Exported batch hook/result types. |
| `src/features/admin/schemas/curated-court-batch.schema.ts` | Added batch form schema. |
| `src/app/(admin)/admin/courts/batch/page.tsx` | Added batch entry UI with add/remove rows + results summary. |
| `src/app/(admin)/admin/courts/page.tsx` | Added “Batch Add Courts” entry point. |
| `src/app/(admin)/admin/courts/new/page.tsx` | Mapped form fields to backend DTO fields. |
| `src/shared/lib/app-routes.ts` | Added admin batch route. |

### Planning

| File | Change |
|------|--------|
| `agent-plans/user-stories/02-court-creation/02-07-admin-batch-curated-courts.md` | Added batch curated courts user story. |
| `agent-plans/user-stories/02-court-creation/02-00-overview.md` | Registered US-02-07 and updated summary. |
| `agent-plans/08-admin-data-entry/08-04-batch-curated-courts.md` | Added Phase 4 implementation plan. |
| `agent-plans/08-admin-data-entry/08-00-overview.md` | Added Phase 4 overview details. |
| `agent-plans/08-admin-data-entry/08-dev-checklist.md` | Added Phase 4 checklist tasks. |

## Key Decisions

- Skip duplicates by normalized `name + city` in the batch flow.
- Treat latitude/longitude as optional (stored as null when omitted).
- Return per-row batch results with created/skipped/failed counts for admin review.

## Next Steps (if applicable)

- [ ] Run `pnpm lint` and `pnpm build` to validate changes.
- [ ] Consider adding a dedicated admin court detail page.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
