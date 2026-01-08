# Owner Confirmation - Master Plan

## Overview

This plan implements the owner confirmation flow for KudosCourts. When a player books a paid court and marks payment as complete, the organization owner must review and confirm (or reject) the reservation.

### Current State

| Layer | Status | Notes |
|-------|--------|-------|
| Database | Complete | `reservation`, `reservation_event` tables exist |
| Backend Service | Partial | `getForOrganization` returns basic data, missing slot/court details |
| Backend Router | Complete | All endpoints exist (`confirmPayment`, `reject`, etc.) |
| Frontend Hooks | Connected | `useConfirmReservation`, `useRejectReservation` work |
| Frontend Page | Exists | `/owner/reservations` - displays placeholder data |

### Problem

The `reservationOwner.getForOrganization` endpoint returns `ReservationRecord` without slot/court details:

```typescript
// Current response - INCOMPLETE
{
  id: "...",
  status: "PAYMENT_MARKED_BY_USER",
  playerNameSnapshot: "Juan Dela Cruz",
  playerEmailSnapshot: "juan@email.com",
  playerPhoneSnapshot: "0917-123-4567",
  createdAt: "...",
  // MISSING: courtName, slotStartTime, slotEndTime, amountCents
}
```

The frontend hook (`useOwnerReservations`) compensates with placeholders:
```typescript
courtName: "Court",      // placeholder
startTime: "--:--",      // placeholder
endTime: "--:--",        // placeholder
amountCents: 0,          // placeholder
```

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/07-owner-confirmation/` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` Section 7 Journey 4 |

---

## Development Phases

| Phase | Description | Files | Parallelizable |
|-------|-------------|-------|----------------|
| 1 | Backend Enhancement | Service, DTO, Repository | No |
| 2 | Frontend Hook Update | Hook mapping | Depends on Phase 1 |
| 3 | UI Integration | Page, components | Depends on Phase 2 |

---

## Module Index

### Phase 1: Backend Enhancement

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 1A | DTO Enhancement | Add enriched response types | `07-01-backend-enhancement.md` |
| 1B | Service Enhancement | Join slot/court data | `07-01-backend-enhancement.md` |
| 1C | Repository Method | Efficient query with joins | `07-01-backend-enhancement.md` |

### Phase 2: Frontend Hooks

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 2A | Hook Update | Remove placeholders, map enriched data | `07-02-frontend-hooks.md` |
| 2B | Type Alignment | Ensure types match backend | `07-02-frontend-hooks.md` |

### Phase 3: UI Integration

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 3A | Reservations Page | Display real data | `07-03-ui-integration.md` |
| 3B | Design Polish | Apply design system | `07-03-ui-integration.md` |
| 3C | Empty States | Proper messaging | `07-03-ui-integration.md` |

---

## Dependencies Graph

```
Phase 1 ─────────────── Phase 2 ─────────────── Phase 3
    │                       │                       │
   1A ──┐                  2A ──┐                  3A
   1B ──┼── Sequential     2B ──┴── Sequential     3B ── Parallel
   1C ──┘                                          3C
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data enrichment location | Backend service | Single query, better performance |
| Query strategy | Join in repository | Avoid N+1 queries |
| Response type | New enriched DTO | Backward compatibility |

---

## Document Index

| Document | Description |
|----------|-------------|
| `07-00-overview.md` | This file - master plan |
| `07-01-backend-enhancement.md` | Phase 1: Backend changes |
| `07-02-frontend-hooks.md` | Phase 2: Hook updates |
| `07-03-ui-integration.md` | Phase 3: UI polish |

---

## Success Criteria

- [ ] `getForOrganization` returns court name, slot times, and amount
- [ ] Frontend displays real data (no placeholders)
- [ ] Confirm/reject actions work end-to-end
- [ ] Pending count badge updates after actions
- [ ] Empty states display appropriate messages
- [ ] Design system colors and typography applied
- [ ] Build passes with no TypeScript errors

---

## Estimated Effort

| Phase | Time | Notes |
|-------|------|-------|
| Phase 1 | 1-2 hours | Backend enhancement |
| Phase 2 | 30 mins | Hook update |
| Phase 3 | 1 hour | UI polish |
| **Total** | **2.5-3.5 hours** | |
