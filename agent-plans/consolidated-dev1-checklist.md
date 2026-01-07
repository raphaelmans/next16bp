# Developer 1 Checklist (Full-Stack)

**Focus Area:** Player Journey (Discovery, Booking) + Infrastructure  
**Backend:** 0A, 1A, 1C, 2A, 3A, 3C  
**Frontend:** UI-0A, UI-1 (Discovery), UI-2 (Reservation)

---

## Estimated Timeline: 8-10 days

| Day | Backend | Frontend |
|-----|---------|----------|
| 1 | 0A: Rate Limiting | UI-0A: Foundation Setup |
| 2 | 1A: Profile Module | UI-0B: shadcn Components |
| 3 | 1C: Court Discovery | UI-1A: Layout Components |
| 4 | 2A: Court Management | UI-1B: Court Cards |
| 5 | 3A: Reservation Core | UI-1C: Discovery Page |
| 6 | 3A cont'd | UI-1D: Search Results + Map View |
| 7 | 3C: Payment Proof | UI-1E: Court Detail Page |
| 8 | Integration | UI-2A: Booking Flow |
| 9 | Testing | UI-2B-D: Reservations + Payment |
| 10 | Polish | Testing & Fixes |

---

## Day 1: Infrastructure + Foundation

### Backend 0A: Rate Limiting Infrastructure
**Reference:** `00-server/01-server-infrastructure.md`

- [ ] Install: `@upstash/ratelimit`, `@upstash/redis`
- [ ] Add env variables to `.env.local.example`
- [ ] Create `src/shared/infra/ratelimit/config.ts`
  - [ ] Define `RATE_LIMIT_TIERS` (default, auth, mutation, sensitive)
- [ ] Create `src/shared/infra/ratelimit/ratelimit.ts`
  - [ ] Implement `createRateLimiter(tier)` factory
- [ ] Create rate limit middleware in trpc
- [ ] Update trpc.ts with `rateLimitedProcedure`
- [ ] Test rate limiting works

### Frontend UI-0A: Foundation Setup
**Reference:** `00-ui/01-ui-foundation.md`

- [ ] Configure fonts in `app/layout.tsx`
  - [ ] Outfit (400-800)
  - [ ] Source Sans 3 (300-600)
  - [ ] IBM Plex Mono (400-500)
- [ ] Update `tailwind.config.ts`
  - [ ] Font families
  - [ ] Color extensions (primary-light, accent-light, etc.)
  - [ ] Success, warning tokens
  - [ ] Custom shadows
  - [ ] Border radius tokens
- [ ] Update `globals.css` with CSS variables
  - [ ] Light mode colors (warm neutrals)
  - [ ] Primary (teal), Accent (orange), Destructive (red)
  - [ ] Success, warning
- [ ] Add focus ring styles
- [ ] Test font loading

---

## Day 2: Profile + Base Components

### Backend 1A: Profile Module
**Reference:** `00-server/02-server-foundation.md`

- [ ] Create `src/modules/profile/` structure
- [ ] Create DTOs: `get-profile.dto.ts`, `update-profile.dto.ts`
- [ ] Create `profile.errors.ts`
- [ ] Create `profile.repository.ts`
  - [ ] `findByUserId(userId)`
  - [ ] `create(data)`
  - [ ] `update(userId, data)`
- [ ] Create `profile.service.ts`
- [ ] Create `profile.factory.ts`
- [ ] Create `profile.router.ts`
  - [ ] `me` - Get current user profile
  - [ ] `update` - Update profile
- [ ] Register in app router
- [ ] Test endpoints

### Frontend UI-0B: Base Component Customization
**Reference:** `00-ui/01-ui-foundation.md`

- [ ] Install shadcn components:
  ```bash
  npx shadcn-ui@latest add button card badge input textarea
  npx shadcn-ui@latest add select checkbox radio-group switch label
  npx shadcn-ui@latest add dialog sheet popover dropdown-menu
  npx shadcn-ui@latest add tabs table avatar skeleton toast alert
  npx shadcn-ui@latest add calendar separator scroll-area tooltip form
  ```
- [ ] Customize Button variants (default, destructive, outline, accent, success)
- [ ] Customize Badge variants (free, paid, contact, success, warning)
- [ ] Customize Card (rounded-xl, shadow-md)
- [ ] Customize Input (focus states)

---

## Day 3: Court Discovery + Layout

### Backend 1C: Court Discovery Module
**Reference:** `00-server/02-server-foundation.md`

- [ ] Create `src/modules/court-discovery/` structure
- [ ] Create DTOs: `search-courts.dto.ts`, `get-court.dto.ts`
- [ ] Create `court-discovery.errors.ts`
- [ ] Create `court-discovery.repository.ts`
  - [ ] `search(filters)` - with city, type, pagination
  - [ ] `getById(id)` - full court details
  - [ ] `getByOrganizationSlug(slug)`
- [ ] Create `court-discovery.service.ts`
- [ ] Create `court-discovery.router.ts`
  - [ ] `search` - Search courts
  - [ ] `getById` - Get court by ID
  - [ ] `getBySlug` - Get org courts by slug
