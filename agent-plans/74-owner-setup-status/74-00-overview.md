# Owner Setup Status API + Dashboard CTA

Status: draft

## Problem

Owner-facing pages independently infer "is this user an owner" and setup progress by stitching together multiple queries. This makes onboarding state inconsistent across UI surfaces and complicates adding a clear "Get Started" recovery CTA for owners who drop off mid-setup.

## Goals

- Centralize owner setup status and ownership validation in a single backend use-case + API endpoint.
- Reuse the same status in `/owner/get-started` and `/owner` dashboard.
- Surface a "Get started" CTA on the owner dashboard when required setup steps are incomplete.

## Non-goals

- Changing the onboarding step definitions or redirect contract.
- Modifying verification or booking eligibility rules.
- Replacing owner route layout authorization checks.

## References

- Change request: `docs/owner-onboarding-revamp/92-stepper-v2-change-2026-01-27.md`
- Setup hub UI: `src/app/(auth)/owner/get-started/page.tsx`
- Owner dashboard: `src/app/(owner)/owner/page.tsx`
- Design system: `business-contexts/kudoscourts-design-system.md`
- User stories: `agent-plans/user-stories/04-owner-dashboard/04-01-owner-views-real-data.md`
- User stories: `agent-plans/user-stories/01-organization/01-01-owner-registers-organization.md`

## Phases

1. **Owner setup status API**: Add use-case + tRPC endpoint for centralized status.
2. **Client adoption**: Replace local inference in setup hub and add dashboard CTA.

## Workstreams

### Shared / Contract

- [ ] Define `OwnerSetupStatus` response shape + `nextStep` enum.
- [ ] Document `ownerSetup.getStatus` (protected, no input).

### Server / Backend

- [ ] Create `owner-setup` module with use-case returning status.
- [ ] Add `ownerSetup` router and wire into `appRouter`.

### Client / Frontend

- [ ] Add `useOwnerSetupStatus` hook for the new endpoint.
- [ ] Refactor `/owner/get-started` to use centralized status.
- [ ] Add dashboard "Get started" CTA when setup is incomplete.

## Success Criteria

- `/owner/get-started` renders all steps from the centralized status endpoint.
- `/owner` dashboard shows a CTA when setup is incomplete and hides it when complete.
- All owner setup progress checks use the same API response shape.
