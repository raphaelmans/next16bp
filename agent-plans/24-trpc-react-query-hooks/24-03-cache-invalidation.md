# Phase 3: Cache Invalidation Standardization

**Dependencies:** Phase 2 complete  
**Parallelizable:** No  
**User Stories:** US-13-01  
**Status:** Pending

---

## Objective

Replace cache invalidation based on raw query keys or TanStack Query filters with `trpc.useUtils()` helpers, ensuring invalidation remains type-safe and resilient to router/procedure renames.

---

## Modules

### Module 3A: Replace invalidations with `trpc.useUtils()`

#### Implementation Steps

1. Locate all `queryClient.invalidateQueries(...)` calls that target tRPC-backed data.
2. Introduce `const utils = trpc.useUtils()` in the same scope.
3. Replace with targeted invalidation:
   - `utils.<router>.<procedure>.invalidate(input?)` when possible
   - `utils.<router>.invalidate()` when multiple procedures must refresh
4. Preserve explicit queryClient invalidations for:
   - mock/non-tRPC query keys
   - cross-cutting caches that are not tied to tRPC procedures

#### Code Example

```ts
const utils = trpc.useUtils();

const mutation = trpc.organization.update.useMutation({
  onSuccess: async () => {
    await utils.organization.my.invalidate();
  },
});
```

---

## Phase Completion Checklist

- [ ] tRPC invalidations use `trpc.useUtils()` helpers
- [ ] Non-tRPC invalidations remain explicit
- [ ] No unused `useQueryClient` imports remain
