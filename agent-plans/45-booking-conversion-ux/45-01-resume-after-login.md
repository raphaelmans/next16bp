# Phase 1: Resume After Login

**Dependencies:** Plan 40 schedule view exists (`agent-plans/40-public-schedule-view/`)  
**Parallelizable:** Partial  
**User Stories:** `agent-plans/user-stories/06-court-reservation/`

---

## Objective

Ensure a guest user can select date/time on the public detail page, hit reserve, sign in, and return to a schedule URL that preserves selection state (Booking.com-style resume).

---

## Modules

### Module 1A: Place detail guest reserve redirects to schedule URL

#### Problem

`src/app/(public)/places/[placeId]/page.tsx` builds a rich `scheduleHref` (includes `date`, `duration`, `sportId`, `mode`, `courtId`, `startTime`) but the unauthenticated reserve path currently redirects to login with `redirect` set to the place detail route. Since the detail page uses local React state, the selection is lost after login.

#### Approach

- When unauthenticated and the user clicks reserve:
  - Redirect to login with `redirect=<scheduleHref>` (fallback to schedule base if missing).
  - Do not redirect to detail.

#### Implementation Notes

- Prefer `appRoutes.login.from(returnTo)` to build URLs.
- Ensure `scheduleHref` is only used when `isBookable` is true.
- Keep the existing flow for authenticated users unchanged.

#### Acceptance Criteria

- [ ] As a guest, select date + slot on place detail.
- [ ] Click "Reserve now".
- [ ] You land on `/login?redirect=/places/<placeId>/schedule?...`.
- [ ] After login you land on schedule with same date and slot pre-selected.
- [ ] Clicking reserve from schedule navigates to `/places/<placeId>/book?...` and the selected slot matches.

---

### Module 1A.2: Court BookingCard guest reserve redirects to booking URL (optional)

`src/features/discovery/components/booking-card.tsx` is only used for a standalone booking card variant and is not wired into the primary place flow. If it becomes user-facing again, align it with `appRoutes.login.from(appRoutes.courts.book(courtId, slotId))` or with schedule resume.

---

## Testing Checklist

- [ ] Guest resume works for `mode=any`.
- [ ] Guest resume works for `mode=court`.
- [ ] Guest resume works with and without `startTime`.
- [ ] Deep link schedule URL loads directly and selection initializes.
