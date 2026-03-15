# Developer 1 Checklist

**Focus Area:** Owner filter nuqs migration  
**Modules:** 1A, 1B

---

## Module 1A: Filter hooks via nuqs

**Reference:** `22-01-owner-filter-nuqs.md`  
**User Story:** `US-04-01`

### Implementation

- [ ] Replace router-based sync with `useQueryState`
- [ ] Persist selection to localStorage
- [ ] Seed query from stored value
- [ ] Keep `syncToUrl` option

---

## Module 1B: Callsites + QA

**Reference:** `22-01-owner-filter-nuqs.md`  
**User Story:** `US-04-01`

### Implementation

- [ ] Disable URL sync where required
- [ ] Verify Setup Wizard retains `courtId`

---

## Final Checklist

- [ ] `pnpm lint` passes
- [ ] Setup Wizard navigation verified
