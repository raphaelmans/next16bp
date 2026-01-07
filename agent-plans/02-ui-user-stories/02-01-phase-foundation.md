# Phase 1: Foundation

**Estimated Time:** 1 day  
**Dependencies:** None  
**Parallelizable:** No (sequential due to auth dependency)

---

## Objective

Wire real authentication state to UI components and create the authenticated home page. This phase removes all DEV flags and establishes the foundation for role-based navigation.

---

## User Stories Covered

- US-00-01: User Authentication Flow
- US-00-07: Home Page for Authenticated Users

---

## Modules

### Module 1A: Auth Wiring

**Reference:** `user-stories/00-onboarding/00-01-user-authentication-flow.md`  
**Estimated Time:** 2-3 hours

#### Files to Modify

| File | Changes |
|------|---------|
| `src/features/discovery/components/navbar.tsx` | Remove DEV flags, use `useSession()` |
| `src/features/discovery/components/user-dropdown.tsx` | Accept real props instead of defaults |
| `src/features/discovery/components/booking-card.tsx` | Remove DEV flag, use `useSession()` |
| `src/features/owner/components/owner-navbar.tsx` | Remove default `isAdmin = true` |
| `src/features/admin/components/admin-navbar.tsx` | Remove default `isOwner = true` |
| `src/features/admin/components/admin-only.tsx` | Remove default `isAdmin = true` |

#### Implementation Steps

1. **Update Discovery Navbar** (`navbar.tsx`)

```typescript
// BEFORE (lines 32-40)
const DEV_IS_AUTHENTICATED = true;
const DEV_USER = { name: "Dev User", email: "dev@kudoscourts.com", avatarUrl: null };
const DEV_IS_OWNER = true;
const DEV_IS_ADMIN = true;

// AFTER
import { useSession } from "@/features/auth/hooks/use-auth";
import { trpc } from "@/shared/lib/trpc/client";

// Inside component:
const { data: session, isLoading: sessionLoading } = useSession();
const { data: orgs } = trpc.organization.my.useQuery(undefined, {
  enabled: !!session?.user,
});
const isAuthenticated = !!session?.user;
const user = session?.user ? {
  name: session.user.email?.split('@')[0] || 'User',
  email: session.user.email || '',
  avatarUrl: null,
} : null;
const isOwner = (orgs?.length ?? 0) > 0;
const isAdmin = session?.role === 'admin';
```

2. **Update User Dropdown** (`user-dropdown.tsx`)

```typescript
// BEFORE (lines 41-42)
isOwner = true,
isAdmin = true,

// AFTER - Remove defaults, require props
interface UserDropdownProps {
  user: { name: string; email: string; avatarUrl: string | null };
  isOwner: boolean;
  isAdmin: boolean;
}
```

3. **Update Booking Card** (`booking-card.tsx`)

```typescript
// BEFORE (line 25)
const DEV_IS_AUTHENTICATED = true;

// AFTER
import { useSession } from "@/features/auth/hooks/use-auth";
const { data: session } = useSession();
const isAuthenticated = !!session?.user;
```

4. **Update Owner/Admin Navbars**

Remove default prop values, require explicit passing from parent layouts.

#### Testing Checklist

- [ ] Unauthenticated user sees "Sign In" button
- [ ] Authenticated user sees user dropdown
- [ ] Owner sees "Owner Dashboard" link
- [ ] Admin sees "Admin Dashboard" link
- [ ] Non-owner doesn't see "Owner Dashboard" link
- [ ] Non-admin doesn't see "Admin Dashboard" link

---

### Module 1B: Home Page

**Reference:** `user-stories/00-onboarding/00-07-home-page-authenticated-users.md`  
**Estimated Time:** 4-5 hours

#### Directory Structure

```
src/app/(auth)/home/
└── page.tsx

src/features/home/
├── components/
│   ├── index.ts
│   ├── welcome-header.tsx
│   ├── quick-actions.tsx
│   ├── upcoming-reservations.tsx
│   ├── organization-section.tsx
│   └── profile-completion-banner.tsx
└── hooks/
    └── use-home-data.ts
```

#### Implementation Steps

1. **Create Home Page Route** (`src/app/(auth)/home/page.tsx`)

