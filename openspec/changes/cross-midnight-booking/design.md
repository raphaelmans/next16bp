## Architecture

### Backend: Overnight Range Extension

`AvailabilityService.computeOvernightExtension(rangeEnd, timeZone, hoursWindows)` inspects the next calendar day's hours windows. If they start at minute 0 (contiguous from midnight), the range is extended to cover those hours. This is applied in all 5 availability entry points before fetching reservations/blocks/overrides and before `buildAvailabilityForCourtRange`.

The existing `buildAvailabilityForCourtRange` iterates day-by-day and generates slots per day's windows. With the extended range, the next day is included in the iteration, and only its midnight-contiguous windows produce slots (later-day slots are filtered by `endTime > rangeEnd`).

No changes to `computeSchedulePriceDetailed` or `ReservationService` — they already resolve cross-midnight pricing and booking correctly.

### Frontend: Week Grid Cross-Day Selection

The linear index system (`linearIdx = dayColIdx * hoursPerDay + hourIdx`) naturally supports cross-day ranges. The guards that enforced same-day selection are removed. `computeRange` and `clampToContiguous` now walk linear indices across day boundaries, constrained to adjacent days only.

### Frontend: Cart Multi-Day Validation

`getBookingCartDayKeys(item, timeZone)` computes the set of dayKeys a booking spans (1 for same-day, 2 for cross-midnight). `validateBookingCartAdd` checks if the candidate's dayKey is in the first item's dayKey set.

### Key Invariant

The overnight extension is driven entirely by the court's actual hours — no artificial caps. A court with no midnight-contiguous hours gets no extension.
