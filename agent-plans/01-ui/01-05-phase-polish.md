# Phase 5: Polish

**Estimated Effort:** 1 day  
**Dependencies:** Phases 1-4  
**Assigned To:** Dev 2 (see `01-07-dev-checklist-2.md`)

---

## 1. Overview

Add polish elements including loading states, empty states, error handling, transitions, and accessibility improvements across all pages.

---

## 2. Loading States

### 2.1 Skeleton Components

Create reusable skeleton components for consistent loading states.

**Location:** `src/components/ui/skeleton.tsx` (already exists in shadcn/ui)

### 2.2 Page-Specific Loading

| Page | Skeleton Pattern |
|------|------------------|
| Landing (featured courts) | 3 court card skeletons |
| Discovery list | Grid of 6-9 court card skeletons |
| Court detail | Image skeleton + info skeleton |
| My Reservations | Table row skeletons (5 rows) |
| Owner Dashboard | 4 stat card skeletons + table skeleton |
| Admin Dashboard | 4 stat card skeletons + table skeleton |

### 2.3 Implementation Pattern

```typescript
// Using React Suspense + loading.tsx
// src/app/(public)/courts/loading.tsx
export default function Loading() {
  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CourtCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
```

### 2.4 Inline Loading

For data that loads after page render (client-side):

```typescript
const { data, isLoading } = useQuery(...);

if (isLoading) {
  return <ComponentSkeleton />;
}
```

---

## 3. Empty States

### 3.1 Design Pattern

Empty states should:
1. Have a relevant illustration or icon
2. Explain what should be here
3. Provide a clear CTA to resolve

```
┌─────────────────────────────────────────┐
│                                         │
│              [Icon/Illustration]        │
│                                         │
│           No items found                │
│                                         │
│     Description of why empty and        │
│     what user can do about it.          │
│                                         │
│            [Primary CTA]                │
│                                         │
└─────────────────────────────────────────┘
```

### 3.2 Empty State Messages

| Page | Heading | Description | CTA |
|------|---------|-------------|-----|
| Discovery (no results) | No courts found | Try adjusting your filters or search in a different area | Clear Filters |
| My Reservations | No reservations yet | Book your first court and it will appear here | Browse Courts |
| Owner Courts | No courts yet | Add your first court to start receiving bookings | Add Court |
| Owner Reservations | No reservations | When players book your courts, they'll appear here | - |
| Admin Claims | No pending claims | All claims have been reviewed | - |
| Admin Courts | No courts | Add curated courts for players to discover | Add Curated Court |

### 3.3 Reusable Component

**File:** `src/components/ui/empty-state.tsx`

```typescript
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm">{description}</p>
      {action && (
        <Button asChild className="mt-4">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
```

---

## 4. Error Handling

### 4.1 Error Boundary

**File:** `src/components/error-boundary.tsx`

```typescript
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="font-heading text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground mt-1">
        We encountered an error loading this page.
      </p>
      <Button onClick={reset} className="mt-4">
        Try again
      </Button>
    </div>
  );
}
```

### 4.2 Page-Level Error Files

Create `error.tsx` files for each route group:
- `src/app/(public)/courts/error.tsx`
- `src/app/(auth)/reservations/error.tsx`
- `src/app/(owner)/owner/error.tsx`
- `src/app/(admin)/admin/error.tsx`

### 4.3 Inline Error States

For failed API calls:

```typescript
const { data, error, refetch } = useQuery(...);

if (error) {
  return (
    <div className="text-center py-8">
      <p className="text-destructive">Failed to load data</p>
      <Button variant="outline" onClick={() => refetch()} className="mt-2">
        Retry
      </Button>
    </div>
  );
}
```

---

## 5. Toast Notifications

### 5.1 Existing Setup

Toast is already set up via `sonner` in `src/app/layout.tsx`.

### 5.2 Toast Usage

