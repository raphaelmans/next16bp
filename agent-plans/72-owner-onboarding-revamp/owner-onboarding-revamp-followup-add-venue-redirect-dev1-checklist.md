# Owner Onboarding Revamp - Follow-up (Add Venue Redirect) - Dev1 Checklist

Goal: from `/owner/get-started`, venue creation should go to verification.

## Shared / Contract

- [x] Confirm the query param name: `from=setup` (recommended).

## Server / Backend

- [x] N/A (no backend changes)

## Client / Frontend

- [x] Update setup hub "Add venue" CTA to include the query param.
  - File: `src/app/(auth)/owner/get-started/page.tsx`
  - Expected navigation: `/owner/places/new?from=setup`

- [x] Update venue create page to branch redirect on `from=setup`.
  - File: `src/app/(owner)/owner/places/new/page.tsx`
  - Behavior:

```text
if from=setup:
  onSuccess(placeId) -> /owner/verify/:placeId
else:
  onSuccess(placeId) -> current behavior (first court creation)
```

## QA

- [x] `pnpm lint`
- [x] `pnpm build`
- [ ] Manual smoke:
  - `/owners/get-started` -> sign up -> `/owner/get-started` -> Add venue -> create venue -> lands on `/owner/verify/:placeId`
  - Existing path: `/owner/venues/new` -> create venue -> still lands on first-court creation
