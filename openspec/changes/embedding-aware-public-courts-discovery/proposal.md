## Why

Public `/courts` search currently treats the query as a plain substring against `name`, `address`, `city`, and `province`. That works for exact text matches but misses renamed venues, branch variants, and natural multi-word queries like "cebu pickleball" when the literal string does not appear in one field.

## What Changes

- Add a guarded semantic-search path to public courts discovery that supplements lexical search with embedding-based venue candidates.
- Keep the existing lexical search as the primary path and only use semantic retrieval for first-page, multi-token queries when lexical results underfill the requested page.
- Reuse the existing private `place_embedding` table for the initial rollout so search can benefit from semantic retrieval without changing public API payloads.
- Add repeatable service tests for the semantic-search gate, fallback merge behavior, and duplicate candidate deduplication.

## Capabilities

### New Capabilities
- `public-courts-semantic-search`: Hybrid lexical-plus-semantic venue discovery for public `/courts` search queries.

### Modified Capabilities

## Impact

- Affected surfaces: public `/courts` search across the homepage navbar, homepage search form, and discovery navbar.
- Affected systems: `place.listSummary`, public discovery SSR prefetch, `PlaceDiscoveryService`, and `PlaceRepository` search retrieval.
- Affected code areas: `src/features/home/components/**`, `src/features/discovery/components/**`, `src/features/discovery/server/**`, `src/lib/modules/place/**`, and semantic-search tests under `src/__tests__/lib/modules/place/**`.
