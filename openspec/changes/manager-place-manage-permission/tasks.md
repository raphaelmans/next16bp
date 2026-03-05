## 1. Permission Definition

- [x] 1.1 Add `place.manage` to `ORGANIZATION_MEMBER_PERMISSIONS` array in `src/lib/modules/organization-member/shared/permissions.ts`
- [x] 1.2 Add `place.manage` to `DEFAULT_MANAGER_PERMISSIONS` array

## 2. Backend Services — Replace Owner Checks with Permission Checks

- [x] 2.1 Update `CourtManagementService`: replace `IOrganizationRepository` with `IOrganizationMemberService`, use `assertOrganizationPermission` in `verifyPlaceOwnership`
- [x] 2.2 Update `CourtHoursService`: replace `IOrganizationRepository` with `IOrganizationMemberService`, use `assertOrganizationPermission` in `verifyCourtOwnership`
- [x] 2.3 Update `CourtRateRuleService`: replace `IOrganizationRepository` with `IOrganizationMemberService`, use `assertOrganizationPermission` in `verifyCourtOwnership`
- [x] 2.4 Update `CourtAddonService`: replace `IOrganizationRepository` with `IOrganizationMemberService`, use `assertOrganizationPermission` in `verifyCourtOwnership`
- [x] 2.5 Update `CourtBlockService`: replace `IOrganizationRepository` with `IOrganizationMemberService`, use `assertOrganizationPermission` in `verifyCourtOwnership`
- [x] 2.6 Update `PlaceAddonService`: replace `IOrganizationRepository` with `IOrganizationMemberService`, use `assertOrganizationPermission` in `verifyPlaceOwnership`

## 3. PlaceManagementService — Split Access Levels

- [x] 3.1 Add `IOrganizationMemberService` as constructor parameter (keep `IOrganizationRepository` for owner-only operations)
- [x] 3.2 Create `assertPlaceManageAccess` method using `assertOrganizationPermission(userId, orgId, "place.manage")`
- [x] 3.3 Use `assertPlaceManageAccess` for `listMyPlaces`, `getPlaceById`, `updatePlace`
- [x] 3.4 Keep `assertOwner` for `deletePlace`, `uploadPhoto`, `removePhoto`, `reorderPhotos`

## 4. Factories — Inject Organization Member Service

- [x] 4.1 Update `court.factory.ts` to inject `makeOrganizationMemberService()`
- [x] 4.2 Update `court-hours.factory.ts` to inject `makeOrganizationMemberService()`
- [x] 4.3 Update `court-rate-rule.factory.ts` to inject `makeOrganizationMemberService()`
- [x] 4.4 Update `court-addon.factory.ts` to inject `makeOrganizationMemberService()`
- [x] 4.5 Update `court-block.factory.ts` to inject `makeOrganizationMemberService()`
- [x] 4.6 Update `place-addon.factory.ts` to inject `makeOrganizationMemberService()`
- [x] 4.7 Update `place.factory.ts` to inject `makeOrganizationMemberService()`

## 5. Routers — Handle Permission Denied Errors

- [x] 5.1 Add `OrganizationMemberPermissionDeniedError` to FORBIDDEN mapping in `court-management.router.ts`
- [x] 5.2 Add `OrganizationMemberPermissionDeniedError` to FORBIDDEN mapping in `court-hours.router.ts`
- [x] 5.3 Add `OrganizationMemberPermissionDeniedError` to FORBIDDEN mapping in `court-rate-rule.router.ts`
- [x] 5.4 Add `OrganizationMemberPermissionDeniedError` to FORBIDDEN mapping in `court-addon.router.ts`
- [x] 5.5 Add `OrganizationMemberPermissionDeniedError` to FORBIDDEN mapping in `court-block.router.ts`
- [x] 5.6 Add `OrganizationMemberPermissionDeniedError` to FORBIDDEN mapping in `place-management.router.ts`
- [x] 5.7 Add `OrganizationMemberPermissionDeniedError` to FORBIDDEN mapping in `place-addon.router.ts`

## 6. Frontend — Update Page Guards

- [x] 6.1 Change `PermissionGate` to `permission: place.manage` in `owner-place-court-new-page.tsx`
- [x] 6.2 Change `PermissionGate` to `permission: place.manage` in `owner-place-court-edit-page.tsx`
- [x] 6.3 Change `PermissionGate` to `permission: place.manage` in `owner-place-court-setup-page.tsx`
- [x] 6.4 Change `PermissionGate` to `permission: place.manage` in `owner-court-setup-page.tsx`
- [x] 6.5 Change `PermissionGate` to `permission: place.manage` in `owner-court-edit-page.tsx`
- [x] 6.6 Change `PermissionGate` to `permission: place.manage` in `owner-place-edit-page.tsx`

## 7. Frontend — Permissions Sheet UI

- [x] 7.1 Add `place.manage` to `PERMISSION_LABELS` in `team-member-permissions-sheet.tsx`
- [x] 7.2 Add `VENUE_PERMISSIONS` group with `place.manage`
- [x] 7.3 Render "Venues" permission group in the sheet

## 8. Data Migration

- [ ] 8.1 Grant `place.manage` to existing active managers (via permissions sheet UI or SQL)
