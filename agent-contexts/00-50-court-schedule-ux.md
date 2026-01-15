# [00-50] Court Schedule UX Updates

> Date: 2026-01-15
> Previous: 00-49-curated-claim-flow.md

## Summary

Updated the court schedule editor to prefill daily blocks, default the expanded day to Monday, and bulk-fill the first hourly rate across open blocks. Validated the build and lint checks after changes.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/owner/components/court-schedule-editor.tsx` | Added Monday-first default day logic, seeded empty schedules with one block per day, and implemented first-entry hourly-rate bulk fill for open blocks. |

### Validation

| File | Change |
|------|--------|
| `pnpm lint` | Passed. |
| `TZ=UTC pnpm build` | Passed. |

## Key Decisions

- Bulk-fill pricing only for open blocks to avoid closed+priced conflicts.
- Seed default blocks only when the schedule is entirely empty to preserve existing configurations.

## Next Steps (if applicable)

- [ ] None.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
