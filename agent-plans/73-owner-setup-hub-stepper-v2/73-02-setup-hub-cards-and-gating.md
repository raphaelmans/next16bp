# Stepper v2: Setup Hub Cards + Gating

## Data Needed On Hub

- Org state: `trpc.organization.my`
- Venue state: `trpc.placeManagement.list({ organizationId })`
  - derive: hasVenue, selectedVenueId, verification status, reservationsEnabled
- Claim state: `trpc.claimRequest.getMy`
  - derive: hasPendingClaim
- Court state (for selected venue): `trpc.courtManagement.listByPlace({ placeId })`
  - derive: hasAnyActiveCourt

## Card Order (Target)

```text
1) CreateOrgCard
2a) AddVenueCard
2b) ClaimListingCard
3) VerifyVenueCard
4a) ConfigureVenueCourtsCard
4b) ImportBookingsCard
```

## Gating Rules (Suggested)

- Step 1 complete: organization exists
- Step 2 complete: venue exists OR claim is pending
  - Step 3/4 should still require a venue (claim pending is not a venue yet)
- Step 3 complete: verification is PENDING or VERIFIED
- Step 4A complete: at least one active court exists for the selected venue
- Step 4B is optional but requires a venue

## UX Notes

- Consider merging AddVenueCard + ClaimListingCard into a single “Add or claim venue” card with two CTAs (optional; defer unless requested).
- Prefer explicit CTAs:
  - “Add venue”
  - “Claim existing listing”
  - “Get your venue verified”
  - “Set up courts”
  - “Import bookings”
