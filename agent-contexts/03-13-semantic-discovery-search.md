---
tags:
  - agent-context
  - frontend/discovery
  - backend/place
date: 2026-03-09
previous: 03-12-availability-rate-limit-hardening.md
related_contexts:
  - "[[03-07-discovery-inline-meta-loading]]"
  - "[[03-10-curated-ingestion-pipeline]]"
---

# [03-13] Semantic Discovery Search

> Date: 2026-03-09
> Previous: 03-12-availability-rate-limit-hardening.md

## Summary

Implemented the first hybrid lexical-plus-semantic public `/courts` search pass behind the existing search forms and `place.listSummary` path. Added test-first service coverage for the semantic gate and merge behavior, wired query embeddings plus semantic candidate retrieval, then debugged the localhost browser path and fixed a cache mismatch that was hiding live semantic results even when the backend logic was working.

## Related Contexts

- [[03-07-discovery-inline-meta-loading]] - Relevant discovery server/client summary wiring; this search work extends the same `place.listSummary` summary path.
- [[03-10-curated-ingestion-pipeline]] - Added the `place_embedding` infrastructure and semantic matching groundwork that this search change reuses.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/lib/modules/place/services/place-search-embedding.service.ts` | Added a small query-embedding service with in-process caching for multi-token search queries. |
| `src/lib/modules/place/repositories/place.repository.ts` | Added semantic summary candidate retrieval from `place_embedding` using vector cosine distance plus existing discovery filters. |
| `src/lib/modules/place/services/place-discovery.service.ts` | Added guarded semantic fallback: only for multi-token first-page underfilled queries, lexical-first ordering, semantic additive fill, dedupe by `place.id`. |
| `src/lib/modules/place/factories/place.factory.ts` | Wired the new place search embedding service into `PlaceDiscoveryService`. |
| `src/features/discovery/server/public-courts-discovery.tsx` | Bypassed long-lived server cache for any `q` search so semantic discovery results are visible immediately instead of serving stale zero-result cache entries. |
| `src/common/feature-api-hooks.ts` | Applied a small type-only fix in the shared query cache wrapper to keep `tsc` green after the search work. |

### Tests

| File | Change |
|------|--------|
| `src/__tests__/lib/modules/place/services/place-discovery.service.test.ts` | Added test-first coverage for semantic gate conditions, underfilled-page supplementation, and lexical/semantic result deduplication. |
| `src/__tests__/lib/modules/place/curated-duplicate-checker.test.ts` | Kept the existing duplicate-threshold semantic fixture coverage as the parallel guardrail for embedding tuning. |

### Spec

| File | Change |
|------|--------|
| `openspec/changes/embedding-aware-public-courts-discovery/proposal.md` | Captured the motivation and scope for hybrid public discovery search. |
| `openspec/changes/embedding-aware-public-courts-discovery/design.md` | Captured the conservative gated semantic fallback design and tradeoffs. |
| `openspec/changes/embedding-aware-public-courts-discovery/specs/public-courts-semantic-search/spec.md` | Added the capability requirements and scenarios. |
| `openspec/changes/embedding-aware-public-courts-discovery/tasks.md` | Marked all implementation tasks complete after code and validation landed. |

## Tag Derivation (From This Session's Changed Files)

- `frontend/discovery` from `src/features/discovery/server/public-courts-discovery.tsx`
- `backend/place` from `src/lib/modules/place/**`, `src/common/feature-api-hooks.ts`, and `src/__tests__/lib/modules/place/**`

## Key Decisions

- Kept the search forms unchanged and put the improvement behind the existing `q -> /courts -> place.listSummary` path.
- Treated semantic search as additive fallback only, not a lexical reranker, to avoid demoting exact matches and to keep tuning safer.
- Reused `place_embedding` rows with `purpose = dedupe` for the initial search rollout instead of creating a dedicated `search` corpus immediately.
- Limited semantic search to multi-token first-page underfilled queries to control embedding cost and reduce noisy matches.
- Disabled long-lived SSR caching for any `q` search in the discovery server path after confirming the backend worked but the browser was still showing stale cached zero-result pages.

## Next Steps (if applicable)

- [ ] Decide whether to introduce a dedicated `search` embedding purpose instead of continuing to reuse the `dedupe` canonical text.
- [ ] Add smoke tests or integration coverage around the server discovery cache branch for `q` searches if this path becomes a source of regressions.
- [ ] Manually evaluate more real search phrases on `/courts` to tune semantic retrieval quality without changing lexical-first behavior.

## Commands to Continue

```bash
pnpm exec vitest run src/__tests__/lib/modules/place/services/place-discovery.service.test.ts src/__tests__/lib/modules/place/curated-duplicate-checker.test.ts
pnpm exec tsc --noEmit --pretty false
pnpm lint
pnpm db:backfill:place-embeddings
playwright-cli -s=searchtest open http://localhost:3000
playwright-cli -s=searchtest goto 'http://localhost:3000/courts?q=cebu+pickleball'
playwright-cli -s=searchtest goto 'http://localhost:3000/courts?q=net+and+paddle+cebu'
```
