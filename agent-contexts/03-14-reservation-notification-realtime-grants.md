---
tags:
  - agent-context
  - frontend/reservation
  - frontend/owner
date: 2026-03-11
previous: 03-13-semantic-discovery-search.md
related_contexts:
  - "[[03-11-availability-realtime-grants]]"
  - "[[03-08-venue-detail-isr-caching]]"
---

# [03-14] Reservation & Notification Realtime Grants

> Date: 2026-03-11
> Previous: 03-13-semantic-discovery-search.md

## Summary

Fixed three independent failures preventing Supabase Realtime subscriptions from working on `reservation_event` and `user_notification` tables: missing publication membership, missing SELECT grants (including `anon` for filtered channels), and missing `REPLICA IDENTITY FULL` for non-PK filter columns. Also fixed a tRPC v11 query key mismatch that caused owner reservation status badges to not update on realtime invalidation, and a UX issue where the player refresh button was disabled during background polling.

## Related Contexts

- [[03-11-availability-realtime-grants]] - Same failure pattern on `availability_change_event` with identical root cause (missing SELECT grants); this session extended the fix to reservation and notification tables
- [[03-08-venue-detail-isr-caching]] - Public venue detail surface where the availability realtime failure was first observed

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `drizzle/0046_reservation_notification_realtime_grants.sql` | New migration: adds `reservation_event` and `user_notification` to `supabase_realtime` publication, grants SELECT, sets REPLICA IDENTITY FULL on `reservation_event` |
| `drizzle/meta/_journal.json` | Registered migration 0046 at idx 49 |
| `src/features/reservation/sync.ts` | Replaced tRPC `utils.*` invalidations with direct `queryClient.invalidateQueries` using `buildTrpcQueryKey` for owner and player overview sync; fixes key mismatch between tRPC v11 utils and `useFeatureQuery` |
| `src/features/reservation/pages/reservation-detail-page.tsx` | Removed `isFetchingReservation` from refresh button disabled/spin conditions; removed unused `isFetching` destructuring |

### Documentation

| File | Change |
|------|--------|
| `important/real-time/00-overview.md` | Rewrote operational requirement section into a structured checklist for new realtime tables; added diagnostic queries, failure mode descriptions, and current tables summary |
| `important/real-time/01-reservation-sync.md` | Added reservation-specific realtime publication setup, client details, and notification realtime section |
| `important/real-time/02-availability-sync.md` | Aligned with new checklist format, cross-references `00-overview.md` |
| `important/real-time/99-source-files.md` | Added `notification-realtime-client` and migration 0046 |

## Tag Derivation (From This Session's Changed Files)

- `frontend/reservation` — changed `reservation-detail-page.tsx` and `sync.ts`
- `frontend/owner` — owner reservation detail page affected by sync.ts invalidation fix

## Key Decisions

- **Three independent requirements for Supabase Realtime**: (1) publication membership, (2) SELECT grants with `anon` for filtered channels, (3) REPLICA IDENTITY FULL for non-PK filter columns. All three must be satisfied; missing any one produces a silent failure.
- **`anon` role needed for filtered subscriptions**: The browser Supabase client connects with the publishable key (maps to `anon`). The `realtime.subscription_check_filters` trigger validates filters by calling `has_column_privilege` for the JWT role. Without `anon` SELECT, filter validation fails even though `authenticated` has access.
- **Replaced tRPC v11 utils with direct queryClient invalidation**: `utils.reservationOwner.getForOrganization.invalidate()` from tRPC v11 produced keys that didn't match queries created by `useFeatureQuery(buildTrpcQueryKey(...))`. Switching to `queryClient.invalidateQueries({ queryKey: buildTrpcQueryKey(...) })` ensures key format consistency.
- **Applied grants directly to production**: The Drizzle migrator has a pre-existing journal sync issue on older migrations, so grants were applied via direct SQL. Migration file tracks the full intent.

## Next Steps (if applicable)

- [ ] Audit remaining `utils.*` tRPC invalidation calls in `sync.ts` (chat, notifications, chatInbox) to check if they also suffer from the key mismatch — those queries might use tRPC hooks directly or `useFeatureQuery`
- [ ] Consider a project-wide audit of all `trpc.useUtils()` invalidation calls to identify other queries created via `useFeatureQuery` that would be missed by tRPC utils
- [ ] Fix the Drizzle migrator journal sync issue so `pnpm db:migrate` works cleanly on production

## Commands to Continue

```bash
# Verify realtime subscription health in production
# Open browser DevTools → Network → WS → filter for 'realtime'
# All channels should show "Subscribed to PostgreSQL" system event

# Audit remaining tRPC utils usage
grep -n 'utils\.' src/features/reservation/sync.ts

# Check which queries use useFeatureQuery vs tRPC hooks for chat/notification
grep -rn 'useFeatureQuery.*chatMessage\|useFeatureQuery.*reservationChat\|useFeatureQuery.*userNotification\|useFeatureQuery.*chatInbox' src/
```