- [ ] Register in app router
- [ ] Test search with filters

### Frontend UI-1A: Layout Components
**Reference:** `00-ui/06-ui-components.md`

- [ ] Create `src/shared/components/layout/container.tsx`
- [ ] Create `src/shared/components/layout/page-layout.tsx`
- [ ] Create `src/shared/components/layout/bento-grid.tsx`
- [ ] Create `src/features/discovery/components/navbar.tsx`
  - [ ] Floating glassmorphism style
  - [ ] Logo, search, auth buttons
- [ ] Create `src/features/discovery/components/footer.tsx`

---

## Day 4: Court Management + Court Cards

### Backend 2A: Court Management Module
**Reference:** `00-server/03-server-court-management.md`

- [ ] Create `src/modules/court-management/` structure
- [ ] Create DTOs for court CRUD
- [ ] Create `court-management.errors.ts`
- [ ] Create `court-management.repository.ts`
  - [ ] `create(data)` - Create reservable court
  - [ ] `update(id, data)` - Update court
  - [ ] `getByOrganization(orgId)`
  - [ ] `toggleActive(id, isActive)`
- [ ] Create `court-management.service.ts`
  - [ ] Validate organization ownership
  - [ ] Handle photo uploads
- [ ] Create `court-management.router.ts` (protected)
  - [ ] `create`, `update`, `delete`, `getByOrganization`
- [ ] Register in app router
- [ ] Test CRUD operations

### Frontend UI-1B: Court Cards
**Reference:** `00-ui/06-ui-components.md`

- [ ] Create `src/shared/components/kudos/court-card.tsx`
  - [ ] Variants: default, featured, compact
  - [ ] Image with badge overlay
  - [ ] Hover animation
  - [ ] Price/Free badge
- [ ] Create `src/shared/components/kudos/logo.tsx`
- [ ] Create `src/shared/components/kudos/location-pin.tsx`
- [ ] Create `src/shared/components/kudos/empty-state.tsx`

---

## Day 5: Reservation Core + Discovery Page

### Backend 3A: Reservation Core Module
**Reference:** `00-server/04-server-reservations.md`

- [ ] Create `src/modules/reservation/` structure
- [ ] Create DTOs: `create-reservation.dto.ts`, `get-reservations.dto.ts`
- [ ] Create `reservation.errors.ts`
- [ ] Create `reservation.repository.ts`
  - [ ] `create(data)` - with slot validation
  - [ ] `getByPlayer(userId)`
  - [ ] `getById(id)`
  - [ ] `updateStatus(id, status)`
- [ ] Create `reservation.service.ts`
  - [ ] Handle slot holding (15-min TTL)
  - [ ] Capture player snapshot (PRD 8.5)
  - [ ] Free vs paid court logic
- [ ] Create `reservation.router.ts`
  - [ ] `create` - Create reservation
  - [ ] `getMy` - Get player's reservations
  - [ ] `getById` - Get single reservation
  - [ ] `cancel` - Cancel reservation
- [ ] Register in app router

### Frontend UI-1C: Discovery Page
**Reference:** `00-ui/02-ui-discovery.md`

- [ ] Create `src/app/(public)/page.tsx` (Home)
- [ ] Create `src/features/discovery/components/hero-section.tsx`
- [ ] Create bento grid layout with court cards
- [ ] Create `src/features/discovery/hooks/use-discovery.ts`
- [ ] Create `src/features/discovery/hooks/use-discovery-filters.ts` (nuqs)
- [ ] Implement infinite scroll or pagination
- [ ] Add loading skeletons

---

## Day 6: Reservation Cont'd + Search Results + Map

### Backend 3A: Reservation Core (continued)

- [ ] Implement reservation events logging
- [ ] Implement TTL expiration check
- [ ] Test full reservation lifecycle (free + paid)
- [ ] Test slot status transitions

### Frontend UI-1D: Search Results + Map View (PRD Section 10)
**Reference:** `00-ui/02-ui-discovery.md`

- [ ] Create `src/app/(public)/courts/page.tsx`
- [ ] Create `src/features/discovery/components/court-filters.tsx`
- [ ] Create `src/features/discovery/components/view-toggle.tsx` (List/Map)
- [ ] Create `src/features/discovery/components/court-map.tsx`
  - [ ] Google Maps integration
  - [ ] Court markers with info windows
  - [ ] Click marker to highlight in sidebar
- [ ] Create map sidebar with mini court cards
- [ ] Add URL state for view toggle (`?view=list|map`)
- [ ] Create `src/shared/components/kudos/ad-banner.tsx` (PRD Section 13)
- [ ] Add ad banner to search results page
- [ ] Implement pagination

---

## Day 7: Payment Proof + Court Detail

### Backend 3C: Payment Proof Module
**Reference:** `00-server/04-server-reservations.md`

- [ ] Create `src/modules/payment-proof/` structure
- [ ] Create DTOs: `add-proof.dto.ts`, `mark-payment.dto.ts`
- [ ] Create `payment-proof.repository.ts`
- [ ] Create `payment-proof.service.ts`
- [ ] Create `payment-proof.router.ts`
  - [ ] `add` - Add payment proof
  - [ ] `markPayment` - Mark payment complete (PRD 17.3)
