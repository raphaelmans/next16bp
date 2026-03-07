## Context

The previous reservation-first optimization established the client-side availability sync foundation, including canonical query keys, cache patch helpers, and focus/reconnect recovery. What remains is the server-side event contract for public discovery availability.

Today, reservation realtime events do not carry enough scope to patch public discovery availability caches. Court-specific public availability can be patched accurately from a slot event, but place-sport aggregate caches often cannot. This design adds a dedicated availability event stream and explicitly supports a mixed strategy: direct patch where exact court-scoped slot state is available, scoped invalidation where aggregate patching is not safe.

## Goals / Non-Goals

**Goals:**
- Add a dedicated availability change event table and realtime client contract.
- Emit events from reservation and court-block mutations that affect public bookability.
- Patch court-day and court-range discovery caches directly from event payloads.
- Invalidate/refetch place-sport aggregate caches when exact patching is not possible.
- Preserve focus/reconnect recovery behavior for missed events.

**Non-Goals:**
- Perfectly patch every aggregate place-sport cache from one event.
- Replace authoritative availability queries.
- Redesign the reservation realtime event stream.

## Decisions

### 1. Use a dedicated availability change event table
Availability changes will not be overloaded onto `reservation_event`. A dedicated table keeps the payload purpose-specific and allows client subscriptions to target availability semantics directly.

### 2. Emit option-shaped court-slot payloads
The event payload will mirror the subset of `AvailabilityOption` fields needed to patch court-scoped caches directly: court scope, time range, slot status, unavailable reason, and price/currency when available.

### 3. Patch court caches, invalidate aggregate caches
Court-day and court-range caches can patch exact slot state from the event. Place-sport aggregate caches will use scoped invalidation because they do not currently request per-court options and cannot be recomputed safely from a single-court event.

### 4. Emit only on bookability-changing mutations
Reservation lifecycle transitions that do not change slot occupancy will not emit redundant availability change events. Reservation create/release and court-block create/cancel/reschedule are the primary sources.

## Risks / Trade-offs

- [Aggregate place-sport views still refetch] → Accept scoped invalidation for aggregates until those queries request enough court detail for safe patching.
- [Release events may not carry perfect pricing for newly available slots] → Patch matching cached options directly and rely on focus/reconnect refetch to correct stale pricing if needed.
- [Missed producers leave holes in availability sync] → Cover reservation create/release, stale expiry, court-block create/cancel/update, and walk-in conversion paths explicitly.
