# Smoke Checklist: Setup Hub Stepper v2 (2026-01-27)

## Entry Points

- Visit `/owners/get-started` while logged out
  - CTA routes to `/register/owner?redirect=/owner/get-started`
- After signup, land on `/owner/get-started`

## Hub Stepper

- Step 1: Create organization
  - Completing org creation updates the hub state (no hard reload required)

- Step 2: Venue
  - Add venue CTA routes to `/owner/venues/new?from=setup`
  - Submitting venue creation returns to `/owner/get-started`
  - Claim listing flow remains in-hub and shows pending state

- Step 3: Verify venue
  - Verify CTA routes to `/owner/verify/:placeId?from=setup`
  - Submitting verification returns to `/owner/get-started` and shows PENDING state

- Step 4: Go live
  - Configure courts CTA routes to `/owner/venues/:placeId/courts/setup?from=setup`
  - Import bookings CTA routes to `/owner/import/bookings?from=setup`
