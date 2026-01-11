# Phase 1: tRPC Utils Migration

**Dependencies:** None  
**Parallelizable:** No  
**User Stories:** US-13-01  
**Status:** Pending

---

## Objective

Replace tRPC cache invalidation calls that use raw query keys with `useUtils` helpers, while preserving non-tRPC query invalidation where applicable.

---

## Modules

### Module 1A: Inventory Invalidations

**User Story:** `US-13-01`

#### Directory Structure

```
src/features/**/hooks/
src/features/**/components/
```

#### Implementation Steps

1. Locate all `queryClient.invalidateQueries` and `removeQueries` usages.
2. Classify each invalidation as tRPC-backed or non-tRPC/mock.
3. Map each tRPC invalidation to its router/procedure and input payload.

---

### Module 1B: Replace with `useUtils`

**User Story:** `US-13-01`

#### Implementation Steps

1. Introduce `const utils = trpc.useUtils()` where needed.
2. Replace query-key invalidations with `utils.<router>.<procedure>.invalidate()`.
3. Use router-level invalidation (e.g., `utils.reservationOwner.invalidate()`) when multiple procedures need refresh.
4. Preserve queryClient invalidations for mock/non-tRPC data.

#### Code Example

```typescript
const trpc = useTRPC();
const utils = trpc.useUtils();

return useMutation(
  trpc.profile.update.mutationOptions({
    onSuccess: async () => {
      await utils.profile.me.invalidate();
    },
  }),
);
```

---

### Module 1C: Cleanup and Validation

**User Story:** `US-13-01`

#### Implementation Steps

1. Remove unused `useQueryClient` imports where invalidations are migrated.
2. Confirm any remaining queryClient invalidations are intentional.
3. Run linting to validate formatting and unused imports.

#### Testing Checklist

- [ ] `pnpm lint`

---

## Phase Completion Checklist

- [ ] All targeted invalidations migrated
- [ ] No unused imports remain
- [ ] Lint passes
