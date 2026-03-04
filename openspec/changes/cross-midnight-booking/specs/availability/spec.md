## Availability — Cross-Midnight Delta Spec

### Changed Behavior

`AvailabilityService` now automatically extends the query range past midnight when the next calendar day has hours windows contiguous from minute 0.

### New Method

```
computeOvernightExtension(rangeEnd, timeZone, hoursWindows) → Date
```

- Determines the dayOfWeek of the day after `rangeEnd`
- Filters hours windows for that dayOfWeek, sorted by `startMinute`
- Walks contiguous windows from minute 0 to find the maximum contiguous `endMinute`
- Returns `nextDayStart + contiguousEnd minutes` or the original `rangeEnd` if no extension

### Affected Entry Points

All 5 availability methods now:
1. Fetch hours/rules/addons in parallel (phase 1)
2. Compute overnight extension from hours
3. Fetch reservations/blocks/overrides with extended range (phase 2)
4. Pass extended range to `buildAvailabilityForCourtRange`

### No Changes

- `computeSchedulePriceDetailed` — already cross-midnight safe
- `buildAvailabilityForCourtRange` internals — day iteration and slot generation unchanged
- `ReservationService` — booking validation unchanged
