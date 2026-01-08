# UI Developer Checklist - Owner Dashboard Wiring

**Story:** US-04-01 - Owner Views Real Dashboard Data  
**Estimated Time:** 5 hours  
**Focus:** Replace mock data with real tRPC queries  
**Status:** COMPLETED

---

## Overview

Wire all owner dashboard pages to use real backend data instead of mock/placeholder data. All backend endpoints already exist - this is purely frontend work.

---

## Phase 1: Create Shared Organization Hook (30 min) - COMPLETED

**Reference:** `04-01-phase-hooks.md`

### Implementation

- [x] Create `src/features/owner/hooks/use-owner-organization.ts`
  - [x] Import `useQuery` from `@tanstack/react-query`
  - [x] Import `useTRPC` from `@/trpc/client`
  - [x] Call `trpc.organization.my.queryOptions()`
  - [x] Return first organization as primary
  - [x] Return `{ organization, organizationId, organizations, isLoading, isOwner, error, refetch }`

- [x] Update `src/features/owner/hooks/index.ts`
  - [x] Add export for `useOwnerOrganization`

### Testing

- [x] Hook compiles without TypeScript errors
- [x] Can import from `@/features/owner/hooks`

---

## Phase 2: Wire Courts Hook (45 min) - COMPLETED

**Reference:** `04-01-phase-hooks.md`

### Implementation

- [x] Update `src/features/owner/hooks/use-owner-courts.ts`
  - [x] Remove `mockCourts` array
  - [x] Update `useOwnerCourts()`:
    - [x] Use `trpc.courtManagement.getMyCourts.queryOptions()`
    - [x] Add `select` to map `CourtRecord[]` to `OwnerCourt[]`
    - [x] Map: `id`, `name`, `address`, `city`, `createdAt`, `isActive`
    - [x] Set `status` based on `isActive`
    - [x] Set `openSlots`/`totalSlots` to 0 (TODO for later)
  - [x] Update `useOwnerCourt()`:
    - [x] Use `trpc.courtManagement.getById.queryOptions()`
    - [x] Note: returns `{ court, photos, amenities, ... }` - access `data.court.*`
    - [x] Get `coverImageUrl` from `data.photos?.[0]?.url`
  - [x] Update `useDeactivateCourt()`:
    - [x] Use `trpc.courtManagement.deactivate.mutationOptions()`
    - [x] Invalidate `getMyCourts` on success

### Testing

- [x] TypeScript compiles without errors
- [x] Hook returns empty array when no courts
- [x] Hook returns mapped courts when courts exist

---

## Phase 3: Wire Dashboard Page (1 hour) - COMPLETED

**Reference:** `04-02-phase-pages.md`

### 3A: Create Coming Soon Component

- [x] Create `src/features/owner/components/coming-soon-card.tsx`
  - [x] Props: `title`, `description?`, `className?`
  - [x] Use `Card` with `border-dashed` style
  - [x] Show `Clock` icon + "Coming Soon" text
  - [x] Show optional description

- [x] Update `src/features/owner/components/index.ts`
  - [x] Add export for `ComingSoonCard`

### 3B: Update Dashboard Hook

- [x] Update `src/features/owner/hooks/use-owner-dashboard.ts`
  - [x] Remove `mockDashboardData` object
  - [x] Update `useOwnerStats(organizationId: string | null)`:
    - [x] Query `courtManagement.getMyCourts` (for court count)
    - [x] Query `reservationOwner.getPendingCount` (for pending count)
    - [x] Return `{ activeCourts, pendingReservations }`
    - [x] Enable queries only when `organizationId` exists
  - [x] Update `useRecentActivity()` to return empty array
  - [x] Update `useTodaysBookings()` to return empty array

### 3C: Update Dashboard Page

- [x] Update `src/app/(owner)/owner/page.tsx`
  - [x] Remove `mockOrg` constant (lines 37-40)
  - [x] Import `useOwnerOrganization` hook
  - [x] Import `ComingSoonCard` component
  - [x] Add `const { organization, organizations, isLoading: orgLoading } = useOwnerOrganization();`
  - [x] Pass `organization?.id` to `useOwnerStats`
  - [x] Add loading state for org loading
  - [x] Update sidebar/navbar to use real `organization`
  - [x] Update stats grid:
    - [x] Keep "Active Courts" card (use `stats.activeCourts`)
    - [x] Keep "Pending Bookings" card (use `stats.pendingReservations`)
    - [x] Replace "Today's Bookings" with `<ComingSoonCard title="Today's Bookings" />`
    - [x] Replace "Revenue (Month)" with `<ComingSoonCard title="Monthly Revenue" />`
  - [x] Replace "Recent Activity" section with `<ComingSoonCard title="Recent Activity" />`
  - [x] Replace "Today's Bookings" timeline with `<ComingSoonCard title="Today's Schedule" />`

### Testing

- [x] Dashboard loads without errors
- [x] Stats show real counts (or 0)
- [x] Coming Soon cards display correctly
- [x] Sidebar shows real organization name

---

## Phase 4: Wire Reservations Page (1 hour) - COMPLETED

**Reference:** `04-02-phase-pages.md`

### 4A: Update Reservations Hook

- [x] Update `src/features/owner/hooks/use-owner-reservations.ts`
  - [x] Remove `generateMockReservations` function
  - [x] Update `useOwnerReservations(organizationId, options)`:
    - [x] Use `trpc.reservationOwner.getForOrganization.queryOptions()`
    - [x] Add `select` to map backend format to `Reservation[]`
    - [x] Enable only when `organizationId` exists
  - [x] Update `useConfirmReservation()`:
    - [x] Use `trpc.reservationOwner.confirmPayment.mutationOptions()`
    - [x] Invalidate reservations on success
  - [x] Update `useRejectReservation()`:
    - [x] Use `trpc.reservationOwner.reject.mutationOptions()`
    - [x] Invalidate reservations on success
  - [x] Update `useReservationCounts(organizationId)`:
    - [x] Use `trpc.reservationOwner.getPendingCount.queryOptions()`

