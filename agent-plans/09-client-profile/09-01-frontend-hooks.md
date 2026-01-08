# Phase 1: Wire Frontend Hooks

**Module ID:** 1A  
**Estimated Time:** 30 minutes  
**Dependencies:** None

---

## Objective

Connect the profile hooks (`useProfile` and `useUpdateProfile`) to the actual tRPC backend endpoints.

---

## Current State

**File:** `src/features/reservation/hooks/use-profile.ts`

```typescript
// BROKEN: Returns null instead of calling backend
export function useProfile() {
  return useQuery({
    queryKey: ["profile", "current"],
    queryFn: async () => {
      return null as Profile | null;  // ❌ Always null
    },
  });
}

// BROKEN: Throws error instead of calling backend
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      throw new Error("Not implemented");  // ❌ Always fails
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
```

---

## Target State

### Step 1: Add Imports

Add tRPC client import:

```typescript
import { useTRPC } from "@/trpc/client";
```

### Step 2: Fix `useProfile` Hook

Replace the mock implementation with real tRPC call:

```typescript
export function useProfile() {
  const trpc = useTRPC();
  
  return useQuery(trpc.profile.me.queryOptions());
}
```

**What this does:**
- Calls `profile.me` tRPC endpoint
- Auto-creates profile if missing
- Returns profile data or null during loading
- Uses tRPC's built-in caching and refetching

### Step 3: Fix `useUpdateProfile` Hook

Replace the mock implementation with real tRPC mutation:

```typescript
export function useUpdateProfile() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  return useMutation(
    trpc.profile.update.mutationOptions({
      onSuccess: () => {
        toast.success("Profile updated successfully");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update profile");
      },
    })
  );
}
```

**What this does:**
- Calls `profile.update` tRPC endpoint
- Shows success toast on completion
- Invalidates profile cache to refetch
- Shows error toast if update fails

---

## Complete File

**File:** `src/features/reservation/hooks/use-profile.ts`

```typescript
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import type { ProfileFormValues } from "../schemas/profile.schema";

export interface Profile {
  id: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

/**
 * Hook to fetch current user's profile
 */
export function useProfile() {
  const trpc = useTRPC();
  
  return useQuery(trpc.profile.me.queryOptions());
}

/**
 * Hook to update current user's profile
 */
export function useUpdateProfile() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  return useMutation(
    trpc.profile.update.mutationOptions({
      onSuccess: () => {
        toast.success("Profile updated successfully");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update profile");
      },
    })
  );
}
```

---

## Backend Endpoints Used

### `profile.me`

**Location:** `src/modules/profile/profile.router.ts`

**Behavior:**
- Returns existing profile for current user
- If no profile exists, creates one with null fields
- Protected endpoint (requires authentication)

### `profile.update`

**Location:** `src/modules/profile/profile.router.ts`

**Input:**
```typescript
{
  displayName?: string,    // min 1, max 100
  email?: string,          // valid email
  phoneNumber?: string,    // max 20
  avatarUrl?: string       // valid URL
}
```

**Behavior:**
- Updates specified fields only (partial update)
- Returns updated profile
- Protected endpoint (requires authentication)

---

## Type Alignment

The `Profile` interface in the hook should match the backend `ProfileRecord`:

```typescript
// Frontend (simplified for UI)
export interface Profile {
  id: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

// Backend ProfileRecord has additional fields:
// - userId
// - createdAt
// - updatedAt
```

tRPC will return the full `ProfileRecord`, but the UI only uses the fields above.

---

## Testing

### Manual Testing

1. **Test Profile Loading:**
   ```
   1. Navigate to /account/profile
   2. Verify profile data loads (or empty form for new users)
   3. Check skeleton shows during loading
   ```

2. **Test Profile Update:**
   ```
   1. Edit display name
   2. Click "Save Changes"
   3. Verify success toast appears
   4. Refresh page - verify changes persisted
   ```

3. **Test Error Handling:**
   ```
   1. Disconnect network
   2. Try to save changes
   3. Verify error toast appears
   ```

### Integration Testing

Profile hook is used by:
- `ProfileForm` component
- Booking page (for completeness check)
- Home page (for display)

After fixing, verify all these components work correctly.

---

## Checklist

- [ ] Add `useTRPC` import
- [ ] Replace `useProfile` implementation
- [ ] Replace `useUpdateProfile` implementation
- [ ] Remove TODO comments
- [ ] Test profile loading
- [ ] Test profile updating
- [ ] Verify cache invalidation works
- [ ] Verify error handling works
