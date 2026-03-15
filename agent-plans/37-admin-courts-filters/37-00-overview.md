# Admin Courts Filters (Province -> City) - Master Plan

## Overview

Add a province filter to `/admin/courts` and scope cities to the selected province, using PH location data. This enforces Province -> City selection and wires the province filter through admin list APIs.

### Completed Work (if any)

- None yet.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Story | `agent-plans/user-stories/02-court-creation/02-03-admin-data-entry-form.md` |
| Design System | See `agent-plans/context.md` |
| ERD | See `agent-plans/context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Backend filter wiring | 1A | Yes |
| 2 | Admin courts UI filters | 2A | Partial |

---

## Module Index

### Phase 1: Backend Filter Wiring

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Admin court list accepts province filter | Agent 1 | `37-01-backend-admin-courts-filters.md` |

### Phase 2: Admin Courts UI Filters

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Province -> City dropdowns in admin courts | Agent 1 | `37-02-frontend-admin-courts-filters.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 2A | Admin courts filters |

---

## Dependencies Graph

```
Phase 1 ─────┬───── Phase 2
             │
            1A ─── 2A
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Location filter UX | Province -> City | Keeps city options scoped and manageable |
| Filter values | Use province/city name | Matches stored values from admin create/batch forms |

---

## Document Index

| Document | Description |
|----------|-------------|
| `37-00-overview.md` | This file |
| `37-01-backend-admin-courts-filters.md` | Backend filter wiring |
| `37-02-frontend-admin-courts-filters.md` | Admin courts filters UI |
| `admin-courts-filters-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] Province filter available on `/admin/courts`
- [ ] City disabled until province is selected
- [ ] Province filter is applied to admin list query
- [ ] City options scoped to province
- [ ] `pnpm lint` passes
- [ ] `TZ=UTC pnpm build` passes
