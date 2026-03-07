## Why

Player booking is currently blocked unless a venue is both `VERIFIED` and has reservations enabled. That prevents owners from accepting bookings while verification is still pending or incomplete, even when they are otherwise ready to operate and want booking to stay open with a warning.

## What Changes

- Allow player booking for reservable venues in `UNVERIFIED`, `PENDING`, `REJECTED`, and `VERIFIED` states when reservations are enabled.
- Replace player-side hard booking blocks for non-verified venues with warning banners shown on booking surfaces.
- Allow owners to enable reservations for non-verified venues while keeping the active payment-method requirement unchanged.
- Preserve reservation availability on admin rejection instead of automatically forcing reservations off.
- Treat missing place-verification rows as unverified for reservation enablement, creating or updating the verification record when the owner toggles reservations.

## Capabilities

### New Capabilities
- `player-booking-unverified-venues`: Defines player booking eligibility and warning-banner behavior for non-verified venues across booking entry surfaces.
- `owner-unverified-reservation-enablement`: Defines owner and admin reservation enablement rules for non-verified venues, including missing verification rows and rejection handling.

### Modified Capabilities
None.

## Impact

- Affected backend services: reservation creation, place verification toggle, and admin verification review flows.
- Affected player-facing UI: public place detail booking sections, direct court booking flows, and direct booking or checkout pages.
- Affected shared logic: reservation enablement rules, verification display messaging, and tests covering booking eligibility and rejection behavior.
- Public behavior change: player booking no longer requires venue verification status to be `VERIFIED`; reservation availability is now controlled by `placeType`, owner reservation toggle, and payment-method readiness.
