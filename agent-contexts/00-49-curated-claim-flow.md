# [00-49] Curated Claim Flow

> Date: 2026-01-15
> Previous: 00-48-admin-access-sql.md

## Summary

Implemented the curated place claim/contact detail flow, expanded admin curated court creation to capture court inventory, and finalized the public place detail experience for curated listings. Cleaned up lint issues and verified build output.

## Changes Made

### Backend

| File | Change |
|------|--------|
| `src/shared/infra/db/schema/place.ts` | Renamed curated contact table to `place_contact_detail` and updated types. |
| `src/modules/place/repositories/place.repository.ts` | Returned `contactDetail` + `reservationPolicy` and added `upsertContactDetail`. |
| `src/modules/court/repositories/admin-court.repository.ts` | Added court creation + contact detail insertion for curated places. |
| `src/modules/court/services/admin-court.service.ts` | Created court rows for curated inventory in admin flow. |
| `src/modules/claim-request/use-cases/approve-claim-request.use-case.ts` | Preserved contact detail on claim approval; removed unused imports. |

### Frontend

| File | Change |
|------|--------|
| `src/app/(admin)/admin/courts/new/page.tsx` | Added court inventory field array, fixed amenities typing. |
| `src/app/(admin)/admin/courts/batch/page.tsx` | Added nested court inventory entry; removed unused helper. |
| `src/features/admin/schemas/curated-court.schema.ts` | Required `courts[]` for curated entries. |
| `src/features/admin/schemas/curated-court-batch.schema.ts` | Required `courts[]` for batch entries. |
| `src/features/owner/components/place-form.tsx` | Added contact info form card and normalized defaults. |
| `src/features/owner/schemas/place-form.schema.ts` | Added contact detail fields. |
| `src/features/owner/hooks/use-place-form.ts` | Sends contact info on create/update. |
| `src/app/(owner)/owner/places/[placeId]/edit/page.tsx` | Loads contact defaults from `contactDetail`. |
| `src/features/discovery/hooks/use-place-detail.ts` | Exposes `placeType`, `claimStatus`, `contactDetail`. |
| `src/app/(public)/places/[placeId]/page.tsx` | Curated-mode layout, claim dialog, contact card updates. |
| `src/app/(auth)/reservations/[id]/page.tsx` | Updated to use `reservationPolicy`. |

### Tooling

| File | Change |
|------|--------|
| `agent-plans/user-stories/generate-checkpoint-html.js` | Renamed unused helper to satisfy lint. |

## Key Decisions

- Curated place court inventory is stored as real `court` rows.
- Contact info persists through claim approval and is surfaced publicly.
- Curated places are not bookable; claim dialog accepts organization + notes only.

## Next Steps (if applicable)

- [ ] Monitor claim flow UX with real data.
- [ ] Run migration if `place_contact_detail` table rename requires it.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
