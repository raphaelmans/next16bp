# Phase 2: Discovery UI + URL State

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-14-01

---

## Objective

Update the `/courts` discovery UI to use province → city filters, URL params, and route navbar search traffic to `/courts`.

---

## Modules

### Module 2A: Province → City Filters (Discovery)

**User Story:** `US-14-01`  
**Reference:** `35-00-overview.md`

#### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Province | select | No | From PH dataset |
| City | select | No | From selected province |
| Sport | select | No | From sports list |

#### UI Layout

```
┌─────────────────────────────────────────────┐
│ Province [select]  City [select]  Sport     │
│ (City disabled until Province chosen)       │
└─────────────────────────────────────────────┘
```

#### Implementation Steps

1. Add `province` to search params + discovery filters state.
2. Replace hardcoded city list with PH dataset query.
3. Disable city until province selected; reset city on province change.
4. Show province/city in both desktop and sheet filter UI.

#### Testing Checklist

- [ ] Province select lists PH dataset
- [ ] City select enabled only with province
- [ ] Clear filters resets province + city

---

### Module 2B: Navbar Search Routing

**User Story:** `US-14-01`  
**Reference:** `35-00-overview.md`

#### Implementation Steps

1. Route `q` search to `/courts?q=...`.
2. Ensure the discovery page reads the query from URL.

#### Testing Checklist

- [ ] Navbar search opens `/courts?q=...`
- [ ] Results update based on search

---

## Phase Completion Checklist

- [ ] Filters aligned with PH dataset
- [ ] URL state uses province + city
- [ ] Navbar search routes to `/courts`
- [ ] Build passes
