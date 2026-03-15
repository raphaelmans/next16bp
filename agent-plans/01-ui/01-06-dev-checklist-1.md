# Dev Checklist 1: Core Navigation & Player Journey

**Assigned To:** Developer 1  
**Phases:** 1-2  
**Estimated Effort:** 1.5 days  
**Dependencies:** None (can start immediately)

---

## Prerequisites

Before starting, ensure you have:
- [ ] Read `01-00-overview.md` for project context
- [ ] Read `business-contexts/kudoscourts-design-system.md` for design tokens
- [ ] Run `npm run dev` and verify the app starts
- [ ] Understand the current navbar at `src/features/discovery/components/navbar.tsx`

---

## Phase 1: Core Navigation

### 1.1 Landing Page Replacement

**Goal:** Replace waitlist landing page with discovery-focused landing page

**Reference:** `01-01-phase-core-navigation.md` Section 2

- [ ] **Create landing page component**
  - File: `src/app/page.tsx` (replace existing)
  - Hero section with headline "Discover Pickleball Courts Near You"
  - Search bar that navigates to `/courts?q={query}`
  - Popular locations (Metro Manila, Cebu, Davao, Laguna, Pampanga)
  - Each location links to `/courts?city={city}`

- [ ] **Add featured courts section**
  - Section header "Featured Courts" with "View All" link to `/courts`
  - Grid of 3 court cards (reuse `CourtCard` component)
  - For now, use mock data or empty state
  - TODO comment for fetching from `court.search` API

- [ ] **Add value proposition section**
  - 3-column layout (stack on mobile)
  - Cards: Discover, Reserve, Confirm
  - Use icons from Lucide (Search, Calendar, CheckCircle)

- [ ] **Add CTA section**
  - Teal background (`bg-primary`)
  - Headline "Ready to hit the court?"
  - Button "Browse All Courts" → `/courts`

- [ ] **Reuse existing footer**
  - Import Footer from discovery components
  - No changes needed to footer

### 1.2 Shared Navbar Enhancement

**Goal:** Add authenticated user dropdown to navbar

**Reference:** `01-01-phase-core-navigation.md` Section 3

- [ ] **Create user dropdown component**
  - File: `src/features/discovery/components/user-dropdown.tsx`
  - Use shadcn/ui DropdownMenu component
  - User info header (avatar, name, email)
  - Menu items: My Reservations, Profile
  - Separator
  - Menu items: Owner Dashboard, Admin Dashboard
  - Separator
  - Sign Out button

- [ ] **Update navbar for auth states**
  - File: `src/features/discovery/components/navbar.tsx`
  - Add mock auth state variables at top:
    ```typescript
    // TODO: Replace with real auth
    const isAuthenticated = true;
    const mockUser = { name: "Dev User", email: "dev@kudoscourts.com" };
    const isOwner = true;  // Always show for dev
    const isAdmin = true;  // Always show for dev
    ```
  - Conditional render: Guest shows "Sign In", Auth shows UserDropdown
  - Add TODO comments for Supabase integration

- [ ] **Update mobile menu**
  - File: `src/features/discovery/components/navbar.tsx`
  - Add user section when authenticated
  - Add all menu items from desktop dropdown
  - Add Sign Out button at bottom

- [ ] **Export new component**
  - File: `src/features/discovery/components/index.ts`
  - Add `export { UserDropdown } from "./user-dropdown"`

### 1.3 Auth Bypass Documentation

**Goal:** Document how to switch roles for debugging

- [ ] **Add comments to tRPC context**
  - File: `src/shared/infra/trpc/context.ts`
  - Line ~69: Add comment explaining how to override role
  - Example: `// DEBUG: Change to "admin" to test admin access`

- [ ] **Verify owner layout bypass**
  - File: `src/app/(owner)/layout.tsx`
  - Ensure TODO comment explains the bypass
  - Any authenticated user should access `/owner/*`

- [ ] **Verify admin layout bypass**
  - File: `src/app/(admin)/layout.tsx`
  - Ensure TODO comment explains the bypass
  - Any authenticated user should access `/admin/*`

---

## Phase 2: Player Journey

### 2.1 Navigation Links

**Goal:** Ensure all player navigation flows work correctly

**Reference:** `01-02-phase-player-journey.md` Section 3

