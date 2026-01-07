# Developer 1 Checklist

**Focus Area:** Infrastructure + Player Flow + Discovery UI  
**Backend Modules:** 0A → 1A → 2A → 3A  
**UI Modules:** UI-0A → UI-1 (Discovery)

---

## Module 0A: Rate Limiting Infrastructure
**Reference:** `01-infrastructure.md`  
**Estimated Time:** 1 day  
**Dependencies:** None

### Setup
- [ ] Install dependencies: `@upstash/ratelimit`, `@upstash/redis`
- [ ] Add environment variables to `.env.local.example`

### Implementation
- [ ] Create `src/shared/infra/ratelimit/config.ts`
  - [ ] Define `RATE_LIMIT_TIERS` constant (default, auth, mutation, sensitive)
  - [ ] Export `RateLimitTier` type
- [ ] Create `src/shared/infra/ratelimit/ratelimit.ts`
  - [ ] Implement `createRateLimiter(tier)` factory function
- [ ] Create `src/shared/infra/ratelimit/index.ts`
  - [ ] Export all rate limit utilities
- [ ] Create `src/shared/infra/trpc/middleware/ratelimit.middleware.ts`
  - [ ] Implement `createRateLimitMiddleware(tier)` 
  - [ ] Use userId for authenticated, requestId/IP for anonymous
  - [ ] Throw TRPCError with code `TOO_MANY_REQUESTS` on limit exceeded
- [ ] Update `src/shared/infra/trpc/trpc.ts`
  - [ ] Add `rateLimitedProcedure(tier)` export
  - [ ] Add `protectedRateLimitedProcedure(tier)` export

### Testing
- [ ] Rate limiter correctly limits requests per tier
- [ ] Authenticated users use userId as identifier
- [ ] Anonymous users use fallback identifier
- [ ] 429 response returned when limit exceeded
- [ ] Different tiers have independent limits

### Handoff
- [ ] Notify Dev 2 that rate limiting is ready (they need it for adminProcedure)
- [ ] Update `00-overview.md` to mark 0A complete

---

## UI-0A: Foundation Setup (PARALLEL with 0A)
**Reference:** `00-ui/01-ui-foundation.md`  
**Estimated Time:** 1 day  
**Dependencies:** None  
**Can parallelize with:** Backend 0A

### Font Setup
- [ ] Configure Google Fonts in `app/layout.tsx`
  - [ ] Outfit (400, 500, 600, 700, 800)
  - [ ] Source Sans 3 (300, 400, 500, 600, italic)
  - [ ] IBM Plex Mono (400, 500)
- [ ] Set font CSS variables (`--font-heading`, `--font-body`, `--font-mono`)
- [ ] Apply `font-body` as default on body element
- [ ] Test font loading and fallbacks

### Tailwind Configuration
- [ ] Update `tailwind.config.ts`:
  - [ ] Add font families (heading, body, mono)
  - [ ] Add color extensions (primary-light, primary-dark, accent-light, etc.)
  - [ ] Add success, warning color tokens
  - [ ] Add custom shadows (sm, md, lg, hover)
  - [ ] Add custom animations (fade-in-up, fade-in)
  - [ ] Add border radius tokens (sm, md, lg, xl)

### CSS Variables (globals.css)
- [ ] Define light mode color variables (HSL format)
  - [ ] Background, foreground (warm neutrals)
  - [ ] Primary (teal), accent (orange), destructive (red)
  - [ ] Success, warning
  - [ ] Muted, card, border
- [ ] Define dark mode variables
- [ ] Add base typography styles for h1-h4
- [ ] Add focus ring styles
- [ ] Add reduced motion styles
- [ ] Add animation delay utilities

### Install & Customize shadcn/ui
```bash
npx shadcn-ui@latest add button card badge input textarea
npx shadcn-ui@latest add select checkbox radio-group switch label
npx shadcn-ui@latest add dialog sheet popover dropdown-menu
npx shadcn-ui@latest add tabs table avatar skeleton toast alert
npx shadcn-ui@latest add calendar separator scroll-area tooltip form
```

