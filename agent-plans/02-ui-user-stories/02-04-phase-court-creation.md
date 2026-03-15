# Phase 4: Court Creation

**Estimated Time:** 0.5 day  
**Dependencies:** Phase 3 complete  
**Parallelizable:** Partial (4A and 4B can be parallel if different developers)

---

## Objective

Enable organization owners to create their own reservable courts. This requires both a frontend form and a new backend endpoint, as the current `adminCourt.createCuratedCourt` is admin-only.

---

## User Stories Covered

- US-02-01: Admin Creates Curated Court (verify existing)
- US-02-02: Owner Creates Court (new implementation)

---

## Modules

### Module 4A: Owner Court Form

**Reference:** `user-stories/02-court-creation/02-02-owner-creates-court.md`  
**Estimated Time:** 2-3 hours

#### Directory Structure

```
src/app/(owner)/owner/courts/
└── new/
    └── page.tsx  (update existing)

src/features/owner/components/
└── owner-court-form.tsx  (new or update existing)
```

#### Implementation Steps

1. **Review Existing Court Form**

Check if `src/features/owner/components/court-form.tsx` exists and what it does. If it's for curated courts, we need to adapt it for owner courts.

2. **Update/Create Owner Court Form**

```typescript
// src/features/owner/components/owner-court-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/shared/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const createCourtSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  address: z.string().min(1, "Address is required").max(200),
  city: z.string().min(1, "City is required").max(100),
  description: z.string().max(1000).optional(),
  defaultPrice: z.number().min(0).optional(),
  currency: z.string().default("PHP"),
});

type CreateCourtInput = z.infer<typeof createCourtSchema>;

interface OwnerCourtFormProps {
  organizationId: string;
  onCancel?: () => void;
}

export function OwnerCourtForm({ organizationId, onCancel }: OwnerCourtFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { mutate, isPending } = trpc.courtManagement.createCourt.useMutation({
    onSuccess: (data) => {
      toast.success("Court created successfully!");
      utils.courtManagement.getMyCourts.invalidate();
      // Redirect to slot management
      router.push(`/owner/courts/${data.id}/slots`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create court");
    },
  });

  const form = useForm<CreateCourtInput>({
    resolver: zodResolver(createCourtSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      description: "",
      defaultPrice: undefined,
      currency: "PHP",
    },
  });

  const onSubmit = (data: CreateCourtInput) => {
    mutate({
      ...data,
      organizationId,
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Court Name *</Label>
        <Input
          id="name"
          placeholder="Court A"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          placeholder="123 Sports Complex, Barangay"
          {...form.register("address")}
        />
        {form.formState.errors.address && (
          <p className="text-sm text-destructive">
            {form.formState.errors.address.message}
          </p>
        )}
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">City *</Label>
        <Input
          id="city"
          placeholder="Manila"
          {...form.register("city")}
        />
        {form.formState.errors.city && (
          <p className="text-sm text-destructive">
            {form.formState.errors.city.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your court facilities..."
          rows={4}
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      {/* Default Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="defaultPrice">Default Hourly Rate</Label>
          <Input
            id="defaultPrice"
            type="number"
            placeholder="200"
            {...form.register("defaultPrice", { valueAsNumber: true })}
          />
          <p className="text-sm text-muted-foreground">
            Leave blank for free courts
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            {...form.register("currency")}
            disabled
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Court
        </Button>
      </div>
    </form>
  );
}
```

3. **Update New Court Page**

```typescript
// src/app/(owner)/owner/courts/new/page.tsx
"use client";

import { PageHeader } from "@/components/ui/page-header";
import { OwnerCourtForm } from "@/features/owner/components/owner-court-form";
import { trpc } from "@/shared/lib/trpc/client";
import { useRouter } from "next/navigation";

export default function NewCourtPage() {
  const router = useRouter();
  const { data: orgs } = trpc.organization.my.useQuery();
  const organization = orgs?.[0];

  if (!organization) {
    return null; // Layout guard should handle this
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <PageHeader
        title="Add Court"
        breadcrumbs={[
          { label: "My Courts", href: "/owner/courts" },
          { label: "New Court" },
        ]}
        backHref="/owner/courts"
        backLabel="Back to Courts"
      />

      <OwnerCourtForm
        organizationId={organization.id}
        onCancel={() => router.push("/owner/courts")}
      />
    </div>
  );
}
```

#### Testing Checklist

- [ ] Form renders with all fields
- [ ] Validation works for required fields
- [ ] Default price optional (blank = free)
- [ ] Submit creates court (once backend ready)
- [ ] Success redirects to slot management
- [ ] Cancel returns to courts list
- [ ] Error shows toast

---

### Module 4B: Backend Endpoint

**Reference:** `user-stories/02-court-creation/02-02-owner-creates-court.md`  
**Estimated Time:** 2-3 hours

#### Files to Create/Modify

| File | Changes |
|------|---------|
| `src/modules/court-management/dtos/create-court.dto.ts` | New DTO |
| `src/modules/court-management/services/court-management.service.ts` | Add createCourt method |
| `src/modules/court-management/court-management.router.ts` | Add createCourt mutation |

#### Implementation Steps

1. **Create DTO**

```typescript
// src/modules/court-management/dtos/create-court.dto.ts
import { z } from "zod";

export const CreateCourtSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(150),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  defaultPrice: z.number().min(0).optional(),
  currency: z.string().default("PHP"),
});

export type CreateCourtDTO = z.infer<typeof CreateCourtSchema>;
```

2. **Add Service Method**

```typescript
// court-management.service.ts
async createCourt(ownerId: string, data: CreateCourtDTO) {
  // Verify owner owns this organization
  const org = await this.orgRepo.findById(data.organizationId);
  if (!org || org.ownerUserId !== ownerId) {
    throw new NotOrganizationOwnerError();
  }

  // Create court as RESERVABLE
  const court = await this.courtRepo.create({
    organizationId: data.organizationId,
    name: data.name,
    address: data.address,
    city: data.city,
    description: data.description,
    courtType: "RESERVABLE",
    claimStatus: "CLAIMED", // Already owned
    defaultPrice: data.defaultPrice,
    currency: data.currency,
    isActive: true,
  });

  return court;
}
```

3. **Add Router Mutation**

```typescript
// court-management.router.ts
createCourt: protectedProcedure
  .input(CreateCourtSchema)
  .mutation(async ({ ctx, input }) => {
    const service = makeCourtManagementService();
    return service.createCourt(ctx.userId, input);
  }),
```

#### Testing Checklist

- [ ] Endpoint rejects unauthenticated requests
- [ ] Endpoint rejects if user doesn't own organization
- [ ] Court created with RESERVABLE type
- [ ] Court created with CLAIMED status
- [ ] Court linked to organization
- [ ] Returns created court

---

## Verify Admin Curated Court (US-02-01)

The admin curated court flow should already work. Verify:

- [ ] Admin can access `/admin/courts/new`
- [ ] Form creates court with CURATED type
- [ ] Form creates court with UNCLAIMED status
- [ ] Photos and amenities can be added
- [ ] Contact socials can be added

---

## Phase Completion Checklist

- [ ] Owner court form created/updated
- [ ] `courtManagement.createCourt` endpoint created
- [ ] Endpoint validates organization ownership
- [ ] Court created as RESERVABLE/CLAIMED
- [ ] Success redirects to slot management
- [ ] Admin curated court flow verified
- [ ] No TypeScript errors
- [ ] Manual testing complete
