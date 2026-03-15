# [01-71] Unified Portal Switcher

> Date: 2026-02-06
> Previous: 01-70-player-owner-portal-switch.md

## Summary

Unified portal switching across player, owner, and admin views using a single reusable component. Also changed default portal persistence to non-blocking behavior so navigation is immediate and UI is never blocked by mutation latency.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/components/layout/portal-switcher.tsx` | Added reusable portal switcher with shared route mapping (`/home`, `/owner`, `/admin`), role-aware option visibility, sidebar/menu variants, immediate navigation, and fire-and-forget default portal persistence for `player`/`owner`. |
| `src/components/layout/player-sidebar.tsx` | Replaced inline header switch logic with reusable `PortalSwitcher` and removed blocking `await mutateAsync` flow. |
| `src/features/owner/components/owner-sidebar.tsx` | Added reusable portal switcher in sidebar header while keeping organization switcher intact. |
| `src/features/admin/components/admin-sidebar.tsx` | Replaced static admin header block with reusable portal switcher and retained existing admin nav/footer behavior. |
| `src/features/owner/components/owner-navbar.tsx` | Replaced hardcoded cross-portal dropdown links with shared `PortalSwitcher` menu items. |
| `src/features/admin/components/admin-navbar.tsx` | Replaced hardcoded cross-portal dropdown links with shared `PortalSwitcher` menu items. |
| `src/features/discovery/components/user-dropdown.tsx` | Replaced hardcoded owner/admin dashboard links with shared `PortalSwitcher` menu items. |

### Validation

| File | Change |
|------|--------|
| `pnpm lint` | Ran lint after refactor; check passed with no fixes needed. |

## Key Decisions

- Centralized portal switch behavior in one reusable component to keep all switch surfaces aligned.
- Standardized player destination to `/home` across all views.
- Kept persistence scoped to DB-supported enum values (`player | owner`); admin switching navigates only.
- Made persistence non-blocking by using mutation `.mutate(...)` and never awaiting before `router.push(...)`.

## Next Steps (if applicable)

- [ ] Manually test role matrix (player-only, owner, admin-only, admin+owner) across sidebar and navbar switch surfaces.
- [ ] Optionally add lightweight analytics event on portal switch actions for behavior tracking.

## Commands to Continue

```bash
pnpm lint
pnpm dev
```
