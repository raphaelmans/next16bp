# Developer 1 Checklist

**Focus Area:** Backend pricing foundations  
**Modules:** 1A, 1B

---

## Module 1A: Default Price Data Model + DTOs

**Reference:** `12-01-backend-pricing-foundation.md`  
**User Story:** `US-02-06`  
**Dependencies:** None

### Setup

- [ ] Review `reservable_court_detail` schema and existing DTOs
- [ ] Confirm currency handling matches format helpers

### Implementation

- [ ] Add `default_price_cents` to schema + types
- [ ] Extend create/update DTOs for default price
- [ ] Persist default price in create/update use cases
- [ ] Ensure free courts clear default price

### Testing

- [ ] Create court with default price
- [ ] Update default price on existing court
- [ ] Verify detail response includes default price

---

## Module 1B: Reservation Pricing Fallback

**Reference:** `12-01-backend-pricing-foundation.md`  
**User Story:** `US-06-03`  
**Dependencies:** Module 1A

### Implementation

- [ ] Update reservation service to detect paid courts via default price
- [ ] Update reservation list query to use default price fallback
- [ ] Extend time slot detail query with default price + currency

### Testing

- [ ] Paid reservation uses default price when slot price null
- [ ] Reservation list shows correct amount
- [ ] Payment page receives default price fallback

---

## Parallelization Summary

| Sequence | Task 1 | Task 2 |
|----------|--------|--------|
| First | Module 1A | - |
| Then | Module 1B | - |

---

## Final Checklist

- [ ] All modules complete
- [ ] No TypeScript errors
- [ ] Integration tested
