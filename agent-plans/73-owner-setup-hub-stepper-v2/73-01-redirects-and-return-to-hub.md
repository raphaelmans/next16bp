# Stepper v2: Redirects + Return-To Contract

## Principle

Every onboarding step initiated from `/owner/get-started` should return to `/owner/get-started` on success.

## Proposed Contract

- Use a single query param to indicate “setup hub context”, e.g. `from=setup`.
- For multi-page flows, add a `returnTo` param when needed.

Examples:

```text
Add venue CTA:
  /owner/venues/new?from=setup

Verify venue CTA:
  /owner/verify/:placeId?from=setup

Configure courts CTA:
  /owner/venues/:placeId/courts/setup?from=setup

Import bookings CTA:
  /owner/import/bookings?from=setup
```

## Redirect Rules (Desired)

```text
/owner/venues/new
  if from=setup:
    onSuccess -> /owner/get-started
  else:
    onSuccess -> /owner/venues/:placeId/courts/new (existing behavior)

/owner/verify/:placeId
  if from=setup:
    onSubmitSuccess -> /owner/get-started

/owner/venues/:placeId/courts/setup
  if from=setup:
    define “done” and provide an explicit “Back to setup hub” end-state CTA

/owner/import/bookings (+ review pages)
  if from=setup:
    provide a clear path back to /owner/get-started (at least after commit/discard)
```

## Open Questions

- What counts as “done” for court setup in onboarding (first court created vs schedule/pricing configured vs availability reviewed)?
- For imports: should “return to hub” happen after upload (draft) or after commit/discard?
