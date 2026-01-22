# [00-99] Org Root Slug Routing

> Date: 2026-01-22
> Previous: 00-98-venue-slug-required.md

## Summary

Implemented root-level organization slug routing (`/<orgSlug>`) via Next.js fallback rewrites to a server-rendered org page, and added service-layer protection against org slug collisions with reserved top-level routes derived from `appRoutes`.

## Changes Made

### Routing

| File | Change |
| --- | --- |
| `next.config.ts` | Added `rewrites().fallback` mapping `/:orgSlug` -> `/org/:orgSlug`. |
| `src/app/(public)/org/[slug]/page.tsx` | Added server page that fetches org by slug and renders org name. |

### Backend Validation

| File | Change |
| --- | --- |
| `src/modules/organization/errors/organization.errors.ts` | Added `OrganizationSlugReservedError`. |
| `src/modules/organization/services/organization.service.ts` | Derived reserved slug set from `appRoutes` bases (+ `api`, `_next`, `org`) and enforced on create/update; normalized slugs to lowercase/trim. |

### Planning

| File | Change |
| --- | --- |
| `agent-plans/context.md` | Logged new plan entry. |
| `agent-plans/61-org-root-slug-routing/61-00-overview.md` | Master plan for org root slug routing. |
| `agent-plans/61-org-root-slug-routing/61-01-root-slug-routing.md` | Phase implementation breakdown. |
| `agent-plans/61-org-root-slug-routing/org-root-slug-dev1-checklist.md` | Developer checklist. |

## Key Decisions

- Used `rewrites().fallback` so existing routes (`/courts`, `/venues`, `/owner`, `/admin`, `/api`, etc.) are never intercepted.
- Enforced reserved slug rules in the org service layer using `appRoutes` as the source of truth for reserved top-level segments.

## Next Steps

- [ ] Consider adding reserved-slug validation to the org DTO schema (regex + min length alignment) for earlier feedback.
- [ ] Add basic org public page content later (logo, description, venues list).

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
