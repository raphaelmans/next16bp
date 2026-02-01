# [01-42] Feb 01 Bugfixes

> Date: 2026-02-01
> Previous: 01-41-peek-bar-all-selections.md

## Summary

Implemented fixes and UX improvements for the Feb 1 bug list, focusing on Availability Studio reliability, mobile usability, admin queue refresh, and clearer courts list display. Updated mobile selection UX to use the peek bar and removed the range-adjust controls. Updated manual verification notes.

## Changes Made

### Availability Studio & Range Selection

| File | Change |
|------|--------|
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` | Added verification/reservations banner, fixed mobile header truncation, opened mobile drawer on any selection, added compact reservation rendering + click-through to details, wired drawer range controls. |
| `src/components/kudos/range-selection/range-selection-provider.tsx` | Sync committed range with `useLayoutEffect` to avoid flicker. |
| `src/components/kudos/range-selection/range-selection-store.ts` | Commit range updates local state immediately to stabilize highlight. |
| `src/features/owner/components/booking-studio/timeline-reservation-item.tsx` | Added clickable reservation blocks and overflow containment. |
| `src/features/owner/components/booking-studio/mobile-create-block-drawer.tsx` | Removed range-adjust controls from mobile drawer. |
| `src/features/owner/components/booking-studio/mobile-selection-peek-bar.tsx` | Reused for Availability Studio mobile hint. |

### Admin + Owner Lists + Schedule

| File | Change |
|------|--------|
| `src/features/admin/hooks.ts` | Force verification queue refetch on mount and focus. |
| `src/features/owner/components/courts-table.tsx` | Hide misleading 0/0 slots by showing `—` when totals are unknown. |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/schedule/page.tsx` | Allowed horizontal overflow to prevent mobile time picker clipping. |
| `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx` | Scoped overflow fix to schedule step. |

### Documentation

| File | Change |
|------|--------|
| `external/bugs/02-01-verif-testing.md` | Updated blackbox checklist for peek bar flow. |
| `external/bugs/02-01.md` | Noted deferred status for Enhancement 1 and updated mobile hint expectation. |

## Key Decisions

- Stabilized range selection by updating local committed range immediately to prevent UI flicker.
- Used minimal, scoped layout adjustments for mobile time picker clipping instead of global layout changes.
- Chose a blackbox test checklist to keep manual QA lightweight and consistent.

## Next Steps (if applicable)

- [ ] Run manual QA against `external/bugs/02-01-verif-testing.md`.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
