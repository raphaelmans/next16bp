## Context

`schedule-pricing-addons` delivered runtime behavior and migration support for HOURLY/FLAT add-on pricing, but current verification is centered on contract scripts rather than a maintained unit-test suite in mirrored `src/__tests__/` structure. The next phase will integrate these behaviors deeper into UI flows, so we need deterministic unit coverage now for pricing semantics and service-layer invariants before expanding surface area.

Key constraints:
- Follow `guides/client/core/testing.md` for mirrored test layout, AAA structure, and client-side test doubles policy.
- Follow `guides/server/core/testing-service-layer.md` for layer-isolated service tests and deterministic boundary doubles.
- Preserve behavior parity from `schedule-pricing-addons`; this is a confidence and regression change, not a feature redesign.

## Goals / Non-Goals

**Goals:**
- Add deterministic unit tests for add-on pricing behaviors that are critical to upcoming UI integration.
- Add service-layer unit tests for add-on validation and invariants using interface-based doubles.
- Establish reusable fixtures for golden/minimal/invalid schedule add-on scenarios.
- Ensure tests are runnable in a repeatable local/CI workflow.

**Non-Goals:**
- Changing runtime pricing rules, API contracts, or database schema.
- Replacing broader contract/integration coverage with unit tests.
- UI refactors or interaction redesign in this change.

## Decisions

1. **Target highest-risk logic first (pricing engine + service validation)**
   - Decision: Prioritize unit tests around shared pricing evaluation (`OPTIONAL`, `AUTO`, `HOURLY`, `FLAT`, currency mismatch) and `court-addon` service validation/invariant paths.
   - Rationale: These paths drive billing correctness and warning behavior consumed by UI integration.
   - Alternatives considered:
     - Broad unit coverage across all modules immediately: more complete, but slower and less focused for pre-integration readiness.

2. **Use mirrored `src/__tests__/` layout with layer isolation**
   - Decision: Place tests in `src/__tests__/` paths that mirror source modules and keep each layer isolated with boundary doubles.
   - Rationale: Aligns with project testing standards and keeps navigation/mechanics predictable.
   - Alternatives considered:
     - Colocated tests near source: faster to author, but conflicts with project testing conventions.

3. **Use table-driven fixtures for core pricing scenarios**
   - Decision: Reuse deterministic fixtures based on existing contract scenarios (optional unselected, auto partial coverage warning, flat charged once, currency mismatch) and split into golden/minimal/invalid groups.
   - Rationale: Reduces drift between documented behavior and unit assertions while keeping tests explicit.
   - Alternatives considered:
     - Inline ad hoc data per test: less setup, but higher duplication and weaker regression clarity.

4. **Preserve contract scripts and add unit tests as complementary layers**
   - Decision: Keep contract scripts for broader parity checks while adding focused unit tests for fast feedback and branch-level confidence.
   - Rationale: Unit tests improve iteration speed; contract checks remain useful for scenario parity.
   - Alternatives considered:
     - Replacing contract scripts outright: risky during transition and removes existing guardrails.

## Risks / Trade-offs

- [Risk] No established unit-test harness may slow initial implementation -> Mitigation: introduce/standardize one runner and command in this change before writing broader cases.
- [Risk] Fixture duplication between contract and unit tests can drift -> Mitigation: centralize shared fixture builders and scenario naming.
- [Risk] Over-mocking can hide logic defects -> Mitigation: follow fake/stub-first policy and assert behavior through public methods.
- [Trade-off] Focused pre-integration scope leaves some peripheral modules untested -> Mitigation: document follow-up coverage items after UI integration starts.

## Migration Plan

1. Add or standardize test harness wiring and scripts required to run unit tests in CI/local.
2. Add shared pricing unit tests for deterministic add-on pricing scenarios.
3. Add service-layer unit tests for add-on validation and rule-invariant behavior.
4. Add fixture utilities and invalid-case regression fixtures aligned with testing guides.
5. Run lint and test commands, then record any remaining coverage gaps as follow-up tasks.

Rollback strategy:
- Test-only changes can be reverted without runtime impact.
- If harness setup causes workflow issues, keep existing contract scripts as temporary verification path while resolving harness configuration.

## Open Questions

- Should the initial scope include reservation/availability service unit tests now, or stage those right after UI integration kickoff?
- Do we want a dedicated CI job for add-on pricing unit tests, or include them in a broader unit-test lane?