```typescript
"use client";

import { useSession } from "@/features/auth/hooks/use-auth";
import { redirect } from "next/navigation";
import { WelcomeHeader } from "@/features/home/components/welcome-header";
import { QuickActions } from "@/features/home/components/quick-actions";
import { UpcomingReservations } from "@/features/home/components/upcoming-reservations";
import { OrganizationSection } from "@/features/home/components/organization-section";
import { ProfileCompletionBanner } from "@/features/home/components/profile-completion-banner";
import { useHomeData } from "@/features/home/hooks/use-home-data";

export default function HomePage() {
  const { data: session, isLoading } = useSession();
  const { profile, reservations, organization, isProfileComplete } = useHomeData();

  if (!isLoading && !session?.user) {
    redirect("/login");
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <WelcomeHeader displayName={profile?.displayName} />
      
      <QuickActions 
        hasOrganization={!!organization} 
        isAdmin={session?.role === "admin"} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <UpcomingReservations reservations={reservations} />
        </div>
        <div>
          <OrganizationSection organization={organization} />
        </div>
      </div>
      
      {!isProfileComplete && (
        <ProfileCompletionBanner className="mt-6" />
      )}
    </div>
  );
}
```

2. **Create useHomeData Hook** (`src/features/home/hooks/use-home-data.ts`)

```typescript
import { trpc } from "@/shared/lib/trpc/client";

export function useHomeData() {
  const { data: profile } = trpc.profile.me.useQuery();
  const { data: reservations } = trpc.reservation.getMyReservations.useQuery({
    limit: 3,
    // Filter for upcoming only
  });
  const { data: orgs } = trpc.organization.my.useQuery();
  
  const organization = orgs?.[0] ?? null;
  
  const isProfileComplete = !!(
    profile?.displayName && 
    (profile?.email || profile?.phoneNumber)
  );

  return {
    profile,
    reservations: reservations ?? [],
    organization,
    isProfileComplete,
  };
}
```

3. **Create Quick Actions Component** (`quick-actions.tsx`)

```typescript
import Link from "next/link";
import { Search, CalendarDays, User, Building2, Shield } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface QuickActionsProps {
  hasOrganization: boolean;
  isAdmin: boolean;
}

const actions = [
  { icon: Search, label: "Find Courts", href: "/courts" },
  { icon: CalendarDays, label: "My Bookings", href: "/reservations" },
  { icon: User, label: "Profile", href: "/account/profile" },
];

export function QuickActions({ hasOrganization, isAdmin }: QuickActionsProps) {
  const allActions = [
    ...actions,
    ...(hasOrganization ? [{ icon: Building2, label: "Owner Dashboard", href: "/owner" }] : []),
    ...(isAdmin ? [{ icon: Shield, label: "Admin Dashboard", href: "/admin" }] : []),
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {allActions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={cn(
            "flex flex-col items-center justify-center p-6",
            "bg-card border rounded-xl shadow-sm",
            "hover:shadow-md hover:-translate-y-0.5 hover:border-primary",
            "transition-all duration-200 cursor-pointer"
          )}
        >
          <action.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
          <span className="mt-2 font-heading font-semibold text-sm">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
```

4. **Create Remaining Components**

Similar pattern for:
- `welcome-header.tsx` - Simple heading with display name
- `upcoming-reservations.tsx` - List with empty state
- `organization-section.tsx` - Stats or CTA based on state
- `profile-completion-banner.tsx` - Dismissible banner

#### Testing Checklist

- [ ] Home page loads for authenticated user
- [ ] Unauthenticated redirected to login
- [ ] Quick actions show correct items based on role
- [ ] Upcoming reservations displays (or empty state)
- [ ] Organization section shows stats (or CTA)
- [ ] Profile banner shows when incomplete
- [ ] Profile banner dismissal persists

---

### Module 1C: Login Redirect

**Reference:** `user-stories/00-onboarding/00-01-user-authentication-flow.md`  
**Estimated Time:** 30 minutes

#### Files to Modify

| File | Changes |
|------|---------|
| `src/features/auth/components/login-form.tsx` | Change default redirect to `/home` |
| `src/features/discovery/components/navbar.tsx` | Logo links to `/home` when authenticated |

#### Implementation Steps

1. **Update Login Form Default Redirect**

```typescript
// BEFORE (line 34)
const redirectUrl = searchParams.get("redirect") || "/courts";

// AFTER
const redirectUrl = searchParams.get("redirect") || "/home";
```

2. **Update Navbar Logo Link**

```typescript
// Dynamic logo href based on auth state
<Link href={isAuthenticated ? "/home" : "/"}>
  <Logo />
</Link>
```

#### Testing Checklist

- [ ] Login without redirect param goes to `/home`
- [ ] Login with redirect param respects param
- [ ] Logo click goes to `/home` when authenticated
- [ ] Logo click goes to `/` when guest

---

## Phase Completion Checklist

- [ ] All DEV flags removed from components
- [ ] Auth state sourced from `useSession()`
- [ ] `/home` page created with all sections
- [ ] Login redirect defaults to `/home`
- [ ] Logo navigation is auth-aware
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Manual testing complete
