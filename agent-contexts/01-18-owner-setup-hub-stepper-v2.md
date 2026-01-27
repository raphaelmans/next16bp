# [01-18] Owner Setup Hub Stepper v2

> Date: 2026-01-27
> Previous: 01-17-testing-report-fixes.md

## Summary

Implemented the Stepper v2 hub-centric onboarding flow so setup actions return to `/owner/get-started`, added explicit verification and courts setup cards, and wired `from=setup` return paths for verification, courts, and bookings import.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(auth)/owner/get-started/page.tsx` | Added Verify + Configure Courts cards, step completion logic, and `from=setup` routing for verify/courts/import actions. |
| `src/app/(owner)/owner/places/new/page.tsx` | Redirect to setup hub when `from=setup` after venue creation. |
| `src/app/(owner)/owner/verify/[placeId]/page.tsx` | Read `from=setup` and pass return target to verification panel. |
| `src/features/owner/components/place-verification-panel.tsx` | Support `returnTo` to route back to hub after submit. |
| `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx` | Allow returning to setup hub when `from=setup`, even if schedule/pricing not finished. |
| `src/app/(owner)/owner/import/bookings/page.tsx` | Preserve `from=setup` into review route. |
| `src/app/(owner)/owner/import/bookings/[jobId]/page.tsx` | Return to hub on commit/discard/back when `from=setup`. |

### Documentation

| File | Change |
|------|--------|
| `docs/court-owner-onboarding/00-overview.md` | Added Stepper v2 change summary and updated flow notes. |
| `docs/court-owner-onboarding/01-organization.md` | Updated hub-first org flow and fallback onboarding notes. |
| `docs/court-owner-onboarding/02-venue.md` | Documented setup-hub add-venue path and planned redirect. |
| `docs/court-owner-onboarding/03-courts.md` | Added note on hub “Configure courts” step. |
| `docs/owner-onboarding-revamp/00-overview.md` | Updated goals and hub steps for Stepper v2. |
| `docs/owner-onboarding-revamp/03-owner-setup-hub.md` | Reordered cards and updated post-create redirect behavior. |
| `docs/owner-onboarding-revamp/92-stepper-v2-change-2026-01-27.md` | Captured change request. |
| `docs/owner-onboarding-revamp/92-smoke-checklist-2026-01-27.md` | Added Stepper v2 smoke checklist. |
| `agent-plans/72-owner-onboarding-revamp/72-03-owner-setup-hub.md` | Marked Stepper v2 superseding notes. |
| `agent-plans/72-owner-onboarding-revamp/72-06-setup-hub-add-venue-redirect.md` | Marked legacy behavior and referenced Stepper v2 plan. |
| `agent-plans/73-owner-setup-hub-stepper-v2/73-00-overview.md` | New implementation plan for Stepper v2. |
| `agent-plans/73-owner-setup-hub-stepper-v2/73-01-redirects-and-return-to-hub.md` | Redirect contract plan. |
| `agent-plans/73-owner-setup-hub-stepper-v2/73-02-setup-hub-cards-and-gating.md` | Cards, data needs, and gating rules. |
| `agent-plans/73-owner-setup-hub-stepper-v2/73-03-qa.md` | QA checklist. |
| `agent-plans/73-owner-setup-hub-stepper-v2/73-99-deferred.md` | Deferred items list. |
| `agent-plans/context.md` | Logged new Stepper v2 plan. |

## Key Decisions

- `from=setup` now returns owners to `/owner/get-started` instead of auto-sending them to verification, making verification an explicit step.
- Primary venue for the hub is the newest created venue to drive Step 3/4 actions.
- Courts setup should allow exiting back to the hub even if schedule/pricing is incomplete when initiated from the hub.

## Next Steps (if applicable)

- [ ] Run `pnpm lint`.
- [ ] Smoke test Stepper v2 flow (hub add venue -> verify -> courts -> import -> back to hub).

## Commands to Continue

```bash
pnpm lint
```
