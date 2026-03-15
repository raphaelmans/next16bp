# 11 - UI Revamp - Implementation Plan

**Version:** 1.0  
**Created:** January 10, 2026  
**Status:** Ready for Implementation

---

## Overview

This plan standardizes navigation, layout shells, and visual cohesion across public and authenticated experiences. It implements the UI Revamp stories by consolidating navigation patterns, enforcing full-width responsive layouts, and aligning typography + color usage with the design system.

### User Stories Covered

| ID | Story | Priority |
|----|-------|----------|
| US-11-01 | Unified Navigation Shells | High |
| US-11-02 | Full-Width Responsive Layouts | High |
| US-11-03 | Cohesive Color + Typography | High |

### Reference Documents

| Document | Location |
|----------|----------|
| User Stories | `agent-plans/user-stories/11-ui-revamp/` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Existing Layouts | `src/shared/components/layout/` |
| Public Navbar | `src/features/discovery/components/navbar.tsx` |
| Owner/Admin Shells | `src/features/owner/components/`, `src/features/admin/components/` |

---

## Development Phases

| Phase | Description | Modules | Time Est. |
|-------|-------------|---------|-----------|
| 1 | Navigation Shell Foundation | 1A, 1B | 2 hours |
| 2 | Route & Layout Migration | 2A, 2B | 3 hours |
| 3 | Visual Cohesion Polish | 3A | 2 hours |

**Total Estimated Time:** 7 hours

---

## Module Index

### Phase 1: Navigation Shell Foundation

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 1A | Public Navbar Shell | Public-only navbar shell with responsive menu | `11-01-navigation-shells.md` |
| 1B | App Sidebar Shell | Unified authenticated shell with sidebar + topbar | `11-01-navigation-shells.md` |

### Phase 2: Route & Layout Migration

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 2A | Public Route Alignment | Ensure public routes use navbar layout | `11-02-layout-standards.md` |
| 2B | Auth Route Alignment | Move player/account routes into sidebar shell | `11-02-layout-standards.md` |

### Phase 3: Visual Cohesion Polish

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 3A | Typography + Color Audit | Enforce type scale and color restraint | `11-03-visual-cohesion.md` |

---

## Dependencies

```
Phase 1 (Shells) ────► Phase 2 (Routes) ────► Phase 3 (Polish)
```

---

## Key Implementation Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Public vs App Shells | Separate layout components | Avoid sidebar on public routes |
| Sidebar Layout | Reuse DashboardLayout core | Preserve existing owner/admin patterns |
| Full-width layout | Remove max-width wrappers | Consistent edge-to-edge layouts |
| Color cohesion | Restrained brand usage | Reduce visual noise |

---

## Success Criteria

- [ ] Public pages share the same navbar and footer layout
- [ ] Authenticated pages share a unified sidebar shell
- [ ] All pages are full-width and responsive without horizontal scroll
- [ ] Typography follows design system fonts
- [ ] Primary/secondary colors used per design system rules

---

## Document Index

| Document | Description |
|----------|-------------|
| `11-00-overview.md` | This file |
| `11-01-navigation-shells.md` | Shell components and navigation structure |
| `11-02-layout-standards.md` | Route migration + layout standards |
| `11-03-visual-cohesion.md` | Typography + color cohesion guidance |
| `ui-revamp-dev1-checklist.md` | Developer checklist |
