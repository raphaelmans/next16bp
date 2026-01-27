# Follow-up: Setup Hub "Add Venue" Redirects To Verification

Status: implemented

Update (2026-01-27): this redirect is now considered legacy.

New desired behavior is hub-centric onboarding:

```text
/owner/venues/new?from=setup
  success -> /owner/get-started
```

Verification becomes an explicit step/card on the hub.

References:
- Change request: `docs/owner-onboarding-revamp/92-stepper-v2-change-2026-01-27.md`
- New plan: `agent-plans/73-owner-setup-hub-stepper-v2/73-00-overview.md`

## Problem

Before this fix, from the owner setup hub (`/owner/get-started`), clicking "Add venue" routed into the existing venue create page, which on success redirected to first-court creation.

Desired onboarding behavior:
- When the venue is created from the setup hub, redirect to verification submission: `/owner/verify/:placeId`.
- When the venue is created from the regular owner dashboard flow, keep the current redirect to first-court creation.

## Proposed Approach (Minimal / Backwards-Safe)

Use an explicit query param to signal the "setup hub" flow.

```text
/owner/get-started
  Add venue CTA -> /owner/places/new?from=setup

/owner/places/new
  onSuccess(placeId):
    if from=setup -> /owner/verify/:placeId
    else          -> /owner/places/:placeId/courts/new
```

Notes:
- Keep this logic local to `src/app/(owner)/owner/places/new/page.tsx`.
- Avoid changing `PlaceManagementService.createPlace` behavior.
- Do not change the existing owner flow by default.

## Shared / Contract

- Query param: `from=setup` (string)
- Only affects redirect behavior after successful venue creation.

## Server / Backend

- [x] N/A (no API changes)

## Client / Frontend

- [x] Update setup hub Add Venue CTA:
  - `src/app/(auth)/owner/get-started/page.tsx` should route to `appRoutes.owner.places.new` with `?from=setup`.
- [x] Update venue create page redirect behavior:
  - `src/app/(owner)/owner/places/new/page.tsx` should read query param and choose redirect:

```text
from=setup -> /owner/verify/:placeId
default    -> existing redirect (first court)
```

## Acceptance Criteria

- [x] From `/owner/get-started`, creating a new venue redirects to `/owner/verify/:placeId`.
- [x] Creating a venue from the existing owner dashboard flow continues to redirect to first-court creation.
- [ ] Manual smoke: hub -> add venue -> verify page loads.
