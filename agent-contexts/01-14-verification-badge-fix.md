# [01-14] Verification Badge Display Fix

> Date: 2025-01-27
> Previous: 01-13-owner-onboarding-revamp.md

## Summary

Fixed inconsistent verification badge display on the venue detail page where the header showed "VERIFIED" badge while the Courts section showed "Verification required to book" for venues with `verificationStatus = "VERIFIED"` but `reservationsEnabled = false`.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/discovery/helpers.ts` | Added `getPlaceVerificationDisplay()` helper function with types for consistent verification display logic |
| `src/app/(public)/places/[placeId]/place-detail-client.tsx` | Replaced scattered inline logic with helper call; badge now uses `showVerificationBadge` instead of `isVerifiedReservable` |

## Key Decisions

- **Extracted to helper**: Moved verification display logic to a shared helper for consistency, testability, and reusability
- **Badge tied to booking**: `showVerificationBadge` is now `true` only when `showBooking` is `true` (requires both `isVerified` AND `reservationsEnabled`)
- **Single source of truth**: Both header badge and Courts section message derive from the same helper function

## Behavior Matrix

| Scenario | Badge | Courts Message |
|----------|-------|----------------|
| `VERIFIED` + `reservationsEnabled=true` | Shows | Booking enabled |
| `VERIFIED` + `reservationsEnabled=false` | Hidden | "Verification required to book" |
| `PENDING` | Hidden | "Verification pending" |
| `REJECTED` | Hidden | "Verification needs updates" |
| `CURATED` | Shows "Curated" | No verification UI |

## Verification

- `pnpm lint` - No new errors from changes
- `pnpm build` - Compilation succeeded (pre-existing type error in `availability.service.ts` unrelated)
