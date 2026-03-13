# Player Discovery & Venue Shortlisting

## Purpose

This is the guide-aligned top of the player journey: how someone finds a venue worth opening before they commit to a reservation.

## Current Guide Narrative

The latest public guidance is narrower than the old platform-wide story:

1. Start with a city-and-sport surface, not a broad web search.
2. Build a shortlist from venues that are already relevant to the player's area and sport.
3. Open the venue page to judge trust, convenience, and practical fit.
4. Check availability if it exists, or use the listing details to decide whether the venue is still worth contacting directly.

That means discovery still matters even when a venue is not fully online-bookable yet.

## Player Discovery Path

### 1. Start With City And Sport

The public discovery flow is built around browsing courts and venues by location and sport. The fastest path is usually a city page or a city-plus-sport page rather than a generic homepage search.

What matters here:

- location fit
- sport coverage
- amenity filters
- verification and reservable signals
- list and map exploration

### 2. Use Browse Surfaces To Build A Shortlist

The courts discovery surface is where players narrow a broad set of options into a usable shortlist.

Current discovery surfaces include:

- the public homepage and hero entry points
- courts browse and filtered location pages
- list view cards and map view
- venue cards with summary details and trust signals

The goal at this stage is not to fully decide. It is to rule out weak options quickly.

### 3. Open The Venue Page For Trust Signals

The venue page is the main trust-building surface. It gives the player enough context to decide whether the venue is real, current, and worth a closer look.

Players evaluate:

- exact location and map/open-in-maps links
- photos and venue presentation
- sport coverage and court inventory
- review signals
- verification messaging
- whether the venue is currently reservable or discovery-only

### 4. Check Availability And The Next Action

If a venue publishes availability, the player can move directly into the booking path. If not, the discovery value is still real because the player can judge whether the venue deserves a call, message, or later revisit.

The public venue and court detail flows therefore support two valid outcomes:

- proceed into an online reservation
- stop at a higher-confidence discovery decision

## What Makes Discovery Useful

From the current guides perspective, discovery is not just "find any court." It is "find the right court with enough confidence to act."

That confidence comes from combining:

- city fit
- sport fit
- photos and page completeness
- reviews and trust indicators
- practical availability or contactability

## Key Implementation Notes

- Public venue detail URLs are served through the `/venues/:placeIdOrSlug` surface and rely on the cached public place-detail flow.
- Venue detail pages now support first-hit generation with cache reuse afterward, instead of behaving like repeated on-demand SSR for every unknown dynamic param.
- Cross-midnight and cross-week availability selection is supported when every hourly slot in the requested range is still contiguous and available.

## Related Docs

- [02-reservation-lifecycle.md](./02-reservation-lifecycle.md) for the booking handoff after discovery
- [03-venue-and-court-management.md](./03-venue-and-court-management.md) for the owner-side listing and readiness inputs that shape what players see
- [99-source-files.md](./99-source-files.md) for the implementation map
