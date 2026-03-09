## 1. Search Semantics Gate

- [x] 1.1 Add repeatable tests for the semantic-search gate on public `/courts` summary search behavior
- [x] 1.2 Implement a query-embedding service that can embed multi-token search queries with in-process caching
- [x] 1.3 Add conservative gating so semantic search only runs for first-page underfilled multi-token queries

## 2. Semantic Candidate Retrieval

- [x] 2.1 Extend the place repository with semantic summary candidate retrieval from `place_embedding`
- [x] 2.2 Apply existing discovery filters to semantic candidate retrieval without changing the public response shape
- [x] 2.3 Keep semantic retrieval limited to additive fallback candidates instead of replacing lexical ranking

## 3. Hybrid Discovery Merge

- [x] 3.1 Update `PlaceDiscoveryService.listPlaceSummaries` to merge lexical and semantic results
- [x] 3.2 Deduplicate merged results by `place.id`
- [x] 3.3 Preserve existing lexical-first ordering while allowing semantic-only venues to fill remaining slots

## 4. Validation

- [x] 4.1 Add service tests for underfilled-page supplementation and lexical/semantic deduplication
- [x] 4.2 Run targeted Vitest coverage for duplicate-threshold and place-discovery service behavior
- [x] 4.3 Run typecheck and lint to verify the hybrid search path does not change public payload contracts
