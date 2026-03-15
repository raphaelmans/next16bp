# UI Discovery - Court Discovery Pages

**Phase:** UI-1  
**Backend Dependency:** Phase 1C (Court Discovery Module)  
**Priority:** High - Primary user entry point

---

## Overview

The discovery module is the primary entry point for players to find and explore courts. It features a **bento grid layout** showcasing courts, with filtering capabilities and a detailed court view.

### Pages in This Module

| Page | Route | Description |
|------|-------|-------------|
| Home/Discovery | `/` | Main discovery page with bento grid |
| Search Results | `/courts` | Filtered court list |
| Court Detail | `/courts/[id]` | Single court with all details |
| Organization Profile | `/org/[slug]` | Public organization page |

---

## 1. Home/Discovery Page

### Route: `/`

### 1.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NAVBAR (floating, glassmorphism)                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Logo        Search...                    [Sign In] [List Your Court]││
│  └─────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  HERO SECTION                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Find Your Perfect Court                                            ││
│  │  Discover and book pickleball courts near you                       ││
│  │                                                                     ││
│  │  ┌─────────────────────────────────────────┐  [Search]             ││
│  │  │  Search by location or court name...    │                       ││
│  │  └─────────────────────────────────────────┘                       ││
│  │                                                                     ││
│  │  Popular: Manila | Cebu | Davao | Quezon City                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BENTO GRID - Featured Courts                                          │
│  ┌────────────────────────────────────────┬─────────────────────────────┐
│  │                                        │                            │
│  │   FEATURED COURT CARD                  │   MEDIUM COURT CARD        │
│  │   (8 cols, 2 rows)                     │   (4 cols)                 │
│  │                                        │                            │
│  │   [Large Image]                        │   [Image]                  │
│  │   Court Name                           │   Court Name               │
│  │   Location                             │   Location                 │
│  │   Price | [Reserve Now]                │   Price                    │
│  │                                        ├─────────────────────────────┤
│  │                                        │   SMALL COURT CARD         │
│  │                                        │   (4 cols)                 │
│  │                                        │                            │
│  ├────────────────────────────────────────┴─────────────────────────────┤
│  │                                                                      │
│  │   AD/PROMO BANNER (12 cols)                                         │
│  │   "List your court and reach thousands of players"                  │
│  │                                                                      │
│  ├──────────────────────┬──────────────────────┬────────────────────────┤
│  │                      │                      │                        │
│  │   COURT CARD         │   COURT CARD         │   COURT CARD           │
│  │   (4 cols)           │   (4 cols)           │   (4 cols)             │
│  │                      │                      │                        │
│  └──────────────────────┴──────────────────────┴────────────────────────┘
│                                                                         │
│  [Load More Courts]                                                     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FOOTER                                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Breakdown

#### Navbar

```tsx
// src/features/discovery/components/navbar.tsx

interface NavbarProps {
  isScrolled?: boolean
}

/* Specs:
 * - Position: fixed top with floating margin (top-4 left-4 right-4)
 * - Background: bg-card/80 backdrop-blur-md (glassmorphism)
 * - Border: border border-border/50
 * - Radius: rounded-xl
 * - Shadow: shadow-md
 * - Height: h-16
 * - Contains: Logo, Search (expandable on mobile), Auth buttons
 */
```

#### Hero Section

```tsx
// src/features/discovery/components/hero-section.tsx

/* Specs:
 * - Background: gradient from primary-light to background
 * - Padding: py-16 lg:py-24
 * - Title: display size (3rem/48px), Outfit 800
 * - Subtitle: body-lg, muted-foreground
 * - Search input: large (h-14), rounded-xl, shadow-md
 * - Popular links: text-sm, accent color, hover underline
 */
```

#### Court Card (Standard)

```tsx
// src/shared/components/kudos/court-card.tsx

interface CourtCardProps {
  court: CourtListItem
  variant?: 'default' | 'featured' | 'compact'
  showPrice?: boolean
  showAmenities?: boolean
}

/* Specs:
 * - Border: 1px solid border
 * - Radius: rounded-xl (16px)
 * - Shadow: shadow-md
 * - Hover: -translate-y-1, shadow-hover
 * - Transition: duration-300
 * - Image: aspect-[16/9], object-cover, rounded-t-xl
 * - Padding: p-4 (content area)
 * - Badge position: absolute top-3 right-3
 */
```

### 1.3 Data Fetching

```tsx
// src/features/discovery/hooks/use-discovery.ts

import { trpc } from '@/shared/lib/trpc'

export function useDiscovery() {
  const featuredCourts = trpc.court.search.useQuery({
    limit: 8,
    offset: 0,
  })

  return { featuredCourts }
}
```

### 1.4 URL State

