# Phase 3: Owner Court UI

**Dependencies:** Phase 1 complete  
**Parallelizable:** Yes  
**User Stories:** US-12-01

---

## Objective

Expose per-court reservation policy settings to the owner in the court edit/settings flow.

---

## Module 3A: Reservation Policies Section

### UI Fields (MVP)

- Require owner confirmation (toggle)
- Payment hold minutes (number)
- Owner review minutes (number)
- Cancellation cutoff minutes (number)

### Save Mechanism

- Use existing owner detail update path (`courtManagement.updateDetail`).

### UX Notes

- Provide sensible helper text so owners understand each setting.
- Show defaults if values are not set.

---

## Testing Checklist

- [ ] Owner can update policies
- [ ] Values persist and reload
