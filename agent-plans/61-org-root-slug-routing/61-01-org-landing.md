# Org Landing Page (Public)

**Dependencies:** None

---

## Objective

Expose a single public endpoint to fetch an organization plus venue “card-ready” data, then use it to render a bento-style landing page at `/org/[slug]`.

---

## Module 1A: Backend - `organization.getLandingBySlug`

### API Endpoints

| Endpoint | Method | Input | Output |
| --- | --- | --- | --- |
| `organization.getLandingBySlug` | Query | `{ slug: string }` | `{ organization, profile, places, stats }` |

### Output Shape (high level)

- `organization`: `{ id, name, slug }` (exclude `ownerUserId`)
- `profile`: `{ description?, logoUrl?, contactEmail?, contactPhone?, address? }`
- `places[]`: place card model (id, slug, name, address, city, coverImageUrl, logoUrl, sports[], courtCount, lowestPriceCents?, currency?, verificationStatus?, reservationsEnabled?, placeType, featuredRank)
- `stats`: `{ venueCount, totalCourts, cityCount, verifiedVenueCount, topSports[] }`

### Implementation Steps

1. Add a place repository method to list active places by `organizationId`.
2. Add a service method that:
   - loads org + profile by slug
   - loads places for the org
   - loads place card media + meta in batch
   - shapes a safe response (no owner identifiers)
3. Add `organization.getLandingBySlug` to the tRPC router (publicProcedure).

---

## Module 2A: Frontend - `/org/[slug]` Landing Page

### UI Layout (ASCII)

```
┌──────────────────────────────────────────────────────────┐
│ Hero                                                     │
│  [Logo]  Org Name                                        │
│          Description                                     │
│          [View Venues] [Contact]                         │
│                                                          │
│  ┌───────┬───────┬───────┬────────┐                      │
│  │Venues │Courts │Cities │Sports  │  (bento stats)        │
│  └───────┴───────┴───────┴────────┘                      │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Our Venues                                                │
│  [PlaceCard] [PlaceCard] [PlaceCard] ...                  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Sports + Contact                                          │
│  [badges]                 [email/phone/address]           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ CTA band                                                  │
│  Ready to play? [Browse Courts]                           │
└──────────────────────────────────────────────────────────┘
```

### Implementation Steps

1. Update `generateMetadata` canonical to `/org/${slug}`.
2. Fetch landing data server-side via `createServerCaller("/org/${slug}")`.
3. Render using design system primitives:
   - `PublicShell`, `Container`, `BentoGrid`, `Card`, `Button`, `Badge`
   - `PlaceCard` for venue list
   - `EmptyState` when there are no venues
4. Ensure responsive behavior (mobile-first) and a11y (skip link already in `PublicShell`).

---

## Testing Checklist

- [ ] Org with no venues: renders empty state and CTA
- [ ] Org with venues: shows correct counts, sports badges, and venue cards
- [ ] Links go to `/venues/[placeSlug]` (slug preferred)
- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
