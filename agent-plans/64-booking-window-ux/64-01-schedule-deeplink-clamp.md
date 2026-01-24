# Phase 1: Schedule Deep-Link Clamping

**Dependencies:** `agent-plans/63-booking-window-60-days/` applied

---

## Objective

Prevent invalid schedule deep links (query params) from producing empty/error states by clamping requested dates to the 60-day window.

---

## Module 1A: Clamp schedule params

**File:** `src/app/(public)/courts/[id]/schedule/page.tsx`

### Inputs to clamp

- `dayKey` (day view)
- `month` (month view)
- `startTime` (selected start time)

### Rules

- If the requested `dayKey` resolves to a date < today, clamp to today (already handled).
- If the requested `dayKey` resolves to a date > maxDate (today + 60 days), clamp to maxDate.
- If the requested `month` resolves to a month start > maxMonthStart, clamp to maxMonthKey.
- If clamping changes the day, clear `startTime` selection.

### Implementation steps

1. Compute once:
   - `today` (already exists)
   - `maxDate` (already exists)
   - `todayDayKey` (already exists)
   - `maxDayKey = getZonedDayKey(maxDate, placeTimeZone)`
2. In the existing effect that validates `dayKeyParam`:
   - Add an `else if (selectedRange.start > maxRange.end)` branch to set `dayKeyParam` to `maxDayKey`.
   - When clamping, also set `monthParam` to `maxMonthKey` and clear `startTimeParam`.
3. In the existing monthParam validation:
   - Ensure that clamping `monthParam` also clamps `dayKeyParam` if the current dayKey belongs to a day > max.

### Regression checks

- Deep link: `/courts/:id/schedule?date=<day beyond max>`
  - should auto-update URL to max day
  - should not show an error
  - should clear `startTime`

---

## Testing Checklist

- [ ] Day view: invalid future `dayKey` clamps to max.
- [ ] Month view: invalid future `month` clamps to max month.
- [ ] Selecting a valid day near the max still works.
