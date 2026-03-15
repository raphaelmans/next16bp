# Owner Slot Hours Derivation - Master Plan

## Overview

Align bulk slot creation with court hours windows so owners no longer input start/end times. Slot generation uses court hours as source of truth, skips days without windows, and auto-trims to 100 slots.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/05-availability-management/` |
| User Stories | `agent-plans/user-stories/14-place-court-migration/` |
| Design System | See `context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Bulk slot derivation | 1A, 1B, 1C | Yes |

---

## Module Index

### Phase 1: Bulk Slot Derivation

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Bulk slot modal UI | Agent | `18-01-bulk-slot-modal-hours.md` |
| 1B | Bulk slot generator | Agent | `18-01-bulk-slot-modal-hours.md` |
| 1C | Call-site wiring + toasts | Agent | `18-01-bulk-slot-modal-hours.md` |

---

## Dependencies Graph

```
Phase 1 ─────┬──── 1A (Modal UI)
            ├──── 1B (Generator)
            └──── 1C (Callers)
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Slot times source | Court hours windows | Single source of truth, avoids mismatches |
| Missing hours | Skip day | Court hours dictate availability |
| Max slot cap | Auto-trim to 100 | Preserve UX and avoid errors |
| Time inputs | Removed | Prevent manual override of hours |

---

## Document Index

| Document | Description |
|----------|-------------|
| `18-00-overview.md` | This file |
| `18-01-bulk-slot-modal-hours.md` | Phase 1 implementation |
| `slot-hours-derivation-dev1-checklist.md` | Dev checklist |

---

## Success Criteria

- [ ] Bulk slot modal has no time inputs
- [ ] Slots derive from court hours windows
- [ ] Days without hours are skipped
- [ ] Slot generation auto-trims to 100
- [ ] Existing `timeSlot.createBulk` API remains unchanged
- [ ] `pnpm lint` and `pnpm build` pass