```tsx
// src/features/discovery/hooks/use-discovery-filters.ts

import { parseAsString, useQueryStates } from 'nuqs'

export function useDiscoveryFilters() {
  const [filters, setFilters] = useQueryStates({
    city: parseAsString,
    q: parseAsString,
  })

  return { filters, setFilters }
}
```

---

## 2. Search Results Page

### Route: `/courts`

### 2.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PAGE HEADER                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Courts in {City}                    Showing X of Y courts         ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  VIEW TOGGLE + FILTERS BAR                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ [📋 List] [🗺️ Map]  │ [City ▼] [Court Type ▼] [Price ▼] [Amenities]││
│  │                      │                            [Clear Filters]  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  RESULTS GRID                                                          │
│  ┌───────────────┬───────────────┬───────────────┬───────────────┐     │
│  │ Court Card    │ Court Card    │ Court Card    │ Court Card    │     │
│  └───────────────┴───────────────┴───────────────┴───────────────┘     │
│  ┌───────────────┬───────────────┬───────────────┬───────────────┐     │
│  │ Court Card    │ Court Card    │ Court Card    │ Court Card    │     │
│  └───────────────┴───────────────┴───────────────┴───────────────┘     │
│                                                                         │
│  PAGINATION                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │              [<] [1] [2] [3] ... [10] [>]                           ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Map View Layout (Alternative View)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PAGE HEADER + VIEW TOGGLE + FILTERS (same as above)                   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MAP + SIDEBAR LAYOUT                                                  │
│  ┌───────────────────────────────────────────┬─────────────────────────┐│
│  │                                           │                         ││
│  │   GOOGLE MAP                              │  COURT LIST SIDEBAR     ││
│  │   (Interactive with court markers)        │  ┌───────────────────┐  ││
│  │                                           │  │ Court Card Mini   │  ││
│  │   [📍] Court A - ₱200                     │  │ (highlighted when │  ││
│  │   [📍] Court B - FREE                     │  │  marker hovered)  │  ││
│  │   [📍] Court C - Contact                  │  └───────────────────┘  ││
│  │                                           │  ┌───────────────────┐  ││
│  │   Click marker to highlight in sidebar    │  │ Court Card Mini   │  ││
│  │                                           │  └───────────────────┘  ││
│  │                                           │  ┌───────────────────┐  ││
│  │                                           │  │ Court Card Mini   │  ││
│  │                                           │  └───────────────────┘  ││
│  │                                           │                         ││
│  └───────────────────────────────────────────┴─────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  AD BANNER (PRD Section 13 - Primary placement)                        │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  [Banner Ad - Non-intrusive, hardcoded for MVP]                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Map Component

```tsx
// src/features/discovery/components/court-map.tsx

interface CourtMapProps {
  courts: CourtWithLocation[]
  selectedCourtId?: string
  onMarkerClick: (courtId: string) => void
  center?: { lat: number; lng: number }
  zoom?: number
}

/* Specs:
 * - Google Maps embed using @react-google-maps/api
 * - Custom markers using KudosLocationPin
 * - Marker color: Orange gradient for reservable, muted for curated
 * - InfoWindow on hover showing court name and price
 * - Click marker to select court (highlights in sidebar)
 * - Supports current location detection
 * - Default center: Philippines (lat: 12.8797, lng: 121.7740)
 * - Default zoom: 6 (country view), 14 (city view)
 */
```

### 2.4 View Toggle Component

```tsx
// src/features/discovery/components/view-toggle.tsx

interface ViewToggleProps {
  view: 'list' | 'map'
  onViewChange: (view: 'list' | 'map') => void
}

/* Specs:
 * - Two toggle buttons: List icon and Map icon
 * - Active state: primary background, white icon
 * - Inactive state: muted background, muted icon
 * - Border radius: rounded-lg
 * - Persists to URL state via nuqs
 */
```

### 2.5 Filters Component

```tsx
// src/features/discovery/components/court-filters.tsx

interface CourtFiltersProps {
  filters: {
    city?: string
    courtType?: 'CURATED' | 'RESERVABLE'
    isFree?: boolean
    amenities?: string[]
  }
  onFiltersChange: (filters: CourtFiltersProps['filters']) => void
}

/* Filter Options:
 * - City: Dropdown with popular cities + search
 * - Court Type: CURATED (Public) | RESERVABLE (Bookable)
 * - Price: Free | Paid | Any
 * - Amenities: Multi-select checklist
 */
```

### 2.6 URL State Schema

```tsx
// src/features/discovery/schemas/search-params.ts

import { parseAsString, parseAsInteger, parseAsBoolean, parseAsArrayOf, parseAsStringLiteral } from 'nuqs'

export const searchParamsSchema = {
  view: parseAsStringLiteral(['list', 'map']).withDefault('list'),
  city: parseAsString,
  type: parseAsString,
  isFree: parseAsBoolean,
  amenities: parseAsArrayOf(parseAsString),
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(20),
}
```

