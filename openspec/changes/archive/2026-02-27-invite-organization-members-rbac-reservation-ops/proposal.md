## Why

Owner operations are currently single-user and coupled to `organization.ownerUserId`. This blocks venue teams from handling reservation workflows collaboratively and creates an operational bottleneck for accept/reject/payment confirmation during peak booking windows.

We need an invitation and RBAC model so organizations can grant reservation-management access to trusted team members while preserving strict owner-only boundaries for venue/court configuration in V1.

## What Changes

- Add organization membership and invitation data model.
- Add organization-member backend module (repository, service, router) for invite, list, update permissions, revoke/cancel, accept/decline.
- Introduce extensible permission checks for organization-level actions, with role + explicit permissions persisted.
- Expand reservation owner authorization from owner-only to owner-or-member-with-permission.
- Expand reservation chat authorization so permitted organization members can access reservation threads.
- Add owner settings "Team & Access" UI for invitation and member management.
- Add invitation acceptance flow for authenticated existing users.

## Capabilities

### New Capabilities
- `organization-member-rbac`: Invite and manage organization members with role + permission controls for reservation operations.

### Modified Capabilities
- `organization`: Organization access model expands from owner-only membership to owner + invited members.
- `reservation`: Owner reservation operations become permission-gated for organization members.
- `chat`: Reservation chat participant access expands to authorized organization members.

## Impact

- DB: new `organization_member` and `organization_invitation` tables; new membership/invitation enums.
- Backend: new module `src/lib/modules/organization-member`; new tRPC router registration; shared org permission resolver for reservation/chat authorization.
- Frontend: owner feature API/hook additions and owner settings team-management surfaces.
- Routing: add invitation acceptance page for authenticated users.
- Testing: add module tests and authorization regression coverage.
