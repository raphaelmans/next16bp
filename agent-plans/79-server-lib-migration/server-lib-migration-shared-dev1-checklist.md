# Developer 1 Checklist

**Workstream:** Shared  
**Focus Area:** Layout rules + audit guardrails  
**Modules:** 1A, 3A

---

## Module 1A: Target Layout + Aliases

**Reference:** `79-01-foundation-paths.md`  
**User Story:** N/A  
**Dependencies:** None

### Shared / Contract
- [ ] Document new import conventions
- [ ] Provide migration map template

### Server / Backend
- [ ] Validate folder layout proposal

### Client / Frontend
- [ ] N/A (no UI change)

### Handoffs
- [ ] Server -> Client: share alias/path rules

---

## Module 3A: Server-Only Audit + Cleanup

**Reference:** `79-03-audit-validation.md`  
**User Story:** N/A  
**Dependencies:** Module 2A + 2B

### Shared / Contract
- [ ] Define and publish banned patterns for `src/lib`

### Server / Backend
- [ ] Run audit commands and capture results
- [ ] Relocate any client-only files out of `src/lib`

### Client / Frontend
- [ ] Verify any moved client files are reachable from UI

### Handoffs
- [ ] Publish final audit summary

---

## Parallelization Summary
| Sequence | Server / Backend | Client / Frontend |
|----------|------------------|-------------------|
| First | Layout rules + audit rules | N/A |
| Then | Audit + validation | Client smoke check |

---

## Final Checklist
- [ ] All assigned modules complete
- [ ] No TypeScript errors
- [ ] Integration tested
- [ ] Overview updated (status/notes)
