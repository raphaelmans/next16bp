# Dev Checklist 2: Owner/Admin Journey & Polish

**Assigned To:** Developer 2  
**Phases:** 3-5  
**Estimated Effort:** 2 days  
**Dependencies:** Can start Phase 3-4 in parallel with Dev 1; Phase 5 after Phases 1-4

---

## Prerequisites

Before starting, ensure you have:
- [ ] Read `01-00-overview.md` for project context
- [ ] Read `business-contexts/kudoscourts-design-system.md` for design tokens
- [ ] Run `npm run dev` and verify the app starts
- [ ] Understand owner layout at `src/app/(owner)/layout.tsx`
- [ ] Understand admin layout at `src/app/(admin)/layout.tsx`

---

## Phase 3: Owner Journey

### 3.1 Owner Dashboard Entry

**Goal:** Enable navigation to owner dashboard from player view

**Reference:** `01-03-phase-owner-journey.md` Section 3

- [ ] **Verify user dropdown has Owner Dashboard link**
  - File: `src/features/discovery/components/user-dropdown.tsx` (created by Dev 1)
  - Ensure "Owner Dashboard" item exists
  - Links to `/owner`
  - Shows for all users during dev (auth bypassed)

- [ ] **Update "List Your Court" behavior**
  - File: `src/features/discovery/components/navbar.tsx`
  - Guest: Navigate to `/login?redirect=/owner/courts/new`
  - Authenticated: Navigate to `/owner/courts/new`

### 3.2 Owner Navbar Enhancement

**Goal:** Add back-to-player navigation and proper logo link

**Reference:** `01-03-phase-owner-journey.md` Section 6

- [ ] **Update owner navbar logo**
  - File: `src/features/owner/components/owner-navbar.tsx`
  - Logo should link to `/` (landing page)
  - Use same KudosLogo component

- [ ] **Add user dropdown to owner navbar**
  - File: `src/features/owner/components/owner-navbar.tsx`
  - Create or reuse dropdown component
  - Items:
    - User info header
    - Separator
    - "Back to Player View" → `/courts`
    - "My Reservations" → `/reservations`
    - Separator
    - "Admin Dashboard" → `/admin` (if admin, always for dev)
    - Separator
    - "Sign Out"

### 3.3 Owner Sidebar Navigation

**Goal:** Ensure all sidebar links work correctly

**Reference:** `01-03-phase-owner-journey.md` Section 4

- [ ] **Verify sidebar links**
  - File: `src/features/owner/components/owner-sidebar.tsx`
  - Dashboard → `/owner`
  - My Courts → `/owner/courts`
  - Reservations → `/owner/reservations`
  - Settings → `/owner/settings`

- [ ] **Add active state styling**
  - Current page should be highlighted in sidebar
  - Use `usePathname()` to detect current route

### 3.4 Owner Page Navigation

**Goal:** Add clickable elements and proper redirects

- [ ] **Dashboard clickable stats**
  - File: `src/app/(owner)/owner/page.tsx`
  - "Active Courts" stat → `/owner/courts`
  - "Pending Bookings" stat → `/owner/reservations?status=pending`
  - "Add Court" CTA → `/owner/courts/new`

- [ ] **Courts table row clicks**
  - File: `src/app/(owner)/owner/courts/page.tsx`
  - Row click → `/owner/courts/[id]/slots`
  - "Manage Slots" action → `/owner/courts/[id]/slots`
  - "View Public Page" → new tab `/courts/[id]`

- [ ] **Create court redirects**
  - File: `src/app/(owner)/owner/courts/new/page.tsx`
  - Cancel → `/owner/courts`
  - Success → `/owner/courts/[id]/slots` with toast

- [ ] **Slot management back link**
  - File: `src/app/(owner)/owner/courts/[id]/slots/page.tsx`
  - Back/breadcrumb → `/owner/courts`
  - "View Public Page" → new tab `/courts/[id]`

---

## Phase 4: Admin Journey

### 4.1 Admin Dashboard Entry

**Goal:** Enable navigation to admin dashboard from player/owner view

**Reference:** `01-04-phase-admin-journey.md` Section 3

- [ ] **Verify user dropdown has Admin Dashboard link**
  - File: `src/features/discovery/components/user-dropdown.tsx` (created by Dev 1)
  - Ensure "Admin Dashboard" item exists
  - Links to `/admin`
  - Shows for all users during dev (auth bypassed)

### 4.2 Admin Navbar Enhancement

**Goal:** Add back-to-player navigation and proper logo link

**Reference:** `01-04-phase-admin-journey.md` Section 6

