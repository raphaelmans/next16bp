# UI Developer 1 Checklist

**Focus Area:** Foundation + Discovery + Core Components  
**Modules:** UI-0 (Foundation) → UI-1 (Discovery) → Shared Components

---

## Phase UI-0A: Foundation Setup

**Reference:** `01-ui-foundation.md`  
**Estimated Time:** 1 day  
**Dependencies:** None  
**Can parallelize with:** UI Dev 2 (UI-0B)

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

### Verification
- [ ] Colors render correctly in light mode
- [ ] Colors render correctly in dark mode (if applicable)
- [ ] Typography hierarchy is clear
- [ ] No Tailwind errors

### Handoff
- [ ] Notify UI Dev 2 that foundation is ready
- [ ] Foundation tokens available for all UI work

---

## Phase UI-0B: Base Component Customization

**Reference:** `01-ui-foundation.md`  
**Estimated Time:** 0.5 day  
**Dependencies:** UI-0A complete  
**Can parallelize with:** UI Dev 2 (shadcn installs)

### Install shadcn/ui Components
```bash
npx shadcn-ui@latest add button card badge input textarea
npx shadcn-ui@latest add select checkbox radio-group switch label
npx shadcn-ui@latest add dialog sheet popover dropdown-menu
npx shadcn-ui@latest add tabs table avatar skeleton toast alert
npx shadcn-ui@latest add calendar separator scroll-area tooltip form
```

### Customize Button Component
- [ ] Update `button.tsx` with KudosCourts variants:
  - [ ] `default` - Teal primary with hover state
  - [ ] `destructive` - Red
  - [ ] `outline` - Border only
  - [ ] `secondary` - Subtle background
  - [ ] `ghost` - No background
  - [ ] `link` - Orange accent with underline
  - [ ] `accent` - Orange
  - [ ] `success` - Green
- [ ] Add `font-heading font-semibold` to all buttons
- [ ] Add hover transform (`-translate-y-0.5`)
- [ ] Add `cursor-pointer`

### Customize Badge Component
- [ ] Update `badge.tsx` with variants:
  - [ ] `default` - Primary light
  - [ ] `accent` - Orange light
  - [ ] `destructive` - Red light
  - [ ] `success` - Green light
  - [ ] `warning` - Amber light
  - [ ] `free` - Green (for court badges)
  - [ ] `paid` - Teal (for court badges)
  - [ ] `contact` - Amber (for court badges)
- [ ] Use Outfit font, uppercase, tracking-wide

### Customize Card Component
- [ ] Update `card.tsx` with:
  - [ ] `rounded-xl` border radius
  - [ ] `shadow-md` default shadow
  - [ ] `transition-all duration-300` for hover states

### Customize Input Component
- [ ] Update `input.tsx` with:
  - [ ] `h-11` height
  - [ ] `rounded-lg` border radius
  - [ ] Focus ring with primary color
  - [ ] `font-body` font

### Handoff
- [ ] Base components ready for feature development

---

## Phase UI-1A: Discovery - Core Components

**Reference:** `02-ui-discovery.md`, `06-ui-components.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-0B complete  
**Can parallelize with:** UI Dev 2 (Layout Components)

### KudosLogo Component
**File:** `src/shared/components/kudos/logo.tsx`
- [ ] Create SVG logo from design system
- [ ] Implement `variant` prop (`full`, `icon`)
- [ ] Implement `size` prop (`sm`, `md`, `lg`)
- [ ] Export from kudos index

### KudosLocationPin Component
**File:** `src/shared/components/kudos/location-pin.tsx`
- [ ] Create orange gradient pin SVG
- [ ] Implement size variants
- [ ] Match design system specs exactly

### KudosCourtCard Component
**File:** `src/shared/components/kudos/court-card.tsx`
- [ ] Implement `default` variant (180px image)
- [ ] Implement `featured` variant (260px image, 2 rows)
- [ ] Implement `compact` variant (140px image)
- [ ] Add image placeholder (teal gradient)
- [ ] Add badge positioning
- [ ] Add hover effects (-translate-y-1, shadow-hover)
- [ ] Add cursor-pointer
- [ ] Link to court detail page

### KudosEmptyState Component
**File:** `src/shared/components/kudos/empty-state.tsx`
- [ ] Create centered layout
- [ ] Add icon slot
- [ ] Add title and description
- [ ] Add optional action button

### Testing
- [ ] All components render correctly
- [ ] Hover states work
- [ ] Responsive at all breakpoints
- [ ] No console errors

---

## Phase UI-1B: Discovery - Hero & Search

**Reference:** `02-ui-discovery.md`  
**Estimated Time:** 1.5 days  
**Dependencies:** UI-1A complete  
**Can parallelize with:** UI Dev 2 (Booking Card)

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
- [ ] Responsive padding

### Search Input Component
**File:** `src/features/discovery/components/search-input.tsx`
- [ ] Large variant for hero (h-14)
- [ ] Icon prefix (Search)
- [ ] Clear button
- [ ] Form submission handling
- [ ] URL parameter integration

### Testing
- [ ] Navbar sticky behavior works
- [ ] Search form submits correctly
- [ ] Popular links navigate correctly
- [ ] Mobile responsive

---

## Phase UI-1C: Discovery - Home Page

**Reference:** `02-ui-discovery.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-1B complete, Backend Phase 1C ready  
**Can parallelize with:** UI Dev 2 (Court Detail)