| Action | Type | Message |
|--------|------|---------|
| Reservation created | Success | "Reservation confirmed! Check your email for details." |
| Payment submitted | Success | "Payment proof submitted. Awaiting owner confirmation." |
| Booking confirmed (owner) | Success | "Booking confirmed successfully." |
| Booking rejected (owner) | Info | "Booking has been rejected." |
| Claim approved (admin) | Success | "Claim approved. Court is now managed by {org}." |
| Claim rejected (admin) | Info | "Claim has been rejected." |
| Court created | Success | "Court created successfully." |
| Settings saved | Success | "Settings saved." |
| Error | Error | "{error message}" |

### 5.3 Implementation

```typescript
import { toast } from "sonner";

// Success
toast.success("Reservation confirmed!");

// Error
toast.error("Failed to create reservation. Please try again.");

// With description
toast.success("Booking confirmed", {
  description: "The player has been notified.",
});
```

---

## 6. Page Transitions

### 6.1 Card Entrance Animation

Cards should fade in with stagger effect.

**CSS (already in design system):**

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease forwards;
}
```

**Usage:**

```typescript
<div className="grid grid-cols-3 gap-6">
  {courts.map((court, index) => (
    <div
      key={court.id}
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CourtCard court={court} />
    </div>
  ))}
</div>
```

### 6.2 Respect Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in-up {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

---

## 7. Accessibility

### 7.1 Focus States

Ensure all interactive elements have visible focus:

```css
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### 7.2 Keyboard Navigation

| Component | Keys |
|-----------|------|
| Dropdown menu | Arrow up/down, Enter, Escape |
| Modal/Dialog | Tab trap, Escape to close |
| Tabs | Arrow left/right |
| Table rows | Enter to select/expand |

### 7.3 ARIA Labels

Add ARIA labels to icon-only buttons:

```typescript
<Button variant="ghost" size="icon" aria-label="Open menu">
  <Menu className="h-5 w-5" />
</Button>

<Button variant="ghost" size="icon" aria-label="Close">
  <X className="h-5 w-5" />
</Button>
```

### 7.4 Screen Reader Text

For status badges that rely on color:

```typescript
<Badge className="bg-success text-success-foreground">
  <span className="sr-only">Status: </span>
  Confirmed
</Badge>
```

---

## 8. Mobile Polish

### 8.1 Touch Targets

Ensure all clickable elements are at least 44x44px:

```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

### 8.2 Safe Areas

Account for notches and home indicators:

```css
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 8.3 Swipe Gestures (Future)

Consider adding swipe-to-dismiss for modals and sheets on mobile.

---

## 9. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/ui/empty-state.tsx` | Create | Reusable empty state component |
| `src/app/(public)/courts/loading.tsx` | Create | Discovery loading skeleton |
| `src/app/(public)/courts/[id]/loading.tsx` | Create | Court detail loading skeleton |
| `src/app/(auth)/reservations/loading.tsx` | Create | Reservations loading skeleton |
| `src/app/(owner)/owner/loading.tsx` | Create | Owner dashboard loading skeleton |
| `src/app/(admin)/admin/loading.tsx` | Create | Admin dashboard loading skeleton |
| `src/app/(public)/courts/error.tsx` | Create | Discovery error boundary |
| `src/app/(auth)/reservations/error.tsx` | Create | Reservations error boundary |
| `src/app/(owner)/owner/error.tsx` | Create | Owner error boundary |
| `src/app/(admin)/admin/error.tsx` | Create | Admin error boundary |
| Various pages | Update | Add empty states, toasts |

---

## 10. Acceptance Criteria

- [ ] All data-loading pages have skeleton loading states
- [ ] All list pages have empty states with appropriate CTAs
- [ ] Error boundaries are in place for all route groups
- [ ] Toast notifications show for all mutations
- [ ] Cards animate in with stagger effect
- [ ] Reduced motion preference is respected
- [ ] All interactive elements have visible focus states
- [ ] Icon-only buttons have ARIA labels
- [ ] Touch targets are at least 44x44px on mobile
- [ ] No horizontal scroll on mobile devices
