# Phase 3: Server-Only Audit + Validation

**Dependencies:** Phase 2 complete  
**Parallelizable:** No  
**User Stories:** N/A (infra refactor)

---

## Objective
Guarantee `src/lib` contains only server-safe code and validate the migration via lint/build checks.

---

## Modules

### Module 3A: Server-Only Audit + Cleanup

**User Story:** N/A  
**Plan File:** `79-03-audit-validation.md`

#### Shared / Contract
- [ ] Define banned patterns for `src/lib` (e.g., `use client`, `window`, `document`, `localStorage`, React hooks)

##### API Contract
- N/A

##### Example Payloads
```json
{ "note": "No API payloads in this phase" }
```

#### Server / Backend
- [ ] Audit `src/lib` for browser APIs and client-only modules
- [ ] Relocate any client code found
- [ ] Ensure server-only file boundaries are respected

#### Client / Frontend
- [ ] Verify client imports do not reach `src/lib` if they use browser-only code

---

#### Flow Diagram
```text
Audit src/lib ──► relocate client-only code ──► lint/build validation
```

#### Testing Checklist

##### Shared / Contract
- [ ] Audit rules documented

##### Server / Backend
- [ ] `rg "use client|window|document|localStorage|navigator"` in `src/lib` returns none
- [ ] `pnpm lint` passes
- [ ] `TZ=UTC pnpm build` passes

##### Client / Frontend
- [ ] Client routes compile without server-only import errors

#### Handoff Notes
- [ ] Final report: what moved, what stayed, remaining risks

---

## Phase Completion Checklist
- [ ] `src/lib` is server-only
- [ ] Lint/build checks pass
- [ ] Migration summary captured
