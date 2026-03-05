---
tags:
  - agent-context
  - frontend/discovery
date: 2026-03-05
previous: 02-08-mobile-peek-bar-nav-offset.md
related_contexts:
  - "[[01-33-place-detail-ux-overhaul]]"
  - "[[01-81-place-detail-composition-pass]]"
---

# [02-09] Mobile/Desktop Booking Consistency

> Date: 2026-03-05
> Previous: 02-08-mobile-peek-bar-nav-offset.md

## Summary

Made mobile booking sheet consistent with desktop in two areas: (1) cart item time display now always shows start-end time range (not just start time), and (2) added shared `WeekNavigator` component with prev/next week controls, calendar popover, and Today button used by both mobile and desktop. Removed redundant standalone date picker from mobile sheet.

## Related Contexts

- [[01-33-place-detail-ux-overhaul]] - Place detail UX overhaul where mobile sheet was introduced
- [[01-81-place-detail-composition-pass]] - Composition pass that established the compound component pattern

## Changes Made

### Cart item end time display

| File | Change |
|------|--------|
| `src/features/discovery/place-detail/components/place-detail-mobile-sheet.tsx` | Added `addMinutes`/`getZonedDayKey` imports; replaced simple start-time-only format with IIFE that computes end time and always shows time range (cross-midnight uses date+time format) |
| `src/features/discovery/place-detail/components/place-detail-booking-summary-card.tsx` | Fixed same issue on desktop - end time was only shown for cross-midnight bookings, now always shown |

### Week navigation + shared WeekNavigator

| File | Change |
|------|--------|
| `src/components/kudos/week-navigator.tsx` | **New** - Shared week navigator with prev/next chevrons, calendar popover on week label, Today button. Manages own popover state internally |
| `src/components/kudos/index.ts` | Added `WeekNavigator` export |
| `src/features/discovery/place-detail/components/place-detail-mobile-sheet.tsx` | Replaced inline week nav + standalone date picker + calendar Dialog with `<WeekNavigator />`; removed `mobileCalendarOpen`/`setMobileCalendarOpen`/`onMobileCalendarJump` props; added `onCalendarJump` prop |
| `src/features/discovery/place-detail/components/sections/place-detail-booking-mobile-section.tsx` | Added `addDays` import; computed `weekStartDate`/`weekEndDate`/`weekHeaderLabel`/`handlePrevWeek`/`handleNextWeek`/`isPrevWeekDisabled`/`isNextWeekDisabled`/`handleGoToToday` with selection preservation; removed `mobileCalendarOpen` state; passes all week nav props to MobileSheet |
| `src/features/discovery/place-detail/components/place-detail-availability-desktop.tsx` | Replaced inline week nav bar + KudosDatePicker + Today button with `<WeekNavigator />`; removed `calendarPopoverOpen`/`setCalendarPopoverOpen`/`onGoToToday` props |
| `src/features/discovery/place-detail/components/sections/place-detail-booking-desktop-section.tsx` | Removed `calendarPopoverOpen` state; stopped passing it to AvailabilityDesktop |

## Tag Derivation (From This Session's Changed Files)

- `frontend/discovery` - All changed files are in `src/features/discovery/place-detail/` or `src/components/kudos/`

## Key Decisions

- End time is always displayed; `crossesMidnight` flag only controls format (time-only vs date+time), not visibility
- `WeekNavigator` manages its own `calendarPopoverOpen` state internally to reduce prop drilling
- Week nav handlers in mobile section use `isWithinAdjacentWeek` for selection preservation, matching desktop behavior
- Removed `KudosDatePicker` + separate Today button from desktop in favor of unified `WeekNavigator`

## Next Steps (if applicable)

- [ ] Verify week navigation + calendar popover works on both mobile and desktop
- [ ] Verify cart items show "Apr 4, 7:00 PM - 10:00 PM" format on both surfaces
