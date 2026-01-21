# Public Schedule Month View - Master Plan

## Overview

Add a month view to the public schedule page that renders the same start-time selection UX across the entire month, backed by range availability endpoints.

### Completed Work (if any)

- Added availability range DTOs and router endpoints for month queries.
- Implemented month-view UI scaffolding in the public schedule page.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/06-court-reservation/` |
| Design System | See `context.md` |
| ERD | See `context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Backend range availability | 1A | Yes |
| 2 | Public schedule month UI | 2A | Partial |
| 3 | QA + polish | 3A | No |

---

## Module Index

### Phase 1: Backend

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Availability range endpoints | Dev 1 | `54-01-backend-range-availability.md` |

### Phase 2: Frontend

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Public schedule month view | Dev 1 | `54-02-frontend-month-view.md` |

### Phase 3: QA

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | QA + polish | Dev 1 | `54-02-frontend-month-view.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|----------|---------|------------|
| Dev 1 | 1A, 2A, 3A | Backend + public schedule UI |

---

## Dependencies Graph

```
Phase 1 ─────┬───── Phase 2 ─────── Phase 3
             │
        1A ──┼── 2A
             │
             └── 3A
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Default view | Month | Required by product request |
| Range cap | 45 days | Avoid oversized availability queries |
| Month navigation | Current month onward | Prevent past scheduling |
| Court mode | Single court selector | Keeps month list readable |

---

## Document Index

| Document | Description |
|----------|-------------|
| `54-00-overview.md` | This file |
| `54-01-backend-range-availability.md` | Backend availability range endpoints |
| `54-02-frontend-month-view.md` | Public month-view schedule UI + QA |

---

## Success Criteria

- [ ] Month view renders all available start times for the month (grouped by day).
- [ ] Month view respects "current month onward" in venue time zone.
- [ ] Day view remains available and unchanged for single-day browsing.
- [ ] Selecting a month slot updates `date` + `startTime` and enables booking.
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass.
