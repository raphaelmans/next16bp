# Phase 1: Core Navigation

**Estimated Effort:** 1 day  
**Dependencies:** None  
**Assigned To:** Dev 1 (see `01-06-dev-checklist-1.md`)

---

## 1. Overview

Replace the waitlist landing page with a discovery-focused landing page and enhance the shared navbar to support authenticated user flows.

---

## 2. Landing Page Design

### 2.1 Design Pattern

Using **Marketplace/Directory** pattern (optimized for discovery):
- Hero section with prominent search
- Quick access to popular locations
- Featured courts grid
- Value proposition section
- Clear CTA to browse all courts

### 2.2 Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NAVBAR (floating, rounded, backdrop-blur)                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ [Logo]  ─────────────────────────  [List Your Court]  [Sign In/User ▼] ││
│  └─────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  HERO SECTION (centered, generous padding)                                   │
│                                                                              │
│                     Discover Pickleball Courts                               │
│                          Near You                                            │
│                                                                              │
│         Find and book courts in seconds. No more calls.                      │
│                                                                              │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  🔍  Search by city or court name...                   [Search]   │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│    Popular:  Metro Manila  •  Cebu  •  Davao  •  Laguna  •  Pampanga        │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FEATURED COURTS                                              [View All →]   │
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │
│  │    [Image]     │  │    [Image]     │  │    [Image]     │                 │
│  │                │  │                │  │                │                 │
│  │  Court Name    │  │  Court Name    │  │  Court Name    │                 │
│  │  📍 City       │  │  📍 City       │  │  📍 City       │                 │
│  │  ────────────  │  │  ────────────  │  │  ────────────  │                 │
│  │  ₱200/hr       │  │  Free          │  │  Contact       │                 │
│  └────────────────┘  └────────────────┘  └────────────────┘                 │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  WHY KUDOSCOURTS (3-column on desktop, stacked on mobile)                   │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │      🔍         │  │      📅         │  │      ✓          │              │
│  │    Discover     │  │    Reserve      │  │    Confirm      │              │
│  │                 │  │                 │  │                 │              │
│  │  Find courts    │  │  Book your      │  │  Secure P2P     │              │
│  │  by location,   │  │  preferred      │  │  payment with   │              │
│  │  see photos &   │  │  time slot      │  │  owner          │              │
│  │  amenities      │  │  instantly      │  │  confirmation   │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CTA SECTION (teal background)                                               │
│                                                                              │
│                    Ready to hit the court?                                   │
│                                                                              │
│                    [Browse All Courts]                                       │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FOOTER (existing component)                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Component Breakdown

| Section | Components | Data Source |
|---------|------------|-------------|
| Hero | Search input, location links | Static |
| Featured Courts | CourtCard (reuse) | `court.search` (limit 3) |
| Why KudosCourts | Feature cards | Static |
| CTA | Button | Static |
| Footer | Footer (reuse) | Static |

### 2.4 Responsive Behavior

| Breakpoint | Hero | Featured | Features | CTA |
|------------|------|----------|----------|-----|
| Mobile (<640px) | Stack, full-width search | 1 column | Stack | Full-width |
| Tablet (640-1024px) | Same | 2 columns | 3 columns | Same |
| Desktop (>1024px) | Same | 3 columns | 3 columns | Same |

---

## 3. Shared Navbar Enhancement

### 3.1 Current State

Location: `src/features/discovery/components/navbar.tsx`

Current features:
- Logo (links to `/`)
- Search input (desktop only)
- "List Your Court" button
- "Sign In" button
- Mobile menu (Sheet)

### 3.2 Required Changes

#### Guest State (No Changes Needed)
```
[Logo] ──── [Search] ──── [List Your Court]  [Sign In]
```

#### Authenticated State (New)
```
[Logo] ──── [Search] ──── [List Your Court]  [User Dropdown ▼]
                                              ┌────────────────────┐
                                              │ 👤 John Doe        │
                                              │    john@email.com  │
                                              ├────────────────────┤
                                              │ My Reservations    │
                                              │ Profile            │
                                              ├────────────────────┤
                                              │ Owner Dashboard    │
                                              │ Admin Dashboard    │
                                              ├────────────────────┤
                                              │ Sign Out           │
                                              └────────────────────┘
```

