# Phase 2: Backend Enforcement

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-12-02, US-12-03

---

## Objective

Enforce court-specific reservation policies in backend services and use-cases.

---

## Module 2A: TTL Policy Enforcement

### Current State

- Paid TTL is hardcoded to 15 minutes.
- Cron expires based on `reservation.expiresAt`.

### Target Behavior

- Paid reservation `expiresAt` uses `payment_hold_minutes` for the court.
- If owner confirmation is enabled, extend/replace `expiresAt` after player marks payment using `owner_review_minutes`.

### Open Question

- If owner confirmation is disabled: should `markPayment` auto-confirm immediately?

---

## Module 2B: Cancellation Across All States (With Cutoff)

### Target Behavior

- Player can cancel in any non-terminal status (including CONFIRMED), unless the cancellation cutoff has passed.
- On successful cancellation:
  - reservation becomes CANCELLED
  - slot becomes AVAILABLE
  - audit event is recorded

### Edge Conditions

- Cancelling EXPIRED/CANCELLED should be idempotent or return a clear error.

---

## Testing Checklist

- [ ] Paid reservation TTL uses court policy
- [ ] `PAYMENT_MARKED_BY_USER` does not expire too soon when confirmation is enabled
- [ ] Cancellation blocked when cutoff reached
- [ ] Slot status released on cancellation
