# [00-20] Reservation ExpiresAt Fix

> Date: 2026-01-13
> Previous: 00-19-reservation-refresh.md

## Summary

Fixed a runtime error in the reservations detail page caused by treating serialized `expiresAt` values as Date objects.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/reservation/components/status-banner.tsx` | Accepted `Date | string` for `expiresAt` to match serialized data. |
| `src/app/(auth)/reservations/[id]/page.tsx` | Passed `expiresAt` through without calling `toISOString()`. |

## Key Decisions

- Treated reservation expiry as a serialized string at the UI boundary to avoid runtime conversion errors.

## Next Steps (if applicable)

- [ ] Consider aligning reservation DTOs to consistently return ISO strings.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
