# [01-00] Org Public Landing

> Date: 2026-01-22
> Previous: 00-99-org-root-slug-routing.md

## Summary

Implemented a public, bento-style organization landing page at `/org/[slug]`, backed by a single tRPC endpoint that returns landing-ready venue card data (media + sports + pricing + verification) and summary stats.

## Changes Made

### Agent Plans

| File | Change |
| --- | --- |
| `agent-plans/61-org-root-slug-routing/61-00-overview.md` | Master plan for org landing + phases. |
| `agent-plans/61-org-root-slug-routing/61-01-org-landing.md` | Detailed backend + UI implementation steps. |
| `agent-plans/61-org-root-slug-routing/61-02-deferred.md` | Deferred root org slug routing work. |
| `agent-plans/61-org-root-slug-routing/org-root-slug-routing-dev1-checklist.md` | Dev checklist for backend + UI. |

### Backend (tRPC + Services)

| File | Change |
| --- | --- |
| `src/modules/place/repositories/place.repository.ts` | Added `findActiveByOrganizationId` for active org venues with stable ordering. |
| `src/modules/organization/dtos/get-organization-landing.dto.ts` | Added DTO/schema for `getLandingBySlug`. |
| `src/modules/organization/dtos/index.ts` | Exported landing DTO/schema. |
| `src/modules/organization/services/organization.service.ts` | Added `getLandingBySlug` (safe org + profile + venue cards + stats). |
| `src/modules/organization/factories/organization.factory.ts` | Wired `PlaceRepository` into `OrganizationService`. |
| `src/modules/organization/organization.router.ts` | Added `organization.getLandingBySlug` (public). |

### Public UI

| File | Change |
| --- | --- |
| `src/app/(public)/org/[slug]/page.tsx` | Replaced placeholder with full landing page (hero, stats bento, venues grid via `PlaceCard`, contact, CTA); fixed canonical to `/org/${slug}`. |

## Key Decisions

- Use a single public endpoint (`organization.getLandingBySlug`) to avoid N+1 queries and keep the server-rendered org page simple.
- Return a "safe" org object (no `ownerUserId`) and reuse existing `PlaceCard` data shape for consistent discovery visuals.
- Prefer venue slugs for linking to venue detail pages (aligned with venue slug enforcement work).

## Next Steps (if applicable)

- [ ] If desired, implement deferred root org slug routing (`/{orgSlug}`) as a follow-up.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
