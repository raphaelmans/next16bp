# Developer 3 Checklist

**Workstream:** Client  
**Focus Area:** Import rewrites + client safety  
**Modules:** 2B

---

## Module 2B: Import Path Rewrite

**Reference:** `79-02-modules-imports.md`  
**User Story:** N/A  
**Dependencies:** 1A, 2A

### Shared / Contract
- [ ] Follow migration map + rewrite rules

### Server / Backend
- [ ] N/A (server handled in 2A)

### Client / Frontend
- [ ] Update client imports to `@/lib/shared/*` (server-safe only)
- [ ] Ensure no client code imports from `@/lib/modules/*` unless explicitly server-safe

### Handoffs
- [ ] Confirm any client-only utilities relocated out of `src/lib`

---

## Parallelization Summary
| Sequence | Server / Backend | Client / Frontend |
|----------|------------------|-------------------|
| First | Module mapping published | Update imports |
| Then | Server audit | Client smoke check |

---

## Final Checklist
- [ ] All assigned modules complete
- [ ] No TypeScript errors
- [ ] Integration tested
- [ ] Overview updated (status/notes)
