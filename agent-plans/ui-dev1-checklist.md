# UI Developer 1 Checklist

**Focus Area:** Foundation + Discovery + Player Reservation Flow  
**Modules:** UI-0 (Foundation) → UI-1 (Discovery) → UI-2 (Reservation)

**Assumes:** Backend APIs are available or will be mocked

**Status:** COMPLETED

---

## Estimated Timeline: 6-7 days

| Day | Tasks | Status |
|-----|-------|--------|
| 1 | UI-0: Foundation Setup (fonts, Tailwind, CSS variables) | DONE |
| 2 | UI-0: shadcn components + Kudos base components | DONE |
| 3 | UI-1A: Discovery Page (Home, Hero, Bento Grid) | DONE |
| 4 | UI-1B: Search Results + Map View + Ad Banner | DONE |
| 5 | UI-1C: Court Detail Page | DONE |
| 6 | UI-2A: Booking Flow + Payment Page | DONE |
| 7 | UI-2B: My Reservations + Profile | DONE |

---

## Day 1: Foundation Setup

### UI-0A: Fonts & Tailwind
**Reference:** `00-ui/01-ui-foundation.md`

#### Font Setup
- [x] Configure Google Fonts in `app/layout.tsx`
  - [x] Outfit (400, 500, 600, 700, 800) - Headings
  - [x] Source Sans 3 (300, 400, 500, 600, italic) - Body
  - [x] IBM Plex Mono (400, 500) - Mono
- [x] Set font CSS variables:
  ```css
  --font-heading: 'Outfit', ui-sans-serif, system-ui, sans-serif;
  --font-body: 'Source Sans 3', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
  ```
- [x] Apply `font-body` as default on body element
- [x] Test font loading and fallbacks

#### Tailwind Configuration
- [x] Update `tailwind.config.ts` (via globals.css @theme):
  - [x] Add font families (heading, body, mono)
  - [x] Add color extensions:
    - [x] `primary-light`, `primary-dark`
    - [x] `accent-light`
    - [x] `success`, `success-light`
    - [x] `warning`, `warning-light`
  - [x] Add custom shadows (sm, md, lg, hover)
  - [x] Add custom animations (fade-in-up, fade-in)
  - [x] Add border radius tokens (sm: 6px, md: 8px, lg: 12px, xl: 16px)

#### CSS Variables (globals.css)
- [x] Define light mode color variables:
  - [x] Background, foreground (warm neutrals)
  - [x] Primary: Teal `#0D9488`
  - [x] Accent: Orange `#F97316`
  - [x] Destructive: Red `#DC2626`
  - [x] Success, warning
  - [x] Muted, card, border
- [x] Define dark mode variables (optional for MVP)
- [x] Add base typography styles for h1-h4
- [x] Add focus ring styles (2px primary ring)
- [x] Add reduced motion styles
- [x] Add animation delay utilities

#### Verification
- [x] Colors render correctly
- [x] Typography hierarchy is clear
- [x] No Tailwind errors in console

---

## Day 2: Base Components

### UI-0B: Install & Customize shadcn/ui
**Reference:** `00-ui/01-ui-foundation.md`, `00-ui/06-ui-components.md`

#### Install shadcn Components
- [x] All required shadcn components installed

#### Customize Button
- [x] Update `button.tsx` with variants:
  - [x] `default` - Teal primary
  - [x] `destructive` - Red
  - [x] `outline` - Border only
  - [x] `secondary` - Subtle background
  - [x] `ghost` - No background
  - [x] `link` - Orange accent with underline
  - [x] `accent` - Orange filled
  - [x] `success` - Green
- [x] Add `font-heading font-semibold`
- [x] Add hover transform (`hover:-translate-y-0.5`)

#### Customize Badge
- [x] Update `badge.tsx` with variants:
  - [x] `default`, `secondary`, `destructive`
  - [x] `success` - Green light bg
  - [x] `warning` - Amber light bg
  - [x] `free` - For free courts
  - [x] `paid` - For paid courts
  - [x] `contact` - For curated courts
- [x] Use Outfit font, uppercase, tracking-wide

#### Customize Card
- [x] Update `card.tsx`:
  - [x] `rounded-xl` (16px)
  - [x] `shadow-md`
  - [x] Hover: `hover:shadow-lg hover:-translate-y-1`

#### Customize Input
- [x] Proper height (`h-10` or `h-12`)
- [x] Focus ring with primary color
- [x] Rounded corners (`rounded-lg`)

