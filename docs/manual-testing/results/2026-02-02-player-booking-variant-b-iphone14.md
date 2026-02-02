# Player Books a Reservation — Variant B (iPhone 14)

**Date**: 2026-02-02
**Device**: iPhone 14 (390x844)
**User**: raphaelmans00+10@gmail.com
**Venue**: ACabellon Pickle Court — Court Kash

## Results

| # | Step | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 1 | Open `/courts` | Search page with cards, filters, map/list toggle | 158 courts loaded, stacked cards, filter icon + list/map toggle | PASS |
| 2 | Browse venues | Cards show name, location, sport icons | Cards render vertically with name, badge, city, sport, pricing | PASS |
| 3 | Click venue card | Venue detail page loads | `/venues/acabellon-pickle-court` — mobile layout with bottom "Check Availability" bar | PASS |
| 4 | Select time slot | Available slots highlighted, booking summary populated | Tapped Tue, selected 7-9 AM; bottom bar shows "Tue, Feb 3 · 7:00 AM-9:00 AM · ₱500.00" | PASS |
| 5 | Click "Continue to review" | Booking review page loads directly (no auth redirect) | Navigated to `/venues/acabellon-pickle-court/book?...` with all params | PASS |
| 6-7 | Profile card | Profile shows complete (filled in desktop run) | Card shows "QA Test Player", phone 09171234567, no warning | PASS |
| 8 | Accept terms + Confirm Booking | Reservation created, redirected to confirmation | `/reservations/3de045d3-b478-412f-8e77-f227780843be` — status "Processing" | PASS |

## Edge Cases Verified

- [x] No auth redirect (user already logged in)
- [x] Booking params preserved through entire flow
- [x] "Confirm Booking" disabled when terms unchecked, enabled after checking
- [x] Profile already complete — no incomplete warning shown

## Mobile-Specific Observations

- Venue detail uses a collapsible bottom sheet for availability instead of sidebar grid
- Time slots listed vertically (not a week grid) — better for touch targets
- Day picker is a horizontal row of circles (S M T W T F S)
- "Check Availability" and "Reserve" sticky at bottom of viewport
- All layouts responsive, no horizontal overflow or clipping issues
- "Tap and hold to select" instruction shown for time selection

## Booking Created

- **Booking ID**: `3de045d3-b478-412f-8e77-f227780843be`
- **Court**: Court Kash (Pickleball)
- **Date**: Tuesday, February 3, 2026
- **Time**: 7:00 AM - 9:00 AM
- **Price**: ₱500.00
- **Status**: Processing
