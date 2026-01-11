# tRPC Utils Invalidation - Master Plan

## Overview

Refactor client-side tRPC query invalidation to use `useUtils` helpers instead of `queryClient.invalidateQueries`, improving type safety and reducing manual query key maintenance.

### Completed Work (if any)

- None yet.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/13-trpc-utils-invalidation/` |
| tRPC Docs | https://trpc.io/docs/client/react/useUtils |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Audit and migrate invalidations | 1A, 1B, 1C | No |

---

## Module Index

### Phase 1: Audit and Migration

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Inventory invalidations | Agent 1 | `13-01-invalidation-migration.md` |
| 1B | Update invalidations to useUtils | Agent 1 | `13-01-invalidation-migration.md` |
| 1C | Cleanup and validation | Agent 1 | `13-01-invalidation-migration.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A-1C | Frontend hooks refactor |

---

## Dependencies Graph

```
Phase 1 (1A → 1B → 1C)
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Invalidation API | `trpc.useUtils()` helpers | Keeps query keys type-safe |

---

## Document Index

| Document | Description |
|----------|-------------|
| `13-00-overview.md` | This file |
| `13-01-invalidation-migration.md` | Phase 1 details |
| `trpc-utils-invalidation-dev1-checklist.md` | Dev checklist |

---

## Success Criteria

- [ ] All tRPC invalidations use `useUtils`
- [ ] Non-tRPC invalidations remain explicit
- [ ] TypeScript passes with no missing symbols
- [ ] `pnpm lint` completes
