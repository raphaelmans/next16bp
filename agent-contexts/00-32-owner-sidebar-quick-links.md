# [00-32] Owner Sidebar Quick Links

> Date: 2026-01-13
> Previous: 00-31-court-form-select-default.md

## Summary

Added owner sidebar quick links with collapsible place → court navigation and a supporting data hook. Created the agent plan artifacts and verified lint/build.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/owner/hooks/use-owner-sidebar-quick-links.ts` | Added hook to fetch places and active courts for sidebar quick links. |
| `src/features/owner/hooks/index.ts` | Exported `useOwnerSidebarQuickLinks` hook. |
| `src/features/owner/components/owner-sidebar.tsx` | Added Quick Links sidebar group with collapsible place menus and court links. |

### Planning

| File | Change |
|------|--------|
| `agent-plans/26-owner-sidebar-quick-links/26-00-overview.md` | Added master plan and success criteria. |
| `agent-plans/26-owner-sidebar-quick-links/26-01-owner-sidebar-quick-links.md` | Added phase details for data hook and UI. |
| `agent-plans/26-owner-sidebar-quick-links/owner-sidebar-quick-links-dev1-checklist.md` | Added developer checklist. |

### Validation

| File | Change |
|------|--------|
| `pnpm lint` | Passed Biome checks. |
| `TZ=UTC pnpm build` | Successful production build. |

## Key Decisions

- Used shadcn `Collapsible` + `SidebarMenuSub` to match existing sidebar patterns.
- Linked court quick links to the owner slots page for fastest navigation.
- Filtered courts to active only, with a disabled empty-state row for places without active courts.

## Next Steps (if applicable)

- [ ] None.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
