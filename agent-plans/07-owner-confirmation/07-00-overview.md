# Owner Confirmation - Master Plan

## Overview

This plan implements the owner confirmation flow for KudosCourts, including accurate reservation status in slot lists, a dedicated active reservations page with TTL handling, and a floating alerts panel for fast responses. When a player books a paid court and marks payment as complete, the organization owner must review and confirm (or reject) the reservation.

### Current State

| Layer | Status | Notes |
|-------|--------|-------|
| Database | Complete | `reservation`, `reservation_event` tables exist |
| Backend Service | Complete | `getForOrganization` returns enriched data and supports filtering |
| Backend Router | Complete | All endpoints exist (`confirmPayment`, `reject`, etc.) |
| Frontend Hooks | Connected | `useConfirmReservation`, `useRejectReservation` work |
| Frontend Page | Exists | `/owner/reservations` uses real backend data |
| Slot List Actions | Wired | Slot list actions mapped from reservation state |

### Problem

Owner reservation ops need to remain fast and accurate as an owner manages multiple courts.

Key needs:
- Consistent court context (court name + optional court filter) across lists and alerts
- Accurate reservation-state-driven labels and actions
- Efficient filtering via existing `courtId` support

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
| 4 | Active Reservations Ops | Slot list + TTL page | Partial |
| 5 | Alerts Panel | Floating panel + polling | Yes |
| 6 | Multi-Court Filtering | Court filter across reservation ops | Yes |

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

### Phase 4: Active Reservations Ops

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 4A | Slot Status Mapping | Map reservation status + actions in slot list | `07-04-active-reservations.md` |
| 4B | Active Reservations Page | TTL list, filters, actions | `07-04-active-reservations.md` |

### Phase 5: Alerts Panel

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 5A | Alerts Panel UI | Floating draggable list | `07-05-alerts-panel.md` |
| 5B | Polling + New Highlight | 15s refresh + new badge | `07-05-alerts-panel.md` |

### Phase 6: Multi-Court Filtering

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 6A | Shared Court Filter | URL + local storage selection | `07-06-court-filter.md` |
| 6B | Reservation Ops Filter | Apply court filter across pages/panel | `07-06-court-filter.md` |

---

## Dependencies Graph

```
Phase 1 ─────────────── Phase 2 ─────────────── Phase 3 ─────────────── Phase 4 ───── Phase 5
    │                       │                       │                     │            │
   1A ──┐                  2A ──┐                  3A                    4A           5A
   1B ──┼── Sequential     2B ──┴── Sequential     3B ── Parallel         4B           5B
   1C ──┘                                          3C
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data enrichment location | Backend service | Single query, better performance |
| Query strategy | Join in repository | Avoid N+1 queries |
| Response type | New enriched DTO | Backward compatibility |
| Alerts polling | 15-second interval | Balance freshness and cost |
| Alerts UI | Floating draggable panel | Fast response without leaving page |

---

## Document Index

| Document | Description |
|----------|-------------|
| `07-00-overview.md` | This file - master plan |
| `07-01-backend-enhancement.md` | Phase 1: Backend changes |
| `07-02-frontend-hooks.md` | Phase 2: Hook updates |
| `07-03-ui-integration.md` | Phase 3: UI polish |
| `07-04-active-reservations.md` | Phase 4: Slot status + TTL page |
| `07-05-alerts-panel.md` | Phase 5: Floating alerts panel |
| `07-06-court-filter.md` | Phase 6: Multi-court filtering |

---

## Success Criteria

- [ ] `getForOrganization` returns court name, slot times, and amount
- [ ] Frontend displays real data (no placeholders)
- [ ] Slot list shows accurate reservation states + actions
- [ ] Active reservations page shows TTL countdowns
- [ ] Alerts panel polls every 15 seconds and highlights new items
- [ ] Court filter works across owner reservation ops
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
| Phase 4 | 2-3 hours | Slot list + TTL page |
| Phase 5 | 1-2 hours | Alerts panel + polling |
| **Total** | **5.5-8.5 hours** | |
