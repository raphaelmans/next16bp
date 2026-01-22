# Organization Root Slug Routing - Master Plan

## Overview

Add `kudoscourts.com/<org_slug>` routing via Next.js rewrites to a server-rendered org profile page, and prevent org slug collisions with reserved top-level routes derived from `src/shared/lib/app-routes.ts`.

### Reference Documents

| Document | Location |
| --- | --- |
| Context | `agent-plans/context.md` |
| Next.js rewrites docs | Context7: `/vercel/next.js/v16.1.0` rewrites |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
| --- | --- | --- | --- |
| 1 | Root rewrite + public org page + reserved slug enforcement | 1A, 1B | Yes |

---

## Module Index

### Phase 1

| ID | Module | Plan File |
| --- | --- | --- |
| 1A | Next.js rewrites + public org page | `61-01-root-slug-routing.md` |
| 1B | Reserved slug enforcement in org service | `61-01-root-slug-routing.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Rewrite strategy | `rewrites().fallback` | Avoids regex exclusions; only applies when no real route matches |
| Destination route | `/org/:slug` | Internal stable destination for rewrite |
| Collision prevention | Derive reserved top-level segments from `appRoutes` | Prevent unreachable org profiles like `/courts` |

---

## Success Criteria

- [ ] Visiting `/<org_slug>` renders org page (server-side) showing org name
- [ ] Existing routes (e.g. `/courts`, `/venues`, `/owner`, `/admin`, `/api`) unaffected
- [ ] Org slugs cannot equal reserved top-level routes
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass
