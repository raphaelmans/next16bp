# UI Dev 1 Checklist - Hooks Implementation

**Story:** US-04-01 - Owner Views Real Dashboard Data  
**Focus:** Hook implementations (tRPC wiring)  
**Estimated Time:** 2 hours  
**Blocks:** UI Dev 2 (Pages) after Phase 2

---

## Overview

Create and update hooks to replace mock data with real tRPC queries. UI Dev 2 depends on these hooks being complete before they can wire the pages.

---

## Timeline & Coordination

| Time | Task | Blocks UI Dev 2? |
|------|------|------------------|
| Hour 1 | Phase 1: Organization hook | Yes |
| Hour 1 | Phase 2: Courts hook | Yes |
| Hour 2 | Phase 3: Dashboard hook | No (can parallel) |
| Hour 2 | Phase 4: Reservations hook | No (can parallel) |
| Hour 2 | Phase 5: Organization settings hook | No (can parallel) |

### Sync Point

**After completing Phase 1 & 2**, notify UI Dev 2:
```
✅ Hooks ready for pages:
- useOwnerOrganization() - shared org context
- useOwnerCourts() - real courts from getMyCourts
- useDeactivateCourt() - real deactivate mutation

UI Dev 2 can now start wiring pages.
```

---

## Phase 1: Create Shared Organization Hook (30 min)

**Goal:** Single hook for fetching owner's organization.

### Implementation

- [ ] Create `src/features/owner/hooks/use-owner-organization.ts`:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

/**
 * Shared hook for fetching the current user's organization.
 * Used across all owner dashboard pages for consistent organization context.
 */
export function useOwnerOrganization() {
  const trpc = useTRPC();

  const {
    data: organizations,
    isLoading,
    error,
    refetch,
  } = useQuery(trpc.organization.my.queryOptions());

  const organization = organizations?.[0] ?? null;

  return {
    organization,
    organizationId: organization?.id ?? null,
    organizations: organizations ?? [],
    isLoading,
    isOwner: !!organization,
    error,
    refetch,
  };
}
```

- [ ] Update `src/features/owner/hooks/index.ts` - add at top:

```typescript
export { useOwnerOrganization } from "./use-owner-organization";
```

### Testing

- [ ] TypeScript compiles without errors
- [ ] Can import `useOwnerOrganization` from `@/features/owner/hooks`

---

## Phase 2: Wire Courts Hook (30 min)

**Goal:** Replace mock courts with real `courtManagement.getMyCourts`.

### Implementation

- [ ] Update `src/features/owner/hooks/use-owner-courts.ts`:

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export interface OwnerCourt {
  id: string;
  name: string;
  address: string;
  city: string;
  coverImageUrl?: string;
  status: "active" | "draft" | "inactive";
  openSlots: number;
  totalSlots: number;
  createdAt: Date | string;
  isActive: boolean;
}

/**
 * Fetch all courts owned by the current user.
 */
export function useOwnerCourts() {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.courtManagement.getMyCourts.queryOptions(),
    select: (courts) =>
      courts.map((court): OwnerCourt => ({
        id: court.id,
        name: court.name,
        address: court.address,
        city: court.city,
        coverImageUrl: undefined, // TODO: Load from photos
        status: court.isActive ? "active" : "inactive",
        openSlots: 0, // TODO: Calculate from time slots
        totalSlots: 0,
        createdAt: court.createdAt,
        isActive: court.isActive,
      })),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch a single court by ID.
 * Note: getById returns { court, photos, amenities, ... }
 */
export function useOwnerCourt(courtId: string) {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.courtManagement.getById.queryOptions({ courtId }),
    enabled: !!courtId,
    select: (data): OwnerCourt | null =>
      data
        ? {
            id: data.court.id,
            name: data.court.name,
            address: data.court.address,
            city: data.court.city,
            coverImageUrl: data.photos?.[0]?.url,
            status: data.court.isActive ? "active" : "inactive",
            openSlots: 0,
            totalSlots: 0,
            createdAt: data.court.createdAt,
            isActive: data.court.isActive,
          }
        : null,
  });
}

/**
 * Deactivate a court.
 */
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

### Testing

- [ ] TypeScript compiles without errors
- [ ] `useOwnerCourts()` returns empty array when no courts
- [ ] `useDeactivateCourt()` accepts `{ courtId: string }`

---

## Phase 3: Wire Dashboard Hook (30 min)

**Goal:** Replace mock stats with real queries.

### Implementation

- [ ] Update `src/features/owner/hooks/use-owner-dashboard.ts`:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

/**
 * Fetch real owner stats.
 * Only shows available data - courts count and pending reservations.
 */
export function useOwnerStats(organizationId: string | null) {
  const trpc = useTRPC();

  const { data: courts, isLoading: courtsLoading } = useQuery({
    ...trpc.courtManagement.getMyCourts.queryOptions(),
    enabled: !!organizationId,
  });

  const { data: pendingCount, isLoading: pendingLoading } = useQuery({
    ...trpc.reservationOwner.getPendingCount.queryOptions({
      organizationId: organizationId!,
    }),
    enabled: !!organizationId,
  });

  return {
    data: {
      activeCourts: courts?.filter((c) => c.isActive).length ?? 0,
      pendingReservations: pendingCount ?? 0,
    },
    isLoading: courtsLoading || pendingLoading,
  };
}

/**
 * Recent activity - Coming Soon placeholder
 */
export function useRecentActivity() {
  return { data: [], isLoading: false };
}

/**
 * Today's bookings - Coming Soon placeholder
 */
export function useTodaysBookings() {
  return { data: [], isLoading: false };
}

/** @deprecated Use useOwnerStats instead */
export function useOwnerDashboard() {
  return useQuery({
    queryKey: ["owner", "dashboard", "deprecated"],
    queryFn: async () => ({
      stats: { activeCourts: 0, pendingBookings: 0, todaysBookings: 0, monthlyRevenue: 0 },
      recentActivity: [],
      todaysBookings: [],
    }),
  });
}
```

