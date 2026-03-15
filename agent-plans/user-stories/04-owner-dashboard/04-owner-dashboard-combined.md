# Owner Dashboard - User Stories

## Overview

The Owner Dashboard feature domain covers the authenticated experience for court owners managing their organization, courts, reservations, and settings through the `/owner/*` routes.

This domain focuses on wiring the owner dashboard UI to real backend data, replacing mock/placeholder data with actual tRPC queries. The owner dashboard serves as the primary management interface for organization owners to:

- View and manage their courts
- Monitor reservation activity and pending payments
- Update organization settings and profile
- Track business metrics (simplified for MVP)

The dashboard follows a consistent layout pattern with a sidebar for navigation and role-appropriate navbar. All data is scoped to the owner's organization.

---

## References

| Document | Location |
|----------|----------|
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` Section 4.2 (Owner persona) |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Server Context | `agent-contexts/00-01-kudoscourts-server.md` |
| UI Context | `agent-contexts/00-04-ux-flow-implementation.md` |

---

## Story Index

| ID | Story | Status | Supersedes |
|----|-------|--------|------------|
| US-04-01 | Owner Views Real Dashboard Data | Active | - |

---

## Related Domains

| Domain | Relationship |
|--------|--------------|
| 01-organization | Owner must have an organization (prerequisite) |
| 02-court-creation | Courts are created and managed from owner dashboard |
| 03-court-reservation | Reservations are managed from owner dashboard |

---

## Summary

- Total: 1
- Active: 1
- Superseded: 0

---

<div style="page-break-after: always;"></div>

# US-04-01: Owner Views Real Dashboard Data

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **Owner**, I want to **see my organization's real courts, reservations, and stats in the dashboard** so that **I can manage my actual business instead of seeing dummy placeholder data**.

---

## Acceptance Criteria

### Courts List Shows Real Data

- Given I am an owner with organization "Rethndr"
- When I visit `/owner/courts`
- Then I see my real courts (or empty state if none)
- And the sidebar shows "Rethndr" as my organization name

### Empty State When No Courts

- Given I am an owner with 0 courts
- When I visit `/owner/courts`
- Then I see the empty state with "Add Your First Court" CTA
- And clicking the CTA navigates to `/owner/courts/new`

### Dashboard Shows Real Stats

- Given I am an owner
- When I visit `/owner` (dashboard)
- Then I see:
  - Active Courts: real count from my courts
  - Pending Reservations: real count from `getPendingCount`
- And "Coming Soon" placeholders for Today's Bookings and Revenue

### Reservations Show Real Data

- Given I am an owner with reservations
- When I visit `/owner/reservations`
- Then I see my real reservations (or empty state if none)
- And I can filter by my real courts
- And I can confirm/reject reservations with real backend calls

### Settings Show Real Organization

- Given I am an owner of organization "Rethndr"
- When I visit `/owner/settings`
- Then the form is pre-filled with "Rethndr" and my real organization data
- And saving changes updates the real organization in the database

### Logo Upload Shows Coming Soon

- Given I am on `/owner/settings`
- When I click "Upload Logo"
- Then I see a toast message "Coming Soon"
- And the upload does not proceed

---

## Edge Cases

- Owner has 0 courts - Show `CourtsEmptyState` component
- Owner has 0 reservations - Show "No reservations yet" message
- Owner has no pending reservations - Pending count shows 0
- Organization query fails - Show error toast, allow retry
- Network error during save - Show error toast with retry option
- Concurrent edit of organization - Last write wins (no conflict resolution for MVP)

---

## UI Components

| Page | Route | Key Components |
|------|-------|----------------|
| Dashboard | `/owner` | StatsCard (2), PendingActions, ComingSoonCard (2) |
| Courts | `/owner/courts` | CourtsTable, CourtsEmptyState |
| Reservations | `/owner/reservations` | ReservationsTable, filter dropdowns |
| Settings | `/owner/settings` | OrganizationForm, DangerZone |

---

## Data Flow

### Shared Organization Context

All owner pages use `useOwnerOrganization()` hook:
```
trpc.organization.my → returns user's orgs → use first org
```

### Courts Page

```
useOwnerCourts() → trpc.courtManagement.getMyCourts
useDeactivateCourt() → trpc.courtManagement.deactivate
```

### Dashboard

```
useOwnerStats() → derived from:
  - trpc.courtManagement.getMyCourts (court count)
  - trpc.reservationOwner.getPendingCount (pending count)
