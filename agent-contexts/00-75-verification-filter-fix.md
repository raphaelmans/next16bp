# [00-75] Verification Filter Fix

> Date: 2026-01-20
> Previous: 00-74-verification-filter-badge.md

## Summary

Fixed the discovery verification filter so the query param applies correctly and totals remain accurate.

## Changes Made

### Discovery Filtering

| File | Change |
| --- | --- |
| `src/modules/place/services/place-discovery.service.ts` | Forwarded `verificationTier` into repository list queries. |
| `src/modules/place/repositories/place.repository.ts` | Restored count semantics while filtering so totals reflect distinct places. |

## Commands to Continue

```bash
pnpm lint
pnpm build
```
