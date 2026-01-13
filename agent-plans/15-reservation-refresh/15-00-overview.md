# Reservation Refresh + Activity Timeline - Master Plan

## Overview

Add manual refresh controls for player/owner reservation pages and replace the player activity card with a full audit timeline backed by reservation events.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/06-court-reservation/`, `agent-plans/user-stories/07-owner-confirmation/` |
| Reservation Contract | `docs/reservation-state-machine-level-2-engineering.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Refresh controls + activity timeline | 1A, 1B | Yes |

---

## Module Index

### Phase 1: Refresh controls + activity timeline

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Reservation events API | Agent | `15-01-refresh-activity.md` |
| 1B | Player/owner UI refresh + timeline | Agent | `15-01-refresh-activity.md` |

---

## Dependencies Graph

```
Phase 1 ─────┬───── UI refresh
             └───── Events API
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Manual refresh | `queryClient.invalidateQueries` | Immediate refetch without navigation |
| Activity data source | `reservation_event` table | Full audit log already available |
| API response | Extend `reservation.getById` with events | Avoid extra client query |

---

## Document Index

| Document | Description |
|----------|-------------|
| `15-00-overview.md` | Master plan |
| `15-01-refresh-activity.md` | Phase 1 details |
| `reservation-refresh-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] Player reservation detail has a refresh button and full event timeline.
- [ ] Owner reservations list has a refresh button (no page reload).
- [ ] Owner active reservations page has a refresh button (no wait for interval).
- [ ] Activity timeline reflects all transitions with timestamps and roles.
- [ ] `pnpm lint` and `pnpm build` pass.
