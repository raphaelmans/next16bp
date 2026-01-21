# [00-90] Verification Courts Guard

> Date: 2026-01-21
> Previous: 00-89-list-your-venue-og-image.md

## Summary

Added a safety redirect after verification submission so owners with zero courts are sent back to the place courts list. This prevents getting stuck on verification without a court attached.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/owner/components/place-verification-panel.tsx` | After successful verification submit, fetch courts for the place and redirect to `/owner/places/{placeId}/courts` when none exist. |

## Key Decisions

- Use a post-submit `listByPlace` fetch to avoid relying on stale UI state.
- Redirect only when the query succeeds and returns zero courts; otherwise keep the user on the verification page.

## Next Steps (if applicable)

- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build`.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
