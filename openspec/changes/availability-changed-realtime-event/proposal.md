## Why

Public discovery availability still lacks a scope-rich realtime event contract. The current reservation realtime payload only carries `reservationId` and lifecycle status, which is insufficient for public discovery availability caches to apply direct slot/bookability patches safely.

The client-side availability sync foundation is already in place. The next step is to add a dedicated server-emitted `availability.changed` event so discovery availability can consume event-carried state directly for court-scoped caches and use authoritative refetch for aggregate place-sport views when a direct patch is not safe.

## What Changes

- Add a dedicated availability realtime event contract for slot/bookability changes.
- Emit `availability.changed` events from reservation and court-block mutations that change public bookability.
- Subscribe discovery availability consumers to the new event stream.
- Patch court-scoped availability caches directly from the event payload.
- Use scoped invalidation/refetch for place-sport aggregate availability caches when exact direct patching is not possible.
- Add support scripts and schema changes needed to expose the new realtime table through Supabase Realtime.

## Capabilities

### New Capabilities
- `availability-changed-realtime-event`: Scope-rich availability change events for public discovery availability patching and aggregate refetch fallback.

### Modified Capabilities

None.

## Impact

- Affected server domains: `availability`, `reservation`, `court-block`, and shared database schema/migrations.
- Affected client domains: discovery availability hooks and realtime clients.
- Affected infrastructure: Supabase realtime publication setup for the new availability event table.
