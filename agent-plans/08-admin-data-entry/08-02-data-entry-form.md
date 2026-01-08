# Phase 2: Data Entry Form

**Dependencies:** Phase 1 (Admin Components)  
**Parallelizable:** Partial (2A before 2B)  
**User Stories:** US-02-03

---

## Objective

Create a simple data entry form at `/admin/courts/data-entry` that:
1. Wires to the real `admin.court.createCurated` tRPC endpoint
2. Uses the modular admin components from Phase 1
3. Provides a "Create Another" flow for rapid data entry

---

## Module 2A: API Hook Wiring

### Current State (Mock)

```typescript
// src/features/admin/hooks/use-admin-courts.ts (CURRENT)
export function useCreateCuratedCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CuratedCourtData) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, courtId: `court-new-${Date.now()}` };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "courts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
```

### Target State (Real tRPC)

```typescript
// src/features/admin/hooks/use-admin-courts.ts (UPDATED)
import { trpc } from "@/shared/lib/trpc/client";

// ... existing code ...

export function useCreateCuratedCourt() {
  const utils = trpc.useUtils();

  return trpc.admin.court.createCurated.useMutation({
    onSuccess: () => {
      utils.admin.court.list.invalidate();
    },
  });
}
```

### Input Transformation

The form allows optional lat/lng, but the API requires them. Transform before calling:

```typescript
// In the form submit handler
const apiInput = {
  name: data.name,
  address: data.address,
  city: data.city,
  latitude: data.latitude || DEFAULT_LATITUDE,
  longitude: data.longitude || DEFAULT_LONGITUDE,
  facebookUrl: data.facebookUrl || undefined,
  instagramUrl: data.instagramUrl || undefined,
  viberInfo: data.viberContact || undefined,
  websiteUrl: data.websiteUrl || undefined,
  otherContactInfo: data.otherContactInfo || undefined,
  amenities: data.amenities.length > 0 ? data.amenities : undefined,
};
```

---

## Module 2B: Data Entry Page

### File Location

```
src/app/(admin)/admin/courts/data-entry/page.tsx
```

### Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back]  Add Curated Court (Data Entry)                       │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Name *                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Address *                                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  City *                           Latitude        Longitude      │
│  ┌──────────────────────┐        ┌───────────┐   ┌───────────┐  │
│  │ Select city...     ▼ │        │           │   │           │  │
│  └──────────────────────┘        └───────────┘   └───────────┘  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  Contact Information                                             │
│                                                                  │
│  Facebook URL                     Instagram URL                  │
│  ┌────────────────────────┐      ┌────────────────────────┐     │
│  │                         │      │                         │     │
│  └────────────────────────┘      └────────────────────────┘     │
│                                                                  │
│  Viber Contact                    Website URL                    │
│  ┌────────────────────────┐      ┌────────────────────────┐     │
│  │                         │      │                         │     │
│  └────────────────────────┘      └────────────────────────┘     │
│                                                                  │
│  Other Contact Info                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  Amenities                                                       │
│                                                                  │
│  ☐ Parking        ☐ Restrooms       ☐ Lights                   │
│  ☐ Showers        ☐ Locker Rooms    ☐ Equipment Rental         │
│  ☐ Pro Shop       ☐ Seating Area    ☐ Food/Drinks              │
│  ☐ WiFi           ☐ Air Conditioning ☐ Covered Courts          │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│                              [Cancel]  [Create Court]            │
└─────────────────────────────────────────────────────────────────┘
```

### Success State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                          ✓                                       │
│                                                                  │
│              Court created successfully!                         │
│              "Makati Pickleball Club"                            │
│                                                                  │
│              [Create Another]  [Back to Courts]                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// src/app/(admin)/admin/courts/data-entry/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";

import { DashboardLayout } from "@/shared/components/layout/dashboard-layout";
import {
  AdminSidebar,
  AdminNavbar,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  AdminCheckboxGroup,
  AdminFormActions,
  AdminSuccessState,
} from "@/features/admin";
import { useCreateCuratedCourt } from "@/features/admin/hooks/use-admin-courts";
import { useAdminStats } from "@/features/admin/hooks/use-admin-dashboard";
import {
  curatedCourtDataEntrySchema,
  type CuratedCourtDataEntryFormData,
  CITIES,
  AMENITIES,
  DEFAULT_LATITUDE,
  DEFAULT_LONGITUDE,
} from "@/features/admin/schemas/curated-court-data-entry.schema";
import { useSession, useLogout } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DataEntryPage() {
  const router = useRouter();
  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const { data: stats } = useAdminStats();
  const createMutation = useCreateCuratedCourt();

  const [showSuccess, setShowSuccess] = React.useState(false);
  const [createdCourtName, setCreatedCourtName] = React.useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CuratedCourtDataEntryFormData>({
    resolver: zodResolver(curatedCourtDataEntrySchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      latitude: "",
      longitude: "",
      facebookUrl: "",
      instagramUrl: "",
      viberContact: "",
      websiteUrl: "",
      otherContactInfo: "",
      amenities: [],
    },
  });

  const amenities = watch("amenities");
  const city = watch("city");

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/login";
  };

  const onSubmit = handleSubmit((data) => {
    createMutation.mutate(
      {
        name: data.name,
        address: data.address,
        city: data.city,
        latitude: data.latitude || DEFAULT_LATITUDE,
        longitude: data.longitude || DEFAULT_LONGITUDE,
        facebookUrl: data.facebookUrl || undefined,
        instagramUrl: data.instagramUrl || undefined,
        viberInfo: data.viberContact || undefined,
        websiteUrl: data.websiteUrl || undefined,
        otherContactInfo: data.otherContactInfo || undefined,
        amenities: data.amenities.length > 0 ? data.amenities : undefined,
      },
      {
        onSuccess: () => {
          setCreatedCourtName(data.name);
          setShowSuccess(true);
          toast.success("Court created successfully");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create court");
        },
      }
    );
  });

  const handleCreateAnother = () => {
    reset();
    setShowSuccess(false);
    setCreatedCourtName("");
  };

  const handleBackToCourts = () => {
    router.push("/admin/courts");
  };

  const cityOptions = CITIES.map((c) => ({ value: c, label: c }));

  return (
    <DashboardLayout
      sidebar={
        <AdminSidebar
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          pendingClaimsCount={stats?.pendingClaims || 0}
        />
      }
      navbar={
        <AdminNavbar
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
    >
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/admin/courts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courts
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Add Curated Court
          </h1>
          <p className="text-muted-foreground">
            Quick data entry for curated courts
          </p>
        </div>

        {showSuccess ? (
          <AdminSuccessState
            title="Court created successfully!"
            message={`"${createdCourtName}"`}
            actions={[
              { label: "Create Another", onClick: handleCreateAnother },
              {
                label: "Back to Courts",
                onClick: handleBackToCourts,
                variant: "outline",
              },
            ]}
          />
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <AdminInput
                label="Name"
                required
                placeholder="Makati Pickleball Club"
                error={errors.name?.message}
                {...register("name")}
              />

              <AdminInput
                label="Address"
                required
                placeholder="123 Sports Avenue, Barangay San Lorenzo"
                error={errors.address?.message}
                {...register("address")}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <AdminSelect
                  label="City"
                  name="city"
                  options={cityOptions}
                  value={city}
                  onChange={(value) => setValue("city", value)}
                  placeholder="Select city"
                  required
                  error={errors.city?.message}
                />

                <AdminInput
                  label="Latitude"
                  placeholder="14.5547"
                  error={errors.latitude?.message}
                  {...register("latitude")}
                />

                <AdminInput
                  label="Longitude"
                  placeholder="121.0244"
                  error={errors.longitude?.message}
                  {...register("longitude")}
                />
              </div>
            </div>

            {/* Divider */}
            <hr className="border-border" />

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Contact Information
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <AdminInput
                  label="Facebook URL"
                  type="url"
                  placeholder="https://facebook.com/..."
                  error={errors.facebookUrl?.message}
                  {...register("facebookUrl")}
                />

                <AdminInput
                  label="Instagram URL"
                  type="url"
                  placeholder="https://instagram.com/..."
                  error={errors.instagramUrl?.message}
                  {...register("instagramUrl")}
                />

                <AdminInput
                  label="Viber Contact"
                  placeholder="0917 123 4567"
                  error={errors.viberContact?.message}
                  {...register("viberContact")}
                />

                <AdminInput
                  label="Website URL"
                  type="url"
                  placeholder="https://example.com"
                  error={errors.websiteUrl?.message}
                  {...register("websiteUrl")}
                />
              </div>

              <AdminTextarea
                label="Other Contact Info"
                placeholder="Any additional contact information..."
                rows={3}
                {...register("otherContactInfo")}
              />
            </div>

            {/* Divider */}
            <hr className="border-border" />

            {/* Amenities */}
            <AdminCheckboxGroup
              label="Amenities"
              options={AMENITIES}
              value={amenities}
              onChange={(value) => setValue("amenities", value)}
              columns={3}
            />

            {/* Form Actions */}
            <AdminFormActions
              submitLabel="Create Court"
              isSubmitting={createMutation.isPending}
              onCancel={handleBackToCourts}
            />
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
```

