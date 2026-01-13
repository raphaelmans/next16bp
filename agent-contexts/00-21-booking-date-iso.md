# [00-21] Booking Date ISO

> Date: 2026-01-13
> Previous: 00-20-reservation-expiresat-fix.md

## Summary

Fixed booking flow availability mismatches by generating date filters using UTC day boundaries, preventing prod-only slot lookups from missing the selected slot.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/discovery/hooks/use-place-detail.ts` | Compute availability `dateIso` using UTC date components. |

## Key Decisions

- Normalize availability date queries to UTC to align with server parsing and avoid timezone shifts.

## Next Steps (if applicable)

- [ ] Consider using consistent date utilities for client/server slot filtering.

## Commands to Continue

```bash
pnpm lint
```
