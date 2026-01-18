# [00-58] Public Navbar Consistency

> Date: 2026-01-18
> Previous: 00-57-admin-batch-accordion.md

## Summary

Aligned public navigation behavior so the brand always links to the landing page and search works from any public route, using a shared URL query builder helper.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/shared/lib/url-query-builder.ts` | Added `URLQueryBuilder` and `QueryParamRecord` for consistent query construction. |
| `src/features/discovery/components/navbar.tsx` | Logo always links to `/`; search forms now use GET + query builder for `/courts` searches. |
| `src/features/discovery/components/hero-section.tsx` | Switched search/location routing to `URLQueryBuilder` and `appRoutes`. |
| `src/app/page.tsx` | Updated search + location routing to `URLQueryBuilder` for public discovery links. |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/39-public-navbar-consistency/39-00-overview.md` | Added master plan for public navbar consistency. |
| `agent-plans/39-public-navbar-consistency/39-01-public-navbar-consistency.md` | Added phase plan for navbar search + query helper. |
| `agent-plans/39-public-navbar-consistency/public-navbar-consistency-dev1-checklist.md` | Added dev checklist. |
| `agent-plans/context.md` | Logged the new plan in the changelog. |

## Key Decisions

- Standardize public search routing via `URLQueryBuilder` to avoid scattered `URLSearchParams` usage.
- Keep public logo destination fixed to `/` to meet public browsing expectations.

## Next Steps (if applicable)

- [ ] Run `pnpm lint` and `TZ=UTC pnpm build`.
- [ ] Verify search on `/courts/[id]`, `/terms`, and `/privacy`.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
