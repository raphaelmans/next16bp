# KudosCourts UI Development - Master Plan

## Overview

This document provides the master plan for implementing the KudosCourts MVP frontend. The UI follows the KudosCourts Design System (see `business-contexts/kudoscourts-design-system.md`) with a **minimalist bento aesthetic**, warm neutrals, and strategic use of brand colors.

### Design System Summary

| Element | Value |
|---------|-------|
| **Primary** | Teal `#0D9488` - CTAs, focus rings |
| **Accent** | Orange `#F97316` - Links, pins, highlights |
| **Destructive** | Red `#DC2626` - Errors, cancel |
| **Heading Font** | Outfit (500-800) |
| **Body Font** | Source Sans 3 (300-600) |
| **Mono Font** | IBM Plex Mono (400-500) |
| **Base Radius** | 12px |
| **Grid** | 12-column bento layout |

### Reference Documents

| Document | Location |
|----------|----------|
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Backend Plans | `agent-plans/02-phase1-foundation.md` through `06-phase5-admin.md` |
| tRPC Routers | `src/modules/*/` |
| shadcn/ui Components | `src/shared/components/ui/` |

---

## UI Development Phases

| Phase | Description | Plan File | Backend Dependency |
|-------|-------------|-----------|-------------------|
| UI-0 | Foundation & Design Tokens | `01-ui-foundation.md` | None |
| UI-1 | Court Discovery | `02-ui-discovery.md` | Phase 1C (Court Discovery) |
| UI-2 | Reservation Flow | `03-ui-reservation.md` | Phase 3 (Reservation System) |
| UI-3 | Owner Dashboard | `04-ui-owner.md` | Phase 2 (Court Mgmt) + Phase 3B |
| UI-4 | Admin Dashboard | `05-ui-admin.md` | Phase 4B + Phase 5A |
| Shared | Component Library | `06-ui-components.md` | None |

---

## Page Index

### Public Pages (No Auth Required)

| Page | Route | Description | Plan |
|------|-------|-------------|------|
| Home/Discovery | `/` | Court discovery with bento grid | `02-ui-discovery.md` |
| Court Detail | `/courts/[id]` | Court info, photos, slots | `02-ui-discovery.md` |
| Search Results | `/courts?city=...` | Filtered court list | `02-ui-discovery.md` |
| Organization Profile | `/org/[slug]` | Public org profile | `02-ui-discovery.md` |

### Player Pages (Auth Required)

| Page | Route | Description | Plan |
|------|-------|-------------|------|
| Book Slot | `/courts/[id]/book/[slotId]` | Reservation form | `03-ui-reservation.md` |
| My Reservations | `/reservations` | Player's bookings list | `03-ui-reservation.md` |
| Reservation Detail | `/reservations/[id]` | Single reservation view | `03-ui-reservation.md` |
| Payment Confirmation | `/reservations/[id]/payment` | Mark payment, upload proof | `03-ui-reservation.md` |
| Profile | `/profile` | Edit player profile | `03-ui-reservation.md` |

### Owner Pages (Auth + Org Required)

| Page | Route | Description | Plan |
|------|-------|-------------|------|
| Owner Dashboard | `/owner` | Overview, pending actions | `04-ui-owner.md` |
| My Courts | `/owner/courts` | List org's courts | `04-ui-owner.md` |
| Create Court | `/owner/courts/new` | Create reservable court | `04-ui-owner.md` |
| Edit Court | `/owner/courts/[id]/edit` | Manage court details | `04-ui-owner.md` |
| Manage Slots | `/owner/courts/[id]/slots` | Time slot management | `04-ui-owner.md` |
| Reservations | `/owner/reservations` | Pending confirmations | `04-ui-owner.md` |
| Organization Settings | `/owner/settings` | Edit org profile | `04-ui-owner.md` |
| Claim Court | `/owner/claim/[courtId]` | Submit claim request | `04-ui-owner.md` |

### Admin Pages (Admin Role Required)

| Page | Route | Description | Plan |
|------|-------|-------------|------|
| Admin Dashboard | `/admin` | Overview, pending claims | `05-ui-admin.md` |
| Pending Claims | `/admin/claims` | Claim request queue | `05-ui-admin.md` |
| Claim Detail | `/admin/claims/[id]` | Review claim request | `05-ui-admin.md` |
| All Courts | `/admin/courts` | Court moderation | `05-ui-admin.md` |
| Create Curated Court | `/admin/courts/new` | Add curated listing | `05-ui-admin.md` |

---

## Component Architecture

### Directory Structure

```
src/
├── app/
│   ├── (public)/              # Public pages (no auth layout)
│   │   ├── page.tsx           # Home/Discovery
│   │   ├── courts/
│   │   │   ├── page.tsx       # Search results
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Court detail
│   │   └── org/
│   │       └── [slug]/
│   │           └── page.tsx   # Org profile
│   │
│   ├── (auth)/                # Auth required pages
│   │   ├── reservations/
│   │   │   ├── page.tsx       # My reservations
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # Reservation detail
│   │   │       └── payment/
│   │   │           └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   │
│   ├── (owner)/               # Owner dashboard
│   │   └── owner/
│   │       ├── page.tsx
│   │       ├── courts/
│   │       ├── reservations/
│   │       └── settings/
│   │
│   └── (admin)/               # Admin dashboard
│       └── admin/
│           ├── page.tsx
│           ├── claims/
│           └── courts/
│
├── features/                  # Feature-specific components
│   ├── discovery/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── schemas/
│   ├── reservation/
│   ├── owner/
│   └── admin/
│
└── shared/
    ├── components/
    │   ├── ui/               # shadcn/ui base components
    │   └── kudos/            # KudosCourts branded components
    │       ├── court-card.tsx
    │       ├── time-slot-picker.tsx
    │       ├── status-badge.tsx
    │       └── ...
    └── hooks/
```