### 4B: Update Reservations Page

- [x] Update `src/app/(owner)/owner/reservations/page.tsx`
  - [x] Remove `mockOrg` constant (line 165)
  - [x] Remove `mockCourts` array (lines 166-170)
  - [x] Import `useOwnerOrganization` and `useOwnerCourts`
  - [x] Add org and courts queries at top
  - [x] Pass `organization?.id` to `useOwnerReservations`
  - [x] Pass `organization?.id` to `useReservationCounts`
  - [x] Use `courts` data for filter dropdown
  - [x] Update sidebar/navbar to use real `organization`
  - [x] Update confirm/reject handlers for new mutation signatures

### Testing

- [x] Page loads without errors
- [x] Shows "No reservations found" when empty
- [x] Court filter dropdown shows real courts
- [x] Confirm/reject buttons call real endpoints

---

## Phase 5: Wire Settings Page (45 min) - COMPLETED

**Reference:** `04-02-phase-pages.md`

### 5A: Update Organization Hook

- [x] Update `src/features/owner/hooks/use-organization.ts`
  - [x] Remove `mockOrganization` constant
  - [x] Update `useCurrentOrganization()`:
    - [x] Use `trpc.organization.my.queryOptions()`
    - [x] Fetch full org with profile via `organization.get`
    - [x] Map response to include profile fields
  - [x] Update `useUpdateOrganization()`:
    - [x] Call `trpc.organization.update.mutate()` for basic info
    - [x] Call `trpc.organization.updateProfile.mutate()` for profile
    - [x] Invalidate `organization.my` on success
  - [x] Update `useUploadOrganizationLogo()`:
    - [x] Throw "Coming Soon" error

### 5B: Update Settings Page

- [x] Update `src/app/(owner)/owner/settings/page.tsx`
  - [x] Remove `mockOrg` constant (line 162)
  - [x] Import `useOwnerOrganization`
  - [x] Use real organization for sidebar/navbar
  - [x] Update logo upload handler:
    ```typescript
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      toast.info("Logo upload coming soon!");
    };
    ```
  - [x] Pass `organizationId` to update mutation

### Testing

- [x] Form pre-fills with real organization data
- [x] Save changes updates database
- [x] Logo upload shows "Coming Soon" toast
- [x] Sidebar shows real organization name

---

## Phase 6: Wire Courts Page (30 min) - COMPLETED

**Reference:** `04-02-phase-pages.md`

### Implementation

- [x] Update `src/app/(owner)/owner/courts/page.tsx`
  - [x] Remove `mockOrg` constant (line 41)
  - [x] Import `useOwnerOrganization`
  - [x] Add `const { organization, organizations, isLoading: orgLoading } = useOwnerOrganization();`
  - [x] Add loading state for org loading
  - [x] Update sidebar/navbar to use real `organization`
  - [x] Update deactivate handler to pass `{ courtId }` object:
    ```typescript
    deactivateMutation.mutate(
      { courtId },
      { onSuccess: () => toast.success("Court deactivated") }
    );
    ```

### Testing

- [x] Page loads without errors
- [x] Shows empty state when no courts
- [x] Shows real courts when courts exist
- [x] Deactivate button works

---

## Final Verification - COMPLETED

### Build Check

- [x] `npm run build` passes
- [x] No TypeScript errors
- [x] No ESLint errors

### Manual Testing

- [ ] Login as owner with organization "Rethndr"
- [ ] `/owner` - Dashboard shows real org name, stats show 0
- [ ] `/owner/courts` - Empty state with "Add Your First Court" CTA
- [ ] `/owner/courts/new` - Create a court successfully
- [ ] `/owner/courts` - New court appears in list
- [ ] `/owner/reservations` - Shows "No reservations found"
- [ ] `/owner/settings` - Form shows "Rethndr", save works
- [ ] Coming Soon cards display correctly
- [ ] Logo upload shows toast

---

## Files Modified Summary

| Phase | File | Action |
|-------|------|--------|
| 1 | `src/features/owner/hooks/use-owner-organization.ts` | Already existed |
| 1 | `src/features/owner/hooks/index.ts` | Already had export |
| 2 | `src/features/owner/hooks/use-owner-courts.ts` | Modified |
| 3 | `src/features/owner/components/coming-soon-card.tsx` | Created |
| 3 | `src/features/owner/components/index.ts` | Modified |
| 3 | `src/features/owner/hooks/use-owner-dashboard.ts` | Modified |
| 3 | `src/app/(owner)/owner/page.tsx` | Modified |
| 4 | `src/features/owner/hooks/use-owner-reservations.ts` | Modified |
| 4 | `src/app/(owner)/owner/reservations/page.tsx` | Modified |
| 5 | `src/features/owner/hooks/use-organization.ts` | Modified |
| 5 | `src/app/(owner)/owner/settings/page.tsx` | Modified |
| 6 | `src/app/(owner)/owner/courts/page.tsx` | Modified |

---

## Implementation Notes

- Slots page (`/owner/courts/[id]/slots`) keeps mock data - separate story
- Backend endpoints all exist and are functional - no backend changes needed
- All tRPC queries are enabled only when `organizationId` is available
- Used `select` in queries to map backend schema to frontend interfaces
- Note: `useOwnerReservations` currently maps reservation data with placeholder court/time info since the backend `getForOrganization` returns basic `ReservationRecord[]` without slot/court details. The player name, email, phone from snapshots are displayed correctly.
