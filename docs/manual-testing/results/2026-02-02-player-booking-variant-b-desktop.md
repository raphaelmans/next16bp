# Player Books a Reservation — Variant B (Desktop)

**Date**: 2026-02-02
**Viewport**: Desktop (1280x720)
**User**: raphaelmans00+10@gmail.com
**Venue**: ACabellon Pickle Court — Court Kash

## Results

| # | Step | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 1 | Open `/courts` | Search page with cards, filters, map/list toggle | 162 courts loaded, filters (amenities, province, city, sport) + list/map toggle visible | PASS |
| 2 | Browse venues | Cards show name, location, sport icons | Cards display venue name, verified badge, city, area, sport tag, pricing | PASS |
| 3 | Click venue card | Venue detail page loads | `/venues/acabellon-pickle-court` — photo, court list, amenities, booking sidebar | PASS |
| 4 | Select time slot | Available slots highlighted, booking summary populated | Selected Tue 9-11 AM; summary shows Court Kash, 2h, ₱500.00 | PASS |
| 5 | Click "Continue to review" | Booking review page loads directly (no auth redirect) | Navigated to `/venues/acabellon-pickle-court/book?...` with all params | PASS |
| 6 | Profile incomplete — click "Edit" | Profile form loads with redirect param | `/account/profile?redirect={encoded_booking_url}` — redirect param preserved | PASS |
| 7 | Fill profile and save | Redirected back to review; profile card shows complete | Redirected back with all booking params; card shows "QA Test Player" + 09171234567 | PASS |
| 8 | Accept terms + Confirm Booking | Reservation created, redirected to confirmation | Reservation Details page — status "Processing", booking ID assigned | PASS |

## Edge Cases Verified

- [x] No auth redirect (user already logged in)
- [x] Booking params survived the profile-edit round-trip (step 5 → 6 → 7)
- [x] "Confirm Booking" disabled when terms unchecked, enabled after checking
- [x] Profile incomplete warning disappeared after completing profile

## Booking Created

- **Booking ID**: `f3b4ea3f-5745-4c12-b5...`
- **Court**: Court Kash (Pickleball)
- **Date**: Tuesday, February 3, 2026
- **Time**: 9:00 AM - 11:00 AM
- **Price**: ₱500.00
- **Status**: Processing
