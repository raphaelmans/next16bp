# UI Developer 3 Checklist

**Focus Area:** Reservation Management + Player Profile  
**Modules:** My Reservations → Reservation Detail → Profile → Status Components

---

## Phase UI-2C: My Reservations Page

**Reference:** `03-ui-reservation.md`  
**Estimated Time:** 2 days  
**Dependencies:** Backend Phase 3A ready  
**Can parallelize with:** UI Dev 2 (Book Slot Page)

### My Reservations Page
**File:** `src/app/(auth)/reservations/page.tsx`
- [ ] Auth-protected route
- [ ] Page header with title
- [ ] Tab navigation
- [ ] Reservation list

### KudosStatusBadge Component
**File:** `src/shared/components/kudos/status-badge.tsx`
- [ ] Status mapping:
  - [ ] CREATED → primary, "Processing"
  - [ ] AWAITING_PAYMENT → warning, "Awaiting Payment"
  - [ ] PAYMENT_MARKED_BY_USER → primary, "Payment Pending"
  - [ ] CONFIRMED → success, "Confirmed"
  - [ ] EXPIRED → destructive, "Expired"
  - [ ] CANCELLED → secondary, "Cancelled"
- [ ] Size variants (sm, md, lg)
- [ ] Export from kudos index

### Reservation Tabs Component
**File:** `src/features/reservation/components/reservation-tabs.tsx`
- [ ] Tabs: Upcoming, Past, Cancelled
- [ ] Badge with count on tabs
- [ ] URL state integration (nuqs)
- [ ] Mobile-friendly

### Reservation List Item
**File:** `src/features/reservation/components/reservation-list-item.tsx`
- [ ] Horizontal card layout
- [ ] Court image (80px square)
- [ ] Court name and location
- [ ] Date and time
- [ ] Status badge
- [ ] Price
- [ ] Actions (View, Pay Now, Cancel)
- [ ] Mobile: Stacked layout

### URL State Hook
**File:** `src/features/reservation/hooks/use-reservations-tabs.ts`
- [ ] Tab state in URL
- [ ] Default to "upcoming"
- [ ] nuqs integration

### Data Fetching Hook
**File:** `src/features/reservation/hooks/use-my-reservations.ts`
- [ ] `useMyReservations(filters)` hook
- [ ] Filter by status
- [ ] Filter by upcoming
- [ ] Pagination support

### Empty States
- [ ] No upcoming reservations
- [ ] No past reservations
- [ ] No cancelled reservations
- [ ] CTA to find courts

### Testing
- [ ] Tabs switch correctly
- [ ] URL state persists
- [ ] Reservations load
- [ ] Actions navigate correctly
- [ ] Empty states show
- [ ] Mobile responsive

---

## Phase UI-2D: Reservation Detail Page

