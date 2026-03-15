# Phase 1-2: Hook Implementations

## Overview

This phase creates the shared organization hook and updates the courts hook to use real tRPC queries.

---

## Phase 1: Create Shared Organization Hook

**Goal:** Single hook for fetching owner's organization, reusable across all pages.

### New File: `src/features/owner/hooks/use-owner-organization.ts`

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

/**
 * Shared hook for fetching the current user's organization.
 * Used across all owner dashboard pages for consistent organization context.
 *
 * Returns the first organization (owners currently can only have one).
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
    /** The owner's primary organization (or null if none) */
    organization,
    /** Organization ID for use in other queries */
    organizationId: organization?.id ?? null,
    /** All organizations (for future multi-org support) */
    organizations: organizations ?? [],
    /** Whether the query is loading */
    isLoading,
    /** Whether the user is an owner (has at least one organization) */
    isOwner: !!organization,
    /** Query error if any */
    error,
    /** Refetch the organization data */
    refetch,
  };
}
```

### Update: `src/features/owner/hooks/index.ts`

Add export at top of file:

```typescript
export { useOwnerOrganization } from "./use-owner-organization";
```

---

## Phase 2: Wire Courts Hook

**Goal:** Replace mock courts data with real `courtManagement.getMyCourts` query.

### Update: `src/features/owner/hooks/use-owner-courts.ts`

**Important Notes:**
- `getMyCourts` returns `CourtRecord[]` (flat array)
- `getById` returns `CourtWithDetails` (has nested `court` property)
- Need to map backend schema to `OwnerCourt` interface for UI

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

/**
 * Extended court type for owner dashboard display.
 * Maps from backend CourtRecord to UI-friendly format.
 */
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
 * Uses the courtManagement.getMyCourts endpoint.
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
        coverImageUrl: undefined, // TODO: Add when photos are loaded
        status: court.isActive ? "active" : "inactive",
        openSlots: 0, // TODO: Calculate from time slots
        totalSlots: 0, // TODO: Calculate from time slots
        createdAt: court.createdAt,
        isActive: court.isActive,
      })),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single court by ID.
 * Uses the courtManagement.getById endpoint.
 * Note: getById returns CourtWithDetails with nested 'court' property
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
 * Uses the courtManagement.deactivate endpoint.
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

---

## Testing Checklist

### Phase 1 Tests
- [ ] `useOwnerOrganization` returns organization when user is owner
- [ ] `useOwnerOrganization` returns null when user has no orgs
- [ ] `isLoading` state works correctly
- [ ] Hook can be imported from `@/features/owner/hooks`

### Phase 2 Tests
- [ ] `useOwnerCourts` returns empty array when no courts
- [ ] `useOwnerCourts` returns mapped courts when courts exist
- [ ] `useOwnerCourt` returns single court details
- [ ] `useDeactivateCourt` calls real endpoint and invalidates cache
- [ ] TypeScript compiles without errors

---

## Backend Schema Reference

### CourtRecord (from `getMyCourts`)

```typescript
{
  id: string;
  organizationId: string | null;
  name: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  courtType: "CURATED" | "RESERVABLE";
  claimStatus: "UNCLAIMED" | "CLAIM_PENDING" | "CLAIMED" | "REMOVAL_REQUESTED";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### CourtWithDetails (from `getById`)

```typescript
{
  court: CourtRecord;
  detail: CuratedCourtDetailRecord | ReservableCourtDetailRecord | null;
  photos: CourtPhotoRecord[];
  amenities: CourtAmenityRecord[];
  organization?: OrganizationRecord;
}
```
