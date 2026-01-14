# [00-42] My Reservations Tabs Fix

> Date: 2026-01-14
> Previous: 00-41-payment-method-reminders.md

## Summary

Updated the player "My Reservations" experience to filter Upcoming/Past/Cancelled by reserved slot time, fixed Radix Tabs panel wiring for valid `aria-controls`, and aligned the home upcoming list with the same slot-based timing.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/reservation/hooks/use-my-reservations.ts` | Switched to `getMyWithDetails`, added slot-time filtering, sorting, and updated tab counts. |
| `src/features/reservation/components/reservation-tabs.tsx` | Embedded tab panels and added accessible tab labels with counts. |
| `src/features/reservation/components/reservation-list.tsx` | Accepts tab props and only fetches/render active panel data. |
| `src/app/(auth)/reservations/page.tsx` | Consolidated list rendering under tabs. |
| `src/features/home/hooks/use-home-data.ts` | Fetches `getMyWithDetails` for upcoming list data. |
| `src/app/(auth)/home/page.tsx` | Filters and maps upcoming reservations by slot time. |

### Planning Docs

| File | Change |
|------|--------|
| `agent-plans/user-stories/06-court-reservation/06-04-player-views-my-reservations-tabs.md` | Added user story for tab filtering + accessibility. |
| `agent-plans/user-stories/06-court-reservation/06-00-overview.md` | Updated story index counts. |
| `agent-plans/29-my-reservations-tabs/29-00-overview.md` | Added implementation plan overview. |
| `agent-plans/29-my-reservations-tabs/29-01-backend-my-reservations-details.md` | Backend plan for slot details. |
| `agent-plans/29-my-reservations-tabs/29-02-ui-tabs-filtering-accessibility.md` | UI plan for tabs + filtering. |
| `agent-plans/29-my-reservations-tabs/my-reservations-tabs-dev1-checklist.md` | Added dev checklist. |
| `agent-plans/context.md` | Logged new story/plan in changelog + plan list. |

## Key Decisions

- Upcoming uses `slotEndTime >= now` to include in-progress reservations.
- Past uses `status=CONFIRMED` and `slotEndTime < now` to avoid mixing cancelled items.
- Kept `reservation.getMy` intact while using `getMyWithDetails` for list UI.

## Next Steps

- [ ] Decide whether to resolve existing Biome lint warnings in unrelated files.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
