## Tasks

- [x] Add canonical reservation and availability query-key registries in `src/common/query-keys/` and shared serialization helpers for stable scope keys.
- [x] Add a centralized reservation-domain sync helper that maps realtime reservation and availability events to scoped React Query patching and invalidation.
- [x] Refactor reservation owner hooks to expose canonical summary, entity, linked-detail, count, and projection query units instead of broad consumer-specific reads.
- [x] Refactor reservation player hooks and detail/payment consumers to reuse canonical entity and linked-detail queries keyed by `reservationId`.
- [x] Refactor owner reservation list, active reservations, alerts panel, sidebar counts, and dashboard widgets to consume canonical summary/count/projection hooks.
- [x] Refactor availability consumers to use scoped availability query keys and hybrid sync behavior with authoritative court/day/range and place-sport refetch.
- [x] Synchronize reservation-linked chat context and the in-app reservation notification inbox through the shared reservation sync helper while leaving async delivery infrastructure unchanged.
- [x] Add or update tests for query-key stability, scoped sync behavior, cross-surface convergence, and availability authoritative refetch behavior.
- [ ] Add a scope-rich `availability.changed` server realtime event contract so public discovery availability caches can apply event-carried slot/bookability patches directly.
