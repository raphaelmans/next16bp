# Guest Removal Requests - Master Plan

## Overview

Enable guests to submit removal requests for curated place listings from the public court detail page. Requests reuse the claim-request workflow with new guest metadata, keep admin review flows intact, and avoid file uploads when the requester is not authenticated.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/18-guest-removal/` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| PRD | `business-contexts/kudoscourts-prd-v1.2.md` |
| ERD | `business-contexts/kudoscourts-erd-specification-v1.2.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Data model + DTO updates | 1A, 1B | Partial |
| 2 | Backend API + validation | 2A, 2B | Partial |
| 3 | Public UI integration | 3A, 3B | Yes |
| 4 | Admin review polish | 4A | Yes |

---

## Module Index

### Phase 1: Data model + DTO updates

| ID | Module | Plan File |
|----|--------|-----------|
| 1A | Add guest metadata to claim_request | `44-01-data-model.md` |
| 1B | Extend removal request DTOs | `44-01-data-model.md` |

### Phase 2: Backend API + validation

| ID | Module | Plan File |
|----|--------|-----------|
| 2A | Public removal request endpoint | `44-02-backend-api.md` |
| 2B | Guest request rules + auditing | `44-02-backend-api.md` |

### Phase 3: Public UI integration

| ID | Module | Plan File |
|----|--------|-----------|
| 3A | Removal request dialog on public court page | `44-03-public-ui.md` |
| 3B | Prevent guest file uploads | `44-03-public-ui.md` |

### Phase 4: Admin review polish

| ID | Module | Plan File |
|----|--------|-----------|
| 4A | Show guest contact details in admin claim review | `44-04-admin-review.md` |

---

## Dependencies Graph

```
Phase 1 ─────┬───── Phase 2 ───── Phase 3
             │
             └───── Phase 4
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage model | Extend `claim_request` with guest fields | Reuse existing review workflows and status tracking |
| Guest submission | New public tRPC mutation | Avoid authentication requirement while keeping rate limits |
| File uploads | Disabled when not authenticated | Avoid anonymous asset uploads |

---

## Document Index

| Document | Description |
|----------|-------------|
| `44-00-overview.md` | Master plan |
| `44-01-data-model.md` | Data model + DTO updates |
| `44-02-backend-api.md` | Backend API implementation |
| `44-03-public-ui.md` | Public UI implementation |
| `44-04-admin-review.md` | Admin review updates |

---

## Success Criteria

- [ ] Guests can submit removal requests from `/courts/[id]` without signing in.
- [ ] Removal requests store guest name + email + reason.
- [ ] Admin review shows guest contact details.
- [ ] Authenticated owners can still submit removal requests.
- [ ] Guests cannot upload files.
- [ ] `pnpm lint` + `pnpm build` pass.
