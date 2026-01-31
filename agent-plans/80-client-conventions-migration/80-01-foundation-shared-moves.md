# Phase 1: Shared Utilities + Common Layout

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** N/A (infra refactor)

---

## Objective
Move shared client utilities into `src/common`, align providers and route helpers, and establish a clean client-only utility boundary per guides.

---

## Modules

### Module 1A: Move Shared Client Utilities to `src/common`

**User Story:** N/A  
**Plan File:** `80-01-foundation-shared-moves.md`

#### Shared / Contract
- [ ] Map `src/shared/lib/*` client-safe utilities to `src/common/*` destinations
- [ ] Define `src/common` subfolders (e.g., `providers/`, `hooks/`, `utils/`)

##### API Contract
- N/A

##### Example Payloads
```json
{ "note": "No API payloads in this phase" }
```

#### Server / Backend
- [ ] N/A (client-only utilities)

#### Client / Frontend
- [ ] Move `app-routes.ts` and route helpers into `src/common`
- [ ] Move client hooks (toast, clipboard, onboarding intent) into `src/common/hooks`
- [ ] Move client-only API clients into `src/common/clients`

---

### Module 1B: Align Providers + Route Helpers

**User Story:** N/A  
**Plan File:** `80-01-foundation-shared-moves.md`

#### Shared / Contract
- [ ] Document new provider location and import paths

#### Server / Backend
- [ ] N/A

#### Client / Frontend
- [ ] Move `src/components/providers.tsx` to `src/common/providers/index.tsx`
- [ ] Update all imports to new `src/common` paths

---

#### Flow Diagram
```text
src/shared/lib (client) ──► src/common/*
src/components/providers.tsx ──► src/common/providers/index.tsx
```

#### Testing Checklist

##### Shared / Contract
- [ ] Migration map reviewed

##### Server / Backend
- [ ] N/A

##### Client / Frontend
- [ ] Typecheck passes after moves
- [ ] No missing imports in client routes

#### Handoff Notes
- [ ] Shared docs updated (new `src/common` layout)

---

## Phase Completion Checklist
- [ ] Shared client utilities moved to `src/common`
- [ ] Providers relocated and imports updated
- [ ] No TypeScript errors
