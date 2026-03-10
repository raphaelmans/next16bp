# Reservation Sync

## Canonical Identity

- `reservationId` is the canonical client identity
- linked/grouped reservations remain internal linking detail
- legacy `reservationGroupId` is boundary-only

## Sync Model

Reservation sync is centralized in:
- `src/features/reservation/sync.ts`

Main responsibilities:
- invalidate player reservation overview
- invalidate owner reservation overview
- invalidate reservation detail and linked detail
- invalidate reservation-linked chat session and thread metas
- invalidate in-app reservation notification inbox
- invalidate owner active reservation ranges when needed

## Main Consumers

- Player reservation detail/payment/list
- Owner reservations list
- Owner active reservations
- Owner reservation detail
- Owner dashboard projections
- Reservation alerts panel
- Reservation chat inbox/context
- Notification bell / in-app reservation inbox

## Hook Naming After Refactor

Examples of canonical read layers:

- `useQueryMyReservationSummaries`
- `useQueryOwnerReservationSummaries`
- `useQueryOwnerReservationEntity`
- `useQueryOwnerReservationDashboardProjection`
- `useQueryOwnerReservationAlertsProjection`

## Why Reservation Uses Event Notification

Reservation state fans out into many projections:

- summary rows
- entity detail
- linked detail
- counts
- dashboard projections
- alerts
- chat context
- notification inbox

Because of that, reservation realtime does not try to carry all derived state.
It signals change, then the client invalidates only affected canonical keys.

## Realtime Publication Setup

The `reservation_event` table requires all three Supabase Realtime prerequisites (see `00-overview.md`):

1. **Publication**: table must be in `supabase_realtime`
2. **Grants**: `SELECT` to `authenticated` and `anon` (anon needed because the browser client connects with the publishable key and the subscription uses a column filter)
3. **Replica identity**: `FULL` (the subscription filters on `reservation_id`, which is not the PK — PK is `id`)

Migration: `drizzle/0046_reservation_notification_realtime_grants.sql`

### Realtime Client

- Client: `src/common/clients/reservation-realtime-client/index.ts`
- Subscribes to `INSERT` on `public.reservation_event`
- Filters by `reservation_id=eq.<id>` (single) or `reservation_id=in.(<ids>)` (group)
- Uses `getSupabaseBrowserClient()` — no explicit auth token; inherits connection-level publishable key (`anon` role)

### Notification Realtime

The `user_notification` table is also subscribed via realtime:

- Client: `src/common/clients/notification-realtime-client/index.ts`
- Subscribes to `INSERT` on `public.user_notification` **without filters**
- Client-side filters by `user_id` after receiving the event
- Only needs `authenticated` grant (no filter validation occurs server-side)

Migration: `drizzle/0046_reservation_notification_realtime_grants.sql`