### 3.3 User Dropdown Component

**New File:** `src/features/discovery/components/user-dropdown.tsx`

```typescript
interface UserDropdownProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  // TODO: These should come from auth context
  isOwner?: boolean;  // Always true for dev
  isAdmin?: boolean;  // Always true for dev
}
```

**Menu Items:**
1. User info header (name, email, avatar)
2. Separator
3. "My Reservations" → `/reservations`
4. "Profile" → `/profile`
5. Separator
6. "Owner Dashboard" → `/owner` (show if isOwner, always for dev)
7. "Admin Dashboard" → `/admin` (show if isAdmin, always for dev)
8. Separator
9. "Sign Out" → logout action

### 3.4 Mobile Menu Updates

Add to existing Sheet menu:
- User info section (when authenticated)
- My Reservations link
- Profile link
- Owner Dashboard link
- Admin Dashboard link
- Sign Out button

---

## 4. Auth State Detection

### 4.1 Current Auth Hook

Location: `src/features/auth/hooks/use-auth.ts`

Provides:
- `useSession()` - current session
- `useLogin()` - login mutation
- `useLogout()` - logout mutation

### 4.2 Mock User for Development

Until auth is fully connected, use a mock user:

```typescript
// src/features/discovery/components/navbar.tsx
const mockUser = {
  name: "Dev User",
  email: "dev@kudoscourts.com",
  avatarUrl: null,
};

// TODO: Replace with real auth check
const isAuthenticated = true; // Set to false to test guest state
const isOwner = true;         // Set to false to hide Owner Dashboard
const isAdmin = true;         // Set to false to hide Admin Dashboard
```

### 4.3 TODO Comments

Add clear TODO comments for future auth integration:

```typescript
// TODO: Replace mock auth state with real Supabase session
// const { data: session } = useSession();
// const isAuthenticated = !!session?.user;

// TODO: Check if user has organization for owner access
// const isOwner = await checkUserHasOrganization(session.user.id);

// TODO: Check user role for admin access
// const isAdmin = session?.user?.role === "admin";
```

---

## 5. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/app/page.tsx` | Replace | New discovery landing page |
| `src/features/discovery/components/navbar.tsx` | Update | Add auth state, user dropdown |
| `src/features/discovery/components/user-dropdown.tsx` | Create | User dropdown menu component |
| `src/features/discovery/components/index.ts` | Update | Export UserDropdown |

---

## 6. Implementation Notes

### 6.1 Landing Page Data Fetching

Featured courts should be fetched server-side:

```typescript
// src/app/page.tsx
export default async function HomePage() {
  // TODO: Fetch featured courts
  // const featuredCourts = await trpc.court.search({ limit: 3 });
  
  return <LandingPage featuredCourts={[]} />;
}
```

For now, use mock data or empty state.

### 6.2 Search Functionality

Search input should:
1. On submit, navigate to `/courts?q={searchTerm}`
2. On popular location click, navigate to `/courts?city={city}`

```typescript
const handleSearch = (e: FormEvent) => {
  e.preventDefault();
  const query = new URLSearchParams({ q: searchTerm });
  router.push(`/courts?${query}`);
};
```

### 6.3 Design System Compliance

Ensure all new components follow `business-contexts/kudoscourts-design-system.md`:

- Hero headline: `font-heading text-4xl font-extrabold` (Outfit)
- Body text: `font-body text-lg text-muted-foreground` (Source Sans 3)
- Primary button: `bg-primary text-primary-foreground`
- Search input: `rounded-lg border-border focus:ring-primary`
- Card hover: `hover:-translate-y-1 hover:shadow-hover transition-all`

---

## 7. Acceptance Criteria

- [ ] Landing page replaces waitlist page at `/`
- [ ] Hero section with search bar that navigates to `/courts`
- [ ] Popular locations link to `/courts?city={city}`
- [ ] Featured courts section (3 cards, or empty state)
- [ ] Value proposition section with 3 features
- [ ] CTA button links to `/courts`
- [ ] Navbar shows "Sign In" for guests
- [ ] Navbar shows user dropdown for authenticated users
- [ ] User dropdown includes all menu items
- [ ] Mobile menu includes user items when authenticated
- [ ] No TypeScript errors
- [ ] Responsive at mobile/tablet/desktop
