# [00-77] Owner Onboarding Verification

> Date: 2026-01-21
> Previous: 00-76-payment-proof-owner-query.md

## Summary

Implemented the new onboarding path that routes place creation to a one-time court creation page and then to place verification. Added supporting user stories and implementation plans for the new flow.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/shared/lib/app-routes.ts` | Added route helper for `/owner/places/{placeId}/courts/new`. |
| `src/app/(owner)/owner/places/new/page.tsx` | Redirect place creation to the one-time court page. |
| `src/app/(owner)/owner/places/[placeId]/courts/new/page.tsx` | Implemented court-only onboarding page with locked place, cancel routing, and verification redirect. |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/context.md` | Logged new user story + plan and added plan index entry. |
| `agent-plans/user-stories/02-court-creation/02-00-overview.md` | Added US-02-08 to the court creation index. |
| `agent-plans/user-stories/02-court-creation/02-08-owner-onboards-place-one-time-court.md` | Added user story for the one-time court creation onboarding flow. |
| `agent-plans/48-owner-onboarding-court-verification/48-00-overview.md` | Added master plan for the onboarding flow change. |
| `agent-plans/48-owner-onboarding-court-verification/48-01-onboarding-routing-and-page.md` | Added Phase 1 implementation plan. |
| `agent-plans/48-owner-onboarding-court-verification/48-02-qa.md` | Added QA checklist for the onboarding flow. |

## Key Decisions

- Route new place creation to a court-only page to avoid forcing schedule/pricing/slot setup during onboarding.
- Always redirect to `/owner/verify/{placeId}` after court creation to make verification the next explicit step.
- Keep the existing wizard flow untouched for later setup and avoid regression risk.

## Next Steps

- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build` (optional: `TZ=UTC pnpm build`).

## Commands to Continue

```bash
pnpm lint
pnpm build
```
