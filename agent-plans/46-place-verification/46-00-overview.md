# Place Verification (Owner -> Admin Review) - Master Plan

## Overview

Add a per-place verification request workflow for organization owners, so that owner-created places can remain publicly discoverable but are not bookable until:

1. An admin verifies the place (based on uploaded documents), and
2. The owner explicitly enables reservation support.

This mirrors the existing `claim_request` pattern (request table + event/audit table driving a state field on `place`), but applies it to owner-created places.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/19-place-verification/` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| PRD | `business-contexts/kudoscourts-prd-v1.2.md` |
| ERD | `business-contexts/kudoscourts-erd-specification-v1.2.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Data model + migrations | 1A, 1B, 1C | Partial |
| 2 | Backend API + booking enforcement | 2A, 2B, 2C | Partial |
| 3 | Owner UX (request + enable toggle) | 3A, 3B | Yes |
| 4 | Admin UX (queue + review) | 4A | Yes |
| 5 | Public UX (status + disabled booking) | 5A | Yes |

---

## Module Index

### Phase 1: Data model + migrations

| ID | Module | Plan File |
|----|--------|-----------|
| 1A | Add verification + reservation-enable fields to `place` | `46-01-data-model.md` |
| 1B | Add place verification request tables + events + documents | `46-01-data-model.md` |
| 1C | Storage bucket + upload constraints for verification documents | `46-01-data-model.md` |

### Phase 2: Backend API + booking enforcement

| ID | Module | Plan File |
|----|--------|-----------|
| 2A | Owner endpoints: submit request + attach docs | `46-02-backend-api.md` |
| 2B | Admin endpoints: list pending + approve/reject | `46-02-backend-api.md` |
| 2C | Enforce not-bookable when unverified / disabled | `46-02-backend-api.md` |

### Phase 3: Owner UX

| ID | Module | Plan File |
|----|--------|-----------|
| 3A | Owner place page: request verification flow | `46-03-owner-ui.md` |
| 3B | Owner place page: enable/disable reservation support | `46-03-owner-ui.md` |

### Phase 4: Admin UX

| ID | Module | Plan File |
|----|--------|-----------|
| 4A | Admin list + detail review UI for verification requests | `46-04-admin-ui.md` |

### Phase 5: Public UX

| ID | Module | Plan File |
|----|--------|-----------|
| 5A | Public place detail: show status + disable booking | `46-05-public-ui.md` |

---

## Dependencies Graph

```
Phase 1 -----+----- Phase 2
             |
             +----- Phase 3
             |
             +----- Phase 4
             |
             +----- Phase 5
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Verification granularity | Per-place | A single org can own multiple venues with different proof requirements |
| Public visibility | Discoverable even when unverified | Maintain discovery value while preventing untrusted bookings |
| Booking gate | `place.verification_status` + `place.reservations_enabled` | Allows "verified but not ready" and "ready but blocked" states |
| Docs storage | Request-scoped documents table | Keeps audit trail and supports resubmission |

---

## Document Index

| Document | Description |
|----------|-------------|
| `46-00-overview.md` | This file |
| `46-01-data-model.md` | DB + storage schema |
| `46-02-backend-api.md` | Routers/services + enforcement points |
| `46-03-owner-ui.md` | Owner flows |
| `46-04-admin-ui.md` | Admin flows |
| `46-05-public-ui.md` | Public gating UX |

---

## Success Criteria

- [ ] Owners can submit place verification requests with documents.
- [ ] Admins can approve/reject requests and record review notes.
- [ ] Unverified places remain public but cannot be booked (server-enforced).
- [ ] Verified owners can enable reservation support; players can book only when enabled.
- [ ] `pnpm lint` and `pnpm build` pass (and `TZ=UTC pnpm build` for safety).
