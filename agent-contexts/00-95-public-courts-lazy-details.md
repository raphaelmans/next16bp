# [00-95] Public Courts Lazy Details

> Date: 2026-01-21
> Previous: 00-94-venue-slug-routing.md

## Summary

Implemented a two-phase discovery fetch on `/courts`: fast summaries first, then parallel batched detail queries for media and meta, with sub-section skeletons in place cards. Added new tRPC endpoints and repository helpers to support summary lists and batched detail loading while keeping the original list endpoint intact.

## Changes Made

### Backend

| File | Change |
|------|--------|
| `src/modules/place/dtos/place.dto.ts` | Added card media/meta input schemas and DTO types; relaxed empty `placeIds` handling. |
| `src/modules/place/place.router.ts` | Added `listSummary`, `cardMediaByIds`, and `cardMetaByIds` endpoints. |
| `src/modules/place/services/place-discovery.service.ts` | Added summary + batched detail service methods. |
| `src/modules/place/repositories/place.repository.ts` | Added summary/meta/media models and methods; introduced `listBaseRecords` helper; parallelized hydration in `list`. |

### Frontend

| File | Change |
|------|--------|
| `src/features/discovery/hooks/use-discovery.ts` | Added summary/detail hooks and card composition helper; new types for summary + detail state. |
| `src/features/discovery/hooks/index.ts` | Exported new discovery hooks and helpers. |
| `src/shared/components/kudos/place-card.tsx` | Added skeleton sub-sections for media/meta loading and loading state props. |
| `src/app/(public)/courts/page.tsx` | Switched to summary + batched detail fetch, composed card data, and passed loading flags into cards; map uses summary lat/lng. |

## Key Decisions

- Used batched detail endpoints (`cardMediaByIds`, `cardMetaByIds`) to avoid per-card requests while still allowing parallel sub-section loading.
- Kept `place.list` for existing callers but refactored its hydration to reuse base filtering logic and run in parallel.
- Added skeleton sub-sections inside `PlaceCard` to prevent layout shift and support progressive rendering.

## Next Steps

- [ ] Run `pnpm lint` and `pnpm build` (consider `TZ=UTC pnpm build`).
- [ ] Validate `/courts` filters + pagination with the new summary/detail flow.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
