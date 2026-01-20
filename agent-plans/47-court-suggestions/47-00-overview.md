# Court Suggestions (Curated Submissions) - Master Plan

## Overview

Enable authenticated users to suggest curated courts from the public courts experience (`/courts/suggest`).

Submissions are created as real `place` + placeholder `court` records but remain fully hidden from public discovery until approved by an admin.

Admin can review pending submissions, see submitter email attribution, and approve or reject (rejection deactivates the place).

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/20-court-suggestions/` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| PRD | `business-contexts/kudoscourts-prd-v1.2.md` |
| ERD | `business-contexts/kudoscourts-erd-specification-v1.2.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Data model + migration | 1A | No |
| 2 | Backend API (submission + admin review) | 2A, 2B | Partial |
| 3 | Public gating enforcement | 3A, 3B | Partial |
| 4 | Public UI (`/courts/suggest` + CTA) | 4A, 4B | Yes |
| 5 | Admin UI (filters + actions + attribution) | 5A | Yes |
| 6 | QA | 6A | No |

---

## Module Index

### Phase 1: Data model + migration

| ID | Module | Plan File |
|----|--------|-----------|
| 1A | Add approval + submitter/reviewer metadata to `place` | `47-01-data-model.md` |

### Phase 2: Backend API

| ID | Module | Plan File |
|----|--------|-----------|
| 2A | Create `courtSubmission.submitCurated` (auth + rate limited) | `47-02-backend-api.md` |
| 2B | Add admin approve/reject + list filter by approval | `47-02-backend-api.md` |

### Phase 3: Public gating enforcement

| ID | Module | Plan File |
|----|--------|-----------|
| 3A | Public list/search only returns approved places | `47-02-backend-api.md` |
| 3B | Public place detail treats unapproved as not found | `47-02-backend-api.md` |

### Phase 4: Public UI

| ID | Module | Plan File |
|----|--------|-----------|
| 4A | `/courts/suggest` page (PublicShell + requireSession) | `47-03-public-ui.md` |
| 4B | Add “Suggest a court” CTA from `/courts` | `47-03-public-ui.md` |

### Phase 5: Admin UI

| ID | Module | Plan File |
|----|--------|-----------|
| 5A | Admin pending queue + submitter email + approve/reject UI | `47-04-admin-ui.md` |

### Phase 6: QA

| ID | Module | Plan File |
|----|--------|-----------|
| 6A | Lint + build + timezone build | `47-05-qa.md` |

---

## Dependencies Graph

```
Phase 1 -----+----- Phase 2
             |
             +----- Phase 3
             |
             +----- Phase 4
             |
             +----- Phase 5
             |
             +----- Phase 6
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage model | Create place immediately, but `isApproved=false` | Minimal changes and fits existing architecture |
| Public visibility | Fully hidden until approved | Prevents unvetted content from appearing anywhere |
| Submitter attribution | Store `submittedByEmailSnapshot` on `place` | Avoids needing joins to auth tables and preserves audit context |
| Rejection behavior | Set `isActive=false` and keep `isApproved=false` | Hides rejected entries while keeping an audit trail |
| `/courts/suggest` shell | PublicShell | Matches discovery UX while still requiring auth |

---

## Document Index

| Document | Description |
|----------|-------------|
| `47-00-overview.md` | This file |
| `47-01-data-model.md` | DB changes |
| `47-02-backend-api.md` | Routers/services + enforcement points |
| `47-03-public-ui.md` | Suggest form + CTA wiring |
| `47-04-admin-ui.md` | Admin filters + review actions |
| `47-05-qa.md` | Validation checklist |

---

## Success Criteria

- [ ] Authenticated users can submit `/courts/suggest`.
- [ ] Submissions are hidden from public list and detail until approved.
- [ ] Admin can filter pending/approved/rejected and see submitter email.
- [ ] Admin can approve and reject submissions.
- [ ] `pnpm lint` passes.
- [ ] `pnpm build` passes.
- [ ] `TZ=UTC pnpm build` passes.
