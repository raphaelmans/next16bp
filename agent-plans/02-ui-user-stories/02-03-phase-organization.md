# Phase 3: Organization Onboarding

**Estimated Time:** 0.5 day  
**Dependencies:** Phase 2 complete  
**Parallelizable:** No (sequential flow)

---

## Objective

Enable users to become court owners by creating an organization. This includes adding the "Become Owner" CTA to the profile page, creating the onboarding page, and implementing the organization check in the owner layout.

---

## User Stories Covered

- US-00-02: User Completes Profile (CTA section)
- US-01-01: Owner Registers Organization

---

## Modules

### Module 3A: Profile CTA

**Reference:** `user-stories/00-onboarding/00-02-user-completes-profile.md`  
**Estimated Time:** 1 hour

#### Files to Modify

| File | Changes |
|------|---------|
| `src/app/(auth)/account/profile/page.tsx` | Add "Become Owner" section |

#### Implementation

Add a CTA section after the profile form:

```typescript
// src/app/(auth)/account/profile/page.tsx
import { trpc } from "@/shared/lib/trpc/client";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProfilePage() {
  const { data: orgs } = trpc.organization.my.useQuery();
  const hasOrganization = (orgs?.length ?? 0) > 0;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <PageHeader
        title="Profile"
        breadcrumbs={[
          { label: "Account", href: "/home" },
          { label: "Profile" },
        ]}
        backHref="/home"
        backLabel="Back to Home"
      />
      
      {/* Profile Form */}
      <ProfileForm />
      
      {/* Become Owner CTA - Only show if no organization */}
      {!hasOrganization && (
        <div className="mt-8 p-6 rounded-xl bg-accent/10 border border-accent/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-accent/20">
              <Building2 className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-lg">
                Want to list your courts?
              </h3>
              <p className="text-muted-foreground mt-1">
                Create an organization to start listing your pickleball courts 
                and accepting reservations.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/owner/onboarding">
                  Become a Court Owner
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Organization Link - Show if has organization */}
      {hasOrganization && (
        <div className="mt-8 p-6 rounded-xl bg-muted border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold">Your Organization</h3>
              <p className="text-muted-foreground">{orgs[0].name}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/owner">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Testing Checklist

- [ ] User without org sees "Become Owner" CTA
- [ ] User with org sees org name and dashboard link
- [ ] CTA links to `/owner/onboarding`
- [ ] Dashboard link goes to `/owner`

---

### Module 3B: Onboarding Page

**Reference:** `user-stories/01-organization/01-01-owner-registers-organization.md`  
**Estimated Time:** 2-3 hours

#### Directory Structure

```
src/app/(auth)/owner/
└── onboarding/
    └── page.tsx

src/features/organization/
├── components/
│   ├── index.ts
│   └── organization-form.tsx
├── hooks/
│   └── use-create-organization.ts
└── schemas/
    └── create-organization.schema.ts
```

#### Implementation Steps

1. **Create Onboarding Page** (`src/app/(auth)/owner/onboarding/page.tsx`)

```typescript
"use client";

