# [01-86] Role-Sticky Navigation + PWA Portal Redirect

> Date: 2026-02-27
> Previous: 01-85-open-play-mvp.md

## Summary

Implemented a three-part feature: (A) localStorage-based PWA instant redirect that syncs with the DB-persisted portal preference, (B) Courts discovery added to owner navigation, and (C) player bottom tabs for mobile. The core pattern uses a two-tier localStorage seeding strategy — immediate shell-based fallback + authoritative DB sync via `useQueryAuthUserPreference`.

## Changes Made

### Part A — PWA Instant Redirect + DB Sync

| File | Change |
|------|--------|
| `src/features/auth/hooks.ts` | Export `PORTAL_STORAGE_KEY` constant; `onSuccess` on `setDefaultPortalMutation` writes to localStorage; `useMutAuthLogout` clears localStorage on logout |
| `src/features/owner/components/owner-shell.tsx` | Two-tier seeding: immediate seed `"owner"` if empty + authoritative overwrite from `useQueryAuthUserPreference` |
| `src/features/auth/components/player-shell.tsx` | Two-tier seeding: immediate seed `"player"` if empty + authoritative overwrite from `useQueryAuthUserPreference` |
| `src/app/page.tsx` | Inline blocking `<script>` reads localStorage and `location.replace()` to `/owner` or `/home` before React hydrates |

### Part B — Courts Discovery in Owner Navigation

| File | Change |
|------|--------|
| `src/features/owner/components/owner-bottom-tabs.tsx` | Replaced Schedule (Tab 2) with Courts (`/courts`, MapPin) for all roles; Schedule moved to More sheet for OWNER/MANAGER |
| `src/features/owner/components/owner-sidebar.tsx` | Added Courts nav item between Dashboard and Venues collapsible (cross-portal link to `/courts`) |

### Part C — Player Bottom Tabs

| File | Change |
|------|--------|
| `src/components/layout/player-bottom-tabs.tsx` | **Created** — 4-tab mobile bottom bar: Courts, Reservations, Home, Profile |
| `src/components/layout/player-shell.tsx` | Added `bottomNav` prop passthrough to `AppShell` |
| `src/features/auth/components/player-shell.tsx` | Wired `<PlayerBottomTabs />` via `bottomNav` prop |

## Key Decisions

- **Two-tier localStorage seeding**: Tier 1 (immediate, no network) seeds from shell identity on mount when empty; Tier 2 (DB query) overwrites with authoritative `defaultPortal` from `useQueryAuthUserPreference`. Closes cross-device sync gap where localStorage on device B could be stale after a portal switch on device A.
- **DB is source of truth**: `post-login/route.ts` reads `preference?.defaultPortal` for server redirect; shells sync the same value to localStorage for the PWA inline script. Three layers stay in sync: DB → post-login redirect → localStorage → PWA script.
- **Courts as cross-portal link**: The Courts tab/sidebar item navigates to `/courts` (public shell), intentionally leaving the owner portal. It will never show as "active" in owner nav — it's a convenience shortcut for the #2 daily action (checking listings).
- **Schedule moved to More sheet**: Courts discovery is higher frequency than schedule management for owners on mobile, so it gets a primary tab slot.
- **No extra network cost**: `useQueryAuthUserPreference` shares the `["userPreference", "me"]` query key with `useModPortalSwitcherData` (used in PortalSwitcher), so TanStack Query deduplicates — zero additional requests.

## Architecture: Portal Preference Flow

```
Login → POST /post-login → reads DB preference → 302 redirect
  → Shell mounts → Tier 1 seed (immediate) → Tier 2 DB sync (authoritative)
  → localStorage matches DB ✓

Portal switch → mutation writes DB + localStorage (onSuccess)
Logout → localStorage cleared, DB untouched

PWA reopen → inline <script> reads localStorage → instant redirect
```

## Tab Layouts

### Owner Bottom Tabs (mobile)

| Role | Tab 1 | Tab 2 | Tab 3 | Tab 4 |
|------|-------|-------|-------|-------|
| OWNER | Reservations | Courts | Venues | More |
| MANAGER | Reservations | Courts | Imports | More |
| VIEWER | Reservations | Courts | Profile | — |

### Player Bottom Tabs (mobile)

| Tab 1 | Tab 2 | Tab 3 | Tab 4 |
|-------|-------|-------|-------|
| Courts | Reservations | Home | Profile |
