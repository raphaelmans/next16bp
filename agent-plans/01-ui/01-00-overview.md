# UX Flow Plan - Overview

**Version:** 1.0  
**Created:** January 7, 2025  
**Status:** Planning

---

## 1. Objective

Connect all existing UI pages with proper navigation flows, replace the waitlist landing page with a discovery-focused landing page, and ensure all user journeys are viewable end-to-end.

**Key Constraints:**
- Authorization checks bypassed with TODO comments (implement later)
- Users can only view ONE dashboard at a time (Player OR Owner OR Admin)
- Manual role switching via code for debugging purposes

---

## 2. User Roles & Access Matrix

| Role | Description | Access | Entry Point |
|------|-------------|--------|-------------|
| **Guest** | Unauthenticated visitor | Discovery, Court Detail, Login/Register | `/` |
| **Player** | Authenticated user (default) | + Booking, Reservations, Profile | `/reservations` |
| **Owner** | User with organization | + Owner Dashboard | `/owner` |
| **Admin** | System administrator | + Admin Dashboard | `/admin` |

### Role Determination Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Authentication                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   Is Authenticated?      │
              └────────────┬────────────┘
                    │              │
                   YES            NO
                    │              │
                    ▼              ▼
         ┌──────────────────┐    Guest
         │ Check user_roles │    (Discovery only)
         │ table for role   │
         └────────┬─────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
  admin        member        viewer
    │             │             │
    ▼             ▼             ▼
  Admin       ┌───────────┐   Player
  Dashboard   │ Has Org?  │   (limited)
              └─────┬─────┘
                    │
              ┌─────┴─────┐
             YES         NO
              │           │
              ▼           ▼
           Owner       Player
           Dashboard   (default)
```

---

## 3. Debug Role Switching

For development/debugging, manually switch roles by modifying these files:

### Server-Side Role Override

**File:** `src/shared/infra/trpc/context.ts`  
**Line:** 69

```typescript
// Current implementation:
role: (userRole?.role as Session["role"]) ?? "member",