---

## Update Courts List Page

Add "Data Entry" button next to existing "Add Curated Court".

```typescript
// src/app/(admin)/admin/courts/page.tsx
// In the header section, update the button area:

<div className="flex gap-2">
  <Button variant="outline" asChild>
    <Link href="/admin/courts/data-entry">
      Data Entry
    </Link>
  </Button>
  <Button asChild>
    <Link href="/admin/courts/new">
      <Plus className="mr-2 h-4 w-4" />
      Add Curated Court
    </Link>
  </Button>
</div>
```

---

## Flow Diagram

```
/admin/courts
    │
    ├── Click "Data Entry"
    │
    ▼
/admin/courts/data-entry
    │
    ├── Fill form
    │
    ▼
[Submit] ─── API: admin.court.createCurated
    │
    ├── Success
    │   │
    │   ▼
    │   Success State
    │       │
    │       ├── [Create Another] ─── Clear form, stay on page
    │       │
    │       └── [Back to Courts] ─── /admin/courts
    │
    └── Error
        │
        ▼
        Toast error, form preserved
```

---

## Testing Checklist

### Form Rendering
- [ ] All fields render correctly
- [ ] Required asterisks show on name, address, city
- [ ] City dropdown shows all cities
- [ ] Amenities checkboxes render in 3 columns

### Validation
- [ ] Empty name shows error
- [ ] Empty address shows error
- [ ] Empty city shows error
- [ ] Invalid URL shows error
- [ ] Invalid lat/lng shows error

### API Integration
- [ ] Form submits to real tRPC endpoint
- [ ] Success shows success state
- [ ] Error shows toast and preserves form

### Create Another Flow
- [ ] "Create Another" clears all fields
- [ ] Form is ready for new entry
- [ ] Previous success state is hidden

### Navigation
- [ ] Back button goes to /admin/courts
- [ ] Cancel button goes to /admin/courts
- [ ] "Back to Courts" from success goes to /admin/courts

---

## Handoff Notes

- Requires Phase 1 components to be complete
- Hook wiring change is breaking for existing mock usage
- Test with real database before deploying
