## Why

Grouped reservation creation is already available, but players and owners still handle many post-checkout steps as separate reservations (separate detail/payment surfaces, separate chat threads, and per-item notifications). This causes fragmented operations and defeats the expected cart-like booking experience.

## What Changes

- Upgrade grouped bookings to a group-first lifecycle after checkout for both players and owners.
- Add a canonical player group detail flow and route grouped checkout to that surface by default.
- Add group-level payment submission semantics so grouped payable items are processed as one booking unit.
- Add group-level reservation chat contracts so grouped bookings use one shared conversation instead of per-item thread fragmentation.
- Add group-level notification delivery contracts and dispatch behavior for reservation lifecycle events.
- Keep existing single-reservation contracts and routes backward compatible.
- Add comprehensive testing requirements tied to `guides/client/core/testing.md` and `guides/server/core/testing-service-layer.md`.

## Capabilities

### New Capabilities
- `reservation-group-notification-delivery`: Group-level notification contracts and lifecycle dispatch behavior for reservation groups.

### Modified Capabilities
- `reservation-group-booking`: Expand grouped booking semantics from create/owner actions into full cart-like lifecycle handling.
- `reservation`: Add group-first player read/payment semantics while preserving existing single-reservation behavior.
- `discovery`: Ensure grouped checkout transitions to group-first post-booking handling.
- `chat`: Add reservation-group thread/session/message semantics while keeping existing reservation-level chat compatibility.

## Impact

- Backend: reservation DTOs/routers/services, chat routers/services/thread identity helpers, notification-delivery payloads and cron dispatcher event handling.
- Frontend: player reservation list/detail/payment flows, owner reservation inbox/detail handling, chat widget/session integration points.
- Contracts: additive group-level APIs/events for chat and notifications; no removal of existing single-reservation contracts.
- Testing: new and modified tests across `src/__tests__/features/**` and `src/__tests__/modules/**` mirror trees, aligned to both client and server testing guides.
