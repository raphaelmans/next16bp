# Phase 4: QA + Guardrails

**Dependencies:** Phase 3 complete  
**Parallelizable:** No  
**User Stories:** N/A

---

## Objective
Add verification steps and guardrails to ensure composability and folder conventions remain enforced after the migration.

---

## Modules

### Module 4A: QA + Guardrails

**User Story:** N/A  
**Plan File:** `80-04-qa-and-guardrails.md`

#### Shared / Contract
- [x] Define composability checklist (page thinness, helpers/hooks extraction)

Checklist
- Pages should be thin shells that delegate to feature components.
- Heavy logic lives in `helpers.ts` or `hooks.ts` within the feature.
- Shared client utilities live in `src/common`.

##### API Contract
- N/A

##### Example Payloads
```json
{ "note": "No API payloads in this phase" }
```

#### Server / Backend
- [ ] N/A

#### Client / Frontend
- [x] Run `pnpm lint`
- [x] Run `TZ=UTC pnpm build`
- [ ] Spot-check top refactored pages for parity

---

#### Flow Diagram
```text
Refactor complete ──► lint/build ──► spot-check UI flows
```

#### Testing Checklist

##### Shared / Contract
- [ ] Checklist captured in plan notes

##### Server / Backend
- [ ] N/A

##### Client / Frontend
- [ ] Lint passes
- [ ] Build passes
- [ ] Manual verification of key flows

#### Handoff Notes
- [x] Publish QA summary and any remaining issues

QA Summary
- `pnpm lint` passes.
- `TZ=UTC pnpm build` passes.

---

## Phase Completion Checklist
- [ ] Guardrails documented
- [ ] Lint/build verified
- [ ] QA summary recorded
