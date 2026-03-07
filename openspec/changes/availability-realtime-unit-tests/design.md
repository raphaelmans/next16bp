## Context

Realtime availability behavior is now split across several client-side layers: canonical query-key normalizers, a Supabase realtime client, discovery cache patch/invalidation logic, and owner-side optimistic cache helpers. The core product behavior is already implemented, so this change is about making that behavior safer to evolve by tightening the unit-test net around the boundaries that are easy to regress.

The client testing guide is explicit about mirrored `src/__tests__/` layout, deterministic fake boundaries, and testing behavior through public interfaces. This change should improve coverage without introducing browser-heavy or live-infrastructure tests.

## Goals / Non-Goals

**Goals:**
- Add missing unit coverage for the availability realtime client boundary.
- Preserve and extend existing unit coverage for discovery realtime patch vs invalidate behavior.
- Keep tests aligned with the client testing standard.

**Non-Goals:**
- No product behavior changes.
- No new runtime APIs, migrations, or event payload changes.
- No live integration/e2e work in this change.

## Decisions

### 1. Add client-boundary tests under `src/__tests__/common/clients`
The availability realtime client is a shared client boundary, so its tests belong under mirrored `src/__tests__/common/clients/...`.

### 2. Reuse existing focused discovery tests
The repo already has good focused tests for discovery realtime patching and availability query hooks. This change will extend, not replace, that coverage.

### 3. Prefer public-interface assertions
Tests will assert forwarded payloads, applied query options, patch outcomes, and invalidation behavior rather than internal implementation details.

## Risks / Trade-offs

- [Test-only change becomes a behavior refactor] → Keep production code edits minimal and only add tiny exports or seams when required for testability.
- [Coverage duplicates existing behavior tests] → Target only missing boundaries and keep each test subject distinct.
