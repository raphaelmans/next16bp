# [01-82] Owner Setup Court Readiness

> Date: 2026-02-11
> Previous: 01-81-place-detail-composition-pass.md

## Summary

Updated owner onboarding readiness so "Courts configured" requires booking-ready court data (both schedule hours and pricing), not only active court existence. The setup hub now shows a clear partial state with targeted actions when courts are active but still missing required configuration.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/lib/modules/owner-setup/dtos/owner-setup-status.dto.ts` | Extended `OwnerSetupStatus` with readiness-specific fields: `hasReadyCourt`, `readyCourtId`, `hasCourtSchedule`, and `hasCourtPricing`. |
| `src/lib/modules/owner-setup/factories/owner-setup.factory.ts` | Wired `court-hours` and `court-rate-rule` repositories into `GetOwnerSetupStatusUseCase` construction. |
| `src/lib/modules/owner-setup/use-cases/get-owner-setup-status.use-case.ts` | Added active-court readiness evaluation using hours and pricing by court ID; changed completion + next-step gates to use `hasReadyCourt`; returned new readiness metadata. |
| `src/app/(auth)/owner/get-started/page.tsx` | Switched courts/go-live completion UI to `hasReadyCourt`; added partial "action needed" state for missing schedule/pricing; used `readyCourtId` fallback logic for availability deep-link. |

### Planning

| File | Change |
|------|--------|
| `.opencode/plans/1770738251855-silent-panda.md` | Captured root cause, implementation plan, and verification scenarios for the owner setup readiness fix. |

## Key Decisions

- Kept `hasActiveCourt` as a separate signal and introduced `hasReadyCourt` to avoid breaking existing logic that still needs active-court visibility.
- Enforced same-court readiness (hours and pricing on one active court) before marking courts complete.
- Added a dedicated partial state in the setup hub to communicate what is missing instead of showing a false complete badge.

## Next Steps (if applicable)

- [ ] Run `pnpm lint` to validate type + style integrity.
- [ ] Manually verify owner setup flow across: no schedule, no pricing, and fully ready court cases.
- [ ] Confirm dashboard/sidebar setup CTA behavior now tracks the stricter readiness gate via `isSetupComplete`.

## Commands to Continue

```bash
git status --short
pnpm lint
pnpm dev
```