### Kudos Base Components
**Reference:** `00-ui/06-ui-components.md`

- [x] Create `src/shared/components/kudos/logo.tsx`
- [x] Create `src/shared/components/kudos/location-pin.tsx`
- [x] Create `src/shared/components/kudos/empty-state.tsx`
- [x] Create `src/shared/components/kudos/status-badge.tsx`
- [x] Create `src/shared/components/kudos/index.ts` (exports)

### Layout Components
- [x] Create `src/shared/components/layout/container.tsx`
- [x] Create `src/shared/components/layout/page-layout.tsx`
- [x] Create `src/shared/components/layout/bento-grid.tsx`

---

## Day 3: Discovery Page

### UI-1A: Home/Discovery Page
**Reference:** `00-ui/02-ui-discovery.md`

#### Navbar
- [x] Create `src/features/discovery/components/navbar.tsx`
  - [x] Floating style: `fixed top-4 left-4 right-4`
  - [x] Glassmorphism: `bg-card/80 backdrop-blur-md`
  - [x] Border: `border border-border/50 rounded-xl`
  - [x] Height: `h-16`
  - [x] Contains: Logo, Search input, Sign In, "List Your Court" buttons
  - [x] Mobile: Hamburger menu

#### Hero Section
- [x] Create `src/features/discovery/components/hero-section.tsx`
  - [x] Background gradient from primary-light
  - [x] Title: "Find Your Perfect Court" (display size, Outfit 800)
  - [x] Subtitle: muted-foreground
  - [x] Large search input (`h-14`, `rounded-xl`, `shadow-md`)
  - [x] Popular location links

#### Court Card
- [x] Create `src/shared/components/kudos/court-card.tsx`
  - [x] Props: `court`, `photo`, `detail`, `variant`, `showPrice`, `showCTA`
  - [x] Variants: `default`, `featured`, `compact`
  - [x] Image with aspect ratio (16/9 default, 4/3 featured)
  - [x] Badge overlay (Free/Paid/Contact)
  - [x] Hover animation: `-translate-y-1`, `shadow-hover`
  - [x] Transition: `duration-300`

#### Bento Grid Layout
- [x] Create `src/app/(public)/layout.tsx`
- [x] Implement bento grid components
- [x] Add "Load More" or pagination

#### Footer
- [x] Create `src/features/discovery/components/footer.tsx`

#### Data Hooks
- [x] Create `src/features/discovery/hooks/use-discovery.ts`
- [x] Create `src/features/discovery/hooks/use-discovery-filters.ts` (nuqs)

#### Loading States
- [x] Create court card skeleton
- [x] Create page loading skeleton

---

## Day 4: Search Results + Map View

### UI-1B: Search Results Page
**Reference:** `00-ui/02-ui-discovery.md`

#### Page Structure
- [x] Create `src/app/(public)/courts/page.tsx`
- [x] Page header: "Courts in {City}" + result count

#### View Toggle (PRD Section 10)
- [x] Create `src/features/discovery/components/view-toggle.tsx`
  - [x] Two buttons: List icon, Map icon
  - [x] Active state: primary background
  - [x] Persists to URL state (`?view=list|map`)

#### Filters Bar
- [x] Create `src/features/discovery/components/court-filters.tsx`
  - [x] City dropdown
  - [x] Court Type (Curated/Reservable)
  - [x] Price (Free/Paid/Any)
  - [x] Amenities multi-select
  - [x] Clear filters button
- [x] Mobile: Filter drawer (Sheet)

#### URL State
- [x] Create `src/features/discovery/schemas/search-params.ts`

#### List View
- [x] Results grid (4 columns desktop, 2 tablet, 1 mobile)
- [x] Pagination component

#### Map View (PRD Section 10)
- [x] Create `src/features/discovery/components/court-map.tsx`
  - [x] Map placeholder (Google Maps integration ready)
  - [x] Custom markers using location pin
  - [x] Info window on marker hover (court name, price)
  - [x] Click marker to highlight in sidebar
- [x] Create map sidebar with mini court cards
- [x] Sync map selection with sidebar scroll

#### Ad Banner (PRD Section 13)
- [x] Create `src/shared/components/kudos/ad-banner.tsx`
  - [x] Props: `placement` ('discovery' | 'court-detail')
  - [x] Non-intrusive styling
  - [x] "Sponsored" label
  - [x] Hardcoded content for MVP
- [x] Add ad banner to search results page

#### Empty State
- [x] Create `src/features/discovery/components/empty-results.tsx`
  - [x] Location pin icon
  - [x] "No courts found" message
  - [x] Clear filters CTA

---

## Day 5: Court Detail Page

### UI-1C: Court Detail Page
**Reference:** `00-ui/02-ui-discovery.md`

#### Page Structure
- [x] Create `src/app/(public)/courts/[id]/page.tsx`
- [x] Breadcrumbs: Home > Courts > {Court Name}
- [x] Two-column layout (content + sticky booking card)

#### Photo Gallery
- [x] Create `src/features/discovery/components/photo-gallery.tsx`
  - [x] Main photo: `aspect-[4/3]` desktop, `aspect-[16/9]` mobile
  - [x] Thumbnail grid (4 visible, "+X more")
  - [x] Click opens lightbox modal
  - [x] Placeholder if no photos (teal gradient with court icon)
  - [x] Lazy loading

#### Court Info Section
- [x] Court name with badge (Curated/Reservable)
- [x] Address with map pin icon
- [x] Link to organization profile

#### Amenities Display
- [x] Grid of amenity icons with labels
- [x] Icons: Parking, Restrooms, Lights, Equipment, etc.

#### Booking Card (Reservable Courts)
- [x] Create `src/features/discovery/components/booking-card.tsx`
  - [x] Position: `sticky top-24`
  - [x] Price display (Outfit 700, large)
  - [x] Date picker integration
  - [x] Time slot grid
  - [x] "Reserve Now" CTA

#### Time Slot Picker
- [x] Create `src/shared/components/kudos/time-slot-picker.tsx`
  - [x] Grid: 4 cols desktop, 3 tablet, 2 mobile
  - [x] Slot states:
    - [x] Available: `bg-success-light text-success`
    - [x] Booked: `bg-muted line-through`
    - [x] Selected: `bg-primary-light border-primary ring-2`
    - [x] Held: `bg-warning-light text-warning`
  - [x] Show price per slot if varies

#### Date Picker
- [x] Create `src/shared/components/kudos/date-picker.tsx`
  - [x] Popover with Calendar
  - [x] Min date = today
  - [x] Format: "PPP" (Jan 15, 2025)

#### Contact Section (Curated Courts)
- [x] Create `src/features/discovery/components/contact-section.tsx`
  - [x] "Contact to Book" prominent label
  - [x] Social links: Facebook, Instagram, Viber, Website
  - [x] Icons with brand colors on hover

#### Location Map
- [x] Single marker map embed (placeholder)
- [x] "Get Directions" link (opens Google Maps)

#### Ad Banner (PRD Section 13 - Secondary)
- [x] Add ad banner below main content

#### Data Hooks
- [x] Create `src/features/discovery/hooks/use-court-detail.ts`
- [x] Fetch court details
- [x] Fetch available slots for selected date

---

## Day 6: Booking + Payment Flow

### UI-2A: Book Slot Page
**Reference:** `00-ui/03-ui-reservation.md`

#### Page Structure
- [x] Create `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx`
- [x] Auth required (redirect to sign-in)
- [x] Breadcrumbs

#### Booking Summary Card
- [x] Create `src/features/reservation/components/booking-summary-card.tsx`
  - [x] Court image
  - [x] Court name, location
  - [x] Date and time display
  - [x] Icons: Calendar, Clock, MapPin

#### Profile Preview
- [x] Create `src/features/reservation/components/profile-preview-card.tsx`
  - [x] Show: name, email, phone
  - [x] Edit link
  - [x] Warning if profile incomplete
  - [x] Info note: "This info will be shared with court owner"

#### Payment Info (Paid Courts)
- [x] Create `src/features/reservation/components/payment-info-card.tsx`
  - [x] Available payment methods (GCash, Bank)
  - [x] Copy button for numbers
  - [x] TTL warning (15 min)

#### Order Summary (Sticky)
- [x] Create `src/features/reservation/components/order-summary.tsx`
  - [x] Date/time display
  - [x] Price breakdown
  - [x] Terms checkbox
  - [x] Confirm button

#### Booking Hook
- [x] Create `src/features/reservation/hooks/use-create-reservation.ts`
- [x] Handle free vs paid redirect

### UI-2B: Payment Page
**Reference:** `00-ui/03-ui-reservation.md`

#### Page Structure
- [x] Create `src/app/(auth)/reservations/[id]/payment/page.tsx`
- [x] Timer banner at top

