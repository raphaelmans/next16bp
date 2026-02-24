## 1. Reservation Group Contracts and Services

- [x] 1.1 Add reservation-group player read/payment DTOs and router procedures (additive to existing single-reservation procedures).
- [x] 1.2 Implement service-layer group detail and group payment orchestration with atomic transition semantics for payable child reservations.
- [x] 1.3 Extend repository support for reservation-group detail reads needed by player and owner grouped surfaces.
- [x] 1.4 Preserve and verify backward-compatible behavior for existing `createForCourt`, `createForAnyCourt`, and single-reservation payment/detail flows.

## 2. Player Group-First Flow

- [x] 2.1 Update grouped checkout success handling to route players to reservation-group detail instead of itemized fallback list handling.
- [x] 2.2 Add/adjust reservation feature API and hooks for group detail and group payment actions in the canonical client data chain.
- [x] 2.3 Implement player reservation-group detail/payment UI states with itemized child breakdown and unified lifecycle actions.
- [x] 2.4 Keep existing single-reservation detail/payment routes functional and unchanged for non-group flows.

## 3. Owner Group-First Inbox and Detail Handling

- [x] 3.1 Update owner reservation list mapping so grouped bookings render one primary actionable row/card with expandable itemized child details.
- [x] 3.2 Update owner detail flow to use reservation-group-centric primary actions for grouped bookings.
- [x] 3.3 Ensure owner accept/reject/confirm actions call group endpoints when `reservationGroupId` exists and reservation endpoints otherwise.
- [x] 3.4 Preserve owner behavior for non-group reservations.

## 4. Group Chat Consolidation

- [x] 4.1 Add reservation-group chat thread identity helpers and additive router/service contracts for group session/meta/message operations.
- [x] 4.2 Update grouped reservation chat entry points to open group chat threads instead of creating fragmented per-item reservation threads.
- [x] 4.3 Update chat inbox/meta adapters to include grouped booking thread metadata while preserving existing reservation thread support.
- [x] 4.4 Keep existing reservation-level chat contracts for legacy and non-group paths.

## 5. Group Notification Delivery Consolidation

- [x] 5.1 Add group-level notification payload schemas and delivery-service enqueue methods for reservation-group lifecycle events.
- [x] 5.2 Add dispatcher support for `reservation_group.*` event rendering, deep links, and push tags.
- [x] 5.3 Ensure grouped flows emit only group-level lifecycle notifications while non-group flows continue emitting existing reservation-level events.
- [x] 5.4 Preserve idempotency semantics with group-scoped event keys for grouped events.

## 6. Testing and Validation Gates (Mandatory)

- [x] 6.1 Add/adjust client tests in mirrored `src/__tests__/features/**` structure per `guides/client/core/testing.md` (`api.test.ts`, `hooks.test.ts`, and table-driven `domain/helpers` tests as applicable).
- [x] 6.2 Add/adjust server tests in mirrored `src/__tests__/modules/**` structure per `guides/server/core/testing-service-layer.md` (router/controller, service, and repository contracts as applicable).
- [x] 6.3 Add regression tests for grouped atomicity (group payment, owner group actions) and explicit compatibility tests for unchanged single-reservation behavior.
- [x] 6.4 Enforce deterministic offline test doubles at boundaries and avoid private-method/internal-call-order assertions unless behavior requires it.
- [x] 6.5 Run `pnpm lint` and execute manual smoke matrix for grouped and single booking flows (player + owner + chat + notifications). Completed on 2026-02-24 00:39 +08:00. Evidence captured in `openspec/changes/cart-first-group-booking/smoke-matrix.md`.