- [ ] Customize Button with KudosCourts variants
- [ ] Customize Badge with court-specific variants (free, paid, contact)
- [ ] Customize Card with rounded-xl and shadow-md
- [ ] Customize Input with proper height and focus states

### Handoff
- [ ] Foundation tokens available for all UI work
- [ ] Notify Dev 2 that foundation is ready

---

## Module 1A: Profile Module
**Reference:** `02-phase1-foundation.md`  
**Estimated Time:** 1-2 days  
**Dependencies:** 0A complete

### Directory Setup
- [ ] Create `src/modules/profile/` directory structure:
  ```
  profile/
  ├── profile.router.ts
  ├── dtos/
  │   ├── index.ts
  │   └── update-profile.dto.ts
  ├── errors/
  │   └── profile.errors.ts
  ├── factories/
  │   └── profile.factory.ts
  ├── repositories/
  │   └── profile.repository.ts
  └── services/
      └── profile.service.ts
  ```

### Implementation
- [ ] Create `profile.errors.ts`
  - [ ] `ProfileNotFoundError` extends NotFoundError
- [ ] Create `update-profile.dto.ts`
  - [ ] `UpdateProfileSchema` with Zod validation
  - [ ] Export `UpdateProfileDTO` type
- [ ] Create `dtos/index.ts` - export all DTOs
- [ ] Create `profile.repository.ts`
  - [ ] Define `IProfileRepository` interface
  - [ ] Implement `ProfileRepository` class
  - [ ] Methods: `findById`, `findByUserId`, `create`, `update`
  - [ ] Support `RequestContext` for transactions
- [ ] Create `profile.service.ts`
  - [ ] Define `IProfileService` interface
  - [ ] Implement `ProfileService` class
  - [ ] Methods: `getProfile`, `getOrCreateProfile`, `updateProfile`
  - [ ] Auto-create profile if missing
- [ ] Create `profile.factory.ts`
  - [ ] `makeProfileRepository()` - lazy singleton
  - [ ] `makeProfileService()` - lazy singleton
- [ ] Create `profile.router.ts`
  - [ ] `profile.me` - protected, get/create own profile
  - [ ] `profile.update` - protected, update profile
  - [ ] `profile.getById` - protected, get profile by ID
- [ ] Register router in `src/shared/infra/trpc/root.ts`

### Testing
- [ ] Can get own profile
- [ ] Auto-creates profile if missing
- [ ] Can update profile fields
- [ ] Validates email format
- [ ] Rejects invalid data
- [ ] No TypeScript errors

### Handoff
- [ ] Profile module ready for Reservation Core (3A)
- [ ] Update `00-overview.md` to mark 1A complete

---

## UI-1A: Core Kudos Components (PARALLEL with 1A)
**Reference:** `00-ui/06-ui-components.md`  
**Estimated Time:** 1.5 days  
**Dependencies:** UI-0A complete  
**Can parallelize with:** Backend 1A

### KudosLogo Component
**File:** `src/shared/components/kudos/logo.tsx`
- [ ] Create SVG logo from design system
- [ ] Implement `variant` prop (`full`, `icon`)
- [ ] Implement `size` prop (`sm`, `md`, `lg`)

### KudosLocationPin Component
**File:** `src/shared/components/kudos/location-pin.tsx`
- [ ] Create orange gradient pin SVG
- [ ] Implement size variants

### KudosCourtCard Component
**File:** `src/shared/components/kudos/court-card.tsx`
- [ ] Implement `default` variant (180px image)
- [ ] Implement `featured` variant (260px image, 2 rows)
- [ ] Implement `compact` variant (140px image)
- [ ] Add image placeholder (teal gradient)
- [ ] Add badge positioning
- [ ] Add hover effects (-translate-y-1, shadow-hover)
- [ ] Link to court detail page

### KudosEmptyState Component
**File:** `src/shared/components/kudos/empty-state.tsx`
- [ ] Create centered layout
- [ ] Add icon slot
- [ ] Add title and description
- [ ] Add optional action button

