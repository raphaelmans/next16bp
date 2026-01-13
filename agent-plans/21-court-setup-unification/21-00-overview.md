# Court Setup Unification - Master Plan

## Overview

Unify owner court setup into a single route (`/owner/places/:placeId/courts/setup`) that handles create and edit flows via URL query state (`courtId`, `step`). Preserve legacy links by redirecting `/owner/places/:placeId/courts/:courtId/setup` to the new route.

### Completed Work (if any)

- None

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/14-place-court-migration/` |
| Design System | See `context.md` |
| ERD | See `context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Route consolidation | 1A, 1B, 1C | Yes |

---

## Module Index

### Phase 1: Route Consolidation

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Unified setup page | Agent 1 | `21-01-unified-setup-route.md` |
| 1B | Route helpers + links | Agent 1 | `21-01-unified-setup-route.md` |
| 1C | Legacy redirect | Agent 1 | `21-01-unified-setup-route.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 1B, 1C | Owner court setup UX |

---

## Dependencies Graph

```
Phase 1
  ├─ 1A ── 1B
  └─ 1C
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Setup route | Single `/courts/setup` with query state | Keeps create + edit in one URL shape |
| Legacy path | Redirect to unified route | Preserve bookmarks + existing links |

---

## Document Index

| Document | Description |
|----------|-------------|
| `21-00-overview.md` | This file |
| `21-01-unified-setup-route.md` | Phase 1 implementation |

---

## Success Criteria

- [ ] `/courts/setup` handles create + edit via `courtId`
- [ ] Legacy `/courts/:courtId/setup` redirects correctly
- [ ] Navigation links updated to new route
- [ ] Build passes