- [ ] **Landing page links**
  - Search form submits to `/courts?q={query}`
  - Popular locations link to `/courts?city={city}`
  - Featured court cards link to `/courts/[id]`
  - "Browse All Courts" links to `/courts`

- [ ] **Discovery page links**
  - Court cards link to `/courts/[id]`
  - Search/filter updates URL params (already working via nuqs)

- [ ] **Court detail page links**
  - Back button navigates to `/courts` or browser history
  - Time slots navigate to `/courts/[id]/book/[slotId]`

### 2.2 Auth-Gated Actions

**Goal:** Handle reserve button for guests vs authenticated users

**Reference:** `01-02-phase-player-journey.md` Section 4

- [ ] **Update court detail reserve button**
  - File: `src/app/(public)/courts/[id]/page.tsx`
  - Check if authenticated (use mock for now)
  - Guest: Show "Sign in to reserve" button
  - Guest button links to `/login?redirect=/courts/[id]`
  - Auth: Show normal reserve flow

- [ ] **Update time slot component**
  - File: `src/features/discovery/components/time-slot.tsx` (or similar)
  - Guest state: Different button text/action
  - Auth state: Normal booking action

- [ ] **Update login page redirect**
  - File: `src/app/(auth)/login/page.tsx`
  - Read `redirect` param from URL
  - After successful login, navigate to redirect URL
  - Default redirect to `/courts` if no param

### 2.3 Post-Action Redirects

**Goal:** Ensure booking and payment flows redirect correctly

- [ ] **Booking success redirect**
  - File: `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx`
  - After successful booking, redirect to `/reservations/[id]`
  - Show success toast

- [ ] **Payment success redirect**
  - File: `src/app/(auth)/reservations/[id]/payment/page.tsx`
  - After payment submission, redirect to `/reservations`
  - Show success toast

### 2.4 Empty States

**Goal:** Add empty state to My Reservations page

- [ ] **My Reservations empty state**
  - File: `src/app/(auth)/reservations/page.tsx`
  - When no reservations, show empty state
  - Icon: Calendar or similar
  - Title: "No reservations yet"
  - Description: "Book your first court and it will appear here"
  - CTA: "Browse Courts" → `/courts`

### 2.5 Navbar User Links

**Goal:** Ensure navbar links work for authenticated users

- [ ] **My Reservations link**
  - In UserDropdown, link to `/reservations`
  - Should work and show reservations list

- [ ] **Profile link**
  - In UserDropdown, link to `/profile`
  - Should work and show profile page

---

## Testing Checklist

After completing all tasks, verify:

### Landing Page
- [ ] Page loads without errors at `/`
- [ ] Search submits and navigates to `/courts?q={query}`
- [ ] Popular locations navigate to `/courts?city={city}`
- [ ] Featured courts section shows (empty or with data)
- [ ] CTA button navigates to `/courts`
- [ ] Footer displays correctly

### Navbar
- [ ] Logo links to `/`
- [ ] Search works (if visible)
- [ ] "List Your Court" shows
- [ ] Guest: "Sign In" button shows
- [ ] Auth: User dropdown shows with all items
- [ ] Mobile: Menu sheet opens with all items

### Player Flow
- [ ] Can navigate from landing → discovery → detail → booking
- [ ] Reserve button handles guest vs auth states
- [ ] Login redirects back to original page
- [ ] Booking creates reservation and redirects
- [ ] Payment submits and redirects to list
- [ ] Empty state shows when no reservations

### Build
- [ ] `npm run build` passes with no errors
- [ ] No TypeScript errors in modified files
- [ ] No console errors in browser

---

## Files Modified Summary

| File | Action |
|------|--------|
| `src/app/page.tsx` | Replace |
| `src/features/discovery/components/navbar.tsx` | Update |
| `src/features/discovery/components/user-dropdown.tsx` | Create |
| `src/features/discovery/components/index.ts` | Update |
| `src/shared/infra/trpc/context.ts` | Add comments |
| `src/app/(public)/courts/[id]/page.tsx` | Update |
| `src/app/(auth)/login/page.tsx` | Update |
| `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx` | Update |
| `src/app/(auth)/reservations/[id]/payment/page.tsx` | Update |
| `src/app/(auth)/reservations/page.tsx` | Update |

---

## Handoff Notes

When complete, notify Dev 2 that:
1. Landing page is ready at `/`
2. Navbar with user dropdown is complete
3. Player journey navigation is connected
4. Dev 2 can proceed with Phases 3-5
