# [01-17] Testing Report Fixes — Availability & Court Setup

> Date: 2026-01-27
> Previous: 01-16-auth-email-templates.md

## Summary

Addressed four issues from Louise's testing report covering the court setup flow and availability page. Fixed misleading empty state when reservations are disabled, disabled the "Go to Availability" button when schedule is incomplete, and filtered the availability month view to show only the selected day's slots.

## Changes Made

### Issue 1: Reservations-disabled diagnostic (High)

| File | Change |
|------|--------|
| `src/modules/availability/services/availability.service.ts` | Added `reservationsDisabled` field to `AvailabilityDiagnostics` interface. All `emptyDiagnostics`, `baseDiagnostics`, and `aggregatedDiagnostics` constructors updated. Early returns from `isPlaceBookable()` now set `reservationsDisabled: true`. |
| `src/components/availability-empty-state.tsx` | Added `reservationsDisabled` to diagnostics interface, new `reservations_disabled` reason with distinct owner/public messages. Owner message directs to venue verification panel. |

### Issue 2: Setup wizard — disable Go to Availability (Medium)

| File | Change |
|------|--------|
| `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx` | "Go to Availability" button on Publish step is now disabled when `!hasHours \|\| !hasPricingRules`. Uses conditional `asChild` to prevent rendering a clickable link when disabled. |

### Issue 3: Reservations toggle hard to find (Low — no changes)

No code changes. The toggle lives inside `PlaceVerificationPanel` gated on VERIFIED status. A future UX improvement could add a post-verification prompt or banner.

### Issue 4: Availability shows all month slots at once (Medium UX)

| File | Change |
|------|--------|
| `src/shared/components/kudos/availability-month-view.tsx` | Added `getZonedDayKey` import. Slot list is now filtered to only show the selected day. Added a date heading above slots. Shows "No available times for this day" when selected day has no slots but other days do. |

## Key Decisions

- **Reservations-disabled check runs first** in `determineReason()` so it takes priority over missing hours/pricing — the root cause is reservations being off, not missing schedule data.
- **Conditional `asChild`** pattern used on the Publish step button to avoid rendering a `<Link>` inside a disabled `<Button>`, which would still be navigable.
- **Selected-day filtering** done inside `AvailabilityMonthView` component rather than the parent page, since the component already receives `selectedDate` and this is the expected default UX.

## Next Steps

- [ ] Consider adding post-verification prompt to auto-enable reservations (Issue 3 follow-up)
- [ ] Consider sticky calendar on availability page as additional UX enhancement

## Commands to Continue

```bash
pnpm lint    # 8 pre-existing errors (a11y role="status" etc.)
pnpm build   # passes clean
```
