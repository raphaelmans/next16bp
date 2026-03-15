# UI User Stories Implementation - Master Plan

## Overview

This plan implements the UI features documented in `agent-plans/user-stories/`. The focus is on completing the authenticated user experience: real auth wiring, home page, navigation consistency, organization onboarding, and court creation flows.

### Completed Work

- Discovery navbar with DEV flags (needs real auth)
- Owner/Admin dashboards with mock data
- Basic booking flow UI
- Login/Register pages (functional)

### Reference Documents

| Document | Location |
|----------|----------|
| User Stories | `agent-plans/user-stories/` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` |
| Server Context | `agent-contexts/00-01-kudoscourts-server.md` |
| UI Context | `agent-contexts/00-04-ux-flow-implementation.md` |

---

## Development Phases

| Phase | Description | User Stories | Parallelizable |
|-------|-------------|--------------|----------------|
| 1 | Foundation | US-00-01, US-00-07 | No |
| 2 | Navigation | US-00-03, US-00-04, US-00-05, US-00-06 | Yes |
| 3 | Organization | US-00-02, US-01-01 | No |
| 4 | Court Creation | US-02-01, US-02-02 | Partial |
| 5 | Reservation | US-03-01, US-03-02, US-03-03 | Deferred |

---

## Module Index

### Phase 1: Foundation

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 1A | Auth Wiring | Remove DEV flags, wire real session | `02-01-phase-foundation.md` |
| 1B | Home Page | Create `/home` with quick actions, reservations, org | `02-01-phase-foundation.md` |
| 1C | Login Redirect | Update default redirect to `/home` | `02-01-phase-foundation.md` |

### Phase 2: Navigation

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 2A | PageHeader Component | Reusable breadcrumbs + back button | `02-02-phase-navigation.md` |
| 2B | Public Navigation | Court detail, booking flow navigation | `02-02-phase-navigation.md` |
| 2C | Account Navigation | Profile, reservations navigation | `02-02-phase-navigation.md` |
| 2D | Owner Navigation | Sidebar active states, breadcrumbs | `02-02-phase-navigation.md` |
| 2E | Admin Navigation | Sidebar badges, breadcrumbs | `02-02-phase-navigation.md` |

### Phase 3: Organization

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 3A | Profile CTA | "Become Owner" section on profile | `02-03-phase-organization.md` |
| 3B | Onboarding Page | `/owner/onboarding` form | `02-03-phase-organization.md` |
| 3C | Owner Layout Guard | Check organization, redirect if missing | `02-03-phase-organization.md` |

### Phase 4: Court Creation

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 4A | Owner Court Form | `/owner/courts/new` for reservable courts | `02-04-phase-court-creation.md` |
| 4B | Backend Endpoint | `courtManagement.createCourt` mutation | `02-04-phase-court-creation.md` |

### Phase 5: Reservation (Deferred)

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 5A | Free Booking | Already exists, verify flow | `02-05-deferred.md` |
| 5B | Paid Booking | Payment page improvements | `02-05-deferred.md` |
| 5C | Owner Confirmation | Pending reservations view | `02-05-deferred.md` |

---

## Dependencies Graph

```
Phase 1 (Foundation)
    │
    ├── 1A: Auth Wiring ─────────────────────┐
    │                                        │
    ├── 1B: Home Page ───────────────────────┤
    │                                        │
    └── 1C: Login Redirect ──────────────────┤
                                             │
Phase 2 (Navigation) ◄───────────────────────┘
    │
    ├── 2A: PageHeader ──┬── 2B: Public Nav
    │                    ├── 2C: Account Nav
    │                    ├── 2D: Owner Nav
    │                    └── 2E: Admin Nav
    │
Phase 3 (Organization) ◄─────────────────────┘
    │
    ├── 3A: Profile CTA
    ├── 3B: Onboarding Page
    └── 3C: Owner Layout Guard
    │
Phase 4 (Court Creation) ◄───────────────────┘
    │
    ├── 4A: Owner Court Form
    └── 4B: Backend Endpoint
    │
Phase 5 (Reservation) ◄──────────────────────┘
    [DEFERRED]
```

---

## Estimated Timeline

| Phase | Modules | Time | Dependencies |
|-------|---------|------|--------------|
| 1 | 1A, 1B, 1C | 1 day | None |
| 2 | 2A-2E | 1 day | Phase 1 |
| 3 | 3A, 3B, 3C | 0.5 day | Phase 2 |
| 4 | 4A, 4B | 0.5 day | Phase 3 |
| 5 | Deferred | - | Phase 4 |

**Total:** 3 days

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth state source | `useSession()` hook | Already exists, queries `trpc.auth.me` |
| Home page route | `/home` | Separate from landing `/` for clarity |
| PageHeader component | New reusable component | Consistency across all pages |
| Organization check | Server-side in layout | Security, prevent client-side bypass |
| Court creation endpoint | New `courtManagement.createCourt` | Separate from admin curated flow |

---

## Developer Assignments

| Developer | Focus | Checklist | Estimated Time |
|-----------|-------|-----------|----------------|
| **Server Dev** | Backend endpoints, tRPC routers | `server-dev1-checklist.md` | 1 day |
| **UI Dev** | React components, pages, styling | `ui-dev1-checklist.md` | 2.5 days |

Each checklist includes embedded coordination instructions (timeline, sync points, mock data strategies).

---

## Document Index

| Document | Description |
|----------|-------------|
| `02-00-overview.md` | This file |
| `02-01-phase-foundation.md` | Phase 1: Auth wiring, Home page |
| `02-02-phase-navigation.md` | Phase 2: Navigation patterns |
| `02-03-phase-organization.md` | Phase 3: Organization onboarding |
| `02-04-phase-court-creation.md` | Phase 4: Court creation |
| `02-05-deferred.md` | Phase 5: Deferred reservation work |
| `server-dev1-checklist.md` | Server developer checklist (with coordination info) |
| `ui-dev1-checklist.md` | UI developer checklist (with coordination info) |

---

## Success Criteria

- [ ] DEV flags removed from all navbar components
- [ ] Real auth state drives UI (session from tRPC)
- [ ] `/home` page functional with all sections
- [ ] Login redirects to `/home` by default
- [ ] All pages have consistent navigation (breadcrumbs/back)
- [ ] `/owner/onboarding` creates organization
- [ ] Owner can create reservable courts
- [ ] Build passes with no TypeScript errors
- [ ] No console errors in browser
