# Server Lib Migration - Master Plan

## Overview
Migrate server-only code into `src/lib` by moving `src/shared` and `src/modules` under `src/lib`, updating import paths, and ensuring no client/browser code remains in `src/lib`. This is an infra refactor that touches many files and must preserve runtime boundaries.

## Overview Requirements (fill before delegating)
- [x] `agent-plans/context.md` exists and is up to date (design system, ERD, refs)
- [x] User stories exist in `agent-plans/user-stories/` and are referenced below (N/A for infra refactor)
- [x] Owners assigned for Server and Client workstreams (single contributor)
- [x] Contract drafted (procedures/endpoints + DTO shapes + error shapes + auth) (N/A for refactor)
- [x] Primary UI surfaces listed (routes/pages/components) with acceptance notes (N/A for infra refactor)
- [x] Dependencies + parallelization identified (what can run in parallel)
- [x] Success criteria + test expectations captured

### Completed Work (if any)
- Moved `src/shared` and `src/modules` under `src/lib`.
- Migrated client-safe utilities to `src/common` and removed `src/lib/shared/*` shims.
- Updated imports across app, modules, and scripts to `@/common/*` or `@/lib/*`.
- Audited server-only boundaries to keep browser code out of `src/lib`.
- Verified with `pnpm lint` and `TZ=UTC pnpm build`.

### Reference Documents
| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | N/A (infra refactor) |
| Design System | See `context.md` |
| ERD | See `context.md` |

---

## Development Phases
| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Layout + shared migration foundation | 1A, 1B | Yes |
| 2 | Modules migration + import rewrite | 2A, 2B | Partial |
| 3 | Server-only audit + cleanup + validation | 3A | No |

---

## Module Index
| ID | Module | Workstream | Owner | Plan File |
|----|--------|------------|-------|----------|
| 1A | Target layout + path aliases | Shared | Dev 1 | `79-01-foundation-paths.md` |
| 1B | Move `src/shared` to `src/lib/shared` | Server | Dev 2 | `79-01-foundation-paths.md` |
| 2A | Move `src/modules` to `src/lib/modules` | Server | Dev 2 | `79-02-modules-imports.md` |
| 2B | Import path rewrite across repo | Client | Dev 3 | `79-02-modules-imports.md` |
| 3A | Server-only audit + cleanup | Shared | Dev 1 | `79-03-audit-validation.md` |

---

## Delegation Matrix (handoff map)
| Module/Deliverable | Shared / Contract Output | Server / Backend Output | Client / Frontend Output | Owner | Dependencies |
|-------------------|---------------------------|--------------------------|---------------------------|-------|--------------|
| 1A | New layout spec + alias plan | N/A | N/A | Dev 1 | None |
| 1B | Server-only rules recorded | Shared libs moved | N/A | Dev 2 | 1A |
| 2A | Migration map (old -> new) | Modules moved | N/A | Dev 2 | 1B |
| 2B | Import rewrite checklist | N/A | Client-side imports updated | Dev 3 | 1A, 2A |
| 3A | Audit rules + commands | N/A | Cleanup tasks applied | Dev 1 | 2A, 2B |

---

## Module List (current)
### `src/shared`
- `src/shared/components`
- `src/shared/infra`
- `src/shared/kernel`
- `src/shared/lib`
- `src/shared/utils`

### `src/modules`
- `audit`
- `auth`
- `availability`
- `bookings-import`
- `claim-request`
- `contact`
- `court`
- `court-block`
- `court-hours`
- `court-price-override`
- `court-rate-rule`
- `guest-profile`
- `health`
- `organization`
- `organization-payment`
- `owner-setup`
- `payment-proof`
- `place`
- `place-verification`
- `profile`
- `reservation`
- `sport`
- `storage`
- `time-slot`
- `user-preference`
- `user-role`

---

## Shared / Contract Checklist (overview-level)
- [x] Procedure/endpoints list and naming (N/A for infra refactor)
- [x] DTO shapes (input/output) + error shapes (N/A for infra refactor)
- [x] Auth rules captured (who can call what) (N/A for infra refactor)
- [x] Example payloads documented for client integration (N/A for infra refactor)

## Server / Backend Checklist (overview-level)
- [x] Data model / migrations identified (N/A for infra refactor)
- [x] Business logic + validations defined (N/A for infra refactor)
- [x] Observability expectations noted (logging/metrics) (if any) (N/A for infra refactor)
- [x] Server test strategy (unit/integration) captured (N/A for infra refactor)

## Client / Frontend Checklist (overview-level)
- [x] Routes/pages/components list (N/A for infra refactor)
- [x] Forms + validation + error mapping (N/A for infra refactor)
- [x] Loading/empty/error states defined (N/A for infra refactor)
- [x] Client test strategy (unit/e2e) captured (N/A for infra refactor)

---

## Dependencies Graph
```text
Phase 1 ─────┬───── Phase 2 ─────── Phase 3
             │
        1A ──┼── 2A
             │
        1B ──┴── 2B
```

---

## Key Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Target layout | `src/lib/shared/*` + `src/lib/modules/*` | Keeps server-only surface in one root, mirrors existing structure |
| Client-safe code | Move any client/browser code out of `src/lib` | Prevents accidental client bundling violations |

---

## Risks & Mitigations
- **Large import churn**: create a migration map and use search/replace per module; review with `pnpm lint`.
- **Client code in server lib**: phase 3 audit with `rg` on `use client`, `window`, `document`, `localStorage`, and hook usage in `src/lib`.
- **Circular dependency regressions**: migrate in phases, validate imports after each folder move.
- **Runtime-only failures**: run `pnpm build` after migration (with `TZ=UTC` per repo guidance).

---

## Document Index
| Document | Description |
|----------|-------------|
| `79-00-overview.md` | This file |
| `79-01-foundation-paths.md` | Phase 1 details |
| `79-02-modules-imports.md` | Phase 2 details |
| `79-03-audit-validation.md` | Phase 3 details |

---

## Success Criteria
- [x] `src/shared` and `src/modules` removed; contents now under `src/lib`
- [x] All imports updated to new `@/lib/...` paths
- [x] No `use client` or browser APIs in `src/lib`
- [x] `pnpm lint` passes
- [x] `TZ=UTC pnpm build` passes
