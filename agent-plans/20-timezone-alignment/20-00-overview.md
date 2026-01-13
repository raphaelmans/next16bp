# Place Timezone Alignment - Master Plan

## Overview

Align booking, availability, and pricing calculations to the place’s IANA timezone across server and client surfaces.

### Completed Work (if any)

- Added timezone utilities and updated availability/pricing/booking flows to use place-local day boundaries and formatting.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/06-court-reservation/`, `agent-plans/user-stories/05-availability-management/` |
| Design System | See `agent-plans/context.md` |
| ERD | See `agent-plans/context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Place timezone normalization | 1A, 1B | Yes |

---

## Module Index

### Phase 1: Place Timezone Normalization

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Server timezone rules | Agent | `20-01-place-timezone.md` |
| 1B | Client timezone display | Agent | `20-01-place-timezone.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A | Availability + pricing correctness |
| Dev 2 | 1B | Booking UI + owner calendars |

---

## Dependencies Graph

```
Phase 1 ─────┬───── Phase 2
             │
        1A ──┼── 1B
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Canonical timezone | Place IANA timezone | Booking math must reflect venue local time |
| Utility approach | `@date-fns/tz` + shared helpers | Consistent day boundaries + DST handling |

---

## Document Index

| Document | Description |
|----------|-------------|
| `20-00-overview.md` | This file |
| `20-01-place-timezone.md` | Phase 1 details |

---

## Success Criteria

- [ ] Availability and pricing stay consistent under `TZ=UTC` runtime
- [ ] Booking and owner slot times display in place timezone
- [ ] Day boundaries respect DST transitions
- [ ] Build passes
