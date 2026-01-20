# [00-71] Admin Verification UX + Reservable Toggle

> Date: 2026-01-20
> Previous: 00-70-owner-verification-routing.md

## Summary

Improved admin verification queue display to show place names, and on approval automatically mark the place as reservable.

## Changes Made

### Admin Verification Queue

| File | Change |
| --- | --- |
| `src/modules/place-verification/repositories/place-verification.repository.ts` | Joined `place` to include `placeName` in pending request results. |
| `src/modules/place-verification/services/place-verification-admin.service.ts` | Updated pending request payload shape and auto-set `placeType` to `RESERVABLE` on approval. |
| `src/features/admin/hooks/use-place-verification.ts` | Mapped pending list to include `placeName`. |
| `src/app/(admin)/admin/verification/page.tsx` | Displayed place name in queue cards. |

## Key Decisions

- Prefer place names over truncated IDs to reduce admin confusion.
- Automatically flip place type to reservable when verification is approved.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
