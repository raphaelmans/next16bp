# Phase 1: Root Org Slug Routing

**Dependencies:** None  
**Parallelizable:** Yes

---

## Module 1A: Next.js Rewrites + Public Org Page

### Objective

Rewrite `/<org_slug>` to an internal public route and render the org name server-side.

### Implementation Steps

1. Add a Next.js `rewrites()` fallback entry to route `/:orgSlug` -> `/org/:orgSlug`.
2. Add `src/app/(public)/org/[slug]/page.tsx` server page.
3. Server page uses `createServerCaller` + `organization.getBySlug` and `notFound()` on failure.

### Testing

- [ ] Visit `/<org_slug>` for an existing org and confirm org name renders.
- [ ] Visit `/courts` and confirm no rewrite interference.

---

## Module 1B: Reserved Slug Enforcement

### Objective

Prevent org slugs that collide with reserved top-level routes (e.g. `courts`, `venues`, `owner`, `admin`).

### Implementation Steps

1. Derive reserved slugs from `src/shared/lib/app-routes.ts` by collecting all `.base` routes and extracting the first path segment.
2. Add additional reserved segments: `api`, `_next`, `org`.
3. Enforce on:
   - Create: reject user-provided reserved slugs; treat reserved slugs as "taken" for auto-generated slugs.
   - Update: reject changing slug to a reserved value.

### Testing

- [ ] Creating org with slug `courts` fails with a clear error.
- [ ] Auto-generated slug avoids reserved base routes.

---

## Phase Completion Checklist

- [ ] Rewrite works for root org URLs
- [ ] Reserved slug enforcement implemented
- [ ] `pnpm lint` passes
- [ ] `TZ=UTC pnpm build` passes
