---
tags:
  - agent-context
  - frontend/discovery
date: 2026-03-05
previous: 02-05-availability-grid-parity-speed.md
related_contexts:
  - "[[02-05-availability-grid-parity-speed]]"
  - "[[02-04-mobile-crossday-selection]]"
---

# [02-06] Crossweek Visual Overlap

> Date: 2026-03-05
> Previous: 02-05-availability-grid-parity-speed.md

## Summary

Implemented cross-week booking continuity so a selection that starts in the previous week can be extended in the next week, and fixed the visual parity gap where the summary/cart state was correct but the next-week grid highlight disappeared. Added pure-domain regressions to lock this behavior for mobile and desktop shared grid logic.

## Related Contexts

- [[02-05-availability-grid-parity-speed]] - Established shared desktop/mobile week-grid core and parity baseline.
- [[02-04-mobile-crossday-selection]] - Prior cross-day selection fixes that this cross-week extension builds on.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/discovery/place-detail/helpers/cross-week-range.ts` | Added cross-week merge resolver that preserves prior start and merges to new visible-week end when slot chain is contiguous/available. |
| `src/features/discovery/place-detail/hooks/use-next-week-prefetch.ts` | Added shared hook to prefetch next adjacent week availability for both `court` and `any` modes with dedupe keying. |
| `src/features/discovery/place-detail/components/sections/place-detail-booking-desktop-section.tsx` | Wired next-week prefetch and cross-week range merge into `court` and `any` handlers. |
| `src/features/discovery/place-detail/components/sections/place-detail-booking-mobile-section.tsx` | Wired the same next-week prefetch and cross-week range merge behavior for mobile surface parity. |
| `src/components/kudos/week-grid-domain.ts` | Updated committed-range derivation to render visible overlap when selected start is outside the currently rendered week. |

### Documentation

| File | Change |
|------|--------|
| `src/__tests__/features/discovery/place-detail/helpers/cross-week-range.test.ts` | Added merge success/failure edge-case coverage for cross-week range resolver. |
| `src/__tests__/features/discovery/place-detail/hooks/use-next-week-prefetch.test.ts` | Added tests for next-week prefetch inputs, mode routing, and dedupe behavior. |
| `src/__tests__/components/kudos/week-grid-domain.test.ts` | Added regressions for visible-overlap highlight and no-overlap null range behavior across week boundaries. |

## Tag Derivation (From This Session's Changed Files)

- `frontend/discovery`: changed files under `src/features/discovery/place-detail/**` and associated `src/__tests__/features/discovery/place-detail/**`.
- `agent-context`: required base tag.

## Key Decisions

- Kept desktop/mobile parity by applying cross-week merge logic at both surfaces and for both selection modes, instead of maintaining divergent fallback paths.
- Fixed the visual issue in shared grid domain (`deriveWeekGridCommittedRange`) rather than in UI handlers, since state/cart correctness proved this was a rendering derivation gap.
- Used temporary console tracing to isolate failure branch, then removed debug logs after codifying behavior in unit tests.

## Next Steps (if applicable)

- [ ] Add one integration-level test that simulates week navigation and confirms highlight persistence with cross-week selected range.
- [ ] Run a quick manual parity matrix on mobile/desktop for cross-week reselect + clear flows.

## Commands to Continue

```bash
pnpm -s vitest run src/__tests__/features/discovery/place-detail/helpers/cross-week-range.test.ts src/__tests__/features/discovery/place-detail/hooks/use-next-week-prefetch.test.ts src/__tests__/components/kudos/week-grid-domain.test.ts src/__tests__/components/kudos/availability-week-grid.test.ts src/__tests__/components/kudos/mobile-week-grid.test.tsx
pnpm -s exec biome check src/features/discovery/place-detail/helpers/cross-week-range.ts src/features/discovery/place-detail/hooks/use-next-week-prefetch.ts src/features/discovery/place-detail/components/sections/place-detail-booking-desktop-section.tsx src/features/discovery/place-detail/components/sections/place-detail-booking-mobile-section.tsx src/components/kudos/week-grid-domain.ts
```
