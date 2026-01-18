# Phase 2: Admin Courts Filters UI

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-02-03

---

## Objective

Add province -> city dropdowns to `/admin/courts`, sourcing options from PH location data and enforcing province-first selection.

---

## Modules

### Module 2A: Province -> City Filters

**User Story:** `US-02-03`  
**Reference:** `37-00-overview.md`

#### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Province | select | No | From PH dataset (name values) |
| City | select | No | From selected province (name values) |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Type  Status  Province  City  Claim Status  Search  │
│ (City disabled until Province chosen)               │
└─────────────────────────────────────────────────────┘
```

#### Implementation Steps

1. Load PH provinces/cities via `usePHProvincesCitiesQuery`.
2. Add `provinceFilter` state and Select UI.
3. Scope city options to selected province.
4. Disable city when province is "all" or data not loaded.
5. Reset city to "all" when province changes.
6. Pass `province` to `useAdminCourts`.

#### Testing Checklist

- [ ] Province list loads from PH dataset
- [ ] City select disabled until province set
- [ ] City list updates when province changes
- [ ] Search and other filters remain functional

---

## Phase Completion Checklist

- [ ] Province -> city hierarchy working
- [ ] Admin courts list uses province filter
- [ ] No TypeScript errors
