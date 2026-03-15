# tRPC React Query Hook Standardization - Master Plan

## Overview

Standardize all client-side data fetching and mutations to the canonical tRPC React Query hook signatures:

- `trpc.<router>.<procedure>.useQuery(input?, opts?)`
- `trpc.<router>.<procedure>.useMutation(opts?)`

This removes the mixed patterns currently in the codebase:

- `useTRPC()` + TanStack `useQuery(trpc.*.queryOptions(...))`
- `useTRPCClient()` + manual `useQuery({ queryKey, queryFn })`

and replaces them with a single, type-safe, rename-resilient API surface.

### Completed Work (if any)

- None yet.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Story (Type-safe invalidation) | `agent-plans/user-stories/13-trpc-utils-invalidation/13-01-type-safe-invalidation.md` |
| tRPC Docs (React Query usage) | https://trpc.io/docs/client/react |
| tRPC Docs (TanStack React Query integration) | https://trpc.io/docs/client/tanstack-react-query |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Switch tRPC client integration to hook-based API | 1A, 1B | No |
| 2 | Refactor all queries/mutations to `trpc.*.useQuery/useMutation` | 2A, 2B | Partial |
| 3 | Standardize cache invalidation via `trpc.useUtils()` | 3A | No |
| 4 | Remove legacy integration + validate | 4A, 4B | No |

---

## Module Index

### Phase 1: Integration Switch

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Introduce `trpc` hook client | Agent 1 | `24-01-integration-switch.md` |
| 1B | Wire Providers to new client | Agent 1 | `24-01-integration-switch.md` |

### Phase 2: App Refactor

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Convert all queries | Agent 1 | `24-02-hooks-refactor.md` |
| 2B | Convert all mutations | Agent 1 | `24-02-hooks-refactor.md` |

### Phase 3: Cache Semantics

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | Replace invalidations with `useUtils` | Agent 1 | `24-03-cache-invalidation.md` |

### Phase 4: Cleanup and Validation

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 4A | Remove deprecated exports/usage | Agent 1 | `24-04-cleanup-validation.md` |
| 4B | Lint/build validation | Agent 1 | `24-04-cleanup-validation.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A-4B | Frontend infrastructure + refactor |

---

## Dependencies Graph

```
Phase 1 (1A → 1B)
  └─ Phase 2 (2A ↔ 2B)
       └─ Phase 3 (3A)
            └─ Phase 4 (4A → 4B)
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Client API | `createTRPCReact` hook API | Enables `trpc.*.useQuery` signature everywhere |
| Cache invalidation | `trpc.useUtils()` helpers | Keeps invalidation type-safe + rename-resilient |
| Link strategy | Keep split JSON vs non-JSON | Preserves existing FormData upload behavior |

---

## Document Index

| Document | Description |
|----------|-------------|
| `24-00-overview.md` | This file |
| `24-01-integration-switch.md` | Phase 1 details |
| `24-02-hooks-refactor.md` | Phase 2 details |
| `24-03-cache-invalidation.md` | Phase 3 details |
| `24-04-cleanup-validation.md` | Phase 4 details |
| `trpc-react-query-hooks-dev1-checklist.md` | Dev checklist |

---

## Success Criteria

- [ ] No remaining `queryOptions()` / `mutationOptions()` usage
- [ ] No remaining `useTRPC()` / `useTRPCClient()` usage for standard fetching
- [ ] Mutations use `trpc.*.useMutation` and invalidate via `trpc.useUtils()`
- [ ] TypeScript compiles with no missing symbols
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