### Export Index
**File:** `src/shared/components/kudos/index.ts`
- [ ] Export all Kudos components

---

## Module 2A: Court Management Module
**Reference:** `03-phase2-court-management.md`  
**Estimated Time:** 2 days  
**Dependencies:** 1B (Organization) + 1C (Court Discovery) complete

### Directory Setup
- [ ] Extend `src/modules/court/` with:
  ```
  court/
  ├── court-management.router.ts    # New
  ├── dtos/
  │   ├── create-court.dto.ts       # New
  │   ├── update-court.dto.ts       # New
  │   ├── add-photo.dto.ts          # New
  │   └── add-amenity.dto.ts        # New
  ├── repositories/
  │   ├── court.repository.ts       # Extend with write methods
  │   ├── court-photo.repository.ts # New
  │   └── court-amenity.repository.ts # New
  ├── services/
  │   └── court-management.service.ts # New
  └── use-cases/
      └── create-reservable-court.use-case.ts # New
  ```

### Implementation
- [ ] Extend `court.errors.ts`
  - [ ] `NotCourtOwnerError` extends AuthorizationError
  - [ ] `InvalidCourtTypeError` extends ValidationError
  - [ ] `DuplicateAmenityError` extends ConflictError
  - [ ] `MaxPhotosExceededError` extends ValidationError
  - [ ] `PhotoNotFoundError` extends NotFoundError
  - [ ] `AmenityNotFoundError` extends NotFoundError
- [ ] Create DTOs
  - [ ] `CreateCourtSchema` with court type refinement
  - [ ] `UpdateCourtSchema`
  - [ ] `AddPhotoSchema`
  - [ ] `AddAmenitySchema`
  - [ ] `RemovePhotoSchema`, `ReorderPhotosSchema`, `RemoveAmenitySchema`
- [ ] Create `court-photo.repository.ts`
  - [ ] `ICourtPhotoRepository` interface
  - [ ] Methods: `findByCourtId`, `create`, `delete`, `updateDisplayOrder`, `countByCourtId`
- [ ] Create `court-amenity.repository.ts`
  - [ ] `ICourtAmenityRepository` interface
  - [ ] Methods: `findByCourtId`, `create`, `delete`, `exists`
- [ ] Create/extend detail repositories
  - [ ] `ICuratedCourtDetailRepository`
  - [ ] `IReservableCourtDetailRepository`
- [ ] Extend `court.repository.ts` with write methods
  - [ ] `create`, `update`, `findByOrganizationId`
- [ ] Create `court-management.service.ts`
  - [ ] `ICourtManagementService` interface
  - [ ] Implement all methods with owner authorization
  - [ ] Max 10 photos enforcement
- [ ] Create `create-reservable-court.use-case.ts`
  - [ ] Transaction: create court + detail
  - [ ] Verify organization ownership
- [ ] Create `court-management.router.ts`
  - [ ] All endpoints with protected + rate limiting
- [ ] Update factories
- [ ] Register router in root.ts

### Testing
- [ ] Can create curated court
- [ ] Can create reservable court
- [ ] Owner authorization works
- [ ] Can add/remove photos
- [ ] Photo limit (10) enforced
- [ ] Can add/remove amenities
- [ ] Duplicate amenity prevention works
- [ ] Can update court details
- [ ] Can deactivate court
- [ ] No TypeScript errors

### Handoff
- [ ] Court Management ready for Time Slots (2B)
- [ ] Update `00-overview.md` to mark 2A complete

---

## UI-1B: Discovery - Hero & Navbar (PARALLEL with 2A)
**Reference:** `00-ui/02-ui-discovery.md`  
**Estimated Time:** 1.5 days  
**Dependencies:** UI-1A complete  
**Can parallelize with:** Backend 2A

### Navbar Component
**File:** `src/features/discovery/components/navbar.tsx`
- [ ] Fixed position with floating margin (top-4 left-4 right-4)
- [ ] Glassmorphism effect (bg-card/80 backdrop-blur-md)
- [ ] Logo on left
- [ ] Search input (expandable on mobile)
- [ ] Auth buttons on right (Sign In, List Your Court)
- [ ] Mobile menu (hamburger)
- [ ] Scroll detection for shadow

### Hero Section Component
**File:** `src/features/discovery/components/hero-section.tsx`
- [ ] Gradient background (primary-light to background)
- [ ] Large heading (display size, Outfit 800)
- [ ] Subtitle (muted-foreground)
- [ ] Large search input with button
- [ ] Popular cities links (accent color, hover underline)

### Search Input Component
**File:** `src/features/discovery/components/search-input.tsx`
- [ ] Large variant for hero (h-14)
- [ ] Icon prefix (Search)
- [ ] Clear button
- [ ] Form submission handling

---

## UI-1C: Discovery - Home Page (After Backend 1C Ready)
**Reference:** `00-ui/02-ui-discovery.md`  
**Estimated Time:** 2 days  
**Dependencies:** Backend 1C (Court Discovery) complete

### Home Page Setup
**File:** `src/app/(public)/page.tsx`
- [ ] Server component for initial data fetch
- [ ] Navbar integration
- [ ] Hero section integration
- [ ] Bento grid layout

### Bento Grid Integration
- [ ] Featured court (8 cols, 2 rows)
- [ ] Medium courts (4 cols)
- [ ] Small courts (4 cols)
- [ ] Promotional banner (12 cols)

### Data Fetching Hook
**File:** `src/features/discovery/hooks/use-discovery.ts`
- [ ] `useDiscovery()` hook
- [ ] Fetch featured courts
- [ ] Loading/error state handling

### Loading & Empty States
- [ ] Court card skeletons
- [ ] Staggered fade-in animation
- [ ] Empty state with CTA

---

## UI-1D: Discovery - Search Results
**Reference:** `00-ui/02-ui-discovery.md`  
**Estimated Time:** 1.5 days  
**Dependencies:** UI-1C complete

### Search Results Page
**File:** `src/app/(public)/courts/page.tsx`
- [ ] Page header with result count
- [ ] Filters bar
- [ ] Results grid (4 columns)
- [ ] Pagination

### Filters Component
**File:** `src/features/discovery/components/court-filters.tsx`
- [ ] City dropdown
- [ ] Court type filter
- [ ] Price filter (Free/Paid)
- [ ] Amenities multi-select
- [ ] Clear filters button
- [ ] Mobile filter drawer

### URL State Integration
**File:** `src/features/discovery/hooks/use-discovery-filters.ts`
- [ ] nuqs integration for filters
- [ ] Sync state with URL
- [ ] Debounce filter changes

### Pagination Component
**File:** `src/shared/components/kudos/pagination.tsx`
- [ ] Page numbers with ellipsis
- [ ] Previous/Next buttons

---

## Module 3A: Reservation Core Module
**Reference:** `04-phase3-reservations.md`  
**Estimated Time:** 3 days  
**Dependencies:** 1A (Profile) + 2B (Time Slot) complete

### Directory Setup
- [ ] Create `src/modules/reservation/` directory structure:
  ```
  reservation/
  ├── reservation.router.ts
  ├── dtos/
  │   ├── index.ts
  │   ├── create-reservation.dto.ts
  │   ├── mark-payment.dto.ts
  │   └── cancel-reservation.dto.ts
  ├── errors/
  │   └── reservation.errors.ts
  ├── factories/
  │   └── reservation.factory.ts
  ├── repositories/
  │   ├── reservation.repository.ts
  │   └── reservation-event.repository.ts
  ├── services/
  │   └── reservation.service.ts
  └── use-cases/
      ├── create-free-reservation.use-case.ts
      └── create-paid-reservation.use-case.ts
  ```

### Implementation
- [ ] Create `reservation.errors.ts`
  - [ ] `ReservationNotFoundError`
  - [ ] `SlotNotAvailableError`
  - [ ] `ReservationExpiredError`
  - [ ] `InvalidReservationStatusError`
  - [ ] `NotReservationOwnerError`
  - [ ] `TermsNotAcceptedError`