#### Countdown Timer
- [x] Create `src/shared/components/kudos/countdown.tsx`
  - [x] Format: "12:34" or "12 minutes remaining"
  - [x] Color: normal > 5min, warning 2-5min, destructive < 2min
  - [x] Pulse animation when < 2min
  - [x] `onExpire` callback

#### Payment Instructions
- [x] Create `src/features/reservation/components/payment-method-card.tsx`
  - [x] Payment type icon
  - [x] Account number with copy button
  - [x] Account name
  - [x] Toast on copy

#### Payment Disclaimer (PRD Section 17.2)
- [x] Create `src/features/reservation/components/payment-disclaimer.tsx`
  - [x] Warning alert style
  - [x] Text: "KudosCourts does not process payments..."
  - [x] Clearly states platform is not liable

#### Payment Proof Form
- [x] Reference number input
- [x] File upload for receipt
- [x] Notes textarea

#### File Upload
- [x] Create `src/shared/components/kudos/file-upload.tsx`
  - [x] Drag and drop zone
  - [x] Click to browse
  - [x] Preview uploaded image
  - [x] Progress indicator
  - [x] Max 5MB, PNG/JPG

#### Confirmation Checkboxes (PRD Section 17.3)
- [x] "I have completed the payment"
- [x] "I acknowledge that KudosCourts does not process payments..." (required)
- [x] "I agree to Terms and Conditions" (required)

#### Mark Payment Schema
- [x] Create `src/features/reservation/schemas/mark-payment.schema.ts`
  - [x] Include `disclaimerAcknowledged: z.literal(true)`
  - [x] Include `termsAccepted: z.literal(true)`

#### Mark Payment Hook
- [x] Create `src/features/reservation/hooks/use-mark-payment.ts`

---

## Day 7: My Reservations + Profile

### UI-2C: My Reservations Page
**Reference:** `00-ui/03-ui-reservation.md`

#### Page Structure
- [x] Create `src/app/(auth)/reservations/page.tsx`
- [x] Page header: "My Reservations"

#### Tabs
- [x] Upcoming, Past, Cancelled
- [x] Badge with count
- [x] URL state for active tab

#### Reservation List Item
- [x] Create `src/features/reservation/components/reservation-list-item.tsx`
  - [x] Horizontal card layout
  - [x] Court image (80px square)
  - [x] Court name, location
  - [x] Date/time
  - [x] Status badge
  - [x] Price
  - [x] Actions: Pay Now, View, Cancel

#### Status Badge
- [x] Use `KudosStatusBadge` with mappings:
  - [x] CREATED → "Processing" (primary)
  - [x] AWAITING_PAYMENT → "Awaiting Payment" (warning)
  - [x] PAYMENT_MARKED_BY_USER → "Payment Pending" (primary)
  - [x] CONFIRMED → "Confirmed" (success)
  - [x] EXPIRED → "Expired" (destructive)
  - [x] CANCELLED → "Cancelled" (secondary)

#### Empty States
- [x] Per-tab empty states
- [x] "Find Courts" CTA

#### Data Hook
- [x] Create `src/features/reservation/hooks/use-my-reservations.ts`

### UI-2D: Reservation Detail Page
**Reference:** `00-ui/03-ui-reservation.md`

#### Page Structure
- [x] Create `src/app/(auth)/reservations/[id]/page.tsx`
- [x] Breadcrumbs: My Reservations > #{id}

#### Status Banner
- [x] Create `src/features/reservation/components/status-banner.tsx`
  - [x] AWAITING_PAYMENT: warning bg, countdown, Pay Now CTA
  - [x] PAYMENT_MARKED: primary-light, "Waiting for confirmation"
  - [x] CONFIRMED: success-light, checkmark
  - [x] EXPIRED: destructive-light, error message
  - [x] CANCELLED: muted

#### Booking Details
- [x] Court photo gallery (mini)
- [x] Court name, address
- [x] Date, time, price

#### Player Snapshot (PRD Section 8.5)
- [x] Show player info at time of booking
- [x] Name, email, phone
- [x] Note: "This info was shared with owner"

#### Organization Info
- [x] Logo, name
- [x] Contact email, phone

#### Payment Proof Display
- [x] Reference number
- [x] Upload timestamp
- [x] View receipt link

#### Timeline
- [x] Create `src/shared/components/kudos/timeline.tsx`
  - [x] Vertical timeline with dots
  - [x] Status changes with timestamps
  - [x] Actor (You, Owner, System)
  - [x] Most recent first

#### Actions Card (Sticky)
- [x] Status display
- [x] Booking ID
- [x] Get Directions button
- [x] Cancel button (if cancellable)

