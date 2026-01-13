# Owner Filter Nuqs Migration - Master Plan

## Overview

Migrate owner place/court filter state to nuqs query state so URL updates merge safely with other query params (e.g. setup wizard `courtId`/`step`). Remove manual `router.replace` reconciliation while preserving localStorage persistence.

### Completed Work (if any)

- None

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/04-owner-dashboard/` |
| Design System | See `context.md` |
| ERD | See `context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Hook migration + callsites | 1A, 1B | Yes |

---

## Module Index

### Phase 1: Hook Migration + Callsites

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Filter hooks via nuqs | Agent 1 | `22-01-owner-filter-nuqs.md` |
| 1B | Update callsites + QA | Agent 1 | `22-01-owner-filter-nuqs.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 1B | Owner filters + query state |

---

## Dependencies Graph

```
Phase 1
  ├─ 1A ── 1B
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Query state | `useQueryState` (nuqs) | Preserve other query params during updates |
| Storage | Keep localStorage | Persist owner filter between pages |

---

## Document Index

| Document | Description |
|----------|-------------|
| `22-00-overview.md` | This file |
| `22-01-owner-filter-nuqs.md` | Phase 1 implementation |

---

## Success Criteria

- [ ] Filters no longer use manual `router.replace`
- [ ] `placeId`/`courtId` updates preserve existing query params
- [ ] Setup wizard link no longer drops `courtId`
- [ ] Build passes
