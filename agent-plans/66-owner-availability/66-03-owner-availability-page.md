# Phase 3: Owner Court Availability Page

**Dependencies:** Phase 2 complete
**Parallelizable:** Partial

## Objective

Provide an owner-facing Availability page (month-first) that visualizes schedule-derived availability for a single court.

## Routes

- Canonical:
  - `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx`
- Alias:
  - `src/app/(owner)/owner/venues/[placeId]/courts/[courtId]/availability/page.tsx` (re-export)
- Convenience redirect:
  - `src/app/(owner)/owner/courts/[id]/availability/page.tsx` (resolve placeId then redirect)

## Data

- Use venue time zone from `placeManagement.getById`.
- Cap range to `MAX_BOOKING_WINDOW_DAYS`.
- Query month range via `trpc.availability.getForCourtRange`.

## UI

- Use owner `AppShell` (`OwnerSidebar`, `OwnerNavbar`, `ReservationAlertsPanel`).
- Page header:
  - Title: `Availability · <court label>`
  - Description: "Schedule-derived availability (based on hours, pricing, blocks, and reservations)."
  - Primary CTA: "Edit schedule & pricing" → schedule page.
- Controls:
  - Duration (hours) with +/- + numeric input (reuse the public pattern).
- Body:
  - `AvailabilityMonthView` component.

## Testing Checklist

- [ ] Owner availability page loads and shows day sections + slot pickers.
- [ ] Selecting a date scrolls to that day.
- [ ] Duration changes refresh availability and clears selection.
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass.
