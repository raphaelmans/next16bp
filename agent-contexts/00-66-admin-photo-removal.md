# [00-66] Admin Photo Removal

> Date: 2026-01-19
> Previous: 00-65-guest-removal.md

## Summary

Added admin-side support to remove court photos, including a new admin API endpoint, storage cleanup, and a confirmation flow in the admin edit page.

## Changes Made

### Backend

| File | Change |
|------|--------|
| `src/modules/court/dtos/remove-photo.dto.ts` | Added admin remove photo DTO schema. |
| `src/modules/court/dtos/index.ts` | Exported admin remove photo DTO (plus photo DTO for completeness). |
| `src/modules/court/admin/admin-court.router.ts` | Added `removePhoto` admin mutation. |
| `src/modules/court/repositories/admin-court.repository.ts` | Added photo lookup and delete helpers. |
| `src/modules/court/services/admin-court.service.ts` | Implemented admin photo removal with storage cleanup and logging. |

### Frontend

| File | Change |
|------|--------|
| `src/features/admin/hooks/use-admin-courts.ts` | Added `useRemoveAdminCourtPhoto` hook with cache invalidation. |
| `src/app/(admin)/admin/courts/[id]/page.tsx` | Added remove button per photo with confirmation dialog and mutation wiring. |

## Key Decisions

- Implemented removal in the admin court module to keep admin operations distinct from owner flows.
- Confirmed deletion through an AlertDialog to avoid accidental photo removal.

## Next Steps (if applicable)

- [ ] Run `pnpm lint`.
- [ ] Run `TZ=UTC pnpm build`.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