- [ ] **Update admin navbar logo**
  - File: `src/features/admin/components/admin-navbar.tsx`
  - Logo should link to `/` (landing page)
  - Use same KudosLogo component

- [ ] **Add user dropdown to admin navbar**
  - File: `src/features/admin/components/admin-navbar.tsx`
  - Create or reuse dropdown component
  - Items:
    - User info header
    - Separator
    - "Back to Player View" → `/courts`
    - "My Reservations" → `/reservations`
    - Separator
    - "Owner Dashboard" → `/owner` (if owner, always for dev)
    - Separator
    - "Sign Out"

### 4.3 Admin Sidebar Navigation

**Goal:** Ensure all sidebar links work correctly with badge

**Reference:** `01-04-phase-admin-journey.md` Section 4

- [ ] **Verify sidebar links**
  - File: `src/features/admin/components/admin-sidebar.tsx`
  - Dashboard → `/admin`
  - Claims → `/admin/claims`
  - Courts → `/admin/courts`

- [ ] **Add claims badge**
  - Show pending claims count on Claims menu item
  - Use mock count for now (e.g., 3)
  - TODO comment for real API integration

- [ ] **Add active state styling**
  - Current page should be highlighted in sidebar
  - Use `usePathname()` to detect current route

### 4.4 Admin Page Navigation

**Goal:** Add clickable elements and proper redirects

- [ ] **Dashboard clickable stats**
  - File: `src/app/(admin)/admin/page.tsx`
  - "Pending Claims" stat → `/admin/claims?status=pending`
  - "Total Courts" stat → `/admin/courts`
  - Pending claims list items → `/admin/claims/[id]`

- [ ] **Claims table row clicks**
  - File: `src/app/(admin)/admin/claims/page.tsx`
  - Row click → `/admin/claims/[id]`
  - "Review" action → `/admin/claims/[id]`

- [ ] **Claim detail actions**
  - File: `src/app/(admin)/admin/claims/[id]/page.tsx`
  - Back/breadcrumb → `/admin/claims`
  - "View Court" → new tab `/courts/[courtId]`
  - Approve → redirect to `/admin/claims` with success toast
  - Reject → redirect to `/admin/claims` with toast

