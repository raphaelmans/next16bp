# Developer 2 Checklist

**Focus Area:** Admin + Owner Flow + Court Detail & Booking UI  
**Backend Modules:** 0B → 1B → 2B → 3B  
**UI Modules:** Layout Components → Court Detail → Booking Flow

---

## Module 0B: Admin Role System
**Reference:** `01-infrastructure.md`  
**Estimated Time:** 0.5 day  
**Dependencies:** None (can start with Dev 1's 0A)

### Implementation
- [ ] Update `src/shared/infra/trpc/trpc.ts`
  - [ ] Add `adminMiddleware` that checks `ctx.session.role === "admin"`
  - [ ] Throw TRPCError FORBIDDEN if not admin
  - [ ] Add `adminProcedure` export
  - [ ] Add `adminRateLimitedProcedure(tier)` export (after 0A ready)
- [ ] Verify `src/shared/kernel/auth.ts` Session type includes `"admin"` role
- [ ] Document admin role assignment process in comments

### Testing
- [ ] adminProcedure rejects unauthenticated requests (UNAUTHORIZED)
- [ ] adminProcedure rejects non-admin users (FORBIDDEN)
- [ ] adminProcedure allows admin users
- [ ] Error messages are appropriate

### Handoff
- [ ] Admin procedure ready for use by Dev 4 (Claim Admin 4B)
- [ ] Update `00-overview.md` to mark 0B complete

---

## UI-0B: Layout Components (PARALLEL with 0B)
**Reference:** `00-ui/01-ui-foundation.md`  
**Estimated Time:** 1 day  
**Dependencies:** Dev 1's UI-0A fonts ready  
**Can parallelize with:** Backend 0B

### Container Component
**File:** `src/shared/components/layout/container.tsx`
- [ ] Create Container component
- [ ] Size variants: `sm`, `md`, `lg`, `xl`, `full`
- [ ] Responsive padding (px-4 sm:px-6 lg:px-8)
- [ ] Center with mx-auto

### PageLayout Component
**File:** `src/shared/components/layout/page-layout.tsx`
- [ ] Create PageLayout component
- [ ] Optional title and description
- [ ] Optional actions slot
- [ ] Header with border-b
- [ ] Container integration

### BentoGrid Components
**File:** `src/shared/components/layout/bento-grid.tsx`
- [ ] Create BentoGrid component
  - [ ] 12-column grid system
  - [ ] Gap spacing (gap-5)
  - [ ] Responsive columns (1 → 2 → 6 → 12)
- [ ] Create BentoItem component
  - [ ] colSpan prop (1-12)
  - [ ] rowSpan prop (1-3)
  - [ ] Responsive span adjustments

### DashboardLayout Component
**File:** `src/shared/components/layout/dashboard-layout.tsx`
- [ ] Sidebar + main content layout
- [ ] Desktop: Fixed sidebar (w-64)
- [ ] Mobile: Sheet/drawer sidebar
- [ ] Dashboard navbar integration

### Layout Index Export
**File:** `src/shared/components/layout/index.ts`
- [ ] Export all layout components

### Handoff
- [ ] Layout components ready for all pages
- [ ] Notify Dev 1 and Dev 4 that layouts are ready

---

## Module 1B: Organization Module
**Reference:** `02-phase1-foundation.md`  
**Estimated Time:** 2 days  
**Dependencies:** 0A + 0B complete

### Directory Setup
- [ ] Create `src/modules/organization/` directory structure:
  ```
  organization/
  ├── organization.router.ts
  ├── dtos/
  │   ├── index.ts
  │   ├── create-organization.dto.ts
  │   ├── update-organization.dto.ts
  │   └── update-organization-profile.dto.ts
  ├── errors/
  │   └── organization.errors.ts
  ├── factories/
  │   └── organization.factory.ts
  ├── repositories/
  │   ├── organization.repository.ts
  │   └── organization-profile.repository.ts
  ├── services/
  │   └── organization.service.ts
  └── utils/
      └── slug.utils.ts
  ```

### Implementation
- [ ] Create `organization.errors.ts`
  - [ ] `OrganizationNotFoundError` extends NotFoundError
  - [ ] `SlugAlreadyExistsError` extends ConflictError
  - [ ] `NotOrganizationOwnerError` extends AuthorizationError
- [ ] Create `slug.utils.ts`
  - [ ] `generateSlug(name)` - convert name to URL-friendly slug
  - [ ] `generateUniqueSlug(name, checkExists)` - handle collisions with counter
- [ ] Create DTOs
  - [ ] `CreateOrganizationSchema` - name required, slug optional (auto-generate)
  - [ ] `UpdateOrganizationSchema` - id required, fields optional
  - [ ] `UpdateOrganizationProfileSchema`
  - [ ] Export types and schemas from `dtos/index.ts`
- [ ] Create `organization.repository.ts`
  - [ ] `IOrganizationRepository` interface
  - [ ] Methods: `findById`, `findBySlug`, `findByOwnerId`, `create`, `update`, `slugExists`
  - [ ] Support `RequestContext` for transactions
- [ ] Create `organization-profile.repository.ts`
  - [ ] `IOrganizationProfileRepository` interface
  - [ ] Methods: `findByOrganizationId`, `create`, `update`
- [ ] Create `organization.service.ts`
  - [ ] `IOrganizationService` interface
  - [ ] `createOrganization` - auto-generate unique slug, create profile in transaction
  - [ ] `getOrganization`, `getOrganizationBySlug`
  - [ ] `getMyOrganizations` - list user's organizations
  - [ ] `updateOrganization` - owner authorization check
  - [ ] `updateOrganizationProfile` - owner authorization check
- [ ] Create `organization.factory.ts`
  - [ ] Lazy singleton factories for repositories and service
- [ ] Create `organization.router.ts`
  - [ ] `organization.create` - protected + rateLimited(mutation)
  - [ ] `organization.get` - public
  - [ ] `organization.getBySlug` - public
  - [ ] `organization.my` - protected
  - [ ] `organization.update` - protected
  - [ ] `organization.updateProfile` - protected
- [ ] Register router in `src/shared/infra/trpc/root.ts`

### Testing
- [ ] Can create organization with auto-generated slug
- [ ] Can create organization with custom slug
- [ ] Slug auto-generation handles collisions (adds -1, -2, etc.)
- [ ] Rejects duplicate slugs on manual input
- [ ] Only owner can update organization
- [ ] Organization profile created automatically with org
- [ ] Can update organization profile
- [ ] Can list my organizations
- [ ] Public endpoints work without auth
- [ ] No TypeScript errors

### Handoff
- [ ] Organization module ready for Court Management (2A) and Claim Request (4A)
- [ ] Notify Dev 1 and Dev 4
- [ ] Update `00-overview.md` to mark 1B complete

---

## UI-1E: Court Detail Page - Structure (PARALLEL with 1B)
**Reference:** `00-ui/02-ui-discovery.md`  
**Estimated Time:** 1.5 days  
**Dependencies:** UI-0B Layout complete, Dev 1's UI-1A complete  
**Can parallelize with:** Backend 1B

### Court Detail Page Setup
**File:** `src/app/(public)/courts/[id]/page.tsx`
- [ ] Server component with data fetching
- [ ] Breadcrumb navigation
- [ ] Two-column layout (content + sticky sidebar)
- [ ] Mobile: Single column

### Breadcrumb Component
**File:** `src/shared/components/kudos/breadcrumb.tsx`
- [ ] Home > Courts > {Court Name} pattern
- [ ] Link styling (accent color)
- [ ] Current page non-clickable

### Photo Gallery Component
**File:** `src/features/discovery/components/photo-gallery.tsx`
- [ ] Main photo display (aspect-[4/3])
- [ ] Thumbnail grid (4 visible)
- [ ] "+X more" indicator
- [ ] Lightbox modal on click
- [ ] Placeholder for no photos
- [ ] Lazy loading

### Court Info Section
**File:** `src/features/discovery/components/court-info.tsx`
- [ ] Court name with badge
- [ ] Address with MapPin icon
- [ ] Organization link (for reservable)

### Amenities Display
**File:** `src/features/discovery/components/amenities-list.tsx`
- [ ] Grid of amenity chips
- [ ] Icons for common amenities

### Contact Section (Curated)
**File:** `src/features/discovery/components/contact-section.tsx`
- [ ] Grid of contact methods
- [ ] Facebook, Instagram, Viber, Website icons
- [ ] External link behavior

---

## Module 2B: Time Slot Module
**Reference:** `03-phase2-court-management.md`  
**Estimated Time:** 2 days  
**Dependencies:** 2A (Court Management) complete

### Directory Setup
- [ ] Create `src/modules/time-slot/` directory structure:
  ```
  time-slot/
  ├── time-slot.router.ts
  ├── dtos/
  │   ├── index.ts
  │   ├── create-time-slot.dto.ts
  │   ├── create-bulk-time-slots.dto.ts
  │   ├── update-slot-price.dto.ts
  │   └── get-available-slots.dto.ts
  ├── errors/
  │   └── time-slot.errors.ts
  ├── factories/
  │   └── time-slot.factory.ts
  ├── repositories/
  │   └── time-slot.repository.ts
  └── services/
      └── time-slot.service.ts
  ```

### Implementation
- [ ] Create `time-slot.errors.ts`
  - [ ] `SlotNotFoundError` extends NotFoundError
  - [ ] `SlotOverlapError` extends ConflictError
  - [ ] `SlotNotAvailableError` extends ValidationError
  - [ ] `InvalidSlotDurationError` extends ValidationError
  - [ ] `CourtNotReservableError` extends ValidationError
  - [ ] `SlotInUseError` extends ValidationError
- [ ] Create DTOs
  - [ ] `GetAvailableSlotsSchema` - courtId, startDate, endDate
  - [ ] `CreateTimeSlotSchema` - with refinements for endTime > startTime, price/currency consistency
  - [ ] `CreateBulkTimeSlotsSchema` - array of slots, max 100
  - [ ] `UpdateSlotPriceSchema` - nullable price/currency with consistency check
- [ ] Create `time-slot.repository.ts`
  - [ ] `ITimeSlotRepository` interface
  - [ ] `findById`, `findByIdForUpdate` (SELECT FOR UPDATE)
  - [ ] `findByCourtAndDateRange(courtId, startDate, endDate, status?)`
  - [ ] `findAvailable(courtId, startDate, endDate)`
  - [ ] `findOverlapping(courtId, startTime, endTime, excludeId?)` - **critical for validation**
  - [ ] `create`, `createMany`, `update`, `delete`
- [ ] Create `time-slot.service.ts`
  - [ ] `ITimeSlotService` interface
  - [ ] `getAvailableSlots` - public query
  - [ ] `getSlotById`
  - [ ] `createSlot` - verify court ownership, check RESERVABLE type, check overlaps
  - [ ] `createBulkSlots` - same validations for each slot
  - [ ] `blockSlot` - only AVAILABLE slots can be blocked
  - [ ] `unblockSlot` - only BLOCKED slots can be unblocked
  - [ ] `updateSlotPrice` - only AVAILABLE slots
  - [ ] `deleteSlot` - only AVAILABLE slots
- [ ] Create `time-slot.factory.ts`
  - [ ] Lazy singleton factories
- [ ] Create `time-slot.router.ts`
  - [ ] `timeSlot.getAvailable` - public
  - [ ] `timeSlot.create` - protected + rateLimited(mutation)
  - [ ] `timeSlot.createBulk` - protected + rateLimited(sensitive)
  - [ ] `timeSlot.block` - protected
  - [ ] `timeSlot.unblock` - protected
  - [ ] `timeSlot.updatePrice` - protected
  - [ ] `timeSlot.delete` - protected
- [ ] Register router in root.ts

### Overlap Detection Query
```typescript
// In repository - find slots that overlap with given time range
async findOverlapping(courtId, startTime, endTime, excludeId?) {
  // Overlap condition: existing.start < new.end AND existing.end > new.start
  return db.select()
    .from(timeSlot)
    .where(and(
      eq(timeSlot.courtId, courtId),
      lt(timeSlot.startTime, endTime),
      gt(timeSlot.endTime, startTime),
      excludeId ? ne(timeSlot.id, excludeId) : undefined
    ));
}
```

### Testing
- [ ] Can create single slot
- [ ] Can create bulk slots (up to 100)
- [ ] Overlap detection works correctly
- [ ] Rejects overlapping slots
- [ ] Only RESERVABLE courts accept slots
- [ ] Owner authorization works (via court → organization → owner)
- [ ] Can block AVAILABLE slots
- [ ] Can unblock BLOCKED slots
- [ ] Cannot modify BOOKED or HELD slots
- [ ] Price/currency consistency enforced (both or neither)
- [ ] Can query available slots by date range
- [ ] Can delete AVAILABLE slots only
- [ ] No TypeScript errors

### Handoff
- [ ] Time Slot module ready for Reservation Core (3A)
- [ ] Notify Dev 1 that 2B is complete
- [ ] Update `00-overview.md` to mark 2B complete

---

## UI-1F: Court Detail - Booking Card (PARALLEL with 2B)
**Reference:** `00-ui/02-ui-discovery.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-1E complete  
**Can parallelize with:** Backend 2B

### Booking Card Component
**File:** `src/features/discovery/components/booking-card.tsx`
- [ ] Sticky positioning (top-24 on desktop)
- [ ] Price display (Outfit 700, large)
- [ ] "FREE" badge for free courts
- [ ] Date picker integration
- [ ] Time slot grid
- [ ] Reserve Now CTA button
- [ ] Curated court: Contact info instead

### KudosDatePicker Component
**File:** `src/shared/components/kudos/date-picker.tsx`
- [ ] Popover with Calendar
- [ ] Min date (today)
- [ ] Max date (optional)
- [ ] Date formatting
- [ ] Clear functionality

### KudosTimeSlotPicker Component
**File:** `src/shared/components/kudos/time-slot-picker.tsx`
- [ ] Grid layout (4 cols desktop, 3 tablet, 2 mobile)
- [ ] Slot button styling:
  - [ ] Available: success-light bg, success text
  - [ ] Booked: muted bg, line-through
  - [ ] Blocked: muted bg, disabled
  - [ ] Held: warning-light bg
  - [ ] Selected: primary-light bg, primary border, ring
- [ ] Time format (12-hour)
- [ ] Optional price per slot
- [ ] Click handler for selection

### Data Fetching
**File:** `src/features/discovery/hooks/use-court-detail.ts`
- [ ] `useCourtDetail(courtId)` hook
- [ ] Fetch court with details

### Slot Availability Hook
**File:** `src/features/discovery/hooks/use-available-slots.ts`
- [ ] `useAvailableSlots(courtId, date)` hook
- [ ] Fetch slots for selected date
- [ ] Re-fetch on date change

---

## UI-1G: Organization Profile Page (PARALLEL with 2B)
**Reference:** `00-ui/02-ui-discovery.md`  
**Estimated Time:** 1 day  
**Dependencies:** UI-1E complete

### Organization Profile Page
**File:** `src/app/(public)/org/[slug]/page.tsx`
- [ ] Server component with data fetching
- [ ] Organization header (logo, name, contact)
- [ ] Description section
- [ ] Courts grid

### Organization Header Component
**File:** `src/features/discovery/components/org-header.tsx`
- [ ] Logo display (or initial placeholder)
- [ ] Organization name
- [ ] Contact info

### Data Fetching
**File:** `src/features/discovery/hooks/use-organization.ts`
- [ ] `useOrganization(slug)` hook
- [ ] Fetch org's courts

---

## Module 3B: Reservation Owner Module
**Reference:** `04-phase3-reservations.md`  
**Estimated Time:** 2 days  
**Dependencies:** 3A (Reservation Core) complete

### Directory Setup
- [ ] Extend `src/modules/reservation/` with:
  ```
  reservation/
  ├── reservation-owner.router.ts    # New
  ├── dtos/
  │   ├── confirm-payment.dto.ts     # New
  │   └── reject-reservation.dto.ts  # New
  └── services/
      └── reservation-owner.service.ts # New
  ```

### Implementation
- [ ] Create additional DTOs
  - [ ] `ConfirmPaymentSchema` - reservationId, optional notes
  - [ ] `RejectReservationSchema` - reservationId, required reason
  - [ ] `GetOrgReservationsSchema` - filters for listing
- [ ] Create `reservation-owner.service.ts`
  - [ ] `IReservationOwnerService` interface
  - [ ] `confirmPayment(userId, reservationId, notes?)`
    - [ ] Verify user owns court's organization
    - [ ] Verify status is PAYMENT_MARKED_BY_USER
    - [ ] Update reservation status → CONFIRMED
    - [ ] Update slot status → BOOKED
    - [ ] Create audit event (triggered_by_role: OWNER)
  - [ ] `rejectReservation(userId, reservationId, reason)`
    - [ ] Verify ownership
    - [ ] Verify status is AWAITING_PAYMENT or PAYMENT_MARKED_BY_USER
    - [ ] Update reservation status → CANCELLED
    - [ ] Release slot → AVAILABLE
    - [ ] Create audit event
  - [ ] `getPendingForCourt(userId, courtId)` - list PAYMENT_MARKED_BY_USER reservations
  - [ ] `getForOrganization(userId, orgId, filters)` - all reservations for org's courts
- [ ] Create `reservation-owner.router.ts`
  - [ ] `reservationOwner.confirmPayment` - protected
  - [ ] `reservationOwner.reject` - protected
  - [ ] `reservationOwner.getPendingForCourt` - protected
  - [ ] `reservationOwner.getForOrganization` - protected
- [ ] Update factories
- [ ] Register router in root.ts

### Helper: Verify Court Ownership
```typescript
async verifyCourtOwnership(userId: string, timeSlotId: string): Promise<void> {
  const slot = await this.timeSlotRepo.findById(timeSlotId);
  const court = await this.courtRepo.findById(slot.courtId);
  const org = await this.orgRepo.findById(court.organizationId);
  
  if (org.ownerUserId !== userId) {
    throw new NotCourtOwnerError();
  }
}
```

### Testing
- [ ] Owner can confirm payment
- [ ] Only owner can confirm (non-owners get FORBIDDEN)
- [ ] Can only confirm PAYMENT_MARKED_BY_USER status
- [ ] Slot becomes BOOKED after confirmation
- [ ] Owner can reject reservation
- [ ] Can reject AWAITING_PAYMENT or PAYMENT_MARKED_BY_USER
- [ ] Slot released (AVAILABLE) after rejection
- [ ] Audit events created with OWNER role
- [ ] Can list pending reservations for a court
- [ ] Can list all reservations for organization
- [ ] No TypeScript errors

### Handoff
- [ ] Reservation Owner module complete
- [ ] Full reservation flow now works end-to-end
- [ ] Update `00-overview.md` to mark 3B complete

---

## UI-2A: Booking Flow - Book Slot Page (PARALLEL with 3B)
**Reference:** `00-ui/03-ui-reservation.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-1F complete, Backend 3A ready  
**Can parallelize with:** Backend 3B

### Book Slot Page
**File:** `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx`
- [ ] Auth-protected route
- [ ] Breadcrumb navigation
- [ ] Two-column layout

### Booking Summary Card
**File:** `src/features/reservation/components/booking-summary-card.tsx`
- [ ] Court image
- [ ] Court name and location
- [ ] Date formatted
- [ ] Time range

### Profile Preview Card
**File:** `src/features/reservation/components/profile-preview-card.tsx`
- [ ] Display name, email, phone
- [ ] Edit link
- [ ] Warning if profile incomplete

### Payment Info Card
**File:** `src/features/reservation/components/payment-info-card.tsx`
- [ ] Payment methods (GCash, Bank)
- [ ] Copy button for numbers
- [ ] TTL warning (15 min)

### Order Summary (Sticky)
**File:** `src/features/reservation/components/order-summary.tsx`
- [ ] Sticky positioning
- [ ] Date/time summary
- [ ] Price breakdown
- [ ] Terms checkbox
- [ ] Confirm button with loading

### Create Reservation Hook
**File:** `src/features/reservation/hooks/use-create-reservation.ts`
- [ ] Mutation setup
- [ ] Success redirect logic

---

## UI-2B: Booking Flow - Payment Page (After UI-2A)
**Reference:** `00-ui/03-ui-reservation.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-2A complete

### Payment Page
**File:** `src/app/(auth)/reservations/[id]/payment/page.tsx`
- [ ] Timer banner at top
- [ ] Two-column layout
- [ ] Order summary sidebar

### KudosCountdown Component
**File:** `src/shared/components/kudos/countdown.tsx`
- [ ] Calculate time remaining
- [ ] Update every second
- [ ] Color changes (normal → warning → destructive)
- [ ] Pulse animation when < 2 min
- [ ] onExpire callback

### Timer Banner
**File:** `src/features/reservation/components/timer-banner.tsx`
- [ ] Fixed banner style
- [ ] Warning background
- [ ] Countdown integration

### Payment Method Card
**File:** `src/features/reservation/components/payment-method-card.tsx`
- [ ] GCash card
- [ ] Bank transfer card
- [ ] Copy to clipboard
- [ ] Toast on copy

### KudosFileUpload Component
**File:** `src/shared/components/kudos/file-upload.tsx`
- [ ] Drag and drop zone
- [ ] Click to browse
- [ ] File type validation
- [ ] Size validation
- [ ] Preview image
- [ ] Delete uploaded

### Payment Proof Form
**File:** `src/features/reservation/components/payment-proof-form.tsx`
- [ ] Reference number input
- [ ] File upload (optional)
- [ ] Notes textarea
- [ ] Submit button

### Mark Payment Hook
**File:** `src/features/reservation/hooks/use-mark-payment.ts`
- [ ] Mutation setup
- [ ] Success redirect

---

## Final Checklist

### Backend
- [ ] All backend modules complete and tested (0B, 1B, 2B, 3B)
- [ ] No TypeScript errors in codebase
- [ ] All routers registered in root.ts
- [ ] Admin procedure working correctly
- [ ] Owner authorization chain working (user → org → court → slot)

### UI
- [ ] Layout components complete (UI-0B)
- [ ] Court detail page complete (UI-1E, UI-1F)
- [ ] Org profile page complete (UI-1G)
- [ ] Booking flow complete (UI-2A, UI-2B)
- [ ] All pages responsive
- [ ] Loading/error states implemented

### Integration
- [ ] Integration tested with Dev 1's modules
- [ ] End-to-end booking flow works

### Documentation
- [ ] `00-overview.md` updated with completion status

---

## Parallelization Summary

| Day | Backend Task | UI Task |
|-----|--------------|---------|
| 1 | 0B: Admin Role | UI-0B: Layout Components |
| 2 | 1B: Organization | UI-0B (cont.) + UI-1E: Court Detail Structure |
| 3 | 1B: Organization (cont.) | UI-1E (cont.) |
| 4 | Wait for Dev 1's 2A | UI-1F: Booking Card + Slot Picker |
| 5 | 2B: Time Slot | UI-1F (cont.) + UI-1G: Org Profile |
| 6 | 2B: Time Slot (cont.) | UI-2A: Book Slot Page |
| 7 | Wait for Dev 1's 3A | UI-2A (cont.) |
| 8 | 3B: Reservation Owner | UI-2B: Payment Page |
| 9 | 3B (cont.) | UI-2B (cont.) |
| 10 | Testing & Handoff | Integration testing |
