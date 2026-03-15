# Place Claiming (Curated → Reservable) - Master Plan

## Overview

Enable organizations to claim curated places (including explicit, multi-sport court inventory) via an admin-reviewed workflow.

Curated places remain publicly discoverable with contact information and court inventory, but booking/availability is disabled until a claim is approved.

This plan builds on existing modules already present in the codebase (claim-request, place discovery, admin curated place creation) and focuses on:

- Adding explicit curated courts as real `court` rows (so ownership transfers automatically with the place)
- Preserving and exposing place contact info across curated/reservable transitions
- Adding owner claim UX on the public place page (dialog: org + notes)

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/17-place-claiming/` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Existing Place Detail UX Plan | `agent-plans/16-place-detail-ux/` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Data model + API contracts | 1A, 1B, 1C | Partial |
| 2 | Admin curation supports explicit courts | 2A, 2B | Partial |
| 3 | Public place UX: curated mode + claim dialog | 3A, 3B | Yes |
| 4 | Owner management: edit place contact info | 4A | Yes |

---

## Module Index

### Phase 1: Data model + API contracts

| ID | Module | Plan File |
|----|--------|-----------|
| 1A | Rename curated place details to place contact details | `33-01-data-model.md` |
| 1B | Place details response: separate contact vs policy | `33-01-data-model.md` |
| 1C | Claim approval preserves contact details | `33-01-data-model.md` |

### Phase 2: Admin curation supports explicit courts

| ID | Module | Plan File |
|----|--------|-----------|
| 2A | Curated create DTO includes `courts[]` | `33-02-admin-curation.md` |
| 2B | Admin create endpoints create court rows | `33-02-admin-curation.md` |

### Phase 3: Public place UX

| ID | Module | Plan File |
|----|--------|-----------|
| 3A | Curated place: show contact + courts, disable booking | `33-03-public-place-claim.md` |
| 3B | Claim dialog (authenticated owner only) | `33-03-public-place-claim.md` |

### Phase 4: Owner management

| ID | Module | Plan File |
|----|--------|-----------|
| 4A | Owner edits place contact details | `33-04-owner-place-contact.md` |

---

## Dependencies Graph

```
Phase 1 ─────┬───── Phase 2
             │
             ├───── Phase 3
             │
             └───── Phase 4

(Phase 2/3/4 depend on Phase 1 response shape.)
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Curated court inventory model | Use real `court` rows | Enables multi-sport, simple ownership transfer on claim |
| Claim UX | Dialog with org + notes | Minimal friction, consistent with existing dialog patterns |
| Contact info transition | Preserve contact details after claim | Avoid losing curated data; owners can edit |
| Public curated booking | Disabled | Prevents availability errors and reflects product state |

---

## Document Index

| Document | Description |
|----------|-------------|
| `33-00-overview.md` | Master plan |
| `33-01-data-model.md` | Phase 1 details |
| `33-02-admin-curation.md` | Phase 2 details |
| `33-03-public-place-claim.md` | Phase 3 details |
| `33-04-owner-place-contact.md` | Phase 4 details |
| `place-claiming-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] Curated place pages show courts + contact info publicly.
- [ ] Curated place pages do not allow booking.
- [ ] Authenticated owners can submit claim request (org + notes).
- [ ] Admin approval transfers place to org and preserves contact info.
- [ ] Admin curation can define explicit multi-sport courts.
- [ ] Owner can edit contact info and it reflects publicly.
- [ ] `pnpm lint` and `pnpm build` pass.
