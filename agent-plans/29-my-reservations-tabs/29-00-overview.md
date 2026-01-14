## Overview

Fix the player-facing "My Reservations" page so that:

- **Upcoming/Past/Cancelled** tabs are based on the **reserved slot time** (not `createdAt`).
- Tab triggers have valid corresponding tab panels (Radix Tabs `aria-controls` correctness).
- Tab badge counts match what the list actually shows.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Story | `agent-plans/user-stories/06-court-reservation/06-04-player-views-my-reservations-tabs.md` |
| Existing Reservations Plan | `agent-plans/15-reservation-refresh/` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Backend: my reservations with slot details | 1A | No |
| 2 | UI: tabs + filtering + accessible counts | 2A | No |

---

## Module Index

### Phase 1: Backend

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Player reservations details query | Agent | `29-01-backend-my-reservations-details.md` |

### Phase 2: UI

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Reservation tabs + list integration | Agent | `29-02-ui-tabs-filtering-accessibility.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Upcoming definition | `slotEndTime >= now` | Includes in-progress reservations (future + ongoing) |
| Past definition | `status=CONFIRMED` and `slotEndTime < now` | Avoids showing cancelled/expired in Past |
| Data source | Join `reservation` → `time_slot` (+ linked slots) | Enables correct display and filtering |
| API shape | New enriched query + migrate UI | Avoid breaking existing consumers of `reservation.getMy` |

---

## Success Criteria

- [ ] `/reservations` tabs have matching panels (no broken `aria-controls`).
- [ ] Upcoming/Past/Cancelled reflect reserved slot times.
- [ ] List item shows reserved date/time range (not placeholder `createdAt`).
- [ ] Badge counts match each tab’s list.
- [ ] `pnpm lint` passes.
- [ ] `TZ=UTC pnpm build` passes.
