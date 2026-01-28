# [01-28] Availability Studio Optimistic UI

> Date: 2026-01-29
> Previous: 01-27-bookings-import-multifile.md

## Summary

Applied Phase 6 enhancements to the Availability Studio: optimistic updates for block and draft-row mutations, per-block pending state, and calmer timeline styling. Removed redundant invalidations and verified lint + build.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(owner)/owner/bookings/page.tsx` | Added optimistic cache updates for create/update/cancel and draft row updates, per-block pending tracking, reduced visual contrast, and removed redundant invalidations. |

## Key Decisions

- Use optimistic block IDs and `trpc.useUtils()` cache helpers for immediate UI response.
- Disable drag only on pending blocks (not globally) to keep the studio responsive.
- Shift to neutral block cards with thin accent stripes and subtle drop highlights for calmer UX.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
