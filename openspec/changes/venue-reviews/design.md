## Context

Public venue discovery currently exposes curated and organization-owned venues through shared `place` contracts, shared `PlaceCard` presentation, and the shared public place detail page. The platform already supports identity continuity for venues: a curated venue can be claimed by an organization, transferred, or returned to curated by mutating the same `place` row rather than creating a replacement record.

The review feature therefore has two cross-cutting constraints:
- Review identity must follow `place.id`, not organization ownership, so review history survives curated-to-claimed transitions.
- Review summary data must flow through existing discovery and place-detail contracts instead of bypassing the repo's feature API chain.

Key existing infrastructure:
- `place` as the canonical venue entity for both curated and reservable venues
- Discovery read surfaces via `place.listSummary`, `place.cardMetaByIds`, and `place.getByIdOrSlug`
- Shared presentation via `src/components/kudos/place-card.tsx` and `src/features/discovery/pages/place-detail-page.tsx`
- Auth-aware tRPC procedures split across public, protected, and admin routers
- Admin shell/page conventions already used for submissions, claims, verification, and venue operations

## Goals / Non-Goals

**Goals:**
- Let any authenticated user create or update one venue review per venue.
- Support both curated and organization-owned venues with the same review capability.
- Preserve reviews when venue ownership/state changes because the underlying place identity stays stable.
- Expose aggregate rating summary on shared place cards and full review content on the shared public venue detail page.
- Allow only the review author or an admin to remove a review.
- Add an admin moderation page for tracking and removing reviews after publication.

**Non-Goals:**
- No booking-gated review requirement in v1.
- No anonymous reviews.
- No review photos, reactions, owner replies, or abuse scoring in v1.
- No admin pre-approval workflow; reviews publish immediately.
- No per-court reviews; scope is venue-level only.

## Decisions

### 1. Attach reviews to `place`, not `organization`

**Decision**: Store reviews against `placeId` and keep all aggregates keyed by `placeId`.

Claim approval, admin transfer, and recuration mutate the same `place` row. Attaching reviews to `organizationId` would sever history when a curated venue is claimed or when ownership changes. `placeId` preserves continuity and matches the way public venue URLs and discovery surfaces already identify a venue.

**Alternative considered**: Attach reviews to `organizationId`. Rejected because curated venues have no organization, and claimed venues would lose continuity if ownership changes.

### 2. One active review per user per venue

**Decision**: Enforce a single active review per `(placeId, authorUserId)` and make submit behave as create-or-update.

This matches the requested Google-style interaction model, simplifies aggregates, and avoids duplicate reviews from the same user on the same venue. The implementation should preserve auditability by marking removed reviews as removed instead of hard-deleting them from storage.

**Alternative considered**: Allow multiple reviews over time. Rejected because it complicates aggregate logic, moderation, and user expectations for a venue reputation feature.

### 3. Immediate publish with retrospective moderation

**Decision**: Reviews become visible immediately after a successful authenticated submission. Removal rights are limited to the author and admins.

This keeps the feature lightweight for v1 and avoids introducing a pre-publication moderation queue into the user flow. Admin oversight still exists through a dedicated moderation page and removal metadata.

**Alternative considered**: Admin approval before publish. Rejected because it delays social proof, increases moderation burden, and is unnecessary for the first release.

### 4. Extend place summary/detail contracts with review aggregates

**Decision**: Keep review listing and mutations in a dedicated `place-review` module, but extend existing `place.cardMetaByIds` and `place.getByIdOrSlug` responses with review summary data.

Shared card and detail UI already read from those place contracts. Adding `averageRating` and `reviewCount` there keeps the current `components -> query adapter hooks -> featureApi -> tRPC transport` chain intact while avoiding a second round-trip for every card. The full review list and viewer-owned review stay in dedicated review endpoints because they are heavier and detail-page-specific.

**Alternative considered**: Fetch all review data from a separate reviews query on every surface. Rejected because cards would need additional orchestration and duplicate loading states for a tiny aggregate summary.

### 5. Soft removal rather than hard delete

**Decision**: Model author/admin removal with metadata fields such as `removedAt`, `removedByUserId`, and `removalReason`.

Public queries ignore removed reviews for aggregates and lists, but the admin moderation surface can still audit what happened. This aligns with the “admin and user rated rating can remove rating” requirement without losing operational history.

**Alternative considered**: Hard-delete rows. Rejected because it removes moderation traceability and makes dispute handling harder.

### 6. Shared UI composition with a refined review system

**Decision**: Use the shared `PlaceCard` to render a compact rating chip anywhere place cards appear, and add a dedicated review section to the shared public place detail feature.

The visual direction should feel like an editorial travel guide rather than a bolt-on widget: warm star accents, clean histogram bars, and restrained card styling that fits the existing public discovery aesthetic. The route files remain thin and unchanged except for consuming the updated shared feature outputs.

## Risks / Trade-offs

- **[Immediate publish invites low-quality reviews]** → Mitigation: authenticated-only write access, one-review-per-user constraint, author/admin removal, and an admin moderation page from day one.
- **[Aggregate queries become expensive on card-heavy pages]** → Mitigation: store review summary as aggregate SQL projections in existing batch metadata reads rather than fetching per-card review lists.
- **[Ownership changes could accidentally orphan reviews]** → Mitigation: bind reviews strictly to `placeId` and avoid any organization-linked ownership of review rows.
- **[Soft-deleted reviews complicate uniqueness]** → Mitigation: use a partial uniqueness rule for active reviews only and exclude removed rows from public queries.
- **[Shared `PlaceCard` changes affect more surfaces than `/courts`]** → Mitigation: treat the new summary as additive and small, with loading behavior flowing through the same card-meta adapters already used on those surfaces.

## Migration Plan

1. Add the review schema and indexes, including active-review uniqueness and removal metadata.
2. Add review repositories/services/routers for public listing, authenticated upsert/delete, and admin moderation.
3. Extend place card-meta and place detail responses with aggregate rating summary fields.
4. Add review UI to shared place cards and the shared place detail page, including login redirect for unauthenticated write intents.
5. Add admin moderation route and sidebar navigation entry.
6. Validate aggregates and removal behavior with tests, then roll out with no backfill required because review data starts empty.

Rollback:
- Hide UI entry points first.
- Revert review router usage and contract extensions.
- Leave the review table in place unless a dedicated destructive rollback is explicitly needed.

## Open Questions

None for v1. The current scope fixes review eligibility, review model, publication behavior, and moderation rights.
