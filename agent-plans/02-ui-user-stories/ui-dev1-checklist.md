# UI Developer Checklist - UI User Stories Implementation

**Focus Area:** Frontend components, pages, and client-side logic  
**Estimated Time:** 2.5 days  
**Can Parallel With:** Server Dev (most tasks)

---

## Overview

UI work for implementing user stories. Most UI work can proceed in parallel with server development using mocked data where needed.

---

## Phase 1: Foundation (Day 1)

### Module U1A: Auth Wiring

**Reference:** `02-01-phase-foundation.md`  
**Estimated Time:** 2-3 hours  
**Parallel:** Yes - No server dependency  
**Blocks:** All subsequent UI work

#### Implementation

- [ ] Update `src/features/discovery/components/navbar.tsx`
  - [ ] Remove lines 32-40 (DEV flags)
  - [ ] Add imports:
    ```typescript
    import { useSession } from "@/features/auth/hooks/use-auth";
    import { trpc } from "@/shared/lib/trpc/client";
    ```
  - [ ] Replace DEV flags with real queries:
    ```typescript
    const { data: session, isLoading: sessionLoading } = useSession();
    const { data: orgs } = trpc.organization.my.useQuery(undefined, {
      enabled: !!session?.user,
    });
    const isAuthenticated = !!session?.user;
    const user = session?.user ? {
      name: session.user.email?.split('@')[0] || 'User',
      email: session.user.email || '',
      avatarUrl: null,
    } : null;
    const isOwner = (orgs?.length ?? 0) > 0;
    const isAdmin = session?.role === 'admin';
    ```

- [ ] Update `src/features/discovery/components/user-dropdown.tsx`
  - [ ] Remove default prop values (lines 41-42)
  - [ ] Make props required

- [ ] Update `src/features/discovery/components/booking-card.tsx`
  - [ ] Remove line 25 (`DEV_IS_AUTHENTICATED`)
  - [ ] Add `useSession()` hook
  - [ ] Use real auth state

- [ ] Update `src/features/owner/components/owner-navbar.tsx`
  - [ ] Remove default `isAdmin = true`

- [ ] Update `src/features/admin/components/admin-navbar.tsx`
  - [ ] Remove default `isOwner = true`

- [ ] Update `src/features/admin/components/admin-only.tsx`
  - [ ] Remove default `isAdmin = true`

#### Testing

- [ ] Guest sees "Sign In" button in navbar
- [ ] Authenticated user sees user dropdown
- [ ] Owner sees "Owner Dashboard" in dropdown
- [ ] Admin sees "Admin Dashboard" in dropdown
- [ ] Non-owner doesn't see owner link
- [ ] Non-admin doesn't see admin link
- [ ] Booking card shows correct auth state

---

### Module U1B: Home Page

**Reference:** `02-01-phase-foundation.md`  
**Estimated Time:** 4-5 hours  
**Parallel:** Partial - Can mock server data  
**Server Dependency:** S3 (pending count), S4 (reservations filter)

#### Setup

- [ ] Create `src/app/(auth)/home/page.tsx`
- [ ] Create `src/features/home/` directory structure:
  ```
  src/features/home/
  ├── components/
  │   ├── index.ts
  │   ├── welcome-header.tsx
  │   ├── quick-actions.tsx
  │   ├── upcoming-reservations.tsx
  │   ├── organization-section.tsx
  │   └── profile-completion-banner.tsx
  └── hooks/
      └── use-home-data.ts
  ```

#### Implementation

- [ ] Create `src/features/home/hooks/use-home-data.ts`
  ```typescript
  import { trpc } from "@/shared/lib/trpc/client";

  export function useHomeData() {
    const { data: profile } = trpc.profile.me.useQuery();
    const { data: reservations } = trpc.reservation.getMyReservations.useQuery({
      limit: 3,
      // upcoming: true, // if supported
    });
    const { data: orgs } = trpc.organization.my.useQuery();
    
    const organization = orgs?.[0] ?? null;
    
    const isProfileComplete = !!(
      profile?.displayName && 
      (profile?.email || profile?.phoneNumber)
    );

    return { profile, reservations: reservations ?? [], organization, isProfileComplete };
  }
  ```

- [ ] Create `src/features/home/components/welcome-header.tsx`
- [ ] Create `src/features/home/components/quick-actions.tsx`
  - [ ] Icons: Search, CalendarDays, User, Building2, Shield
  - [ ] Conditional Owner/Admin cards
  - [ ] Card styling per design system

- [ ] Create `src/features/home/components/upcoming-reservations.tsx`
  - [ ] Reservation cards with status badges
  - [ ] Empty state with "Browse Courts" CTA

