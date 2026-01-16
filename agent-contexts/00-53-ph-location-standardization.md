# [00-53] PH Location Standardization

> Date: 2026-01-17
> Previous: 00-52-google-loc-client.md

## Summary

Standardized place location inputs around Philippines-only province/city data, added cached public address API + client helpers, and aligned owner/admin forms and DTOs to require province while locking country to `PH`.

## Changes Made

### Data + API

| File | Change |
|------|--------|
| `public/assets/files/philippines-addresses.json` | Added PH address source data. |
| `public/assets/files/ph-provinces-cities.json` | Added flattened province → cities map. |
| `src/app/api/public/ph-provinces-cities/route.ts` | Cached API route for province/city data. |
| `src/shared/lib/clients/ph-provinces-cities-client/index.ts` | Client + query hook for PH addresses. |
| `src/shared/lib/clients/ph-provinces-cities-client/query-keys.ts` | Query key factory. |
| `src/shared/lib/clients/ph-provinces-cities-client/schemas.ts` | Zod schemas for API response. |

### Owner Place Flow

| File | Change |
|------|--------|
| `src/features/owner/components/place-form.tsx` | Province/city selects + locked country, data validation. |
| `src/features/owner/schemas/place-form.schema.ts` | Province required, country required. |
| `src/features/owner/hooks/use-place-form.ts` | Send province + country in mutations. |
| `src/modules/place/dtos/place.dto.ts` | Province required for create. |
| `src/modules/place/services/place-management.service.ts` | Enforce `PH` country on write. |
| `src/shared/infra/db/schema/place.ts` | Province column set to `notNull()`. |

### Admin Curated Courts

| File | Change |
|------|--------|
| `src/app/(admin)/admin/courts/new/page.tsx` | Province/city selects + locked country, submission updated. |
| `src/app/(admin)/admin/courts/batch/page.tsx` | Province/city selects per row + locked country, submission updated. |
| `src/features/admin/schemas/curated-court.schema.ts` | Province + country required. |
| `src/features/admin/schemas/curated-court-batch.schema.ts` | Province + country required. |
| `src/modules/court/dtos/create-curated-court.dto.ts` | Added province/country fields. |
| `src/modules/court/services/admin-court.service.ts` | Persist province + enforce `PH`. |
| `src/features/admin/hooks/use-admin-courts.ts` | Cities now sourced from PH dataset. |

### UI Defaults

| File | Change |
|------|--------|
| `src/components/form/StandardFormProvider.tsx` | Form wrapper defaults to `w-full`. |
| `src/components/ui/card.tsx` | Card defaults to `w-full`. |

### Planning Docs

| File | Change |
|------|--------|
| `agent-plans/34-place-location-standardization/34-00-overview.md` | Master plan for PH location rollout. |
| `agent-plans/34-place-location-standardization/34-01-ph-address-data.md` | Data/API plan. |
| `agent-plans/34-place-location-standardization/34-02-place-form-enforcement.md` | Form + backend enforcement plan. |
| `agent-plans/34-place-location-standardization/place-location-dev1-checklist.md` | Dev checklist. |
| `agent-plans/context.md` | Logged plan entry. |

## Key Decisions

- Lock country to `PH` while keeping the field present for future expansion.
- Source province/city data from cached public API to ensure stable options.
- Require province across owner/admin flows to match DB constraints.

## Next Steps

- [ ] Run migration to enforce `place.province` not-null in DB.
- [ ] Run `pnpm lint` and `pnpm build`.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
