# Phase 2: Verification Filter + Trust Badge

**Dependencies:** Existing discovery list + filters
**Parallelizable:** Partial (backend + UI can be done in parallel once DTO is set)

---

## Objective

Add a discovery filter for verification tier and introduce a consistent trust badge on court cards.

Prioritization (default ordering):
1. Verified reservable (placeType=RESERVABLE + verification.status=VERIFIED)
2. Curated (placeType=CURATED)
3. Non-verified reservable (placeType=RESERVABLE + not verified)

---

## Module 2A: Backend Discovery Support

### API Changes

| Endpoint | Method | Input | Output |
| --- | --- | --- | --- |
| `place.list` | Query | Add `verificationTier?: "verified_reservable" | "curated" | "unverified_reservable"` | Include `placeType` + `verificationStatus` in items |

### Repository

- Add left join of `place_verification` inside `PlaceRepository.list`.
- Apply ordering by computed rank:
  - 0: `RESERVABLE && verification.status == VERIFIED`
  - 1: `CURATED`
  - 2: else
- If `verificationTier` is specified, add corresponding where clause.

---

## Module 2B: Frontend Filters (URL + UI)

### URL State

- Add `verification` to discovery search params (nuqs).
- Add setter + clearAll behavior.

### UI

- Add a 3-option segmented control (ToggleGroup) to filters:
  - Verified
  - Curated
  - Unverified

---

## Module 2C: Trust Badge on Cards

### PlaceCard

- Display a small `ShieldCheck + Verified` badge when `verificationStatus === "VERIFIED"` and `placeType === "RESERVABLE"`.
- (Optional) Show `Curated` badge when `placeType === "CURATED"`.

---

## Testing Checklist

- [ ] `/courts` ordering matches prioritization across pagination.
- [ ] Filter selects correct subset.
- [ ] Badge renders in list + map cards.
- [ ] `pnpm lint` + `pnpm build` pass.
