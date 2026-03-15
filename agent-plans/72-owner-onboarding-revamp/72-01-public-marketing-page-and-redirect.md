# Phase 2: Public Marketing Page + Redirect

**Dependencies:** Phase 1 route contract
**Parallelizable:** Yes

## Objective

Make `/owners/get-started` the canonical, indexable marketing entry point and permanently redirect `/list-your-venue`.

---

## Shared / Contract

- URL policy:
  - Canonical: `/owners/get-started`
  - Legacy: `/list-your-venue` => permanent redirect
- Tracking baseline:
  - `funnel.owner_get_started_viewed`
  - `funnel.owner_get_started_cta_clicked`

---

## Server / Backend

- [ ] Redirect implementation:
  - Replace `/list-your-venue` page with server-side permanent redirect to `/owners/get-started`.
- [ ] Sitemap:
  - Remove `/list-your-venue` entry.
  - Add `/owners/get-started` entry.

---

## Client / Frontend

### New page

- [ ] Create `src/app/(public)/owners/get-started/layout.tsx` with SEO metadata:
  - indexable, canonical to `/owners/get-started`
  - OpenGraph + Twitter metadata
- [ ] Create `src/app/(public)/owners/get-started/page.tsx` (funnel structure):

```text
Hero
  H1: Get your venue bookable on KudosCourts
  Subhead: Create owner account, add/claim venue, submit verification.
  Primary CTA: Create owner account  -> /register/owner?redirect=/owner/get-started
  Secondary CTA: Claim existing listing -> anchor + discovery link

How it works (3 steps)
Trust/objections (verification + "you control when bookings start")
FAQ
Final CTA
```

### Internal links migration

Update references from `appRoutes.listYourVenue.base` to the new route constant.

Known callers to update (search results from current repo):
- `src/features/discovery/components/footer.tsx`
- `src/features/home/components/organization-section.tsx`
- `src/features/reservation/components/owner-cta-section.tsx`
- `src/shared/components/kudos/ad-banner.tsx` (including `#verification` anchor)
- `src/features/discovery/components/navbar.tsx`

### appRoutes / route groups

- [ ] Add new route constant in `src/shared/lib/app-routes.ts`:
  - `ownersGetStarted.base = "/owners/get-started"`
- [ ] Ensure route groups treat it as public.

---

## Acceptance Criteria

- [ ] Visiting `/list-your-venue` results in a permanent redirect to `/owners/get-started`.
- [ ] `/owners/get-started` includes canonical metadata (self canonical).
- [ ] No internal links point at `/list-your-venue`.
- [ ] `src/app/sitemap.ts` contains `/owners/get-started` and not `/list-your-venue`.
