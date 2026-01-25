# 5) Managing Court Availability

## What the owner experiences

```text
/owner/venues/:placeId/courts/:courtId/availability
   |
   | Month calendar + per-day time list (60-minute start grid)
   | Duration selector (1..24 hours)
   |
   | “Edit schedule”  -> /schedule
   | “View bookings”  -> /owner/reservations?placeId=...&courtId=...
   |
   | Manage exceptions:
   | - Add maintenance block
   | - Add walk-in booking (price snapshot)
   | - Remove blocks
```

## Routes (UI)

- Canonical page:
  - `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx`
- Aliases/redirects:
  - `src/app/(owner)/owner/venues/[placeId]/courts/[courtId]/availability/page.tsx` (re-export)
  - `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/slots/page.tsx` -> availability
  - `src/app/(owner)/owner/courts/[id]/slots/page.tsx` -> availability

Shared UI component:
- `src/shared/components/kudos/availability-month-view.tsx`

## Key constraints surfaced in UX

- Booking window is capped to 60 days: `src/shared/lib/booking-window.ts` (`MAX_BOOKING_WINDOW_DAYS = 60`).
- Availability is hour-grid based (start times step by 60 minutes).
- Walk-in bookings must be in 60-minute increments.

## Availability computation (backend)

Availability is computed on-demand from:
- schedule rules (hours + pricing)
- reservations
- court blocks
- (optional) price overrides

Core logic:
- `src/modules/availability/services/availability.service.ts`
- Pricing helper: `src/shared/lib/schedule-availability.ts` (`computeSchedulePrice`)

High-level algorithm (per court, per day):

```text
for each day in [rangeStart..rangeEnd] in place.timeZone:
  startMinutes = all hour start minutes inside court_hours_window for that weekday
  for each startMinute:
    startTime = dayStart + startMinute
    price = computeSchedulePrice(startTime, durationMinutes)
    if price missing => skip
    if overlaps reservation => BOOKED (reason=RESERVATION)
    else if overlaps active court_block => BOOKED (reason=WALK_IN/MAINTENANCE)
    else AVAILABLE
```

Important gating behavior:
- Availability returns empty unless venue is bookable:
  - place is active + reservable
  - place verification status is `VERIFIED`
  - `reservationsEnabled=true`

## APIs (tRPC)

Availability:
- `availability.getForCourtRange` (used by owner availability page)

Blocks (exceptions):
- `courtBlock.listForCourtRange`
- `courtBlock.createMaintenance`
- `courtBlock.createWalkIn` (computes schedule-derived price snapshot)
- `courtBlock.cancel`

Routers:
- `src/modules/availability/availability.router.ts`
- `src/modules/court-block/court-block.router.ts`

## Data model (DB)

Schedule:
- `court_hours_window`
- `court_rate_rule`

Blocking exceptions:
- `court_block` (duration multiple of 60 minutes; end > start; soft-cancel via `isActive=false`)

Pricing exceptions:
- `court_price_override`