// DEBUG: Override to test different roles
role: "admin",    // Full admin access
role: "member",   // Default player/owner access
role: "viewer",   // Read-only access
```

### Owner Status Override

**File:** `src/app/(owner)/layout.tsx`  
**Lines:** 41-46

The organization check is currently bypassed with TODO comments. Any authenticated user can access `/owner/*` routes during development.

### Admin Status Override

**File:** `src/app/(admin)/layout.tsx`  
**Lines:** 41-52

The admin role check is currently bypassed with TODO comments. Any authenticated user can access `/admin/*` routes during development.

---

## 4. Navigation Architecture

### 4.1 Shared Navbar States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  GUEST STATE                                                                 │
│  [Logo] ──────── [Search] ──────── [List Your Court]  [Sign In]             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  AUTHENTICATED STATE                                                         │
│  [Logo] ──────── [Search] ──────── [List Your Court]  [User Dropdown ▼]     │
│                                                        ┌──────────────────┐ │
│                                                        │ My Reservations  │ │
│                                                        │ Profile          │ │
│                                                        │ ─────────────────│ │
│                                                        │ Owner Dashboard  │ │
│                                                        │ Admin Dashboard  │ │
│                                                        │ ─────────────────│ │
│                                                        │ Sign Out         │ │
│                                                        └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

Note: Owner/Admin Dashboard items always shown during dev (auth bypassed)
```

### 4.2 Route Groups & Layouts

| Route Group | Layout | Navbar | Sidebar | Auth Required |
|-------------|--------|--------|---------|---------------|
| `(public)` | Public | Shared Navbar | None | No |
| `(auth)` | Auth | Shared Navbar | None | Yes |
| `(owner)` | Dashboard | Owner Navbar | Owner Sidebar | Yes + Org* |
| `(admin)` | Dashboard | Admin Navbar | Admin Sidebar | Yes + Admin* |

*Bypassed for development

---

## 5. Page Inventory

### 5.1 Existing Pages

| Route | Page | Status | Role |
|-------|------|--------|------|
| `/` | Landing (Waitlist) | **REPLACE** | Guest |
| `/courts` | Discovery List | Complete | Guest |
| `/courts/[id]` | Court Detail | Complete | Guest |
| `/courts/[id]/book/[slotId]` | Booking Flow | Complete | Player |
| `/reservations` | My Reservations | Complete | Player |
| `/reservations/[id]` | Reservation Detail | Complete | Player |
| `/reservations/[id]/payment` | Payment Flow | Complete | Player |
| `/profile` | User Profile | Complete | Player |
| `/login` | Login | Complete | Guest |
| `/register` | Register | Complete | Guest |
| `/magic-link` | Magic Link Auth | Complete | Guest |
| `/owner` | Owner Dashboard | Complete | Owner |
| `/owner/courts` | Owner Courts List | Complete | Owner |
| `/owner/courts/new` | Create Court | Complete | Owner |
| `/owner/courts/[id]/slots` | Slot Management | Complete | Owner |
| `/owner/reservations` | Owner Reservations | Complete | Owner |
| `/owner/settings` | Org Settings | Complete | Owner |
| `/admin` | Admin Dashboard | Complete | Admin |
| `/admin/claims` | Claims List | Complete | Admin |
| `/admin/claims/[id]` | Claim Detail | Complete | Admin |
| `/admin/courts` | Admin Courts | Complete | Admin |
| `/admin/courts/new` | Create Curated Court | Complete | Admin |

### 5.2 Missing Pages (Deferred)

See `01-08-deferred-pages.md` for details.

| Route | Page | Priority |
|-------|------|----------|
| `/owner/courts/[id]/edit` | Edit Court | High |
| `/org/[slug]` | Public Organization Page | Medium |
| `/admin/courts/[id]` | Admin Court Detail/Edit | Medium |
| `/owner/onboarding` | Owner Onboarding | Low |

---

## 6. Phase Summary

| Phase | Focus | Document | Estimated Effort |
|-------|-------|----------|------------------|
| **1** | Core Navigation | `01-01-phase-core-navigation.md` | 1 day |
| **2** | Player Journey | `01-02-phase-player-journey.md` | 0.5 day |
| **3** | Owner Journey | `01-03-phase-owner-journey.md` | 0.5 day |
| **4** | Admin Journey | `01-04-phase-admin-journey.md` | 0.5 day |
| **5** | Polish | `01-05-phase-polish.md` | 1 day |

**Total Estimated Effort:** 3.5 days

---

## 7. Design System Reference

All implementations must follow `business-contexts/kudoscourts-design-system.md`:

| Token | Value | Usage |
|-------|-------|-------|
| Primary (Teal) | `#0D9488` | CTAs, focus rings, main actions |
| Accent (Orange) | `#F97316` | Links, location pins, highlights |
| Destructive (Red) | `#DC2626` | Errors, cancel actions |
| Font Heading | Outfit | Titles, buttons, navigation |
| Font Body | Source Sans 3 | Paragraphs, labels, inputs |
| Radius Default | 12px | Buttons, inputs |
| Radius Card | 16px | Cards, modals |

---

## 8. Document Index

| Document | Description |
|----------|-------------|
| `01-00-overview.md` | This document - high-level overview |
| `01-01-phase-core-navigation.md` | Phase 1: Landing page + shared navbar |
| `01-02-phase-player-journey.md` | Phase 2: Player discovery to booking flow |
| `01-03-phase-owner-journey.md` | Phase 3: Owner dashboard integration |
| `01-04-phase-admin-journey.md` | Phase 4: Admin dashboard integration |
| `01-05-phase-polish.md` | Phase 5: Polish and refinements |
| `01-06-dev-checklist-1.md` | Implementation checklist for Phases 1-2 |
| `01-07-dev-checklist-2.md` | Implementation checklist for Phases 3-5 |
| `01-08-deferred-pages.md` | Missing pages for future work |

---

## 9. Success Criteria

- [ ] Landing page is a discovery-focused page (no more waitlist)
- [ ] All pages are navigable without dead ends
- [ ] User can switch between Player/Owner/Admin views (via debug code)
- [ ] Navbar shows appropriate items based on auth state
- [ ] All protected routes have TODO comments for auth checks
- [ ] Build passes with no TypeScript errors
- [ ] Mobile navigation works correctly

---

## 10. Developer Assignment

This work can be parallelized across 2 developers:

| Developer | Assignment | Documents |
|-----------|------------|-----------|
| **Dev 1** | Core Navigation + Player Journey | `01-06-dev-checklist-1.md` |
| **Dev 2** | Owner/Admin Journey + Polish | `01-07-dev-checklist-2.md` |

See respective checklist documents for detailed implementation tasks.