### 2.7 Empty State

```tsx
// src/features/discovery/components/empty-results.tsx

/* Specs:
 * - Icon: Location pin (from logo) in muted color
 * - Title: "No courts found"
 * - Description: Helpful message based on filters
 * - Action: Clear filters button or suggest nearby cities
 */
```

---

## 3. Court Detail Page

### Route: `/courts/[id]`

### 3.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BREADCRUMB                                                            │
│  Home > Courts > {Court Name}                                          │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHOTO GALLERY                                                         │
│  ┌─────────────────────────────────────────┬────────────────────────────┐
│  │                                         │  ┌────────────┐           │
│  │   MAIN PHOTO                            │  │ Thumb 1    │           │
│  │   (aspect-[4/3])                        │  ├────────────┤           │
│  │                                         │  │ Thumb 2    │           │
│  │                                         │  ├────────────┤           │
│  │                                         │  │ +3 more    │           │
│  └─────────────────────────────────────────┴──┴────────────┴───────────┘
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CONTENT GRID (2 columns on desktop)                                   │
│  ┌─────────────────────────────────────────┬────────────────────────────┐
│  │                                         │                            │
│  │  COURT INFO                             │  BOOKING CARD (sticky)     │
│  │  ┌─────────────────────────────────────┐│  ┌────────────────────────┐│
│  │  │ Court Name                   [BADGE]││  │ Price: ₱200/hour       ││
│  │  │ 📍 Address, City                    ││  │ or FREE                ││
│  │  │                                     ││  │                        ││
│  │  │ Owned by: Organization Name →       ││  │ Select Date:           ││
│  │  └─────────────────────────────────────┘│  │ [Date Picker]          ││
│  │                                         │  │                        ││
│  │  AMENITIES                              │  │ Available Slots:       ││
│  │  ┌─────────────────────────────────────┐│  │ [6AM] [7AM] [8AM] ...  ││
│  │  │ 🚗 Parking  🚿 Showers  💡 Lights  ││  │                        ││
│  │  │ 🏀 Equipment Rental                 ││  │ [Reserve Now]          ││
│  │  └─────────────────────────────────────┘│  └────────────────────────┘│
│  │                                         │                            │
│  │  CONTACT INFO (Curated only)            │                            │
│  │  ┌─────────────────────────────────────┐│                            │
│  │  │ 🌐 Website  📘 Facebook             ││                            │
│  │  │ 📱 Viber: +63 917 123 4567          ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  │  LOCATION MAP                           │                            │
│  │  ┌─────────────────────────────────────┐│                            │
│  │  │                                     ││                            │
│  │  │   [Map with Pin]                    ││                            │
│  │  │                                     ││                            │
│  │  │   [Get Directions]                  ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  └─────────────────────────────────────────┴────────────────────────────┘
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  AD BANNER (PRD Section 13 - Secondary placement)                      │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  [Banner Ad - Non-intrusive, below main content]                    ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Photo Gallery Component

```tsx
// src/features/discovery/components/photo-gallery.tsx

interface PhotoGalleryProps {
  photos: Array<{ url: string; displayOrder: number }>
  courtName: string
}

/* Specs:
 * - Main photo: aspect-[4/3] on desktop, aspect-[16/9] on mobile
 * - Thumbnail grid: 4 visible, "+X more" for additional
 * - Click opens lightbox modal
 * - Placeholder: Teal gradient with court icon if no photos
 * - Lazy loading for images
 */
```

### 3.3 Booking Card Component

```tsx
// src/features/discovery/components/booking-card.tsx

interface BookingCardProps {
  court: CourtWithDetails
  onSlotSelect: (slotId: string) => void
}

/* Specs:
 * - Position: sticky top-24 on desktop
 * - Border: border shadow-lg rounded-xl
 * - Price display: Outfit 700, large
 * - Date picker: Calendar popover
 * - Time slots: Grid of selectable slots
 * - CTA: Full-width primary button
 * 
 * Slot States:
 * - Available: success-light bg, success text
 * - Booked: muted bg, line-through
 * - Selected: primary-light bg, primary border
 */
```

### 3.4 Time Slot Grid

```tsx
// src/features/discovery/components/time-slot-grid.tsx

interface TimeSlotGridProps {
  slots: TimeSlotRecord[]
  selectedSlotId?: string
  onSelect: (slotId: string) => void
}

/* Specs:
 * - Grid: 4 columns on desktop, 3 on mobile
 * - Slot button: h-10, rounded-md
 * - Format: "6:00 AM" or "6:00 - 7:00 AM"
 * - Show price per slot if varies
 */
```

### 3.5 Curated Court Contact Section

