## Why

The Team & Access management UI is currently embedded as a single Card section within the monolithic `/owner/settings` page. As the RBAC system has matured (3 roles, 6 granular permissions, invitation lifecycle with TTL), this PoC placement limits discoverability, makes member management cumbersome, and doesn't scale for organizations with multiple team members. Promoting it to a dedicated page with a professional Vercel-style table UI provides the management UX this feature deserves.

## What Changes

- **New dedicated page** at `/owner/team` with its own route, sidebar navigation entry, and AppShell layout
- **Vercel-style members table** replacing the current flat list — avatar, name, email, inline role dropdown, permission count badge, overflow menu for edit/revoke
- **Invite dialog** — modal dialog for member invitation (email, role, grouped permission checkboxes) replacing the inline invite form
- **Permission editor sheet** — slide-out panel for editing member permissions grouped by domain (Reservations / Administration) instead of inline checkbox grid
- **Search and role filter** — client-side filtering of members by name/email and role
- **Confirmation dialogs** — AlertDialog for destructive actions (revoke member, cancel invitation)
- **Remove Team & Access section** from `/owner/settings` page
- No backend/API changes — all existing tRPC endpoints, services, and DB schema remain unchanged

## Capabilities

### New Capabilities

_(none — this is a frontend-only restructure of existing capabilities)_

### Modified Capabilities

_(none — the `organization-member-rbac` spec requirements are unchanged; invitation, membership, and permission-gating behavior remain identical. This change only restructures the UI presentation layer.)_

## Impact

- **Frontend routes**: New route `/owner/team` added, settings page loses one Card section
- **Navigation**: Sidebar gains "Team" nav item between Imports and Settings
- **Components**: New page component, invite dialog, permission sheet, member row components in `src/features/owner/`
- **No API changes**: All tRPC router endpoints, service methods, repository queries, and DB schema untouched
- **No breaking changes**: Existing hooks (`useQueryOrganizationMembers`, `useMutInviteOrganizationMember`, etc.) reused as-is
