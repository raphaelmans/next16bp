# Phase 3: Owner Journey

**Estimated Effort:** 0.5 day  
**Dependencies:** Phase 1 (Core Navigation)  
**Assigned To:** Dev 2 (see `01-07-dev-checklist-2.md`)

---

## 1. Overview

Connect owner dashboard pages with proper entry points and navigation, including ability to switch back to player view.

---

## 2. Owner Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OWNER JOURNEY                                      │
└─────────────────────────────────────────────────────────────────────────────┘

                          ┌─────────────────┐
                          │  Player View    │
                          │  (any page)     │
                          └────────┬────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
      [User Dropdown]      [List Your Court]    [Direct URL]
      "Owner Dashboard"    (authenticated)       /owner
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │      OWNER LAYOUT            │
                    │  ┌────────┬────────────────┐ │
                    │  │Sidebar │    Content     │ │
                    │  │        │                │ │
                    │  │ Dash   │   [Page]       │ │
                    │  │ Courts │                │ │
                    │  │ Reserv │                │ │
                    │  │ Settings│               │ │
                    │  │        │                │ │
                    │  └────────┴────────────────┘ │
                    └──────────────────────────────┘
                                   │
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
    /owner              /owner/courts           /owner/reservations
   (Dashboard)              │                         │
         │                  │                         │
         │          ┌───────┴───────┐                 │
         │          │               │                 │
         │          ▼               ▼                 │
         │   /owner/courts/new  /owner/courts/[id]/slots
         │                                           │
         │                                           │
         └───────────────────┬───────────────────────┘
                             │
                     [Logo Click] or
                     [Back to Player View]
                             │
                             ▼
                    ┌─────────────────┐
                    │  Landing (/)    │
                    │  or /courts     │
                    └─────────────────┘
```

---

## 3. Entry Points

### 3.1 User Dropdown (Primary)

**Location:** Shared navbar user dropdown

```typescript
// In UserDropdown component
<DropdownMenuItem asChild>
  <Link href="/owner">
    <Building className="mr-2 h-4 w-4" />
    Owner Dashboard
  </Link>
