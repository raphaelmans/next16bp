# Phase 2: Feature Hooks + Schemas Consolidation

**Dependencies:** Phase 1 complete  
**Parallelizable:** Yes  
**User Stories:** N/A (infra refactor)

---

## Objective
Consolidate scattered feature hooks and schemas into `hooks.ts` and `schemas.ts` per feature, aligning with client conventions.

---

## Modules

### Module 2A: Consolidate Feature Hooks

**User Story:** N/A  
**Plan File:** `80-02-feature-consolidation.md`

#### Shared / Contract
- [ ] Provide a per-feature map of hook exports → `hooks.ts`

##### API Contract
- N/A

##### Example Payloads
```json
{ "note": "No API payloads in this phase" }
```

#### Server / Backend
- [ ] N/A

#### Client / Frontend
- [ ] Merge `src/features/<feature>/hooks/*` into `src/features/<feature>/hooks.ts`
- [ ] Update imports to new hook paths

---

### Module 2B: Consolidate Feature Schemas

**User Story:** N/A  
**Plan File:** `80-02-feature-consolidation.md`

#### Shared / Contract
- [ ] Provide a per-feature map of schemas → `schemas.ts`

#### Server / Backend
- [ ] N/A

#### Client / Frontend
- [ ] Merge `src/features/<feature>/schemas/*.schema.ts` into `src/features/<feature>/schemas.ts`
- [ ] Update imports to new schema paths

---

#### Flow Diagram
```text
features/<feature>/hooks/* ──► features/<feature>/hooks.ts
features/<feature>/schemas/* ──► features/<feature>/schemas.ts
```

#### Testing Checklist

##### Shared / Contract
- [ ] Hook/schema maps reviewed

##### Server / Backend
- [ ] N/A

##### Client / Frontend
- [ ] No missing exports after consolidation
- [ ] Typecheck passes

#### Handoff Notes
- [ ] Publish per-feature consolidation mapping

---

## Phase Completion Checklist
- [ ] Feature hooks consolidated to `hooks.ts`
- [ ] Feature schemas consolidated to `schemas.ts`
- [ ] Imports updated
- [ ] No TypeScript errors
