# [00-68] Place Verification Gating

> Date: 2026-01-20
> Previous: 00-67-booking-conversion-ux.md

## Summary

Completed verification gating for public schedule and booking flows, and fixed the place detail sidebar conditional so unverified venues show the curated/claim/removal stack without JSX errors.

## Changes Made

### Public Booking UX

| File | Change |
| --- | --- |
| `src/app/(public)/places/[placeId]/page.tsx` | Fixed sidebar conditional to render curated state when booking is disabled. |
| `src/app/(public)/courts/[id]/schedule/page.tsx` | Added verification and reservations-enabled gating with fallback messaging. |
| `src/app/(auth)/places/[placeId]/book/page.tsx` | Blocked booking flow when verification or reservations are not enabled. |

## Key Decisions

- Gate all booking surfaces on `placeType === "RESERVABLE"` plus `verification.status === "VERIFIED"` and `verification.reservationsEnabled === true`.
- Use concise, friendly fallback messaging instead of redirecting to avoid surprise navigation.

## Next Steps

- [ ] Decide whether to keep owner place list verification placeholders or wire real data.
- [ ] Run `pnpm lint` and `pnpm build` (consider `TZ=UTC pnpm build`).

## Commands to Continue

```bash
pnpm lint
pnpm build
```
