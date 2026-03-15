# Phase 2: Booking Window Error Messaging

**Dependencies:** Phase 1 recommended

---

## Objective

Make booking-window rejections obvious and actionable (instead of looking like “no availability” or a generic error).

---

## Module 2A: Schedule inline callout

**File:** `src/app/(public)/courts/[id]/schedule/page.tsx`

Add an inline `<Alert>` (or existing callout pattern) when the active availability query is in an error state.

Behavior:

- If error message/code indicates booking window rejection:
  - show: "Bookings are available up to 60 days in advance."
  - CTA: "Jump to the latest available date" (sets `dayKeyParam` to maxDayKey)
- Otherwise:
  - show a generic fetch error message and a "Retry" button.

Detection options:

- If tRPC error includes `error.data.code === "BOOKING_WINDOW_EXCEEDED"` use that.
- For Zod validation failures on availability queries, fall back to matching `error.message` prefix.

---

## Module 2B: Friendly toast error mapping

**File:** `src/shared/lib/toast-errors.ts`

Extend `getClientErrorMessage(...)` to map:

- `BOOKING_WINDOW_EXCEEDED` -> "This time is beyond the 60-day booking window. Choose an earlier date."

This improves:

- booking mutation errors in `src/features/reservation/hooks/use-create-reservation.ts`
- booking mutation errors in `src/features/reservation/hooks/use-create-reservation-for-court.ts`
- any other place we surface `error.message` directly

---

## Testing Checklist

- [ ] Deep link beyond max shows helpful callout (or clamps to max and no error).
- [ ] Booking mutation beyond max shows friendly toast.
