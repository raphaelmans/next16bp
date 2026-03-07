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
