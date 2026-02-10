# SEO + Programmatic SEO Plan

## Technical SEO (Immediate)

- Keep `/owners/get-started` canonical and indexable.
- Keep `/list-your-venue` permanent redirect → `/owners/get-started`.
- Remove public “Pricing” nav to avoid SaaS-plan expectation.
- Update OG/Twitter images to reflect “free for venues” positioning.

## Metadata Updates (Immediate)

### Site-wide defaults (root layout)

- Keep title template, but update descriptions to mention: “free for venues” clearly (without implying free court time).

### Homepage (/)

- Keep player-intent title (discovery keywords).
- Add short owner callout in description: “free reservation system for venues”.

### Owners Get Started (/owners/get-started)

- Target B2B intent in title + description:
  - Keywords: “free reservation system”, “court booking system”, “sports venue booking” + Philippines

## Structured Data (Optional but recommended)

- Add a `SoftwareApplication` or `WebApplication` JSON-LD on `/owners/get-started` describing KudosCourts as a free reservation system (offers price = 0).
  Keep claims factual (no inflated usage stats).

## Programmatic SEO (Roadmap)

### Existing strengths

- Location pages already exist: `/courts/locations/[province]` and `/courts/locations/[province]/[city]`
- Venue profiles (`/venues/[slug]`) have schema (`SportsActivityLocation`)

### Next pSEO page types (only if content quality stays high)

1. Sport hubs:
   - `/courts/sports/[sport]`
2. Sport + location hubs:
   - `/courts/sports/[sport]/locations/[province]/[city]`

### Avoid thin content

Each hub page should include unique value:

- Counts (venues/courts in that scope)
- Top neighborhoods or cities (if available)
- “How to book” steps + FAQs
- Internal links to related sports/locations

## Internal linking

- Home → popular locations + “List your venue (free)” owner funnel
- Courts → locations + sports hubs
- Venue pages → location pages + sport hubs

