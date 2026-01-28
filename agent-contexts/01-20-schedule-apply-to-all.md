# [01-20] Schedule Rate "Apply to All" Button

> Date: 2026-01-28
> Previous: 01-19-screenshot-import-ai.md

## Summary

Replaced the auto-populate-on-first-input behavior for hourly rates in the court schedule editor with an explicit "Apply to all" button. The previous approach copied the rate to all open blocks on every keystroke of the first rate input, which required a debounce to avoid capturing partial input (e.g., typing "1" before "15").

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/owner/components/court-schedule-editor.tsx` | Simplified `handleHourlyRateInput` to only update the single edited row (removed auto-populate logic) |
| `src/features/owner/components/court-schedule-editor.tsx` | Added `handleApplyRateToAll` function that copies a source row's rate + currency to all other open blocks across all days |
| `src/features/owner/components/court-schedule-editor.tsx` | Added "Apply to all" outline button next to each hourly rate input; disabled when rate is empty; triggers a success toast |

## Key Decisions

- Used an explicit button instead of debounced auto-fill to eliminate timing/intent ambiguity
- The button applies rate + currency to all open blocks across all days (not just the current day)
- Button is disabled when the rate field is empty to prevent applying blank values
- Shows a toast confirmation so the user knows the action succeeded

## Next Steps

- [ ] Consider adding "Apply to day" variant if users want per-day bulk application
