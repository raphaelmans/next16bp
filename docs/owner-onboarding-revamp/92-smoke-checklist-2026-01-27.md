# Smoke Checklist: Setup Hub Stepper v2 (2026-01-27)

## Entry Points

- Visit `/owners/get-started` while logged out
  - CTA routes to `/register/owner?redirect=/owner/get-started`
- After signup, land on `/owner/get-started`

## Hub Stepper

- Step 1: Create organization
  - Completing org creation updates the hub state (no hard reload required)

- Step 2: Venue
  - Add venue CTA opens in-hub `AddVenueSheet` with `PlaceForm`
  - Submitting venue creation closes the sheet and refreshes setup status on `/owner/get-started`
  - Claim listing flow remains in-hub and shows pending state

- Step 3: Verify venue
  - Verify CTA opens in-hub `VerifyVenueSheet`
  - Submitting verification closes sheet and updates state to PENDING on the hub

- Step 4: Go live
  - Configure courts CTA opens in-hub `ConfigureCourtsSheet`
  - Import bookings CTA opens in-hub `ImportBookingsSheet` (review is in-sheet)
