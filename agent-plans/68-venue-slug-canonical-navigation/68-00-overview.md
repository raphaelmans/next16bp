# Venue Slug Canonical Navigation - Master Plan

## Overview

Eliminate the UUID -> slug flicker when navigating to venue detail pages by:

1. Ensuring discovery cards always link to `/venues/<slug>` when available.
2. Moving canonicalization to the server so UUID entrypoints redirect before the page renders.

### Completed Work (if any)

- `/venues` routing exists and prefers slug when present.
- `PlaceCard` already uses `place.slug ?? place.id`.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| Related plan (lazy discovery) | `agent-plans/59-public-courts-lazy-card-details/59-00-overview.md` |
| Related plan (slug enforcement) | `agent-plans/60-venue-slug-required/60-00-overview.md` |
| Place card | `src/shared/components/kudos/place-card.tsx` |
| Discovery hooks | `src/features/discovery/hooks/use-discovery.ts` |
| Place repository | `src/modules/place/repositories/place.repository.ts` |
| Venue detail route | `src/app/(public)/venues/[placeId]/page.tsx` |
| Place detail route | `src/app/(public)/places/[placeId]/page.tsx` |
| Routing proxy | `src/proxy.ts` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Slug propagation: ensure `PlaceCard` inputs include slug | 1A, 1B, 1C | Yes |
| 2 | Server canonical redirect: UUID -> slug before render | 2A | No |
| 3 | QA + validation | 3A | No |

---

## Module Index

### Phase 1: Slug Propagation

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Include `place.slug` in `mapPlaceSummary` (place.list consumers) | Dev 1 | `68-01-slug-propagation.md` |
| 1B | Include `place.slug` in `place.listSummary` output (backend) | Dev 1 | `68-01-slug-propagation.md` |
| 1C | Thread `slug` through discovery summary mapping to `PlaceCard` | Dev 1 | `68-01-slug-propagation.md` |

### Phase 2: Server Canonical Redirect

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Refactor place detail into server wrapper + client component | Dev 1 | `68-02-server-canonical-redirect.md` |

### Phase 3: QA

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | Regression checks + lint/build | Dev 1 | `68-03-qa.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|----------|---------|------------|
| Dev 1 | 1A, 1B, 1C, 2A, 3A | Routing + discovery data plumbing |

---

## Dependencies Graph

```
Phase 1 (slug propagation)
  └─ Phase 2 (server redirect)
       └─ Phase 3 (QA)
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Canonical behavior | Prefer slug everywhere; UUID redirects | Avoid visible flicker and improve SEO consistency |
| Where to canonicalize | Server page redirect (not client `router.replace`) | Prevents first-paint showing the UUID URL |
| Scope | Detail route first (`/venues/[placeId]`) | This is the highest-impact UX path |

---

## Document Index

| Document | Description |
|----------|-------------|
| `68-00-overview.md` | This file |
| `68-01-slug-propagation.md` | Ensure discovery cards link to slugs |
| `68-02-server-canonical-redirect.md` | Server-side redirect for UUID entrypoints |
| `68-03-qa.md` | Validation + regression checklist |
| `venue-slug-canonical-navigation-dev1-checklist.md` | Dev checklist |
| `68-99-deferred.md` | Explicitly out-of-scope follow-ups |

---

## Success Criteria

- [ ] Clicking a venue card from `/courts` navigates directly to `/venues/<slug>` (no UUID flash)
- [ ] Visiting `/venues/<uuid>` redirects server-side to `/venues/<slug>`
- [ ] No TypeScript errors
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass
