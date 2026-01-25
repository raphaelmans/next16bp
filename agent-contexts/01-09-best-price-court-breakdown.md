# [01-09] Best Price Court Breakdown

> Date: 2026-01-25
> Previous: 01-08-owner-court-blocks.md

## Summary

Enhanced Best Price schedule UX by surfacing per-slot court availability under each time window. Availability APIs now support optional court-level details, and Best Price views show court status (Available/Booked/Maintenance) while keeping By Court mode unchanged.

## Changes Made

### Availability API

| File | Change |
|------|--------|
| `src/modules/availability/dtos/availability.dto.ts` | Added `includeCourtOptions` and `includeUnavailable` flags for place-sport availability. |
| `src/modules/availability/services/availability.service.ts` | Collected court-level options per start time and returned them in `courtOptions`. |

### Client Data Plumbing

| File | Change |
|------|--------|
| `src/features/discovery/hooks/use-place-detail.ts` | Passed through `includeCourtOptions` and surfaced `courtOptions` on results. |

### Schedule UI

| File | Change |
|------|--------|
| `src/app/(public)/courts/[id]/schedule/page.tsx` | Rendered court breakdown under Best Price slots (day + month views). |

## Key Decisions

- Only Best Price mode shows per-slot court breakdown to clarify why a time is still available.
- Court breakdown highlights availability first, with booked/maintenance shown as muted labels.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
