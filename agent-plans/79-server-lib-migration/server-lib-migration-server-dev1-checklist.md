# Developer 2 Checklist

**Workstream:** Server  
**Focus Area:** Move shared + modules  
**Modules:** 1B, 2A

---

## Module 1B: Move `src/shared` → `src/lib/shared`

**Reference:** `79-01-foundation-paths.md`  
**User Story:** N/A  
**Dependencies:** 1A

### Shared / Contract
- [ ] Identify client-only files in `src/shared`

### Server / Backend
- [ ] Move server-safe shared code into `src/lib/shared`
- [ ] Fix internal server imports

### Client / Frontend
- [ ] Coordinate relocation for client-only files

### Handoffs
- [ ] Notify client workstream of any moved files

---

## Module 2A: Move `src/modules` → `src/lib/modules`

**Reference:** `79-02-modules-imports.md`  
**User Story:** N/A  
**Dependencies:** 1B

### Shared / Contract
- [ ] Publish module mapping list

### Server / Backend
- [ ] Move all modules into `src/lib/modules`
- [ ] Update intra-module imports and router wiring

### Client / Frontend
- [ ] N/A (handled in 2B)

### Handoffs
- [ ] Publish final module paths for client import rewrite

---

## Parallelization Summary
| Sequence | Server / Backend | Client / Frontend |
|----------|------------------|-------------------|
| First | Shared move | Identify client-only files |
| Then | Module move | Import rewrite after mapping |

---

## Final Checklist
- [ ] All assigned modules complete
- [ ] No TypeScript errors
- [ ] Integration tested
- [ ] Overview updated (status/notes)
