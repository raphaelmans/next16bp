# Admin Courts Batch Accordion - Master Plan

## Overview

Add an accordion layout to the admin batch curated courts form and place an "Add Row" button at the bottom of each batch item to reduce scrolling friction.

### Completed Work (if any)

- None.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/02-court-creation/02-07-admin-batch-curated-courts.md` |
| Design System | See `context.md` |
| ERD | See `context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | UI accordion + row actions | 1A | No |

---

## Module Index

### Phase 1: UI Accordion + Row Actions

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Admin batch row accordion + add button | OpenCode | `38-01-admin-batch-accordion.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A | Admin batch UI |

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
| Accordion type | multiple | Allow multiple batch items open |
| Add button placement | bottom of each batch item | Avoid scroll-to-top for appending |

---

## Document Index

| Document | Description |
|----------|-------------|
| `38-00-overview.md` | This file |
| `38-01-admin-batch-accordion.md` | Phase 1 details |

---

## Success Criteria

- [ ] Batch row items render inside an accordion
- [ ] Each batch item exposes an "Add Row" button at the bottom
- [ ] No regressions in batch submit flow
- [ ] Build passes
