# Owner Onboarding Revalidation - Master Plan

## Overview

Fix onboarding allowing duplicate organization creation due to stale client-side navigation state. Ensure:
- A user who already has an organization cannot create another one.
- After successful organization creation, the app behaves consistently without relying on `router.refresh()`.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Story | `agent-plans/user-stories/01-organization/01-01-owner-registers-organization.md` |
| Next.js Router Cache notes | See `agent-plans/context.md` + Next.js App Router caching docs |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Client cache + navigation fix | 1A | Yes |
| 2 | Backend enforcement (single org) | 2A | Yes |
| 3 | Validation + QA | 3A | No |

---

## Module Index

| ID | Module | Plan File |
|----|--------|----------|
| 1A | Onboarding client guard + tRPC invalidation | `41-01-client-cache-and-redirect.md` |
| 2A | Enforce single org per user on create | `41-02-backend-single-org-enforcement.md` |
| 3A | QA checklist + regression checks | `41-03-qa.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Client revalidation mechanism | React Query + client guard | Avoid `router.refresh()`; rely on tRPC query invalidation and client query refetch to converge UI |
| Prevent duplicates | Server-side conflict error | Defense-in-depth; prevents duplicate orgs even if UI stale |

---

## Success Criteria

- [ ] After creating an organization, user is routed to owner area and cannot submit onboarding again.
- [ ] Visiting `/owner/onboarding` with an existing org redirects away.
- [ ] Backend rejects attempts to create a second organization.
- [ ] `pnpm lint` passes.
- [ ] `pnpm build` passes.
