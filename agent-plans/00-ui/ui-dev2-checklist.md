# UI Developer 2 Checklist

**Focus Area:** Layout + Court Detail + Time Slots  
**Modules:** Layout Components → Court Detail → Time Slot Picker

---

## Phase UI-0B: Layout Components

**Reference:** `01-ui-foundation.md`  
**Estimated Time:** 1 day  
**Dependencies:** UI Dev 1 (UI-0A) complete  
**Can parallelize with:** UI Dev 1 (Base Components)

### Container Component
**File:** `src/shared/components/layout/container.tsx`
- [ ] Create Container component
- [ ] Size variants: `sm`, `md`, `lg`, `xl`, `full`
- [ ] Responsive padding (px-4 sm:px-6 lg:px-8)
- [ ] Center with mx-auto
- [ ] Export from layout index

### PageLayout Component
**File:** `src/shared/components/layout/page-layout.tsx`
- [ ] Create PageLayout component
- [ ] Optional title and description
- [ ] Optional actions slot
- [ ] Header with border-b
- [ ] Container integration
- [ ] Min-height for page content

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

### Testing
- [ ] Container centers correctly
- [ ] BentoGrid responsive behavior
- [ ] DashboardLayout sidebar collapse on mobile
- [ ] No overflow issues

### Handoff
- [ ] Layout components ready for all pages

---

## Phase UI-1E: Court Detail Page - Structure

**Reference:** `02-ui-discovery.md`  
**Estimated Time:** 1.5 days  
**Dependencies:** UI-0B complete, UI Dev 1 (UI-1A) complete  
**Can parallelize with:** UI Dev 1 (Hero & Search)

### Court Detail Page Setup
**File:** `src/app/(public)/courts/[id]/page.tsx`
- [ ] Server component with data fetching
- [ ] Breadcrumb navigation
- [ ] Two-column layout (content + sticky sidebar)
- [ ] Mobile: Single column, booking card at bottom

### Breadcrumb Component
**File:** `src/shared/components/kudos/breadcrumb.tsx`
- [ ] Create Breadcrumb component
- [ ] Home > Courts > {Court Name} pattern
- [ ] Link styling (accent color)
- [ ] Current page non-clickable

### Photo Gallery Component
**File:** `src/features/discovery/components/photo-gallery.tsx`
- [ ] Main photo display (aspect-[4/3] desktop, 16/9 mobile)
- [ ] Thumbnail grid (4 visible)
- [ ] "+X more" indicator
- [ ] Lightbox modal on click
- [ ] Placeholder for no photos (teal gradient)
- [ ] Lazy loading

### Court Info Section
**File:** `src/features/discovery/components/court-info.tsx`
- [ ] Court name with badge
- [ ] Address with MapPin icon
- [ ] Organization link (for reservable)
- [ ] Description text

### Amenities Display
**File:** `src/features/discovery/components/amenities-list.tsx`
- [ ] Grid of amenity chips
- [ ] Icons for common amenities
- [ ] Responsive layout

### Contact Section (Curated)
**File:** `src/features/discovery/components/contact-section.tsx`
- [ ] Grid of contact methods
- [ ] Facebook, Instagram, Viber, Website icons
- [ ] External link behavior
- [ ] Copy phone number

### Testing
- [ ] Page loads with data
- [ ] Photo gallery works
- [ ] Lightbox opens/closes
- [ ] Contact links work
- [ ] Mobile layout correct

---

## Phase UI-1F: Court Detail Page - Booking Card

**Reference:** `02-ui-discovery.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-1E complete  
**Can parallelize with:** UI Dev 1 (Home Page)

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
- [ ] Max date (optional, e.g., 30 days)
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
- [ ] Conditional slot fetch (only RESERVABLE)

### Slot Availability Hook
**File:** `src/features/discovery/hooks/use-available-slots.ts`
- [ ] `useAvailableSlots(courtId, date)` hook
- [ ] Fetch slots for selected date
- [ ] Re-fetch on date change
- [ ] Loading state

### Testing
- [ ] Date picker works
- [ ] Slots load for selected date
- [ ] Slot selection works
- [ ] Reserve button navigates correctly
- [ ] Sticky card behavior on scroll

---

## Phase UI-1G: Organization Profile Page

**Reference:** `02-ui-discovery.md`  
**Estimated Time:** 1 day  
**Dependencies:** UI-1E complete

### Organization Profile Page
**File:** `src/app/(public)/org/[slug]/page.tsx`
- [ ] Server component with data fetching
- [ ] Organization header (logo, name, contact)
- [ ] Description section
- [ ] Courts grid (organization's courts)

### Organization Header Component
**File:** `src/features/discovery/components/org-header.tsx`
- [ ] Logo display (or initial placeholder)
- [ ] Organization name
- [ ] Contact info (email, phone, address)
- [ ] Description text

### Data Fetching
**File:** `src/features/discovery/hooks/use-organization.ts`
- [ ] `useOrganization(slug)` hook
- [ ] Fetch org by slug
- [ ] Fetch org's courts

### Testing
- [ ] Page loads correctly
- [ ] Courts display in grid
- [ ] Contact info shows
- [ ] Loading/error states

---

## Phase UI-2A: Booking Flow - Book Slot Page

**Reference:** `03-ui-reservation.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-1F complete, Backend Phase 3A ready  
**Can parallelize with:** UI Dev 3 (My Reservations)

