# UI Dev 2 Checklist - Pages Implementation

**Story:** US-04-01 - Owner Views Real Dashboard Data  
**Focus:** Page updates (wire to new hooks)  
**Estimated Time:** 3 hours  
**Depends On:** UI Dev 1 (Phases 1-2 complete)

---

## Overview

Update all owner pages to use the new hooks created by UI Dev 1. Replace mock data with real organization context.

---

## Timeline & Coordination

| Time | Task | Dependency |
|------|------|------------|
| - | **Wait for UI Dev 1 Phases 1-2** | `useOwnerOrganization`, `useOwnerCourts` |
| Hour 1 | Phase 1: Coming Soon component | None |
| Hour 1 | Phase 2: Courts page | useOwnerOrganization, useOwnerCourts |
| Hour 2 | Phase 3: Dashboard page | useOwnerOrganization, useOwnerStats |
| Hour 2 | Phase 4: Reservations page | useOwnerOrganization, useOwnerReservations |
| Hour 3 | Phase 5: Settings page | useOwnerOrganization, useCurrentOrganization |
| Hour 3 | Phase 6: Testing | All hooks |

### What to Wait For

Before starting Phase 2, confirm UI Dev 1 has completed:
- [ ] `useOwnerOrganization` hook exists and exports from index
- [ ] `useOwnerCourts` returns real data (or empty array)
- [ ] `useDeactivateCourt` accepts `{ courtId }` object

---

## Phase 1: Create Coming Soon Component (15 min)

**Goal:** Reusable placeholder for unavailable features.

### Implementation

- [ ] Create `src/features/owner/components/coming-soon-card.tsx`:

```typescript
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

- [ ] Update `src/features/owner/components/index.ts` - add export:

```typescript
export { ComingSoonCard } from "./coming-soon-card";
```

### Testing

- [ ] Component renders without errors
- [ ] Can import from `@/features/owner/components`

---

## Phase 2: Wire Courts Page (30 min)

**Goal:** `/owner/courts` uses real organization and courts.

### Implementation

- [ ] Update `src/app/(owner)/owner/courts/page.tsx`:

**Remove:**
```typescript
// Remove this line (around line 41)
const mockOrg = { id: "1", name: "My Sports Complex" };
```

**Add imports:**
```typescript
import { useOwnerOrganization } from "@/features/owner/hooks";
import { Loader2 } from "lucide-react";
```

**Add hook call at top of component:**
```typescript
const { organization, organizations, isLoading: orgLoading } = useOwnerOrganization();
```

**Add loading state:**
```typescript
if (orgLoading) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
```

**Update sidebar/navbar:**
```typescript
<OwnerSidebar
  currentOrganization={organization ?? { id: "", name: "Loading..." }}
  organizations={organizations}
  user={{
    name: user?.email?.split("@")[0],
    email: user?.email,
  }}
/>
```

```typescript
<OwnerNavbar
  organizationName={organization?.name ?? "Loading..."}
  user={{
    name: user?.email?.split("@")[0],
    email: user?.email,
  }}
  onLogout={handleLogout}
