**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **developer**, I want to **invalidate tRPC queries using `useUtils` helpers** so that **cache invalidation stays type-safe and resilient to procedure renames**.

---

## Acceptance Criteria

### Type-safe Invalidations

- Given a tRPC mutation succeeds
- When the client invalidates related queries
- Then invalidation uses `trpc.useUtils()` helpers instead of raw query keys

### Targeted Refresh

- Given a mutation affects a specific procedure
- When we invalidate cached data
- Then we call `utils.<router>.<procedure>.invalidate()` with the matching input

### Router-level Refresh

- Given a mutation affects multiple procedures in a router
- When we invalidate cached data
- Then we call `utils.<router>.invalidate()` instead of invalidating all queries

### Non-tRPC Queries

- Given a hook uses mock or non-tRPC query keys
- When we refactor invalidation
- Then those queryClient invalidations remain explicit and unchanged

---

## Edge Cases

- Mutation success handlers should not invalidate unrelated routers
- Components without access to `useTRPC` should not be refactored to use unsafe keys
- Logout flows should keep cache clearing behavior aligned with auth needs

---

## References

- tRPC Docs: https://trpc.io/docs/client/react/useUtils
- Context: `agent-plans/context.md`
