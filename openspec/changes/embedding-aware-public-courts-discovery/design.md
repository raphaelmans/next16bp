## Context

Public `/courts` search currently flows from homepage and discovery nav forms into `place.listSummary`, where the repository treats `q` as a plain `%...%` substring against `name`, `address`, `city`, and `province`. That makes exact text matches fast and predictable, but it underperforms on natural multi-word venue discovery queries and branch/name variants.

The repo now has a private `place_embedding` table populated for curated places and a duplicate-check pipeline that already uses OpenAI `text-embedding-3-small`. The search change should reuse that infrastructure carefully, without turning every query into an embedding call or changing public API payloads.

## Goals / Non-Goals

**Goals:**
- Improve public `/courts` search recall for natural multi-word queries.
- Keep lexical search as the primary retrieval path.
- Use embeddings only as a guarded fallback when lexical results underfill the requested first page.
- Reuse existing `place_embedding` data for the initial rollout.
- Add repeatable tests around the semantic-search gate and merge behavior so tuning stays safe.

**Non-Goals:**
- Replace lexical search with pure vector retrieval.
- Add semantic search to paginated follow-up pages beyond `offset = 0`.
- Add autocomplete, suggestions, or client-side search interactions.
- Introduce a new public endpoint or change the `place.listSummary` response shape.
- Create a dedicated `search` embedding corpus in the first iteration.

## Decisions

### Keep the UI forms unchanged

The homepage navbar, homepage search form, and discovery navbar already submit a single `q` parameter to `/courts`. The improvement belongs behind `place.listSummary`, not in those components.

Alternative considered:
- Add a separate semantic-search endpoint and UI surface. Rejected because it would duplicate routing and split search behavior across forms.

### Gate semantic search aggressively

Semantic search will only run when all of the following are true:

- `q` is present
- the query has at least 2 tokens
- `offset === 0`
- lexical results underfill the requested page

This keeps latency and embedding cost bounded while targeting the cases where lexical search is weakest.

Alternative considered:
- Embed every non-empty query. Rejected because it adds unnecessary cost and latency to short, exact-match searches like city names or venue names.

### Use semantic search as additive fallback, not primary ranking

The service should:

1. run the existing lexical `listSummary`
2. decide whether semantic fallback is needed
3. embed the query
4. fetch semantic venue candidates from `place_embedding`
5. append semantic-only venues until the requested page is full
6. dedupe by `place.id`

Lexical hits keep their existing order. Semantic hits only fill gaps.

Alternative considered:
- Re-rank the full lexical result set with embeddings. Rejected for v1 because it is harder to tune safely and could demote obvious exact matches.

### Reuse `place_embedding` with `purpose = dedupe` for v1

The first rollout will reuse the existing embedding corpus instead of introducing a second embedding purpose immediately. This allows the search experiment to ship and be evaluated without another backfill/migration cycle.

Alternative considered:
- Introduce a dedicated `search` purpose immediately. Rejected for v1 because it increases migration and data-prep work before we have evidence that semantic fallback materially improves conversion.

### Keep semantic retrieval in the repository and query embedding in a small service

Repository responsibility:
- fetch semantic venue candidates from Postgres using vector distance and existing place filters

Service responsibility:
- decide when to run semantic search
- obtain a query embedding
- merge lexical and semantic results

This keeps DB ranking logic in the repository and policy/gating logic in the service.

Alternative considered:
- Compute semantic search entirely in the service over all curated venues. Rejected because Postgres should stay responsible for vector candidate retrieval.

## Risks / Trade-offs

- [Embedding calls add latency] → Only run them for multi-token first-page underfill scenarios and cache query embeddings in-process.
- [Reusing `dedupe` embeddings may add search noise] → Treat semantic results as additive fallback only in v1 and validate with tests plus manual smoke checks.
- [Semantic candidates can introduce false-positive venue matches] → Dedupe by `place.id`, keep lexical order first, and limit semantic additions to fill only the remaining slots.
- [Pagination totals may no longer reflect pure lexical count] → Return the merged first-page count for the semantic path and keep semantic search disabled for non-zero offsets.
- [Future tuning can regress search relevance] → Cover the gate and merge behavior with repeatable tests before changing thresholds or fallback conditions.

## Migration Plan

1. Add service tests for semantic-search gating and merge behavior.
2. Add a small query-embedding service using the existing OpenAI embedding model.
3. Extend the place repository with vector candidate retrieval against `place_embedding`.
4. Update `PlaceDiscoveryService.listPlaceSummaries` to merge semantic fallback results into underfilled lexical first pages.
5. Validate with targeted service tests, typecheck, and manual `/courts?q=` smoke cases.

Rollback strategy:
- Remove the semantic branch from `PlaceDiscoveryService.listPlaceSummaries`, leaving lexical search unchanged.

## Open Questions

- Whether a dedicated `search` embedding purpose should replace `dedupe` embeddings after we gather enough manual search quality feedback.
