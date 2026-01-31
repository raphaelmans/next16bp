# Phase 3: Targeted Composability Refactors

**Dependencies:** Phase 2 complete  
**Parallelizable:** Partial  
**User Stories:** N/A (refactor)

---

## Objective
Refactor the largest client-side offenders into feature/presentation layers, move heavy logic into helpers/hooks, and keep pages thin.

---

## Modules

### Module 3A: Booking Studio + Owner Availability

**User Story:** N/A  
**Plan File:** `80-03-targeted-refactors.md`

#### Shared / Contract
- [ ] Define shared booking-studio helpers/hooks module

##### API Contract
- N/A

##### Example Payloads
```json
{ "note": "No API payloads in this phase" }
```

#### Server / Backend
- [ ] N/A

#### Client / Frontend
- [ ] Split `src/app/(owner)/owner/bookings/page.tsx` into route shell + feature component
- [ ] Extract timeline math, selection config, import overlay logic into `features/owner/booking-studio/helpers.ts`
- [ ] Move URL state and derived view state into `features/owner/booking-studio/hooks.ts`
- [ ] Apply the same helpers/hooks to `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx`

---

### Module 3B: Public Place Detail

**User Story:** N/A  
**Plan File:** `80-03-targeted-refactors.md`

#### Shared / Contract
- [ ] Define discovery feature extraction targets

#### Server / Backend
- [ ] N/A

#### Client / Frontend
- [ ] Split `src/app/(public)/places/[placeId]/place-detail-client.tsx` into sections
- [ ] Move availability computations into `features/discovery/helpers.ts`
- [ ] Move selection/state into `features/discovery/hooks.ts`

---

### Module 3C: Admin + Import Review

**User Story:** N/A  
**Plan File:** `80-03-targeted-refactors.md`

#### Shared / Contract
- [ ] Define admin feature extraction targets

#### Server / Backend
- [ ] N/A

#### Client / Frontend
- [ ] Split `src/app/(admin)/admin/courts/[id]/page.tsx` into form + panels in `features/admin/components`
- [ ] Split `src/app/(admin)/admin/courts/batch/page.tsx` into batch form sections
- [ ] Split `src/app/(owner)/owner/import/bookings/[jobId]/page.tsx` into review table + action panels
- [ ] Refactor `src/features/owner/components/court-schedule-editor.tsx` into helpers/hooks + subcomponents

---

#### Flow Diagram
```text
Large page ──► Feature component ──► Presentation components
            └──► helpers.ts + hooks.ts
```

#### Testing Checklist

##### Shared / Contract
- [ ] Shared helper APIs documented

##### Server / Backend
- [ ] N/A

##### Client / Frontend
- [ ] Visual parity maintained for each page
- [ ] No behavioral regressions in selection and form flows

#### Handoff Notes
- [ ] Capture refactor boundaries and extracted helpers

---

## Phase Completion Checklist
- [ ] Largest pages split into feature/presentation components
- [ ] Helpers + hooks extracted per feature
- [ ] No TypeScript errors