### Testing

- [ ] TypeScript compiles without errors
- [ ] `useOwnerStats(null)` doesn't make queries
- [ ] `useOwnerStats(orgId)` returns `{ activeCourts, pendingReservations }`

---

## Phase 4: Wire Reservations Hook (30 min)

**Goal:** Replace mock reservations with real queries.

### Implementation

- [ ] Update `src/features/owner/hooks/use-owner-reservations.ts`:

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Reservation {
  id: string;
  courtId: string;
  courtName: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  amountCents: number;
  currency: string;
  status: ReservationStatus;
  paymentReference?: string;
  paymentProofUrl?: string;
  notes?: string;
  createdAt: string;
}

interface UseOwnerReservationsOptions {
  status?: ReservationStatus | "all";
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Fetch reservations for an organization.
 */
export function useOwnerReservations(
  organizationId: string | null,
  options: UseOwnerReservationsOptions = {}
) {
  const trpc = useTRPC();
  const { status, dateFrom, dateTo } = options;

  return useQuery({
    ...trpc.reservationOwner.getForOrganization.queryOptions({
      organizationId: organizationId!,
      status: status && status !== "all" ? mapStatusToBackend(status) : undefined,
      fromDate: dateFrom?.toISOString(),
      toDate: dateTo?.toISOString(),
    }),
    enabled: !!organizationId,
    select: (data) => mapReservationsFromBackend(data ?? []),
  });
}

/**
 * Confirm a reservation payment.
 */
export function useConfirmReservation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.reservationOwner.confirmPayment.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservationOwner"] });
    },
  });
}

/**
 * Reject a reservation.
 */
export function useRejectReservation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.reservationOwner.reject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservationOwner"] });
    },
  });
}

/**
 * Get reservation counts by status.
 */
export function useReservationCounts(organizationId: string | null) {
  const trpc = useTRPC();

  const { data: pendingCount } = useQuery({
    ...trpc.reservationOwner.getPendingCount.queryOptions({
      organizationId: organizationId!,
    }),
    enabled: !!organizationId,
  });

  return {
    data: {
      pending: pendingCount ?? 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      total: pendingCount ?? 0,
    },
  };
}

// --- Helper functions ---

function mapStatusToBackend(status: ReservationStatus): string | undefined {
  const map: Record<ReservationStatus, string> = {
    pending: "PAYMENT_MARKED_BY_USER",
    confirmed: "CONFIRMED",
    cancelled: "CANCELLED",
    completed: "CONFIRMED",
  };
  return map[status];
}

