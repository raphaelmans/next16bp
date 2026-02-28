## Context

Reservation lifecycle flows involve both player and owner services, state transitions across single/group reservations, and side effects through notifications/chat integrations. Existing coverage captures selected areas but does not fully lock transition safety and parity.

Targeted modules:
- `src/lib/modules/reservation/services/reservation.service.ts`
- `src/lib/modules/reservation/services/reservation-owner.service.ts`
- `src/lib/modules/reservation/reservation-owner.router.ts`

## Goals / Non-Goals

**Goals**
- Expand lifecycle transition tests for player and owner actions.
- Ensure single/group transition parity.
- Lock router contract behavior for owner reservation actions.
- Cover lifecycle side effects (notification/chat trigger points) at integration-with-mocks level.

**Non-Goals**
- Introduce new lifecycle states.
- Redesign reservation routing contracts.

## Decisions

### 1. Transition legality is tested explicitly
Each owner/player lifecycle method must have success and invalid-transition tests.

### 2. Single/group parity is mandatory
Where behavior should match for single and grouped reservations, paired tests are required.

### 3. Router contracts remain stable
Owner router tests assert endpoints continue delegating to corresponding service methods and map domain errors correctly.

## Risks / Trade-offs

- State-heavy fixtures can become repetitive; reuse harness builders where possible.
- Overfitting tests to internal event sequencing should be avoided unless sequence is observable behavior.
