# [01-25] January 28 UI Enhancements

> Date: 2025-01-28
> Previous: 01-24-owner-onboarding-decommission.md

## Summary

Implemented two UI enhancements: (1) Extended "Apply to all" button in court schedule editor to copy start/end times alongside rate/currency, and (2) Fixed CTA button for "reservations disabled" state in availability empty state to link to verification panel.

## Changes Made

### Enhancement 1: Apply to All - Include Times

| File | Change |
|------|--------|
| `src/features/owner/components/court-schedule-editor.tsx` | Renamed `handleApplyRateToAll` to `handleApplyToAll`; extended to copy `startTime` and `endTime` in addition to `hourlyRate` and `currency` to all open blocks; updated toast message |

### Enhancement 2: Reservations Disabled CTA

| File | Change |
|------|--------|
| `src/components/availability-empty-state.tsx` | Added `verificationHref` prop; conditional CTA rendering - shows "Enable reservations" (primary) when reservations disabled, otherwise shows "Edit schedule & pricing" (outline) |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` | Passes `verificationHref={appRoutes.owner.verification.place(placeId)}` to `AvailabilityEmptyState` |

## Key Decisions

- **Single "Apply to all" action**: Rather than separate buttons for times vs rates, a single action copies everything (simpler UX)
- **Primary button for verification CTA**: "Enable reservations" uses primary styling to emphasize action needed, while "Edit schedule & pricing" remains outline
- **Conditional routing**: Verification CTA only appears when `verificationHref` is provided and reason is `reservations_disabled`

## Verification

- `pnpm lint` - passed (pre-existing unrelated warnings)
- `pnpm build` - passed successfully
