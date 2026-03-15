# Phase 2: Navigation

**Estimated Time:** 1 day  
**Dependencies:** Phase 1 complete  
**Parallelizable:** Yes (2A required first, then 2B-2E can parallel)

---

## Objective

Implement consistent navigation patterns across all platform areas. Create a reusable PageHeader component and update all pages to use proper breadcrumbs and back buttons.

---

## User Stories Covered

- US-00-03: User Navigates Public Area
- US-00-04: User Navigates Account Area
- US-00-05: Owner Navigates Dashboard
- US-00-06: Admin Navigates Dashboard

---

## Modules

### Module 2A: PageHeader Component

**Reference:** `user-stories/00-onboarding/00-04-user-navigates-account-area.md`  
**Estimated Time:** 1-2 hours

#### Directory Structure

```
src/components/ui/
└── page-header.tsx
```

#### Implementation

```typescript
// src/components/ui/page-header.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/shared/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  backHref,
  backLabel = "Back",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4 mb-8", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <BreadcrumbItem key={index}>
                {index < breadcrumbs.length - 1 ? (
                  <>
                    <BreadcrumbLink asChild>
                      <Link href={item.href || "#"}>{item.label}</Link>
                    </BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          {backHref && (
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLabel}
              </Link>
            </Button>
          )}
          
          {/* Title & Description */}
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
```

#### Export

```typescript
// src/components/ui/index.ts (add export)
export { PageHeader } from "./page-header";
```

#### Testing Checklist

- [ ] PageHeader renders with title only
- [ ] PageHeader renders with breadcrumbs
- [ ] PageHeader renders with back button
- [ ] PageHeader renders with actions
- [ ] All combinations work together

---

### Module 2B: Public Navigation

**Reference:** `user-stories/00-onboarding/00-03-user-navigates-public-area.md`  
**Estimated Time:** 1 hour

#### Files to Modify

| File | Changes |
|------|---------|
| `src/app/(public)/courts/[id]/page.tsx` | Update breadcrumbs |
| `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx` | Add back button + breadcrumbs |

#### Implementation Steps

1. **Court Detail Page** (`courts/[id]/page.tsx`)

```typescript
// Add PageHeader with breadcrumbs
<PageHeader
  title={court.name}
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Courts", href: "/courts" },
    { label: court.name },
  ]}
/>
```

2. **Booking Page** (`courts/[id]/book/[slotId]/page.tsx`)

```typescript
<PageHeader
  title="Book Slot"
  breadcrumbs={[
    { label: "Courts", href: "/courts" },
    { label: court.name, href: `/courts/${court.id}` },
    { label: "Book" },
  ]}
  backHref={`/courts/${court.id}`}
  backLabel="Back to Court"
/>
```

#### Testing Checklist

- [ ] Court detail shows breadcrumbs
- [ ] Booking page shows breadcrumbs + back button
- [ ] Back button navigates correctly

---

### Module 2C: Account Navigation

**Reference:** `user-stories/00-onboarding/00-04-user-navigates-account-area.md`  
**Estimated Time:** 1-2 hours

#### Files to Modify

| File | Changes |
|------|---------|
| `src/app/(auth)/profile/page.tsx` | Move to `/account/profile`, add PageHeader |
| `src/app/(auth)/reservations/page.tsx` | Add PageHeader |
| `src/app/(auth)/reservations/[id]/page.tsx` | Add PageHeader with back |
| `src/app/(auth)/reservations/[id]/payment/page.tsx` | Add PageHeader with back |

#### Implementation Steps

1. **Create Account Route Group**

```
src/app/(auth)/account/
└── profile/
    └── page.tsx
```

2. **Profile Page**

```typescript
<PageHeader
  title="Profile"
  breadcrumbs={[
    { label: "Account", href: "/home" },
    { label: "Profile" },
  ]}
  backHref="/home"
  backLabel="Back to Home"
/>
```

3. **Reservations List**

```typescript
<PageHeader title="My Reservations" />
```

4. **Reservation Detail**

```typescript
<PageHeader
  title="Reservation Details"
  breadcrumbs={[
    { label: "My Reservations", href: "/reservations" },
    { label: "Details" },
  ]}
  backHref="/reservations"
  backLabel="Back to Reservations"
/>
```

5. **Payment Page**

```typescript
<PageHeader
  title="Complete Payment"
  breadcrumbs={[
    { label: "My Reservations", href: "/reservations" },
    { label: "Details", href: `/reservations/${id}` },
    { label: "Payment" },
  ]}
  backHref={`/reservations/${id}`}
  backLabel="Back to Details"
/>
```