### Component Naming Convention

| Type | Prefix | Example |
|------|--------|---------|
| Page Component | None | `CourtDetailPage` |
| Feature Component | Feature name | `DiscoveryHero`, `ReservationForm` |
| Shared Branded | `Kudos` | `KudosCourtCard`, `KudosTimePicker` |
| Base UI | None (shadcn) | `Button`, `Card`, `Input` |

---

## State Management

### URL State (nuqs)

Used for shareable, bookmarkable state:

| State | Key | Example |
|-------|-----|---------|
| City filter | `city` | `?city=Manila` |
| Court type | `type` | `?type=RESERVABLE` |
| Date selection | `date` | `?date=2025-01-15` |
| Search query | `q` | `?q=pickleball` |
| Pagination | `page` | `?page=2` |

### Server State (tRPC + React Query)

All data fetching through tRPC:

```typescript
// Court discovery
trpc.court.search.useQuery({ city, type, limit, offset })
trpc.court.getById.useQuery({ id })

// Reservations
trpc.reservation.getMy.useQuery({ status, upcoming })
trpc.reservation.create.useMutation()
trpc.reservation.markPayment.useMutation()

// Owner
trpc.courtManagement.getByOrganization.useQuery({ organizationId })
trpc.reservationOwner.getPendingForCourt.useQuery({ courtId })
```

### Local State (Zustand - minimal use)

Only for complex client-only state:

- Multi-step form wizard state
- Shopping cart-like slot selection (if selecting multiple)
- UI preferences (dark mode)

---

## Design Tokens (Tailwind)

### Colors (CSS Variables)

```css
/* Primary - Teal */
--primary: oklch(0.58 0.11 175);
--primary-foreground: oklch(0.99 0 0);
--primary-light: oklch(0.92 0.04 175);

/* Accent - Orange */
--accent: oklch(0.70 0.18 45);
--accent-foreground: oklch(0.99 0 0);
--accent-light: oklch(0.92 0.06 45);

/* Destructive - Red */
--destructive: oklch(0.55 0.22 27);
--destructive-light: oklch(0.92 0.06 27);

/* Success */
--success: oklch(0.60 0.15 160);
--success-light: oklch(0.95 0.04 160);

/* Warning */
--warning: oklch(0.65 0.15 70);
--warning-light: oklch(0.96 0.04 70);

/* Neutrals (warm-tinted) */
--background: oklch(0.985 0.003 90);
--foreground: oklch(0.15 0.01 90);
--card: oklch(1 0.002 90);
--muted: oklch(0.96 0.005 90);
--muted-foreground: oklch(0.55 0.01 90);
--border: oklch(0.91 0.005 90);
```

### Typography

```css
--font-heading: 'Outfit', ui-sans-serif, system-ui, sans-serif;
--font-body: 'Source Sans 3', ui-sans-serif, system-ui, sans-serif;
--font-mono: 'IBM Plex Mono', ui-monospace, monospace;
```

### Spacing & Radius

```css
--radius: 12px;  /* Base radius */
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
```

---

## Responsive Breakpoints

| Breakpoint | Width | Columns | Usage |
|------------|-------|---------|-------|
| Mobile | < 640px | 1 | Single column, stacked cards |
| Tablet | 640-1024px | 6 | 2-column grid |
| Desktop | > 1024px | 12 | Full bento grid |

### Mobile-First Approach

All components designed mobile-first with progressive enhancement:

```tsx
// Example: Court card grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
  {courts.map(court => <CourtCard key={court.id} {...court} />)}
</div>
```

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | 4.5:1 minimum for text |
| Focus states | Visible ring on all interactive elements |
| Keyboard nav | Full keyboard accessibility |
| Screen readers | Semantic HTML, ARIA labels |
| Motion | Respect `prefers-reduced-motion` |

### Focus Ring Style

```css
:focus-visible {
  outline: none;
  ring: 2px;
  ring-offset: 2px;
  ring-color: var(--primary);
}
```

---

## Performance Guidelines

### Image Optimization

- Use Next.js `<Image>` component
- Implement lazy loading for court photos
- Use blur placeholders
- WebP format with fallbacks

### Code Splitting

- Route-based splitting (automatic with App Router)
- Dynamic imports for heavy components (maps, charts)
- Lazy load owner/admin dashboards

### Data Fetching

- Server Components for initial data
- Optimistic updates for mutations
- Infinite scroll for long lists
- Prefetch on hover for navigation

---

## Development Checklist

### Pre-Development

- [ ] Tailwind config updated with design tokens
- [ ] Font loading configured in `app/layout.tsx`
- [ ] Base shadcn components installed
- [ ] tRPC client configured

### Per-Page Checklist

- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Dark mode (if applicable)

---

## Next Steps

1. Review `01-ui-foundation.md` for Tailwind/component setup
2. Review `06-ui-components.md` for shared component specs
3. Begin with Phase UI-1 (Discovery) once backend Phase 1C is ready
4. Implement pages in order of user flow priority

---

*End of UI Master Plan*
