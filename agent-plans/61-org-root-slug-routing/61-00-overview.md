# Org Public Landing - Master Plan

## Overview

Build a public, shareable organization landing page that highlights the organization, its venues (places), and the courts available across those venues.

This plan focuses on `/org/[slug]` (current route). Root-level org slugs (`/{orgSlug}`) remain a follow-up (see Deferred).

---

### Reference Documents

| Document | Location |
| --- | --- |
| Context | `agent-plans/context.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Org page route | `src/app/(public)/org/[slug]/page.tsx` |
| Organization router | `src/modules/organization/organization.router.ts` |
| Organization service | `src/modules/organization/services/organization.service.ts` |
| Place repository | `src/modules/place/repositories/place.repository.ts` |
| Place card UI | `src/shared/components/kudos/place-card.tsx` |

---

## Success Criteria

- [ ] Public org landing page renders with: hero, stats, venues grid, contact, and CTA
- [ ] Venues are linked using the venue slug when available
- [ ] Backend returns landing-ready venue card data (sports, court count, pricing, media, verification)
- [ ] No owner-identifying fields are exposed from `organization` in the landing response
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
| --- | --- | --- | --- |
| 1 | Backend: org landing data endpoint | 1A | Yes |
| 2 | Frontend: `/org/[slug]` landing page UI | 2A | Partial |
| 3 | Deferred: root org slug routing (`/{slug}`) | 3A | No |

---

## Module Index

### Phase 1

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 1A | `organization.getLandingBySlug` (public) | Agent | `61-01-org-landing.md` |

### Phase 2

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 2A | `/org/[slug]` landing page layout | Agent | `61-01-org-landing.md` |

### Phase 3 (Deferred)

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 3A | Root org slug routing + rewrite | Agent | `61-02-deferred.md` |

---

## Document Index

| Document | Description |
| --- | --- |
| `61-00-overview.md` | This file |
| `61-01-org-landing.md` | Backend + frontend implementation details |
| `org-root-slug-routing-dev1-checklist.md` | Dev checklist |
| `61-02-deferred.md` | Explicitly deferred work |