#### Testing Checklist

- [ ] Profile accessible at `/account/profile`
- [ ] Profile has breadcrumbs and back button
- [ ] Reservations list has title
- [ ] Reservation detail has breadcrumbs and back
- [ ] Payment page has breadcrumbs and back
- [ ] All navigation links work

---

### Module 2D: Owner Navigation

**Reference:** `user-stories/00-onboarding/00-05-owner-navigates-dashboard.md`  
**Estimated Time:** 1-2 hours

#### Files to Modify

| File | Changes |
|------|---------|
| `src/features/owner/components/owner-sidebar.tsx` | Add active state styling |
| `src/app/(owner)/owner/courts/new/page.tsx` | Add PageHeader |
| `src/app/(owner)/owner/courts/[id]/slots/page.tsx` | Add PageHeader |

#### Implementation Steps

1. **Update Owner Sidebar Active State**

```typescript
// owner-sidebar.tsx
const pathname = usePathname();

const isActive = (href: string) => {
  if (href === "/owner") return pathname === "/owner";
  return pathname.startsWith(href);
};

// Apply active styling
className={cn(
  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
  isActive(item.href)
    ? "bg-primary/10 text-primary border-l-2 border-primary"
    : "text-muted-foreground hover:bg-muted hover:text-foreground"
)}
```

2. **New Court Page**

```typescript
<PageHeader
  title="Add Court"
  breadcrumbs={[
    { label: "My Courts", href: "/owner/courts" },
    { label: "New Court" },
  ]}
  backHref="/owner/courts"
  backLabel="Back to Courts"
/>
```

3. **Slots Page**

```typescript
<PageHeader
  title={`Manage Slots - ${court.name}`}
  breadcrumbs={[
    { label: "My Courts", href: "/owner/courts" },
    { label: court.name, href: `/owner/courts` },
    { label: "Manage Slots" },
  ]}
  backHref="/owner/courts"
  backLabel="Back to Courts"
/>
```

#### Testing Checklist

- [ ] Sidebar shows active state on current page
- [ ] Active state uses primary color with left border
- [ ] New court page has breadcrumbs and back
- [ ] Slots page has breadcrumbs and back

---

### Module 2E: Admin Navigation

**Reference:** `user-stories/00-onboarding/00-06-admin-navigates-dashboard.md`  
**Estimated Time:** 1-2 hours

#### Files to Modify

| File | Changes |
|------|---------|
| `src/features/admin/components/admin-sidebar.tsx` | Add active state, pending badge |
| `src/app/(admin)/admin/claims/[id]/page.tsx` | Update PageHeader |
| `src/app/(admin)/admin/courts/new/page.tsx` | Add PageHeader |

#### Implementation Steps

1. **Update Admin Sidebar**

```typescript
// admin-sidebar.tsx
const pathname = usePathname();
const { data: pendingCount } = trpc.claimAdmin.getPendingCount.useQuery();

const isActive = (href: string) => {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
};

// Claims item with badge
<Link href="/admin/claims" className={cn(itemClasses, isActive("/admin/claims") && activeClasses)}>
  <Tag className="h-5 w-5" />
  <span>Claims</span>
  {pendingCount > 0 && (
    <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
      {pendingCount}
    </span>
  )}
</Link>
```

2. **Claim Detail Page**

```typescript
<PageHeader
  title={`Claim #${claim.id.slice(0, 8)}`}
  breadcrumbs={[
    { label: "Claims", href: "/admin/claims" },
    { label: `Claim #${claim.id.slice(0, 8)}` },
  ]}
  backHref="/admin/claims"
  backLabel="Back to Claims"
/>
```

3. **New Curated Court Page**

```typescript
<PageHeader
  title="Add Curated Court"
  breadcrumbs={[
    { label: "Courts", href: "/admin/courts" },
    { label: "New Curated Court" },
  ]}
  backHref="/admin/courts"
  backLabel="Back to Courts"
/>
```

#### Testing Checklist

- [ ] Sidebar shows active state on current page
- [ ] Claims shows pending badge count
- [ ] Badge hidden when count is 0
- [ ] Claim detail has breadcrumbs and back
- [ ] New court has breadcrumbs and back

---

## Phase Completion Checklist

- [ ] PageHeader component created and exported
- [ ] All public pages have consistent navigation
- [ ] All account pages have consistent navigation
- [ ] Owner sidebar has active states
- [ ] Admin sidebar has active states and badges
- [ ] All nested pages have breadcrumbs + back buttons
- [ ] No TypeScript errors
- [ ] Manual testing complete
