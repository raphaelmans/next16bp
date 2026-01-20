# Phase 5: Admin UI (Review Queue + Approval)

**Dependencies:** Phase 2 complete  
**Parallelizable:** Yes  
**User Stories:** US-20-03

---

## Objective

Add lightweight admin moderation controls for user-submitted curated courts.

Admins can:
- filter for pending/approved/rejected submissions
- see submitter email
- approve or reject

---

## Admin Courts List

### Filters

Add an Approval filter:

- All
- Pending approval (isApproved=false, isActive=true)
- Approved (isApproved=true)
- Rejected (isApproved=false, isActive=false)

### Table

Add a “Submitted by” column:
- show `submittedByEmailSnapshot` when present
- show `-` for admin-created curated entries

---

## Admin Court Detail

Show:
- approval status
- submitter email

Actions when pending:
- Approve (optional review notes)
- Reject (review notes required)

---

## State Updates

After approve/reject:
- invalidate admin court list and detail queries
