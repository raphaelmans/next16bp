## Context

The app already has a reservation-first direction and a canonical `reservationId` contract, but its reads are still spread across broad list queries, consumer-specific projections, and cache invalidations defined close to UI surfaces. Owner reservation pages, alerts, dashboard widgets, player detail/payment flows, availability screens, chat-linked reservation context, and in-app notification inboxes all overlap on the same reservation lifecycle data but do not share one explicit query taxonomy or one sync layer.

Realtime support already exists for reservation lifecycle events through Supabase, but the current pattern mostly invalidates broad query families. Availability is server-authoritative and derived from more than reservations alone, so it cannot safely be driven by reservation events only. The design therefore needs to unify cache ownership and event handling without turning all realtime payloads into the primary data source.

This change is cross-cutting and hard-cutover. It affects reservation, owner, discovery, chat, notifications, and shared query helpers. Existing `specs/` docs remain untouched; OpenSpec artifacts capture the new change independently.

## Goals / Non-Goals

**Goals:**
- Establish a canonical reservation query taxonomy split into summary, entity, linked-detail, count, and projection queries.
- Centralize query-key ownership and reservation-domain realtime invalidation rules.
- Reuse canonical query identities across owner/player reservation surfaces so navigation reuses cache instead of broad refetching.
- Keep availability server-authoritative while supporting hybrid realtime updates with scoped refetch.
- Synchronize the in-app reservation notification inbox with reservation lifecycle while keeping async delivery channels decoupled.
- Preserve reservation-first identity and boundary compatibility rules.

**Non-Goals:**
- Introduce a new reservation session-state model beyond the existing lifecycle states in this cutover.
- Replace authoritative server reads with full realtime payload streaming.
- Migrate or delete the existing `specs/` folder.
- Redesign external notification delivery infrastructure.
- Rewrite unrelated domains outside reservation-adjacent consumers.

## Decisions

### 1. Use a reservation-first CQRS-style read model
Reservation reads will be split into canonical summary, entity, linked-detail, count, and projection queries. This keeps queries single-responsibility, allows shared query keys across surfaces, and prevents broad list DTOs from becoming the de facto source of truth.

Alternatives considered:
- Keep broad list queries and derive everything client-side: rejected because it causes overfetching, broad invalidations, and consumer drift.
- Use one normalized mega-query: rejected because it couples unrelated surfaces and makes partial invalidation expensive.

### 2. Centralize cache ownership in domain query-key registries and sync helpers
Shared query-key registries will define the stable identity for reservation and availability query families. A reservation-domain sync helper will own patching and invalidation behavior instead of individual UI components.

Alternatives considered:
- Let each hook or component define its own invalidation arrays: rejected because it duplicates cache policy and causes missed or broad invalidations.
- Depend entirely on raw tRPC keys without a domain-level helper: rejected because multiple projections still need one place to translate domain events into cache behavior.

### 3. Treat reservations as event notification
Reservations use the `event notification` pattern. Realtime reservation events tell the client which reservation changed, and the client responds by invalidating or refetching the authoritative entity, linked-detail, summary, count, and projection queries that include that reservation.

Alternatives considered:
- Broad reservation-domain invalidation after every event: rejected because it recreates the current refetch-heavy behavior.
- Mostly client-patched caches from realtime payloads: rejected because complex projections and linked state would drift from server truth.

### 4. Treat availability as event-carried state transfer with a safety net
Availability uses the `event-carried state transfer` pattern where the event carries enough slot state to patch visible availability caches directly. Cache patching uses `immer` so updates remain localized and readable. Because websocket delivery can be missed on backgrounded or disconnected tabs, patched availability queries still recover through `refetchOnWindowFocus`, `refetchOnReconnect`, and moderate `staleTime` settings.

The current implementation only has enough realtime scope to support owner-side/local optimistic patching plus scoped owner range invalidation. Full public discovery availability patching still requires a richer server event such as `availability.changed` that carries affected court/place-sport scope, time window, and slot/bookability state.

Alternatives considered:
- Stream full slot payloads: rejected because payload size and drift risk are high.
- Treat reservation lifecycle events as sufficient for availability: rejected because many non-reservation changes also affect bookability.
- Manual refresh only after cache patches: rejected because missed events would let client state drift indefinitely.

### 5. Keep notification delivery decoupled, but synchronize the in-app inbox
The in-app reservation inbox participates in the reservation sync contract because it is a UI read model. Email, SMS, and push delivery remain asynchronous infrastructure and are not allowed to block or redefine canonical reservation state.

Alternatives considered:
- Fully couple async delivery and UI sync: rejected because delivery latency/failures would leak into canonical UI state.
- Leave inbox sync fully separate: rejected because reservation surfaces and inbox would continue to drift.

## Risks / Trade-offs

- [Scoped invalidation misses an affected query] → Build one explicit event-to-query-scope mapping helper and test it against owner/player/dashboard/alerts/inbox surfaces.
- [Summary/entity split causes N+1 detail fetching] → Keep summary rows rich enough for default row rendering and lazy-load entity detail only for selected, expanded, dialog, or detail-page surfaces.
- [Hybrid availability patching becomes too complex] → Limit patching to trivial visible summaries and prefer authoritative refetch for full day/range/place-sport projections.
- [Hard cutover leaves old consumers behind] → Route all reservation-adjacent surfaces through the new query helpers before removing broad consumer-specific query composition.
- [Legacy group compatibility leaks back into new contracts] → Keep `reservationGroupId` resolution strictly at the boundary and enforce `reservationId` internally.
