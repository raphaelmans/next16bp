## Context

RBAC correctness directly affects reservation security and team operations. Service-layer permission checks are partially covered, but client gating helpers and some role/permission interaction branches need stronger regression tests.

Targeted modules:
- `src/lib/modules/organization-member/services/organization-member.service.ts`
- `src/lib/modules/organization-member/organization-member.router.ts`
- `src/features/owner/helpers.ts`

## Goals / Non-Goals

**Goals**
- Expand service/router RBAC test matrix for permission allow/deny behavior.
- Add explicit tests for owner-side helper gating (`canAccessPage`, `filterVisibleNavItems`).
- Lock reservation-notification receive eligibility checks as RBAC behavior.

**Non-Goals**
- Change permission model or add roles.
- Redesign owner navigation IA.

## Decisions

### 1. Permission matrix is canonical
Tests should exercise owner, manager, and viewer behavior across reservation-relevant permissions.

### 2. Client helper tests are required
Pure client RBAC helpers are treated as core logic and must have direct tests.

### 3. Router tests remain contract-focused
Router tests validate permission-denied mapping and service delegation, avoiding service-rule duplication.

## Risks / Trade-offs

- Permission defaults can change over time; tests should align to explicit constants from shared permission definitions.
- UI helper tests should avoid coupling to page rendering details.
