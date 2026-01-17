# Developer 1 Checklist

**Focus Area:** Discovery filters + search  
**Modules:** 1A, 2A, 2B

---

## Module 1A: Backend Filters + Search

**Reference:** `35-01-backend-discovery-filters.md`  
**User Story:** `US-14-01`

### Implementation

- [ ] Add `province` + `q` to `ListPlacesSchema`
- [ ] Pass filters through discovery service
- [ ] Apply `province` + `q` conditions in repository

### Testing

- [ ] `?q=cebu` matches city and province
- [ ] `?province=CEBU` filters results

---

## Module 2A: Province → City UI Filters

**Reference:** `35-02-frontend-discovery-filters.md`  
**User Story:** `US-14-01`

### Implementation

- [ ] Add `province` to URL state
- [ ] Replace hardcoded cities with PH dataset
- [ ] Disable city until province selected
- [ ] Update mobile sheet filters

### Testing

- [ ] Province and city filters update results
- [ ] Clear filters resets state

---

## Module 2B: Navbar Search Routing

**Reference:** `35-02-frontend-discovery-filters.md`  
**User Story:** `US-14-01`

### Implementation

- [ ] Route search to `/courts?q=...`
- [ ] Confirm search triggers filters

---

## Final Checklist

- [ ] All tasks complete
- [ ] No TypeScript errors
- [ ] `pnpm build` passes
