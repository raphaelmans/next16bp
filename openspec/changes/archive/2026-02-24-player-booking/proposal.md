## Why

When a guest selects a court slot and clicks "Reserve", the auth redirect discards the slot
selection: only the court overview URL is passed to login, not the full booking URL. After
login the user must re-select — high friction. A second break occurs when the profile is
incomplete: the user is navigated away to a separate profile page, abandoning the booking flow.

## What Changes

- Fix `BookingCard` redirect: pass `/courts/{id}/book/{slotId}` (full booking URL) through login
- Save pre-auth booking context to localStorage before redirect (30-min TTL backup)
- Replace navigate-away profile edit with an inline profile-setup modal on PlaceBookingPage
- Add a non-blocking banner ("Complete your profile to finish booking") when profile is incomplete
- Overlay the Order Summary confirm section until profile is complete; dismiss after modal submit
- Revalidate profile query after modal success and restore the page to its default interactive state

## Capabilities

### New Capabilities
- `guest-booking-redirect`: Carry the full booking URL (court + slot + timing) through the login
  redirect so the user lands directly on the booking confirmation page after auth
- `booking-selection-persistence`: Lightweight localStorage cache of pre-auth booking selection
  (courtId, slotId, startTime) using TanStack Query `initialData`; restored on
  booking page if URL params are insufficient; cleared after booking created or TTL expiry
- `inline-profile-setup-modal`: Inline profile-completion Dialog on PlaceBookingPage; submits
  profile, invalidates query, and dismisses without navigating away from booking context

### Modified Capabilities
- `reservation`: Booking confirmation gate changes — profile incompleteness no longer redirects
  away; instead it triggers the inline modal; ProfilePreviewCard updated to emit modal trigger

## Impact

- `src/features/discovery/components/booking-card.tsx` — fix redirect URL + localStorage write
- `src/features/reservation/pages/place-booking-page.tsx` — add modal state, banner, overlay
- `src/features/reservation/components/profile-preview-card.tsx` — add modal-trigger variant
- NEW `src/features/reservation/components/profile-setup-modal.tsx` — inline Dialog
- NEW `src/features/reservation/hooks/use-pending-booking.ts` — localStorage TQ hook
- `src/common/redirects.ts` — verified booking URL passes safe-redirect guard (no change needed)
