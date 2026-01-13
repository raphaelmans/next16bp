# Time Slot UTC Normalization - Master Plan

## Overview

Normalize time slot timestamps to UTC on the wire while continuing to derive local scheduling from `place.timeZone`.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/05-availability-management/05-01-owner-creates-time-slots.md` |
| Design System | See `agent-plans/context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | UTC ISO normalization | 1A | Yes |

---

## Module Index

### Phase 1: UTC ISO normalization

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Shared UTC ISO helper + hook updates | Agent | `25-01-utc-normalization.md` |

---

## Dependencies Graph

```
Phase 1
  └─ 1A
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API datetime format | UTC `Z` ISO strings | Keeps storage consistent and avoids offset drift |
| Local interpretation | `place.timeZone` | Canonical local day boundaries and display |

---

## Document Index

| Document | Description |
|----------|-------------|
| `25-00-overview.md` | This overview |
| `25-01-utc-normalization.md` | Phase 1 implementation details |

---

## Success Criteria

- [ ] Bulk slot creation sends UTC `Z` timestamps
- [ ] Slot availability queries send UTC `Z` timestamps
- [ ] No invalid datetime errors for non-UTC places
