# Phase 1: Server Enforcement

**Dependencies:** None

---

## Objective

Enforce a global max booking window of 60 days at the API boundary (DTO validation) and at booking creation (domain guard).

---

## Module 1A: Shared constant

Add a single shared constant:

- `src/shared/lib/booking-window.ts`
  - `export const MAX_BOOKING_WINDOW_DAYS = 60;`

Use this constant in both server DTOs and client date pickers.

---

## Module 1B: Availability DTO caps

**File:** `src/modules/availability/dtos/availability.dto.ts`

Changes:

1. Update range constraint from 45 -> 60 days.
2. Add “lead time” cap so callers cannot query beyond `now + 60 days`.

Notes:

- Day endpoints (`getForCourt`, `getForCourts`, `getForPlaceSport`) should reject `date > now + 60 days`.
- Range endpoints should reject `endDate > now + 60 days` and keep the existing `endDate >= startDate` + range length checks.

---

## Module 1C: Time slot DTO caps

**Files:**

- `src/modules/time-slot/dtos/get-available-slots.dto.ts` (public)
- `src/modules/time-slot/dtos/get-slots-for-court.dto.ts` (owner)

Changes:

- Add a 60-day range length cap for both.
- For the public `getAvailable` DTO, also cap `endDate <= now + 60 days`.
- For the owner `getForCourt` DTO, cap only range length (owners may need past lookbacks).

---

## Module 1D: Reservation booking lead time

**Files:**

- `src/modules/reservation/dtos/create-reservation.dto.ts`
- `src/modules/reservation/services/reservation.service.ts`
- `src/modules/reservation/errors/reservation.errors.ts`

Changes:

1. In DTO schemas (`CreateReservationForCourtSchema`, `CreateReservationForAnyCourtSchema`): add a refine that `startTime <= now + 60 days`.
2. For the legacy `CreateReservationSchema` (by `timeSlotId`): add a server-side guard after loading the slot (`slot.startTime <= now + 60 days`) to prevent bypass.
3. Add a new domain error (extends `ValidationError`) so it maps cleanly to tRPC `BAD_REQUEST` via the existing `AppError` mapping:
   - `BookingWindowExceededError` (details: `{ startTime, maxStartTime }`).

---

## Testing Checklist

- [ ] Availability day endpoint rejects a date > 60 days ahead.
- [ ] Availability range endpoint rejects `endDate > now + 60 days`.
- [ ] `timeSlot.getAvailable` rejects `endDate > now + 60 days`.
- [ ] Reservation creation rejects a booking > 60 days ahead (court + any-court + slotId flows).
