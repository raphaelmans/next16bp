# Spec: booking-selection-persistence

## Purpose

Cache pre-auth booking selection in localStorage so context is restored after login even if
the redirect URL params are lost (e.g., OAuth provider strip).

## Actors

- **PlaceBookingPage** (booking confirmation page)

## Storage

- Key: `kudos:pending-booking`
- Schema: `{ courtId: string, slotId: string, startTime: string, expires: number }`
- TTL: 30 minutes from write time

## Behaviour

### BSP-01 Restore from localStorage when nuqs startTime is absent

GIVEN the user lands on the booking page
AND nuqs `startTime` param is absent or null
AND `kudos:pending-booking` has a non-expired entry matching `courtId`
WHEN `usePendingBooking(courtId)` runs
THEN `setBookingParams({ startTime })` MUST be called with the stored startTime

### BSP-02 Expired entry is ignored

GIVEN `kudos:pending-booking` exists but `expires < Date.now()`
WHEN `usePendingBooking` reads it
THEN it MUST return null and NOT seed nuqs params

### BSP-03 Cleared after booking creation

GIVEN a reservation is created successfully
WHEN the confirmation redirect fires
THEN `clearPendingBooking()` MUST be called before navigation

### BSP-04 Cleared on mismatch

GIVEN `kudos:pending-booking` has a `courtId` that does NOT match the current page courtId
WHEN `usePendingBooking(courtId)` runs
THEN it MUST return null (entry is for a different court)

### BSP-05 No localStorage access on server

GIVEN the component renders on the server
WHEN `initialData` factory runs
THEN `localStorage` access MUST be guarded by `typeof window !== "undefined"`