</DropdownMenuItem>
```

**Visibility:** 
- Production: Only if user has organization
- Development: Always shown (auth bypassed)

### 3.2 "List Your Court" CTA

**Location:** Shared navbar

| User State | Behavior |
|------------|----------|
| Guest | Navigate to `/login?redirect=/owner/courts/new` |
| Authenticated (no org) | Navigate to `/owner/courts/new` (will create org) |
| Authenticated (has org) | Navigate to `/owner/courts/new` |

```typescript
// In Navbar component
const handleListCourt = () => {
  if (!isAuthenticated) {
    router.push("/login?redirect=/owner/courts/new");
    return;
  }
  router.push("/owner/courts/new");
};
```

### 3.3 Direct URL

Users can navigate directly to `/owner` or any `/owner/*` route.

---

## 4. Owner Layout Navigation

### 4.1 Sidebar Links

**Location:** `src/features/owner/components/owner-sidebar.tsx`

| Item | Icon | Destination | Badge |
|------|------|-------------|-------|
| Dashboard | LayoutDashboard | `/owner` | - |
| My Courts | Building | `/owner/courts` | Court count |
| Reservations | Calendar | `/owner/reservations` | Pending count |
| Settings | Settings | `/owner/settings` | - |

### 4.2 Navbar Links

**Location:** `src/features/owner/components/owner-navbar.tsx`

| Element | Action | Destination |
|---------|--------|-------------|
| Logo | Navigate | `/` (landing) |
| User dropdown | Various | See below |

**User Dropdown Items:**
1. User info header
2. Separator
3. "Back to Player View" → `/courts`
4. "My Reservations" → `/reservations`
5. Separator
6. "Admin Dashboard" → `/admin` (if admin)
7. Separator
8. "Sign Out" → logout

---

## 5. Page-Specific Navigation

### 5.1 Owner Dashboard (`/owner`)

| Element | Action | Destination |
|---------|--------|-------------|
| "View Courts" stat | Navigate | `/owner/courts` |
| "Pending Bookings" stat | Navigate | `/owner/reservations?status=pending` |
| Recent activity item | Navigate | Respective page |
| "Add Court" CTA | Navigate | `/owner/courts/new` |

### 5.2 My Courts (`/owner/courts`)

| Element | Action | Destination |
|---------|--------|-------------|
| "Add New Court" button | Navigate | `/owner/courts/new` |
| Court row click | Navigate | `/owner/courts/[id]/slots` |
| "Edit" action | Navigate | `/owner/courts/[id]/edit` (TODO) |
| "Manage Slots" action | Navigate | `/owner/courts/[id]/slots` |
| "View Public Page" | New tab | `/courts/[id]` |

### 5.3 Create Court (`/owner/courts/new`)

| Element | Action | Destination |
|---------|--------|-------------|
| Cancel | Navigate | `/owner/courts` |
| Save/Create | Create & redirect | `/owner/courts/[id]/slots` |

### 5.4 Slot Management (`/owner/courts/[id]/slots`)

| Element | Action | Destination |
|---------|--------|-------------|
| Back/Breadcrumb | Navigate | `/owner/courts` |
| "View Public Page" | New tab | `/courts/[id]` |

### 5.5 Owner Reservations (`/owner/reservations`)

| Element | Action | Destination |
|---------|--------|-------------|
| Reservation row expand | Inline expand | - |
| "View Court" | Navigate | `/owner/courts/[id]/slots` |
| Filter tabs | Update URL | `/owner/reservations?status={status}` |

### 5.6 Settings (`/owner/settings`)

| Element | Action | Destination |
|---------|--------|-------------|
| Save | Submit form | Stay on page with toast |

---

## 6. Back to Player View

### 6.1 Options

Users should be able to return to player view from owner dashboard:

1. **Logo click** → `/` (landing page)
2. **User dropdown "Back to Player View"** → `/courts` (discovery)
3. **Browser back** → Previous page in history

### 6.2 Implementation

**In Owner Navbar:**

```typescript
// Logo
<Link href="/" className="flex items-center gap-2">
  <KudosLogo size={36} variant="full" />
</Link>

// User dropdown item
<DropdownMenuItem asChild>
  <Link href="/courts">
    <ArrowLeft className="mr-2 h-4 w-4" />
    Back to Player View
  </Link>
</DropdownMenuItem>
```

---

## 7. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/features/owner/components/owner-navbar.tsx` | Update | Add logo link, user dropdown with back option |
| `src/features/owner/components/owner-sidebar.tsx` | Verify | Ensure all links work |
| `src/app/(owner)/owner/page.tsx` | Update | Add clickable stats |
| `src/app/(owner)/owner/courts/page.tsx` | Update | Add row click navigation |
| `src/app/(owner)/owner/courts/new/page.tsx` | Update | Add cancel/success navigation |

---

## 8. Breadcrumbs

| Page | Breadcrumb |
|------|------------|
| `/owner` | Dashboard |
| `/owner/courts` | Dashboard > My Courts |
| `/owner/courts/new` | Dashboard > My Courts > New Court |
| `/owner/courts/[id]/slots` | Dashboard > My Courts > [Court Name] > Slots |
| `/owner/reservations` | Dashboard > Reservations |
| `/owner/settings` | Dashboard > Settings |

---

## 9. Acceptance Criteria

- [ ] User dropdown shows "Owner Dashboard" link
- [ ] "Owner Dashboard" navigates to `/owner`
- [ ] "List Your Court" handles guest vs auth states
- [ ] Owner sidebar navigation works for all links
- [ ] Owner navbar logo links to landing page
- [ ] "Back to Player View" in dropdown navigates to `/courts`
- [ ] Dashboard stats are clickable and navigate correctly
- [ ] Courts table rows are clickable
- [ ] Create court cancel/success navigation works
- [ ] Breadcrumbs show on nested pages
