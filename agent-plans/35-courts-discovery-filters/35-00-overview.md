# Courts Discovery Filters (Province/City + Search) - Master Plan

## Overview

Enhance public discovery filtering on `/courts` to use standardized PH province → city selection, plus free-text search that matches place name, address, city, or province.

### Completed Work (if any)

- None yet.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Story | `agent-plans/user-stories/14-place-court-migration/14-01-player-discovers-places-with-sport-filters.md` |
| Design System | See `agent-plans/context.md` |
| ERD | See `agent-plans/context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Backend filtering + search | 1A | Yes |
| 2 | Discovery UI + URL state | 2A, 2B | Partial |

---

## Module Index

### Phase 1: Backend Filtering + Search

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Add province + query filtering to place.list | Agent 1 | `35-01-backend-discovery-filters.md` |

### Phase 2: Discovery UI + URL State

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Province → city filters + URL params | Agent 1 | `35-02-frontend-discovery-filters.md` |
| 2B | Navbar search routes to `/courts` | Agent 1 | `35-02-frontend-discovery-filters.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 2A, 2B | Discovery filters + search | 

---

## Dependencies Graph

```
Phase 1 ─────┬───── Phase 2
             │
            1A ─── 2A, 2B
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Location filter UX | Province → City | City list stays manageable and canonical |
| Free-text search | Server-side | Correct totals + pagination, matches province | 
| Search route | `/courts?q=...` | Align with discovery page |

---

## Document Index

| Document | Description |
|----------|-------------|
| `35-00-overview.md` | This file |
| `35-01-backend-discovery-filters.md` | Server filtering + search |
| `35-02-frontend-discovery-filters.md` | UI + URL state updates |
| `courts-discovery-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] Province → city filters load from PH dataset
- [ ] City disabled until province selected
- [ ] Search `q` matches name, address, city, province
- [ ] `/courts` uses new filters + URL params
- [ ] Navbar search routes to `/courts`
- [ ] `pnpm build` passes
