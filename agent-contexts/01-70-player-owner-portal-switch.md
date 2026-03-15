# [01-70] Player Owner Portal Switch

> Date: 2026-02-06
> Previous: 01-69-reservation-chat-auto-message-links.md

## Summary

Implemented a Player/Owner view switcher in the player sidebar header and persisted the selected portal to the database. This now ties into the existing post-login redirect behavior so users return to their last selected portal.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/lib/modules/user-preference/user-preference.router.ts` | Added a new protected tRPC mutation `setDefaultPortal` to persist `player` or `owner` preference via `UserPreferenceService`. |
| `src/lib/shared/infra/trpc/root.ts` | Registered `userPreference` router in the root `appRouter`. |
| `src/components/layout/player-sidebar.tsx` | Replaced static header label with dropdown switcher, persisted selection using `trpc.userPreference.setDefaultPortal`, navigated to `/home` or `/owner`, and removed duplicate `Owner Dashboard` entry from the dashboards group. |

## Key Decisions

- Reused existing `user_preferences.default_portal` schema and service; no database migration was needed.
- Kept existing routing logic unchanged because `/post-login` already reads `defaultPortal` and redirects accordingly.
- Restricted Owner option visibility in the header switcher to `isOwner` users to avoid invalid mode selection.
- Removed duplicate owner navigation in the sidebar body to make the new header switcher the canonical portal toggle.

## Next Steps (if applicable)

- [ ] Manually verify portal persistence across sign-out/sign-in flows for owner and non-owner accounts.
- [ ] Optionally align other cross-portal entry points (e.g., owner navbar/user dropdown links) to also persist portal preference before navigation.

## Commands to Continue

```bash
pnpm lint
pnpm dev
```
