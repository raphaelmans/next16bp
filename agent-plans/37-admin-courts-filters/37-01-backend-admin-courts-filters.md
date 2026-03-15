# Phase 1: Backend Admin Courts Filters

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-02-03

---

## Objective

Allow admin courts list queries to filter by province, matching the stored place province values.

---

## Modules

### Module 1A: Admin Court List Filters

**User Story:** `US-02-03`  
**Reference:** `37-00-overview.md`

#### API Updates

| Layer | Change |
|-------|--------|
| `AdminCourtFiltersSchema` | Add optional `province` filter |
| Admin courts hook | Pass `province` into `trpc.admin.court.list` |
| `AdminCourtRepository.findAll` | Apply `province` filter |

#### Filter Logic

- Use province name values (not slugs)
- Use `ilike` for case-insensitive exact match (no wildcard)

#### Implementation Steps

1. Extend `AdminCourtFiltersSchema` with optional `province`.
2. Update admin courts hook to accept and pass `province`.
3. Apply province condition in `AdminCourtRepository.findAll`.

#### Testing Checklist

- [ ] `province` filter reduces admin list results
- [ ] `city` still filters in combination with `province`

---

## Phase Completion Checklist

- [ ] Backend filters accept `province`
- [ ] Repository applies province condition
- [ ] TypeScript passes
