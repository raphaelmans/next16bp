# [00-26] Schedule Pricing Merge

> Date: 2026-01-13
> Previous: 00-25-owner-onboarding-redirects.md

## Summary

Merged court hours + pricing into a single schedule experience with day-level collapsible rows, added the canonical schedule route, and updated setup/slot flows to point to the combined configuration.

## Changes Made

### UX + Implementation

| File | Change |
|------|--------|
| `src/features/owner/components/court-schedule-editor.tsx` | Replaced day toggle with collapsible day rows, added per-day actions, moved save button to the bottom, and surfaced day summary badges. |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/schedule/page.tsx` | Added the Schedule & Pricing page for courts. |
| `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx` | Compressed wizard to 3 steps (Details → Schedule → Publish) and switched schedule configuration to the new editor. |
| `src/app/(owner)/owner/courts/setup/page.tsx` | Redirected post-create step to `schedule`. |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/hours/page.tsx` | Redirects legacy hours page to schedule. |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/pricing/page.tsx` | Redirects legacy pricing page to schedule. |
| `src/features/owner/components/courts-table.tsx` | Replaced hours/pricing menu items with Schedule & Pricing. |
| `src/features/owner/components/bulk-slot-modal.tsx` | Updated prerequisite messaging and link to schedule page. |
| `src/app/(owner)/owner/courts/[id]/slots/page.tsx` | Updated schedule link usage and pricing warning copy. |
| `src/shared/lib/app-routes.ts` | Added schedule route helper. |
| `src/features/owner/components/index.ts` | Exported `CourtScheduleEditor`. |

## Key Decisions

- Switched to collapsible day rows (full day names) to reduce cognitive load and allow scanning per day.
- Made the schedule page the canonical destination and redirected hours/pricing legacy routes.
- Moved the primary Save action to the bottom for better mobile ergonomics.

## Next Steps (if applicable)

- [ ] Run `TZ=UTC pnpm build` if you want a post-change production check.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
