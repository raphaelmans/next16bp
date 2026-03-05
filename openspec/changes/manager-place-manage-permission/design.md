## Context

Court and place management services (`CourtManagementService`, `CourtHoursService`, `CourtRateRuleService`, `CourtAddonService`, `CourtBlockService`, `PlaceAddonService`, `PlaceManagementService`) all enforce access via private methods (`verifyPlaceOwnership` / `verifyCourtOwnership` / `assertOwner`) that resolve the organization chain (court → place → organization) and compare `organization.ownerUserId !== userId`. This blocks all non-owner users.

The RBAC system (`assertOrganizationPermission` on `IOrganizationMemberService`) already resolves ownership + membership and supports granular permission checks, but court/place services bypass it entirely by injecting `IOrganizationRepository` directly.

## Goals / Non-Goals

**Goals:**
- Allow managers with `place.manage` permission to perform venue/court management operations
- Preserve owner-only restrictions for destructive/sensitive operations (place create, delete, photo management)
- Use the existing RBAC infrastructure — no new authorization patterns

**Non-Goals:**
- Granular per-place or per-court permission scoping (all-or-nothing at org level)
- Viewer role access to management operations
- Changes to reservation-related permission checks

## Decisions

### Decision 1: Single `place.manage` permission vs granular court/place permissions

**Chosen**: Single `place.manage` permission gates all court and place management operations.

**Rationale**: Court operations always resolve through a place → organization chain. Separate `court.manage` / `place.read` permissions would add complexity without matching real-world delegation patterns — managers either manage the venue or they don't.

**Alternative considered**: `court.manage` + `place.manage` as separate permissions. Rejected because courts are subordinate to places and there's no use case for managing courts without place access.

### Decision 2: Replace `IOrganizationRepository` with `IOrganizationMemberService` in service constructors

**Chosen**: Swap the repository dependency for the member service, which already encapsulates org lookup + permission check.

**Rationale**: The verification methods were doing: `orgRepo.findById(orgId)` → check `ownerUserId`. Replacing with `memberService.assertOrganizationPermission(userId, orgId, "place.manage")` achieves the same chain resolution plus membership/permission awareness in a single call. Owners pass automatically via `OWNER_IMPLICIT_PERMISSIONS`.

### Decision 3: Split `PlaceManagementService` access levels

**Chosen**: New `assertPlaceManageAccess` (permission-based) for list/get/update. Existing `assertOwner` retained for create/delete/photos.

**Rationale**: Place creation establishes the organization → place relationship (must be owner). Deletion and photo management are destructive operations that should remain owner-restricted. Listing, viewing, and updating are the operations managers need for day-to-day court management.

## Risks / Trade-offs

- **Existing manager data migration**: Existing managers have stored permissions without `place.manage`. The `normalizeOrganizationPermissions` function returns stored permissions if non-empty, so the new permission won't auto-populate. → **Mitigation**: Can be granted via the permissions sheet UI (updated with "Venues" group) or via SQL migration.

- **`OrganizationMemberPermissionDeniedError` vs `NotCourtOwnerError`/`NotPlaceOwnerError`**: Services now throw a different error type on permission denial. → **Mitigation**: All 7 routers updated to map both error types to FORBIDDEN.

- **No per-place scoping**: A manager with `place.manage` can manage all places in the organization. → **Accepted trade-off**: Matches the current owner model (owner manages all places). Per-place scoping would require a different data model.
