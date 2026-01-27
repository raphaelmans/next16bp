# Owner Setup Hub Stepper v2 (Change Request - 2026-01-27)

## Problem

The current setup hub flow auto-redirects a new owner into verification immediately after venue creation (`/owner/venues/new?from=setup` -> `/owner/verify/:placeId`). This is a legacy/implicit step.

We want a consistent hub-led experience where each onboarding step is explicit and the user always returns to `/owner/get-started` after completing a step.

## Decision (Desired Behavior)

Every onboarding step should:

```text
click card CTA -> complete the step -> return to /owner/get-started
```

Key redirect change:

```text
/owner/venues/new?from=setup
  today:    success -> /owner/verify/:placeId
  desired:  success -> /owner/get-started
```

## Updated Setup Hub Cards

```text
1. CreateOrgCard (required)

2. Venue step (complete if venue exists OR claim pending)
   2a. AddVenueCard
   2b. ClaimListingCard

3. VerifyVenueCard (requires venue)

4. Go live (requires venue)
   4a. ConfigureVenueCourtsCard
   4b. ImportBookingsCard
```

## Notes

- Consideration: AddVenueCard + ClaimListingCard could be merged into a single "Add or claim venue" card with two CTAs.
- Verification is still required for bookability; this change only makes it an explicit step in the hub.
