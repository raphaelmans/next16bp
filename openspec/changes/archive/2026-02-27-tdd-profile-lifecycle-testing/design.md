## Context

Profile lifecycle behavior underpins player booking and payment interactions. Existing tests validate profile-adjacent behavior in reservation paths, but direct coverage of profile service/router contracts remains limited.

Targeted modules:
- `src/lib/modules/profile/services/profile.service.ts`
- `src/lib/modules/profile/profile.router.ts`

## Goals / Non-Goals

**Goals**
- Add behavior-first tests for profile service methods.
- Add router tests for profile endpoint contracts and error mapping.
- Ensure profile bootstrap assumptions remain valid where reservation routes depend on profile creation.

**Non-Goals**
- Redesign profile APIs or schemas.
- Introduce DB integration tests with live infrastructure.

## Decisions

### 1. Service tests own lifecycle behavior
`ProfileService` tests assert get/create/update/upload semantics via repository/storage doubles.

### 2. Router tests own contract mapping
`profileRouter` tests verify input handling and domain error mapping to TRPC responses.

### 3. Reservation bootstrap regression stays targeted
Add only focused assertions where reservation routes depend on profile auto-creation, without expanding unrelated reservation coverage.

## Risks / Trade-offs

- Service behavior may depend on implicit repository guarantees; tests should lock only externally visible outcomes.
- Avatar upload can become brittle if storage assumptions are over-specified; tests should assert contract, not implementation details.