- [ ] Create `src/features/home/components/organization-section.tsx`
  - [ ] With org: name, court count, pending count, dashboard link
  - [ ] Without org: "Become Owner" CTA (accent-light bg)

- [ ] Create `src/features/home/components/profile-completion-banner.tsx`
  - [ ] Dismissible (localStorage)
  - [ ] primary-light background

- [ ] Create `src/features/home/components/index.ts` (exports)

- [ ] Create `src/app/(auth)/home/page.tsx`
  - [ ] Redirect if not authenticated
  - [ ] Responsive grid layout

#### Testing

- [ ] Page loads for authenticated user
- [ ] Unauthenticated redirected to login
- [ ] Quick actions show correct items based on role
- [ ] Reservations display (or empty state)
- [ ] Organization section shows correct variant
- [ ] Profile banner shows when incomplete
- [ ] Banner dismiss persists in localStorage

---

### Module U1C: Login Redirect

**Reference:** `02-01-phase-foundation.md`  
**Estimated Time:** 30 minutes  
**Parallel:** Yes - No server dependency

#### Implementation

- [ ] Update `src/features/auth/components/login-form.tsx`
  - [ ] Change line ~34 from `/courts` to `/home`

- [ ] Update `src/features/discovery/components/navbar.tsx`
  - [ ] Logo href: `{isAuthenticated ? "/home" : "/"}`

#### Testing

- [ ] Login without redirect → `/home`
- [ ] Login with `?redirect=/courts/123` → `/courts/123`
- [ ] Logo click (authenticated) → `/home`
- [ ] Logo click (guest) → `/`

---

## Phase 2: Navigation (Day 1-2)

### Module U2A: PageHeader Component

**Reference:** `02-02-phase-navigation.md`  
**Estimated Time:** 1-2 hours  
**Parallel:** Yes - No server dependency  
**Blocks:** U2B-U2E

#### Implementation

- [ ] Create `src/components/ui/page-header.tsx`
  - [ ] Props: title, description?, breadcrumbs?, backHref?, backLabel?, actions?, className?
  - [ ] Use existing Breadcrumb components
  - [ ] ArrowLeft icon for back button
  - [ ] Responsive layout

- [ ] Export from `src/components/ui/index.ts`

#### Testing

- [ ] Renders title only
- [ ] Renders with breadcrumbs
- [ ] Renders with back button
- [ ] Renders with actions slot
- [ ] All combinations work

---

### Module U2B: Public Navigation

**Reference:** `02-02-phase-navigation.md`  
**Estimated Time:** 1 hour  
**Parallel:** Yes  
**Dependencies:** U2A

#### Implementation

- [ ] Update `src/app/(public)/courts/[id]/page.tsx`
  - [ ] Add PageHeader with breadcrumbs: Home > Courts > {Name}

- [ ] Update `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx`
  - [ ] Add PageHeader with breadcrumbs + back button

#### Testing

- [ ] Court detail shows breadcrumbs
- [ ] Booking page shows breadcrumbs + back
- [ ] Back button navigates correctly

---

### Module U2C: Account Navigation

**Reference:** `02-02-phase-navigation.md`  
**Estimated Time:** 1-2 hours  
**Parallel:** Yes  
**Dependencies:** U2A

#### Implementation

- [ ] Move/create `src/app/(auth)/account/profile/page.tsx`
  - [ ] PageHeader: Account > Profile, back to /home

- [ ] Update `src/app/(auth)/reservations/page.tsx`
  - [ ] PageHeader: "My Reservations" (no breadcrumbs)

- [ ] Update `src/app/(auth)/reservations/[id]/page.tsx`
  - [ ] PageHeader: My Reservations > Details, back button

- [ ] Update `src/app/(auth)/reservations/[id]/payment/page.tsx`
  - [ ] PageHeader: ...Details > Payment, back button

#### Testing

- [ ] Profile at `/account/profile` works
- [ ] All pages have consistent headers
- [ ] Back buttons navigate correctly

---

### Module U2D: Owner Navigation

**Reference:** `02-02-phase-navigation.md`  
**Estimated Time:** 1 hour  
**Parallel:** Yes  
**Dependencies:** U2A

#### Implementation

- [ ] Update `src/features/owner/components/owner-sidebar.tsx`
  - [ ] Add `usePathname()` hook
  - [ ] Active state: `bg-primary/10 text-primary border-l-2 border-primary`

- [ ] Update `src/app/(owner)/owner/courts/new/page.tsx`
  - [ ] Add PageHeader with breadcrumbs + back

