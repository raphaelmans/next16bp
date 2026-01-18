# [00-59] Place Detail Loop Fix

> Date: 2026-01-18
> Previous: 00-58-public-navbar-consistency.md

## Summary

Resolved the max update depth issue on the public place detail page by guarding the claim reset effect, and restored derived state helpers needed for booking UI flows.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(public)/places/[placeId]/page.tsx` | Guarded claim form reset effect and reintroduced derived state helpers for availability, schedule links, and claim submission state. |

## Key Decisions

- Avoid repeated form resets by comparing current form values before calling `resetClaimForm`.
- Keep availability and CTA helpers colocated in the page to support summary actions and schedule links.

## Next Steps (if applicable)

- [ ] Run `TZ=UTC pnpm build`.
- [ ] Verify the place detail page no longer triggers update depth errors.

## Commands to Continue

```bash
TZ=UTC pnpm build
```
