# Zod Schema Standardization - Master Plan

## Overview

Standardize Zod validation across the codebase using a central validation database and shared schema primitives. Migrate all DTO and form schemas to Zod v4 style with consistent, UI-friendly errors, and align form overrides with typed DTO schemas.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| User Stories (cross-cutting) | `agent-plans/user-stories/` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Foundation: validation database + shared schema primitives | 1A | No |
| 2 | Backend DTO migration | 2A | Partial |
| 3 | Client form + feature schema migration | 3A | Partial |
| 4 | QA + cleanup | 4A | No |

---

## Module Index

### Phase 1

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Validation database + shared primitives | Dev 1 | `73-01-foundation.md` |

### Phase 2

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | DTO migration (all modules) | Dev 1 | `73-02-backend-dto-migration.md` |

### Phase 3

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | Form + feature schema migration | Dev 1 | `73-03-frontend-form-migration.md` |

### Phase 4

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 4A | QA, lint/build, cleanup | Dev 1 | `73-04-qa-cleanup.md` |

---

## Workstream Scope

### Shared / Contract

- [ ] Define `validationDatabase` constants and error messages
- [ ] Add shared schema primitives + typed `modifySchema` helper
- [ ] Document Zod v4 usage patterns and overrides

### Server / Backend

- [ ] Migrate all DTO schemas to shared primitives + Zod v4 API
- [ ] Replace inline router schemas with DTOs where practical
- [ ] Align API validation messages with `validationDatabase`

### Client / Frontend

- [ ] Derive form schemas from DTOs using `modifySchema`
- [ ] Replace inline form schemas with shared primitives
- [ ] Ensure UI error messages are friendly and consistent

---

## Success Criteria

- [ ] `validation-database.ts` and `schemas.ts` are in `src/shared/kernel/` and used broadly.
- [ ] All Zod schemas use Zod v4 style (top-level format validators via `.check(...)`, `{ error: ... }`).
- [ ] DTOs and forms share constraints/messages; UI no longer shows default Zod messages.
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass.
