# UI Development Parallelization Guide

## Overview

This guide shows how 4 UI developers can work in parallel, with clear dependencies and handoff points. Total estimated time: **8-10 days** with 4 parallel developers.

---

## Developer Assignments

| Developer | Focus Area | Primary Plans |
|-----------|------------|---------------|
| **UI Dev 1** | Foundation + Discovery + Core Components | UI-0A, UI-1A-D |
| **UI Dev 2** | Layout + Court Detail + Booking Flow | UI-0B Layout, UI-1E-G, UI-2A-B |
| **UI Dev 3** | Reservation Management + Profile | UI-2C-F |
| **UI Dev 4** | Owner Dashboard + Admin Dashboard | UI-3, UI-4 |

---

## Timeline View

```
Day 1:
├── UI Dev 1: UI-0A Foundation Setup
├── UI Dev 2: UI-0B Layout Components (after UI-0A fonts ready)
├── UI Dev 3: UI-2E Profile Page + UI-2F Utilities (no dependencies)
└── UI Dev 4: UI-3A Owner Layout (after UI-0B ready)

Day 2:
├── UI Dev 1: UI-0B Base Components + UI-1A Core Kudos Components
├── UI Dev 2: UI-0B Layout Components (cont.) + UI-1E Court Detail Structure
├── UI Dev 3: UI-2F Utilities (cont.) + UI-Auth Pages
└── UI Dev 4: UI-3A Owner Layout (cont.) + UI-3B Owner Dashboard Home

Day 3:
├── UI Dev 1: UI-1B Hero & Search
├── UI Dev 2: UI-1F Booking Card + Date/Time Pickers
├── UI Dev 3: UI-2C My Reservations Page (needs Backend 3A)
└── UI Dev 4: UI-3B Owner Dashboard Home (cont.)

Day 4:
├── UI Dev 1: UI-1C Home Page (needs Backend 1C)
├── UI Dev 2: UI-1G Org Profile + UI-2A Book Slot Page
├── UI Dev 3: UI-2C My Reservations (cont.) + UI-2D Reservation Detail
└── UI Dev 4: UI-3C Courts Management (needs Backend 2A)

Day 5:
├── UI Dev 1: UI-1C Home Page (cont.) + UI-1D Search Results
├── UI Dev 2: UI-2A Book Slot Page (cont.) + UI-2B Payment Page
├── UI Dev 3: UI-2D Reservation Detail (cont.)
└── UI Dev 4: UI-3C Courts Management (cont.)

Day 6:
├── UI Dev 1: UI-1D Search Results (cont.)
├── UI Dev 2: UI-2B Payment Page (cont.)
├── UI Dev 3: UI-2D Reservation Detail (cont.) + Integration testing
└── UI Dev 4: UI-3D Slot Management (needs Backend 2B)

Day 7:
├── UI Dev 1: Polish + Integration testing
├── UI Dev 2: Polish + Integration testing
├── UI Dev 3: Polish + Integration testing
└── UI Dev 4: UI-3D Slot Management (cont.) + UI-3E Owner Reservations

Day 8:
├── UI Dev 1: Final testing + Handoff
├── UI Dev 2: Final testing + Handoff
├── UI Dev 3: Final testing + Handoff
└── UI Dev 4: UI-3E Owner Reservations (cont.) + UI-3F Settings

Day 9-10:
└── UI Dev 4: UI-4A-C Admin Dashboard
```

---

## Dependency Graph

```
                    ┌─────────────────────────────────┐
                    │ UI-0A: Foundation Setup         │
                    │ (Dev 1 - Day 1)                 │
                    └───────────┬─────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
┌───────────────────┐  ┌────────────────┐  ┌────────────────────┐
│ UI-0B: Layout     │  │ UI-0B: Base    │  │ UI-2E: Profile     │
│ Components        │  │ Components     │  │ (Dev 3 - Day 1)    │
│ (Dev 2 - Day 1-2) │  │ (Dev 1 - Day 2)│  │ No dependencies    │
└────────┬──────────┘  └───────┬────────┘  └────────────────────┘
         │                     │
         │    ┌────────────────┴────────────────┐
         │    │                                 │
         ▼    ▼                                 ▼
┌──────────────────────┐              ┌────────────────────────┐
│ UI-1A: Core Kudos    │              │ UI-3A: Owner Layout    │
│ Components           │              │ (Dev 4 - Day 1-2)      │
│ (Dev 1 - Day 2)      │              └───────────┬────────────┘
└──────────┬───────────┘                          │
           │                                      ▼
           ├──────────────────┐         ┌────────────────────────┐
           │                  │         │ UI-3B-F: Owner Pages   │
           ▼                  ▼         │ (Dev 4 - Day 2-8)      │
┌──────────────────┐  ┌───────────────┐ └────────────┬───────────┘
│ UI-1B: Hero      │  │ UI-1E: Court  │              │
│ & Search         │  │ Detail Struct │              ▼
│ (Dev 1 - Day 3)  │  │ (Dev 2 - Day 2)│    ┌────────────────────┐
└────────┬─────────┘  └───────┬───────┘    │ UI-4: Admin Pages  │
         │                    │            │ (Dev 4 - Day 9-10) │
         ▼                    ▼            └────────────────────┘
┌──────────────────┐  ┌───────────────┐
│ UI-1C: Home Page │  │ UI-1F: Book   │
│ (Dev 1 - Day 4)  │  │ Card + Slots  │
│ Needs Backend 1C │  │ (Dev 2 - Day 3)│
└────────┬─────────┘  └───────┬───────┘
         │                    │
         ▼                    ▼
┌──────────────────┐  ┌───────────────┐
│ UI-1D: Search    │  │ UI-2A-B: Book │
│ Results          │  │ & Payment     │
│ (Dev 1 - Day 5-6)│  │ (Dev 2 - Day 4-6)│
└──────────────────┘  └───────────────┘
                              │
         ┌────────────────────┘
         │
         │  ┌─────────────────────────────┐
         │  │ UI-2C: My Reservations      │
         │  │ (Dev 3 - Day 3-4)           │
         │  │ Needs Backend 3A            │
         │  └─────────────┬───────────────┘
         │                │
         │                ▼
         │  ┌─────────────────────────────┐
         │  │ UI-2D: Reservation Detail   │
         │  │ (Dev 3 - Day 4-6)           │
         │  └─────────────────────────────┘
         │
         └──────────────────────────────────► Integration Testing
```

