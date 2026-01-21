# Owner Partner Landing (/list-your-venue) - Master Plan

## Overview

Add a public-facing "List your venue" landing page that acts as the shareable onboarding entrypoint for venue operators. The page should explain the minimum onboarding sequence and route users into the existing owner onboarding funnel with seamless continuation.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Story | `agent-plans/user-stories/00-onboarding/00-09-owner-list-your-venue-landing.md` |
| Related Plan | `agent-plans/48-owner-onboarding-court-verification/48-00-overview.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Public landing page + CTA wiring | 1A, 1B | Yes |
| 2 | Onboarding continuation (`next=`) | 2A, 2B | Yes |
| 3 | QA + regression checks | 3A | No |

---

## Module Index

### Phase 1: Landing Page + Entry Points

| ID | Module | Plan File |
|----|--------|----------|
| 1A | Add `/list-your-venue` page (bento + FAQ) | `55-01-landing-and-routing.md` |
| 1B | Route public CTAs to `/list-your-venue` | `55-01-landing-and-routing.md` |

### Phase 2: Seamless Continuation

| ID | Module | Plan File |
|----|--------|----------|
| 2A | Add onboarding `next` param + safe redirects | `55-01-landing-and-routing.md` |
| 2B | Update fallback onboarding links to include `next` | `55-01-landing-and-routing.md` |

### Phase 3: QA

| ID | Module | Plan File |
|----|--------|----------|
| 3A | QA checklist | `55-02-qa.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Shareable onboarding entrypoint | `/list-your-venue` | Matches existing product language, clearer than `/join-us` |
| Continuation mechanism | `?next=/owner/places/new` | Keeps onboarding context and reduces drop-off |
| Trust pages scope | Deferred | Terms/Privacy pages will be added later per product decision |

---

## Success Criteria

- [ ] Public route `/list-your-venue` exists and is mobile-friendly
- [ ] Primary CTA routes into owner onboarding with a continuation target
- [ ] Onboarding redirects respect `next` when an organization already exists
- [ ] Public navigation links point to `/list-your-venue`
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
