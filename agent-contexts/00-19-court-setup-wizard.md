# [00-19] Court Setup Wizard + Copy Config

> Date: 2026-01-12
> Previous: 00-18-owner-slot-prereqs.md

## Summary

Added a unified court setup wizard with stepper navigation and introduced copy-from-court flows for hours and pricing (same organization, replace-only, currency preserved).

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/setup/page.tsx` | New stepper wizard with forced save, hours/pricing steps, and publish actions. |
| `src/features/owner/components/courts-table.tsx` | Row click now opens setup wizard; actions menu includes Setup Wizard link. |
| `src/features/owner/components/court-hours-editor.tsx` | Extracted hours editor with copy dialog support. |
| `src/features/owner/components/court-pricing-editor.tsx` | Extracted pricing editor with copy dialog support. |
| `src/features/owner/components/court-config-copy-dialog.tsx` | New dialog for selecting source court. |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/hours/page.tsx` | Refactored to use `CourtHoursEditor`. |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/pricing/page.tsx` | Refactored to use `CourtPricingEditor`. |
| `src/features/owner/components/court-form.tsx` | Added state callback and wizard-friendly controls. |
| `src/shared/lib/app-routes.ts` | Added `setup` route helper. |
| `src/modules/court/errors/court.errors.ts` | Added org mismatch error for copy operations. |
| `src/modules/court-hours/*` | Added copy DTO, router procedure, and service logic. |
| `src/modules/court-rate-rule/*` | Added copy DTO, router procedure, and service logic. |
| `src/features/owner/hooks/use-court-hours.ts` | Added `useCopyCourtHours`. |
| `src/features/owner/hooks/use-court-rate-rules.ts` | Added `useCopyCourtRateRules`. |

### Planning Docs

| File | Change |
|------|--------|
| `agent-plans/user-stories/14-place-court-migration/14-14-owner-uses-court-setup-wizard.md` | New story for wizard UX. |
| `agent-plans/user-stories/14-place-court-migration/14-15-owner-copies-hours-and-pricing-from-another-court.md` | New story for copy flow. |
| `agent-plans/user-stories/checkpoint-06.md` | Checkpoint for new stories. |
| `agent-plans/14-place-court-migration/14-07-court-setup-wizard.md` | Addendum plan for wizard + copy. |
| `agent-plans/user-stories/14-place-court-migration/14-00-overview.md` | Updated story index summary. |
| `agent-plans/14-place-court-migration/14-00-overview.md` | Added phase 3D module reference. |

## Key Decisions

- Court setup should be a stepper wizard with forced save on Details.
- Copy operations are limited to courts in the same organization.
- Pricing copy preserves currency exactly as configured.

## Next Steps

- [ ] Consider adding a timezone warning when copying between places.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
