---
tags:
  - agent-context
  - frontend/discovery
date: 2026-03-04
previous: 02-03-noorg-bottom-tabs-fix.md
related_contexts:
  - "[[01-81-place-detail-composition-pass]]"
  - "[[01-38-mobile-booking-overflow-fix]]"
---

# [02-04] Mobile Crossday Selection

> Date: 2026-03-04
> Previous: 02-03-noorg-bottom-tabs-fix.md

## Summary

Addressed mobile-only cross-day booking selection regressions in place detail availability. The machine-level preserve-on-adjacent-day path now works with correct next-day detection, and mobile commit behavior was aligned with desktop to prevent stale previous-day anchors from overriding reselection.

## Related Contexts

- [[01-81-place-detail-composition-pass]] - Contains prior place-detail booking composition and state wiring decisions.
- [[01-38-mobile-booking-overflow-fix]] - Relevant mobile booking UX/state handling history for sheet interactions.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/discovery/place-detail/helpers/date-adjacency.ts` | Added pure helper functions for next-day key computation and same-or-next-day checks in place timezone. |
| `src/features/discovery/place-detail/components/sections/place-detail-booking-mobile-section.tsx` | Fixed adjacent-day preservation logic to use true next-day semantics; refined `crossDayStartTime` activation; removed mobile-only cross-day merge override so commits follow picker output. |
| `src/components/kudos/time-range-picker.tsx` | Updated committed range behavior for cross-day contexts: avoid synthetic midnight auto-anchor at day boundary and keep visible range highlighted when selection spills past day end. |

### Documentation

| File | Change |
|------|--------|
| `src/__tests__/features/discovery/place-detail/helpers/date-adjacency.test.ts` | Added regression tests for same-day, next-day, and non-adjacent day detection. |
| `src/__tests__/features/discovery/place-detail/machines/time-slot-machine.actions.test.ts` | Added tests for `computeDateSelection(preserveSelection)` behavior. |
| `src/__tests__/components/kudos/time-range-picker.test.ts` | Added/updated cross-day rendering and summary behavior tests for boundary and spillover cases. |

## Tag Derivation (From This Session's Changed Files)

- `frontend/discovery`: changed files under `src/features/discovery/place-detail/**` and discovery-related tests.
- `agent-context`: required base tag.

## Key Decisions

- Adjacent-day logic was extracted into pure helpers to remove duplicated date math and prevent future timezone/day-boundary mistakes.
- Mobile range commit now mirrors desktop behavior; cross-day anchoring is handled by picker inputs (`crossDayStartTime`) rather than manual merge heuristics in the mobile handler.
- Day-view committed range keeps visible overlap even when selection extends beyond the day boundary to reduce “selection lost” confusion when navigating between adjacent days.

## Next Steps (if applicable)

- [ ] Run manual mobile scenario matrix for cross-day reselection (Fri 10 PM -> Sat 2 AM -> reset to Sat 1 AM-3 AM).
- [ ] Validate summary/footer coherence (`START`/`END` markers and bottom summary text) against final UX expectations.
- [ ] Add higher-level interaction coverage (component-level mobile flow test) if this area changes again.

## Commands to Continue

```bash
pnpm exec vitest run src/__tests__/features/discovery/place-detail/helpers/date-adjacency.test.ts src/__tests__/features/discovery/place-detail/machines/time-slot-machine.actions.test.ts src/__tests__/components/kudos/time-range-picker.test.ts
pnpm exec biome check src/features/discovery/place-detail/components/sections/place-detail-booking-mobile-section.tsx src/components/kudos/time-range-picker.tsx src/features/discovery/place-detail/helpers/date-adjacency.ts
```

