# Phase 3: Owner UI

**Dependencies:** Phase 2 complete  
**Parallelizable:** Yes (with admin/public UI)  
**User Stories:** US-19-01, US-19-04

---

## Objective

Add an owner-facing verification request flow and a reservation enable/disable toggle on the owner place management pages.

---

## Modules

### Module 3A: Request Verification UI

**User Story:** `US-19-01`

Owner place page requirements:

- Show a clear verification status chip: `Unverified`, `Pending`, `Verified`, `Rejected`.
- If unverified/rejected:
  - Show "Request Verification" CTA.
  - Dialog supports notes + uploading documents.
- If pending:
  - Disable CTA and show "Pending review".

---

### Module 3B: Enable Reservation Support Toggle

**User Story:** `US-19-04`

Owner place page requirements:

- Add "Reservation support" toggle.
- If place is not verified:
  - Toggle disabled with helper text.
- If verified:
  - Toggle enabled.
- On toggle change:
  - Show toast success/failure.
  - UI reflects updated bookable status.

---

## QA Checklist

- [ ] Owner UX prevents submitting without documents.
- [ ] Owner sees admin rejection reason.
- [ ] Toggle is disabled until verified.
