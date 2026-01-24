# [01-07] Drizzle Date Bind Fix

> Date: 2026-01-25
> Previous: 01-06-range-reservations-cutover.md

## Summary

Fixed runtime errors in availability queries caused by passing JS `Date` objects through raw `sql\`...\`` fragments (postgres-js prepared binds expect encoded values). Updated overlap predicates to use Drizzle's typed operators so timestamps are encoded correctly.

## Changes Made

### Repository query fixes

| File | Change |
|------|--------|
| `src/modules/court-block/repositories/court-block.repository.ts` | Replaced raw `sql` comparisons with `lt/gt` predicates for overlap checks. |
| `src/modules/court-price-override/repositories/court-price-override.repository.ts` | Replaced raw `sql` comparisons with `lt/gt` predicates for overlap checks. |
| `src/modules/reservation/repositories/reservation.repository.ts` | Replaced raw `sql` comparisons with `lt/gt` predicates for overlap checks in active-overlap query. |

## Validation

```bash
pnpm lint
TZ=UTC pnpm build
```
