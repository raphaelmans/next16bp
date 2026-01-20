# [00-69] Owner Place Verification Data

> Date: 2026-01-20
> Previous: 00-68-place-verification-gating.md

## Summary

Removed client-side verification placeholders for owner place lists and wired real `place_verification` data through the `placeManagement.list` API, so owner UIs can accurately display verification status and reservations-enabled state.

## Changes Made

### Backend (Place Management)

| File | Change |
| --- | --- |
| `src/modules/place/repositories/place.repository.ts` | Added `findByOrganizationIdWithVerification` using a left join on `place_verification`. |
| `src/modules/place/services/place-management.service.ts` | Updated `listMyPlaces` to return places with `verification` populated via the new repository method. |

### Frontend (Owner Hooks)

| File | Change |
| --- | --- |
| `src/features/owner/hooks/use-owner-places.ts` | Removed `select` mapping that forced `verification: null`. |
| `src/features/owner/hooks/use-owner-sidebar-quick-links.ts` | Removed `select` mapping that forced `verification: null`. |
| `src/features/owner/hooks/use-owner-courts.ts` | Removed `select` mapping that forced `verification: null`. |

### Linting Cleanup

| File | Change |
| --- | --- |
| `src/app/(admin)/admin/verification/[requestId]/page.tsx` | Removed unused import + useless fragment flagged by Biome. |
| `src/app/(public)/places/[placeId]/page.tsx` | Removed unused lucide imports flagged by Biome. |
| `src/features/owner/components/place-verification-panel.tsx` | Removed unused `isSubmitting` destructure from react-hook-form. |
| `src/shared/infra/db/schema/place-verification.ts` | Organized enum imports to satisfy Biome. |

## Key Decisions

- Kept `placeManagement.list` as the source of truth for owner list views, but extended it to include `verification` so the UI doesn’t need N+1 verification queries.
- Used a SQL left join so places without a `place_verification` row still return cleanly with `verification: null`.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
