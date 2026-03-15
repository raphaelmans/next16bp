# Developer 1 Checklist

**Focus Area:** Owner place deletion (data model + API + UI)  
**Modules:** 1A, 2A, 3A

---

## Module 1A: Court FK Detachment + Migration

**Reference:** `52-01-data-model.md`  
**User Story:** `US-02-09`  
**Dependencies:** None

### Setup

- [ ] Update `court.placeId` nullability and FK behavior
- [ ] Add migration for FK + nullability changes

### Implementation

- [ ] Adjust TypeScript usages for nullable placeId

### Testing

- [ ] `pnpm lint`
- [ ] `pnpm build`

---

## Module 2A: Place Delete Mutation

**Reference:** `52-02-backend-api.md`  
**User Story:** `US-02-09`  
**Dependencies:** Module 1A

### Implementation

- [ ] Add delete DTO schema
- [ ] Add repository delete method
- [ ] Add service delete method with logging
- [ ] Add tRPC mutation

### Testing

- [ ] `pnpm lint`
- [ ] `pnpm build`

---

## Module 3A: Edit Place Delete Flow

**Reference:** `52-03-owner-ui.md`  
**User Story:** `US-02-09`  
**Dependencies:** Module 2A

### Implementation

- [ ] Add Danger Zone card and dialog
- [ ] Confirm text input gating delete action
- [ ] Wire mutation + cache invalidation + redirect

### Testing

- [ ] Delete flow works end-to-end
- [ ] `pnpm lint`
- [ ] `pnpm build`

---

## Final Checklist

- [ ] All modules complete
- [ ] No TypeScript errors
- [ ] Lint/build passing
