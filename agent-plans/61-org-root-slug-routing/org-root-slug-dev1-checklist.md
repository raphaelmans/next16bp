# Developer 1 Checklist

**Focus Area:** Root org slug routing + reserved slug enforcement

## Rewrites + Page

- [ ] Add Next.js fallback rewrite for `/<org_slug>`
- [ ] Create `src/app/(public)/org/[slug]/page.tsx` server page
- [ ] Render org name server-side via `organization.getBySlug`

## Reserved Slugs

- [ ] Derive reserved top-level slugs from `appRoutes` bases
- [ ] Add `api`, `_next`, `org` to reserved set
- [ ] Enforce reserved slugs in org create/update service

## Validation

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
