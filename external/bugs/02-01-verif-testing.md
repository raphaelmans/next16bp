# Verification Testing - February 1, 2026

Source: `external/bugs/02-01.md`

## Summary

- Scope: Bugs 1-8 + Enhancement 3
- Status: Automated checks complete; manual QA pending

## Environment

- OS: macOS (local dev)
- App: Next.js 16 App Router
- Build validation: `pnpm lint`, `TZ=UTC pnpm build`

## Automated Checks

- `pnpm lint`: Pass
- `TZ=UTC pnpm build`: Pass

## Manual Verification Checklist

Status legend: PASS / FAIL / NOT RUN

### Bug 1 - Availability Studio missing verification/reservations warnings

- Preconditions: Owner account with a place in each state
  - Verification status != VERIFIED
  - Verification status VERIFIED + reservationsEnabled = false
- Steps
  1. Open `/owner/venues/[placeId]/courts/[courtId]/availability`
  2. Confirm banner appears for verification status != VERIFIED
  3. Confirm banner appears for reservations disabled
  4. Confirm CTAs go to `/owner/verify/[placeId]`
- Expected
  - Banners are visible, non-blocking, and accurate
- Status: NOT RUN

### Bug 2 - Admin verification queue not auto-refreshing

- Steps
  1. Open `/admin/verification`
  2. Approve or reject a request
  3. Return to queue within 60 seconds
- Expected
  - Queue reflects updated status on return (no manual refresh)
- Status: NOT RUN

### Bug 3 - Selection highlight flicker during multi-slot selection

- Steps
  1. In Availability Studio day view, click a start slot
  2. Move to another slot and click to end selection
- Expected
  - Highlight persists between clicks; no flicker
- Status: NOT RUN

### Bug 4 - Mobile single tap does not open Create Block

- Steps (mobile viewport or device)
  1. Tap a single time slot
- Expected
  - A bottom "Create block" hint appears; tapping it opens the Create Block drawer
- Status: NOT RUN

### Bug 5 - Week header cut off on mobile

- Steps (mobile viewport)
  1. Open Availability Studio
  2. Check header row containing week label and Today button
- Expected
  - Week label truncates; Today button fully visible and tappable
- Status: NOT RUN

### Bug 6 - Schedule page time picker cut off on mobile Chrome

- Steps (Android Chrome)
  1. Open Schedule & Pricing page
  2. Tap a time input
- Expected
  - Native time picker is fully visible; Save button not clipped
- Status: NOT RUN

### Bug 7 - Text overflow in 1-hour reservation blocks

- Steps
  1. Locate a 1-hour reservation in the timeline
- Expected
  - Compact rendering (no overflow); content stays inside block
- Status: NOT RUN

### Bug 8 - Courts list shows 0/0 slots

- Steps
  1. Open owner courts list page
- Expected
  - Slot count shows `—` when no real data is available
- Status: NOT RUN

### Enhancement 3 - Reservation blocks navigate to detail

- Steps
  1. Click a reservation block in Availability Studio
- Expected
  - Navigates to `/owner/reservations/[reservationId]`
- Status: NOT RUN

## Notes

- Manual checks require owner/admin accounts and a mobile device or emulator.
- If any FAIL occurs, capture steps + screenshots and append here.