```tsx
// src/features/discovery/components/contact-section.tsx

interface ContactSectionProps {
  detail: CuratedCourtDetailRecord
}

/* Specs:
 * - Grid of contact methods
 * - Icons: Lucide icons for each type
 * - Links: Open in new tab
 * - Facebook/Instagram: Brand colors on hover
 */
```

### 3.6 Data Fetching

```tsx
// src/features/discovery/hooks/use-court-detail.ts

export function useCourtDetail(courtId: string) {
  const courtQuery = trpc.court.getById.useQuery({ id: courtId })
  
  const slotsQuery = trpc.timeSlot.getAvailable.useQuery(
    { 
      courtId, 
      startDate: selectedDate.toISOString(),
      endDate: addDays(selectedDate, 1).toISOString(),
    },
    { enabled: !!courtId && courtQuery.data?.court.courtType === 'RESERVABLE' }
  )

  return { court: courtQuery, slots: slotsQuery }
}
```

---

## 4. Organization Profile Page

### Route: `/org/[slug]`

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ORG HEADER                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ [Logo]  Organization Name                                          ││
│  │         📍 Address                                                 ││
│  │         📧 contact@org.com  📱 +63 917 123 4567                    ││
│  │                                                                     ││
│  │         Description text...                                         ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ORG'S COURTS                                                          │
│  ┌───────────────┬───────────────┬───────────────┐                     │
│  │ Court Card    │ Court Card    │ Court Card    │                     │
│  └───────────────┴───────────────┴───────────────┘                     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Component Specifications

### 5.1 Court Card Variants

| Variant | Size | Image Height | Details Shown |
|---------|------|--------------|---------------|
| `featured` | 8 cols, 2 rows | 260px | Full details + CTA |
| `default` | 4 cols | 180px | Name, location, price |
| `compact` | 3 cols | 140px | Name, location only |

### 5.2 Badge Variants

| Type | Background | Text | Example |
|------|------------|------|---------|
| Free | `success-light` | `success` | "FREE" |
| Paid | `primary-light` | `primary-dark` | "₱200/hr" |
| Contact | `warning-light` | `warning-foreground` | "CONTACT" |
| Curated | `accent-light` | `accent` | "PUBLIC LISTING" |

### 5.3 Loading States

```tsx
// Court card skeleton
<Card className="animate-pulse">
  <div className="aspect-[16/9] bg-muted rounded-t-xl" />
  <div className="p-4 space-y-3">
    <div className="h-5 bg-muted rounded w-3/4" />
    <div className="h-4 bg-muted rounded w-1/2" />
    <div className="h-4 bg-muted rounded w-1/4" />
  </div>
</Card>
```

---

## 6. Implementation Checklist

### 6.1 Home/Discovery Page

- [ ] Navbar component with glassmorphism
- [ ] Hero section with search
- [ ] Bento grid layout
- [ ] Court card component (all variants)
- [ ] Infinite scroll or pagination
- [ ] Loading skeletons
- [ ] Empty state

### 6.2 Search Results Page

- [ ] View toggle (List/Map)
- [ ] Filter bar with dropdowns
- [ ] URL state sync with nuqs (including view state)
- [ ] Results grid (list view)
- [ ] Map view with Google Maps
- [ ] Map markers with court info
- [ ] Map sidebar with court cards
- [ ] Pagination component
- [ ] Result count display
- [ ] Clear filters functionality
- [ ] Mobile filter drawer
- [ ] Ad banner placement (PRD Section 13)

### 6.3 Court Detail Page

- [ ] Photo gallery with lightbox
- [ ] Court info section
- [ ] Amenities display
- [ ] Booking card (sticky)
- [ ] Date picker integration
- [ ] Time slot grid
- [ ] Contact section (curated) with "Contact to Book" label
- [ ] Map integration
- [ ] Breadcrumbs
- [ ] Loading state
- [ ] Error state
- [ ] Ad banner placement (PRD Section 13 - secondary)

### 6.4 Organization Profile

- [ ] Org header with logo
- [ ] Contact information
- [ ] Courts grid
- [ ] Loading state

---

## 7. Testing Checklist

### 7.1 Functionality

- [ ] Search filters work correctly
- [ ] URL state persists on refresh
- [ ] Pagination/infinite scroll works
- [ ] Court card links work
- [ ] Date picker changes slot availability
- [ ] Slot selection works
- [ ] Reserve button navigates correctly

### 7.2 Responsiveness

- [ ] Mobile: Single column layout
- [ ] Tablet: 2 columns
- [ ] Desktop: Full bento grid
- [ ] Sticky booking card behavior
- [ ] Mobile filter drawer

### 7.3 Accessibility

- [ ] Keyboard navigation
- [ ] Screen reader announcements
- [ ] Focus management
- [ ] Alt text for images
- [ ] Color contrast

---

*End of UI Discovery*
