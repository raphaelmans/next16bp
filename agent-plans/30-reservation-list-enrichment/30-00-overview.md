# Reservation List Enrichment - Master Plan

## Overview

Deliver a backend-enriched reservation list endpoint and wire the player-facing list and home summary to use real court, place, and slot data.

### Completed Work (if any)

- None.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/16-reservation-list-enrichment/` |
| Design System | See `context.md` |
| ERD | See `context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Backend enrichment endpoint | 1A, 1B | Yes |
| 2 | Frontend wiring + cache invalidation | 2A, 2B | Partial |

---

## Module Index

### Phase 1: Backend enrichment endpoint

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Repository + DTOs | Dev 1 | `30-01-backend-list-endpoint.md` |
| 1B | Service + router endpoint | Dev 1 | `30-01-backend-list-endpoint.md` |

### Phase 2: Frontend wiring + cache invalidation

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Reservation list hook + list UI | Dev 1 | `30-02-frontend-wiring.md` |
| 2B | Home summary wiring | Dev 1 | `30-02-frontend-wiring.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 1B, 2A, 2B | Backend + frontend wiring |

---

## Dependencies Graph

```
Phase 1 ─────── Phase 2
   1A ─┬─ 2A
   1B ─┴─ 2B
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cover image source | Place photos (first by display order) | Aligns with existing detail page and place-photo uploads |
| Upcoming ordering | Slot start time ascending | Ensures next games appear first |

---

## Document Index

| Document | Description |
|----------|-------------|
| `30-00-overview.md` | This file |
| `30-01-backend-list-endpoint.md` | Backend endpoint + repository query |
| `30-02-frontend-wiring.md` | Hook + UI wiring |
| `reservation-list-enrichment-dev1-checklist.md` | Dev 1 checklist |

---

## Success Criteria

- [ ] My Reservations list shows real court, date, time, and price data
- [ ] Home Upcoming Reservations summary uses real details
- [ ] No placeholders like "Loading..." remain in list output
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass
