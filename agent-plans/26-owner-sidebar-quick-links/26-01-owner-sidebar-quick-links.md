# Phase 1: Owner Sidebar Quick Links

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-11-01

---

## Objective

Provide a toggleable owner sidebar submenu for quick navigation from place → active court → court slots.

---

## Modules

### Module 1A: Data Hook for Places + Courts

**User Story:** `US-11-01`  
**Reference:** `26-01-owner-sidebar-quick-links.md`

#### Directory Structure

```
src/features/owner/hooks/
```

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `placeManagement.list` | Query | `{ organizationId }` | `{ place[] }` |
| `courtManagement.listByPlace` | Query | `{ placeId }` | `{ court[] }` |

#### Implementation Steps

1. Fetch owner places for the active organization.
2. Fetch courts per place with `trpc.useQueries`.
3. Filter to active courts, sort by label.
4. Return `{ place, courts }` tuples + loading states.

---

### Module 1B: Collapsible Sidebar Menu UI

**User Story:** `US-11-01`  
**Reference:** `26-01-owner-sidebar-quick-links.md`

#### UI Layout

```
Sidebar
└─ Places (collapsible)
   ├─ Place Name (toggle)
   │  ├─ Court 1 → slots
   │  └─ Court 2 → slots
   └─ Place Name (toggle)
      └─ No active courts (disabled)
```

#### Flow Diagram

```
Sidebar
  └─ Place toggle
       └─ Court link → /owner/places/[placeId]/courts/[courtId]/slots
```

#### Implementation Steps

1. Add a new `SidebarGroup` under owner nav.
2. Render one `Collapsible` per place using `SidebarMenuButton` trigger.
3. Render `SidebarMenuSubButton` links for courts.
4. Add empty-state row for places without active courts.
5. Highlight active court links using `usePathname`.

---

## Testing Checklist

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`

---

## Handoff Notes

- Share quick-links behavior decisions with the UI team.
- Update overview success criteria once complete.
