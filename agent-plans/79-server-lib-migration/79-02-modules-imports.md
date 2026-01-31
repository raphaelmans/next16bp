# Phase 2: Modules Move + Import Rewrite

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** N/A (infra refactor)

---

## Objective
Move `src/modules/*` to `src/lib/modules/*` and update all imports across server and client codebases to new `@/lib/...` paths.

---

## Modules

### Module 2A: Move `src/modules` → `src/lib/modules`

**User Story:** N/A  
**Plan File:** `79-02-modules-imports.md`

#### Shared / Contract
- [ ] Migration map of old → new paths for each module

##### API Contract
- N/A (no API changes)

##### Example Payloads
```json
{ "note": "No API payloads in this phase" }
```

#### Server / Backend
- [ ] Move all module folders into `src/lib/modules`
- [ ] Fix internal module imports (relative/alias) after move
- [ ] Confirm tRPC router assembly still points to the new locations

#### Client / Frontend
- [ ] N/A (import rewrite handled in Module 2B)

---

### Module 2B: Import Path Rewrite

**User Story:** N/A  
**Plan File:** `79-02-modules-imports.md`

#### Shared / Contract
- [ ] Provide import rewrite rules (old -> new)

#### Server / Backend
- [ ] Update server imports referencing `src/shared` or `src/modules`

#### Client / Frontend
- [ ] Update client imports referencing `src/shared` or `src/modules`
- [ ] Ensure no direct client imports from `src/lib/modules` unless server-safe and intended

---

#### Flow Diagram
```text
src/modules/* ──► src/lib/modules/*
            └──► update imports across repo to @/lib/modules/*
```

#### Testing Checklist

##### Shared / Contract
- [ ] Migration map validated by at least one reviewer

##### Server / Backend
- [ ] `pnpm lint` passes for server files
- [ ] No broken tRPC routers/imports

##### Client / Frontend
- [ ] No client bundling errors after import rewrite

#### Handoff Notes
- [ ] Server provides final module path list
- [ ] Client confirms import rewrites complete

---

## Phase Completion Checklist
- [ ] All module folders moved
- [ ] All imports updated
- [ ] No TypeScript errors
