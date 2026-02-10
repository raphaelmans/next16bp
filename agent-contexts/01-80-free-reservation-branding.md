# [01-80] Free Reservation Branding

> Date: 2026-02-10
> Previous: 01-79-agent-context-checkpoint.md

## Summary

Repositioned KudosCourts’ public messaging to “court discovery for players + free reservation system for venues” (PH), removed the public “Pricing” navigation to avoid SaaS-plan confusion, and updated SEO/OG assets. Added social media portrayal + owner invitation templates, updated pitch deck/outreach docs to match the new promise, and regenerated the pitch deck artifacts.

## Changes Made

### Product / Marketing (Code)

| File | Change |
|------|--------|
| `src/features/discovery/components/footer.tsx` | Removed the public “Pricing” link; updated footer tagline to the new one-liner. |
| `src/common/app-routes.ts` | Removed `appRoutes.owner.pricing` since it was only used by the public footer link. |
| `src/app/home-page-client.tsx` | Updated hero pill + owner CTA copy; removed unverified “thousands of players” claim; reframed owner benefit as “Free Reservation System”. |
| `src/app/(public)/owners/get-started/page-client.tsx` | Updated hero badge/H1/intro; added FAQs for “Is it free?” and “Do you handle payments?”; replaced “pricing” → “rates” in claim section. |
| `src/app/(public)/owners/get-started/page.tsx` | Updated metadata for “free reservation system” intent; added JSON-LD (`WebApplication`) with offer price 0. |
| `src/app/(public)/owners/get-started/layout.tsx` | Updated layout metadata (title/description) to match new positioning. |
| `src/app/(public)/about/page.tsx` | Rewrote About to explain why/what/how-we-stay-free + CTAs. |
| `src/app/(public)/contact-us/page.tsx` | Replaced public “pricing” wording with “rates”. |
| `src/app/(public)/org/[slug]/page.tsx` | Replaced public “pricing” wording with “rates”. |
| `src/app/(public)/places/[placeId]/place-detail-client.tsx` | Replaced “see pricing” → “see the price” in booking UI. |
| `src/app/(public)/terms/page.mdx` | Replaced public “pricing” references with “rates/prices” language in legal text. |
| `src/app/layout.tsx` | Updated default SEO descriptions/keywords to include “free reservation system for venues” without implying free court time. |
| `src/app/page.tsx` | Updated homepage metadata description to include the owner free reservation system callout. |
| `src/app/opengraph-image.tsx` | Updated OG image alt/description to match new positioning. |
| `src/app/twitter-image.tsx` | Updated Twitter image alt/description; replaced “Join the Waitlist” stamp with “List your venue — Free”. |
| `src/app/(public)/list-your-venue/opengraph-image.tsx` | Updated OG copy to reflect “free for venues” positioning. |

### Documentation — Branding

| File | Change |
|------|--------|
| `docs/branding-update/README.md` | Added branding update index + scope/decisions. |
| `docs/branding-update/01-brand-positioning.md` | Documented positioning statement, audiences, differentiators, guardrails. |
| `docs/branding-update/02-messaging-framework.md` | Messaging framework + objections/terminology guardrails. |
| `docs/branding-update/03-website-copy.md` | String-level copy targets for public surfaces. |
| `docs/branding-update/04-seo-and-pseo-plan.md` | SEO + pSEO plan aligned with “free reservation system”. |
| `docs/branding-update/05-pricing-removal-audit.md` | Audit checklist to remove “Pricing” from public surfaces. |
| `docs/branding-update/06-qa-checklist.md` | QA checklist for navigation/copy/SEO/share assets. |

### Documentation — Social Media + Sales Templates

| File | Change |
|------|--------|
| `docs/social-media/README.md` | FB/IG portrayal rules, content pillars, tone, proof guardrails, CTA flows. |
| `docs/social-media/posts-and-scripts.md` | Post templates, ready-to-post examples, carousel outlines, reels scripts. |
| `docs/social-media/pitch-deck-portrayal.md` | Owner-focused pitch deck narrative + 6-slide outline + Q&A. |
| `docs/owner-invitation/README.md` | Owner invitation playbook + two outreach tracks + messaging rules. |
| `docs/owner-invitation/email-and-dm-templates.md` | Cold email + DM templates + follow-up sequence. |
| `docs/owner-invitation/call-script.md` | Call/WhatsApp script + objection handling. |

### Documentation — Outreach + Pitch Deck Alignment

| File | Change |
|------|--------|
| `docs/outreach/venue-verification-cold-email.md` | Replaced legacy subscription/“6 months free” outreach with pointers to the new canonical owner-invitation docs. |
| `docs/pitch-deck/01-vision.md` | Updated vision to “free reservation system for venues” framing. |
| `docs/pitch-deck/02-problem.md` | Replaced “free court” ambiguity + “pricing” → “rates”. |
| `docs/pitch-deck/03-solution.md` | Replaced “pricing rules” wording with “rate rules” and added chat. |
| `docs/pitch-deck/06-owner-journey.md` | Updated “Hourly pricing rules” → “Hourly rate rules”. |
| `docs/pitch-deck/08-go-to-market.md` | Removed early paid-plan/free-months offer; reframed verification as trust + opt-out. |
| `docs/pitch-deck/09-business-model.md` | Removed subscription model; aligned monetization to ads/sponsored placements + optional future advanced ops. |
| `docs/pitch-deck/script.md` | Removed “6 months free” beat; replaced with “Free for venues” and updated caption. |
| `docs/pitch-deck/kudoscourts-pitch-deck.pdf` | Regenerated from updated slide markdown. |
| `docs/pitch-deck/_build/pitch-deck.html` | Regenerated from updated slide markdown. |

## Key Decisions

- Public positioning is balanced: players (discovery + reserve) + venues (free reservation system).
- “Free” is always clarified as **free for venues** (platform), not free court time; public copy uses **rates/price** for venue charges.
- Removed public “Pricing” navigation to avoid SaaS-plan expectations.
- Added structured data on `/owners/get-started` describing KudosCourts as a free web application (offer price 0).
- Internal sales/outreach templates and pitch deck were updated to remove subscription/early-offer language and match the new brand promise.

## Next Steps

- [ ] Review the regenerated pitch deck PDF for slide flow and wording consistency.
- [ ] Decide whether to add Taglish variants for FB group resonance (optional).
- [ ] Update any non-doc channels (pinned posts, profile bios) to match `docs/social-media/README.md`.

## Commands to Continue

```bash
pnpm lint
pnpm exec tsx scripts/build-pitch-deck.ts
rg -n "PHP 500|Basic plan|free trial|6 months free|subscription model" docs -S
```

