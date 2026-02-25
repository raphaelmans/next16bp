## 1. Data model and contracts

- [x] 1.1 Add `reservation_group` DB schema and migration with optional `reservation.groupId` foreign key.
- [x] 1.2 Add grouped reservation DTOs and router procedures for player create and owner group actions.
- [x] 1.3 Add shared reservation group domain helpers for invariants, totals, and status derivation.

## 2. Service and repository implementation

- [x] 2.1 Implement repository support for creating and reading reservation groups and child items.
- [x] 2.2 Implement `ReservationService.createMultiCourt` with transactional all-or-nothing behavior.
- [x] 2.3 Implement owner group handling methods (accept/reject/confirm) with atomic transitions.

## 3. Client integration

- [x] 3.1 Add reservation feature API + hooks for grouped reservation create flow.
- [x] 3.2 Update booking page flow to submit grouped payloads (different times per item).
- [x] 3.3 Update owner reservation hooks/UI mapping to handle grouped reservation actions and details.

## 4. Testing and regression safety

- [x] 4.1 Add pure unit tests for reservation group domain/helpers (table-driven edge cases).
- [x] 4.2 Add service-layer tests for create and owner group action atomicity and rollback.
- [x] 4.3 Add router contract tests and compatibility tests for existing single-court flows.
- [ ] 4.4 Run `pnpm lint` and validate manual smoke matrix paths for single and grouped bookings.
