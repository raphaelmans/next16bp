# Phase 1: Data Model Updates

**Dependencies:** None  
**Parallelizable:** No  
**User Stories:** US-02-09

---

## Objective

Allow deleting a place without removing courts/time slots/reservations by making `court.place_id` nullable and configuring the FK to `ON DELETE SET NULL`.

---

## Modules

### Module 1A: Court FK Detachment + Migration

**User Story:** `US-02-09`  
**Reference:** `52-00-overview.md`

#### Directory Structure

```
src/shared/infra/db/schema/
└── court.ts

drizzle/
└── 0005_detach_court_place.sql
```

#### Implementation Steps

1. Update `court.placeId` to remove `.notNull()` and set `onDelete: "set null"`.
2. Add a migration to drop the existing FK, drop `NOT NULL`, and recreate the FK with `ON DELETE SET NULL`.
3. Update any TypeScript usages that assume `court.placeId` is always defined.

#### Code Example

```typescript
placeId: uuid("place_id").references(() => place.id, {
  onDelete: "set null",
}),
```

#### Testing Checklist

- [ ] `pnpm lint`
- [ ] `pnpm build`

---

## Phase Completion Checklist

- [ ] Schema updated
- [ ] Migration file created
- [ ] TypeScript nullability adjustments done
