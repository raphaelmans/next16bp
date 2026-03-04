---
tags:
  - agent-context
  - frontend/discovery
date: 2026-03-04
previous: 02-04-mobile-crossday-selection.md
related_contexts:
  - "[[02-04-mobile-crossday-selection]]"
  - "[[01-81-place-detail-composition-pass]]"
---

# [02-05] Availability Grid Parity Speed

> Date: 2026-03-04
> Previous: 02-04-mobile-crossday-selection.md

## Summary

Completed a parity and speed pass on place-detail availability booking flows. Mobile and desktop now share core week-grid rendering/query-window behavior, cart pricing no longer allows null-estimate adds, and desktop add-to-booking latency was reduced by removing media-query hydration lag and adding instant local summary-price fallback while duration pricing fetches.

## Related Contexts

- [[02-04-mobile-crossday-selection]] - Prior cross-day selection fixes that this parity/speed pass builds on.
- [[01-81-place-detail-composition-pass]] - Earlier composition and boundary decisions for place-detail booking surfaces.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/components/kudos/mobile-week-grid.tsx` | Reworked mobile week grid into a thin adapter over desktop `AvailabilityWeekGrid` to centralize selection/render logic. |
| `src/components/kudos/availability-week-grid.tsx` | Centralized hour-model usage through domain helper; constrained model by rendered day keys. |
| `src/components/kudos/week-grid-domain.ts` | Added day-key-aware hour model to prevent extra out-of-window rows from inflating columns. |
| `src/features/discovery/place-detail/helpers/week-grid-query-window.ts` | Added shared week-query and summary-query window builders used by both desktop and mobile booking sections. |
| `src/features/discovery/place-detail/components/sections/place-detail-booking-desktop-section.tsx` | Migrated to shared query-window logic; aligned summary derivation and viewport gating for faster desktop pricing readiness. |
| `src/features/discovery/place-detail/components/sections/place-detail-booking-mobile-section.tsx` | Migrated to shared query-window logic; aligned with desktop behavior and viewport gating. |
| `src/features/discovery/place-detail/helpers/booking-summary.ts` | Added instant local total fallback from contiguous picker slots and preferred duration-derived end time while pricing query is in flight. |
| `src/features/discovery/place-detail/helpers/selection-estimate.ts` | Added pure readiness guard ensuring add-to-cart uses current, priced selection summary. |
| `src/features/discovery/place-detail/components/sections/place-detail-booking-section.tsx` | Enforced ready-estimate guard before add-to-cart and for `canAddToCart` visibility logic. |
| `src/features/discovery/place-detail/components/place-detail-mobile-sheet.tsx` | Improved review UX for mixed-priced carts (`Price unavailable`, `Partial estimate`, pending estimate count). |
| `src/features/discovery/place-detail/components/place-detail-booking-summary-card.tsx` | Same mixed-priced cart clarity in desktop summary card. |

### Documentation

| File | Change |
|------|--------|
| `src/__tests__/components/kudos/week-grid-domain.test.ts` | Added regression for day-key-constrained hour model behavior. |
| `src/__tests__/components/kudos/mobile-week-grid.test.tsx` | Added parity test to assert mobile wrapper and desktop core render same cell count for identical inputs. |
| `src/__tests__/features/discovery/place-detail/helpers/week-grid-query-window.test.ts` | Added tests for clamping and adjacent-week anchor window behavior. |
| `src/__tests__/features/discovery/place-detail/helpers/booking-summary.test.ts` | Added tests for local instant total fallback and incomplete slot-chain handling. |
| `src/__tests__/features/discovery/place-detail/helpers/selection-estimate.test.ts` | Added guard tests for summary freshness/price readiness. |
| `src/__tests__/features/discovery/place-detail/components/place-detail-mobile-sheet.test.tsx` | Added partial-estimate UX assertions. |
| `src/__tests__/features/discovery/place-detail/components/place-detail-booking-summary-card.test.tsx` | Added desktop partial-estimate UX assertion. |

## Tag Derivation (From This Session's Changed Files)

- `frontend/discovery`: changed files under `src/features/discovery/place-detail/**` and related tests.
- `agent-context`: required base tag.

## Key Decisions

- Treat desktop behavior as source of truth and centralize mobile onto shared week-grid/domain paths instead of maintaining divergent rendering/state logic.
- Keep pricing correctness guard (avoid null-priced cart lines) but remove UX lag by deriving local instant totals from picker slots while duration pricing queries resolve.
- Avoid out-of-window hour inflation by deriving grid hours only from rendered day keys.

## Next Steps (if applicable)

- [ ] Run manual desktop timing checks under throttled network to confirm add-to-booking appears immediately after range commit.
- [ ] Optionally render add button immediately in disabled state with `Calculating...` for clearer perceived responsiveness.
- [ ] Track summary-query latency distribution to decide if further API-level optimization is needed.

## Commands to Continue

```bash
pnpm exec vitest run src/__tests__/features/discovery/place-detail/helpers/booking-summary.test.ts src/__tests__/features/discovery/place-detail/helpers/selection-estimate.test.ts src/__tests__/features/discovery/place-detail/components/place-detail-mobile-sheet.test.tsx src/__tests__/features/discovery/place-detail/components/place-detail-booking-summary-card.test.tsx src/__tests__/components/kudos/mobile-week-grid.test.tsx src/__tests__/components/kudos/week-grid-domain.test.ts src/__tests__/features/discovery/place-detail/helpers/week-grid-query-window.test.ts
pnpm exec biome check src/features/discovery/place-detail/components/sections/place-detail-booking-desktop-section.tsx src/features/discovery/place-detail/components/sections/place-detail-booking-mobile-section.tsx src/features/discovery/place-detail/components/sections/place-detail-booking-section.tsx src/features/discovery/place-detail/helpers/booking-summary.ts src/features/discovery/place-detail/helpers/selection-estimate.ts src/components/kudos/availability-week-grid.tsx src/components/kudos/week-grid-domain.ts
```