- [ ] Register in app router
- [ ] Test payment flow with proof upload

### Frontend UI-1E: Court Detail Page
**Reference:** `00-ui/02-ui-discovery.md`

- [ ] Create `src/app/(public)/courts/[id]/page.tsx`
- [ ] Create `src/features/discovery/components/photo-gallery.tsx`
- [ ] Create `src/features/discovery/components/booking-card.tsx` (sticky)
- [ ] Create `src/shared/components/kudos/time-slot-picker.tsx`
- [ ] Create `src/shared/components/kudos/date-picker.tsx`
- [ ] Create `src/features/discovery/components/contact-section.tsx` (curated)
- [ ] Create `src/features/discovery/hooks/use-court-detail.ts`
- [ ] Add "Contact to Book" label for curated courts
- [ ] Add ad banner (PRD Section 13 - secondary placement)
- [ ] Implement map with single pin

---

## Day 8: Integration + Booking Flow

### Integration Testing

- [ ] Test full discovery → court detail flow
- [ ] Test slot availability updates
- [ ] Verify curated vs reservable distinction

### Frontend UI-2A: Booking Flow
**Reference:** `00-ui/03-ui-reservation.md`

- [ ] Create `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx`
- [ ] Create `src/features/reservation/components/booking-summary-card.tsx`
- [ ] Create `src/features/reservation/components/profile-preview-card.tsx`
- [ ] Create `src/features/reservation/components/payment-info-card.tsx`
- [ ] Create `src/features/reservation/components/order-summary.tsx`
- [ ] Create `src/features/reservation/hooks/use-create-reservation.ts`
- [ ] Implement booking form with validation
- [ ] Handle free vs paid court flows

---

## Day 9: Reservations + Payment UI

### Frontend UI-2B: My Reservations
**Reference:** `00-ui/03-ui-reservation.md`

- [ ] Create `src/app/(auth)/reservations/page.tsx`
- [ ] Create `src/features/reservation/components/reservation-list-item.tsx`
- [ ] Create `src/shared/components/kudos/status-badge.tsx`
- [ ] Implement tabs (Upcoming, Past, Cancelled)
- [ ] Add URL state for tabs
- [ ] Implement empty states

### Frontend UI-2C: Reservation Detail
**Reference:** `00-ui/03-ui-reservation.md`

- [ ] Create `src/app/(auth)/reservations/[id]/page.tsx`
- [ ] Create `src/features/reservation/components/status-banner.tsx`
- [ ] Create `src/shared/components/kudos/countdown.tsx`
- [ ] Create `src/shared/components/kudos/timeline.tsx`
- [ ] Display player snapshot (PRD 8.5)
- [ ] Display organization info
- [ ] Display payment proof if uploaded

### Frontend UI-2D: Payment Page
**Reference:** `00-ui/03-ui-reservation.md`

- [ ] Create `src/app/(auth)/reservations/[id]/payment/page.tsx`
- [ ] Create `src/features/reservation/components/payment-method-card.tsx`
- [ ] Create `src/features/reservation/components/payment-disclaimer.tsx` (PRD 17.2)
- [ ] Create `src/shared/components/kudos/file-upload.tsx`
- [ ] Implement copy to clipboard for payment details
- [ ] Add disclaimer acknowledgement checkbox (PRD 17.3)
- [ ] Add T&C checkbox (PRD 17.3)
- [ ] Update mark payment schema with required acknowledgements
- [ ] Create `src/features/reservation/hooks/use-mark-payment.ts`

---

## Day 10: Profile + Polish + Testing

### Frontend UI-2E: Profile Page
**Reference:** `00-ui/03-ui-reservation.md`

- [ ] Create `src/app/(auth)/profile/page.tsx`
- [ ] Create profile form with validation
- [ ] Implement avatar upload
- [ ] Create `src/features/reservation/hooks/use-profile.ts`

### Testing & Polish

- [ ] Test full player journey: Discovery → Book → Pay → Confirm
- [ ] Verify mobile responsiveness
- [ ] Test keyboard accessibility
- [ ] Verify loading/error states work
- [ ] Test URL state persistence
- [ ] Verify ad banner placements (PRD 13)
- [ ] Verify payment disclaimer flows (PRD 17)
- [ ] Verify player snapshot display (PRD 8.5)

---

## Handoff to Dev 2

After completing:
- [ ] Rate limiting middleware ready for owner/admin procedures
- [ ] Profile module ready for reservation player snapshots
- [ ] Court discovery ready for owner dashboard to reference
- [ ] Reservation core ready for owner confirmation features
- [ ] All player-facing UI complete

---

## Files Created

### Backend
```
src/shared/infra/ratelimit/
src/modules/profile/
src/modules/court-discovery/
src/modules/court-management/
src/modules/reservation/
src/modules/payment-proof/
```

### Frontend
```
src/shared/components/kudos/
src/shared/components/layout/
src/features/discovery/
src/features/reservation/
src/app/(public)/
src/app/(auth)/
```
