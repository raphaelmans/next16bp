## Why

Reservation data in the app is currently fetched through several broad, overlapping queries and then recomposed separately by owner lists, active alerts, dashboard projections, player detail flows, availability views, chat context, and in-app notification inboxes. That creates redundant refetching on navigation, inconsistent convergence after lifecycle changes, and a weak foundation for reliable realtime updates across the reservation domain.

The product direction is now explicitly reservation-first and hard-cutover. The frontend needs a shared query and sync model that treats `reservationId` as canonical, splits reads into reusable summary/entity/projection queries, and lets small realtime domain events keep all reservation-adjacent surfaces aligned without broad cache wipes or full payload streaming.

## What Changes

- Introduce a reservation-first CQRS-style read model with canonical summary, entity, linked-detail, count, and projection queries owned by shared domain query-key registries.
- Add a centralized reservation sync layer that intentionally mixes two event patterns: reservation `event notification` with scoped invalidation/refetch, and availability `event-carried state transfer` with direct cache patching for simple visible slot state.
- Replace broad reservation-backed UI composition with modular queries reused across owner reservation views, player reservation views, alerts, dashboard widgets, and reservation-linked chat context.
- Add scoped availability change synchronization that uses hybrid cache updates with `immer`: cheap visible summary patches where safe, authoritative refetch for court/day/range and place-sport projections, and focus/reconnect recovery for missed websocket events.
- Keep asynchronous notification delivery channels decoupled, while making the in-app reservation inbox participate in the shared reservation sync contract.
- Preserve reservation-first compatibility rules: `reservationId` remains canonical, while legacy `reservationGroupId` is resolved only at the boundary.

## Capabilities

### New Capabilities
- `reservation-query-sync`: Canonical reservation query taxonomy and scoped realtime synchronization for owner/player reservation views, linked detail, counts, dashboard projections, alerts, and reservation-linked chat context.
- `availability-realtime-sync`: Scoped availability change signaling with hybrid cache patching and authoritative refetch for court and place-sport availability projections.
- `reservation-notification-inbox-sync`: Reservation lifecycle-aware synchronization for the in-app notification inbox, while leaving email, SMS, and push delivery asynchronous.

### Modified Capabilities

None.

## Impact

- Affected frontend domains: `src/features/reservation`, `src/features/owner`, `src/features/discovery`, `src/features/chat`, `src/features/notifications`, and shared query/sync helpers under `src/common`.
- Affected server/query contracts: reservation summary/detail/projection reads, availability projection reads, and realtime event mapping for reservation/availability/inbox sync.
- Affected behavior: navigation cache reuse, owner/player reservation convergence, availability refresh behavior, alerts/dashboard consistency, and notification inbox freshness.
- Dependencies and constraints: React Query cache behavior, Supabase realtime event delivery, reservation-first unification rules in `important/reservation-unification/00-overview.md`, and hard-cutover migration expectations.