- [ ] Update `src/app/(owner)/owner/courts/[id]/slots/page.tsx`
  - [ ] Add PageHeader with breadcrumbs + back

#### Testing

- [ ] Sidebar shows active state
- [ ] Form pages have breadcrumbs + back
- [ ] Navigation works correctly

---

### Module U2E: Admin Navigation

**Reference:** `02-02-phase-navigation.md`  
**Estimated Time:** 1 hour  
**Parallel:** Partial - Badge needs S5  
**Dependencies:** U2A, S5 (for badge)

#### Implementation

- [ ] Update `src/features/admin/components/admin-sidebar.tsx`
  - [ ] Add active state styling
  - [ ] Add pending claims badge (query `claimAdmin.getPendingCount` or mock)

- [ ] Update `src/app/(admin)/admin/claims/[id]/page.tsx`
  - [ ] Verify/add PageHeader

- [ ] Update `src/app/(admin)/admin/courts/new/page.tsx`
  - [ ] Add PageHeader with breadcrumbs + back

#### Testing

- [ ] Sidebar shows active state
- [ ] Claims badge shows count (or 0)
- [ ] Form pages have breadcrumbs + back

---

## Phase 3: Organization (Day 2)

### Module U3A: Profile CTA

**Reference:** `02-03-phase-organization.md`  
**Estimated Time:** 1 hour  
**Parallel:** Yes

#### Implementation

- [ ] Update profile page (at `/account/profile`)
  - [ ] Query `organization.my`
  - [ ] Show "Become Owner" CTA if no org
  - [ ] Show org link if has org

#### Testing

- [ ] User without org sees CTA
- [ ] User with org sees dashboard link
- [ ] CTA links to `/owner/onboarding`

---

### Module U3B: Onboarding Page

**Reference:** `02-03-phase-organization.md`  
**Estimated Time:** 2-3 hours  
**Parallel:** Yes - Uses existing endpoint

#### Setup

- [ ] Create `src/app/(auth)/owner/onboarding/page.tsx`
- [ ] Create `src/features/organization/components/organization-form.tsx`

#### Implementation

- [ ] Create organization form
  - [ ] Name field (required)
  - [ ] Slug field (optional, with preview)
  - [ ] Submit to `organization.create`
  - [ ] Success redirect to `/owner`

- [ ] Create onboarding page
  - [ ] Auth check (redirect to login if not)
  - [ ] Org check (redirect to /owner if has)
  - [ ] Header with logo + cancel
  - [ ] Centered form layout

#### Testing

- [ ] Unauthenticated → login
- [ ] Has org → /owner
- [ ] Form creates org
- [ ] Success → /owner
- [ ] Cancel → /home

---

### Module U3C: Owner Layout Guard

**Reference:** `02-03-phase-organization.md`  
**Estimated Time:** 1 hour  
**Parallel:** Yes

#### Implementation

- [ ] Update `src/app/(owner)/layout.tsx`
  - [ ] Query organizations server-side
  - [ ] Redirect to `/owner/onboarding` if no org

#### Testing

