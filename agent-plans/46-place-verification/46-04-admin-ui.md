# Phase 4: Admin UI

**Dependencies:** Phase 2 complete  
**Parallelizable:** Yes (with owner/public UI)  
**User Stories:** US-19-02

---

## Objective

Add admin-facing screens to review verification requests and take approve/reject actions.

---

## Modules

### Module 4A: Verification Queue + Review Screen

**User Story:** `US-19-02`

Admin requirements:

- Pending list view:
  - Place name, city/province, org name, submitted date.
- Detail view:
  - Request notes.
  - Document gallery/list (click to view full).
  - Approve / Reject actions (reject requires reason).

---

## QA Checklist

- [ ] Admin cannot approve a request with zero documents.
- [ ] Approve/reject actions are idempotent (cannot double-review).
- [ ] Admin review notes are visible to owner.