/>
```

**Update deactivate handler:**
```typescript
const handleDeactivate = (courtId: string) => {
  deactivateMutation.mutate(
    { courtId },  // Note: object format for tRPC
    {
      onSuccess: () => {
        toast.success("Court deactivated successfully");
      },
      onError: () => {
        toast.error("Failed to deactivate court");
      },
    }
  );
};
```

### Testing

- [ ] Page loads without errors
- [ ] Sidebar shows real organization name
- [ ] Empty state shows when no courts
- [ ] Courts list shows when courts exist

---

## Phase 3: Wire Dashboard Page (45 min)

**Goal:** `/owner` shows real stats and Coming Soon placeholders.

### Implementation

- [ ] Update `src/app/(owner)/owner/page.tsx`:

**Remove:**
```typescript
// Remove these lines (around lines 37-40)
const mockOrg = {
  id: "1",
  name: "My Sports Complex",
};
```

**Add imports:**
```typescript
import { useOwnerOrganization } from "@/features/owner/hooks";
import { ComingSoonCard } from "@/features/owner/components";
import { Loader2 } from "lucide-react";
```

**Update hook calls:**
```typescript
const { organization, organizations, isLoading: orgLoading } = useOwnerOrganization();
const { data: stats, isLoading: statsLoading } = useOwnerStats(organization?.id ?? null);
```

**Add loading state before return:**
```typescript
if (orgLoading) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
```

**Update sidebar/navbar** (same as courts page)

**Update stats grid (replace the 4-card grid):**
```typescript
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {statsLoading ? (
    <>
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </>
  ) : (
    <>
      <StatsCard
        title="Active Courts"
        value={stats?.activeCourts ?? 0}
        icon={MapPin}
        href="/owner/courts"
      />
      <StatsCard
        title="Pending Bookings"
        value={stats?.pendingReservations ?? 0}
        icon={CalendarDays}
        href="/owner/reservations?status=pending"
      />
      <ComingSoonCard title="Today's Bookings" />
      <ComingSoonCard title="Monthly Revenue" />
    </>
  )}
</div>
```

**Replace activity sections:**
```typescript
{/* Activity and bookings grid */}
<div className="grid gap-6 lg:grid-cols-2">
  <ComingSoonCard 
    title="Recent Activity" 
    description="Track bookings, payments, and updates"
    className="h-80"
  />
  <ComingSoonCard 
    title="Today's Schedule" 
    description="View today's court bookings"
    className="h-80"
  />
</div>
```

### Testing

- [ ] Dashboard loads without errors
- [ ] Stats show real counts (Active Courts, Pending)
- [ ] Coming Soon cards display for unavailable features
- [ ] Sidebar shows real organization name

---

## Phase 4: Wire Reservations Page (45 min)

**Goal:** `/owner/reservations` shows real reservations.

### Implementation

- [ ] Update `src/app/(owner)/owner/reservations/page.tsx`:

**Remove:**
```typescript
// Remove these lines (around lines 164-170)
const mockOrg = { id: "1", name: "My Sports Complex" };
const mockCourts = [
  { id: "court-1", name: "Court A" },
  { id: "court-2", name: "Court B" },
  { id: "court-3", name: "Court C" },
];
```

**Add imports:**
```typescript
import { useOwnerOrganization, useOwnerCourts } from "@/features/owner/hooks";
import { Loader2 } from "lucide-react";
```

**Add hook calls:**
```typescript
const { organization, organizations, isLoading: orgLoading } = useOwnerOrganization();
const { data: courts = [] } = useOwnerCourts();
```

**Update reservations hook call:**
```typescript
const { data: reservations = [], isLoading } = useOwnerReservations(
  organization?.id ?? null,
  {
    status: getStatusFilter(activeTab),
    dateFrom,
    dateTo,
  }
);

