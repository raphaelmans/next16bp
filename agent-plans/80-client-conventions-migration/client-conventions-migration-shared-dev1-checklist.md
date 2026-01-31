# Developer 1 Checklist

**Workstream:** Shared  
**Focus Area:** Common utilities + QA guardrails  
**Modules:** 1A, 4A

---

## Module 1A: Move Shared Client Utilities

**Reference:** `80-01-foundation-shared-moves.md`  
**User Story:** N/A  
**Dependencies:** None

### Shared / Contract
- [ ] Map client utilities → `src/common`
- [ ] Publish destination paths

### Server / Backend
- [ ] N/A

### Client / Frontend
- [ ] Update imports after moves

### Handoffs
- [ ] Share `src/common` layout with team

---

## Module 4A: QA + Guardrails

**Reference:** `80-04-qa-and-guardrails.md`  
**User Story:** N/A  
**Dependencies:** 3A, 3B, 3C

### Shared / Contract
- [ ] Compose composability checklist

### Server / Backend
- [ ] N/A

### Client / Frontend
- [ ] Run lint/build verification

### Handoffs
- [ ] Publish QA summary

---

## Parallelization Summary
| Sequence | Server / Backend | Client / Frontend |
|----------|------------------|-------------------|
| First | N/A | Shared utilities move |
| Then | N/A | QA + guardrails |

---

## Final Checklist
- [ ] All assigned modules complete
- [ ] No TypeScript errors
- [ ] Integration tested
- [ ] Overview updated (status/notes)