import { useSession } from "@/features/auth/hooks/use-auth";
import { trpc } from "@/shared/lib/trpc/client";
import { redirect, useRouter } from "next/navigation";
import { OrganizationForm } from "@/features/organization/components/organization-form";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = useSession();
  const { data: orgs, isLoading: orgsLoading } = trpc.organization.my.useQuery(undefined, {
    enabled: !!session?.user,
  });

  // Redirect if not authenticated
  if (!sessionLoading && !session?.user) {
    redirect("/login?redirect=/owner/onboarding");
  }

  // Redirect if already has organization
  if (!orgsLoading && orgs && orgs.length > 0) {
    redirect("/owner");
  }

  const handleSuccess = () => {
    router.push("/owner");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo className="h-8 w-8" />
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/home">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold">
            Create Your Organization
          </h1>
          <p className="text-muted-foreground mt-2">
            Start listing your pickleball courts and accepting reservations.
          </p>
        </div>

        <OrganizationForm onSuccess={handleSuccess} />
      </main>
    </div>
  );
}
```

2. **Create Organization Form** (`src/features/organization/components/organization-form.tsx`)

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/shared/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const createOrgSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9-]*$/, "Only lowercase letters, numbers, and hyphens")
    .optional()
    .or(z.literal("")),
});

type CreateOrgInput = z.infer<typeof createOrgSchema>;

interface OrganizationFormProps {
  onSuccess?: () => void;
}

export function OrganizationForm({ onSuccess }: OrganizationFormProps) {
  const utils = trpc.useUtils();
  
  const { mutate, isPending } = trpc.organization.create.useMutation({
    onSuccess: () => {
      toast.success("Organization created successfully!");
      utils.organization.my.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create organization");
    },
  });

  const form = useForm<CreateOrgInput>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const onSubmit = (data: CreateOrgInput) => {
    mutate({
      name: data.name,
      slug: data.slug || undefined,
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Organization Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Organization Name *</Label>
        <Input
          id="name"
          placeholder="My Sports Complex"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          This will be displayed to players browsing your courts.
        </p>
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label htmlFor="slug">URL Slug (optional)</Label>
        <div className="flex items-center">
          <span className="text-sm text-muted-foreground mr-2">
            kudoscourts.com/org/
          </span>
          <Input
            id="slug"
            placeholder="my-sports-complex"
            {...form.register("slug")}
            className="flex-1"
          />
        </div>
        {form.formState.errors.slug && (
          <p className="text-sm text-destructive">
            {form.formState.errors.slug.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Leave blank to auto-generate from your organization name.
        </p>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Create Organization
      </Button>
    </form>
  );
}
```

#### Testing Checklist

- [ ] Unauthenticated user redirected to login
- [ ] User with org redirected to `/owner`
- [ ] Form validates required name
- [ ] Form accepts optional slug
- [ ] Slug auto-generates if empty
- [ ] Success redirects to `/owner`
- [ ] Error shows toast message
- [ ] Cancel returns to `/home`

---

### Module 3C: Owner Layout Guard

**Reference:** `user-stories/00-onboarding/00-05-owner-navigates-dashboard.md`  
**Estimated Time:** 1 hour

#### Files to Modify

| File | Changes |
|------|---------|
| `src/app/(owner)/layout.tsx` | Add organization check |

#### Implementation

Update the owner layout to check for organization:

```typescript
// src/app/(owner)/layout.tsx
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { makeOrganizationRepository } from "@/modules/organization/repositories/organization.repository";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/owner");
  }

  // Check if user has organization
  const orgRepo = makeOrganizationRepository();
  const orgs = await orgRepo.findByOwnerId(user.id);
  
  if (orgs.length === 0) {
    redirect("/owner/onboarding");
  }

  return (
    <div className="flex min-h-screen">
      <OwnerSidebar organization={orgs[0]} />
      <main className="flex-1">
        <OwnerNavbar isAdmin={/* check role */} />
        {children}
      </main>
    </div>
  );
}
```

**Note:** The onboarding page uses `(auth)` layout group, not `(owner)`, so it won't trigger this guard.

#### Testing Checklist

- [ ] User without org redirected to `/owner/onboarding`
- [ ] User with org can access `/owner/*` routes
- [ ] Onboarding page accessible without org
- [ ] After creating org, can access owner dashboard

---

## Phase Completion Checklist

- [ ] Profile page shows "Become Owner" CTA for users without org
- [ ] Profile page shows org link for users with org
- [ ] Onboarding page created at `/owner/onboarding`
- [ ] Organization form creates org successfully
- [ ] Owner layout guards check for organization
- [ ] Redirect flows work correctly
- [ ] No TypeScript errors
- [ ] Manual testing complete
