# Developer 3 Checklist

**Workstream:** Client  
**Focus Area:** Feature consolidation + targeted refactors  
**Modules:** 2A, 2B, 3A, 3B, 3C

---

## Module 2A: Consolidate Feature Hooks

**Reference:** `80-02-feature-consolidation.md`  
**User Story:** N/A  
**Dependencies:** 1A

### Shared / Contract
- [ ] Provide mapping from hooks folder to `hooks.ts`

### Server / Backend
- [ ] N/A

### Client / Frontend
- [ ] Merge hook exports into `hooks.ts`
- [ ] Update imports

### Handoffs
- [ ] Share hook consolidation map

---

## Module 2B: Consolidate Feature Schemas

**Reference:** `80-02-feature-consolidation.md`  
**User Story:** N/A  
**Dependencies:** 1A

### Shared / Contract
- [ ] Provide mapping from schemas folder to `schemas.ts`

### Server / Backend
- [ ] N/A

### Client / Frontend
- [ ] Merge schemas into `schemas.ts`
- [ ] Update imports

### Handoffs
- [ ] Share schema consolidation map

---

## Module 3A: Booking Studio + Owner Availability

**Reference:** `80-03-targeted-refactors.md`  
**User Story:** N/A  
**Dependencies:** 2A, 2B

### Shared / Contract
- [ ] Document shared helper APIs

### Server / Backend
- [ ] N/A

### Client / Frontend
- [ ] Extract booking-studio helpers/hooks
- [ ] Split owner bookings + availability pages

### Handoffs
- [ ] Share helper APIs with other features

---

## Module 3B: Public Place Detail

**Reference:** `80-03-targeted-refactors.md`  
**User Story:** N/A  
**Dependencies:** 2A, 2B

### Shared / Contract
- [ ] Document discovery helper APIs

### Server / Backend
- [ ] N/A

### Client / Frontend
- [ ] Split place detail into sections
- [ ] Move availability logic into discovery helpers/hooks

### Handoffs
- [ ] Publish refactor notes

---

## Module 3C: Admin + Import Review

**Reference:** `80-03-targeted-refactors.md`  
**User Story:** N/A  
**Dependencies:** 2A, 2B

### Shared / Contract
- [ ] Document admin helper APIs

### Server / Backend
- [ ] N/A

### Client / Frontend
- [ ] Split admin court edit + batch pages into feature components
- [ ] Split import review page into table + action panels
- [ ] Refactor `court-schedule-editor` into helpers/hooks + subcomponents

### Handoffs
- [ ] Publish refactor notes

---

## Parallelization Summary
| Sequence | Server / Backend | Client / Frontend |
|----------|------------------|-------------------|
| First | N/A | Hooks + schemas consolidation |
| Then | N/A | Targeted refactors |

---

## Final Checklist
- [ ] All assigned modules complete
- [ ] No TypeScript errors
- [ ] Integration tested
- [ ] Overview updated (status/notes)
