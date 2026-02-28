## Context

Booking correctness is highly sensitive to eligibility, availability, pricing, and profile completeness. Existing tests cover selected paths, but primary booking entrypoints need broader and more explicit behavioral coverage.

Targeted modules:
- `src/lib/modules/reservation/services/reservation.service.ts`
- `src/lib/modules/reservation/reservation.router.ts`

## Goals / Non-Goals

**Goals**
- Expand booking entrypoint tests for court/any-court/group creation flows.
- Expand router-level contract and error mapping tests for player booking actions.
- Lock down major booking constraints (profile, availability, verification, addons, pricing).

**Non-Goals**
- Change booking business rules.
- Introduce end-to-end browser tests.

## Decisions

### 1. Service tests own booking rule behavior
Service-level tests assert domain outcomes and repository side effects for booking decisions.

### 2. Router tests own transport semantics
Router tests validate call contracts and TRPC error mappings for booking actions.

### 3. Group and single booking parity is explicit
Tests must verify equivalent rules across single and grouped booking paths where behavior should match.

## Risks / Trade-offs

- Over-mocking can hide rule regressions; tests should prioritize observable outputs over internal call detail.
- Pricing behavior is complex; tests should include failure and mixed-currency guard rails.