### Book Slot Page
**File:** `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx`
- [ ] Auth-protected route
- [ ] Breadcrumb navigation
- [ ] Two-column layout

### Booking Summary Card
**File:** `src/features/reservation/components/booking-summary-card.tsx`
- [ ] Court image
- [ ] Court name and location
- [ ] Date formatted (Day, Month Date, Year)
- [ ] Time range

### Profile Preview Card
**File:** `src/features/reservation/components/profile-preview-card.tsx`
- [ ] Display name, email, phone
- [ ] Edit link
- [ ] Warning if profile incomplete
- [ ] Info note about data sharing

### Payment Info Card (for paid courts)
**File:** `src/features/reservation/components/payment-info-card.tsx`
- [ ] Payment methods (GCash, Bank)
- [ ] Copy button for numbers
- [ ] Payment instructions
- [ ] TTL warning (15 min)

### Order Summary (Sticky)
**File:** `src/features/reservation/components/order-summary.tsx`
- [ ] Sticky positioning
- [ ] Date/time summary
- [ ] Price breakdown
- [ ] Terms checkbox
- [ ] Confirm button with loading
- [ ] Link to terms page

### Create Reservation Hook
**File:** `src/features/reservation/hooks/use-create-reservation.ts`
- [ ] Mutation setup
- [ ] Success redirect logic (free → confirmation, paid → payment)
- [ ] Error handling
- [ ] Optimistic slot invalidation

### Testing
- [ ] Booking flow works for free courts
- [ ] Booking flow works for paid courts
- [ ] Profile data shows correctly
- [ ] Terms required before confirm
- [ ] Redirects work correctly
- [ ] Error states handled

---

## Phase UI-2B: Booking Flow - Payment Page

**Reference:** `03-ui-reservation.md`  
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
- [ ] Variant: default, compact

### Timer Banner
**File:** `src/features/reservation/components/timer-banner.tsx`
- [ ] Fixed banner style
- [ ] Warning background
- [ ] Countdown integration
- [ ] Expire handler (redirect)

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
- [ ] Upload progress (future: actual upload)

### Payment Proof Form
**File:** `src/features/reservation/components/payment-proof-form.tsx`
- [ ] Reference number input
- [ ] File upload (optional)
- [ ] Notes textarea
- [ ] Payment completed checkbox
- [ ] Terms checkbox
- [ ] Submit button

### Mark Payment Hook
**File:** `src/features/reservation/hooks/use-mark-payment.ts`
- [ ] Mutation setup
- [ ] Success redirect to detail page
- [ ] Error handling

### Testing
- [ ] Countdown works correctly
- [ ] Timer banner color changes
- [ ] Copy to clipboard works
- [ ] Form validation works
- [ ] Mark payment mutation works
- [ ] Expired redirect works

---

## Final Checklist (UI Dev 2)

- [ ] All layout components complete
- [ ] Court detail page complete
- [ ] Booking flow (book + payment) complete
- [ ] Time slot picker works correctly
- [ ] Date picker works correctly
- [ ] Countdown timer works correctly
- [ ] File upload component works
- [ ] No TypeScript errors
- [ ] Responsive at all breakpoints
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Accessibility checked

---

## Parallelization Notes

| Task | Can Start After | Can Run With |
|------|-----------------|--------------|
| UI-0B Layout Components | UI-0A | UI Dev 1 Base Components |
| UI-1E Court Detail Structure | UI-0B | UI Dev 1 Hero & Search |
| UI-1F Booking Card | UI-1E | UI Dev 1 Home Page |
| UI-1G Org Profile | UI-1E | UI Dev 1 Search Results |
| UI-2A Book Slot Page | UI-1F | UI Dev 3 My Reservations |
| UI-2B Payment Page | UI-2A | UI Dev 3 Reservation Detail |
