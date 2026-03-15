# Form Standardization - Master Plan

## Overview

Standardize client forms around react-hook-form + Zod with the documented StandardForm components. First migration target is `CourtForm` to eliminate resets on submit errors and align with the court setup wizard UX. Then derive a reusable checklist for migrating the rest of the codebase.

### Completed Work (if any)

- None (planning phase).

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/02-court-creation/` |
| Design System | See `context.md` |
| Form Guides | `guides/client/core/forms.md`, `guides/client/references/02-react-hook-form-patterns.md`, `guides/client/references/09-standard-form-components.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | StandardForm foundation + CourtForm migration | 1A, 1B, 1C | Partial |
| 2 | Migration checklist + rollout guidance | 2A | Yes |
| 3 | Repo-wide form migration plan | 3A | Yes |

---

## Module Index

### Phase 1: CourtForm Migration

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | StandardForm components | Agent 1 | `32-01-courtform-foundation.md` |
| 1B | CourtForm RHF migration | Agent 1 | `32-01-courtform-foundation.md` |
| 1C | Court setup submit integration | Agent 1 | `32-01-courtform-foundation.md` |

### Phase 2: Migration Checklist

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Form migration checklist | Agent 1 | `32-02-form-migration-checklist.md` |

### Phase 3: Repo-wide Migration

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | All-forms migration checklist | Agent 1 | `32-03-all-forms-checklist.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 1B, 1C, 2A, 3A | Standard form components + CourtForm migration |

---

## Dependencies Graph

```
Phase 1 ────── Phase 2 ────── Phase 3
  │
  ├─ 1A (StandardForm)
  │
  ├─ 1B (CourtForm RHF)
  │
  └─ 1C (Court setup submit)
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Form library | react-hook-form + zodResolver | Align with documented standards and validation UX |
| Server error display | Toast-only | Avoid noisy inline errors; preserve UX direction |
| Reset behavior | Reset on success only | Prevent data loss on failed submit |
| Mutation API | Always `mutateAsync` | Enables centralized error handling and predictable flow |

---

## Document Index

| Document | Description |
|----------|-------------|
| `32-00-overview.md` | Master plan (this file) |
| `32-01-courtform-foundation.md` | StandardForm components + CourtForm migration |
| `32-02-form-migration-checklist.md` | Checklist to migrate remaining forms |
| `32-03-all-forms-checklist.md` | Checklist of every form to migrate |
| `form-standardization-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] StandardForm components exist under `src/components/form/` and mirror the guide.
- [ ] `CourtForm` uses RHF + Zod and no longer resets on error.
- [ ] Court setup wizard uses `mutateAsync` and toast-only server errors.
- [ ] Migration checklist is available for remaining forms.
- [ ] All-form checklist tracks remaining migrations.
