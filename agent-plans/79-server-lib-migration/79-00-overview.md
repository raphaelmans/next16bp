# Server Lib Migration - Master Plan

## Overview
Migrate server-only code into `src/lib` by moving `src/shared` and `src/modules` under `src/lib`, updating import paths, and ensuring no client/browser code remains in `src/lib`. This is an infra refactor that touches many files and must preserve runtime boundaries.

## Overview Requirements (fill before delegating)
- [ ] `agent-plans/context.md` exists and is up to date (design system, ERD, refs)
- [ ] User stories exist in `agent-plans/user-stories/` and are referenced below
- [ ] Owners assigned for Server and Client workstreams
- [ ] Contract drafted (procedures/endpoints + DTO shapes + error shapes + auth)
- [ ] Primary UI surfaces listed (routes/pages/components) with acceptance notes
- [ ] Dependencies + parallelization identified (what can run in parallel)
- [ ] Success criteria + test expectations captured

### Completed Work (if any)
- None

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
- [ ] Procedure/endpoints list and naming
- [ ] DTO shapes (input/output) + error shapes
- [ ] Auth rules captured (who can call what)
- [ ] Example payloads documented for client integration

## Server / Backend Checklist (overview-level)
- [ ] Data model / migrations identified
- [ ] Business logic + validations defined
- [ ] Observability expectations noted (logging/metrics) (if any)
- [ ] Server test strategy (unit/integration) captured

## Client / Frontend Checklist (overview-level)
- [ ] Routes/pages/components list
- [ ] Forms + validation + error mapping
- [ ] Loading/empty/error states defined
- [ ] Client test strategy (unit/e2e) captured

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
- [ ] `src/shared` and `src/modules` removed; contents now under `src/lib`
- [ ] All imports updated to new `@/lib/...` paths
- [ ] No `use client` or browser APIs in `src/lib`
- [ ] `pnpm lint` passes
- [ ] `TZ=UTC pnpm build` passes
