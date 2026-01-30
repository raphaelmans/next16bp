# [01-36] Week Timeline Union

> Date: 2026-01-30
> Previous: 01-35-booking-studio-selection-panel.md

## Summary

Updated the owner week timeline to derive its vertical time axis from the union of court hours across visible days and made closed-hour cells non-interactive with muted styling to prevent truncation and invalid selection.

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/features/owner/components/booking-studio/court-hours.ts` | Added helpers to compute week range and open-hour cell indices from court hours windows. |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` | Switched week view range to union logic and enforced court-hours gating in day selection; passed windows into week columns. |
| `src/app/(owner)/owner/bookings/page.tsx` | Adopted union week range and court-hours gating for day selection; passed windows into week columns. |
| `src/features/owner/components/booking-studio/week-day-column.tsx` | Added court-hours-aware availability checks to prevent selection in closed gaps. |
| `src/features/owner/components/booking-studio/selectable-timeline-row.tsx` | Disabled droppable and greyed out unavailable cells. |

## Key Decisions

- Use a shared helper to compute week timeline bounds while ignoring closed days to avoid truncation.
- Gate range selection by court hours to prevent interacting with closed slots and gaps.

## Next Steps (if applicable)

- [ ] Run `pnpm lint`, `pnpm build`, and `TZ=UTC pnpm build`.

## Commands to Continue

```bash
pnpm lint
pnpm build
TZ=UTC pnpm build
```
