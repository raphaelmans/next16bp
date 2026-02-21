# Post-Cutover Cleanup and Conformance Audit

## Purpose

After successful big-bang release, remove transitional architecture debt and lock in long-term maintainability.

## Cleanup Objectives

1. Remove compatibility shims and temporary exports.
2. Remove dead hooks/components left during extraction.
3. Complete final hook/API naming normalization.
4. Enforce conformance checks for future changes.

## Cleanup Backlog Categories

### A) Compatibility Shims

Remove items such as:

- temporary re-export aliases in feature hook index files
- fallback direct tRPC calls left in hooks for transition
- route-layer compatibility wrappers no longer needed

### B) Dead Code and Obsolete Modules

- remove unused route-local client wrappers replaced by feature modules
- remove duplicate helper/schemas created during migration
- remove stale imports and unused utilities

### C) Naming and Contract Finalization

- rename legacy hooks to `useQuery*`, `useMut*`, `useMod*`
- ensure each feature has endpoint-scoped `api.ts` contract and factory
- remove pass-through `TrpcFeatureApi` proxy patterns from all `api.ts` files
- align method names across API, hooks, and components

### D) Documentation and Governance

- update architecture docs with final as-built paths
- add conformance checks to PR template/review checklist
- archive migration checklists and parity reports

## Post-Cutover Execution Sequence

1. Create post-cutover cleanup branch from released commit.
2. Remove one compatibility area at a time (feature-scoped).
3. Run `pnpm lint`, `pnpm lint:arch`, and targeted smoke after each cleanup batch.
4. Merge cleanup batches with low-risk sequencing.
5. Run final conformance audit and close migration epic.

## Final Conformance Checklist

All items must be true:

- [x] No direct tRPC hook usage in pages/presentation components.
- [x] Feature hooks own all query/mutation/invalidation behavior.
- [x] No namespace `.query/.mutation/.queries` hook calls remain.
- [x] Each active feature has endpoint-scoped `api.ts` contract.
- [x] No `createTrpcFeatureApi` / `extends TrpcFeatureApi` / `declare readonly ...: unknown` / `input?: unknown` / `Promise<unknown>` remains in feature API method contracts.
- [x] `src/app` contains route conventions only for new architecture.
- [x] Shared error contract is centralized and used by UI.
- [x] No transport-shape `error.data` parsing remains outside adapters.
- [x] `pnpm lint` remains passing (`0` exit; warning-level findings tracked separately).
- [x] `pnpm lint:arch` remains passing after cleanup.

## Residual Risk Audit

Before closing migration:

1. Verify owner/admin/chat high-risk areas stayed stable after cleanup.
2. Re-run key parity scenarios from the matrix.
3. Validate no regression in telemetry/analytics/reporting hooks.

## Closeout Deliverables

- Final architecture conformance report
- List of removed temporary modules
- Remaining technical debt list (if any)
- Recommendation for ongoing guardrails (CI checks + review policy)
