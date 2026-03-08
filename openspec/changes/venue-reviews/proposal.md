## Why

Players can browse curated and organization-owned venues today, but they have no way to share their experience or help other players judge venue quality. Adding authenticated venue reviews creates social proof on discovery surfaces, makes venue pages more useful, and gives the platform a durable reputation layer that survives curated-to-claimed ownership transitions because the underlying venue identity remains the same `place`.

## What Changes

- Add venue reviews for any authenticated user on both curated and organization-owned venues.
- Limit each authenticated user to one editable 1-5 star review per venue, with optional written feedback.
- Publish reviews immediately after submission while allowing only the review author or an admin to remove them.
- Show aggregate review summary data on shared place cards used across public and authenticated venue browsing surfaces.
- Add a full reviews section to the shared public venue detail experience used by `/venues/[placeId]` and related aliases.
- Add admin moderation tooling to list, inspect, and remove venue reviews after publication.
- Keep reviews attached to `place` identity so they persist when a curated venue is claimed by an organization, transferred, or returned to curated.

## Capabilities

### New Capabilities

- `venue-reviews`: Authenticated venue review creation, update, removal, aggregate rating summaries, and public venue review display across cards and venue detail pages.
- `venue-review-moderation`: Admin review-moderation workflow for listing, filtering, and removing venue reviews after publication.

### Modified Capabilities

None.

## Impact

- **Schema**: New venue review persistence tied to `placeId`, including author ownership, rating, optional body, and moderation/removal metadata.
- **tRPC**: New review routers for public read access, authenticated write access, and admin moderation operations.
- **Place contracts**: Existing place card metadata and place detail responses gain review summary fields for average rating and review count.
- **UI**: Shared `PlaceCard` adds rating summary presentation; shared public venue detail page adds full review summary, list, and write/edit/delete actions.
- **Admin UI**: New moderation page and sidebar entry for published review oversight.
- **SEO**: Public venue structured data can expose aggregate ratings when review data exists.
