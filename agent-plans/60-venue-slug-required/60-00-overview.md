# Venue Slug Enforcement - Master Plan

## Overview

This plan enforces required, auto-derived venue slugs, removes slug inputs from owner UI and DTOs, and ensures the backend always regenerates slugs from venue names.

### Completed Work (if any)

- Slug column added with backfill script and `/venues` routing support.
- Public links already prefer slug when available.

### Reference Documents

| Document | Location |
| --- | --- |
| Context | `agent-plans/context.md` |
| User Stories | None (ad-hoc change) |
| Design System | See `context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
| --- | --- | --- | --- |
| 1 | Slug enforcement + UI removal | 1A, 1B | Yes |

---

## Module Index

### Phase 1: Slug Enforcement + UI Removal

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 1A | DB + Backend enforcement | Agent | `60-01-slug-enforcement.md` |
| 1B | Owner UI + DTO cleanup | Agent | `60-01-slug-enforcement.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
| --- | --- | --- |
| Dev 1 | 1A, 1B | Backend + UI updates |

---

## Dependencies Graph

```
Phase 1
  ├─ 1A (DB + Backend)
  └─ 1B (UI + DTO cleanup)
```

---

## Key Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Slug source | Derived from venue name only | Avoid user-managed slug variants |
| Rename behavior | Slug updates automatically on name change | Matches “always derived” requirement |
| UI exposure | No slug fields in owner UI | Reduce confusion |

---

## Document Index

| Document | Description |
| --- | --- |
| `60-00-overview.md` | This file |
| `60-01-slug-enforcement.md` | Phase 1 details |
| `venue-slug-dev1-checklist.md` | Dev checklist |

---

## Success Criteria

- [ ] `place.slug` required in schema and DB
- [ ] Owner UI has no slug field
- [ ] Create/update DTOs reject slug input
- [ ] Slug regenerates on name change
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass
