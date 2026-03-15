# Developer 1 Checklist

**Focus Area:** Admin courts filters  
**Modules:** 1A, 2A

---

## Module 1A: Backend Filters

**Reference:** `37-01-backend-admin-courts-filters.md`  
**User Story:** `US-02-03`

### Implementation

- [ ] Add `province` to `AdminCourtFiltersSchema`
- [ ] Pass `province` through admin courts hook
- [ ] Apply province condition in `AdminCourtRepository.findAll`

### Testing

- [ ] Province + city filter combination works

---

## Module 2A: Admin Courts UI

**Reference:** `37-02-frontend-admin-courts-filters.md`  
**User Story:** `US-02-03`

### Implementation

- [ ] Add province dropdown to `/admin/courts`
- [ ] Disable city until province selected
- [ ] Scope city options to selected province
- [ ] Reset city on province change

### Testing

- [ ] Filters update results correctly

---

## Final Checklist

- [ ] All tasks complete
- [ ] No TypeScript errors
- [ ] `pnpm build` passes
