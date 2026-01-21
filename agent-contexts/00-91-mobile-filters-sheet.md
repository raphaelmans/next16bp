# [00-91] Mobile Filters Sheet

> Date: 2026-01-21
> Previous: 00-90-verification-courts-guard.md

## Summary

Reintroduced courts filtering on mobile by reusing the existing `PlaceFilters` controls inside a bottom sheet, triggered via a filter icon CTA with an active-filter count badge.

## Changes Made

### Discovery Filters (Mobile)

| File | Change |
|------|--------|
| `src/features/discovery/components/place-filters-sheet.tsx` | Added a mobile-only filter sheet (bottom) with active-count badge, Clear/Show Results actions, and scrollable content. |
| `src/features/discovery/components/court-filters.tsx` | Extended `PlaceFilters` with `layout` (desktop vs sheet) + `showClearButton`, enabling full-width sheet layout while keeping desktop hidden below `lg`. |
| `src/features/discovery/components/index.ts` | Exported `PlaceFiltersSheet`. |
| `src/app/(public)/courts/page.tsx` | Mounted `PlaceFiltersSheet` beside `ViewToggle` and kept desktop filters rendering via `layout="desktop"`. |

## Key Decisions

- Reuse `PlaceFilters` rather than duplicate logic to keep filter behavior consistent across breakpoints.
- Use a bottom sheet with a sticky action footer to keep “Clear all” and “Show results” always reachable on small screens.
- Show active filter count on the icon CTA for quick scan/trust signal that filtering is applied.

## Next Steps (if applicable)

- [ ] Quick QA on iOS Safari + Android Chrome for sheet height, safe-area padding, and popover stacking.

## Commands to Continue

```bash
pnpm lint
pnpm build
pnpm dev
```
