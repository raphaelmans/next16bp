# Phase 5: Deprecation + Removal of `reservable_place_policy`

**Dependencies:** Phases 1–4 complete  
**Parallelizable:** No  
**User Stories:** US-15-05 (and supports US-15-01..04)

---

## Objective

Remove the legacy place-scoped policy table and its usage after org-scoped policy + payment methods are live.

---

## Removal Scope

### Data

- Drop `reservable_place_policy` after migration/backfill (if any).

### Code References to Remove/Refactor

- Place creation currently inserts a policy row (remove).
- Claim approval inserts a policy row (remove).
- Reservation TTL/policy reads move to org policy.
- Any response shapes exposing `paymentDetails` from place policy must be removed.

---

## Rollout Strategy

### Safe Rollout (recommended)

1. Add org tables + populate defaults.
2. Ship backend endpoints + UI reading org tables.
3. Disable/remove payment detail joins on public endpoints.
4. Remove legacy table usage.
5. Drop `reservable_place_policy`.

---

## Regression Risks

- TTL behavior changes if policy values differ.
- Public endpoints must not leak payment info.
- Owners with no methods configured should still have a coherent player UX fallback.

---

## Validation Checklist

- [ ] Creating a place no longer depends on legacy policy.
- [ ] Reservation TTLs still behave (owner review, payment hold, cancellation cutoff).
- [ ] No public API includes account numbers.
- [ ] `pnpm lint` + `pnpm build` pass.
