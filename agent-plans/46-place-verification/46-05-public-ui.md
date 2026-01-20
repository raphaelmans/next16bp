# Phase 5: Public UI

**Dependencies:** Phase 2 complete  
**Parallelizable:** Yes (with owner/admin UI)  
**User Stories:** US-19-03

---

## Objective

Ensure unverified/disabled places remain publicly discoverable but do not allow booking.

---

## Modules

### Module 5A: Place Detail Status + Booking Disabled

**User Story:** `US-19-03`

Public place detail requirements:

- Display a verification badge:
  - Unverified / Pending / Rejected (if not bookable)
  - Verified (optional)
- If not bookable, show a single clear CTA state:
  - Disabled "Reserve" button
  - Helper text: "Reservations are not enabled for this place."

Defensive behavior:

- Direct navigation to booking routes should show a user-safe error page/state.

---

## QA Checklist

- [ ] Unverified places appear in discovery.
- [ ] Booking CTA is disabled.
- [ ] Server blocks reservation creation for unverified/disabled places.
