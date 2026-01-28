# Phase 2: Frontend Court Page + Availability Panel

Status: draft

## Objective

Implement the client UI for `/venues/<venueSlug>/courts/<courtId>`:

- Court-focused header + venue context
- Month/day availability browsing scoped to the selected court
- Booking CTA that continues into the existing `/venues/[slug]/book` flow
- Subtle Motion transitions (day ↔ month) using `motion/react`

## References

- Place detail client UX patterns: `src/app/(public)/places/[placeId]/place-detail-client.tsx`
- Public schedule UI patterns: `src/app/(public)/courts/[id]/schedule/page.tsx`
- Booking page query contract: `src/app/(auth)/places/[placeId]/book/page.tsx`
- Availability components: `src/shared/components/kudos/availability-month-view.tsx`, `src/shared/components/kudos/time-slot-picker.tsx`, `src/shared/components/kudos/date-picker.tsx`
- Empty state: `src/components/availability-empty-state.tsx`
- Time zone helpers: `src/shared/lib/time-zone.ts`
- Motion for React imports:
  - Client components: `import { AnimatePresence, motion, useReducedMotion } from "motion/react";`
  - (RSC only) `import * as motion from "motion/react-client";` (not expected for this page)

## Deliverables

- `src/app/(public)/venues/[venueSlug]/courts/[courtId]/court-detail-client.tsx`
- `src/features/discovery/components/court/court-availability-panel.tsx`
- `src/features/discovery/helpers/public-schedule.ts`

## Workstreams

### Shared / Contract

- [ ] Confirm booking CTA parameters:
  - `startTime`, `duration`, `sportId`, `mode=court`, `courtId`
  - Matches `src/app/(auth)/places/[placeId]/book/page.tsx` query parsing.
- [ ] Confirm analytics events to track (optional):
  - Reuse schedule events like `funnel.schedule_slot_selected`, `funnel.reserve_clicked`.

### Server / Backend

- [ ] N/A (availability queries already exist).

### Client / Frontend

#### A) Court Detail Client Shell

- [ ] Build `src/app/(public)/venues/[venueSlug]/courts/[courtId]/court-detail-client.tsx`:
  - Receives props from the server route (place + court summary).
  - Renders:
    - Back link → `appRoutes.places.detail(placeSlugOrId)`
    - Court title (label)
    - Badges: sport, tier (if any)
    - Venue name + city/province
    - Optional secondary action: “Open venue details” (new tab)
  - Bookability gating:
    - Compute `showBooking` via `getPlaceVerificationDisplay` from `src/features/discovery/helpers.ts`.
    - If not bookable, show the same copy style as schedule/booking pages and link back to venue.
  - When bookable, render `CourtAvailabilityPanel`.

#### B) Court Availability Panel (Month/Day)

- [ ] Implement `src/features/discovery/components/court/court-availability-panel.tsx`:
  - Input props:
    - `placeSlugOrId`, `placeTimeZone`, `courtId`, `sportId` (for booking param), optional `contactDetail` for empty state.
  - URL state (`nuqs`):
    - `view` (default `month`)
    - `month`
    - `date` (dayKey)
    - `duration` (minutes, default 60)
    - `startTime`
  - Defaulting/clamping (copy schedule page logic):
    - `today = getZonedToday(placeTimeZone)`
    - `maxDate = addDays(today, MAX_BOOKING_WINDOW_DAYS)`
    - Ensure `date` is present and not in the past (in venue TZ).
    - Clamp `month` between current month and max booking window month.
    - When `date/month/duration/view` changes → clear `startTime`.
  - Data fetching:
    - Day view: `trpc.availability.getForCourt` with `date = getZonedStartOfDayIso(selectedDate, placeTimeZone)`.
    - Month view: `trpc.availability.getForCourtRange` using clamped `startDate/endDate` (ISO via `toUtcISOString`).
    - Always `includeUnavailable: true`.
  - Rendering:
    - Controls:
      - View toggle: Month/Day
      - Duration control: reuse the schedule page (input group + +/- buttons)
      - Date picker: only in Day view
    - Month view:
      - Map options → `TimeSlot` grouped by dayKey and render `AvailabilityMonthView`.
      - Selecting a slot sets `date` (dayKey) + `month` + `startTime`.
    - Day view:
      - Map options → `TimeSlot[]` and render `TimeSlotPicker`.
    - Empty/diagnostics:
      - Use `AvailabilityEmptyState`.
      - For booking window errors, reuse the same destructive alert UX as `src/app/(public)/courts/[id]/schedule/page.tsx`.

#### C) Booking CTA + Guest Redirect

- [ ] Reuse existing patterns:
  - Read session via `useSession()`.
  - When CTA clicked:
    - If authenticated: `router.push(appRoutes.places.book(placeSlugOrId) + "?" + params)`
    - If not: `router.push(appRoutes.login.from(returnTo))`
      - `returnTo` is the current court page (path + query) so selection is preserved.

#### D) Motion Transitions (subtle, accessible)

- [ ] Add Motion animations in the availability panel for view switching:

```tsx
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const shouldReduceMotion = useReducedMotion();
const transition = shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" };

<AnimatePresence mode="wait" initial={false}>
  {view === "month" ? (
    <motion.div
      key="month"
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={transition}
    >
      {/* Month UI */}
    </motion.div>
  ) : (
    <motion.div
      key="day"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
      transition={transition}
    >
      {/* Day UI */}
    </motion.div>
  )}
</AnimatePresence>
```

Notes:

- Prefer small opacity/translate animations; avoid animating large scroll containers.
- Respect reduced motion (`useReducedMotion`) by removing transform-based motion.

## Acceptance Criteria

- Month/day toggles work and do not navigate away from the page.
- Availability queries use place time zone to compute day boundaries.
- Booking CTA flows into existing booking page and login redirect returns to the same selection.
- Motion animations work without layout jank and respect reduced motion.
