## Why

Courts can operate 24/7 or have late-night hours (e.g., 9PM-2AM), but the system cannot book across midnight. The pricing engine (`computeSchedulePriceDetailed`) already handles cross-midnight naturally by resolving each hour's `dayOfWeek`/`minuteOfDay` independently. The blockers are at 3 layers: backend availability range boundary, frontend week grid same-day constraint, and cart same-day validation.

## What Changes

- **Backend overnight extension** — `computeOvernightExtension()` auto-detects next-day hours contiguous from midnight and extends the query range. Applied in all 5 availability entry points.
- **Desktop week grid cross-day selection** — Remove same-day guards from `computeRange`, `clampToContiguous`, and `WeekGridSummaryBar`. Allow adjacent-day selection and cross-day price summation.
- **Desktop week navigation arrows** — Prev/next week chevron arrows in the week grid header for easier navigation across week boundaries.
- **Cart multi-day validation** — `getBookingCartDayKeys()` computes the set of dayKeys a booking spans. `validateBookingCartAdd()` allows items on any day the first cart item spans.
- **Mobile cross-midnight** — Handled automatically by backend extension; `TimeRangePicker` renders overflow slots naturally.

## Outcome

A user booking a 24/7 court can select 9PM-1AM (spanning midnight), both on desktop and mobile.
