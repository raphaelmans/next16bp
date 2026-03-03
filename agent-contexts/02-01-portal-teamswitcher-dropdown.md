---
tags:
  - agent-context
  - frontend/layout
  - frontend/owner
date: 2026-03-03
previous: 02-00-invitation-code-acceptance.md
related_contexts:
  - "[[01-86-portal-nav-pwa-redirect]]"
  - "[[02-00-invitation-code-acceptance]]"
---

# [02-01] Portal TeamSwitcher Dropdown

> Date: 2026-03-03
> Previous: 02-00-invitation-code-acceptance.md

## Summary

Replaced the segmented tabs portal switcher (Player | Organization | Admin) with a shadcn TeamSwitcher-style dropdown in the sidebar header. Also removed the redundant organization sub-header that duplicated portal context. The sidebar now follows a consistent pattern: portal switcher header establishes context, nav groups below provide flat navigation.

## Related Contexts

- [[01-86-portal-nav-pwa-redirect]] - Previous portal navigation work; established `portalConfig`, `getCurrentPortal`, and portal switching logic that this session refactored
- [[02-00-invitation-code-acceptance]] - Most recent prior context

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/components/layout/portal-tabs-sidebar.tsx` | Rewrote from segmented tabs + collapsed icon dropdown to single TeamSwitcher-style `DropdownMenu` with `SidebarMenuButton size="lg"` trigger. Expanded shows portal icon (colored bg), label, "KudosCourts" subtitle, `ChevronsUpDown`. Collapsed shows icon-only with tooltip. Labels changed from "Player" to "Player View", "Organization" to "Organization View", "Admin" to "Admin Dashboard". |
| `src/components/layout/dashboard-sidebar.tsx` | Removed brand logo `SidebarMenu` block (KudosLogo + "KudosCourts"), removed `SidebarSeparator`, made `PortalTabsSidebar` the sole `SidebarHeader` child. Removed `organizations` prop pass-through to `OrganizationNavGroup`. Removed `KudosLogo` import. |
| `src/components/layout/nav-groups/organization-nav-group.tsx` | Removed entire organization switcher sub-header (org avatar, name, role label, multi-org dropdown, noOrgMode "Venue Setup" button) and its `SidebarSeparator`. Removed unused imports: `Building2`, `ChevronsUpDown`, Avatar components, DropdownMenu components, `ROLE_DISPLAY_LABELS`, `SidebarSeparator`. Removed `organizations` prop and `logoUrl` from `Organization` interface. Removed `roleLabel` variable. |

## Tag Derivation (From This Session's Changed Files)

- `frontend/layout` — portal-tabs-sidebar.tsx, dashboard-sidebar.tsx are layout components
- `frontend/owner` — organization-nav-group.tsx is owner portal navigation

## Key Decisions

- **Single TeamSwitcher pattern replaces dual-mode UI**: Instead of separate expanded (segmented tabs) and collapsed (icon dropdown) implementations, the `SidebarMenuButton size="lg"` handles both modes automatically — collapsed state hides text children via CSS (`group-data-[collapsible=icon]:hidden`), showing only the icon div.
- **Portal switcher subsumes brand identity**: The trigger shows "KudosCourts" as subtitle, eliminating the need for a separate brand logo header. This matches the sidebar-07 pattern where the TeamSwitcher IS the header.
- **Organization sub-header removed entirely**: With the portal switcher header already communicating "Organization View", the second `size="lg"` org-name block was visual noise. Multi-org switching functionality was removed — may need to be re-added in a different form if multi-org support is needed.
- **Dropdown uses `w-(--radix-dropdown-menu-trigger-width)`**: Radix CSS variable anchors dropdown width to trigger width for polished feel in expanded mode.

## Next Steps (if applicable)

- [ ] Multi-org switching: if users with multiple organizations need to switch orgs, consider adding an org switcher to the portal dropdown or as a separate compact element
- [ ] Visual QA: verify collapsed sidebar tooltip, mobile sheet dropdown positioning (`side="bottom"`), and active portal highlighting

## Commands to Continue

```bash
pnpm lint    # Validate no regressions
pnpm dev     # Visual check sidebar behavior
```
