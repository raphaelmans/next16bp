# Spec: guest-booking-redirect

## Purpose

Preserve full booking context (court + slot) through the guest-to-authenticated redirect.

## Actors

- **Guest** (unauthenticated user)

## Preconditions

- Guest is on a court/venue public page
- Guest has selected a date and time slot
- Guest is not authenticated (`sessionUser` is null)

## Behaviour

### GBR-01 Full booking URL in redirect param

GIVEN a guest has selected a time slot on `BookingCard`
WHEN the guest clicks "Sign in to reserve"
THEN the redirect target MUST be `/courts/{courtId}/book/{slotId}`
AND the login URL MUST be `/login?redirect=%2Fcourts%2F{courtId}%2Fbook%2F{slotId}`
AND the redirect MUST be URL-encoded (single encode, no double-encode)

### GBR-02 Redirect survives auth callback

GIVEN the redirect param is `/courts/{id}/book/{slotId}`
WHEN `getSafeRedirectPath()` processes it with `disallowRoutes: ["guest"]`
THEN it MUST NOT be blocked (route type is "booking", not "guest")
AND the auth callback MUST redirect to `/courts/{id}/book/{slotId}` after login

### GBR-03 localStorage backup written before redirect

GIVEN a guest clicks "Sign in to reserve"
WHEN the redirect is initiated
THEN localStorage key `kudos:pending-booking` MUST be written
AND it MUST contain `{ courtId, slotId, startTime, expires }`
AND `expires` MUST be `Date.now() + 30 * 60 * 1000` (30-minute TTL)

### GBR-04 Unauthenticated without slot — no change

GIVEN a guest has NOT selected a time slot
WHEN the "Select a time slot" button is shown
THEN no redirect or localStorage write occurs (button is disabled)
