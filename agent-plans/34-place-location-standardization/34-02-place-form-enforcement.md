# Phase 2: Place Form + Backend Enforcement

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-14-06

---

## Objective

Replace free-text location fields in the owner Place form with province/city dropdowns sourced from the PH dataset, lock the country field to `PH`, and enforce province requirements in schema and DTO layers.

---

## Modules

### Module 2A: Place Form Dropdowns + Country Lock

**User Story:** `US-14-06`  
**Reference:** `34-00-overview.md`

#### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Province | select | Yes | Must exist in PH dataset |
| City | select | Yes | Must exist in province city list |
| Country | select (disabled) | Yes | `PH` only |

#### UI Layout

```
┌───────────────────────────────────────────┐
│ Place Details                              │
│ ┌───────────────────────────────────────┐ │
│ │ Street Address                        │ │
│ └───────────────────────────────────────┘ │
│ ┌────────────────────┐ ┌────────────────┐ │
│ │ Province           │ │ City           │ │
│ └────────────────────┘ └────────────────┘ │
│ ┌───────────────────────────────────────┐ │
│ │ Country (PH) [disabled]               │ │
│ └───────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

#### Flow Diagram

```
Place form loads
    │
    ▼
Fetch provinces/cities
    │
    ├─ select province ─┐
    ▼                  │
Populate city options ─┘
```

#### Implementation Steps

1. Swap `city`/`province` inputs for dropdowns using dataset options.
2. Disable the `country` selector with a single `PH` option.
3. Reset `city` when `province` changes or becomes invalid.
4. Normalize submission payload to always set `country = "PH"`.

#### Testing Checklist

- [ ] Province dropdown loads from dataset
- [ ] City list updates when province changes
- [ ] City clears when province changes
- [ ] Country remains `PH` and disabled

---

### Module 2B: DTO + Schema Enforcement

**User Story:** `US-14-06`  
**Reference:** `34-00-overview.md`

#### API Updates

| Layer | Change |
|-------|--------|
| `CreatePlaceSchema` | `province` required, `country` default PH |
| `UpdatePlaceSchema` | `province` optional but must be non-empty when present |
| `place` DB schema | `province` column `.notNull()` |

#### Implementation Steps

1. Update place DTOs to require `province` on creation.
2. Make `province` mandatory in form schema + defaults.
3. Force `country` to `PH` in `PlaceManagementService`.
4. Align Drizzle schema with `province.notNull()`.

#### Testing Checklist

- [ ] Create place fails without province
- [ ] Update place preserves valid province/city
- [ ] `country` persists as `PH`

---

## Phase Completion Checklist

- [ ] Place form uses province/city selects
- [ ] Country is enforced and disabled
- [ ] DTO + DB schema updated
- [ ] Build passes