function mapReservationsFromBackend(data: any[]): Reservation[] {
  return data.map((r) => ({
    id: r.id,
    courtId: r.timeSlot?.court?.id ?? "",
    courtName: r.timeSlot?.court?.name ?? "Unknown Court",
    playerName: r.playerNameSnapshot ?? "Unknown",
    playerEmail: r.playerEmailSnapshot ?? "",
    playerPhone: r.playerPhoneSnapshot ?? "",
    date: r.timeSlot?.startTime?.split("T")[0] ?? "",
    startTime: formatTime(r.timeSlot?.startTime),
    endTime: formatTime(r.timeSlot?.endTime),
    amountCents: r.timeSlot?.priceCents ?? 0,
    currency: r.timeSlot?.currency ?? "PHP",
    status: mapStatusFromBackend(r.status),
    paymentReference: r.paymentProof?.referenceNumber,
    paymentProofUrl: r.paymentProof?.fileUrl,
    createdAt: r.createdAt,
  }));
}

function mapStatusFromBackend(status: string): ReservationStatus {
  const map: Record<string, ReservationStatus> = {
    PAYMENT_MARKED_BY_USER: "pending",
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
    EXPIRED: "cancelled",
  };
  return map[status] ?? "pending";
}

function formatTime(isoString?: string): string {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
```

### Testing

- [ ] TypeScript compiles without errors
- [ ] Hooks accept `organizationId` parameter
- [ ] Mutations invalidate correct query keys

---

## Phase 5: Wire Organization Settings Hook (30 min)

**Goal:** Replace mock organization data with real queries.

### Implementation

- [ ] Update `src/features/owner/hooks/use-organization.ts`:

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface UpdateOrganizationData {
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export function useOrganization(orgId?: string) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.organization.get.queryOptions({ id: orgId! }),
    enabled: !!orgId,
  });
}

export function useCurrentOrganization() {
  const trpc = useTRPC();
  const { data: organizations, ...rest } = useQuery(
    trpc.organization.my.queryOptions()
  );

  const org = organizations?.[0];

  return {
    data: org
      ? {
          id: org.id,
          name: org.name,
          slug: org.slug,
          description: org.profile?.description ?? "",
          logoUrl: org.profile?.logoUrl ?? undefined,
          email: org.profile?.contactEmail ?? "",
          phone: org.profile?.contactPhone ?? "",
          address: org.profile?.address ?? "",
          createdAt: org.createdAt,
        }
      : null,
    ...rest,
  };
}

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
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.organization.my.queryKey(),
      });
    },
  });
}

export function useUploadOrganizationLogo() {
  return useMutation({
    mutationFn: async (_file: File) => {
      throw new Error("Coming Soon");
    },
  });
}

export interface RemovalRequestData {
  reason: string;
  acknowledgeReservations: boolean;
  acknowledgeApproval: boolean;
}

export function useRequestRemoval() {
  return useMutation({
    mutationFn: async (data: RemovalRequestData) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, requestId: `removal-${Date.now()}` };
    },
  });
}

export function useCheckSlug() {
  return useMutation({
    mutationFn: async (slug: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const takenSlugs = ["test", "admin", "owner", "courts"];
      return { available: !takenSlugs.includes(slug.toLowerCase()) };
    },
  });
}
```

### Testing

- [ ] TypeScript compiles without errors
- [ ] `useCurrentOrganization()` maps profile fields correctly
- [ ] `useUpdateOrganization()` calls both update endpoints

---

## Completion Notification

When all phases complete, notify UI Dev 2:

```
✅ All hooks complete and ready:

Phase 1: useOwnerOrganization - shared org context
Phase 2: useOwnerCourts, useOwnerCourt, useDeactivateCourt - real courts
Phase 3: useOwnerStats - real dashboard stats
Phase 4: useOwnerReservations, useConfirmReservation, useRejectReservation - real reservations
Phase 5: useCurrentOrganization, useUpdateOrganization - real org settings

All hooks accept organizationId parameter where needed.
TypeScript compiles without errors.

UI Dev 2 can complete page wiring.
```

---

## Build Verification

- [ ] `npm run build` passes
- [ ] No TypeScript errors in hooks files
