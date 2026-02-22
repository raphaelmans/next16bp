## Why

Players currently submit one reservation per checkout, which prevents booking multiple courts in one flow and creates fragmented owner handling. We need a grouped multi-court flow that supports different time ranges per court while preserving single-court compatibility and preventing regressions.

## What Changes

- Add grouped reservation creation for players with multiple items in one request (same place, different times allowed).
- Add owner group handling actions to process grouped reservations atomically.
- Extend reservation read/list contracts to expose reservation groups and child items.
- Keep existing single-court player and owner APIs intact for compatibility.
- Add database support for reservation grouping and child linkage.
- Add regression-first test coverage for domain, service, router contract, and client helpers.

## Capabilities

### New Capabilities

- `reservation-group-booking`: Grouped reservation creation and lifecycle handling across multiple reservation items.

### Modified Capabilities

- `reservation`: Add grouped reservation request/response semantics while preserving single reservation behavior.
- `discovery`: Extend booking flow to submit multi-court grouped requests.

## Impact

- Backend: reservation DTOs, routers, service layer, repositories, DB schema/migrations, and tests.
- Frontend: reservation booking page flow, reservation feature hooks/APIs, owner reservation handling hooks/UI, and tests.
- Data model: new reservation group table and reservation-to-group linkage.
- Operational: increased validation and transaction-path coverage to avoid partial writes and status drift.
