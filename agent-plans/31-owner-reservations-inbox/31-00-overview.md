## Overview

Improve the owner reservations experience with an inbox-first workflow, accessible tabs, and clearer filtering so owners can triage bookings quickly.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Owner Confirmation Stories | `agent-plans/user-stories/07-owner-confirmation/` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Tabs + inbox scaffolding | 1A | No |
| 2 | Filtering logic + counts | 2A | No |

---

## Module Index

### Phase 1: Tabs + inbox scaffolding

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Owner reservations tabs UX | Agent | `31-01-owner-tabs-accessibility.md` |

### Phase 2: Filtering logic + counts

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Inbox filters + slot-time grouping | Agent | `31-02-owner-inbox-filters.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Default tab | Inbox (pending) | Optimizes for triage-first owner workflow |
| Past definition | `status=CONFIRMED` and slot end < now | Avoids cancelled in past view |
| Upcoming definition | slot end >= now | Includes in-progress reservations |
| Counts | Derived from filtered list | Keeps counts aligned with search/date filters |

---

## Success Criteria

- [ ] All tabs have matching panels (valid `aria-controls`).
- [ ] Inbox, Upcoming, Past, Cancelled are filtered by slot time/status.
- [ ] Tab counts reflect active filters (place/court/date/search).
- [ ] UX supports quick triage of pending reservations.
