---
tags:
  - agent-context
  - frontend/layout
date: 2026-03-03
previous: 02-02-sidebar-nav-groups-navuser.md
related_contexts:
  - "[[02-02-sidebar-nav-groups-navuser]]"
  - "[[01-13-owner-onboarding-revamp]]"
---

# [02-03] No-Org Mobile Bottom Tabs Fix

> Date: 2026-03-03
> Previous: 02-02-sidebar-nav-groups-navuser.md

## Summary

Fixed mobile bottom tabs showing meaningless organization navigation (Reservations, Studio, Venues) when a user has no organization. Added an early return in `OrganizationBottomTabs` that renders a single "Get Started" tab when `noOrgMode` is true, matching the sidebar's existing guard behavior.

## Related Contexts

- [[02-02-sidebar-nav-groups-navuser]] - Prior session that reorganized sidebar nav groups; sidebar already correctly hides org items in `noOrgMode`, but bottom tabs did not
- [[01-13-owner-onboarding-revamp]] - Established the Get Started onboarding flow that the single tab now points to

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/components/layout/dashboard-bottom-tabs.tsx` | Added early return after the loading skeleton check: when `noOrgMode` is true, renders `<BottomTabBar>` with a single "Get Started" tab (`ClipboardList` icon, `appRoutes.organization.getStarted` href). Skips all role-based tab logic, More sheet, and reservation count badges. |

### Root Cause

When `organizationId` is `null`:
1. `noOrgMode = true` is set correctly
2. The permission query is skipped (not enabled), so `permissionContext` stays `null`
3. The fallback assigns `role = "VIEWER"`
4. `getOrgTabsForRole("VIEWER")` returns full org tabs (Reservations, Studio, Venues)

The sidebar avoided this by wrapping org nav items with `!noOrgMode` checks, but the bottom tabs had no such guard.

## Tag Derivation (From This Session's Changed Files)

- `frontend/layout` — dashboard-bottom-tabs.tsx is a layout component

## Key Decisions

- **Reused existing `BottomTabBar` component**: A 1-item array naturally fills full width via `flex-1`, giving the centered single-tab appearance without CSS changes.
- **Early return pattern**: Short-circuits before all role/permission logic rather than adding conditional guards throughout, keeping the fix minimal and isolated.

## Next Steps (if applicable)

- [ ] Visual QA: verify single "Get Started" tab on mobile in no-org state
- [ ] Verify normal org tabs still render correctly for OWNER/MANAGER/VIEWER roles

## Commands to Continue

```bash
pnpm lint    # Validate no regressions
pnpm dev     # Visual check mobile bottom tabs
```