- [ ] **Courts table row clicks**
  - File: `src/app/(admin)/admin/courts/page.tsx`
  - Row click → `/admin/courts/[id]` (TODO: page doesn't exist yet)
  - For now, show toast "Court detail page coming soon"
  - "View Public Page" → new tab `/courts/[id]`

- [ ] **Create curated court redirects**
  - File: `src/app/(admin)/admin/courts/new/page.tsx`
  - Cancel → `/admin/courts`
  - Success → `/admin/courts` with success toast

---

## Phase 5: Polish

### 5.1 Loading States

**Goal:** Add skeleton loaders for all data-loading pages

**Reference:** `01-05-phase-polish.md` Section 2

- [ ] **Create loading files**
  - `src/app/(public)/courts/loading.tsx` - Grid of 6 court card skeletons
  - `src/app/(public)/courts/[id]/loading.tsx` - Court detail skeleton
  - `src/app/(auth)/reservations/loading.tsx` - Table skeleton
  - `src/app/(owner)/owner/loading.tsx` - Dashboard skeleton
  - `src/app/(admin)/admin/loading.tsx` - Dashboard skeleton

- [ ] **Use consistent skeleton patterns**
  - Use shadcn/ui Skeleton component
  - Match layout of actual content
  - Add subtle pulse animation (default)

### 5.2 Empty States

**Goal:** Add meaningful empty states to all list pages

**Reference:** `01-05-phase-polish.md` Section 3

- [ ] **Create empty state component**
  - File: `src/components/ui/empty-state.tsx`
  - Props: icon, title, description, action (optional)
  - Center aligned with padding

- [ ] **Add empty states to pages**
  - Discovery no results: "No courts found" + "Clear Filters"
  - Owner courts: "No courts yet" + "Add Court"
  - Owner reservations: "No reservations" (no CTA)
  - Admin claims (filtered): "No claims match filters"
  - Admin courts: "No courts" + "Add Curated Court"

### 5.3 Error Boundaries

**Goal:** Add error handling for all route groups

**Reference:** `01-05-phase-polish.md` Section 4

- [ ] **Create error files**
  - `src/app/(public)/courts/error.tsx`
  - `src/app/(auth)/reservations/error.tsx`
  - `src/app/(owner)/owner/error.tsx`
  - `src/app/(admin)/admin/error.tsx`

- [ ] **Use consistent error pattern**
  - Icon: AlertCircle in destructive color
  - Title: "Something went wrong"
  - Description: "We encountered an error loading this page."
  - CTA: "Try again" button that calls `reset()`

### 5.4 Toast Notifications

**Goal:** Add toast feedback for all mutations

**Reference:** `01-05-phase-polish.md` Section 5

- [ ] **Add toasts to owner actions**
  - Court created: "Court created successfully"
  - Court updated: "Court updated"
  - Slot created: "Slot(s) added"
  - Booking confirmed: "Booking confirmed"
  - Booking rejected: "Booking rejected"
  - Settings saved: "Settings saved"

- [ ] **Add toasts to admin actions**
  - Claim approved: "Claim approved"
  - Claim rejected: "Claim rejected"
  - Court created: "Curated court created"
  - Court updated: "Court updated"

### 5.5 Accessibility

**Goal:** Ensure keyboard navigation and screen reader support

**Reference:** `01-05-phase-polish.md` Section 7

- [ ] **Add ARIA labels to icon buttons**
  - Mobile menu button: `aria-label="Open menu"`
  - Close buttons: `aria-label="Close"`
  - Action buttons with only icons

- [ ] **Verify focus states**
  - All buttons, links, inputs should have visible focus ring
  - Dropdowns should trap focus when open

- [ ] **Check color contrast**
  - Text on colored backgrounds meets 4.5:1 ratio
  - Use browser dev tools accessibility audit

---

## Testing Checklist

After completing all tasks, verify:

### Owner Journey
- [ ] Can access owner dashboard from user dropdown
- [ ] Owner navbar logo links to landing page
- [ ] "Back to Player View" navigates to `/courts`
- [ ] All sidebar links work
- [ ] Dashboard stats are clickable
- [ ] Court table rows are clickable
- [ ] Create court flow works with redirects
- [ ] Slot management has back navigation

### Admin Journey
- [ ] Can access admin dashboard from user dropdown
- [ ] Admin navbar logo links to landing page
- [ ] "Back to Player View" navigates to `/courts`
- [ ] All sidebar links work
- [ ] Claims badge shows count
- [ ] Dashboard stats are clickable
- [ ] Claims table rows are clickable
- [ ] Claim approve/reject redirects correctly
- [ ] Courts table rows show toast (detail page TODO)
- [ ] Create curated court flow works

### Polish
- [ ] Loading skeletons show on all pages
- [ ] Empty states show when no data
- [ ] Error boundaries catch errors
- [ ] Toasts show for all mutations
- [ ] Keyboard navigation works
- [ ] No accessibility warnings in dev tools

### Build
- [ ] `npm run build` passes with no errors
- [ ] No TypeScript errors in modified files
- [ ] No console errors in browser

---

## Files Modified Summary

| File | Action |
|------|--------|
| `src/features/owner/components/owner-navbar.tsx` | Update |
| `src/features/owner/components/owner-sidebar.tsx` | Update |
| `src/app/(owner)/owner/page.tsx` | Update |
| `src/app/(owner)/owner/courts/page.tsx` | Update |
| `src/app/(owner)/owner/courts/new/page.tsx` | Update |
| `src/app/(owner)/owner/courts/[id]/slots/page.tsx` | Update |
| `src/features/admin/components/admin-navbar.tsx` | Update |
| `src/features/admin/components/admin-sidebar.tsx` | Update |
| `src/app/(admin)/admin/page.tsx` | Update |
| `src/app/(admin)/admin/claims/page.tsx` | Update |
| `src/app/(admin)/admin/claims/[id]/page.tsx` | Update |
| `src/app/(admin)/admin/courts/page.tsx` | Update |
| `src/app/(admin)/admin/courts/new/page.tsx` | Update |
| `src/components/ui/empty-state.tsx` | Create |
| `src/app/(public)/courts/loading.tsx` | Create |
| `src/app/(public)/courts/[id]/loading.tsx` | Create |
| `src/app/(auth)/reservations/loading.tsx` | Create |
| `src/app/(owner)/owner/loading.tsx` | Create |
| `src/app/(admin)/admin/loading.tsx` | Create |
| `src/app/(public)/courts/error.tsx` | Create |
| `src/app/(auth)/reservations/error.tsx` | Create |
| `src/app/(owner)/owner/error.tsx` | Create |
| `src/app/(admin)/admin/error.tsx` | Create |

---

## Handoff Notes

When complete:
1. All navigation flows should work end-to-end
2. User can switch between Player/Owner/Admin views
3. All pages have loading, empty, and error states
4. Toasts show for all user actions
5. Ready for real auth integration (replace mock states)
