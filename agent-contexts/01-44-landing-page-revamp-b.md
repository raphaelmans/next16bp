# [01-44] Landing Page Revamp — Variation B (Story-Driven)

> Date: 2026-02-01
> Previous: 01-43-reservation-enablement.md

## Summary

Replaced the landing page with a story-driven layout using Pain-Pleasure psychology. Six sections: Hero (pain-point headline), Before/After comparison, Featured Venues + Search, Owner Pitch, Final CTA, Footer. Stats strip deferred until real data is available.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/home-page-client.tsx` | Rewrote all sections: centered hero with pain-point headline, Before/After 2-col comparison (destructive vs primary tinting), Featured Venues with search + placeholder cards, Owner Pitch with 3 benefit cards, Final CTA |
| `src/components/kudos/featured-placeholder-card.tsx` | **New** — dashed-border placeholder card with Star icon, gradient bg, "Get Your Venue Featured" headline, and "List Your Venue — Free" CTA |
| `src/components/kudos/index.ts` | Added `FeaturedPlaceholderCard` export |

### Unchanged

| File | Notes |
|------|-------|
| `src/app/page.tsx` | No changes — still fetches up to 3 featured places |
| `src/app/home-search-form.tsx` | No changes — reused as-is in §3 |
| `src/app/home-tracked-link.tsx` | No changes — reused in Featured Venues header |

## Key Decisions

- **No stats strip** — deferred until real venue/court/city counts available from DB
- **Placeholder cards** rendered conditionally (up to 3) instead of array map to avoid Biome `noArrayIndexKey` lint error
- **Before/After** uses `destructive/5` bg + `destructive/20` border for "without" and `primary/5` bg + `primary/30` border for "with"
- **Owner pitch** uses `bg-primary/5` tinted section with Eye, Zap, Gift Lucide icons
- **Hero** uses `bg-accent/5` warm background, centered layout with dual CTAs

## Next Steps

- [ ] Add stats strip when real venue/court/city counts are queryable
- [ ] Visual QA across 0, 1, 2, 3 featured venues
- [ ] Mobile responsiveness check for Before/After cards

## Commands to Continue

```bash
pnpm dev        # Visual check
pnpm lint       # Passes clean
TZ=UTC pnpm build  # Requires env vars
```
