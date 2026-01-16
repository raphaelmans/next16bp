# Place Location Standardization (PH Province/City) - Master Plan

## Overview

Standardize place creation and updates to use Philippines-only province/city selections sourced from a cached dataset, while keeping the country field locked to `PH` for future extensibility.

### Completed Work (if any)

- Copied `philippines-addresses.json` into `public/assets/files/`.
- Generated flattened `ph-provinces-cities.json` (province → cities map).

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Story | `agent-plans/user-stories/14-place-court-migration/14-06-owner-creates-a-place-with-multiple-courts.md` |
| Design System | See `agent-plans/context.md` |
| ERD | See `agent-plans/context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Data + API foundation | 1A, 1B | Yes |
| 2 | Form + backend enforcement | 2A, 2B | Partial |

---

## Module Index

### Phase 1: Data + API Foundation

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | PH dataset assets + cached API route | Agent 1 | `34-01-ph-address-data.md` |
| 1B | PH provinces/cities client + schema | Agent 2 | `34-01-ph-address-data.md` |

### Phase 2: Form + Backend Enforcement

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Place form dropdowns + country lock | Agent 1 | `34-02-place-form-enforcement.md` |
| 2B | DTO + schema enforcement (province required) | Agent 2 | `34-02-place-form-enforcement.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 2A | Frontend + API integration |
| Dev 2 | 1B, 2B | Client helpers + backend validation |

---

## Dependencies Graph

```
Phase 1 ─────┬───── Phase 2
             │
        1A ──┼── 2A
             │
        1B ──┴── 2B
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Country input | Disabled, default `PH` | Enforce Philippines-only data now, keep schema extensible |
| Location data source | Cached public API route | Keep payload immutable + CDN-friendly |
| City selection | Derived from province → cities map | Eliminates region/barangay inputs |

---

## Document Index

| Document | Description |
|----------|-------------|
| `34-00-overview.md` | This file |
| `34-01-ph-address-data.md` | Data assets + API route + client helpers |
| `34-02-place-form-enforcement.md` | Form UI + backend validation |
| `place-location-dev1-checklist.md` | Dev checklist |

---

## Success Criteria

- [ ] Place forms list provinces and cities from the PH dataset only
- [ ] Country is locked to `PH` in the UI and backend
- [ ] Province is required at the schema + database level
- [ ] Cached `/api/public/ph-provinces-cities` returns normalized data
- [ ] `pnpm lint` + `pnpm build` pass
