---
tags:
  - agent-context
  - frontend/layout
  - frontend/owner
date: 2026-03-03
previous: 02-01-portal-teamswitcher-dropdown.md
related_contexts:
  - "[[02-01-portal-teamswitcher-dropdown]]"
  - "[[00-32-owner-sidebar-quick-links]]"
---

# [02-02] Sidebar Nav Groups & NavUser Footer

> Date: 2026-03-03
> Previous: 02-01-portal-teamswitcher-dropdown.md

## Summary

Reorganized the organization portal sidebar from a single flat nav group into 3 labeled groups (Bookings, Properties, Organization) with a standalone "Get started" item above. Created a new `NavUser` footer component following the shadcn sidebar-07 pattern, rendering in all portals (player, organization, admin). Removed the redundant "Courts" flat view and "Profile" sidebar item (Profile now lives in the NavUser dropdown).

## Related Contexts

- [[02-01-portal-teamswitcher-dropdown]] - Immediately prior session that established the TeamSwitcher header pattern; this session completes the sidebar structure by adding labeled nav groups and the NavUser footer
- [[00-32-owner-sidebar-quick-links]] - Established the Venues tree collapsible with nested courts, which this session preserved intact inside the new "Properties" group

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/components/layout/nav-groups/organization-nav-group.tsx` | Split single `SidebarGroup` into 3 labeled groups: **Bookings** (Dashboard, Availability Studio, Reservations, Imports), **Properties** (Venues tree), **Organization** (Team, Settings). Added standalone "Get started" group above. Removed "Courts" flat view item and "Profile" item. Split `navItems` array into `bookingsNavItems` and `organizationNavItems` with independent permission filtering. Removed `LayoutGrid`/`User` icon imports. Added `SidebarGroupLabel` import. |
| `src/components/layout/nav-user.tsx` | **New file.** Sidebar footer NavUser component with `DropdownMenu` inside `SidebarMenu > SidebarMenuItem`. Uses `useQueryAuthSession()` and `useMutAuthLogout()` directly (no prop drilling). Avatar with initials fallback, dropdown with Profile link, Notification Preferences link, Sign Out. `useSidebar().isMobile` flips dropdown `side` between "right" and "bottom". |
| `src/components/layout/dashboard-sidebar.tsx` | Added `SidebarFooter` with `<NavUser />` between `SidebarContent` and `SidebarRail`. Imported `NavUser` and `SidebarFooter`. |
| `src/components/layout/index.ts` | Added `NavUser` barrel export. |

## Tag Derivation (From This Session's Changed Files)

- `frontend/layout` — dashboard-sidebar.tsx, nav-user.tsx, index.ts are layout components
- `frontend/owner` — organization-nav-group.tsx is owner portal navigation

## Key Decisions

- **NavUser is self-contained via hooks**: By calling `useQueryAuthSession()` and `useMutAuthLogout()` internally, `NavUser` works identically in all 3 portals without prop threading from `DashboardShell`. The navbar user dropdown remains independent and functional.
- **Permission filtering split per group**: `bookingsNavItems` and `organizationNavItems` are filtered independently through the same `filterVisibleNavItems` pipeline, preserving granular access control per section.
- **Courts flat view removed**: The `/courts` flat view item was redundant with the Venues tree that already shows courts nested under venues. Removes navigation confusion.
- **Profile moved to NavUser dropdown**: Sidebar "Profile" item removed since `NavUser` footer dropdown provides Profile and Notification Preferences links in the same location as the sidebar-07 reference pattern.
- **Logout redirect logic mirrors DashboardShell**: Player portal → homepage, organization/admin portals → login with redirect back to current path.

## Next Steps (if applicable)

- [ ] Visual QA: verify labeled groups render correctly in expanded and collapsed sidebar states
- [ ] Verify NavUser collapsed state shows avatar icon only with tooltip
- [ ] Confirm mobile sheet sidebar shows NavUser footer properly
- [ ] Consider whether "Bookings" items should also be hidden in `noOrgMode` (currently Dashboard always shows)

## Commands to Continue

```bash
pnpm lint    # Validate no regressions
pnpm dev     # Visual check sidebar behavior
```
