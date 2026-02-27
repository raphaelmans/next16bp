## Context

Current owner authorization is hard-coded to `organization.ownerUserId` in reservation-owner and reservation-chat flows. The owner portal organization discovery (`organization.my`) is also owner-only, preventing team delegation.

## Goals / Non-Goals

**Goals**
- Support owner-invited members for reservation operations.
- Keep role + explicit permission model extensible.
- Enable manager-led membership administration in V1.
- Keep venue/court settings owner-only for this release.
- Support email invite links for authenticated existing users.

**Non-Goals**
- Signup-linked invitation completion for non-existing users.
- Replacing owner canonical identity (`organization.ownerUserId`).
- Broad migration of all owner-only modules to member access in V1.
- Per-court or per-venue scoped permissions.

## Decisions

### D1: Keep `ownerUserId` canonical, add additive membership tables

`organization.ownerUserId` remains the legal/primary owner link. Membership is additive through `organization_member` and invitation lifecycle through `organization_invitation`.

### D2: Persist both role and explicit permissions

Store both `role` enum and `permissions` array/json. Role provides semantic label (OWNER/MANAGER/VIEWER), while permissions are used for actual authorization and remain editable.

### D3: Centralize organization permission checks

Introduce an organization-member service permission resolver used by reservation-owner and reservation-chat services to avoid duplicating authorization logic.

### D4: Invitation uses signed token link and authenticated acceptance

Generate random invite token, persist only hash, send email link with token. Acceptance requires authenticated user and matching invited email; non-existing-user onboarding is deferred.

### D5: V1 permissions are reservation-ops focused

Primary permissions:
- `reservation.read`
- `reservation.update_status`
- `reservation.guest_booking`
- `reservation.chat`
- `organization.member.manage`

## Data Model

### `organization_member`
- `id` UUID PK
- `organizationId` FK -> organization
- `userId` FK -> auth.users
- `role` enum (`OWNER`, `MANAGER`, `VIEWER`)
- `permissions` jsonb/text[]
- `status` enum (`ACTIVE`, `REVOKED`)
- `invitedByUserId` FK -> auth.users (nullable for system/backfill)
- `joinedAt`, `createdAt`, `updatedAt`
- unique `(organizationId, userId)`

### `organization_invitation`
- `id` UUID PK
- `organizationId` FK -> organization
- `email` normalized lower-case
- `role` enum
- `permissions` jsonb/text[]
- `tokenHash` unique
- `status` enum (`PENDING`, `ACCEPTED`, `DECLINED`, `CANCELED`, `EXPIRED`)
- `expiresAt`
- `invitedByUserId` FK -> auth.users
- `acceptedByUserId` FK -> auth.users nullable
- `acceptedAt`, `createdAt`, `updatedAt`
- partial unique active invite index `(organizationId, email)` where status = `PENDING`

## API Surface

New router `organizationMember`:
- `list`
- `listInvitations`
- `getMyPermissions`
- `invite`
- `updatePermissions`
- `revokeMember`
- `cancelInvitation`
- `acceptInvitation`
- `declineInvitation`

## Authorization Matrix (V1)

- Owner: implicit full access.
- Manager (default bundle): full reservation ops + member management.
- Viewer (default bundle): `reservation.read` only.

Enforcement points in V1:
- `reservationOwner.*` reads and mutations gate by permission.
- `reservationChat.*` membership/participant checks include authorized members.
- Membership admin endpoints require owner or `organization.member.manage`.

## Rollout / Migration

1. Add schema + migration.
2. Add organization-member backend module.
3. Register router and wire permission resolver into reservation-owner/chat services.
4. Update owner portal org discovery to include memberships for `organization.my` paths.
5. Add owner settings team-management UI and invitation acceptance page.
6. Add tests + lint validation.

## Risks / Trade-offs

- **Permission drift across services** -> Mitigation: centralized permission resolver and constants.
- **Duplicate invitations** -> Mitigation: unique token + partial unique pending invite index.
- **Unauthorized broad access leakage** -> Mitigation: keep non-reservation owner modules unchanged in V1.
- **Channel membership inconsistencies in chat provider** -> Mitigation: include authorized member ids when ensuring channel membership.
