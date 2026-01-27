# Owner Setup Hub Stepper v2

Status: draft

## Problem

From the setup hub (`/owner/get-started`), creating a venue currently redirects directly to verification (`/owner/verify/:placeId`). This is an implicit/legacy flow that breaks the hub-led checklist experience.

We want onboarding to be hub-centric: each step is explicit as a card, and after completing a step the user returns to `/owner/get-started`.

## Goals

- Make venue verification an explicit step (card) in the setup hub.
- Standardize onboarding navigation: `click card -> complete step -> return to /owner/get-started`.
- Update setup hub card order:

```text
1. CreateOrgCard
2a. AddVenueCard
2b. ClaimListingCard
3. VerifyVenueCard
4a. ConfigureVenueCourtsCard
4b. ImportBookingsCard
```

## Non-goals

- Changing verification requirements or bookability rules.
- Changing claim/transfer admin review behavior.
- Backend/schema changes (should use existing tRPC endpoints).

## Current vs Desired Redirects

```text
Current (hub add venue):
  /owner/get-started -> /owner/venues/new?from=setup
  success -> /owner/verify/:placeId

Desired:
  /owner/get-started -> /owner/venues/new?from=setup
  success -> /owner/get-started
```

## Acceptance Criteria

- Add venue from setup hub returns to `/owner/get-started` after successful venue creation.
- Setup hub shows a Step 3 verification card once a venue exists, and it routes to `/owner/verify/:placeId`.
- Completing verification submission returns to `/owner/get-started` and updates status (PENDING/VERIFIED).
- Setup hub shows a Step 4 courts setup card once a venue exists, and completion is tracked (at least one active court).
- Import bookings remains available as Step 4B (requires venue) and is not presented as Step 3.

## References

- Change request: `docs/owner-onboarding-revamp/92-stepper-v2-change-2026-01-27.md`
- Existing hub: `src/app/(auth)/owner/get-started/page.tsx`
- Venue create redirect logic: `src/app/(owner)/owner/places/new/page.tsx`
