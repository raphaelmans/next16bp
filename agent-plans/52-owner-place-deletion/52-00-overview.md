# Owner Place Deletion - Master Plan

## Overview

Enable owners to delete a place from the edit page while preserving reservation audit data by detaching courts (place_id set to null) instead of cascading through courts/time slots/reservations. No storage cleanup is performed.

### Completed Work (if any)

- None

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/02-court-creation/` |
| Design System | See `context.md` |
| ERD | See `context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Data model updates for detached courts | 1A | No |
| 2 | Backend delete place API | 2A | No |
| 3 | Owner UI delete flow | 3A | No |

---

## Module Index

### Phase 1: Data Model

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Court FK detachment + migration | Agent 1 | `52-01-data-model.md` |

### Phase 2: Backend API

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Place delete mutation | Agent 1 | `52-02-backend-api.md` |

### Phase 3: Owner UI

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | Edit place delete flow | Agent 1 | `52-03-owner-ui.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 2A, 3A | Data model + API + owner UI |

---

## Dependencies Graph

```
Phase 1 ─────── Phase 2 ─────── Phase 3
   1A              2A              3A
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Reservation retention | Detach courts from place (set null) | Preserve audit trail without schema overhaul |
| Storage cleanup | Skip object deletion | Keep scope minimal; avoid bucket changes |

---

## Document Index

| Document | Description |
|----------|-------------|
| `52-00-overview.md` | This file |
| `52-01-data-model.md` | Court FK detachment + migration |
| `52-02-backend-api.md` | Place deletion mutation |
| `52-03-owner-ui.md` | Owner edit page delete flow |
| `owner-place-deletion-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] `court.place_id` allows null and uses `ON DELETE SET NULL`
- [ ] Place delete mutation removes place records without touching storage
- [ ] Owner edit page exposes a confirmed delete flow with redirect + toast
- [ ] `pnpm lint` and `pnpm build` pass
