---
tags:
  - agent-context
  - frontend/home
  - frontend/discovery
date: 2026-03-08
previous: 03-05-root-landing-no-redirect.md
related_contexts:
  - "[[03-05-root-landing-no-redirect]]"
  - "[[01-80-free-reservation-branding]]"
---

# [03-06] Landing Page Overhaul — Player-First Discovery

> Date: 2026-03-08
> Previous: 03-05-root-landing-no-redirect.md

## Summary

Overhauled the landing page from a booking-centric pitch to a discovery-first identity. Built 3 A/B-testable variant pages (Bold Athletic, Clean Minimal, Warm Community) sharing composable section components. Replaced the monolithic 675-line `home-page-client.tsx` with a 25-line variant switcher. Currently running **clean-minimal** variant. Created vision documentation in `important/vision/`.

## Related Contexts

- [[03-05-root-landing-no-redirect]] - Previous landing page change that removed portal redirect logic
- [[01-80-free-reservation-branding]] - Earlier branding shift that informed the "free for venues" messaging

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/home/components/home-page-client.tsx` | Rewritten from 675-line monolith to 25-line variant switcher |
| `src/features/home/constants/landing-variant.ts` | **NEW** — A/B variant constant, set to `"clean-minimal"` |
| `src/features/home/constants/popular-locations.ts` | **NEW** — Extracted shared popular locations constant |
| `src/features/home/constants/home-faq.ts` | Rewritten to player-focused discovery FAQs |
| `src/features/home/components/variants/bold-athletic.tsx` | **NEW** — Variant A: large type, watermark step numbers |
| `src/features/home/components/variants/clean-minimal.tsx` | **NEW** — Variant B: whitespace, connected-line steps |
| `src/features/home/components/variants/warm-community.tsx` | **NEW** — Variant C: pill badge, single-card steps |
| `src/features/home/components/variants/shared/proof-bar.tsx` | **NEW** — 3 visual treatments per variant |
| `src/features/home/components/variants/shared/before-after.tsx` | **NEW** — Discovery pain/gain comparison |
| `src/features/home/components/variants/shared/featured-venues.tsx` | **NEW** — No placeholder cards, "Browse all" link |
| `src/features/home/components/variants/shared/faq-section.tsx` | **NEW** — Player-focused FAQ accordion |
| `src/features/home/components/variants/shared/final-cta.tsx` | **NEW** — 3 CTA treatments; clean-minimal uses court-line pattern on teal bg |
| `src/features/home/components/variants/shared/owner-strip.tsx` | **NEW** — Compact venue owner section |
| `src/features/home/components/variants/shared/showcase-cards.tsx` | **NEW** — Uses real PlaceCard with Unsplash images, links to `/courts` |
| `src/app/page.tsx` | Updated metadata to discovery-focused title/description |
| `src/features/discovery/components/footer.tsx` | Updated tagline to vision statement |
| `src/app/globals.css` | Added `prefers-reduced-motion` for custom animations |
| `public/images/showcase/*-court.webp` | **NEW** — 900x506 Unsplash showcase images |

### Documentation

| File | Change |
|------|--------|
| `important/vision/00-overview.md` | **NEW** — Vision docs entry point |
| `important/vision/01-vision-and-mission.md` | **NEW** — Vision, mission, pain/promise |
| `important/vision/02-core-philosophies.md` | **NEW** — 5 guiding philosophies |
| `important/vision/03-copy-principles.md` | **NEW** — Word choice, tone, audience rules |

## Tag Derivation (From This Session's Changed Files)

- `frontend/home` — home feature components, constants, variants
- `frontend/discovery` — footer tagline update

## Key Decisions

- **Variant switching via constant** — single `LANDING_VARIANT` constant swaps the entire page; all 3 variants statically imported for zero-latency switching
- **Shared sections with variant prop** — sections like proof-bar, before-after, FAQ handle own conditional styling; How It Works is unique per variant (too different to share)
- **Real PlaceCard in showcase** — showcase cards render actual PlaceCard with mock data and `linkScope="none"`, staying in sync with discovery card design automatically
- **Showcase images from Unsplash** — free-use sport court photos, optimized to WebP via ImageMagick at 900x506 for retina clarity
- **Court-line pattern on clean-minimal CTA** — user preferred court-line grid over plain gray bg
- **No new dependencies** — all animations from existing tw-animate-css + custom keyframes

## Next Steps (if applicable)

- [ ] Visual review all 3 variants on mobile (375px), tablet (768px), desktop (1024px, 1440px)
- [ ] Test variant switching by changing `LANDING_VARIANT` to `"bold-athletic"` and `"warm-community"`
- [ ] Verify FAQ structured data still generates valid JSON-LD in browser
- [ ] Decide which variant to ship to production

## Commands to Continue

```bash
# Switch variant (edit the constant)
# Options: "bold-athletic" | "clean-minimal" | "warm-community"
code src/features/home/constants/landing-variant.ts

# Run dev server to visually review
pnpm dev

# Validate
pnpm lint
```
