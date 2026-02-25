## Context

The current pricing path supports base hourly pricing through hours windows, rate rules, and timestamp overrides. The proposal introduces v2 add-ons with two pricing types (`HOURLY`, `FLAT`) and two active modes (`OPTIONAL`, `AUTO`) while deferring `AUTO_STRICT`. This change spans data model, pricing evaluation flow, validation behavior, and migration sequencing, and must stay consistent with:
- `docs/schedule-pricing-addons-erd.md`
- `docs/schedule-pricing-addons-state-machine.md`
- `docs/schedule-pricing-addons-v2-alignment-review.md`

Primary constraints:
- Booking pricing still evaluates in 60-minute segments.
- Currency must remain consistent with base booking currency.
- Rule overlap protections should match existing schedule/rate-rule service patterns.

## Goals / Non-Goals

**Goals:**
- Define a single, deterministic architecture for v2 add-on pricing from persistence through runtime evaluation.
- Keep behavior explicit for uncovered segments (`AUTO` contributes `+0`, no booking rejection).
- Support `FLAT` add-ons as one-time charges triggered by first overlap.
- Provide a safe rollout plan that can be validated and rolled back without data loss.

**Non-Goals:**
- Implementing `AUTO_STRICT` behavior in this change.
- Redesigning unrelated booking, availability, or checkout UX.
- Introducing one-off add-on override tables in this phase.

## Decisions

1. **Single add-on applicability source (`court_addon_rate_rule`)**
   - Decision: Use one rule table for both HOURLY charging windows and FLAT availability windows.
   - Rationale: Minimizes branching in pricing logic and keeps operational semantics uniform.
   - Alternatives considered:
     - Separate hourly and flat rule tables: clearer per-type schema, but duplicates validation and conflict logic.
     - Rule-less FLAT add-ons (always-on): simpler schema, but cannot represent time-scoped flat offers.

2. **Type-driven add-on value storage**
   - Decision: Store FLAT value on `court_addon` (`flat_fee_cents`, `flat_fee_currency`), HOURLY value on `court_addon_rate_rule` (`hourly_rate_cents`, `currency`).
   - Rationale: Matches v2 semantics and avoids redundant per-rule flat fee duplication.
   - Alternatives considered:
     - Store all amounts on rules: flexible but duplicates FLAT value and complicates one-time charge logic.

3. **Deterministic runtime evaluation model**
   - Decision: Reuse segment-by-segment evaluation; base pricing resolves first, then add-ons apply per segment (`HOURLY`) and first-overlap trigger (`FLAT`).
   - Rationale: Preserves existing pricing engine mental model and supports predictable traceability.
   - Alternatives considered:
     - Separate post-pass for all add-ons only after base total: simpler control flow, weaker per-segment diagnostics and overlap traceability.

4. **AUTO behavior and validation separation**
   - Decision: `AUTO` applies only where rules match; uncovered segments add `+0`; surface partial coverage as owner/admin warning instead of hard booking failure.
   - Rationale: Aligns with v2 intent and reduces false rejections while still exposing operational gaps.
   - Alternatives considered:
     - Reject on uncovered segments (`AUTO_STRICT`-like): stronger correctness guarantees, but incompatible with current desired behavior.

5. **Service-layer invariant enforcement**
   - Decision: Keep non-overlap and value-field consistency checks in service-layer validation (same pattern as base rate-rule validation).
   - Rationale: Centralizes domain invariants and avoids partial DB-level enforcement that is difficult to evolve.
   - Alternatives considered:
     - DB-only constraints/triggers: stronger enforcement, but harder to maintain and version with evolving business rules.

## Risks / Trade-offs

- [Risk] Schema migration introduces mixed-state data during rollout -> Mitigation: additive migration first, backfill + validation job, then enforce stricter app-side checks.
- [Risk] Ambiguous rule overlap behavior could cause nondeterministic pricing -> Mitigation: enforce no-overlap per add-on/day in service layer and add parity test fixtures.
- [Risk] Currency mismatches between base and add-ons create runtime failures -> Mitigation: pre-save validation and runtime guard with explicit error code.
- [Risk] `AUTO` uncovered windows may hide owner misconfiguration -> Mitigation: emit structured warnings and expose diagnostics in admin tooling.
- [Trade-off] Deferring `AUTO_STRICT` reduces immediate enforcement options -> Mitigation: reserve enum/engine extension path with documented insertion points.

## Migration Plan

1. Additive schema migration:
   - Add `pricing_type`, `flat_fee_cents`, `flat_fee_currency` to `court_addon`.
   - Ensure `court_addon_rate_rule` supports HOURLY fields as canonical rule pricing fields.
2. Data normalization/backfill:
   - Map existing add-ons to `HOURLY` or `FLAT`.
   - Backfill FLAT values to add-on rows and clean obsolete dual-table assumptions.
3. Service-layer update:
   - Introduce invariant checks for type-specific required fields, non-overlap, and currency matching.
4. Pricing engine update:
   - Apply deterministic HOURLY and FLAT semantics in segment evaluation.
5. Validation and observability:
   - Add warnings for partial `AUTO` coverage and parity checks against documented scenarios.
6. Rollout:
   - Deploy migration + code behind controlled release sequence; monitor pricing mismatches.

Rollback strategy:
- Keep migrations additive at first and retain compatibility read paths until validation is complete.
- If regressions appear, disable new add-on evaluation path and revert to prior pricing behavior while preserving written data.

## Open Questions

- Should admin warnings for partial `AUTO` coverage be surfaced only in management UI, or also in internal booking audit logs?
- Do we need explicit deterministic tie-break rules if future requirements allow overlapping windows?
- Should currency mismatch be a hard error in all contexts, or configurable for internal testing environments?
