## Why

Organization managers cannot access venue/court management despite being active team members. All place and court management endpoints use hardcoded `organization.ownerUserId !== userId` checks, blocking any non-owner access. The permission system (`assertOrganizationPermission`) already supports owners + members but isn't used by court/place management services.

## What Changes

- Add `place.manage` permission to the RBAC permission set, included in default manager permissions
- Replace owner-only checks with `assertOrganizationPermission(userId, orgId, "place.manage")` across 7 backend services (court management, court hours, court rate rules, court addons, court blocks, place addons, place management)
- Split `PlaceManagementService` access: `place.manage` for list/get/update, owner-only for create/delete/photos
- Update 7 tRPC routers to handle `OrganizationMemberPermissionDeniedError` as FORBIDDEN
- Update 6 frontend page guards from `owner-only` to `permission: place.manage`
- Add `place.manage` to the team member permissions sheet UI with a "Venues" permission group

## Capabilities

### New Capabilities

- `place-manage-permission`: Defines the `place.manage` permission grant, its default assignment to the manager role, which operations it gates (court CRUD, court config, place list/get/update, place addon config), and which operations remain owner-only (place create/delete, photo management, verification).

### Modified Capabilities

- `organization-member-rbac`: Extends the permission set with `place.manage` and adds it to default manager permissions. The permission administration UI gains a "Venues" group.

## Impact

- **Backend services**: `CourtManagementService`, `CourtHoursService`, `CourtRateRuleService`, `CourtAddonService`, `CourtBlockService`, `PlaceAddonService`, `PlaceManagementService` — constructor signatures change from `IOrganizationRepository` to `IOrganizationMemberService`
- **Factories**: 7 factory files updated to inject `makeOrganizationMemberService()` instead of `makeOrganizationRepository()`
- **Routers**: 7 router error handlers updated to map `OrganizationMemberPermissionDeniedError` to FORBIDDEN
- **Frontend**: 6 page components change `PermissionGate` access rules; permissions sheet gains new permission entry
- **Data**: Existing active managers need `place.manage` added to stored permissions (via UI or migration)
- **No breaking changes**: Owners retain all access via `OWNER_IMPLICIT_PERMISSIONS` spread
