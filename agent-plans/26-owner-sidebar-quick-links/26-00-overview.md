# Owner Sidebar Quick Links - Master Plan

## Overview

Add a toggleable quick-links submenu in the owner sidebar that lists places and their active courts for fast navigation.

### Completed Work (if any)

- None.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/11-ui-revamp/` |
| Design System | See `context.md` |
| ERD | See `context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Owner sidebar quick links | 1A, 1B | Yes |

---

## Module Index

### Phase 1: Owner Sidebar Quick Links

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Data hook for places + courts | Agent 1 | `26-01-owner-sidebar-quick-links.md` |
| 1B | Collapsible submenu UI | Agent 1 | `26-01-owner-sidebar-quick-links.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 1B | Owner sidebar UX |

---

## Dependencies Graph

```
Phase 1
  ├─ 1A ──┐
  └─ 1B ──┘
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI component | shadcn `Collapsible` + `SidebarMenuSub` | Matches existing sidebar patterns |
| Court destination | Owner court slots page | Aligns with quick navigation workflow |
| Court visibility | Active courts only | Avoids clutter from inactive courts |
| Empty place state | Show place + "No active courts" row | Keeps context visible |

---

## Document Index

| Document | Description |
|----------|-------------|
| `26-00-overview.md` | This file |
| `26-01-owner-sidebar-quick-links.md` | Phase 1 details |
| `owner-sidebar-quick-links-dev1-checklist.md` | Dev 1 checklist |

---

## Success Criteria

- [ ] Owner sidebar shows a toggleable Places quick-links menu
- [ ] Each place expands to show active courts
- [ ] Clicking a court routes to slots page
- [ ] Empty places show a disabled "No active courts" row
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass
