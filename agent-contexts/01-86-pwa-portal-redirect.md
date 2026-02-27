# [01-86] PWA Portal Redirect via localStorage

> Date: 2026-02-27
> Previous: 01-85-open-play-mvp.md

## Summary

Fixed PWA reopening to the marketing landing page (`/`) instead of the user's preferred portal (`/owner` or `/home`). Uses a client-side localStorage key synced from shell mounts and explicit portal switches, with a blocking inline script on the landing page that redirects before React hydrates.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/auth/hooks.ts` | Exported `PORTAL_STORAGE_KEY` constant; added `onSuccess` to `setDefaultPortalMutation` to sync localStorage on explicit portal switch; added `localStorage.removeItem` in `useMutAuthLogout` `onSuccess` |
| `src/features/owner/components/owner-shell.tsx` | Added `useQueryAuthUserPreference` + two `useEffect` hooks: immediate seed (`"owner"` when empty) and authoritative sync from DB preference |
| `src/features/auth/components/player-shell.tsx` | Added `useQueryAuthUserPreference` + two `useEffect` hooks: immediate seed (`"player"` when empty) and authoritative sync from DB preference |
| `src/app/page.tsx` | Added blocking inline `<script>` that reads `kudos.default-portal` from localStorage and calls `location.replace()` before React hydrates |

## Key Decisions

- **localStorage over server-side auth check**: Landing page stays ISR-cached with zero server cost; redirect is instant for PWA reopens
- **Shell seeding as fallback**: Only writes when key is empty; explicit portal switches (mutation `onSuccess`) are the authoritative write path
- **DB preference sync added by user**: Both shells also query `userPreference` and sync from DB to override stale localStorage — ensures consistency after portal switches on other devices
- **`location.replace()` over `location.href`**: Keeps landing page out of history stack so back-button works correctly
- **Clear on logout**: Prevents stale redirect for logged-out users reopening the PWA
- **`try/catch` everywhere**: Handles private browsing and disabled localStorage gracefully

## Verification

1. New visitor at `/` -> no localStorage -> landing page renders normally
2. Owner logs in, reaches `/owner` -> OwnerShell seeds `"owner"` -> PWA reopen -> instant `/owner`
3. Owner switches to player portal -> mutation `onSuccess` writes `"player"` -> PWA reopen -> `/home`
4. Player logs in, reaches `/home` -> PlayerShell seeds `"player"` -> PWA reopen -> `/home`
5. User logs out -> localStorage cleared -> next visit -> landing page
6. `pnpm lint` passes (no new errors introduced)
