# [00-79] Duration Hours Input

> Date: 2026-01-21
> Previous: 00-78-organization-logo-visibility.md

## Summary

Replaced the public duration button group with a 1-24 hour stepper, kept URL params in minutes for compatibility, and normalized duration parsing in schedule/booking flows. Added a shared duration helper and a planning pack for the change.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/shared/lib/duration.ts` | Added normalize helper for minute validation. |
| `src/app/(public)/places/[placeId]/page.tsx` | Replaced duration buttons with hours stepper and draft/blur handling. |
| `src/app/(public)/courts/[id]/schedule/page.tsx` | Swapped duration buttons for hours stepper and normalized query parsing. |
| `src/app/(auth)/places/[placeId]/book/page.tsx` | Normalized duration parsing to accept any whole-hour minutes. |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/53-duration-hours-input/53-00-overview.md` | Added overview for duration hours input work. |
| `agent-plans/53-duration-hours-input/53-01-public-duration-hours.md` | Added phase plan with steps and tests. |
| `agent-plans/53-duration-hours-input/duration-hours-input-dev1-checklist.md` | Added dev checklist. |

## Key Decisions

- Keep `duration` URL param in minutes for backwards compatibility.
- Use 1-24 hour stepper input and clamp to whole hours only.
- Commit duration on valid input or blur; keep draft empty state while typing.

## Next Steps

- [ ] Smoke test detail, schedule, and booking deep links with custom durations.
- [ ] Run `pnpm lint` and `pnpm build` (optionally `TZ=UTC pnpm build`).

## Commands to Continue

```bash
pnpm lint
pnpm build
TZ=UTC pnpm build
```