```

### Reservations Page

```
useOwnerReservations() → trpc.reservationOwner.getForOrganization
useConfirmReservation() → trpc.reservationOwner.confirmPayment
useRejectReservation() → trpc.reservationOwner.reject
```

### Settings Page

```
useCurrentOrganization() → trpc.organization.my
useUpdateOrganization() → trpc.organization.update + updateProfile
```

---

## Implementation Phases

| Phase | Description | Time |
|-------|-------------|------|
| 1 | Create `useOwnerOrganization` shared hook | 30 min |
| 2 | Wire `/owner/courts` to real data | 45 min |
| 3 | Wire `/owner` dashboard stats | 1 hour |
| 4 | Wire `/owner/reservations` to real data | 1 hour |
| 5 | Wire `/owner/settings` to real data | 45 min |
| 6 | Verify empty states and test | 30 min |

**Total:** ~5 hours

---

## Files to Modify

### New Files

| File | Purpose |
|------|---------|
| `src/features/owner/hooks/use-owner-organization.ts` | Shared organization context hook |

### Modified Files

| File | Changes |
|------|---------|
| `src/features/owner/hooks/use-owner-courts.ts` | Replace mocks with tRPC |
| `src/features/owner/hooks/use-owner-dashboard.ts` | Replace mocks, simplify stats |
| `src/features/owner/hooks/use-owner-reservations.ts` | Replace mocks with tRPC |
| `src/features/owner/hooks/use-organization.ts` | Replace mocks with tRPC |
| `src/features/owner/hooks/index.ts` | Export new hook |
| `src/app/(owner)/owner/page.tsx` | Use real org, add Coming Soon placeholders |
| `src/app/(owner)/owner/courts/page.tsx` | Use real org |
| `src/app/(owner)/owner/reservations/page.tsx` | Use real org and courts |
| `src/app/(owner)/owner/settings/page.tsx` | Use real org, Coming Soon toast |

### Deferred (Keep Mock)

| File | Reason |
|------|--------|
| `src/app/(owner)/owner/courts/[id]/slots/page.tsx` | Separate story for slots management |
| `src/features/owner/hooks/use-slots.ts` | Depends on time slot backend enhancements |

---

## Backend Endpoints Used

| Router | Endpoint | Purpose |
|--------|----------|---------|
| `organization.my` | Get user's organizations | Shared context |
| `organization.update` | Update org basic info | Settings page |
| `organization.updateProfile` | Update org profile | Settings page |
| `courtManagement.getMyCourts` | Get owner's courts | Courts list, stats |
| `courtManagement.deactivate` | Deactivate a court | Courts list action |
| `reservationOwner.getForOrganization` | Get org reservations | Reservations list |
| `reservationOwner.getPendingCount` | Count pending | Dashboard stats |
| `reservationOwner.confirmPayment` | Confirm reservation | Reservations action |
| `reservationOwner.reject` | Reject reservation | Reservations action |

---

## References

- PRD: Section 4.2 (Owner persona), Section 5.3 (Court Management)
- Context: `agent-contexts/00-01-kudoscourts-server.md` (backend endpoints)
- Context: `agent-contexts/00-04-ux-flow-implementation.md` (current UI state)

---

<div style="page-break-after: always;"></div>

# US-04-01 Implementation Checklist

**Story:** Owner Views Real Dashboard Data  
**Estimated Time:** 5 hours  
**Status:** In Progress

---

## Phase 1: Create Shared Organization Hook

**Goal:** Single hook for fetching owner's organization, reusable across all pages.

### Implementation

- [ ] Create `src/features/owner/hooks/use-owner-organization.ts`
  ```typescript
  import { useQuery } from "@tanstack/react-query";
  import { useTRPC } from "@/trpc/client";

  export function useOwnerOrganization() {
    const trpc = useTRPC();
    const { data: organizations, isLoading, error } = useQuery(
      trpc.organization.my.queryOptions()
    );

    const organization = organizations?.[0] ?? null;

    return {
      organization,
      organizationId: organization?.id ?? null,
      organizations: organizations ?? [],
      isLoading,
      isOwner: !!organization,
      error,
    };
  }
  ```

- [ ] Update `src/features/owner/hooks/index.ts` to export new hook

### Testing

- [ ] Hook returns organization data when user is owner
- [ ] Hook returns null organization when user has no orgs
- [ ] isLoading state works correctly

---

## Phase 2: Wire Courts Page to Real Data

**Goal:** `/owner/courts` shows real courts from database.

### Hook Updates

- [ ] Update `src/features/owner/hooks/use-owner-courts.ts`:
  - [ ] Remove `mockCourts` array
  - [ ] Replace `useOwnerCourts` with real query:
    ```typescript
    export function useOwnerCourts() {
      const trpc = useTRPC();
      return useQuery(trpc.courtManagement.getMyCourts.queryOptions());
    }
    ```
  - [ ] Replace `useDeactivateCourt` with real mutation:
    ```typescript
    export function useDeactivateCourt() {
      const trpc = useTRPC();
      const queryClient = useQueryClient();
      
      return useMutation({
        ...trpc.courtManagement.deactivate.mutationOptions(),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: trpc.courtManagement.getMyCourts.queryKey(),
          });
        },
      });
    }
    ```
  - [ ] Update `OwnerCourt` interface to match backend schema (or use inferred type)

### Page Updates

- [ ] Update `src/app/(owner)/owner/courts/page.tsx`:
  - [ ] Remove `mockOrg` constant (line 41)
  - [ ] Import `useOwnerOrganization` hook
  - [ ] Add organization query at top of component
  - [ ] Replace `mockOrg` usages with real `organization`
  - [ ] Add loading state while org loads
  - [ ] Update `useDeactivateCourt` call to pass `{ courtId }`

### Testing

- [ ] Page shows loading state initially
- [ ] Page shows empty state when 0 courts
- [ ] Page shows real courts when courts exist
- [ ] Sidebar shows real organization name
- [ ] Deactivate button works (calls real endpoint)

---

## Phase 3: Wire Dashboard Stats to Real Data

**Goal:** `/owner` shows real stats, Coming Soon placeholders for unavailable data.

### Hook Updates

- [ ] Update `src/features/owner/hooks/use-owner-dashboard.ts`:
  - [ ] Remove `mockDashboardData` object
  - [ ] Rewrite `useOwnerStats` to derive from real data:
    ```typescript
    export function useOwnerStats(organizationId: string | null) {
      const trpc = useTRPC();
      
      const { data: courts, isLoading: courtsLoading } = useQuery({
        ...trpc.courtManagement.getMyCourts.queryOptions(),
        enabled: !!organizationId,
      });
      
      const { data: pendingCount, isLoading: pendingLoading } = useQuery({
        ...trpc.reservationOwner.getPendingCount.queryOptions({ 
          organizationId: organizationId! 
        }),
        enabled: !!organizationId,
      });

      return {
        data: {
          activeCourts: courts?.filter(c => c.isActive).length ?? 0,
          pendingReservations: pendingCount ?? 0,
        },
        isLoading: courtsLoading || pendingLoading,
      };
    }
    ```
  - [ ] Remove or stub `useRecentActivity` (return empty array)
  - [ ] Remove or stub `useTodaysBookings` (return empty array)

### Page Updates

- [ ] Update `src/app/(owner)/owner/page.tsx`:
  - [ ] Remove `mockOrg` constant (lines 37-40)
  - [ ] Import `useOwnerOrganization` hook
  - [ ] Pass `organizationId` to `useOwnerStats`
  - [ ] Replace `mockOrg` usages with real `organization`
  - [ ] Add loading state while org loads
  - [ ] Update stats cards to show only 2 real stats:
    - Active Courts
    - Pending Reservations
  - [ ] Replace Today's Bookings and Revenue cards with Coming Soon placeholders
  - [ ] Replace Recent Activity and Today's Bookings sections with Coming Soon cards

### Create Coming Soon Component

- [ ] Create `src/features/owner/components/coming-soon-card.tsx`:
  ```typescript
  import { Clock } from "lucide-react";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

  interface ComingSoonCardProps {
    title: string;
    description?: string;
  }

  export function ComingSoonCard({ title, description }: ComingSoonCardProps) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Coming Soon</span>
          </div>
          {description && (
            <p className="mt-2 text-xs text-muted-foreground">{description}</p>
          )}
        </CardContent>
      </Card>
    );
  }
  ```

- [ ] Export from `src/features/owner/components/index.ts`

### Testing

- [ ] Dashboard shows loading state initially
- [ ] Active Courts shows real count
- [ ] Pending Reservations shows real count (0 if none)
- [ ] Coming Soon cards display for unavailable features
- [ ] Sidebar shows real organization name

---

## Phase 4: Wire Reservations Page to Real Data

**Goal:** `/owner/reservations` shows real reservations with real actions.

### Hook Updates

- [ ] Update `src/features/owner/hooks/use-owner-reservations.ts`:
  - [ ] Remove `generateMockReservations` function
  - [ ] Update `useOwnerReservations` to use real query:
    ```typescript
    export function useOwnerReservations(
      organizationId: string | null,
      options: UseOwnerReservationsOptions = {}
    ) {
      const trpc = useTRPC();
      const { status, dateFrom, dateTo } = options;
      
      return useQuery({
        ...trpc.reservationOwner.getForOrganization.queryOptions({
          organizationId: organizationId!,
          status: status !== 'all' ? status : undefined,
          fromDate: dateFrom?.toISOString(),
          toDate: dateTo?.toISOString(),
        }),
        enabled: !!organizationId,
      });
    }
    ```
  - [ ] Update `useConfirmReservation` to use real mutation:
    ```typescript
    export function useConfirmReservation() {
      const trpc = useTRPC();
      const queryClient = useQueryClient();
      
      return useMutation({
        ...trpc.reservationOwner.confirmPayment.mutationOptions(),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: trpc.reservationOwner.getForOrganization.queryKey(),
          });
        },
      });
    }
    ```
  - [ ] Update `useRejectReservation` similarly
  - [ ] Update `useReservationCounts` to derive from query or use separate query

### Page Updates

- [ ] Update `src/app/(owner)/owner/reservations/page.tsx`:
  - [ ] Remove `mockOrg` and `mockCourts` (lines 165-170)
  - [ ] Import `useOwnerOrganization` and `useOwnerCourts` hooks
  - [ ] Use real organization for sidebar/navbar
  - [ ] Use real courts for filter dropdown
  - [ ] Pass `organizationId` to `useOwnerReservations`
  - [ ] Update confirm/reject handlers to match new mutation signatures

### Testing

- [ ] Page shows loading state initially
- [ ] Page shows "No reservations found" when empty
- [ ] Filter dropdown shows real courts
- [ ] Reservations display with correct data
- [ ] Confirm action calls real endpoint
- [ ] Reject action calls real endpoint

---

## Phase 5: Wire Settings Page to Real Data

**Goal:** `/owner/settings` loads and saves real organization data.

### Hook Updates

- [ ] Update `src/features/owner/hooks/use-organization.ts`:
  - [ ] Remove `mockOrganization` constant
  - [ ] Update `useCurrentOrganization` to use real query:
    ```typescript
    export function useCurrentOrganization() {
      const trpc = useTRPC();
      const { data: organizations, ...rest } = useQuery(
        trpc.organization.my.queryOptions()
      );
      
      const organization = organizations?.[0];
      
      // Map to expected shape with profile data
      return {
        data: organization ? {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          description: organization.profile?.description,
          logoUrl: organization.profile?.logoUrl,
          email: organization.profile?.contactEmail,
          phone: organization.profile?.contactPhone,
          address: organization.profile?.address,
          createdAt: organization.createdAt,
        } : null,
        ...rest,
      };
    }
    ```
  - [ ] Update `useUpdateOrganization` to use real mutation:
    ```typescript
    export function useUpdateOrganization() {
      const trpc = useTRPC();
      const queryClient = useQueryClient();
      
      return useMutation({
        mutationFn: async (data: UpdateOrganizationData) => {
          // Update basic org info
          await trpc.organization.update.mutate({
            organizationId: data.organizationId,
            name: data.name,
            slug: data.slug,
          });
          // Update profile
          await trpc.organization.updateProfile.mutate({
            organizationId: data.organizationId,
            description: data.description,
            contactEmail: data.email,
            contactPhone: data.phone,
            address: data.address,
          });
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: trpc.organization.my.queryKey(),
          });
        },
      });
    }
    ```
  - [ ] Update `useUploadOrganizationLogo` to show Coming Soon toast:
    ```typescript
    export function useUploadOrganizationLogo() {
      return useMutation({
        mutationFn: async (_file: File) => {
          throw new Error("Coming Soon");
        },
      });
    }
    ```
  - [ ] Keep `useCheckSlug` as-is (or wire to real endpoint if exists)
  - [ ] Keep `useRequestRemoval` as-is (mock for now)

### Page Updates

- [ ] Update `src/app/(owner)/owner/settings/page.tsx`:
  - [ ] Remove `mockOrg` constant (line 162)
  - [ ] Import `useOwnerOrganization` hook
  - [ ] Use real organization for sidebar/navbar
  - [ ] Update logo upload handler to show "Coming Soon" toast:
    ```typescript
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      toast.info("Logo upload coming soon!");
    };
    ```
  - [ ] Ensure form submits to real update endpoint

### Testing

- [ ] Form pre-fills with real organization data
- [ ] Saving changes updates real database
- [ ] Logo upload shows "Coming Soon" toast
- [ ] Sidebar shows real organization name

---

## Phase 6: Verify Empty States and Test

**Goal:** Ensure all empty states work correctly and full flow is tested.

### Empty States

- [ ] `/owner/courts` with 0 courts shows `CourtsEmptyState`
- [ ] "Add Your First Court" CTA links to `/owner/courts/new`
- [ ] "Claim an Existing Court" CTA links to `/courts`
- [ ] `/owner/reservations` with 0 reservations shows "No reservations found"
- [ ] Dashboard with 0 courts shows 0 in stats (not error)

### Integration Testing

- [ ] Full flow: Login -> /owner -> see real org name
- [ ] Full flow: /owner/courts -> empty state -> create court -> see court in list
- [ ] Full flow: /owner/settings -> edit name -> save -> see updated name
- [ ] Sidebar organization name updates after settings save

### Build Verification

- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] No console errors in browser

---

## Files Modified Summary

| File | Status |
|------|--------|
| `src/features/owner/hooks/use-owner-organization.ts` | Created |
| `src/features/owner/hooks/use-owner-courts.ts` | Modified |
| `src/features/owner/hooks/use-owner-dashboard.ts` | Modified |
| `src/features/owner/hooks/use-owner-reservations.ts` | Modified |
| `src/features/owner/hooks/use-organization.ts` | Modified |
| `src/features/owner/hooks/index.ts` | Modified |
| `src/features/owner/components/coming-soon-card.tsx` | Created |
| `src/features/owner/components/index.ts` | Modified |
| `src/app/(owner)/owner/page.tsx` | Modified |
| `src/app/(owner)/owner/courts/page.tsx` | Modified |
| `src/app/(owner)/owner/reservations/page.tsx` | Modified |
| `src/app/(owner)/owner/settings/page.tsx` | Modified |

---

## Notes

- Slots page (`/owner/courts/[id]/slots`) is deferred - keeps mock data
- Revenue stats require payment tracking - shown as "Coming Soon"
- Today's Bookings requires time slot queries - shown as "Coming Soon"
- Recent Activity requires event stream - shown as "Coming Soon"
- Logo upload requires Supabase Storage setup - shows toast