const { data: counts } = useReservationCounts(organization?.id ?? null);
```

**Add loading state before return:**
```typescript
if (orgLoading) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
```

**Update sidebar/navbar** (same pattern)

**Update court filter dropdown:**
```typescript
<Select value={courtId} onValueChange={setCourtId}>
  <SelectTrigger className="w-full sm:w-[180px]">
    <SelectValue placeholder="All Courts" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Courts</SelectItem>
    {courts.map((court) => (
      <SelectItem key={court.id} value={court.id}>
        {court.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Update confirm handler:**
```typescript
const handleConfirm = () => {
  if (!selectedReservation) return;
  confirmMutation.mutate(
    { reservationId: selectedReservation.id },
    {
      onSuccess: () => {
        toast.success("Booking confirmed successfully");
        setConfirmDialogOpen(false);
        setSelectedReservation(null);
      },
      onError: () => {
        toast.error("Failed to confirm booking");
      },
    }
  );
};
```

**Update reject handler:**
```typescript
const handleReject = (reason: string) => {
  if (!selectedReservation) return;
  rejectMutation.mutate(
    { reservationId: selectedReservation.id, reason },
    {
      onSuccess: () => {
        toast.success("Booking rejected");
        setRejectModalOpen(false);
        setSelectedReservation(null);
      },
      onError: () => {
        toast.error("Failed to reject booking");
      },
    }
  );
};
```

### Testing

- [ ] Page loads without errors
- [ ] Court filter shows real courts
- [ ] Shows "No reservations found" when empty
- [ ] Confirm/reject call real endpoints

---

## Phase 5: Wire Settings Page (45 min)

**Goal:** `/owner/settings` shows and saves real organization data.

### Implementation

- [ ] Update `src/app/(owner)/owner/settings/page.tsx`:

**Remove:**
```typescript
// Remove this line (around line 162)
const mockOrg = { id: "1", name: "My Sports Complex" };
```

**Add imports:**
```typescript
import { useOwnerOrganization } from "@/features/owner/hooks";
import { Loader2 } from "lucide-react";
```

**Add hook call:**
```typescript
const { organization, organizations, isLoading: orgLoading } = useOwnerOrganization();
```

**Update sidebar/navbar in both places** (loading state and main return)

**Update logo upload handler:**
```typescript
const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  e.preventDefault();
  toast.info("Logo upload coming soon!");
};
```

**Update form submit to include organizationId:**
```typescript
const handleSubmit = form.handleSubmit((data) => {
  if (!organization) return;
  
  updateOrg.mutate(
    {
      organizationId: organization.id,
      ...data,
    },
    {
      onSuccess: () => {
        toast.success("Settings saved successfully");
      },
      onError: () => {
        toast.error("Failed to save settings");
      },
    }
  );
});
```

### Testing

- [ ] Form pre-fills with real organization data
- [ ] Save updates real database
- [ ] Logo upload shows "Coming Soon" toast
- [ ] Sidebar shows real organization name

---

## Phase 6: Final Testing (30 min)

### Build Verification

- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No console errors in browser

### Manual Testing Flow

1. **Login as owner** (user with organization)
   - [ ] Redirected to `/owner` or `/home`

2. **Dashboard (`/owner`)**
   - [ ] Shows real organization name in sidebar
   - [ ] Active Courts shows real count (0 or more)
   - [ ] Pending Reservations shows real count
   - [ ] Coming Soon cards display correctly

3. **Courts (`/owner/courts`)**
   - [ ] Shows empty state if no courts
   - [ ] "Add Your First Court" links to `/owner/courts/new`
   - [ ] If courts exist, shows real court list

4. **Create Court (`/owner/courts/new`)**
   - [ ] Create a new court
   - [ ] Redirects to slots page
   - [ ] Court appears in courts list

5. **Reservations (`/owner/reservations`)**
   - [ ] Shows "No reservations found" if empty
   - [ ] Court filter shows real courts

6. **Settings (`/owner/settings`)**
   - [ ] Form shows real organization name
   - [ ] Edit name and save
   - [ ] Sidebar updates with new name
   - [ ] Logo upload shows toast

---

## Files Modified Summary

| Phase | File | Action |
|-------|------|--------|
| 1 | `src/features/owner/components/coming-soon-card.tsx` | Create |
| 1 | `src/features/owner/components/index.ts` | Modify |
| 2 | `src/app/(owner)/owner/courts/page.tsx` | Modify |
| 3 | `src/app/(owner)/owner/page.tsx` | Modify |
| 4 | `src/app/(owner)/owner/reservations/page.tsx` | Modify |
| 5 | `src/app/(owner)/owner/settings/page.tsx` | Modify |

---

## Completion Checklist

- [ ] All phases complete
- [ ] Build passes
- [ ] Manual testing complete
- [ ] No console errors
- [ ] Ready for code review
