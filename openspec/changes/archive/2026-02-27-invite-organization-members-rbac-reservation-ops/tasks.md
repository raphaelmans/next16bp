## 1. OpenSpec Artifacts

- [x] 1.1 Create proposal for `invite-organization-members-rbac-reservation-ops`
- [x] 1.2 Create design documenting RBAC, invitation lifecycle, and constraints
- [x] 1.3 Create spec deltas for organization/member/reservation/chat capabilities

## 2. Database + Schema

- [x] 2.1 Add `organization_member` and `organization_invitation` Drizzle schema definitions
- [x] 2.2 Export new schema from DB schema index
- [x] 2.3 Generate migration for membership/invitation tables and enums

## 3. Backend Organization Member Module

- [x] 3.1 Add organization-member repository, service, errors, and factory
- [x] 3.2 Add organization-member tRPC router (`list`, `listInvitations`, `invite`, `updatePermissions`, `revokeMember`, `cancelInvitation`, `acceptInvitation`, `declineInvitation`, `getMyPermissions`)
- [x] 3.3 Register `organizationMember` router in tRPC root
- [x] 3.4 Send invitation email with secure acceptance link

## 4. Authorization Integration

- [x] 4.1 Add shared permission constants and resolver for owner/member authorization
- [x] 4.2 Update `reservation-owner` service authorization checks to permission-based access
- [x] 4.3 Update `reservation-chat` service/thread-metadata authorization to include permitted members
- [x] 4.4 Update organization discovery (`organization.my`, post-login fallback) to include active memberships

## 5. Frontend Owner Portal

- [x] 5.1 Extend owner feature API and hooks for organization-member operations
- [x] 5.2 Add Owner Settings "Team & Access" section with member list, pending invites, invite form, permission edits, revoke/cancel actions
- [x] 5.3 Add authenticated invitation acceptance page and success/error states

## 6. Tests + Validation

- [x] 6.1 Add backend tests for organization-member router/service and permission checks
- [x] 6.2 Add/update tests for reservation-owner/reservation-chat authorization behavior with member permissions
- [x] 6.3 Run `pnpm lint` and fix issues in changed files
