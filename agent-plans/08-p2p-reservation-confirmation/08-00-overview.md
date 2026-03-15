# P2P Reservation Confirmation - Master Plan

## Overview

This plan implements the full P2P payment verification flow for KudosCourts, enhancing the simplified reservation flow in domains 06 and 07 with:

- 15-minute TTL countdown timer on payment page
- Owner's payment instructions display (GCash, bank details)
- Explicit Terms & Conditions acknowledgment checkbox
- Payment proof submission (reference number, notes, screenshot)
- Owner payment proof review when confirming reservations
- Proper expired reservation UI states

### Current State

| Layer | Status | Notes |
|-------|--------|-------|
| Database | Complete | `reservation.expires_at`, `payment_proof` table exist |
| Cron Job | Complete | `/api/cron/expire-reservations` implemented |
| Payment Proof Backend | Complete | `paymentProof.add/update/get` endpoints |
| Payment Details Storage | Complete | `reservable_court_detail` has GCash/bank fields |
| Payment Page UI | Simplified | Shows generic text, no timer, no proof form |
| Owner Proof View | Missing | Owner cannot see payment proof |
| Expired UI | Missing | No proper expired state handling |

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/08-p2p-reservation-confirmation/` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` Section 7, 8.4, 17 |
| File Upload Stories | `agent-plans/user-stories/10-asset-uploads/` |

---

## Development Phases

| Phase | Description | User Stories | Parallelizable |
|-------|-------------|--------------|----------------|
| 1 | Backend Enhancements | US-08-01-02, US-08-02-01, US-08-03-01 | Partial |
| 2 | Payment Page UI | US-08-01-01, US-08-01-02, US-08-01-03, US-08-01-04 | Yes |
| 3 | Owner Proof Review | US-08-02-02 | Depends on Phase 1 |
| 4 | Expiration Handling | US-08-03-02 | Depends on Phase 2 |

---

## Module Index

### Phase 1: Backend Enhancements

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 1A | Payment Details Endpoint | Add court payment details to slot response | `08-01-backend-enhancements.md` |
| 1B | Owner Proof Response | Include payment proof in owner reservation query | `08-01-backend-enhancements.md` |
| 1C | Vercel Cron Config | Configure cron job for production | `08-01-backend-enhancements.md` |

### Phase 2: Payment Page Enhancements

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 2A | Countdown Timer | Display TTL countdown with warning states | `08-02-payment-page-enhancements.md` |
| 2B | Payment Instructions | Fetch and display GCash/bank details | `08-02-payment-page-enhancements.md` |
| 2C | T&C Checkbox | Explicit legal acknowledgment | `08-02-payment-page-enhancements.md` |
| 2D | Proof Form | Reference number, notes, file upload | `08-02-payment-page-enhancements.md` |

### Phase 3: Owner Proof Review

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 3A | Proof Card Component | Display proof on reservation card | `08-03-owner-proof-review.md` |
| 3B | Image Preview | Thumbnail with zoom modal | `08-03-owner-proof-review.md` |

### Phase 4: Expiration Handling

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 4A | Expired UI Component | Reservation expired message | `08-04-expiration-handling.md` |
| 4B | Status Badges | Expired badge styling | `08-04-expiration-handling.md` |
| 4C | My Reservations | Expired state in list | `08-04-expiration-handling.md` |

---

## Dependencies Graph

```
Phase 1 ─────────────── Phase 2 ─────────────── Phase 4
    │                       │
   1A ──┐                  2A ──┐
   1B ──┼── Parallel       2B ──┤               4A ──┐
   1C ──┘                  2C ──┼── Parallel    4B ──┼── Parallel
                           2D ──┘               4C ──┘
                               │
                               ▼
                          Phase 3
                              │
                             3A ──┐
                             3B ──┴── Parallel
```

**Key Dependencies:**
- Phase 2 (2B) requires Phase 1 (1A) - payment details endpoint
- Phase 3 requires Phase 1 (1B) - owner proof response
- Phase 4 requires Phase 2 (2A) - countdown timer for real-time expiration
- File upload (2D partial) depends on US-10-02 from asset-uploads domain

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Payment details location | Extend `timeSlot.getById` | Single query, avoids additional fetch |
| Owner proof access | Include in reservation query | Avoid separate access control logic |
| Countdown timer | Client-side with `useEffect` | Real-time updates, no server polling |
| T&C handling | Frontend checkbox, backend already validates | Minimal backend changes |
| File upload | Reference US-10-02 | Parallel work in asset-uploads domain |

---

## Document Index

| Document | Description |
|----------|-------------|
| `08-00-overview.md` | This file - master plan |
| `08-01-backend-enhancements.md` | Phase 1: Backend changes |
| `08-02-payment-page-enhancements.md` | Phase 2: Payment page UI |
| `08-03-owner-proof-review.md` | Phase 3: Owner proof display |
| `08-04-expiration-handling.md` | Phase 4: Expired states |
| `p2p-dev1-checklist.md` | Developer implementation checklist |

---

## Success Criteria

- [ ] Payment page displays countdown timer
- [ ] Payment page shows owner's GCash/bank details
- [ ] T&C checkbox required before submitting
- [ ] Payment proof form works (reference, notes)
- [ ] Owner sees payment proof when reviewing
- [ ] Expired reservations show proper UI state
- [ ] Cron job runs on Vercel schedule
- [ ] Build passes with no TypeScript errors

---

## Estimated Effort

| Phase | Time | Notes |
|-------|------|-------|
| Phase 1 | 2-3 hours | Backend enhancements + Vercel config |
| Phase 2 | 3-4 hours | Payment page UI (4 components) |
| Phase 3 | 1-2 hours | Owner proof card |
| Phase 4 | 1-2 hours | Expired UI states |
| **Total** | **7-11 hours** | Single developer |

---

## Parallel Work Notes

- **File Upload (US-10-02):** Being implemented in `10-asset-uploads` domain
- **Payment Proof Form:** Initially implement without file upload, add later when US-10-02 complete
- **Screenshot Display:** Depends on file upload component availability
