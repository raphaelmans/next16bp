# Phase 4: Admin Journey

**Estimated Effort:** 0.5 day  
**Dependencies:** Phase 1 (Core Navigation)  
**Assigned To:** Dev 2 (see `01-07-dev-checklist-2.md`)

---

## 1. Overview

Connect admin dashboard pages with proper entry points and navigation, including ability to switch back to player view.

---

## 2. Admin Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ADMIN JOURNEY                                      │
└─────────────────────────────────────────────────────────────────────────────┘

                          ┌─────────────────┐
                          │  Player View    │
                          │  (any page)     │
                          └────────┬────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
      [User Dropdown]       [Direct URL]        [From Owner]
      "Admin Dashboard"       /admin            User Dropdown
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │      ADMIN LAYOUT            │
                    │  ┌────────┬────────────────┐ │
                    │  │Sidebar │    Content     │ │
                    │  │        │                │ │
                    │  │ Dash   │   [Page]       │ │
                    │  │ Claims │                │ │
                    │  │ Courts │                │ │
                    │  │        │                │ │
                    │  └────────┴────────────────┘ │
                    └──────────────────────────────┘
                                   │
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
    /admin                /admin/claims             /admin/courts
   (Dashboard)                 │                         │
         │                     │                         │
         │                     ▼                         ▼
         │            /admin/claims/[id]        /admin/courts/new
         │                     │
         │              [Approve/Reject]
         │                     │
         │                     ▼
         │              Success → /admin/claims
         │
         └───────────────────┬───────────────────────────────┘
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
  <Link href="/admin">
    <Shield className="mr-2 h-4 w-4" />
    Admin Dashboard
  </Link>
</DropdownMenuItem>
```

**Visibility:** 
- Production: Only if user role is "admin"
- Development: Always shown (auth bypassed)

### 3.2 Direct URL

Admins can navigate directly to `/admin` or any `/admin/*` route.

### 3.3 From Owner Dashboard

Admin users can access admin dashboard from owner navbar user dropdown.

---

## 4. Admin Layout Navigation

### 4.1 Sidebar Links

**Location:** `src/features/admin/components/admin-sidebar.tsx`

| Item | Icon | Destination | Badge |
|------|------|-------------|-------|
| Dashboard | LayoutDashboard | `/admin` | - |
| Claims | FileCheck | `/admin/claims` | Pending count |
| Courts | Building | `/admin/courts` | - |

### 4.2 Navbar Links

**Location:** `src/features/admin/components/admin-navbar.tsx`

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
6. "Owner Dashboard" → `/owner` (if owner)
7. Separator
8. "Sign Out" → logout

---

## 5. Page-Specific Navigation

### 5.1 Admin Dashboard (`/admin`)

| Element | Action | Destination |
|---------|--------|-------------|
| "Pending Claims" stat | Navigate | `/admin/claims?status=pending` |
| "Total Courts" stat | Navigate | `/admin/courts` |
| Pending claim row | Navigate | `/admin/claims/[id]` |
| Recent activity item | Navigate | Respective page |

### 5.2 Claims List (`/admin/claims`)

| Element | Action | Destination |
|---------|--------|-------------|
| Claim row click | Navigate | `/admin/claims/[id]` |
| "Review" action | Navigate | `/admin/claims/[id]` |
| Filter tabs | Update URL | `/admin/claims?status={status}` |
| Type filter | Update URL | `/admin/claims?type={type}` |

### 5.3 Claim Detail (`/admin/claims/[id]`)

| Element | Action | Destination |
|---------|--------|-------------|
| Back/Breadcrumb | Navigate | `/admin/claims` |
| "View Court" link | New tab | `/courts/[courtId]` |
| Approve | Submit & redirect | `/admin/claims` with success toast |
| Reject | Submit & redirect | `/admin/claims` with success toast |

### 5.4 Courts List (`/admin/courts`)

| Element | Action | Destination |
|---------|--------|-------------|
| "Add Curated Court" button | Navigate | `/admin/courts/new` |
| Court row click | Navigate | `/admin/courts/[id]` (TODO: create) |
| "View Public Page" action | New tab | `/courts/[id]` |
| Filter dropdowns | Update URL | `/admin/courts?{filters}` |

### 5.5 Create Curated Court (`/admin/courts/new`)

| Element | Action | Destination |
|---------|--------|-------------|
| Cancel | Navigate | `/admin/courts` |
| Create | Create & redirect | `/admin/courts` with success toast |

---

## 6. Back to Player View

### 6.1 Options

Users should be able to return to player view from admin dashboard:

1. **Logo click** → `/` (landing page)
2. **User dropdown "Back to Player View"** → `/courts` (discovery)
3. **Browser back** → Previous page in history

### 6.2 Implementation

**In Admin Navbar:**

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
| `src/features/admin/components/admin-navbar.tsx` | Update | Add logo link, user dropdown with back option |
| `src/features/admin/components/admin-sidebar.tsx` | Verify | Ensure all links work, badge updates |
| `src/app/(admin)/admin/page.tsx` | Update | Add clickable stats and pending claims |
| `src/app/(admin)/admin/claims/page.tsx` | Update | Add row click navigation |
| `src/app/(admin)/admin/claims/[id]/page.tsx` | Update | Add back nav, action redirects |
| `src/app/(admin)/admin/courts/page.tsx` | Update | Add row click navigation |
| `src/app/(admin)/admin/courts/new/page.tsx` | Update | Add cancel/success navigation |

---

## 8. Breadcrumbs

| Page | Breadcrumb |
|------|------------|
| `/admin` | Dashboard |
| `/admin/claims` | Dashboard > Claims |
| `/admin/claims/[id]` | Dashboard > Claims > Claim #[id] |
| `/admin/courts` | Dashboard > Courts |
| `/admin/courts/new` | Dashboard > Courts > New Curated Court |
| `/admin/courts/[id]` | Dashboard > Courts > [Court Name] (TODO) |

---

## 9. Claims Badge

The sidebar should show pending claims count as a badge:

```typescript
// In admin-sidebar.tsx
const { data: pendingClaims } = usePendingClaimsCount();

<SidebarMenuItem>
  <Link href="/admin/claims">
    <FileCheck className="h-4 w-4" />
    Claims
    {pendingClaims > 0 && (
      <Badge variant="destructive" className="ml-auto">
        {pendingClaims}
      </Badge>
    )}
  </Link>
</SidebarMenuItem>
```

---

## 10. Acceptance Criteria

- [ ] User dropdown shows "Admin Dashboard" link
- [ ] "Admin Dashboard" navigates to `/admin`
- [ ] Admin sidebar navigation works for all links
- [ ] Admin navbar logo links to landing page
- [ ] "Back to Player View" in dropdown navigates to `/courts`
- [ ] Dashboard stats are clickable and navigate correctly
- [ ] Pending claims section links to claim details
- [ ] Claims table rows are clickable
- [ ] Claim approve/reject redirects to claims list
- [ ] Courts table rows are clickable (to detail - TODO)
- [ ] Create curated court cancel/success navigation works
- [ ] Claims badge shows pending count
- [ ] Breadcrumbs show on nested pages
