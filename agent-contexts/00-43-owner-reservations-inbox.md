# [00-43] Owner Reservations Inbox UX

> Date: 2026-01-14
> Previous: 00-42-my-reservations-tabs.md

## Summary

Reworked the owner reservations page into an inbox-first workflow with per-tab panels for accessibility, slot-time filtering for upcoming/past, and pending sub-filters to speed triage.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(owner)/owner/reservations/page.tsx` | Added inbox tab config, per-tab `TabsContent`, pending filter chips, and slot-time filtering logic with counts. |
| `src/features/owner/hooks/use-owner-reservations.ts` | Added `slotStartTime`/`slotEndTime` fields for owner filtering. |
| `src/features/reservation/components/reservation-tabs.tsx` | Forced mount of tab panels for accessibility consistency. |

### Planning Docs

| File | Change |
|------|--------|
| `agent-plans/31-owner-reservations-inbox/31-00-overview.md` | Added owner reservations inbox plan overview. |
| `agent-plans/31-owner-reservations-inbox/31-01-owner-tabs-accessibility.md` | Documented tab panel + a11y plan. |
| `agent-plans/31-owner-reservations-inbox/31-02-owner-inbox-filters.md` | Documented inbox filter rules. |
| `agent-plans/context.md` | Logged plan entry + changelog update. |

## Key Decisions

- Default tab remains Inbox (pending) to align with triage workflow.
- Upcoming uses slot end >= now; past uses CONFIRMED with slot end < now.
- Counts derived from filtered list so they match search/date filters.

## Next Steps

- [ ] Decide whether to resolve existing Biome lint warnings in unrelated files.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
