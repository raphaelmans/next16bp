# Developer 1 Checklist

**Focus Area:** Org public landing endpoint + UI

---

## Backend

- [ ] Add place repository method: active places by `organizationId`
- [ ] Add `organization.getLandingBySlug` (service + router)
- [ ] Ensure response omits `ownerUserId`

## Frontend

- [ ] Redesign `src/app/(public)/org/[slug]/page.tsx` to landing layout
- [ ] Fix canonical URL to `/org/${slug}`
- [ ] Render venues via `PlaceCard` and handle empty state

## Validation

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
