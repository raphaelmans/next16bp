# Duration Hours Input - Master Plan

## Overview

Replace the public booking duration buttons (1h/2h/3h) with a numeric hours stepper (1-24). Keep URL parameters in minutes for backwards compatibility while accepting any whole-hour duration.

### Completed Work

- None

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/06-court-reservation/` |
| Design System | See `context.md` |
| PRD | `business-contexts/kudoscourts-prd-v1.2.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Public duration input | 1A, 1B | Yes |

---

## Module Index

### Phase 1: Public Duration Input

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Shared duration normalizer | Agent 1 | `53-01-public-duration-hours.md` |
| 1B | Public detail + schedule + booking UI | Agent 1 | `53-01-public-duration-hours.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 1B | Client duration inputs + query parsing |

---

## Dependencies Graph

```
Phase 1
  ├─ 1A Shared duration normalizer
  └─ 1B Public duration input UI
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| URL duration units | Minutes (`duration=60`) | Preserve existing deep links |
| Input units | Hours (1-24) | Simple, consistent with hourly availability |
| Validation | Clamp to 1-24 hours | Matches backend constraints (60-1440 minutes) |

---

## Document Index

| Document | Description |
|----------|-------------|
| `53-00-overview.md` | This overview |
| `53-01-public-duration-hours.md` | Phase 1 plan |
| `duration-hours-input-dev1-checklist.md` | Dev 1 checklist |

---

## Success Criteria

- [ ] Duration input allows 1-24 hours and updates availability.
- [ ] `duration` query param remains in minutes and accepts any whole hour.
- [ ] Booking review page reflects selected duration from deep links.
- [ ] Lint/build pass.
