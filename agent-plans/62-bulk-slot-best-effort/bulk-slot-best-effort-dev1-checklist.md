# Developer 1 Checklist

**Focus Area:** Bulk slot best-effort creation  
**Modules:** 1A, 2A, 3A

---

## Module 1A: DB overlap constraint

**Reference:** `62-01-db-constraints.md`  
**Dependencies:** None

### Implementation

- [ ] Add exclusion constraint migration
- [ ] Confirm ordering with existing migrations

### Testing

- [ ] Validate overlap insert fails in DB

---

## Module 2A: Backend bulk insert

**Reference:** `62-02-backend-bulk-insert.md`  
**Dependencies:** Module 1A

### Implementation

- [ ] Add `createManyBestEffort` repository method
- [ ] Preload court/place/rate rules in service
- [ ] Compute pricing and skip missing rules
- [ ] Return created/attempted/skipped counts
- [ ] Add `after()` logging hook in router

### Testing

- [ ] Ensure conflicts are skipped, not fatal

---

## Module 3A: Client updates

**Reference:** `62-03-client-updates.md`  
**Dependencies:** Module 2A

### Implementation

- [ ] Update hook result mapping
- [ ] Update toast messaging
- [ ] Keep modal open if zero created

---

## Final Checklist

- [ ] All modules complete
- [ ] Lint/build checks planned
