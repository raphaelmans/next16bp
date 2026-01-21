# [00-84] Public Schedule Month View

> Date: 2026-01-21
> Previous: 00-83-multisport-copy.md

## Summary

Added backend range availability endpoints and implemented a month-first public schedule view that lists all available start times across the month, while preserving the day view workflow.

## Changes Made

### Backend

| File | Change |
|------|--------|
| `src/modules/availability/dtos/availability.dto.ts` | Added range DTOs with validation and 45-day cap. |
| `src/modules/availability/availability.router.ts` | Added range availability queries. |
| `src/modules/availability/services/availability.service.ts` | Implemented range availability logic for courts + place/sport. |

### Frontend

| File | Change |
|------|--------|
| `src/app/(public)/courts/[id]/schedule/page.tsx` | Added month/day toggle, month calendar + day list, and range query wiring. |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/54-public-schedule-month-view/54-00-overview.md` | Created master plan. |
| `agent-plans/54-public-schedule-month-view/54-01-backend-range-availability.md` | Added backend plan details. |
| `agent-plans/54-public-schedule-month-view/54-02-frontend-month-view.md` | Added frontend plan details + QA. |
| `agent-plans/54-public-schedule-month-view/public-schedule-month-view-dev1-checklist.md` | Added dev checklist. |
| `agent-plans/context.md` | Logged new plan entry. |

## Key Decisions

- Default to month view with `view=month` and shareable `month=YYYY-MM`.
- Clamp month browsing to current month onward in venue time zone.
- Range availability requests capped at 45 days to avoid oversized queries.

## Next Steps (if applicable)

- [ ] Run `pnpm lint`.
- [ ] Run `TZ=UTC pnpm build`.
- [ ] Manual QA: month view selection, booking flow, and past-date restrictions.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
