# Phase 2: Backend Best-Effort Bulk Insert

**Dependencies:** Phase 1 complete  
**Parallelizable:** No  
**User Stories:** 05-availability-management

---

## Objective

Refactor bulk slot creation to avoid N+1 queries, compute pricing in memory, and use best-effort insert semantics. Add an `after()` hook for non-blocking logging.

---

## Module 2A: Bulk insert + pricing prefetch

**Reference:** `62-00-overview.md`

### Directory Structure

```
src/modules/time-slot/
├── repositories/time-slot.repository.ts
├── services/time-slot.service.ts
└── time-slot.router.ts
```

### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `timeSlot.createBulk` | Mutation | `CreateBulkTimeSlotsDTO` | `{ createdCount, attemptedCount, skippedPricingCount, skippedConflictCount }` |

### Implementation Steps

1. Add `createManyBestEffort` to time slot repository using `onConflictDoNothing()`.
2. Preload court + place + all rate rules once per bulk request.
3. Compute pricing per slot in memory; skip slots missing a rule.
4. Insert all priced slots in a single batch; compute skip counts.
5. Add `after()` call in router for post-response logging.

### Flow Diagram

```
createBulk (tRPC)
  │
  ▼
prefetch court + place + rate rules
  │
  ▼
price slots in memory
  │
  ├─ skip: missing pricing
  ▼
insert batch (on conflict do nothing)
  │
  ▼
return counts + after() logging
```

### Testing Checklist

- [ ] Bulk insert skips pricing misses without failing request.
- [ ] Overlap conflicts do not abort request.
- [ ] `after()` executes without blocking response.

---

## Phase Completion Checklist

- [ ] Repository method added
- [ ] Service uses preloaded rules
- [ ] Router returns new response
