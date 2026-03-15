# 06 - Court Reservation - Implementation Plan

**Version:** 1.0  
**Created:** January 8, 2025  
**Status:** Ready for Implementation

---

## Overview

This plan covers the player-facing reservation flow, enabling players to discover courts with available slots and create reservations for both free and paid courts.

### User Stories Covered

| ID | Story | Priority |
|----|-------|----------|
| US-06-01 | Player Books Free Court | High |
| US-06-02 | Player Books Paid Court (Simplified) | High |

### Reference Documents

| Document | Location |
|----------|----------|
| User Stories | `agent-plans/user-stories/06-court-reservation/` |
| Original Stories | `agent-plans/user-stories/03-court-reservation/` |
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` Section 7-8 |
| Design System | `business-contexts/kudoscourts-design-system.md` |

---

## Simplified Scope

This implementation uses a **simplified flow** without:
- TTL timer countdown
- Payment proof upload
- Payment instructions display
- Expiration handling

These are deferred to `08-p2p-reservation-confirmation`.

---

## Development Phases

| Phase | Description | Modules | Time Est. |
|-------|-------------|---------|-----------|
| 1 | Verify Backend E2E | 1A | 1 hour |
| 2 | Wire Frontend Hooks | 2A, 2B | 2 hours |
| 3 | Player Booking Flow UI | 3A, 3B | 3 hours |
| 4 | Payment Page (Simplified) | 4A | 2 hours |

**Total Estimated Time:** 8 hours

---

## Module Index

### Phase 1: Backend Verification

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 1A | Verify Reservation Endpoints | Test E2E flow works | `06-01-backend-verification.md` |

### Phase 2: Frontend Hooks

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 2A | Verify `useCreateReservation` | Already connected, test | `06-02-frontend-hooks.md` |
| 2B | Add `useMarkPayment` Hook | May need creation | `06-02-frontend-hooks.md` |

### Phase 3: Booking Flow UI

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 3A | Court Detail Slots Display | Show available slots | `06-03-booking-ui.md` |
| 3B | Booking Confirmation Page | Reserve button, confirmation | `06-03-booking-ui.md` |

### Phase 4: Payment Page

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 4A | Simplified Payment Page | "I Have Paid" button | `06-04-payment-page.md` |

---

## Flow Diagram

### Free Court

```
/courts/[id]
    │ Player views available slots (AVAILABLE only)
    ▼
Click slot → /courts/[id]/book/[slotId]
    │ Player sees confirmation screen
    ▼
[Reserve] button
    │ reservation.create({ timeSlotId })
    ▼
Success → /reservations/[id]
    │ Status: CONFIRMED
    │ Slot: BOOKED
    ▼
Done!
```

### Paid Court (Simplified)

```
/courts/[id]
    │ Player views available slots with prices
    ▼
Click slot → /courts/[id]/book/[slotId]
    │ Player sees price, confirmation screen
    ▼
[Reserve] button
    │ reservation.create({ timeSlotId })
    │ Status: AWAITING_PAYMENT
    │ Slot: HELD
    ▼
Redirect → /reservations/[id]/payment
    │ Player sees "I Have Paid" button
    ▼
[I Have Paid] button
    │ reservation.markPayment({ reservationId, termsAccepted: true })
    │ Status: PAYMENT_MARKED_BY_USER
    ▼
"Awaiting owner confirmation"
    │
    ▼
(Owner confirms in 07-owner-confirmation)
```

---

## Backend Endpoints Used

| Endpoint | Status | Used For |
|----------|--------|----------|
| `timeSlot.getAvailable` | Complete | Fetch available slots for court |
| `reservation.create` | Complete | Create reservation |
| `reservation.markPayment` | Complete | Mark payment as complete |
| `reservation.getById` | Complete | View reservation details |
| `reservation.getMy` | Complete | List player's reservations |

---

## Frontend Current State

| Component/Hook | Status | Location |
|----------------|--------|----------|
| Court detail page | Exists | `src/app/(public)/courts/[id]/page.tsx` |
| Booking page | May exist | `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx` |
| Payment page | Exists | `src/app/(auth)/reservations/[id]/payment/page.tsx` |
| Confirmation page | Exists | `src/app/(auth)/reservations/[id]/page.tsx` |
| `useCreateReservation` | Connected | `src/features/reservation/hooks/use-create-reservation.ts` |
| `useMarkPayment` | May need creation | - |
| `useMyReservations` | Exists | `src/features/reservation/hooks/use-my-reservations.ts` |

---

## UI/UX Specifications

### Time Slot Display (per Design System Section 5.4)

| Type | Background | Text | Badge |
|------|------------|------|-------|
| Available (Free) | `#ECFDF5` | `#059669` | "Free" |
| Available (Paid) | `#CCFBF1` | `#0F766E` | "₱200/hr" |
| Selected | `#CCFBF1` | `#0F766E` | Border: `1px #0D9488` |
| Booked (disabled) | `muted` | `muted-foreground` | line-through |

### Buttons

| Action | Style | Color |
|--------|-------|-------|
| Reserve | Primary | Teal `#0D9488` |
| Cancel | Secondary | Outline |
| I Have Paid | Primary | Teal `#0D9488` |

### Price Display

- Font: **Outfit 700** (per design system)
- Format: `₱{price}` (PHP symbol)
- Badge style: pill with primary-light background

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Slot display | Only AVAILABLE slots | Players shouldn't see held/booked slots |
| Payment flow | Simplified button only | Full P2P deferred to 08 |
| Terms acceptance | Backend flag only | No explicit checkbox UI in MVP |
| Redirect after reserve | Payment page (paid) or confirmation (free) | Different flows |

---

## Testing Checklist

### Phase 1 (Backend)
- [ ] `reservation.create` works for free court
- [ ] `reservation.create` works for paid court
- [ ] `reservation.markPayment` transitions status
- [ ] Slot status updates correctly

### Phase 2 (Hooks)
- [ ] `useCreateReservation` works
- [ ] `useMarkPayment` works
- [ ] Cache invalidation correct

### Phase 3 (Booking UI)
- [ ] Available slots display on court detail
- [ ] Click slot navigates to booking page
- [ ] Reserve button creates reservation
- [ ] Free court → immediate confirmation
- [ ] Paid court → redirect to payment

### Phase 4 (Payment Page)
- [ ] Payment page shows reservation details
- [ ] "I Have Paid" button works
- [ ] Status changes to PAYMENT_MARKED_BY_USER
- [ ] "Awaiting confirmation" message shows

---

## Document Index

| Document | Description |
|----------|-------------|
| `06-00-overview.md` | This file |
| `06-01-backend-verification.md` | Backend E2E testing |
| `06-02-frontend-hooks.md` | Hook verification and creation |
| `06-03-booking-ui.md` | Booking flow UI |
| `06-04-payment-page.md` | Simplified payment page |

---

## Success Criteria

- [ ] Player can discover available slots on court detail
- [ ] Player can book a free slot → immediate confirmation
- [ ] Player can book a paid slot → AWAITING_PAYMENT
- [ ] Player can mark payment → PAYMENT_MARKED_BY_USER
- [ ] Player sees "awaiting confirmation" message
- [ ] All flows use real backend data
- [ ] UI follows design system
- [ ] Mobile responsive
