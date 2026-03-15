# Phase 3: UI Integration & Polish

**Module ID:** 3A  
**Estimated Time:** 2 hours  
**Dependencies:** Phase 2 (Frontend Hooks)

---

## Objective

Integrate the wired hooks with the slots page, fetch real court data, and ensure UI follows the design system.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/(owner)/owner/courts/[id]/slots/page.tsx` | Fetch real court, wire components |
| `src/features/owner/components/slot-item.tsx` | Verify status badges, player info display |
| `src/features/owner/components/slot-list.tsx` | Verify empty state, stats |
| `src/features/owner/components/bulk-slot-modal.tsx` | Verify form-to-DTO mapping |

---

## Step 1: Update Slots Page

**File:** `src/app/(owner)/owner/courts/[id]/slots/page.tsx`

### Changes Required

1. **Fetch real court data:**

```typescript
import { useTRPC } from "@/trpc/client";

// In component:
const trpc = useTRPC();

// Fetch court data
const { data: court, isLoading: courtLoading } = useQuery({
  ...trpc.courtManagement.getById.queryOptions({ courtId }),
  enabled: !!courtId,
});

// Fetch organization (for sidebar)
const { data: organization } = useQuery({
  ...trpc.organization.my.queryOptions(),
});

const currentOrg = organization?.[0];
```

2. **Remove mock data:**

```typescript
// REMOVE these lines:
const mockOrg = { id: "1", name: "My Sports Complex" };
const mockCourt = { id: courtId, name: "Court A" };

// REPLACE with real data:
const orgDisplay = currentOrg ? { id: currentOrg.id, name: currentOrg.name } : null;
const courtName = court?.name ?? "Loading...";
```

3. **Update sidebar props:**

```typescript
<OwnerSidebar
  currentOrganization={orgDisplay}
  organizations={organization ? [{ id: organization[0].id, name: organization[0].name }] : []}
  user={{
    name: user?.email?.split("@")[0],
    email: user?.email,
  }}
/>
```

4. **Update page header:**

```typescript
<h1 className="text-2xl font-bold tracking-tight font-heading">
  Manage Time Slots - {courtName}
</h1>
```

5. **Update useCreateBulkSlots call:**

```typescript
// Pass courtId to hook
const createBulkSlots = useCreateBulkSlots(courtId);
```

6. **Calendar indicators from real data:**

```typescript
// TODO: Fetch dates with slots from API
// For now, can derive from current slots data
const datesWithSlots = useMemo(() => {
  // This would need a separate API call to get all dates with slots
  // For MVP, leave as empty or mock
  return [];
}, []);
```

---

## Step 2: Verify Slot Item Component

**File:** `src/features/owner/components/slot-item.tsx`

### Status Badge Colors (per Design System)

```typescript
const statusConfig: Record<SlotStatus, { bg: string; text: string; label: string }> = {
  available: {
    bg: "bg-[#ECFDF5]",
    text: "text-[#059669]",
    label: "Available",
  },
  pending: {
    bg: "bg-[#FFFBEB]",
    text: "text-[#D97706]",
    label: "Pending",
  },
  booked: {
    bg: "bg-[#CCFBF1]",
    text: "text-[#0F766E]",
    label: "Booked",
  },
  blocked: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    label: "Blocked",
  },
};
```

### Player Info Display

For `pending` and `booked` slots, show player info:

```tsx
{(slot.status === "pending" || slot.status === "booked") && slot.playerName && (
  <div className="text-sm text-muted-foreground">
    <span className="font-medium">{slot.playerName}</span>
    {slot.playerPhone && (
      <span className="ml-2">{slot.playerPhone}</span>
    )}
  </div>
)}
```

### Typography (per Design System)

- Time display: `font-heading font-semibold` (Outfit 600)
- Player name: `font-medium` (Source Sans 3 500)
- Player phone: `text-muted-foreground` (Source Sans 3 400)

---

## Step 3: Verify Slot List Component

**File:** `src/features/owner/components/slot-list.tsx`

### Empty State

```tsx
{slots.length === 0 && !isLoading && (
  <div className="text-center py-12">
    <p className="text-muted-foreground mb-4">
      No slots for this date
    </p>
    <Button onClick={onAddSlot}>
      Add Your First Slot
    </Button>
  </div>
)}
```

### Stats Summary

```tsx
const stats = useMemo(() => ({
  total: slots.length,
  available: slots.filter(s => s.status === "available").length,
  booked: slots.filter(s => s.status === "booked").length,
  pending: slots.filter(s => s.status === "pending").length,
  blocked: slots.filter(s => s.status === "blocked").length,
}), [slots]);
```

---

## Step 4: Verify Bulk Slot Modal

**File:** `src/features/owner/components/bulk-slot-modal.tsx`

### Form Fields Mapping

Ensure the form produces `BulkSlotData`:

```typescript
interface BulkSlotData {
  startDate: Date;
  endDate?: Date;
  daysOfWeek?: number[];
  startTime: string; // "06:00"
  endTime: string;   // "22:00"
  duration: number;  // 60
  useDefaultPrice: boolean;
  customPrice?: number;
  currency?: string;
}
```

### Preview Calculation

Show preview of slots to be created:

```typescript
const previewCount = useMemo(() => {
  // Calculate how many slots will be created
  // Based on date range, days of week, time range, duration
  return calculateSlotCount(formData);
}, [formData]);
```

---

## Step 5: Action Handlers Update

Update the page's action handlers to match new hook signatures:

```typescript
// Block slot
const handleBlockSlot = (slotId: string) => {
  setActionLoadingId(slotId);
  blockSlot.mutate(
    { slotId },
    {
      onSuccess: () => {
        toast.success("Slot blocked successfully");
        setActionLoadingId(undefined);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to block slot");
        setActionLoadingId(undefined);
      },
    },
  );
};

