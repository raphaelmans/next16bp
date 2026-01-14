# [00-41] Payment Method Reminders

> Date: 2026-01-14
> Previous: 00-40-place-photo-order-validation.md

## Summary

Added owner-facing reminders to configure payment methods during place creation and on owner reservations, plus stable settings section anchors for deep links.

## Changes Made

### Planning

| File | Change |
| --- | --- |
| `agent-plans/user-stories/15-organization-payment-methods/15-00-overview.md` | Added US-15-06 to story index and counts. |
| `agent-plans/user-stories/15-organization-payment-methods/15-06-owner-payment-method-reminders.md` | New story for reminder placements. |
| `agent-plans/28-payment-method-reminders/28-00-overview.md` | New master plan for reminders. |
| `agent-plans/28-payment-method-reminders/28-01-owner-reminder-ui.md` | Phase plan for reminders + settings anchors. |

### UI

| File | Change |
| --- | --- |
| `src/shared/lib/section-hashes.ts` | Added settings section hash constants. |
| `src/features/owner/components/payment-method-reminder-card.tsx` | Added reusable reminder card component. |
| `src/features/owner/components/owner-payment-method-reminder.tsx` | Added owner reservations reminder component. |
| `src/features/owner/components/index.ts` | Exported reminder components. |
| `src/app/(owner)/owner/places/new/page.tsx` | Added reminder card for missing methods. |
| `src/app/(auth)/reservations/page.tsx` | Added owner reminder above tabs. |
| `src/app/(owner)/owner/settings/page.tsx` | Added section ids for payment methods and danger zone. |

## Key Decisions

- Use hash anchors for settings deep links (`#payment-methods`) for simple navigation.
- Show reminders only when zero methods and hide on query errors.

## Next Steps (if applicable)

- [ ] Confirm settings sections are labeled as intended for hashes.
- [ ] Run `pnpm lint` or `pnpm build` if needed.

## Commands to Continue

```bash
pnpm lint
```