- [ ] Create DTOs
  - [ ] `CreateReservationSchema`
  - [ ] `MarkPaymentSchema` (with termsAccepted: z.literal(true))
  - [ ] `CancelReservationSchema`
  - [ ] `GetMyReservationsSchema`
- [ ] Create `reservation.repository.ts`
  - [ ] `IReservationRepository` interface
  - [ ] Methods: `findById`, `findByIdForUpdate`, `findByPlayerId`, `findByTimeSlotId`, `findActiveByTimeSlotId`, `create`, `update`
- [ ] Create `reservation-event.repository.ts`
  - [ ] `IReservationEventRepository` interface
  - [ ] Methods: `findByReservationId`, `create`
- [ ] Create `reservation.service.ts`
  - [ ] `IReservationService` interface
  - [ ] Methods: `createReservation`, `markPayment`, `cancelReservation`, `getReservationById`, `getMyReservations`
- [ ] Create use cases
  - [ ] `CreateFreeReservationUseCase` - immediate confirmation
  - [ ] `CreatePaidReservationUseCase` - 15 min TTL, AWAITING_PAYMENT status
  - [ ] Both: snapshot player info, update slot status, create audit event
- [ ] Create `reservation.router.ts`
  - [ ] `reservation.create` - protected + rateLimited(sensitive)
  - [ ] `reservation.markPayment` - protected
  - [ ] `reservation.cancel` - protected
  - [ ] `reservation.getById` - protected
  - [ ] `reservation.getMy` - protected
- [ ] Create factories
- [ ] Register router in root.ts

### Testing
- [ ] Can create free court reservation (immediate confirmation)
- [ ] Can create paid court reservation (AWAITING_PAYMENT status)
- [ ] Slot becomes HELD for paid reservations
- [ ] Slot becomes BOOKED for free reservations
- [ ] Player snapshot captured correctly
- [ ] TTL set correctly (15 minutes)
- [ ] Can mark payment (status transition)
- [ ] Terms acceptance required for mark payment
- [ ] Cannot mark payment after expiry
- [ ] Can cancel reservation
- [ ] Slot released on cancellation
- [ ] Audit events created for all transitions
- [ ] Only reservation owner can perform actions
- [ ] No TypeScript errors

### Handoff
- [ ] Reservation Core ready for Owner (3B) and Payment Proof (3C)
- [ ] Notify Dev 2 and Dev 3 that 3A is complete
- [ ] Update `00-overview.md` to mark 3A complete

---

## Final Checklist

### Backend
- [ ] All backend modules complete and tested (0A, 1A, 2A, 3A)
- [ ] No TypeScript errors in codebase
- [ ] All routers registered in root.ts
- [ ] Integration tested with other developers' modules

### UI
- [ ] UI Foundation complete (UI-0A)
- [ ] Core Kudos components complete (UI-1A)
- [ ] Discovery pages complete (UI-1B, UI-1C, UI-1D)
- [ ] All pages responsive (mobile, tablet, desktop)
- [ ] Loading/error/empty states implemented
- [ ] Accessibility checked

### Documentation
- [ ] `00-overview.md` updated with completion status
- [ ] Handoffs documented

---

## Parallelization Summary

| Day | Backend Task | UI Task |
|-----|--------------|---------|
| 1 | 0A: Rate Limiting | UI-0A: Foundation Setup |
| 2 | 1A: Profile Module | UI-0A: shadcn + UI-1A: Core Components |
| 3 | 1A: Profile (cont.) | UI-1A: Core Components (cont.) |
| 4 | 2A: Court Management | UI-1B: Hero & Navbar |
| 5 | 2A: Court Management (cont.) | UI-1C: Home Page |
| 6 | Wait for 2B | UI-1C: Home Page (cont.) |
| 7 | 3A: Reservation Core | UI-1D: Search Results |
| 8 | 3A: Reservation Core (cont.) | UI-1D: Search Results (cont.) |
| 9 | 3A: Reservation Core (cont.) | Integration testing |
| 10 | Testing & Handoff | Polish & Handoff |
