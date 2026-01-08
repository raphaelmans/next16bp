# Phase 3-5: Page Updates

## Overview

This phase updates all owner pages to use real organization data and adds Coming Soon placeholders for unavailable features.

---

## Phase 3: Wire Dashboard Page

**Goal:** `/owner` shows real stats and Coming Soon placeholders.

### 3A: Create Coming Soon Component

**New File:** `src/features/owner/components/coming-soon-card.tsx`

```typescript
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ComingSoonCardProps {
  title: string;
  description?: string;
  className?: string;
}

export function ComingSoonCard({ title, description, className }: ComingSoonCardProps) {
  return (
    <Card className={cn("border-dashed", className)}>
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

**Update:** `src/features/owner/components/index.ts` - add export

### 3B: Update Dashboard Hook

**Update:** `src/features/owner/hooks/use-owner-dashboard.ts`

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

/**
 * Fetch real owner stats from backend.
 * Simplified to only show available data.
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
 * Recent activity - returns empty for now (Coming Soon)
 */
export function useRecentActivity() {
  return {
    data: [],
    isLoading: false,
  };
}

/**
 * Today's bookings - returns empty for now (Coming Soon)
 */
export function useTodaysBookings() {
  return {
    data: [],
    isLoading: false,
  };
}

// Keep for backward compatibility but mark as deprecated
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

### 3C: Update Dashboard Page

**Update:** `src/app/(owner)/owner/page.tsx`

Key changes:
1. Remove `mockOrg` constant
2. Import and use `useOwnerOrganization` hook
3. Pass `organizationId` to `useOwnerStats`
4. Update stats to show only 2 cards (Active Courts, Pending Reservations)
5. Replace Revenue/Today's Bookings cards with Coming Soon placeholders
6. Replace Recent Activity and Today's Bookings sections with Coming Soon cards

```typescript
// Add imports
import { useOwnerOrganization } from "@/features/owner/hooks";
import { ComingSoonCard } from "@/features/owner/components";

// In component:
const { organization, organizations, isLoading: orgLoading } = useOwnerOrganization();
const { data: stats, isLoading: statsLoading } = useOwnerStats(organization?.id ?? null);

// Replace mockOrg with organization in sidebar/navbar
// Update stats grid to only show 2 real stats + 2 Coming Soon
// Replace activity sections with Coming Soon cards
```

---

## Phase 4: Wire Reservations Page

**Goal:** `/owner/reservations` shows real reservations.

### 4A: Update Reservations Hook

**Update:** `src/features/owner/hooks/use-owner-reservations.ts`

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

export function useOwnerReservations(
  organizationId: string | null,
  options: UseOwnerReservationsOptions = {}
) {
  const trpc = useTRPC();
  const { status, dateFrom, dateTo } = options;

  return useQuery({
    ...trpc.reservationOwner.getForOrganization.queryOptions({
      organizationId: organizationId!,
      status: status !== "all" ? mapStatusToBackend(status) : undefined,
      fromDate: dateFrom?.toISOString(),
      toDate: dateTo?.toISOString(),
    }),
    enabled: !!organizationId,
    select: (data) => mapReservationsFromBackend(data),
  });
}

export function useConfirmReservation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.reservationOwner.confirmPayment.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reservationOwner"],
      });
    },
  });
}

export function useRejectReservation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.reservationOwner.reject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reservationOwner"],
      });
    },
  });
}

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
      // Other counts would need additional queries or backend support
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      total: pendingCount ?? 0,
    },
  };
}

// Helper to map frontend status to backend enum
function mapStatusToBackend(status?: ReservationStatus) {
  if (!status) return undefined;
  const map: Record<ReservationStatus, string> = {
    pending: "PAYMENT_MARKED_BY_USER",
    confirmed: "CONFIRMED",
    cancelled: "CANCELLED",
    completed: "CONFIRMED", // No separate completed status
  };
  return map[status];
}

// Helper to map backend reservations to frontend format
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

### 4B: Update Reservations Page

**Update:** `src/app/(owner)/owner/reservations/page.tsx`

Key changes:
1. Remove `mockOrg` and `mockCourts`
2. Import `useOwnerOrganization` and `useOwnerCourts`
3. Use real organization for sidebar/navbar
4. Use real courts for filter dropdown
5. Pass `organizationId` to reservation hooks

---

## Phase 5: Wire Settings Page

**Goal:** `/owner/settings` shows and saves real organization data.

### 5A: Update Organization Hook

**Update:** `src/features/owner/hooks/use-organization.ts`

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
      // Coming Soon - requires Supabase Storage setup
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
  // Keep as mock for now
  return useMutation({
    mutationFn: async (data: RemovalRequestData) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, requestId: `removal-${Date.now()}` };
    },
  });
}

export function useCheckSlug() {
  // Keep as mock for now - could wire to real endpoint
  return useMutation({
    mutationFn: async (slug: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const takenSlugs = ["test", "admin", "owner", "courts"];
      return { available: !takenSlugs.includes(slug.toLowerCase()) };
    },
  });
}
```

### 5B: Update Settings Page

**Update:** `src/app/(owner)/owner/settings/page.tsx`

Key changes:
1. Remove `mockOrg` constant
2. Import `useOwnerOrganization`
3. Use real organization for sidebar/navbar
4. Update logo upload handler to show Coming Soon toast:
   ```typescript
   const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     e.preventDefault();
     toast.info("Logo upload coming soon!");
   };
   ```
5. Pass `organizationId` to update mutation

---

## Phase 6: Update Courts Page

**Goal:** `/owner/courts` uses real organization context.

**Update:** `src/app/(owner)/owner/courts/page.tsx`

Key changes:
1. Remove `mockOrg` constant
2. Import `useOwnerOrganization`
3. Use real organization for sidebar/navbar
4. Update deactivate handler to pass `{ courtId }` object

```typescript
// Add import
import { useOwnerOrganization } from "@/features/owner/hooks";

// In component:
const { organization, organizations, isLoading: orgLoading } = useOwnerOrganization();

// Update deactivate handler
const handleDeactivate = (courtId: string) => {
  deactivateMutation.mutate(
    { courtId },  // Note: object format for tRPC
    {
      onSuccess: () => toast.success("Court deactivated successfully"),
      onError: () => toast.error("Failed to deactivate court"),
    }
  );
};

// Use real org in sidebar/navbar
<OwnerSidebar
  currentOrganization={organization ?? { id: "", name: "Loading..." }}
  organizations={organizations}
  user={{ name: user?.email?.split("@")[0], email: user?.email }}
/>
```
