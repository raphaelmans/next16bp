# Developer 1 Checklist

**Focus Area:** tRPC invalidation migration  
**Modules:** 1A, 1B, 1C

---

## Module 1A: Inventory Invalidations

**Reference:** `13-01-invalidation-migration.md`  
**User Story:** `US-13-01`  
**Dependencies:** None

### Setup

- [ ] Review tRPC `useUtils` docs
- [ ] List all `queryClient.invalidateQueries` usages

### Implementation

- [ ] Classify invalidations as tRPC or mock
- [ ] Map each tRPC invalidation to router/procedure

### Testing

- [ ] Not applicable

### Handoff

- [ ] Share mapping results with team

---

## Module 1B: Replace with `useUtils`

**Reference:** `13-01-invalidation-migration.md`  
**User Story:** `US-13-01`

### Implementation

- [ ] Add `const utils = trpc.useUtils()` in affected hooks
- [ ] Replace query-key invalidations with utils helpers
- [ ] Preserve non-tRPC invalidations

### Testing

- [ ] Spot-check invalidation coverage

### Handoff

- [ ] Update overview phase status

---

## Module 1C: Cleanup and Validation

**Reference:** `13-01-invalidation-migration.md`  
**User Story:** `US-13-01`

### Implementation

- [ ] Remove unused `useQueryClient` imports
- [ ] Confirm remaining queryClient usage is intentional

### Testing

- [ ] `pnpm lint`

### Handoff

- [ ] Notify team when lint passes

---

## Final Checklist

- [ ] All modules complete
- [ ] No TypeScript errors
- [ ] Linting complete
- [ ] Documentation updated