- [ ] No org → /owner/onboarding
- [ ] Has org → can access /owner/*
- [ ] Onboarding page still accessible

---

## Phase 4: Court Creation (Day 2-3)

### Module U4A: Owner Court Form

**Reference:** `02-04-phase-court-creation.md`  
**Estimated Time:** 2-3 hours  
**Parallel:** Partial - Full test needs S2  
**Server Dependency:** S2 (createCourt endpoint)

#### Implementation

- [ ] Create/update `src/features/owner/components/owner-court-form.tsx`
  - [ ] Fields: name, address, city, description, defaultPrice, currency
  - [ ] Zod validation
  - [ ] Submit to `courtManagement.createCourt`
  - [ ] Success redirect to `/owner/courts/[id]/slots`

- [ ] Update `src/app/(owner)/owner/courts/new/page.tsx`
  - [ ] Use PageHeader
  - [ ] Pass organization ID to form
  - [ ] Handle cancel

#### Testing

- [ ] Form renders all fields
- [ ] Validation works
- [ ] Submit creates court (after S2 complete)
- [ ] Success redirects to slots
- [ ] Cancel returns to list

---

## Final Checklist

### Build Verification

- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No console errors in browser

### Manual Testing

- [ ] Guest → Register → Login → Home (full flow)
- [ ] Profile → Become Owner → Create Org → Create Court (full flow)
- [ ] Navigation consistent across all areas
- [ ] Responsive on mobile

---

## Timeline & Coordination

### Your Schedule

| Time | Task | Server Dependency? |
|------|------|--------------------|
| Day 1 AM | U1A: Auth Wiring | No |
| Day 1 PM | U1B: Home Page | Partial (mock S3, S4) |
| Day 1 PM | U1C: Login Redirect | No |
| Day 1-2 | U2A: PageHeader | No |
| Day 2 | U2B-U2E: Navigation | U2E needs S5 for badge |
| Day 2 | U3A-U3C: Organization | No |
| Day 2-3 | U4A: Court Form | Needs S2 for submit |

### Sync Points with Server Dev

| When | What to Expect |
|------|----------------|
| End Day 1 | S2 (createCourt), S3 (pendingCount), S4 (reservations) ready |
| Mid Day 2 | S5 (claimsCount) ready |
| Day 2 PM | Joint integration testing |

### What Server Dev is Doing (For Context)

| Day | Server Tasks | Unblocks You |
|-----|--------------|--------------|
| Day 1 AM | S1: Verify org endpoints | - |
| Day 1 AM-PM | S2: Create court endpoint | U4A form submission |
| Day 1 PM | S3: Pending count endpoint | U1B org section stats |
| Day 1 PM | S4: Reservations filter | U1B upcoming reservations |
| Day 2 AM | S5: Claims pending count | U2E admin sidebar badge |

---

## Mock Data Strategy

Use these mocks to proceed without server endpoints. Replace with real tRPC queries when server notifies completion.

### For U1B: Home Page

```typescript
// Mock for pending count (until S3 ready)
// Replace with: trpc.reservationOwner.getPendingCount.useQuery({ organizationId })
const pendingCount = 0;

// Mock for reservations (if S4 filter not ready)
// Replace with: trpc.reservation.getMyReservations.useQuery({ limit: 3, upcoming: true })
const mockReservations = [
  {
    id: "mock-1",
    court: { name: "Sample Court", address: "123 Main St" },
    startTime: new Date(Date.now() + 86400000), // Tomorrow
    status: "CONFIRMED" as const,
  },
];
```

### For U2E: Admin Sidebar Badge

```typescript
// Mock for claims count (until S5 ready)
// Replace with: trpc.claimAdmin.getPendingCount.useQuery()
const pendingClaimsCount = 0;
```

### For U4A: Court Form

```typescript
// Mock for court creation (until S2 ready)
// Replace with: trpc.courtManagement.createCourt.useMutation()
const mockCreateCourt = async (data: CreateCourtInput) => {
  console.log("Mock createCourt:", data);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate latency
  return { id: "mock-court-id", ...data };
};
```

---

## Integration Checklist

When server dev notifies endpoint completion, integrate:

### After S2 Notification (createCourt)
- [ ] Replace mock in U4A with real `trpc.courtManagement.createCourt.useMutation()`
- [ ] Test form submission creates court
- [ ] Verify redirect to `/owner/courts/[id]/slots`

### After S3 Notification (pendingCount)
- [ ] Replace mock in U1B org section with real `trpc.reservationOwner.getPendingCount.useQuery()`
- [ ] Verify count displays correctly

### After S5 Notification (claimsCount)
- [ ] Replace mock in U2E with real `trpc.claimAdmin.getPendingCount.useQuery()`
- [ ] Verify badge shows correct count

---

## Key Dependencies Summary

| UI Module | Can Start? | Full Test Requires |
|-----------|------------|-------------------|
| U1A: Auth Wiring | Yes | Nothing |
| U1B: Home Page | Yes (mock) | S3, S4 |
| U1C: Login Redirect | Yes | Nothing |
| U2A: PageHeader | Yes | Nothing |
| U2B-D: Navigation | Yes | Nothing |
| U2E: Admin Nav | Partial | S5 for badge |
| U3A-C: Organization | Yes | Nothing |
| U4A: Court Form | Partial | S2 for submit |

---

## Reference: Server Endpoints You Need

| UI Component | Endpoint | Input | Output |
|--------------|----------|-------|--------|
| Home page - Org stats | `reservationOwner.getPendingCount` | `{ organizationId }` | `number` |
| Home page - Reservations | `reservation.getMyReservations` | `{ limit?, upcoming? }` | `Reservation[]` |
| Admin sidebar badge | `claimAdmin.getPendingCount` | none | `number` |
| Court creation form | `courtManagement.createCourt` | See S2 schema | `Court` |

### S2 createCourt Input Schema (for U4A)

```typescript
{
  organizationId: string;  // uuid
  name: string;            // 1-150 chars
  address: string;         // 1-200 chars
  city: string;            // 1-100 chars
  description?: string;    // max 1000 chars
  defaultPrice?: number;   // min 0
  currency?: string;       // default "PHP"
}
```
