# Amenities Discovery Filters (Aggregate + Optional) - Master Plan

## Overview

Add an amenities filter to `/courts` discovery that derives unique amenities from all places, exposes them via a public API route + client, and allows optional multi-select filtering with AND semantics.

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
| 1 | Backend aggregation + API route | 1A, 1B | Partial |
| 2 | Client + discovery UI + URL state | 2A, 2B | Partial |

---

## Module Index

### Phase 1: Backend Aggregation + API Route

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Aggregate amenities from places | Agent 1 | `42-01-backend-amenities.md` |
| 1B | Public API route for amenities | Agent 1 | `42-01-backend-amenities.md` |

### Phase 2: Client + Discovery UI + URL State

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Amenities client + query keys | Agent 1 | `42-02-frontend-amenities.md` |
| 2B | Discovery filters + URL state | Agent 1 | `42-02-frontend-amenities.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 1B, 2A, 2B | Amenities aggregation + discovery UI |

---

## Dependencies Graph

```
Phase 1 ─────┬───── Phase 2
             │
            1A ─── 2A, 2B
            1B ─── 2A, 2B
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Amenities source | Aggregate from place amenities | Single source of truth, avoids static list drift |
| URL encoding | `parseAsArrayOf(parseAsString)` | Align with Nuqs array parser (comma-separated) |
| Filter logic | AND | Narrow results to places with all selected amenities |
| UI placement | First filter in row | Amenities are highest priority |

---

## Document Index

| Document | Description |
|----------|-------------|
| `42-00-overview.md` | This file |
| `42-01-backend-amenities.md` | Repository + route implementation |
| `42-02-frontend-amenities.md` | Client + UI + URL state |
| `amenities-discovery-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] Amenities list is aggregated from place amenities
- [ ] `/api/public/amenities` returns a stable sorted list
- [ ] Amenities client uses query keys + Nuqs state
- [ ] Optional amenities multi-select is first filter
- [ ] AND filtering matches places with all selected amenities
- [ ] `pnpm build` passes
