# [00-74] Verification Filter + Badge

> Date: 2026-01-20
> Previous: 00-73-hide-curated-verification-ui.md

## Summary

Added verification-tier filtering and priority ordering to discovery, plus trust badges on court cards.

## Changes Made

### Discovery Filtering + Ordering

| File | Change |
| --- | --- |
| `src/modules/place/dtos/place.dto.ts` | Added `verificationTier` filter for place list queries. |
| `src/modules/place/repositories/place.repository.ts` | Joined `place_verification`, applied priority ordering, and returned verification metadata. |
| `src/features/discovery/hooks/use-discovery.ts` | Passed verification filter through to discovery query and mapped metadata. |
| `src/features/discovery/schemas/search-params.ts` | Added verification param to discovery URL state. |
| `src/features/discovery/hooks/use-discovery-filters.ts` | Added verification filter setter and clear behavior. |
| `src/app/(public)/courts/page.tsx` | Wired verification filter into discovery page and filter component. |

### UI (Filters + Badge)

| File | Change |
| --- | --- |
| `src/features/discovery/components/court-filters.tsx` | Added segmented verification filter control. |
| `src/shared/components/kudos/place-card.tsx` | Added shield “Verified” badge and curated badge. |

## Key Decisions

- Default ordering prioritizes verified reservable, then curated, then unverified reservable.
- Verified status is based on `verification.status === VERIFIED` (not reservations enabled).

## Commands to Continue

```bash
pnpm lint
pnpm build
```
