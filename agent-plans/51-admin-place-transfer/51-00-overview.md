
## Overview

Enable admins to transfer curated or reservable places to a selected organization from the admin courts view. The flow supports immediate ownership assignment, optional auto-verification, and an owner login link for quick handoff.

### Completed Work (if any)

- Implemented admin organization search and transfer mutation.
- Added admin courts ownership card, transfer dialog, and owner link copy action.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Story | `agent-plans/user-stories/17-place-claiming/17-06-admin-transfers-place-to-organization.md` |
| Design System | See `agent-plans/context.md` |
| ERD | See `agent-plans/context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Backend transfer support | 1A, 1B, 1C | Yes |
| 2 | Admin courts transfer UI | 2A | Partial |

---

## Module Index

### Phase 1: Backend Transfer Support

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Admin organization search endpoint | Agent 1 | `51-01-admin-transfer-backend.md` |
| 1B | Admin transfer mutation + verification | Agent 1 | `51-01-admin-transfer-backend.md` |
| 1C | Admin list/detail ownership enrichment | Agent 1 | `51-01-admin-transfer-backend.md` |

### Phase 2: Admin Courts Transfer UI

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Ownership card + transfer dialog | Agent 1 | `51-02-admin-transfer-ui.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 1B, 1C, 2A | Admin transfer workflow |

---

## Dependencies Graph

```
Phase 1 -----+----- Phase 2
             |
            1A --- 2A
             |
            1B --- 2A
             |
            1C --- 2A
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Transfer scope | Any place -> organization | Allows curated and reservable reassignment in admin workflows |
| Reservation handling | Keep existing reservations | Avoid disruption during handoff |
| Verification on transfer | Auto-verify optional (default on) | Enables instant onboarding during calls |

---

## Document Index

| Document | Description |
|----------|-------------|
| `51-00-overview.md` | This file |
| `51-01-admin-transfer-backend.md` | Backend transfer support |
| `51-02-admin-transfer-ui.md` | Admin courts transfer UI |
| `admin-place-transfer-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] Admin can search organizations and transfer a place
- [ ] Transfer sets organization ownership and claim status to `CLAIMED`
- [ ] Optional auto-verify enables reservations immediately
- [ ] Admin courts list shows organization names consistently
- [ ] Owner login link copies successfully after transfer
- [ ] `pnpm lint` passes
- [ ] `TZ=UTC pnpm build` passes
