# Admin Data Entry - Master Plan

## Overview

Implementation plan for rapid court data population via two mechanisms:
1. **Web Form** - Simple admin data entry form with reusable components
2. **CSV Import** - CLI script for bulk import

Both methods create curated courts with `type: CURATED` and `claimStatus: UNCLAIMED`.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/02-court-creation/` |
| US-02-03 | `02-03-admin-data-entry-form.md` |
| US-02-04 | `02-04-csv-import-script.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` Section 5.2 |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Admin Components | 1A, 1B | Yes |
| 2 | Data Entry Form | 2A, 2B | Partial |
| 3 | CSV Import Script | 3A | No |
| 4 | Batch Curated Courts | 4A, 4B | Partial |

---

## Module Index

### Phase 1: Admin Components (Modular)

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 1A | Admin Form Components | Reusable input, select, textarea, checkbox | `08-01-admin-components.md` |
| 1B | Admin UI Components | Form actions, success state | `08-01-admin-components.md` |

### Phase 2: Data Entry Form

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 2A | API Hook Wiring | Wire useCreateCuratedCourt to real tRPC | `08-02-data-entry-form.md` |
| 2B | Data Entry Page | Form page at /admin/courts/data-entry | `08-02-data-entry-form.md` |

### Phase 3: CSV Import Script

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 3A | Import Script | CLI script with transaction support | `08-03-csv-import-script.md` |

### Phase 4: Batch Curated Courts

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 4A | Batch Create API | Batch curated court tRPC endpoint | `08-04-batch-curated-courts.md` |
| 4B | Batch Entry Page | Admin page at /admin/courts/batch | `08-04-batch-curated-courts.md` |

---

## Dependencies Graph

```
Phase 1 ──────────── Phase 2 ──────────── Phase 3
                          │
1A (Admin Components) ────┤
                          │
1B (UI Components) ───────┼── 2A (Hook Wiring)
                          │         │
                          │         ▼
                          └── 2B (Data Entry Page)
                                     │
                                     ▼
                          4A/4B (Batch Entry)

                          3A (CSV Script) ── Independent
```

**Notes:**
- Phase 1 components are prerequisites for Phase 2
- Phase 4 depends on Phase 2 hook wiring
- Phase 3 is independent and can be done in parallel with Phase 2
- CSV script uses direct Drizzle (no tRPC), so no dependency on hook wiring


---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Form UI | Single-page, no cards | Optimized for data entry speed |
| Admin components | New modular components | Reusable across future admin forms |
| API wiring | Wire existing hook to tRPC | Backend already exists |
| CSV auth | Direct Drizzle (like seed) | No tRPC needed for scripts |
| Default coords | Manila center | Better than 0,0 for Philippines |
| Duplicates | Skip by name+city | Safe, idempotent imports |

---

## Document Index

| Document | Description |
|----------|-------------|
| `08-00-overview.md` | This file |
| `08-01-admin-components.md` | Phase 1: Modular admin components |
| `08-02-data-entry-form.md` | Phase 2: Data entry form and API wiring |
| `08-03-csv-import-script.md` | Phase 3: CSV import script |
| `08-04-batch-curated-courts.md` | Phase 4: Batch curated court entry |
| `08-dev-checklist.md` | Developer implementation checklist |

---

## Success Criteria

- [ ] All admin components created and exported
- [ ] useCreateCuratedCourt wired to real tRPC API
- [ ] Data entry form works end-to-end
- [ ] "Create Another" flow works
- [ ] CSV import script imports courts successfully
- [ ] Batch entry portal creates multiple courts
- [ ] Duplicates are skipped with warning
- [ ] Transaction rollback works on error
- [ ] Build passes with no TypeScript errors
