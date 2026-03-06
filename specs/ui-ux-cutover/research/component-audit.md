# Component Audit

## Current Setup
- **shadcn style:** new-york
- **Icon library:** lucide
- **Base color:** slate (to be re-themed to teal primary)
- **CSS variables:** enabled
- **components.json:** `/components.json`
- **Tailwind CSS:** v4 with `@theme inline` mapping
- **Animation:** `tw-animate-css` (tailwindcss-animate) + `motion` v12 (to be removed)

## shadcn UI Components (src/components/ui/)

### Standard shadcn (reset to latest)
These are all official shadcn registry components. Reset via MCP:
- accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb
- button, calendar, card, carousel, chart, checkbox, collapsible
- command, context-menu, dialog, drawer, dropdown-menu, form
- hover-card, input, input-otp, label, menubar, navigation-menu
- pagination, popover, progress, radio-group, resizable, scroll-area
- select, separator, sheet, sidebar, skeleton, slider, sonner
- switch, table, tabs, textarea, toggle, toggle-group, tooltip

### Official shadcn (but may be outdated — reset)
These exist in the shadcn registry and are already installed:
- `button-group` — official shadcn
- `empty` — official shadcn
- `field` — official shadcn
- `input-group` — official shadcn
- `item` — official shadcn
- `kbd` — official shadcn
- `spinner` — official shadcn

### Truly Custom (no shadcn equivalent)
- `page-header.tsx` — custom breadcrumb + title + actions. Built on shadcn primitives (Breadcrumb, Button). **Keep, re-skin.**
- `draggable-panel.tsx` — custom drag-to-position panel. No shadcn equivalent. **Keep, re-skin.**

## Non-UI Component Directories

### src/components/kudos/
- `empty-state.tsx` — custom empty state (may overlap with shadcn `empty`)
- `availability-month-view.tsx` — custom calendar view
- `availability-week-grid.tsx` — custom week grid (uses `motion`)
- `time-range-picker.tsx` — custom time picker (uses `motion`)

### src/components/ai-elements/
- `connection.tsx` — hardcoded colors
- `shimmer.tsx` — uses `motion`
- `conversation.tsx` — chat interface

### src/components/navigation/
- `navigation-progress.tsx` — hardcoded rgba colors

### src/components/form/
- StandardForm system — keep, align to shadcn Form

### src/components/layout/
- `dashboard-bottom-tabs.tsx` — keep, re-skin
- `dashboard-layout.tsx`, `dashboard-shell.tsx`, `dashboard-sidebar.tsx` — re-skin
- `dashboard-navbar.tsx` — re-skin (minimal top bar for mobile)
- `public-shell.tsx` — re-skin
- `bento-grid.tsx` — evaluate if still needed after hero redesign
- `portal-tabs-sidebar.tsx`, `portal-switcher.tsx` — re-skin

## motion (Framer) Usage — 9 Files to Migrate

Files importing from `motion`:
1. `src/features/owner/components/availability-studio/availability-studio-coordinator.tsx`
2. `src/features/owner/components/place-court-availability/place-court-availability-coordinator.tsx`
3. `src/features/owner/components/booking-studio/mobile-manage-block-peek-bar.tsx`
4. `src/features/owner/components/booking-studio/mobile-selection-peek-bar.tsx`
5. `src/components/kudos/availability-week-grid.tsx`
6. `src/features/discovery/place-detail/components/court-detail-client.tsx`
7. `src/components/kudos/time-range-picker.tsx`
8. `src/features/pwa/components/pwa-install-prompt.tsx`
9. `src/components/ai-elements/shimmer.tsx`

**Strategy:** Replace with CSS animations (tailwindcss-animate) or remove animations where not essential.

## Hardcoded Colors — 27 Files

### Charts (11 files) — replace hex with `var(--chart-N)` tokens
All in `src/features/owner/components/analytics/charts/`:
- utilization-trend, revenue-by-dow, revenue-by-hour, revenue-trend
- utilization-by-court, lead-time, response-time, revenue-by-court
- bookings-by-hour, cancellation-pie
Plus: `src/components/ui/chart.tsx`

### OG Images (4 files) — re-skin to teal + neutrals
- `src/app/opengraph-image.tsx`
- `src/app/twitter-image.tsx`
- `src/app/(public)/places/[placeId]/courts/[courtId]/opengraph-image.tsx`
- `src/app/(public)/courts/[id]/opengraph-image.tsx`
- `src/app/(public)/list-your-venue/opengraph-image.tsx`

### Other (12 files) — replace hardcoded values with CSS var tokens
- navigation-progress, google-sign-in-button, contact-section
- place-detail-mobile-sheet, place-detail-skeleton, home-page-client
- home-search-form, venue-qr-code-dialog, kudoscourts-logo
- ai-elements/connection, reservation-payment-page

## Loading Text — 45 Occurrences in 26 Files
All "Loading...", "Creating...", "Saving..." etc. to be replaced with spinner icons only.
See grep for full list.

## CSS Token System
- Source of truth: `src/app/globals.css` `:root` block
- Tailwind v4 mapping via `@theme inline`
- Extended brand tokens: `--success`, `--warning`, `--destructive-light` (non-standard shadcn)
- Dark mode block exists but will be removed (light-only decision)
- Chart tokens: `--chart-1` through `--chart-5` already defined
- Radius: `--radius: 0.75rem` (12px) — good for rounded corner requirement