### UI-2E: Profile Page
**Reference:** `00-ui/03-ui-reservation.md`

#### Page Structure
- [x] Create `src/app/(auth)/profile/page.tsx`

#### Profile Form
- [x] Avatar upload with preview
- [x] Display name (required)
- [x] Email
- [x] Phone number
- [x] Info note: "Contact info shared with court owners"

#### Schema
- [x] Create `src/features/reservation/schemas/profile.schema.ts`

#### Hook
- [x] Create `src/features/reservation/hooks/use-profile.ts`

---

## Testing Checklist

### Functionality
- [ ] Discovery search and filters work
- [ ] Map view displays courts correctly
- [ ] URL state persists on refresh
- [ ] Court detail loads with photos and slots
- [ ] Slot selection works
- [ ] Booking flow completes (free + paid)
- [ ] Payment page timer works
- [ ] File upload works
- [ ] Reservations list displays correctly
- [ ] Status badges show correct colors

### Responsiveness
- [ ] Mobile: Single column layouts
- [ ] Tablet: 2 columns
- [ ] Desktop: Full layouts
- [ ] Sticky elements work correctly
- [ ] Mobile navigation (hamburger)

### Accessibility
- [ ] Keyboard navigation
- [ ] Focus visible on all interactive elements
- [ ] Alt text for images
- [ ] Screen reader labels
- [ ] Color contrast passes

### PRD Requirements
- [x] Map view works (PRD 10) - placeholder implemented
- [x] Ad banners display (PRD 13)
- [x] Payment disclaimer shown (PRD 17.2)
- [x] T&C + Disclaimer checkboxes required (PRD 17.3)
- [x] Player snapshot displayed (PRD 8.5)
- [x] Curated courts show "Contact to Book"

---

## Files Created

```
src/shared/components/
├── kudos/
│   ├── index.ts
│   ├── logo.tsx
│   ├── location-pin.tsx
│   ├── court-card.tsx
│   ├── time-slot-picker.tsx
│   ├── date-picker.tsx
│   ├── status-badge.tsx
│   ├── countdown.tsx
│   ├── timeline.tsx
│   ├── empty-state.tsx
│   ├── file-upload.tsx
│   └── ad-banner.tsx
├── layout/
│   ├── index.ts
│   ├── container.tsx
│   ├── page-layout.tsx
│   └── bento-grid.tsx
└── ui/ (shadcn - customized)

src/features/
├── discovery/
│   ├── components/
│   │   ├── index.ts
│   │   ├── navbar.tsx
│   │   ├── hero-section.tsx
│   │   ├── footer.tsx
│   │   ├── court-filters.tsx
│   │   ├── view-toggle.tsx
│   │   ├── court-map.tsx
│   │   ├── photo-gallery.tsx
│   │   ├── booking-card.tsx
│   │   ├── contact-section.tsx
│   │   └── empty-results.tsx
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── use-discovery.ts
│   │   ├── use-discovery-filters.ts
│   │   └── use-court-detail.ts
│   └── schemas/
│       └── search-params.ts
└── reservation/
    ├── components/
    │   ├── booking-summary-card.tsx
    │   ├── profile-preview-card.tsx
    │   ├── payment-info-card.tsx
    │   ├── order-summary.tsx
    │   ├── payment-method-card.tsx
    │   ├── payment-disclaimer.tsx
    │   ├── reservation-list-item.tsx
    │   ├── status-banner.tsx
    │   └── ... (existing components)
    ├── hooks/
    │   ├── index.ts
    │   ├── use-create-reservation.ts
    │   ├── use-mark-payment.ts
    │   ├── use-my-reservations.ts
    │   ├── use-profile.ts
    │   └── ... (existing hooks)
    └── schemas/
        ├── mark-payment.schema.ts
        └── profile.schema.ts

src/app/
├── (public)/
│   ├── layout.tsx
│   └── courts/
│       ├── page.tsx
│       └── [id]/
│           └── page.tsx
└── (auth)/
    ├── courts/[id]/book/[slotId]/page.tsx
    ├── reservations/
    │   ├── page.tsx
    │   └── [id]/
    │       ├── page.tsx
    │       └── payment/page.tsx
    └── profile/page.tsx
```

---

## Notes

- All UI components are implemented with placeholder data/hooks
- Backend API integration is needed to replace mock data
- Google Maps integration placeholder is in place (needs API key)
- Testing checklist items need manual verification
- Some components may need refinement based on actual API responses