### Home Page Setup
**File:** `src/app/(public)/page.tsx`
- [ ] Server component for initial data fetch
- [ ] Navbar integration
- [ ] Hero section integration
- [ ] Footer component

### Bento Grid Integration
- [ ] Import BentoGrid and BentoItem from layout
- [ ] Featured court (8 cols, 2 rows)
- [ ] Medium courts (4 cols)
- [ ] Small courts (4 cols)
- [ ] Promotional banner (12 cols)

### Data Fetching Hook
**File:** `src/features/discovery/hooks/use-discovery.ts`
- [ ] `useDiscovery()` hook
- [ ] Fetch featured courts
- [ ] Loading state handling
- [ ] Error state handling

### Loading State
- [ ] Court card skeletons
- [ ] Bento grid skeleton layout
- [ ] Staggered fade-in animation on load

### Empty State
- [ ] Show when no courts found
- [ ] Helpful message
- [ ] CTA to different action

### Testing
- [ ] Data loads correctly
- [ ] Loading skeletons show
- [ ] Error states handle gracefully
- [ ] Animation timing correct

---

## Phase UI-1D: Discovery - Search Results

**Reference:** `02-ui-discovery.md`  
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
- [ ] City dropdown (with search)
- [ ] Court type filter (Curated/Reservable)
- [ ] Price filter (Free/Paid/Any)
- [ ] Amenities multi-select
- [ ] Clear filters button
- [ ] Mobile: Filter drawer (Sheet)

### URL State Integration
**File:** `src/features/discovery/hooks/use-discovery-filters.ts`
- [ ] nuqs integration for filters
- [ ] `city`, `type`, `isFree`, `amenities`, `page`, `limit`
- [ ] Sync state with URL
- [ ] Debounce filter changes

### Pagination Component
**File:** `src/shared/components/kudos/pagination.tsx`
- [ ] Page numbers with ellipsis
- [ ] Previous/Next buttons
- [ ] Current page indicator
- [ ] URL-based navigation

### Testing
- [ ] Filters work correctly
- [ ] URL state persists on refresh
- [ ] Pagination works
- [ ] Mobile filter drawer works

---

## Final Checklist (UI Dev 1)

- [ ] All discovery pages complete
- [ ] All core Kudos components complete
- [ ] No TypeScript errors
- [ ] Responsive at mobile, tablet, desktop
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Empty states implemented
- [ ] Accessibility checked (keyboard nav, focus states)
- [ ] Animations smooth (respects reduced motion)

---

## Parallelization Notes

| Task | Can Start After | Can Run With |
|------|-----------------|--------------|
| UI-0A Foundation | Immediately | UI Dev 2 setup |
| UI-0B Base Components | UI-0A | UI Dev 2 installs |
| UI-1A Core Components | UI-0B | UI Dev 2 Layout |
| UI-1B Hero & Search | UI-1A | UI Dev 2 Booking Card |
| UI-1C Home Page | UI-1B | UI Dev 2 Court Detail |
| UI-1D Search Results | UI-1C | UI Dev 2 Slot Picker |
