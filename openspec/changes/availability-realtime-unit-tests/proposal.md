## Why

Realtime availability now spans query-key normalization, event-carried slot patches, aggregate invalidation fallback, and focus/reconnect recovery. That behavior is correctness-sensitive and should be protected by focused unit tests that follow the client testing standard instead of relying on broader integration coverage alone.

The repo already has partial coverage for discovery realtime behavior, but the availability realtime client boundary and a few contract-level assertions are still under-tested. This change adds unit tests only, with no product or API behavior changes.

## What Changes

- Add unit tests for the availability realtime client boundary under the mirrored `src/__tests__/common/` tree.
- Strengthen unit coverage for realtime availability behavior that mixes direct court-cache patching with aggregate invalidation fallback.
- Keep all tests aligned with `guides/client/core/testing.md`, especially mirrored layout, AAA pattern, deterministic fake/stub boundaries, and no live infrastructure.
- Do not change runtime product behavior, API contracts, or database schema in this change.

## Capabilities

### New Capabilities
- `availability-realtime-unit-tests`: Unit-test coverage for realtime availability query keys, client boundary parsing/filtering, discovery patch behavior, and owner-side optimistic helpers.

### Modified Capabilities

None.

## Impact

- Affected test areas: `src/__tests__/common`, `src/__tests__/features/discovery`, `src/__tests__/features/owner/hooks`, and `src/__tests__/lib/modules/availability/services`.
- Affected guidance: `guides/client/core/testing.md`.
- No runtime code changes are required unless a missing export or tiny testability seam is needed.
