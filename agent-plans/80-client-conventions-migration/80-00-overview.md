# Client Conventions + Composability Migration - Master Plan

## Overview
Align the client codebase with `guides/client/*` conventions by migrating shared client utilities into `src/common`, consolidating feature `hooks.ts` and `schemas.ts`, and refactoring top composability offenders into feature/presentation layers. This plan pairs structural migration with targeted refactors on the largest pages/components.

## Overview Requirements (fill before delegating)
- [x] `agent-plans/context.md` exists and is up to date (design system, ERD, refs)
- [x] User stories exist in `agent-plans/user-stories/` and are referenced below (N/A for infra refactor)
- [x] Owners assigned for Server and Client workstreams (single contributor)
- [x] Contract drafted (procedures/endpoints + DTO shapes + error shapes + auth) (N/A for refactor)
- [x] Primary UI surfaces listed (routes/pages/components) with acceptance notes
- [x] Dependencies + parallelization identified (what can run in parallel)
- [x] Success criteria + test expectations captured

### Completed Work (if any)
- Phase 1: Shared utilities moved to `src/common` and providers aligned.
- Phase 2: Feature hooks/schemas consolidated.
- Phase 3: Targeted refactors complete for booking studio, place detail, admin courts, import review, schedule editor, and place form.
- Phase 4: Guardrails documented and lint/build verified (manual UI spot-check pending).

### Reference Documents
| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | N/A (infra + refactor) |
| Design System | See `context.md` |
| ERD | See `context.md` |

---

## Development Phases
| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Shared client utilities + common layout | 1A, 1B | Yes |
| 2 | Feature consolidation (`hooks.ts`, `schemas.ts`) | 2A, 2B | Yes |
| 3 | Targeted refactors for largest offenders | 3A, 3B, 3C | Partial |
| 4 | QA + guardrails + verification | 4A | No |

---

## Module Index
| ID | Module | Workstream | Owner | Plan File |
|----|--------|------------|-------|----------|
| 1A | Move shared client utilities to `src/common` | Shared | Dev 1 | `80-01-foundation-shared-moves.md` |
| 1B | Align providers + route helpers | Client | Dev 2 | `80-01-foundation-shared-moves.md` |
| 2A | Consolidate feature hooks into `hooks.ts` | Client | Dev 2 | `80-02-feature-consolidation.md` |
| 2B | Consolidate feature schemas into `schemas.ts` | Client | Dev 2 | `80-02-feature-consolidation.md` |
| 3A | Booking studio / owner availability refactor | Client | Dev 3 | `80-03-targeted-refactors.md` |
| 3B | Public place detail refactor | Client | Dev 3 | `80-03-targeted-refactors.md` |
| 3C | Admin courts + import review refactor | Client | Dev 3 | `80-03-targeted-refactors.md` |
| 4A | QA + composability guardrails | Shared | Dev 1 | `80-04-qa-and-guardrails.md` |

---

## Delegation Matrix (handoff map)
| Module/Deliverable | Shared / Contract Output | Server / Backend Output | Client / Frontend Output | Owner | Dependencies |
|-------------------|---------------------------|--------------------------|---------------------------|-------|--------------|
| 1A | New `src/common` map | N/A | Utilities moved | Dev 1 | None |
| 1B | Route/provider alignment rules | N/A | Provider + routes aligned | Dev 2 | 1A |
| 2A | Hook consolidation map | N/A | hooks.ts created per feature | Dev 2 | 1A |
| 2B | Schema consolidation map | N/A | schemas.ts created per feature | Dev 2 | 1A |
| 3A | Refactor outline | N/A | Booking + availability pages split | Dev 3 | 2A, 2B |
| 3B | Refactor outline | N/A | Place detail split | Dev 3 | 2A, 2B |
| 3C | Refactor outline | N/A | Admin + import review split | Dev 3 | 2A, 2B |
| 4A | Guardrail checklist | N/A | QA checklist + lint/build | Dev 1 | 3A, 3B, 3C |

---

## Targeted Refactor List
- `src/app/(owner)/owner/bookings/page.tsx`
- `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx`
- `src/app/(public)/places/[placeId]/place-detail-client.tsx`
- `src/app/(admin)/admin/courts/[id]/page.tsx`
- `src/app/(admin)/admin/courts/batch/page.tsx`
- `src/app/(owner)/owner/import/bookings/[jobId]/page.tsx`
- `src/features/owner/components/court-schedule-editor.tsx`
- `src/features/owner/components/place-form.tsx`

---

## Shared / Contract Checklist (overview-level)
- [x] File move map for `src/common` (see `80-01-foundation-shared-moves.md`)
- [x] Feature consolidation rules documented (see `80-02-feature-consolidation.md`)
- [x] Composability extraction criteria defined (see `80-03-targeted-refactors.md` + `80-04-qa-and-guardrails.md`)

## Server / Backend Checklist (overview-level)
- [ ] N/A (client-only refactor)

## Client / Frontend Checklist (overview-level)
- [x] Shared utilities moved to `src/common`
- [x] Feature hooks + schemas consolidated
- [x] Largest offenders refactored into feature/presentation layers
- [x] Loading/empty/error states preserved

---

## Dependencies Graph
```text
Phase 1 ─────┬───── Phase 2 ─────── Phase 3 ────── Phase 4
             │                     │
        1A ──┼── 2A ───────────────┼── 3A
             │                     ├── 3B
        1B ──┴── 2B ───────────────┴── 3C
```

---

## Key Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Shared client utilities | Move to `src/common` | Aligns with guides and separates client-safe code |
| Feature organization | `hooks.ts` + `schemas.ts` per feature | Enforces predictable structure |
| Refactor order | Booking + availability first | Highest complexity, reusable helpers |

---

## Risks & Mitigations
- **Broad import churn**: migrate utilities first, then consolidate hooks/schemas, then refactors.
- **Regression risk in large pages**: refactor behind feature components and keep UI tests/manual checks.
- **State coupling**: move URL state to feature hooks to avoid page-level logic.

---

## Document Index
| Document | Description |
|----------|-------------|
| `80-00-overview.md` | This file |
| `80-01-foundation-shared-moves.md` | Phase 1 details |
| `80-02-feature-consolidation.md` | Phase 2 details |
| `80-03-targeted-refactors.md` | Phase 3 details |
| `80-04-qa-and-guardrails.md` | Phase 4 details |

---

## Success Criteria
- [x] `src/common` populated with shared client utilities
- [x] Feature hooks consolidated to `hooks.ts`
- [x] Feature schemas consolidated to `schemas.ts`
- [x] Large pages/components split into feature/presentation layers
- [x] `pnpm lint` and `TZ=UTC pnpm build` pass