---

## Critical Path

The critical path (longest sequence of dependent tasks):

1. **UI-0A** → **UI-0B Layout** → **UI-3A Owner Layout** → **UI-3C Courts** → **UI-3D Slots** → **UI-3E Reservations** → **UI-4 Admin**

This means **UI Dev 4** is on the critical path for the owner/admin dashboards.

---

## Backend Dependencies

| UI Phase | Backend Requirement | Blocking? |
|----------|---------------------|-----------|
| UI-1C Home Page | Phase 1C (Court Discovery) | Yes |
| UI-2A-B Booking | Phase 3A (Reservation Core) | Yes |
| UI-2C-D My Reservations | Phase 3A (Reservation Core) | Yes |
| UI-3C Courts Management | Phase 2A (Court Management) | Yes |
| UI-3D Slot Management | Phase 2B (Time Slot) | Yes |
| UI-3E Owner Reservations | Phase 3B (Reservation Owner) | Yes |
| UI-4 Admin Dashboard | Phase 4B (Claim Admin) | Yes |

### Unblocking Strategy

If backend isn't ready, developers can:
1. Use mock data / MSW for API responses
2. Build UI components without real data fetching
3. Add data fetching hooks later
4. Focus on static pages first (Profile, Settings)

---

## Shared Components & Handoffs

### Components Built by Dev 1 (Used by Others)

| Component | Used By |
|-----------|---------|
| `KudosLogo` | All pages (navbar) |
| `KudosLocationPin` | Maps, Court Cards |
| `KudosCourtCard` | Discovery, Owner Courts |
| `KudosEmptyState` | All list pages |

### Components Built by Dev 2 (Used by Others)

| Component | Used By |
|-----------|---------|
| Layout Components | All dashboards |
| `KudosTimeSlotPicker` | Booking, Slot Management |
| `KudosDatePicker` | Booking, Filters |
| `KudosCountdown` | Payment Page, Owner Reservations |
| `KudosFileUpload` | Payment Proof, Photos |

### Components Built by Dev 3 (Used by Others)

| Component | Used By |
|-----------|---------|
| `KudosStatusBadge` | All reservation displays |
| `KudosTimeline` | Reservation Detail, Claim Detail |
| Format Utilities | All price/date displays |

---

## Daily Standups Checklist

### Day 1 End
- [ ] UI-0A: Fonts and Tailwind config ready
- [ ] UI-0B Layout: Container, BentoGrid started
- [ ] UI-2E: Profile page structure done
- [ ] UI-3A: Owner layout structure started

### Day 2 End
- [ ] UI-0B: All base components customized
- [ ] UI-1A: Core Kudos components done
- [ ] UI-0B Layout: All layout components done
- [ ] UI-3A: Owner layout complete
- [ ] UI-3B: Owner dashboard home started

### Day 3 End
- [ ] UI-1B: Hero and search complete
- [ ] UI-1F: Booking card, date picker, time slot picker done
- [ ] UI-2C: My Reservations started (if backend ready)
- [ ] UI-3B: Owner dashboard home complete

### Day 4 End
- [ ] UI-1C: Home page with bento grid done
- [ ] UI-1G: Org profile done
- [ ] UI-2A: Book slot page started
- [ ] UI-2C: My Reservations complete
- [ ] UI-3C: Courts management started

### Day 5 End
- [ ] UI-1D: Search results page done
- [ ] UI-2A: Book slot page complete
- [ ] UI-2B: Payment page started
- [ ] UI-2D: Reservation detail started
- [ ] UI-3C: Courts management complete

### Day 6 End
- [ ] UI-1: All discovery pages complete
- [ ] UI-2B: Payment page complete
- [ ] UI-2D: Reservation detail complete
- [ ] UI-3D: Slot management started

### Day 7-8
- [ ] Integration testing
- [ ] Bug fixes
- [ ] UI-3D, UI-3E, UI-3F completion
- [ ] Polish and responsiveness

### Day 9-10
- [ ] UI-4: Admin dashboard complete
- [ ] Final testing
- [ ] Documentation

---

## Risk Mitigation

### Risk: Backend delays
**Mitigation:** 
- Build UI with mock data first
- Use MSW (Mock Service Worker) for API mocking
- Prioritize non-blocking work

### Risk: Component conflicts
**Mitigation:**
- Daily sync on shared component changes
- Use feature branches per developer
- Merge to main frequently

### Risk: Design inconsistencies
**Mitigation:**
- Refer to `kudoscourts-design-system.md` as source of truth
- Daily visual reviews
- Shared Storybook (optional)

---

## Definition of Done (Per Feature)

- [ ] All components implemented per spec
- [ ] No TypeScript errors
- [ ] Responsive at 320px, 768px, 1024px, 1440px
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Empty states implemented
- [ ] Keyboard accessible
- [ ] Focus states visible
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Dark mode works (if applicable)
- [ ] Integration tested with backend (when available)