**Reference:** `03-ui-reservation.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-2C complete  
**Can parallelize with:** UI Dev 2 (Payment Page)

### Reservation Detail Page
**File:** `src/app/(auth)/reservations/[id]/page.tsx`
- [ ] Auth-protected route
- [ ] Breadcrumb navigation
- [ ] Status banner (conditional)
- [ ] Two-column layout

### Status Banner Component
**File:** `src/features/reservation/components/status-banner.tsx`
- [ ] AWAITING_PAYMENT: Warning, countdown, Pay Now CTA
- [ ] PAYMENT_MARKED_BY_USER: Primary, "Waiting for confirmation"
- [ ] CONFIRMED: Success, checkmark, confirmation message
- [ ] EXPIRED: Destructive, error message
- [ ] CANCELLED: Muted, cancellation reason

### Booking Details Card
**File:** `src/features/reservation/components/booking-details-card.tsx`
- [ ] Court photo (small gallery or single)
- [ ] Court name and address
- [ ] Date formatted
- [ ] Time range
- [ ] Price
- [ ] Get Directions link (external)

### Organization Info Card
**File:** `src/features/reservation/components/org-info-card.tsx`
- [ ] Organization logo
- [ ] Organization name
- [ ] Contact email
- [ ] Contact phone
- [ ] Link to org profile

### Payment Proof Display
**File:** `src/features/reservation/components/payment-proof-display.tsx`
- [ ] Reference number
- [ ] Upload timestamp
- [ ] View image button (lightbox)
- [ ] Notes

### KudosTimeline Component
**File:** `src/shared/components/kudos/timeline.tsx`
- [ ] Vertical timeline layout
- [ ] Dot colors by status:
  - [ ] success: green
  - [ ] warning: amber
  - [ ] error: red
  - [ ] default: primary
- [ ] Line connecting dots
- [ ] Title and description
- [ ] Timestamp formatting
- [ ] Most recent first

### Actions Card (Sticky)
**File:** `src/features/reservation/components/reservation-actions-card.tsx`
- [ ] Status display
- [ ] Booking ID
- [ ] Get Directions button
- [ ] Contact Owner button (opens email/phone)
- [ ] Cancel Reservation button (if cancellable)

### Cancel Reservation Dialog
**File:** `src/features/reservation/components/cancel-dialog.tsx`
- [ ] Confirmation dialog
- [ ] Optional reason textarea
- [ ] Cancel and Confirm buttons
- [ ] Loading state

### Data Fetching Hook
**File:** `src/features/reservation/hooks/use-reservation.ts`
- [ ] `useReservation(id)` hook
- [ ] Fetch with details
- [ ] Include timeline events

### Cancel Mutation Hook
**File:** `src/features/reservation/hooks/use-cancel-reservation.ts`
- [ ] Mutation setup
- [ ] Success redirect to list
- [ ] Error handling

### Testing
- [ ] Status banner shows correctly per status
- [ ] Timeline displays events
- [ ] Cancel dialog works
- [ ] Actions work correctly
- [ ] Mobile responsive

---

## Phase UI-2E: Profile Page

**Reference:** `03-ui-reservation.md`  
**Estimated Time:** 1 day  
**Dependencies:** None (can start early)  
**Can parallelize with:** UI Dev 1 (Discovery), UI Dev 2 (Booking)

### Profile Page
**File:** `src/app/(auth)/profile/page.tsx`
- [ ] Auth-protected route
- [ ] Page header
- [ ] Profile form

### Profile Form
**File:** `src/features/reservation/components/profile-form.tsx`
- [ ] Avatar upload section
- [ ] Display name input (required)
- [ ] Email input
- [ ] Phone number input
- [ ] Info note about data sharing
- [ ] Save button

### Avatar Upload Section
**File:** `src/features/reservation/components/avatar-upload.tsx`
- [ ] Current avatar preview (or initials)
- [ ] Change avatar button
- [ ] File upload integration
- [ ] Circular crop/preview

### Profile Schema
**File:** `src/features/reservation/schemas/profile.schema.ts`
- [ ] Zod schema:
  - [ ] displayName: required, max 100
  - [ ] email: optional, email format
  - [ ] phoneNumber: optional, max 20
  - [ ] avatarUrl: optional, URL format

### Profile Hooks
**File:** `src/features/reservation/hooks/use-profile.ts`
- [ ] `useProfile()` - fetch current profile
- [ ] `useUpdateProfile()` - mutation

### Testing
- [ ] Form loads with current data
- [ ] Validation works
- [ ] Save updates profile
- [ ] Success toast shows
- [ ] Avatar upload works

---

## Phase UI-2F: Shared Reservation Components

**Reference:** `06-ui-components.md`  
**Estimated Time:** 1 day  
**Dependencies:** None  
**Can parallelize with:** All other UI work

### Copy to Clipboard Utility
**File:** `src/shared/lib/clipboard.ts`
- [ ] `copyToClipboard(text)` function
- [ ] Toast notification on success
- [ ] Fallback for older browsers

### Format Utilities
**File:** `src/shared/lib/format.ts`
- [ ] `formatCurrency(cents, currency)` - "₱200.00"
- [ ] `formatDate(date)` - "Wednesday, January 15, 2025"
- [ ] `formatTime(date)` - "6:00 AM"
- [ ] `formatTimeRange(start, end)` - "6:00 AM - 7:00 AM"
- [ ] `formatRelative(date)` - "2 hours ago"

### Loading Skeletons
**File:** `src/features/reservation/components/skeletons/`
- [ ] ReservationListSkeleton
- [ ] ReservationDetailSkeleton
- [ ] ProfileFormSkeleton

### Error Boundaries
**File:** `src/features/reservation/components/error-states/`
- [ ] ReservationNotFound
- [ ] SlotNoLongerAvailable
- [ ] PaymentExpired

### Testing
- [ ] Utilities work correctly
- [ ] Skeletons match final layout
- [ ] Error states display properly

---

## Phase UI-Auth: Auth Pages (If Needed)

**Reference:** Project auth setup  
**Estimated Time:** 1 day  
**Dependencies:** Auth backend ready

### Sign In Page
**File:** `src/app/(auth)/sign-in/page.tsx`
- [ ] Sign in form or Supabase Auth UI
- [ ] Callback URL handling
- [ ] Error message display

### Sign Up Page (if separate)
**File:** `src/app/(auth)/sign-up/page.tsx`
- [ ] Sign up form
- [ ] Terms acceptance
- [ ] Success redirect

### Auth Layout
**File:** `src/app/(auth)/layout.tsx`
- [ ] Centered card layout
- [ ] Logo
- [ ] Background pattern

### Testing
- [ ] Sign in works
- [ ] Callback redirects work
- [ ] Error messages show

---

## Final Checklist (UI Dev 3)

- [ ] My Reservations page complete
- [ ] Reservation Detail page complete
- [ ] Profile page complete
- [ ] Status badges work correctly
- [ ] Timeline component works
- [ ] Cancel flow works
- [ ] All format utilities work
- [ ] Loading skeletons implemented
- [ ] Error states implemented
- [ ] No TypeScript errors
- [ ] Responsive at all breakpoints
- [ ] Accessibility checked

---

## Parallelization Notes

| Task | Can Start After | Can Run With |
|------|-----------------|--------------|
| UI-2C My Reservations | Backend 3A | UI Dev 2 Book Slot |
| UI-2D Reservation Detail | UI-2C | UI Dev 2 Payment Page |
| UI-2E Profile Page | Immediately | UI Dev 1 & 2 work |
| UI-2F Shared Components | Immediately | All other work |
| UI-Auth Pages | Auth backend | All other work |
