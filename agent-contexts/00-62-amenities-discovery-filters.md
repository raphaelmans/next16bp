# [00-62] Amenities Discovery Filters

> Date: 2026-01-19
> Previous: 00-61-admin-photo-upload.md

## Summary

Implemented amenities discovery filtering by aggregating place amenities, exposing a public API + client, and wiring Nuqs-based multi-select filters into the `/courts` UI with AND semantics.

## Changes Made

### Backend

| File | Change |
|------|--------|
| `src/modules/place/repositories/place.repository.ts` | Added amenities aggregation and AND filtering for place listing. |
| `src/modules/place/services/place-discovery.service.ts` | Passed amenities to list query and added listAmenities. |
| `src/modules/place/dtos/place.dto.ts` | Added amenities array to list schema. |
| `src/app/api/public/amenities/route.ts` | New public amenities endpoint with error handling. |

### Client + UI

| File | Change |
|------|--------|
| `src/shared/lib/clients/amenities-client/index.ts` | Added amenities client + React Query hook. |
| `src/shared/lib/clients/amenities-client/query-keys.ts` | Added query keys for amenities. |
| `src/shared/lib/clients/amenities-client/schemas.ts` | Added response schema. |
| `src/features/discovery/schemas/search-params.ts` | Added Nuqs amenities array param. |
| `src/features/discovery/hooks/use-discovery-filters.ts` | Added amenities filter state + clear handling. |
| `src/features/discovery/hooks/use-discovery.ts` | Passed amenities to place.list query. |
| `src/features/discovery/components/court-filters.tsx` | Added amenities multi-select filter (first in row). |
| `src/app/(public)/courts/page.tsx` | Wired amenities filter into discovery page. |

### Planning

| File | Change |
|------|--------|
| `agent-plans/context.md` | Logged new amenities discovery plan. |
| `agent-plans/42-amenities-discovery-filters/42-00-overview.md` | Master plan for amenities filters. |
| `agent-plans/42-amenities-discovery-filters/42-01-backend-amenities.md` | Backend aggregation + route plan. |
| `agent-plans/42-amenities-discovery-filters/42-02-frontend-amenities.md` | Client + UI plan. |
| `agent-plans/42-amenities-discovery-filters/amenities-discovery-dev1-checklist.md` | Dev checklist. |

## Key Decisions

- Use Nuqs `parseAsArrayOf(parseAsString)` for amenities URL state.
- Apply AND semantics in place list filtering via `place_amenity` grouping.
- Derive amenities from place data instead of a static list.

## Next Steps (if applicable)

- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build`.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
