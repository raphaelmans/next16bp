# Phase 1: Foundation + Shared Move

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** N/A (infra refactor)

---

## Objective
Define the target `src/lib` layout, update path aliases if needed, and move `src/shared` into `src/lib/shared` while keeping only server-safe code in the new location.

---

## Modules

### Module 1A: Target Layout + Aliases

**User Story:** N/A  
**Plan File:** `79-01-foundation-paths.md`

#### Shared / Contract
- [ ] Document new path conventions (`@/lib/shared/*`, `@/lib/modules/*`)
- [ ] Update any cross-team import guidance

##### API Contract
- N/A (no API changes)

##### Example Payloads
```json
{ "note": "No API payloads in this phase" }
```

#### Server / Backend
- [ ] Define target folder structure in `src/lib`
- [ ] Decide handling for existing `src/lib/*` (keep, move into `src/lib/shared`, or rename)
- [ ] Confirm path alias behavior in `tsconfig.json` (no new alias required if using `@/lib/*`)

#### Client / Frontend
- [ ] N/A (no UI in this phase)

---

### Module 1B: Move `src/shared` → `src/lib/shared`

**User Story:** N/A  
**Plan File:** `79-01-foundation-paths.md`

#### Shared / Contract
- [ ] Identify client-only files in `src/shared/components` or `src/shared/utils`
- [ ] Decide relocation for client-only code (e.g., `src/components`, `src/features`, or `src/shared-client`)

#### Server / Backend
- [ ] Move server-safe `src/shared/*` into `src/lib/shared/*`
- [ ] Preserve folder structure (components/infra/kernel/lib/utils) where still server-safe
- [ ] Update any server-only imports for moved shared code

#### Client / Frontend
- [ ] If client-only code exists in `src/shared`, move it out of `src/lib` before or during migration

---

#### Flow Diagram
```text
src/shared/* ──► classify (server vs client)
         ├── server-only ──► src/lib/shared/*
         └── client-only ──► src/components | src/features | src/shared-client
```

#### Testing Checklist

##### Shared / Contract
- [ ] New layout documented and shared with team

##### Server / Backend
- [ ] Typecheck passes after shared move
- [ ] No broken imports in server modules

##### Client / Frontend
- [ ] Client builds remain intact if any client code moved out

#### Handoff Notes
- [ ] Shared docs published (new paths + rules)
- [ ] Server confirms shared migration complete

---

## Phase Completion Checklist
- [ ] Target layout documented
- [ ] `src/shared` moved to `src/lib/shared`
- [ ] Client-only code removed from `src/lib`
- [ ] No TypeScript errors