// Similar updates for unblock, delete
```

---

## UI/UX Checklist (per Design System)

### Colors

- [ ] Available badge: `bg-[#ECFDF5]` + `text-[#059669]` (success-light)
- [ ] Pending badge: `bg-[#FFFBEB]` + `text-[#D97706]` (warning-light)
- [ ] Booked badge: `bg-[#CCFBF1]` + `text-[#0F766E]` (primary-light)
- [ ] Blocked badge: `bg-muted` + `text-muted-foreground`
- [ ] Add button: `bg-primary` (Teal #0D9488)
- [ ] Delete button: `bg-destructive` (Red #DC2626)

### Typography

- [ ] Page title: `font-heading` (Outfit), `text-2xl`, `font-bold`
- [ ] Slot time: `font-heading` (Outfit), `font-semibold`
- [ ] Player info: `font-body` (Source Sans 3)
- [ ] Price: `font-heading` (Outfit), `font-bold`

### Spacing

- [ ] Card padding: `p-6` (24px per design system)
- [ ] Gap between slots: `gap-4` (16px)
- [ ] Section margin: `space-y-6` (24px)

### Interactions

- [ ] Hover on slot: subtle background change
- [ ] Loading state: disabled buttons, loading spinner
- [ ] Success/error toasts: using Sonner

### Accessibility

- [ ] All interactive elements have `cursor-pointer`
- [ ] Focus states visible (ring-primary)
- [ ] Action buttons have aria-labels

---

## Loading States

```tsx
// Court loading
if (courtLoading) {
  return (
    <DashboardLayout {...}>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </DashboardLayout>
  );
}

// Slots loading handled by SlotList component
```

---

## Error Handling

```tsx
// Court not found
if (!court && !courtLoading) {
  return (
    <DashboardLayout {...}>
      <div className="text-center py-12">
        <p className="text-muted-foreground">Court not found</p>
        <Button asChild className="mt-4">
          <Link href="/owner/courts">Back to Courts</Link>
        </Button>
      </div>
    </DashboardLayout>
  );
}
```

---

## Testing Checklist

### Functional
- [ ] Page loads with real court name
- [ ] Slots load for selected date
- [ ] Empty state shows when no slots
- [ ] Block action works
- [ ] Unblock action works
- [ ] Delete action works
- [ ] Bulk create works
- [ ] Date navigation works

### Visual
- [ ] Status badges use correct colors
- [ ] Player info displays for booked/pending
- [ ] Loading states visible
- [ ] Toast notifications appear
- [ ] Mobile responsive

### Edge Cases
- [ ] No slots for date → empty state
- [ ] Network error → error toast
- [ ] Court not found → error state
- [ ] Many slots → scrolling works

---

## Final Checklist

- [ ] Real court data fetched
- [ ] Mock data removed
- [ ] Sidebar shows real organization
- [ ] Page header shows real court name
- [ ] Slots display with real data
- [ ] All actions work with backend
- [ ] UI follows design system
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Mobile responsive
- [ ] No TypeScript errors
- [ ] No console warnings
