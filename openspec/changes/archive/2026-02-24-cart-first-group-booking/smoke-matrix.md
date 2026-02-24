# Smoke Matrix - cart-first-group-booking

Date executed: 2026-02-24 00:39 +08:00

## Automated validation gates

- `pnpm lint` -> pass (non-blocking repository warnings only)
- `pnpm test:unit -- src/__tests__/lib/modules/reservation/reservation.router.test.ts src/__tests__/modules/reservation/reservation.service.test.ts src/__tests__/modules/reservation/reservation-owner.service.test.ts src/__tests__/lib/modules/chat/chat-inbox.router.test.ts src/__tests__/lib/modules/chat/services/chat-inbox.service.test.ts src/__tests__/lib/modules/chat/services/reservation-chat.service.test.ts src/__tests__/lib/modules/chat/shared/domain.test.ts src/__tests__/lib/modules/chat/shared/transform.test.ts src/__tests__/modules/notification-delivery/notification-delivery.service.test.ts` -> pass

## Grouped and single flow smoke matrix (backend-focused)

| Area | Scenario | Status | Evidence |
| --- | --- | --- | --- |
| Player grouped reservations | Group detail/payment contracts are available and valid for player-owned groups | PASS | `src/__tests__/lib/modules/reservation/reservation.router.test.ts`, `src/__tests__/modules/reservation/reservation.service.test.ts` |
| Player grouped atomicity | Group payment marks payable children atomically, no partial transition on invalid child | PASS | `src/__tests__/modules/reservation/reservation.service.test.ts` |
| Player single compatibility | Existing single reservation detail/payment behaviors remain unchanged | PASS | `src/__tests__/lib/modules/reservation/reservation.router.test.ts`, `src/__tests__/modules/reservation/reservation.service.test.ts` |
| Owner grouped actions | Owner accept/reject/confirm group actions execute through group semantics | PASS | `src/__tests__/modules/reservation/reservation-owner.service.test.ts` |
| Owner single compatibility | Owner non-group actions remain compatible | PASS | `src/__tests__/modules/reservation/reservation-owner.service.test.ts` |
| Chat grouped thread | Group session/message contracts use reservation-group thread identity | PASS | `src/__tests__/lib/modules/chat/services/reservation-chat.service.test.ts`, `src/__tests__/lib/modules/chat/shared/domain.test.ts`, `src/__tests__/lib/modules/chat/shared/transform.test.ts` |
| Chat single compatibility | Reservation-level chat contracts remain functional | PASS | `src/__tests__/lib/modules/chat/chat-inbox.router.test.ts`, `src/__tests__/lib/modules/chat/services/chat-inbox.service.test.ts`, `src/__tests__/lib/modules/chat/services/reservation-chat.service.test.ts` |
| Notifications grouped events | `reservation_group.*` enqueue/idempotency behavior is correct | PASS | `src/__tests__/modules/notification-delivery/notification-delivery.service.test.ts` |
| Notifications single compatibility | Existing `reservation.*` behavior remains intact for non-group flows | PASS | `src/__tests__/modules/notification-delivery/notification-delivery.service.test.ts` |

## Notes

- Validation aligns with:
  - `guides/client/core/testing.md` (behavioral tests, mirrored `src/__tests__` structure, deterministic assertions)
  - `guides/server/core/testing-service-layer.md` (layer-appropriate service/router coverage and deterministic doubles)
- No failing gates remain for this change in the current workspace state.
