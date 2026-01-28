# [01-22] Sidebar Venue Link Navigation

> Date: 2026-01-28
> Previous: 01-21-owner-setup-status.md

## Summary

Updated the owner sidebar so that clicking "Venues" navigates to `/owner/places` instead of only toggling the submenu. The submenu can still be expanded independently via a separate chevron button.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/owner/components/owner-sidebar.tsx` | Split Venues `CollapsibleTrigger` from `SidebarMenuButton`: label is now a `<Link>` for navigation, chevron uses `SidebarMenuAction` as the `CollapsibleTrigger` |
| `src/features/owner/components/owner-sidebar.tsx` | Added `SidebarMenuAction` import and `ChevronRight` icon |
| `src/features/owner/components/owner-sidebar.tsx` | Removed redundant "All Venues" submenu link since parent now navigates there |

## Key Decisions

- Used `SidebarMenuAction` component (already available in shadcn sidebar) to separate the collapse trigger from the navigation link
- Removed "All Venues" submenu entry to avoid duplication with the parent link
- Individual venue items in the submenu kept as collapsible-only (no direct navigation) per user preference
