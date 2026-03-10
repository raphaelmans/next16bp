# Availability Sync

## Event Contract

Availability now has a dedicated realtime event table:
- `availability_change_event`

Server-side pieces:
- schema: `src/lib/shared/infra/db/schema/availability-change-event.ts`
- migration: `drizzle/0039_availability_change_event.sql`
- repository: `src/lib/modules/availability/repositories/availability-change-event.repository.ts`
- service: `src/lib/modules/availability/services/availability-change-event.service.ts`
- realtime publication helper: `scripts/enable-realtime-availability-change-events.ts`

Client-side pieces:
- realtime client: `src/common/clients/availability-realtime-client/index.ts`
- discovery sync consumer: `src/features/discovery/realtime.ts`

## Realtime Publication Setup

The `availability_change_event` table requires the standard Supabase Realtime prerequisites (see `00-overview.md`):

1. **Publication**: table must be in `supabase_realtime`
2. **Grants**: `SELECT` to `authenticated` and `anon` (filter uses `court_id`)
3. **Replica identity**: default is sufficient (`court_id` is the PK)

Migration: `drizzle/0044_availability_change_event_realtime_grants.sql`

Run after migrating the target database:

```bash
pnpm exec dotenvx run --env-file=.env.local -- tsx scripts/enable-realtime-availability-change-events.ts
pnpm exec dotenvx run --env-file=.env.production -- tsx scripts/enable-realtime-availability-change-events.ts
```

If any prerequisite is missing, the channel joins with `phx_reply: ok` but then emits a delayed `system` error: `invalid column for filter court_id`. See `00-overview.md` for the full diagnostic checklist.

## Payload Shape

The event carries patchable slot state, including:

- `courtId`
- `placeId`
- `sportId`
- `startTime`
- `endTime`
- `slotStatus`
- `unavailableReason`
- `totalPriceCents`
- `currency`

This mirrors the subset of `AvailabilityOption` needed to patch matching court-scoped caches directly.

## Patch Strategy

### Direct Patch

Used for:
- court day availability
- court range availability

Behavior:
- matching slot in cache is patched directly
- court-scoped cache stays responsive without full refetch

### Scoped Invalidation

Used for:
- place-sport day/range aggregate availability

Behavior:
- matching aggregate scope is invalidated/refetched
- no unsafe local recomputation from incomplete court data

## Producer Coverage

Availability events are emitted from bookability-changing flows:

- player reservation create
- player reservation cancel
- owner reservation reject
- owner reservation cancel
- guest booking create
- walk-in block convert to guest booking
- court block create
- court block cancel
- court block range update
- stale reservation expiry

## Recovery

Availability queries still use:

- `staleTime`
- `refetchOnWindowFocus`
- `refetchOnReconnect`

These are the safety net for missed websocket events, background tabs, or reconnect gaps.
